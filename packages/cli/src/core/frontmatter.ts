/**
 * Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
 *
 * Ported from maxsim/bin/lib/frontmatter.cjs
 */

import fs from 'node:fs';
import path from 'node:path';

import { safeReadFile, output, error } from './core.js';
import type {
  FrontmatterData,
  FrontmatterValue,
  FrontmatterValidationResult,
  FrontmatterSchema,
} from './types.js';

// ─── Parsing engine ───────────────────────────────────────────────────────────

interface StackFrame {
  obj: FrontmatterData | FrontmatterValue[];
  key: string | null;
  indent: number;
}

/**
 * Extract YAML frontmatter from markdown content into a typed object.
 */
export function extractFrontmatter(content: string): FrontmatterData {
  const frontmatter: FrontmatterData = {};
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return frontmatter;

  const yaml = match[1];
  const lines = yaml.split('\n');

  const stack: StackFrame[] = [{ obj: frontmatter, key: null, indent: -1 }];

  for (const line of lines) {
    if (line.trim() === '') continue;

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
        const newObj: FrontmatterData | FrontmatterValue[] = value === '[' ? [] : {};
        (current.obj as FrontmatterData)[key] = newObj;
        current.key = null;
        stack.push({ obj: newObj, key: null, indent });
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array: key: [a, b, c]
        (current.obj as FrontmatterData)[key] = value
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        current.key = null;
      } else {
        // Simple key: value
        (current.obj as FrontmatterData)[key] = value.replace(/^["']|["']$/g, '');
        current.key = null;
      }
    } else if (line.trim().startsWith('- ')) {
      // Array item
      const itemValue = line.trim().slice(2).replace(/^["']|["']$/g, '');

      if (
        typeof current.obj === 'object' &&
        !Array.isArray(current.obj) &&
        Object.keys(current.obj).length === 0
      ) {
        // Convert empty object to array
        const parent = stack.length > 1 ? stack[stack.length - 2] : null;
        if (parent && !Array.isArray(parent.obj)) {
          for (const k of Object.keys(parent.obj as FrontmatterData)) {
            if ((parent.obj as FrontmatterData)[k] === current.obj) {
              const arr = [itemValue];
              (parent.obj as FrontmatterData)[k] = arr;
              current.obj = arr;
              break;
            }
          }
        }
      } else if (Array.isArray(current.obj)) {
        current.obj.push(itemValue);
      }
    }
  }

  return frontmatter;
}

/**
 * Reconstruct YAML frontmatter string from an object.
 */
export function reconstructFrontmatter(obj: FrontmatterData): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      formatArray(lines, key, value, 0);
    } else if (typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [subkey, subval] of Object.entries(value as FrontmatterData)) {
        if (subval === null || subval === undefined) continue;
        if (Array.isArray(subval)) {
          formatArray(lines, subkey, subval, 2);
        } else if (typeof subval === 'object') {
          lines.push(`  ${subkey}:`);
          for (const [subsubkey, subsubval] of Object.entries(subval as FrontmatterData)) {
            if (subsubval === null || subsubval === undefined) continue;
            if (Array.isArray(subsubval)) {
              if (subsubval.length === 0) {
                lines.push(`    ${subsubkey}: []`);
              } else {
                lines.push(`    ${subsubkey}:`);
                for (const item of subsubval) {
                  lines.push(`      - ${item}`);
                }
              }
            } else {
              lines.push(`    ${subsubkey}: ${subsubval}`);
            }
          }
        } else {
          const sv = String(subval);
          lines.push(
            `  ${subkey}: ${sv.includes(':') || sv.includes('#') ? `"${sv}"` : sv}`,
          );
        }
      }
    } else {
      const sv = String(value);
      if (sv.includes(':') || sv.includes('#') || sv.startsWith('[') || sv.startsWith('{')) {
        lines.push(`${key}: "${sv}"`);
      } else {
        lines.push(`${key}: ${sv}`);
      }
    }
  }
  return lines.join('\n');
}

function formatArray(lines: string[], key: string, value: FrontmatterValue[], indentLevel: number): void {
  const prefix = ' '.repeat(indentLevel);
  if (value.length === 0) {
    lines.push(`${prefix}${key}: []`);
  } else if (
    value.every(v => typeof v === 'string') &&
    value.length <= 3 &&
    value.join(', ').length < 60
  ) {
    lines.push(`${prefix}${key}: [${value.join(', ')}]`);
  } else {
    lines.push(`${prefix}${key}:`);
    for (const item of value) {
      const itemStr = String(item);
      lines.push(
        `${prefix}  - ${typeof item === 'string' && (itemStr.includes(':') || itemStr.includes('#')) ? `"${itemStr}"` : itemStr}`,
      );
    }
  }
}

/**
 * Replace or insert frontmatter in markdown content.
 */
export function spliceFrontmatter(content: string, newObj: FrontmatterData): string {
  const yamlStr = reconstructFrontmatter(newObj);
  const match = content.match(/^---\n[\s\S]+?\n---/);
  if (match) {
    return `---\n${yamlStr}\n---` + content.slice(match[0].length);
  }
  return `---\n${yamlStr}\n---\n\n` + content;
}

interface MustHaveItem {
  [key: string]: string | number | string[];
}

/**
 * Parse a specific block from must_haves in raw frontmatter YAML.
 */
export function parseMustHavesBlock(content: string, blockName: string): (string | MustHaveItem)[] {
  const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (!fmMatch) return [];

  const yaml = fmMatch[1];
  const blockPattern = new RegExp(`^\\s{4}${blockName}:\\s*$`, 'm');
  const blockStart = yaml.search(blockPattern);
  if (blockStart === -1) return [];

  const afterBlock = yaml.slice(blockStart);
  const blockLines = afterBlock.split('\n').slice(1);

  const items: (string | MustHaveItem)[] = [];
  let current: string | MustHaveItem | null = null;

  for (const line of blockLines) {
    if (line.trim() === '') continue;
    const indent = line.match(/^(\s*)/)![1].length;
    if (indent <= 4 && line.trim() !== '') break;

    if (line.match(/^\s{6}-\s+/)) {
      if (current !== null) items.push(current);
      current = {};
      const simpleMatch = line.match(/^\s{6}-\s+"?([^"]+)"?\s*$/);
      if (simpleMatch && !line.includes(':')) {
        current = simpleMatch[1];
      } else {
        const kvMatch = line.match(/^\s{6}-\s+(\w+):\s*"?([^"]*)"?\s*$/);
        if (kvMatch) {
          current = { [kvMatch[1]]: kvMatch[2] };
        }
      }
    } else if (current !== null && typeof current === 'object') {
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
        if (lastKey) (current[lastKey] as string[]).push(arrMatch[1]);
      }
    }
  }
  if (current !== null) items.push(current);

  return items;
}

// ─── Frontmatter schema validation ──────────────────────────────────────────

export const FRONTMATTER_SCHEMAS: Record<string, FrontmatterSchema> = {
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

export function cmdFrontmatterGet(
  cwd: string,
  filePath: string | null,
  field: string | null,
  raw: boolean,
): void {
  if (!filePath) {
    error('file path required');
  }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) {
    output({ error: 'File not found', path: filePath }, raw);
    return;
  }
  const fm = extractFrontmatter(content);
  if (field) {
    const value = fm[field];
    if (value === undefined) {
      output({ error: 'Field not found', field }, raw);
      return;
    }
    output({ [field]: value }, raw, JSON.stringify(value));
  } else {
    output(fm, raw);
  }
}

export function cmdFrontmatterSet(
  cwd: string,
  filePath: string | null,
  field: string | null,
  value: string | undefined,
  raw: boolean,
): void {
  if (!filePath || !field || value === undefined) {
    error('file, field, and value required');
  }
  const fullPath = path.isAbsolute(filePath!) ? filePath! : path.join(cwd, filePath!);
  if (!fs.existsSync(fullPath)) {
    output({ error: 'File not found', path: filePath }, raw);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const fm = extractFrontmatter(content);
  let parsedValue: FrontmatterValue;
  try {
    parsedValue = JSON.parse(value!) as FrontmatterValue;
  } catch {
    parsedValue = value!;
  }
  fm[field!] = parsedValue;
  const newContent = spliceFrontmatter(content, fm);
  fs.writeFileSync(fullPath, newContent, 'utf-8');
  output({ updated: true, field, value: parsedValue }, raw, 'true');
}

export function cmdFrontmatterMerge(
  cwd: string,
  filePath: string | null,
  data: string | null,
  raw: boolean,
): void {
  if (!filePath || !data) {
    error('file and data required');
  }
  const fullPath = path.isAbsolute(filePath!) ? filePath! : path.join(cwd, filePath!);
  if (!fs.existsSync(fullPath)) {
    output({ error: 'File not found', path: filePath }, raw);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const fm = extractFrontmatter(content);
  let mergeData: FrontmatterData;
  try {
    mergeData = JSON.parse(data!) as FrontmatterData;
  } catch {
    error('Invalid JSON for --data');
    return;
  }
  Object.assign(fm, mergeData);
  const newContent = spliceFrontmatter(content, fm);
  fs.writeFileSync(fullPath, newContent, 'utf-8');
  output({ merged: true, fields: Object.keys(mergeData) }, raw, 'true');
}

export function cmdFrontmatterValidate(
  cwd: string,
  filePath: string | null,
  schemaName: string | null,
  raw: boolean,
): void {
  if (!filePath || !schemaName) {
    error('file and schema required');
  }
  const schema = FRONTMATTER_SCHEMAS[schemaName!];
  if (!schema) {
    error(
      `Unknown schema: ${schemaName}. Available: ${Object.keys(FRONTMATTER_SCHEMAS).join(', ')}`,
    );
  }
  const fullPath = path.isAbsolute(filePath!) ? filePath! : path.join(cwd, filePath!);
  const content = safeReadFile(fullPath);
  if (!content) {
    output({ error: 'File not found', path: filePath }, raw);
    return;
  }
  const fm = extractFrontmatter(content);
  const missing = schema.required.filter(f => fm[f] === undefined);
  const present = schema.required.filter(f => fm[f] !== undefined);
  const result: FrontmatterValidationResult = {
    valid: missing.length === 0,
    missing,
    present,
    schema: schemaName!,
  };
  output(result, raw, missing.length === 0 ? 'valid' : 'invalid');
}
