import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';

interface DeploySecretRequest {
  secretName: string;
  secretValue: string;
}

interface DeploySecretResponse {
  ok: boolean;
  message: string;
  error?: string;
}

// Validate secret name to prevent command injection
function isValidSecretName(name: string): boolean {
  return /^[A-Z0-9_]+$/.test(name);
}

export async function POST(request: NextRequest): Promise<NextResponse<DeploySecretResponse>> {
  try {
    const body = await request.json() as DeploySecretRequest;
    const { secretName, secretValue } = body;

    // Validate inputs
    if (!secretName || typeof secretName !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'Invalid request: secretName is required' },
        { status: 400 }
      );
    }

    if (!secretValue || typeof secretValue !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'Invalid request: secretValue is required' },
        { status: 400 }
      );
    }

    // Validate secret name format
    if (!isValidSecretName(secretName)) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid secret name: must contain only uppercase letters, numbers, and underscores',
        },
        { status: 400 }
      );
    }

    // Resolve moltworker directory (../../moltworker relative to wizard app)
    const moltworkerDir = path.resolve(process.cwd(), '../../moltworker');

    // Execute wrangler secret put command
    const result = await deploySecret(secretName, secretValue, moltworkerDir);

    if (result.success) {
      return NextResponse.json({
        ok: true,
        message: 'Secret deployed successfully',
      });
    } else {
      return NextResponse.json(
        {
          ok: false,
          message: 'Failed to deploy secret',
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in deploy-secret API:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function deploySecret(
  secretName: string,
  secretValue: string,
  workingDir: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const wranglerProcess = spawn('wrangler', ['secret', 'put', secretName], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000, // 30 seconds timeout
    });

    let stdout = '';
    let stderr = '';

    // Write the secret value to stdin
    wranglerProcess.stdin.write(secretValue);
    wranglerProcess.stdin.end();

    wranglerProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    wranglerProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    wranglerProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        console.error('wrangler secret put failed:', { stdout, stderr, code });
        resolve({
          success: false,
          error: stderr || stdout || `Process exited with code ${code}`,
        });
      }
    });

    wranglerProcess.on('error', (error) => {
      console.error('wrangler secret put error:', error);
      resolve({
        success: false,
        error: error.message,
      });
    });
  });
}
