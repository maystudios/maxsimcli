import { NextResponse } from 'next/server';
import { getProjectCwd, parseProject } from '@/lib/parsers';

export async function GET() {
  const cwd = getProjectCwd();
  const data = parseProject(cwd);
  return NextResponse.json(data);
}
