"use strict";
/**
 * Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
 *
 * Uses the `yaml` npm package instead of a hand-rolled parser.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTMATTER_SCHEMAS = void 0;
exports.extractFrontmatter = extractFrontmatter;
exports.reconstructFrontmatter = reconstructFrontmatter;
exports.spliceFrontmatter = spliceFrontmatter;
exports.parseMustHavesBlock = parseMustHavesBlock;
exports.cmdFrontmatterGet = cmdFrontmatterGet;
exports.cmdFrontmatterSet = cmdFrontmatterSet;
exports.cmdFrontmatterMerge = cmdFrontmatterMerge;
exports.cmdFrontmatterValidate = cmdFrontmatterValidate;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const yaml_1 = __importDefault(require("yaml"));
const core_js_1 = require("./core.js");
// ─── Parsing engine ───────────────────────────────────────────────────────────
/**
 * Extract YAML frontmatter from markdown content into a typed object.
 */
function extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    if (!match)
        return {};
    try {
        const parsed = yaml_1.default.parse(match[1]);
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
            ? parsed
            : {};
    }
    catch {
        return {};
    }
}
/**
 * Reconstruct YAML frontmatter string from an object.
 */
function reconstructFrontmatter(obj) {
    // Filter out null/undefined values
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
            cleaned[key] = value;
        }
    }
    return yaml_1.default.stringify(cleaned, {
        lineWidth: 0, // Don't wrap long lines
        defaultKeyType: 'PLAIN',
        defaultStringType: 'PLAIN',
    }).trimEnd();
}
/**
 * Replace or insert frontmatter in markdown content.
 */
function spliceFrontmatter(content, newObj) {
    const yamlStr = reconstructFrontmatter(newObj);
    const match = content.match(/^---\n[\s\S]+?\n---/);
    if (match) {
        return `---\n${yamlStr}\n---` + content.slice(match[0].length);
    }
    return `---\n${yamlStr}\n---\n\n` + content;
}
/**
 * Parse a specific block from must_haves in frontmatter.
 * With the yaml package, this is just object traversal.
 */
function parseMustHavesBlock(content, blockName) {
    const fm = extractFrontmatter(content);
    const mustHaves = fm.must_haves;
    if (!mustHaves || typeof mustHaves !== 'object')
        return [];
    const block = mustHaves[blockName];
    if (!Array.isArray(block))
        return [];
    return block;
}
// ─── Frontmatter schema validation ──────────────────────────────────────────
exports.FRONTMATTER_SCHEMAS = {
    plan: {
        required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'],
    },
    summary: {
        required: ['phase', 'plan', 'subsystem', 'tags', 'duration', 'completed'],
    },
    verification: {
        required: ['phase', 'verified', 'status', 'score'],
    },
};
// ─── Frontmatter CRUD commands ──────────────────────────────────────────────
function cmdFrontmatterGet(cwd, filePath, field, raw) {
    if (!filePath) {
        (0, core_js_1.error)('file path required');
    }
    const fullPath = node_path_1.default.isAbsolute(filePath) ? filePath : node_path_1.default.join(cwd, filePath);
    const content = (0, core_js_1.safeReadFile)(fullPath);
    if (!content) {
        (0, core_js_1.output)({ error: 'File not found', path: filePath }, raw);
        return;
    }
    const fm = extractFrontmatter(content);
    if (field) {
        const value = fm[field];
        if (value === undefined) {
            (0, core_js_1.output)({ error: 'Field not found', field }, raw);
            return;
        }
        (0, core_js_1.output)({ [field]: value }, raw, JSON.stringify(value));
    }
    else {
        (0, core_js_1.output)(fm, raw);
    }
}
function cmdFrontmatterSet(cwd, filePath, field, value, raw) {
    if (!filePath || !field || value === undefined) {
        (0, core_js_1.error)('file, field, and value required');
    }
    const fullPath = node_path_1.default.isAbsolute(filePath) ? filePath : node_path_1.default.join(cwd, filePath);
    if (!node_fs_1.default.existsSync(fullPath)) {
        (0, core_js_1.output)({ error: 'File not found', path: filePath }, raw);
        return;
    }
    const content = node_fs_1.default.readFileSync(fullPath, 'utf-8');
    const fm = extractFrontmatter(content);
    let parsedValue;
    try {
        parsedValue = JSON.parse(value);
    }
    catch {
        parsedValue = value;
    }
    fm[field] = parsedValue;
    const newContent = spliceFrontmatter(content, fm);
    node_fs_1.default.writeFileSync(fullPath, newContent, 'utf-8');
    (0, core_js_1.output)({ updated: true, field, value: parsedValue }, raw, 'true');
}
function cmdFrontmatterMerge(cwd, filePath, data, raw) {
    if (!filePath || !data) {
        (0, core_js_1.error)('file and data required');
    }
    const fullPath = node_path_1.default.isAbsolute(filePath) ? filePath : node_path_1.default.join(cwd, filePath);
    if (!node_fs_1.default.existsSync(fullPath)) {
        (0, core_js_1.output)({ error: 'File not found', path: filePath }, raw);
        return;
    }
    const content = node_fs_1.default.readFileSync(fullPath, 'utf-8');
    const fm = extractFrontmatter(content);
    let mergeData;
    try {
        mergeData = JSON.parse(data);
    }
    catch {
        (0, core_js_1.error)('Invalid JSON for --data');
        return;
    }
    Object.assign(fm, mergeData);
    const newContent = spliceFrontmatter(content, fm);
    node_fs_1.default.writeFileSync(fullPath, newContent, 'utf-8');
    (0, core_js_1.output)({ merged: true, fields: Object.keys(mergeData) }, raw, 'true');
}
function cmdFrontmatterValidate(cwd, filePath, schemaName, raw) {
    if (!filePath || !schemaName) {
        (0, core_js_1.error)('file and schema required');
    }
    const schema = exports.FRONTMATTER_SCHEMAS[schemaName];
    if (!schema) {
        (0, core_js_1.error)(`Unknown schema: ${schemaName}. Available: ${Object.keys(exports.FRONTMATTER_SCHEMAS).join(', ')}`);
    }
    const fullPath = node_path_1.default.isAbsolute(filePath) ? filePath : node_path_1.default.join(cwd, filePath);
    const content = (0, core_js_1.safeReadFile)(fullPath);
    if (!content) {
        (0, core_js_1.output)({ error: 'File not found', path: filePath }, raw);
        return;
    }
    const fm = extractFrontmatter(content);
    const missing = schema.required.filter(f => fm[f] === undefined);
    const present = schema.required.filter(f => fm[f] !== undefined);
    const result = {
        valid: missing.length === 0,
        missing,
        present,
        schema: schemaName,
    };
    (0, core_js_1.output)(result, raw, missing.length === 0 ? 'valid' : 'invalid');
}
//# sourceMappingURL=frontmatter.js.map