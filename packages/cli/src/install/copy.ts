import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  processAttribution,
} from '../adapters/index.js';
import { getCommitAttribution } from './adapters.js';

/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 */
export function copyWithPathReplacement(
  srcDir: string,
  destDir: string,
  pathPrefix: string,
  explicitConfigDir: string | null,
  isCommand: boolean = false,
): void {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix, explicitConfigDir, isCommand);
    } else if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      const globalClaudeRegex = /~\/\.claude\//g;
      const localClaudeRegex = /\.\/\.claude\//g;
      content = content.replace(globalClaudeRegex, pathPrefix);
      content = content.replace(localClaudeRegex, './.claude/');
      content = processAttribution(content, getCommitAttribution(explicitConfigDir));
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
