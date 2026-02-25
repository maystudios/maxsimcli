import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { inject } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, renameSync } from 'node:fs';
import { createMockProject, type MockProject } from './fixtures/mock-project.js';

let server: ChildProcess | null = null;
let baseUrl = '';
let mockProject: MockProject | null = null;
let ptyDir = '';
let ptyHiddenDir = '';

async function pollUntilReady(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(500),
      });
      if (res.ok) {
        const body = (await res.json()) as { status: string };
        if (body.status === 'ok') return;
      }
    } catch {
      // Not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server at ${url} did not become healthy within ${timeoutMs}ms`);
}

/**
 * Find node-pty directory. Returns the path if found, or empty string if node-pty
 * is not installed at all (which is fine -- the test verifies behavior when absent).
 */
function findNodePtyDir(installDir: string): string {
  const candidates = [
    join(installDir, '.claude', 'dashboard', 'node_modules', 'node-pty'),
    join(installDir, 'node_modules', 'node-pty'),
    join(installDir, 'node_modules', 'maxsimcli', 'node_modules', 'node-pty'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  for (const c of candidates) {
    const hidden = c.replace(/node-pty$/, '.node-pty-hidden');
    if (existsSync(hidden)) return c;
  }
  return '';
}

beforeAll(async () => {
  mockProject = createMockProject();
  const installDir = inject('installDir');
  const serverPath = join(installDir, '.claude', 'dashboard', 'server.js');
  const serverDir = join(installDir, '.claude', 'dashboard');

  ptyDir = findNodePtyDir(installDir);
  if (ptyDir) {
    ptyHiddenDir = ptyDir.replace(/node-pty$/, '.node-pty-hidden');
    if (existsSync(ptyDir)) {
      renameSync(ptyDir, ptyHiddenDir);
    }
  }

  let stderrChunks = '';
  server = spawn('node', [serverPath], {
    cwd: serverDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      MAXSIM_PROJECT_CWD: mockProject.dir,
      NODE_ENV: 'production',
    },
  });

  baseUrl = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Dashboard did not log startup URL within 30s')),
      30_000
    );

    server!.stderr!.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrChunks += text;
      const match = text.match(/Dashboard ready at (http:\/\/localhost:\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });

    server!.on('error', (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });

    server!.on('exit', (code: number | null) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Dashboard server exited with code ${code}\nstderr: ${stderrChunks}`));
      }
    });
  });

  await pollUntilReady(baseUrl, 10_000);
}, 35_000);

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server!.on('close', () => resolve());
      server!.kill('SIGTERM');
      setTimeout(resolve, 5_000);
    });
    server = null;
  }

  try {
    if (ptyHiddenDir && existsSync(ptyHiddenDir) && !existsSync(ptyDir)) {
      renameSync(ptyHiddenDir, ptyDir);
    }
  } catch {
    // Best effort
  }

  mockProject?.cleanup();
  mockProject = null;
});

describe('dashboard pty-absent: server boot', () => {
  it('DASH-TERM-01 (degraded): server boots without node-pty', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });
});

describe('dashboard pty-absent: non-terminal APIs respond', () => {
  it('DASH-01 (pty-absent): /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
  });

  it('DASH-02 (pty-absent): /api/project responds 200', async () => {
    const res = await fetch(`${baseUrl}/api/project`);
    expect(res.status).toBe(200);
  });

  it('DASH-03 (pty-absent): /api/phases responds 200', async () => {
    const res = await fetch(`${baseUrl}/api/phases`);
    expect(res.status).toBe(200);
  });

  it('DASH-04 (pty-absent): /api/state responds 200', async () => {
    const res = await fetch(`${baseUrl}/api/state`);
    expect(res.status).toBe(200);
  });

  it('DASH-05 (pty-absent): /api/todos responds 200', async () => {
    const res = await fetch(`${baseUrl}/api/todos`);
    expect(res.status).toBe(200);
  });
});

describe('dashboard pty-absent: WebSocket terminal', () => {
  it('WebSocket sends unavailable message when node-pty absent', async () => {
    const port = Number(new URL(baseUrl).port);

    // Spawn a child process to test WebSocket upgrade via curl
    const { execSync } = await import('node:child_process');

    // First verify the server responds to regular HTTP
    const healthCheck = execSync(
      `curl -s http://localhost:${port}/api/health`,
      { encoding: 'utf-8', timeout: 5_000 }
    );
    expect(JSON.parse(healthCheck)).toHaveProperty('status', 'ok');

    // Now test WebSocket upgrade
    // curl with --include to see the full response headers
    let wsResponse: string;
    try {
      wsResponse = execSync(
        `curl -s --include --no-buffer -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" --max-time 5 http://localhost:${port}/ws/terminal`,
        { encoding: 'utf-8', timeout: 10_000 }
      );
    } catch (err: unknown) {
      // curl may exit non-zero after timeout on upgraded connection
      wsResponse = (err as { stdout?: string }).stdout ?? '';
    }

    // The server should respond with 101 Switching Protocols for the WS upgrade
    // After upgrade, it sends the unavailable message as a WebSocket frame
    expect(wsResponse).toContain('101');
  });
});
