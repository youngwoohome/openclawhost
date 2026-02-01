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

    // Validate token format (should start with xoxb-)
    if (!token.startsWith('xoxb-')) {
      return NextResponse.json({
        ok: false,
        message: 'Invalid token format. Slack bot tokens should start with xoxb-',
      });
    }

    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();

      if (data.ok === true) {
        return NextResponse.json({
          ok: true,
          message: `Valid token for workspace: ${data.team}`,
          evidence: {
            team: data.team,
            team_id: data.team_id,
            user: data.user,
            bot_id: data.bot_id,
          },
        });
      }

      return NextResponse.json({
        ok: false,
        message: data.error || 'Invalid token',
      });
    } catch (error) {
      return NextResponse.json({
        ok: false,
        message: 'Failed to validate token with Slack API',
      });
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: 'Invalid request',
    });
  }
}
