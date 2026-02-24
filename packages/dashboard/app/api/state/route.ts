import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getProjectCwd, parseState, isWithinPlanning } from '@/lib/parsers';
import { stateReplaceField } from '@maxsim/core';
import { suppressPath } from '@/lib/watcher';

export async function GET() {
  const cwd = getProjectCwd();
  const data = parseState(cwd);

  if (!data) {
    return NextResponse.json(
      { error: 'STATE.md not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const cwd = getProjectCwd();
  const statePath = path.join(cwd, '.planning', 'STATE.md');

  if (!fs.existsSync(statePath)) {
    return NextResponse.json(
      { error: 'STATE.md not found' },
      { status: 404 }
    );
  }

  // Validate path is within .planning/
  if (!isWithinPlanning(cwd, '.planning/STATE.md')) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 400 }
    );
  }

  let body: { field?: string; value?: string };
  try {
    body = await request.json() as { field?: string; value?: string };
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { field, value } = body;

  if (!field || value === undefined) {
    return NextResponse.json(
      { error: 'field and value are required' },
      { status: 400 }
    );
  }

  const content = fs.readFileSync(statePath, 'utf-8');
  const updated = stateReplaceField(content, field, value);

  if (!updated) {
    return NextResponse.json(
      { error: `Field "${field}" not found in STATE.md` },
      { status: 404 }
    );
  }

  // Suppress watcher broadcast for our own write
  suppressPath(statePath);
  fs.writeFileSync(statePath, updated, 'utf-8');

  return NextResponse.json({ updated: true, field });
}
