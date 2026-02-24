import { NextResponse } from 'next/server';
import { getProjectCwd, parsePhases } from '@/lib/parsers';

export async function GET() {
  const cwd = getProjectCwd();
  const phases = parsePhases(cwd);
  return NextResponse.json(phases);
}
