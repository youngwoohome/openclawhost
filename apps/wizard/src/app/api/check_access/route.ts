import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { base_url } = await req.json();

    if (!base_url) {
      return NextResponse.json({
        ok: false,
        message: 'Base URL is required',
      });
    }

    const adminUrl = base_url.replace(/\/$/, '') + '/_admin/';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(adminUrl, {
        redirect: 'manual',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const locationHeader = response.headers.get('location');

      // Check for Cloudflare Access protection indicators
      // 302/303 redirect to cloudflareaccess.com = protected
      // 401/403 = protected
      // 200 without auth = potentially unprotected (warning)
      const isRedirectToAccess = locationHeader?.includes('cloudflareaccess.com');
      const isProtectedStatus = [302, 303, 401, 403].includes(response.status);
      const isProtected = isRedirectToAccess || (isProtectedStatus && response.status !== 200);

      if (isRedirectToAccess) {
        return NextResponse.json({
          ok: true,
          message: 'Admin UI is protected by Cloudflare Access',
          evidence: {
            status: response.status,
            redirect: locationHeader,
          },
        });
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          ok: true,
          message: 'Admin UI appears to require authentication',
          evidence: {
            status: response.status,
          },
        });
      }

      if (response.status === 200) {
        return NextResponse.json({
          ok: false,
          message: 'Warning: Admin UI may not be protected. Ensure Cloudflare Access is configured.',
          evidence: {
            status: response.status,
            hint: 'A 200 response without redirect may indicate the admin UI is publicly accessible',
          },
        });
      }

      return NextResponse.json({
        ok: true,
        message: `Admin UI responded with status ${response.status}`,
        evidence: {
          status: response.status,
          locationHeader,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({
          ok: false,
          message: 'Connection timed out',
        });
      }

      return NextResponse.json({
        ok: false,
        message: 'Failed to check admin access',
      });
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: 'Invalid request',
    });
  }
}
