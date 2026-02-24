"use strict";
/**
 * Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
 *
 * Ported from maxsim/bin/lib/frontmatter.cjs
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
const core_js_1 = require("./core.js");
/**
 * Extract YAML frontmatter from markdown content into a typed object.
 */
function extractFrontmatter(content) {
    const frontmatter = {};
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    if (!match)
        return frontmatter;
    const yaml = match[1];
    const lines = yaml.split('\n');
    const stack = [{ obj: frontmatter, key: null, indent: -1 }];
    for (const line of lines) {
        if (line.trim() === '')
            continue;
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        // Pop stack back to appropriate level
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
            stack.pop();
        }
        const current = stack[stack.length - 1];
        // Check for key: value pattern
        const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+):\s*(.*)/);
        if (keyMatch) {
            const key = keyMatch[2];
            const value = keyMatch[3].trim();
            if (value === '' || value === '[') {
                // Key with no value or opening bracket
                const newObj = value === '[' ? [] : {};
                current.obj[key] = newObj;
                current.key = null;
                stack.push({ obj: newObj, key: null, indent });
            }
            else if (value.startsWith('[') && value.endsWith(']')) {
                // Inline array: key: [a, b, c]
                current.obj[key] = value
                    .slice(1, -1)
                    .split(',')
                    .map(s => s.trim().replace(/^["']|["']$/g, ''))
                    .filter(Boolean);
                current.key = null;
            }
            else {
                // Simple key: value
                current.obj[key] = value.replace(/^["']|["']$/g, '');
                current.key = null;
            }
        }
        else if (line.trim().startsWith('- ')) {
            // Array item
            const itemValue = line.trim().slice(2).replace(/^["']|["']$/g, '');
            if (typeof current.obj === 'object' &&
                !Array.isArray(current.obj) &&
                Object.keys(current.obj).length === 0) {
                // Convert empty object to array
                const parent = stack.length > 1 ? stack[stack.length - 2] : null;
                if (parent && !Array.isArray(parent.obj)) {
                    for (const k of Object.keys(parent.obj)) {
                        if (parent.obj[k] === current.obj) {
                            const arr = [itemValue];
                            parent.obj[k] = arr;
                            current.obj = arr;
                            break;
                        }
                    }
                }
            }
            else if (Array.isArray(current.obj)) {
                current.obj.push(itemValue);
            }
        }
    }
    return frontmatter;
}
/**
 * Reconstruct YAML frontmatter string from an object.
 */
function reconstructFrontmatter(obj) {
    const lines = [];
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined)
            continue;
        if (Array.isArray(value)) {
            formatArray(lines, key, value, 0);
        }
        else if (typeof value === 'object') {
            lines.push(`${key}:`);
            for (const [subkey, subval] of Object.entries(value)) {
                if (subval === null || subval === undefined)
                    continue;
                if (Array.isArray(subval)) {
                    formatArray(lines, subkey, subval, 2);
                }
                else if (typeof subval === 'object') {
                    lines.push(`  ${subkey}:`);
                    for (const [subsubkey, subsubval] of Object.entries(subval)) {
                        if (subsubval === null || subsubval === undefined)
                            continue;
                        if (Array.isArray(subsubval)) {
                            if (subsubval.length === 0) {
                                lines.push(`    ${subsubkey}: []`);
                            }
                            else {
                                lines.push(`    ${subsubkey}:`);
                                for (const item of subsubval) {
                                    lines.push(`      - ${item}`);
                                }
                            }
                        }
                        else {
                            lines.push(`    ${subsubkey}: ${subsubval}`);
                        }
                    }
                }
                else {
                    const sv = String(subval);
                    lines.push(`  ${subkey}: ${sv.includes(':') || sv.includes('#') ? `"${sv}"` : sv}`);
                }
            }
        }
        else {
            const sv = String(value);
            if (sv.includes(':') || sv.includes('#') || sv.startsWith('[') || sv.startsWith('{')) {
                lines.push(`${key}: "${sv}"`);
            }
            else {
                lines.push(`${key}: ${sv}`);
            }
        }
    }
    return lines.join('\n');
}
function formatArray(lines, key, value, indentLevel) {
    const prefix = ' '.repeat(indentLevel);
    if (value.length === 0) {
        lines.push(`${prefix}${key}: []`);
    }
    else if (value.every(v => typeof v === 'string') &&
        value.length <= 3 &&
        value.join(', ').length < 60) {
        lines.push(`${prefix}${key}: [${value.join(', ')}]`);
    }
    else {
        lines.push(`${prefix}${key}:`);
        for (const item of value) {
            const itemStr = String(item);
            lines.push(`${prefix}  - ${typeof item === 'string' && (itemStr.includes(':') || itemStr.includes('#')) ? `"${itemStr}"` : itemStr}`);
        }
    }
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
 * Parse a specific block from must_haves in raw frontmatter YAML.
 */
function parseMustHavesBlock(content, blockName) {
    const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
    if (!fmMatch)
        return [];
    const yaml = fmMatch[1];
    const blockPattern = new RegExp(`^\\s{4}${blockName}:\\s*$`, 'm');
    const blockStart = yaml.search(blockPattern);
    if (blockStart === -1)
        return [];
    const afterBlock = yaml.slice(blockStart);
    const blockLines = afterBlock.split('\n').slice(1);
    const items = [];
    let current = null;
    for (const line of blockLines) {
        if (line.trim() === '')
            continue;
        const indent = line.match(/^(\s*)/)[1].length;
        if (indent <= 4 && line.trim() !== '')
            break;
        if (line.match(/^\s{6}-\s+/)) {
            if (current !== null)
                items.push(current);
            current = {};
            const simpleMatch = line.match(/^\s{6}-\s+"?([^"]+)"?\s*$/);
            if (simpleMatch && !line.includes(':')) {
                current = simpleMatch[1];
            }
            else {
                const kvMatch = line.match(/^\s{6}-\s+(\w+):\s*"?([^"]*)"?\s*$/);
                if (kvMatch) {
                    current = { [kvMatch[1]]: kvMatch[2] };
                }
            }
        }
        else if (current !== null && typeof current === 'object') {
            const kvMatch = line.match(/^\s{8,}(\w+):\s*"?([^"]*)"?\s*$/);
            if (kvMatch) {
                const val = kvMatch[2];
                current[kvMatch[1]] = /^\d+$/.test(val) ? parseInt(val, 10) : val;
            }
            const arrMatch = line.match(/^\s{10,}-\s+"?([^"]+)"?\s*$/);
            if (arrMatch) {
                const keys = Object.keys(current);
                const lastKey = keys[keys.length - 1];
                if (lastKey && !Array.isArray(current[lastKey])) {
                    current[lastKey] = current[lastKey] ? [String(current[lastKey])] : [];
                }
                if (lastKey)
                    current[lastKey].push(arrMatch[1]);
            }
        }
    }
    if (current !== null)
        items.push(current);
    return items;
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