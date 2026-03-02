import * as path from 'node:path';

import {
  readSettings,
} from '../adapters/index.js';
import { getGlobalDir } from './shared.js';

// Cache for attribution settings (populated once during install)
let attributionCached = false;
let attributionValue: null | undefined | string;

/**
 * Get commit attribution setting for Claude Code
 * @returns null = remove, undefined = keep default, string = custom
 */
export function getCommitAttribution(explicitConfigDir: string | null): null | undefined | string {
  if (attributionCached) {
    return attributionValue;
  }

  const settings = readSettings(
    path.join(getGlobalDir(explicitConfigDir), 'settings.json'),
  ) as Record<string, unknown>;
  const attr = settings.attribution as { commit?: string } | undefined;
  if (!attr || attr.commit === undefined) {
    attributionValue = undefined;
  } else if (attr.commit === '') {
    attributionValue = null;
  } else {
    attributionValue = attr.commit;
  }

  attributionCached = true;
  return attributionValue;
}
