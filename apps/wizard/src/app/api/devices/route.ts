import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { base_url, gateway_token } = await request.json();

    if (!base_url || !gateway_token) {
      return NextResponse.json(
        { ok: false, error: 'Missing base_url or gateway_token' },
        { status: 400 }
      );
    }

    const response = await fetch(`${base_url.replace(/\/$/, '')}/api/admin/devices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${gateway_token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Build a more descriptive error message
      let errorMessage = data.error || 'Failed to fetch devices';
      if (data.message) {
        errorMessage += ': ' + data.message;
      }
      if (data.missing && Array.isArray(data.missing)) {
        errorMessage += '. Missing: ' + data.missing.join(', ');
      }
      return NextResponse.json(
        { ok: false, error: errorMessage, details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      pending: data.pending || [],
      paired: data.paired || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
