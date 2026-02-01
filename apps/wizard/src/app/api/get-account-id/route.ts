import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';

interface GetAccountIdResponse {
  ok: boolean;
  accountId?: string;
  accountName?: string;
  message?: string;
  error?: string;
}

/**
 * API endpoint to auto-detect Cloudflare Account ID using wrangler whoami
 */
export async function GET(): Promise<NextResponse<GetAccountIdResponse>> {
  try {
    // Resolve moltworker directory (../../moltworker relative to wizard app)
    const moltworkerDir = path.resolve(process.cwd(), '../../moltworker');

    const result = await getAccountId(moltworkerDir);

    if (result.success && result.accountId) {
      return NextResponse.json({
        ok: true,
        accountId: result.accountId,
        accountName: result.accountName,
        message: 'Account ID detected successfully',
      });
    } else {
      return NextResponse.json(
        {
          ok: false,
          message: 'Failed to detect account ID',
          error: result.error || 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in get-account-id API:', error);
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

interface WranglerWhoamiResult {
  success: boolean;
  accountId?: string;
  accountName?: string;
  error?: string;
}

function getAccountId(workingDir: string): Promise<WranglerWhoamiResult> {
  return new Promise((resolve) => {
    const wranglerProcess = spawn('npx', ['wrangler', 'whoami'], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000, // 10 seconds timeout
    });

    let stdout = '';
    let stderr = '';

    wranglerProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    wranglerProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    wranglerProcess.on('close', (code) => {
      if (code === 0) {
        // Parse wrangler whoami output
        // Expected format:
        // ┌──────────────────────────────────┬──────────────────────────────────┐
        // │ Account Name                     │ Account ID                       │
        // ├──────────────────────────────────┼──────────────────────────────────┤
        // │ Youngwoo5662@gmail.com's Account │ 7fae93a730434fe44e91934fc636d9aa │
        // └──────────────────────────────────┴──────────────────────────────────┘

        const lines = stdout.split('\n');
        let accountId: string | undefined;
        let accountName: string | undefined;

        // Look for the line with account ID (usually the line after the header separator)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Account ID is a 32-character hex string
          const accountIdMatch = line.match(/([a-f0-9]{32})/);
          if (accountIdMatch) {
            accountId = accountIdMatch[1];
            // Account name is usually in the same line, before the │ separator
            const parts = line.split('│').map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
              accountName = parts[0];
            }
            break;
          }
        }

        if (accountId) {
          resolve({ success: true, accountId, accountName });
        } else {
          resolve({
            success: false,
            error: 'Could not parse account ID from wrangler output',
          });
        }
      } else {
        console.error('wrangler whoami failed:', { stdout, stderr, code });

        // Check for common error cases
        if (stderr.includes('not logged in') || stdout.includes('not logged in')) {
          resolve({
            success: false,
            error: 'Not logged in to Wrangler. Run "npx wrangler login" first.',
          });
        } else {
          resolve({
            success: false,
            error: stderr || stdout || `Process exited with code ${code}`,
          });
        }
      }
    });

    wranglerProcess.on('error', (error) => {
      console.error('wrangler whoami error:', error);
      resolve({
        success: false,
        error: `Failed to run wrangler: ${error.message}`,
      });
    });
  });
}
