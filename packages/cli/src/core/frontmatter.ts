/**
 * Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
 *
 * Uses the `yaml` npm package instead of a hand-rolled parser.
 */

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

import { safeReadFile, output, error } from './core.js';
import type {
  FrontmatterData,
  FrontmatterValue,
  FrontmatterValidationResult,
  FrontmatterSchema,
} from './types.js';

// ─── Parsing engine ───────────────────────────────────────────────────────────

/**
 * Extract YAML frontmatter from markdown content into a typed object.
 */
export function extractFrontmatter(content: string): FrontmatterData {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return {};
  try {
    const parsed = YAML.parse(match[1]);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      ? parsed as FrontmatterData
      : {};
  } catch {
    return {};
  }
}

/**
 * Reconstruct YAML frontmatter string from an object.
 */
export function reconstructFrontmatter(obj: FrontmatterData): string {
  // Filter out null/undefined values
  const cleaned: FrontmatterData = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }

  return YAML.stringify(cleaned, {
    lineWidth: 0,        // Don't wrap long lines
    defaultKeyType: 'PLAIN',
    defaultStringType: 'PLAIN',
  }).trimEnd();
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
 * Parse a specific block from must_haves in frontmatter.
 * With the yaml package, this is just object traversal.
 */
export function parseMustHavesBlock(content: string, blockName: string): (string | MustHaveItem)[] {
  const fm = extractFrontmatter(content);
  const mustHaves = fm.must_haves as FrontmatterData | undefined;
  if (!mustHaves || typeof mustHaves !== 'object') return [];
  const block = mustHaves[blockName];
  if (!Array.isArray(block)) return [];
  return block as (string | MustHaveItem)[];
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
