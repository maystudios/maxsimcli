/**
 * Error-path tests for state.ts
 *
 * Validates graceful handling of malformed input, missing fields, empty content,
 * and edge cases in the pure string-processing functions exported by state.ts.
 */

import { describe, it, expect } from 'vitest';
import {
  stateExtractField,
  stateReplaceField,
  appendToStateSection,
} from '../../src/core/state.js';

// ─── stateExtractField — error paths ─────────────────────────────────────────

describe('stateExtractField error paths', () => {
  it('returns null for empty string content', () => {
    expect(stateExtractField('', 'Status')).toBeNull();
  });

  it('returns null when the field does not exist', () => {
    const content = '**Status:** Active\n**Phase:** 01\n';
    expect(stateExtractField(content, 'Missing')).toBeNull();
    expect(stateExtractField(content, 'Nonexistent Field')).toBeNull();
  });

  it('returns null for malformed markdown (no bold markers)', () => {
    const content = 'Status: Active\nPhase: 01\n';
    expect(stateExtractField(content, 'Status')).toBeNull();
  });

  it('returns null for partial bold markers', () => {
    const content = '**Status: Active\nStatus:** Active\n';
    expect(stateExtractField(content, 'Status')).toBeNull();
  });

  it('returns null for bold field with no value after it', () => {
    // The regex requires .+ (one or more chars) after the colon
    const content = '**Status:**\n';
    expect(stateExtractField(content, 'Status')).toBeNull();
  });

  it('returns the value when there is a space but text follows', () => {
    const content = '**Status:** \n';
    // .+ requires at least one non-newline char; a single space is matched
    // but trim() produces empty string — let's document actual behavior
    const result = stateExtractField(content, 'Status');
    // The regex `.+` matches " " (one space), then trim() returns ""
    expect(result).toBe('');
  });

  it('does NOT escape regex metacharacters in fieldName (known limitation)', () => {
    // stateExtractField does NOT use escapeStringRegexp, unlike stateReplaceField.
    // Field names containing regex metacharacters like () [] will be treated as regex.
    const content = '**Total Plans (Phase):** 5\n';

    // Parentheses are interpreted as a regex group, not literal chars.
    // The regex becomes: \*\*Total Plans (Phase):\*\*\s*(.+)
    // (Phase) becomes a capturing group, which shifts the capture groups so
    // group[1] captures "Phase" instead of the value "5".
    // This means the function returns null or the wrong value.
    const result = stateExtractField(content, 'Total Plans (Phase)');
    // Known bug: returns null because the regex groups are shifted
    expect(result).toBeNull();
  });

  it('fails to match field names with brackets due to unescaped regex', () => {
    const content = '**Status [v2]:** Active\n';
    // [v2] is a character class matching v or 2, not literal "[v2]"
    // This tests a known limitation: stateExtractField doesn't escape fieldName
    const result = stateExtractField(content, 'Status [v2]');
    // The regex \*\*Status [v2]:\*\* treats [v2] as a character class
    // matching a single char (v or 2), so it won't match "[v2]" literally.
    // The field content has " [v2]" which won't match. Document actual behavior:
    expect(result).toBeNull();
  });

  it('handles content with only whitespace', () => {
    expect(stateExtractField('   \n  \n  ', 'Status')).toBeNull();
  });

  it('handles empty fieldName', () => {
    const content = '**Status:** Active\n';
    // Empty fieldName creates regex: \*\*:\*\*\s*(.+)
    // This won't match "**Status:**" since there's text between ** and :
    const result = stateExtractField(content, '');
    expect(result).toBeNull();
  });
});

// ─── stateReplaceField — error paths ─────────────────────────────────────────

describe('stateReplaceField error paths', () => {
  it('returns null when field does not exist in content', () => {
    const content = '**Status:** Active\n';
    expect(stateReplaceField(content, 'Missing', 'value')).toBeNull();
  });

  it('returns null for empty content', () => {
    expect(stateReplaceField('', 'Status', 'value')).toBeNull();
  });

  it('returns null for content with no bold fields', () => {
    const content = 'Status: Active\nPhase: 01\n';
    expect(stateReplaceField(content, 'Status', 'Done')).toBeNull();
  });

  it('properly escapes regex metacharacters in fieldName', () => {
    // stateReplaceField uses escapeStringRegexp, so this should work correctly
    const content = '**Total Plans (Phase):** 5\n';
    const result = stateReplaceField(content, 'Total Plans (Phase)', '10');
    expect(result).not.toBeNull();
    expect(result).toContain('**Total Plans (Phase):** 10');
  });

  it('properly escapes brackets in fieldName', () => {
    const content = '**Status [v2]:** Active\n';
    const result = stateReplaceField(content, 'Status [v2]', 'Done');
    expect(result).not.toBeNull();
    expect(result).toContain('**Status [v2]:** Done');
  });

  it('handles replacement with empty string', () => {
    const content = '**Status:** Active\n';
    const result = stateReplaceField(content, 'Status', '');
    expect(result).not.toBeNull();
    expect(result).toContain('**Status:** ');
  });

  it('handles content that is just a field with no trailing newline', () => {
    const content = '**Status:** Active';
    const result = stateReplaceField(content, 'Status', 'Done');
    expect(result).not.toBeNull();
    expect(result).toBe('**Status:** Done');
  });
});

// ─── appendToStateSection — error paths ──────────────────────────────────────

describe('appendToStateSection error paths', () => {
  const sectionPattern = /(##\s*Decisions\s*\n)([\s\S]*?)(?=\n##|$)/i;

  it('returns null when the target section is missing', () => {
    const content = '## Other Section\nSome content\n';
    const result = appendToStateSection(content, sectionPattern, '- New decision');
    expect(result).toBeNull();
  });

  it('returns null for empty content', () => {
    const result = appendToStateSection('', sectionPattern, '- New decision');
    expect(result).toBeNull();
  });

  it('appends to an empty section body', () => {
    const content = '## Decisions\n\n## Next Section\n';
    const result = appendToStateSection(content, sectionPattern, '- New decision');
    expect(result).not.toBeNull();
    expect(result).toContain('- New decision');
  });

  it('strips placeholder text before appending', () => {
    const content = '## Decisions\nNone yet.\n\n## Next Section\n';
    const result = appendToStateSection(content, sectionPattern, '- First decision');
    expect(result).not.toBeNull();
    expect(result).toContain('- First decision');
    expect(result).not.toContain('None yet');
  });

  it('strips "None." placeholder', () => {
    const content = '## Decisions\nNone.\n\n## Next Section\n';
    const result = appendToStateSection(content, sectionPattern, '- Entry');
    expect(result).not.toBeNull();
    expect(result).not.toContain('None.');
    expect(result).toContain('- Entry');
  });

  it('strips "No decisions yet" placeholder', () => {
    const content = '## Decisions\nNo decisions yet.\n\n## Next Section\n';
    const result = appendToStateSection(content, sectionPattern, '- Entry');
    expect(result).not.toBeNull();
    expect(result).not.toContain('No decisions yet');
  });

  it('uses custom placeholder patterns when provided', () => {
    const content = '## Decisions\nTBD\n\n## Next Section\n';
    const customPlaceholders = [/TBD\s*\n?/gi];
    const result = appendToStateSection(content, sectionPattern, '- Entry', customPlaceholders);
    expect(result).not.toBeNull();
    expect(result).not.toContain('TBD');
    expect(result).toContain('- Entry');
  });

  it('preserves existing entries when appending', () => {
    const content = '## Decisions\n- Existing decision\n\n## Next Section\n';
    const result = appendToStateSection(content, sectionPattern, '- New decision');
    expect(result).not.toBeNull();
    expect(result).toContain('- Existing decision');
    expect(result).toContain('- New decision');
  });

  it('handles section at end of content (no following section)', () => {
    const content = '## Decisions\nNone yet.\n';
    const endPattern = /(##\s*Decisions\s*\n)([\s\S]*?)$/i;
    const result = appendToStateSection(content, endPattern, '- Entry');
    expect(result).not.toBeNull();
    expect(result).toContain('- Entry');
  });
});

// ─── Blocker extraction patterns ─────────────────────────────────────────────

describe('blocker extraction edge cases', () => {
  // The blocker extraction in cmdStateSnapshot uses:
  //   /^-\s+(.+)$/gm
  // Let's test the regex directly on edge-case inputs

  const blockerLinePattern = /^-\s+(.+)$/gm;

  it('returns no matches for empty section', () => {
    const section = '';
    const matches = section.match(blockerLinePattern) || [];
    expect(matches).toEqual([]);
  });

  it('returns no matches when section has no bullet items', () => {
    const section = 'None\nSome text without bullets\n';
    const matches = section.match(blockerLinePattern) || [];
    expect(matches).toEqual([]);
  });

  it('matches standard dash bullets', () => {
    const section = '- First blocker\n- Second blocker\n';
    const matches = section.match(blockerLinePattern) || [];
    expect(matches).toHaveLength(2);
  });

  it('does not match asterisk bullets (only dash)', () => {
    const section = '* Asterisk bullet\n- Dash bullet\n';
    const matches = section.match(blockerLinePattern) || [];
    expect(matches).toHaveLength(1);
    expect(matches[0]).toContain('Dash bullet');
  });

  it('does not match numbered list items', () => {
    const section = '1. Numbered item\n- Dash item\n';
    const matches = section.match(blockerLinePattern) || [];
    expect(matches).toHaveLength(1);
    expect(matches[0]).toContain('Dash item');
  });

  it('handles "None" as a non-bullet value', () => {
    const section = 'None\n';
    const matches = section.match(blockerLinePattern) || [];
    expect(matches).toEqual([]);
  });

  it('handles pipes in blocker text', () => {
    const section = '- Blocker with | pipe char\n';
    const matches = section.match(blockerLinePattern) || [];
    expect(matches).toHaveLength(1);
    expect(matches[0]).toContain('pipe char');
  });
});

// ─── Table parsing edge cases (Performance Metrics) ──────────────────────────

describe('Performance Metrics table parsing edge cases', () => {
  // The metricsPattern used in cmdStateRecordMetric:
  const metricsPattern = /(##\s*Performance Metrics[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n)([\s\S]*?)(?=\n##|\n$|$)/i;

  it('does not match when table has no separator line', () => {
    const content = '## Performance Metrics\n| Phase | Duration | Tasks | Files |\n| Phase 01 P1 | 30m | 5 tasks | 3 files |\n';
    // The separator line |---|---|---| is missing
    const match = content.match(metricsPattern);
    expect(match).toBeNull();
  });

  it('matches a table with proper header and separator', () => {
    const content = '## Performance Metrics\n| Phase | Duration | Tasks | Files |\n|-------|----------|-------|-------|\n\n## Next Section\n';
    const match = content.match(metricsPattern);
    expect(match).not.toBeNull();
  });

  it('matches when table body is empty (just header + separator)', () => {
    const content = '## Performance Metrics\n| Phase | Duration | Tasks | Files |\n|-------|----------|-------|-------|\n\n## Next Section\n';
    const match = content.match(metricsPattern);
    expect(match).not.toBeNull();
    // The non-greedy [\s\S]*? in group 2 captures up to the lookahead (?=\n##|\n$|$).
    // With no data rows, the body should contain no pipe-delimited table rows.
    const body = match![2];
    const dataRows = body.trim().split('\n').filter(r => r.includes('|'));
    expect(dataRows).toHaveLength(0);
  });

  it('captures existing rows in the table body', () => {
    const content = [
      '## Performance Metrics',
      '| Phase | Duration | Tasks | Files |',
      '|-------|----------|-------|-------|',
      '| Phase 01 P1 | 30m | 5 tasks | 3 files |',
      '',
      '## Next Section',
    ].join('\n');
    const match = content.match(metricsPattern);
    expect(match).not.toBeNull();
    expect(match![2]).toContain('Phase 01 P1');
  });

  it('handles pipes within table cell content', () => {
    // Pipes inside cells would confuse naive splitting but the regex just captures the body
    const content = [
      '## Performance Metrics',
      '| Phase | Duration | Tasks | Files |',
      '|-------|----------|-------|-------|',
      '| Phase 01 P1 | 30m | 5 | 3 |',
      '',
      '## Next Section',
    ].join('\n');
    const match = content.match(metricsPattern);
    expect(match).not.toBeNull();
  });
});

// ─── Decisions table parsing (from cmdStateSnapshot) ─────────────────────────

describe('decisions table parsing edge cases', () => {
  const decisionsPattern = /##\s*Decisions Made[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n##|\n$|$)/i;

  it('does not match when section has no table', () => {
    const content = '## Decisions Made\nSome text but no table\n\n## Next\n';
    const match = content.match(decisionsPattern);
    expect(match).toBeNull();
  });

  it('returns empty body for table with only header and separator', () => {
    const content = '## Decisions Made\n| Phase | Decision | Rationale |\n|-------|----------|----------|\n\n## Next\n';
    const match = content.match(decisionsPattern);
    expect(match).not.toBeNull();
    // The non-greedy capture grabs content between separator and the lookahead.
    // The lookahead (?=\n##|\n$|$) matches at end, so body may include trailing content.
    // Just verify match exists and body has no actual table rows:
    const body = match![1];
    const rows = body.trim().split('\n').filter(r => r.includes('|'));
    expect(rows).toHaveLength(0);
  });

  it('parses rows with fewer than 3 cells', () => {
    const content = [
      '## Decisions Made',
      '| Phase | Decision | Rationale |',
      '|-------|----------|----------|',
      '| 01 | Only two cells |',
      '',
      '## Next',
    ].join('\n');
    const match = content.match(decisionsPattern);
    expect(match).not.toBeNull();
    // The row has only 2 cells after splitting — the snapshot code filters for >= 3
    const rows = match![1].trim().split('\n').filter(r => r.includes('|'));
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      // This row has only 2 non-empty cells, so it would be skipped by cmdStateSnapshot
      expect(cells.length).toBeLessThan(3);
    }
  });
});
