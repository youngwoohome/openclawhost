import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { base_url, gateway_token, channel, code } = await request.json();

    if (!base_url || !gateway_token) {
      return NextResponse.json(
        { ok: false, error: 'Missing base_url or gateway_token' },
        { status: 400 }
      );
    }

    if (!channel || !code) {
      return NextResponse.json(
        { ok: false, error: 'Missing channel or code' },
        { status: 400 }
      );
    }

    // Validate channel type
    const validChannels = ['telegram', 'discord', 'slack'];
    if (!validChannels.includes(channel.toLowerCase())) {
      return NextResponse.json(
        { ok: false, error: 'Invalid channel type. Must be telegram, discord, or slack' },
        { status: 400 }
      );
    }

    const response = await fetch(`${base_url.replace(/\/$/, '')}/api/admin/pairing/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gateway_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channel.toLowerCase(),
        code: code.toUpperCase().trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Build a more descriptive error message
      let errorMessage = data.error || 'Failed to approve channel pairing';
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
      success: data.success,
      channel: data.channel,
      code: data.code,
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
