import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getProjectCwd, parseTodos, isWithinPlanning } from '@/lib/parsers';
import { suppressPath } from '@/lib/watcher';

export async function GET() {
  const cwd = getProjectCwd();
  const data = parseTodos(cwd);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const cwd = getProjectCwd();
  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');

  let body: { text?: string };
  try {
    body = await request.json() as { text?: string };
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { text } = body;

  if (!text) {
    return NextResponse.json(
      { error: 'text is required' },
      { status: 400 }
    );
  }

  // Ensure pending directory exists
  fs.mkdirSync(pendingDir, { recursive: true });

  // Generate filename from timestamp and sanitized text
  const timestamp = new Date().toISOString().split('T')[0];
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const filename = `${timestamp}-${slug}.md`;

  const filePath = path.join(pendingDir, filename);
  const content = `title: ${text}\ncreated: ${timestamp}\narea: general\n\n${text}\n`;

  // Suppress watcher broadcast for our own write
  suppressPath(filePath);
  fs.writeFileSync(filePath, content, 'utf-8');

  return NextResponse.json({
    created: true,
    file: filename,
    text,
  });
}

export async function PATCH(request: Request) {
  const cwd = getProjectCwd();
  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');
  const completedDir = path.join(cwd, '.planning', 'todos', 'completed');

  let body: { file?: string; completed?: boolean };
  try {
    body = await request.json() as { file?: string; completed?: boolean };
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { file, completed } = body;

  if (!file) {
    return NextResponse.json(
      { error: 'file is required' },
      { status: 400 }
    );
  }

  // Security: validate no path traversal in filename
  if (file.includes('/') || file.includes('\\') || file.includes('..')) {
    return NextResponse.json(
      { error: 'Invalid filename' },
      { status: 400 }
    );
  }

  if (completed) {
    // Move from pending to completed
    const sourcePath = path.join(pendingDir, file);

    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json(
        { error: 'Todo not found in pending' },
        { status: 404 }
      );
    }

    // Validate path is within .planning/
    if (!isWithinPlanning(cwd, path.relative(cwd, sourcePath))) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    fs.mkdirSync(completedDir, { recursive: true });

    let content = fs.readFileSync(sourcePath, 'utf-8');
    const today = new Date().toISOString().split('T')[0];
    content = `completed: ${today}\n` + content;

    const destPath = path.join(completedDir, file);

    // Suppress watcher broadcast for our own writes
    suppressPath(sourcePath);
    suppressPath(destPath);

    fs.writeFileSync(destPath, content, 'utf-8');
    fs.unlinkSync(sourcePath);

    return NextResponse.json({
      completed: true,
      file,
      date: today,
    });
  } else {
    // Move from completed back to pending
    const sourcePath = path.join(completedDir, file);

    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json(
        { error: 'Todo not found in completed' },
        { status: 404 }
      );
    }

    // Validate path is within .planning/
    if (!isWithinPlanning(cwd, path.relative(cwd, sourcePath))) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    fs.mkdirSync(pendingDir, { recursive: true });

    let content = fs.readFileSync(sourcePath, 'utf-8');
    // Remove completed: line
    content = content.replace(/^completed:\s*.+\n/m, '');

    const destPath = path.join(pendingDir, file);

    // Suppress watcher broadcast for our own writes
    suppressPath(sourcePath);
    suppressPath(destPath);

    fs.writeFileSync(destPath, content, 'utf-8');
    fs.unlinkSync(sourcePath);

    return NextResponse.json({
      completed: false,
      file,
    });
  }
}
