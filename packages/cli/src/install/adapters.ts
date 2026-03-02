import * as path from 'node:path';

import type { RuntimeName } from '../adapters/index.js';
import {
  readSettings,
} from '../adapters/index.js';
import { getGlobalDir } from './shared.js';

// Cache for attribution settings (populated once per runtime during install)
const attributionCache = new Map<RuntimeName, null | undefined | string>();

/**
 * Get commit attribution setting for a runtime
 * @returns null = remove, undefined = keep default, string = custom
 */
export function getCommitAttribution(runtime: RuntimeName, explicitConfigDir: string | null): null | undefined | string {
  if (attributionCache.has(runtime)) {
    return attributionCache.get(runtime);
  }

  let result: null | undefined | string;

  const settings = readSettings(
    path.join(getGlobalDir('claude', explicitConfigDir), 'settings.json'),
  ) as Record<string, unknown>;
  const attr = settings.attribution as { commit?: string } | undefined;
  if (!attr || attr.commit === undefined) {
    result = undefined;
  } else if (attr.commit === '') {
    result = null;
  } else {
    result = attr.commit;
  }

  attributionCache.set(runtime, result);
  return result;
}
