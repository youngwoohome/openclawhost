import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractGatewayToken, validateGatewayToken } from './middleware';
import type { MoltbotEnv } from '../types';
import type { Context } from 'hono';
import type { AppEnv } from '../types';
import { createMockEnv } from '../test-utils';

describe('extractGatewayToken', () => {
  function createMockContext(authHeader?: string): Context<AppEnv> {
    const headers = new Headers();
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }

    return {
      req: {
        header: (name: string) => headers.get(name),
      },
    } as unknown as Context<AppEnv>;
  }

  it('extracts token from Bearer authorization header', () => {
    const c = createMockContext('Bearer my-secret-token');
    expect(extractGatewayToken(c)).toBe('my-secret-token');
  });

  it('returns null when no Authorization header', () => {
    const c = createMockContext();
    expect(extractGatewayToken(c)).toBeNull();
  });

  it('returns null when Authorization is not Bearer', () => {
    const c = createMockContext('Basic abc123');
    expect(extractGatewayToken(c)).toBeNull();
  });
});

describe('validateGatewayToken', () => {
  it('returns true when token matches', () => {
    const env = createMockEnv({ MOLTBOT_GATEWAY_TOKEN: 'secret123' });
    expect(validateGatewayToken('secret123', env)).toBe(true);
  });

  it('returns false when token does not match', () => {
    const env = createMockEnv({ MOLTBOT_GATEWAY_TOKEN: 'secret123' });
    expect(validateGatewayToken('wrong', env)).toBe(false);
  });

  it('returns false when MOLTBOT_GATEWAY_TOKEN is not set', () => {
    const env = createMockEnv();
    expect(validateGatewayToken('any-token', env)).toBe(false);
  });
});

describe('createAccessMiddleware', () => {
  let createAccessMiddleware: typeof import('./middleware').createAccessMiddleware;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('./middleware');
    createAccessMiddleware = module.createAccessMiddleware;
  });

  function createFullMockContext(options: {
    env?: Partial<MoltbotEnv>;
    authHeader?: string;
  }): { c: Context<AppEnv>; jsonMock: ReturnType<typeof vi.fn>; htmlMock: ReturnType<typeof vi.fn>; setMock: ReturnType<typeof vi.fn> } {
    const headers = new Headers();
    if (options.authHeader) {
      headers.set('Authorization', options.authHeader);
    }

    const jsonMock = vi.fn().mockReturnValue(new Response());
    const htmlMock = vi.fn().mockReturnValue(new Response());
    const setMock = vi.fn();

    const c = {
      req: {
        header: (name: string) => headers.get(name),
        raw: { headers },
      },
      env: createMockEnv(options.env),
      json: jsonMock,
      html: htmlMock,
      set: setMock,
    } as unknown as Context<AppEnv>;

    return { c, jsonMock, htmlMock, setMock };
  }

  it('allows access with valid gateway token', async () => {
    const { c, setMock } = createFullMockContext({
      env: { MOLTBOT_GATEWAY_TOKEN: 'secret123' },
      authHeader: 'Bearer secret123'
    });
    const middleware = createAccessMiddleware({ type: 'json' });
    const next = vi.fn();

    await middleware(c, next);

    expect(next).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith('accessUser', { email: 'gateway@wizard', name: 'Gateway Token' });
  });

  it('returns 401 JSON error when gateway token is invalid', async () => {
    const { c, jsonMock } = createFullMockContext({
      env: { MOLTBOT_GATEWAY_TOKEN: 'secret123' },
      authHeader: 'Bearer wrong-token'
    });
    const middleware = createAccessMiddleware({ type: 'json' });
    const next = vi.fn();

    await middleware(c, next);

    expect(next).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' }),
      401
    );
  });

  it('returns 401 HTML error when gateway token is missing', async () => {
    const { c, htmlMock } = createFullMockContext({
      env: { MOLTBOT_GATEWAY_TOKEN: 'secret123' }
    });
    const middleware = createAccessMiddleware({ type: 'html' });
    const next = vi.fn();

    await middleware(c, next);

    expect(next).not.toHaveBeenCalled();
    expect(htmlMock).toHaveBeenCalledWith(
      expect.stringContaining('Unauthorized'),
      401
    );
  });

  it('returns 401 when no gateway token configured', async () => {
    const { c, jsonMock } = createFullMockContext({
      env: {},
      authHeader: 'Bearer any-token'
    });
    const middleware = createAccessMiddleware({ type: 'json' });
    const next = vi.fn();

    await middleware(c, next);

    expect(next).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' }),
      401
    );
  });
});
