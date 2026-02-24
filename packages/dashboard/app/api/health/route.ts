import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Health check endpoint used by the CLI to detect if the dashboard
 * is already running. Returns status, port, cwd, and uptime.
 * No authentication required (local-only tool).
 */
export function GET(): NextResponse {
  return NextResponse.json({
    status: "ok",
    port: process.env.PORT || 3333,
    cwd: process.env.MAXSIM_PROJECT_CWD || process.cwd(),
    uptime: process.uptime(),
  });
}
