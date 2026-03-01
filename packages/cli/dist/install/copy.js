"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFlattenedCommands = copyFlattenedCommands;
exports.listCodexSkillNames = listCodexSkillNames;
exports.copyCommandsAsCodexSkills = copyCommandsAsCodexSkills;
exports.copyWithPathReplacement = copyWithPathReplacement;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const index_js_1 = require("../adapters/index.js");
const shared_js_1 = require("./shared.js");
const adapters_js_1 = require("./adapters.js");
/**
 * Copy commands to a flat structure for OpenCode
 * OpenCode expects: command/maxsim-help.md (invoked as /maxsim-help)
 * Source structure: commands/maxsim/help.md
 */
function copyFlattenedCommands(srcDir, destDir, prefix, pathPrefix, runtime, explicitConfigDir) {
    if (!fs.existsSync(srcDir)) {
        return;
    }
    if (fs.existsSync(destDir)) {
        for (const file of fs.readdirSync(destDir)) {
            if (file.startsWith(`${prefix}-`) && file.endsWith('.md')) {
                fs.unlinkSync(path.join(destDir, file));
            }
        }
    }
    else {
        fs.mkdirSync(destDir, { recursive: true });
    }
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        if (entry.isDirectory()) {
            copyFlattenedCommands(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix, runtime, explicitConfigDir);
        }
        else if (entry.name.endsWith('.md')) {
            const baseName = entry.name.replace('.md', '');
            const destName = `${prefix}-${baseName}.md`;
            const destPath = path.join(destDir, destName);
            let content = fs.readFileSync(srcPath, 'utf8');
            const globalClaudeRegex = /~\/\.claude\//g;
            const localClaudeRegex = /\.\/\.claude\//g;
            const opencodeDirRegex = /~\/\.opencode\//g;
            content = content.replace(globalClaudeRegex, pathPrefix);
            content = content.replace(localClaudeRegex, `./${(0, shared_js_1.getDirName)(runtime)}/`);
            content = content.replace(opencodeDirRegex, pathPrefix);
            content = (0, index_js_1.processAttribution)(content, (0, adapters_js_1.getCommitAttribution)(runtime, explicitConfigDir));
            content = (0, index_js_1.convertClaudeToOpencodeFrontmatter)(content);
            fs.writeFileSync(destPath, content);
        }
    }
}
function listCodexSkillNames(skillsDir, prefix = 'maxsim-') {
    if (!fs.existsSync(skillsDir))
        return [];
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
        .filter((entry) => fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
        .map((entry) => entry.name)
        .sort();
}
function copyCommandsAsCodexSkills(srcDir, skillsDir, prefix, pathPrefix, runtime, explicitConfigDir) {
    if (!fs.existsSync(srcDir)) {
        return;
    }
    fs.mkdirSync(skillsDir, { recursive: true });
    const existing = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of existing) {
        if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
            fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
        }
    }
    function recurse(currentSrcDir, currentPrefix) {
        const entries = fs.readdirSync(currentSrcDir, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(currentSrcDir, entry.name);
            if (entry.isDirectory()) {
                recurse(srcPath, `${currentPrefix}-${entry.name}`);
                continue;
            }
            if (!entry.name.endsWith('.md')) {
                continue;
            }
            const baseName = entry.name.replace('.md', '');
            const skillName = `${currentPrefix}-${baseName}`;
            const skillDir = path.join(skillsDir, skillName);
            fs.mkdirSync(skillDir, { recursive: true });
            let content = fs.readFileSync(srcPath, 'utf8');
            const globalClaudeRegex = /~\/\.claude\//g;
            const localClaudeRegex = /\.\/\.claude\//g;
            const codexDirRegex = /~\/\.codex\//g;
            content = content.replace(globalClaudeRegex, pathPrefix);
            content = content.replace(localClaudeRegex, `./${(0, shared_js_1.getDirName)(runtime)}/`);
            content = content.replace(codexDirRegex, pathPrefix);
            content = (0, index_js_1.processAttribution)(content, (0, adapters_js_1.getCommitAttribution)(runtime, explicitConfigDir));
            content = (0, index_js_1.convertClaudeCommandToCodexSkill)(content, skillName);
            fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
        }
    }
    recurse(srcDir, prefix);
}
/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime, explicitConfigDir, isCommand = false) {
    const isOpencode = runtime === 'opencode';
    const isCodex = runtime === 'codex';
    const dirName = (0, shared_js_1.getDirName)(runtime);
    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true });
    }
    fs.mkdirSync(destDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyWithPathReplacement(srcPath, destPath, pathPrefix, runtime, explicitConfigDir, isCommand);
        }
        else if (entry.name.endsWith('.md')) {
            let content = fs.readFileSync(srcPath, 'utf8');
            const globalClaudeRegex = /~\/\.claude\//g;
            const localClaudeRegex = /\.\/\.claude\//g;
            content = content.replace(globalClaudeRegex, pathPrefix);
            content = content.replace(localClaudeRegex, `./${dirName}/`);
            content = (0, index_js_1.processAttribution)(content, (0, adapters_js_1.getCommitAttribution)(runtime, explicitConfigDir));
            if (isOpencode) {
                content = (0, index_js_1.convertClaudeToOpencodeFrontmatter)(content);
                fs.writeFileSync(destPath, content);
            }
            else if (runtime === 'gemini') {
                if (isCommand) {
                    content = (0, index_js_1.stripSubTags)(content);
                    const tomlContent = (0, index_js_1.convertClaudeToGeminiToml)(content);
                    const tomlPath = destPath.replace(/\.md$/, '.toml');
                    fs.writeFileSync(tomlPath, tomlContent);
                }
                else {
                    fs.writeFileSync(destPath, content);
                }
            }
            else if (isCodex) {
                content = (0, index_js_1.convertClaudeToCodexMarkdown)(content);
                fs.writeFileSync(destPath, content);
            }
            else {
                fs.writeFileSync(destPath, content);
            }
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
//# sourceMappingURL=copy.js.map