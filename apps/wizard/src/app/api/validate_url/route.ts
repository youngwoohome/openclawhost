import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { base_url } = await req.json();

    if (!base_url) {
      return NextResponse.json({
        ok: false,
        message: 'URL is required',
      });
    }

    // Validate URL format
    try {
      new URL(base_url);
    } catch {
      return NextResponse.json({
        ok: false,
        message: 'Invalid URL format',
      });
    }

    // Try to reach the URL's /healthz endpoint
    const healthzUrl = base_url.replace(/\/$/, '') + '/healthz';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(healthzUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          ok: true,
          message: `Moltworker is reachable (version: ${data.version || 'unknown'})`,
          evidence: data,
        });
      }

      // Even non-200 means the server is reachable
      return NextResponse.json({
        ok: true,
        status: response.status,
        message: `URL is reachable (HTTP ${response.status})`,
      });
    } catch (error) {
      // Check if it's a timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({
          ok: false,
          message: 'Connection timed out after 10 seconds',
        });
      }

      return NextResponse.json({
        ok: false,
        message: 'URL is not reachable',
      });
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: 'Invalid request',
    });
  }
}
