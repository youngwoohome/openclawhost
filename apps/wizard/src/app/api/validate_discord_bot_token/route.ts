import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({
        ok: false,
        message: 'Token is required',
      });
    }

    try {
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bot ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          ok: true,
          message: `Valid bot: ${data.username}#${data.discriminator || '0'}`,
          evidence: {
            id: data.id,
            username: data.username,
            discriminator: data.discriminator,
            bot: data.bot,
          },
        });
      }

      if (response.status === 401) {
        return NextResponse.json({
          ok: false,
          message: 'Invalid token',
        });
      }

      return NextResponse.json({
        ok: false,
        message: `Discord API error: ${response.status}`,
      });
    } catch (error) {
      return NextResponse.json({
        ok: false,
        message: 'Failed to validate token with Discord API',
      });
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: 'Invalid request',
    });
  }
}
