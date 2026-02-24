import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getProjectCwd, isWithinPlanning } from '@/lib/parsers';
import { suppressPath } from '@/lib/watcher';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const cwd = getProjectCwd();
  const relativePath = path.join('.planning', ...pathSegments);

  // Security: validate path stays within .planning/
  if (!isWithinPlanning(cwd, relativePath)) {
    return NextResponse.json(
      { error: 'Path traversal not allowed' },
      { status: 403 }
    );
  }

  const fullPath = path.join(cwd, relativePath);

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return NextResponse.json({ path: relativePath, content });
  } catch {
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const cwd = getProjectCwd();
  const relativePath = path.join('.planning', ...pathSegments);

  // Security: validate path stays within .planning/
  if (!isWithinPlanning(cwd, relativePath)) {
    return NextResponse.json(
      { error: 'Path traversal not allowed' },
      { status: 403 }
    );
  }

  let body: { content?: string };
  try {
    body = await request.json() as { content?: string };
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { content } = body;

  if (content === undefined) {
    return NextResponse.json(
      { error: 'content is required' },
      { status: 400 }
    );
  }

  const fullPath = path.join(cwd, relativePath);

  // Ensure parent directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Suppress watcher broadcast for our own write
  suppressPath(fullPath);
  fs.writeFileSync(fullPath, content, 'utf-8');

  return NextResponse.json({ written: true, path: relativePath });
}
