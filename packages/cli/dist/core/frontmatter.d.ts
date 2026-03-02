/**
 * Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
 *
 * Uses the `yaml` npm package instead of a hand-rolled parser.
 */
import type { CmdResult, FrontmatterData, FrontmatterSchema } from './types.js';
/**
 * Extract YAML frontmatter from markdown content into a typed object.
 */
export declare function extractFrontmatter(content: string): FrontmatterData;
/**
 * Reconstruct YAML frontmatter string from an object.
 */
export declare function reconstructFrontmatter(obj: FrontmatterData): string;
/**
 * Replace or insert frontmatter in markdown content.
 */
export declare function spliceFrontmatter(content: string, newObj: FrontmatterData): string;
interface MustHaveItem {
    [key: string]: string | number | string[];
}
/**
 * Parse a specific block from must_haves in frontmatter.
 * With the yaml package, this is just object traversal.
 */
export declare function parseMustHavesBlock(content: string, blockName: string): (string | MustHaveItem)[];
export declare const FRONTMATTER_SCHEMAS: Record<string, FrontmatterSchema>;
export declare function cmdFrontmatterGet(cwd: string, filePath: string | null, field: string | null): CmdResult;
export declare function cmdFrontmatterSet(cwd: string, filePath: string | null, field: string | null, value: string | undefined): CmdResult;
export declare function cmdFrontmatterMerge(cwd: string, filePath: string | null, data: string | null): CmdResult;
export declare function cmdFrontmatterValidate(cwd: string, filePath: string | null, schemaName: string | null): CmdResult;
export {};
//# sourceMappingURL=frontmatter.d.ts.map