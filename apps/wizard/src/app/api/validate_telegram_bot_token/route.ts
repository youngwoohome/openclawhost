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

    // Validate token format (should contain a colon)
    if (!token.includes(':')) {
      return NextResponse.json({
        ok: false,
        message: 'Invalid token format. Telegram bot tokens should be in format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
      });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();

      if (data.ok === true) {
        return NextResponse.json({
          ok: true,
          message: `Valid bot: @${data.result.username}`,
          evidence: {
            id: data.result.id,
            username: data.result.username,
            first_name: data.result.first_name,
            can_join_groups: data.result.can_join_groups,
            can_read_all_group_messages: data.result.can_read_all_group_messages,
          },
        });
      }

      return NextResponse.json({
        ok: false,
        message: data.description || 'Invalid token',
      });
    } catch (error) {
      return NextResponse.json({
        ok: false,
        message: 'Failed to validate token with Telegram API',
      });
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: 'Invalid request',
    });
  }
}
