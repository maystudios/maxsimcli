"use strict";
/**
 * Skills — List, install, and update CLI skills
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdSkillList = cmdSkillList;
exports.cmdSkillInstall = cmdSkillInstall;
exports.cmdSkillUpdate = cmdSkillUpdate;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const core_js_1 = require("./core.js");
const frontmatter_js_1 = require("./frontmatter.js");
// ─── Constants ───────────────────────────────────────────────────────────────
/** Skills installed by MAXSIM (not user-created). */
const BUILT_IN_SKILLS = [
    'tdd',
    'systematic-debugging',
    'verification-before-completion',
    'code-review',
    'simplify',
    'memory-management',
    'using-maxsim',
    'batch-execution',
    'subagent-driven-development',
    'writing-plans',
];
/** Installed skills directory under the Claude config. */
function skillsDir() {
    return node_path_1.default.join(node_os_1.default.homedir(), '.claude', 'agents', 'skills');
}
/** Bundled skills directory inside the npm package. */
function bundledSkillsDir() {
    return node_path_1.default.resolve(__dirname, 'assets', 'templates', 'skills');
}
function cmdSkillList(_cwd, raw) {
    const dir = skillsDir();
    if (!node_fs_1.default.existsSync(dir)) {
        (0, core_js_1.output)({ count: 0, skills: [] }, raw, '0 skills installed');
        return;
    }
    const skills = [];
    try {
        const entries = node_fs_1.default.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const skillMd = node_path_1.default.join(dir, entry.name, 'SKILL.md');
            if (!node_fs_1.default.existsSync(skillMd))
                continue;
            try {
                const content = node_fs_1.default.readFileSync(skillMd, 'utf-8');
                const fm = (0, frontmatter_js_1.extractFrontmatter)(content);
                skills.push({
                    name: fm.name || entry.name,
                    description: fm.description || '',
                    path: node_path_1.default.join(dir, entry.name),
                    builtIn: BUILT_IN_SKILLS.includes(entry.name),
                });
            }
            catch {
                // Skill exists but SKILL.md is malformed — still list it
                skills.push({
                    name: entry.name,
                    description: '',
                    path: node_path_1.default.join(dir, entry.name),
                    builtIn: BUILT_IN_SKILLS.includes(entry.name),
                });
            }
        }
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        (0, core_js_1.error)('Failed to list skills: ' + e.message);
    }
    skills.sort((a, b) => a.name.localeCompare(b.name));
    const summary = skills.map(s => `${s.name}: ${s.description}`).join('\n');
    (0, core_js_1.output)({ count: skills.length, skills }, raw, `${skills.length} skills installed\n${summary}`);
}
// ─── skill install ───────────────────────────────────────────────────────────
function cmdSkillInstall(_cwd, skillName, raw) {
    if (!skillName) {
        (0, core_js_1.error)('skill name required for skill install');
    }
    const bundled = bundledSkillsDir();
    const srcDir = node_path_1.default.join(bundled, skillName);
    const srcFile = node_path_1.default.join(srcDir, 'SKILL.md');
    if (!node_fs_1.default.existsSync(srcFile)) {
        const available = listBundledSkillNames(bundled);
        (0, core_js_1.error)(`Skill '${skillName}' not found in bundle. Available: ${available.join(', ') || 'none'}`);
    }
    const destDir = node_path_1.default.join(skillsDir(), skillName);
    installSkillFromBundle(srcDir, destDir);
    (0, core_js_1.output)({ installed: true, skill: skillName, path: destDir }, raw, `Installed skill '${skillName}' to ${destDir}`);
}
// ─── skill update ────────────────────────────────────────────────────────────
function cmdSkillUpdate(_cwd, raw) {
    const bundled = bundledSkillsDir();
    if (!node_fs_1.default.existsSync(bundled)) {
        (0, core_js_1.error)('Bundled skills directory not found. Is MAXSIM installed correctly?');
    }
    const dest = skillsDir();
    node_fs_1.default.mkdirSync(dest, { recursive: true });
    let updated = 0;
    const updatedNames = [];
    for (const skillName of BUILT_IN_SKILLS) {
        const srcDir = node_path_1.default.join(bundled, skillName);
        if (!node_fs_1.default.existsSync(srcDir))
            continue;
        const destSkillDir = node_path_1.default.join(dest, skillName);
        // Remove old version if present
        if (node_fs_1.default.existsSync(destSkillDir)) {
            node_fs_1.default.rmSync(destSkillDir, { recursive: true });
        }
        installSkillFromBundle(srcDir, destSkillDir);
        updated++;
        updatedNames.push(skillName);
    }
    (0, core_js_1.output)({ updated, skills: updatedNames }, raw, `Updated ${updated} built-in skills`);
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Copy a bundled skill to the destination and process path replacements. */
function installSkillFromBundle(srcDir, destDir) {
    node_fs_1.default.mkdirSync(destDir, { recursive: true });
    copyDirRecursive(srcDir, destDir);
    // Expand ~/.claude/ to absolute home path for consistency
    const destFile = node_path_1.default.join(destDir, 'SKILL.md');
    let content = node_fs_1.default.readFileSync(destFile, 'utf-8');
    const homePrefix = node_path_1.default.join(node_os_1.default.homedir(), '.claude') + '/';
    content = content.replace(/~\/\.claude\//g, homePrefix.replace(/\\/g, '/'));
    node_fs_1.default.writeFileSync(destFile, content, 'utf-8');
}
/** Recursively copy a directory. */
function copyDirRecursive(src, dest) {
    const entries = node_fs_1.default.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = node_path_1.default.join(src, entry.name);
        const destPath = node_path_1.default.join(dest, entry.name);
        if (entry.isDirectory()) {
            node_fs_1.default.mkdirSync(destPath, { recursive: true });
            copyDirRecursive(srcPath, destPath);
        }
        else {
            node_fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
/** List skill names available in a bundled skills directory. */
function listBundledSkillNames(bundledDir) {
    try {
        return node_fs_1.default.readdirSync(bundledDir, { withFileTypes: true })
            .filter(e => e.isDirectory() && node_fs_1.default.existsSync(node_path_1.default.join(bundledDir, e.name, 'SKILL.md')))
            .map(e => e.name);
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=skills.js.map