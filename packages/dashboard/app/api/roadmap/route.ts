import { NextResponse } from 'next/server';
import { getProjectCwd, parseRoadmap } from '@/lib/parsers';

export async function GET() {
  const cwd = getProjectCwd();
  const data = parseRoadmap(cwd);

  if (!data) {
    return NextResponse.json(
      { error: 'ROADMAP.md not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
