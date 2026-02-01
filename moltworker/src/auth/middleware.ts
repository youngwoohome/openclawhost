import type { Context, Next } from 'hono';
import type { AppEnv, MoltbotEnv } from '../types';

/**
 * Options for creating an access middleware
 */
export interface AccessMiddlewareOptions {
  /** Response type: 'json' for API routes, 'html' for UI routes */
  type: 'json' | 'html';
}

/**
 * Extract gateway token from Authorization header
 * Format: Authorization: Bearer {token}
 */
export function extractGatewayToken(c: Context<AppEnv>): string | null {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

/**
 * Validate gateway token against environment variable
 */
export function validateGatewayToken(token: string, env: MoltbotEnv): boolean {
  return !!env.MOLTBOT_GATEWAY_TOKEN && token === env.MOLTBOT_GATEWAY_TOKEN;
}

/**
 * Create an authentication middleware using gateway token
 *
 * Security model:
 * - Valid gateway token: Allow access
 * - Invalid/missing token: Deny access (401)
 *
 * @param options - Middleware options
 * @returns Hono middleware function
 */
export function createAccessMiddleware(options: AccessMiddlewareOptions) {
  const { type } = options;

  return async (c: Context<AppEnv>, next: Next) => {
    // Check for gateway token authentication
    const gatewayToken = extractGatewayToken(c);
    if (gatewayToken && validateGatewayToken(gatewayToken, c.env)) {
      c.set('accessUser', { email: 'gateway@wizard', name: 'Gateway Token' });
      return next();
    }

    // No valid authentication
    if (type === 'json') {
      return c.json({
        error: 'Unauthorized',
        hint: 'Missing or invalid gateway token. Use Authorization: Bearer <token>',
      }, 401);
    } else {
      return c.html(`
        <html>
          <body>
            <h1>Unauthorized</h1>
            <p>Missing or invalid gateway token.</p>
          </body>
        </html>
      `, 401);
    }
  };
}
