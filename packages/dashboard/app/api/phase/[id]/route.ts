import { NextResponse } from 'next/server';
import { getProjectCwd, parsePhaseDetail } from '@/lib/parsers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: phaseId } = await params;
  const cwd = getProjectCwd();
  const data = parsePhaseDetail(cwd, phaseId);

  if (!data) {
    return NextResponse.json(
      { error: `Phase ${phaseId} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
