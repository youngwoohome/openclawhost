import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const { base_url, gateway_token } = await request.json();

    if (!base_url || !gateway_token) {
      return NextResponse.json(
        { ok: false, error: 'Missing base_url or gateway_token' },
        { status: 400 }
      );
    }

    const response = await fetch(`${base_url.replace(/\/$/, '')}/api/admin/devices/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gateway_token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || 'Failed to approve device', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      success: data.success,
      requestId: data.requestId,
      message: data.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
