import createClient, { type Client, type Middleware } from 'openapi-fetch';

import type { paths } from './types';

/** A fully-typed client for the CROSSUB mobile contract (the /api/v1 facades). */
export type CrossubClient = Client<paths>;

export interface CrossubClientOptions {
  /**
   * Base URL for the API. Defaults to `/api/v1` — the server declared by the mobile
   * contract. In the mobile apps this is a browser-relative path that the BFF proxy
   * (`app/api/[...path]/route.ts`) forwards to `<API_INTERNAL_URL>/api/v1`.
   */
  baseUrl?: string;
  /**
   * Returns the current bearer access token (from `POST /auth/login`), or a falsy
   * value when unauthenticated. Attached as `Authorization: Bearer <token>` on every
   * request. May be sync or async.
   */
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** Headers merged into every request. */
  headers?: Record<string, string>;
  /**
   * Fetch `credentials` mode applied to every request. Use `'include'` for the
   * web-based mobile apps that authenticate with the same-origin httpOnly session
   * cookie via their BFF proxy (no bearer token needed).
   */
  credentials?: RequestCredentials;
  /** Custom fetch implementation (e.g. for server components / tests). */
  fetch?: typeof globalThis.fetch;
}

/**
 * Create a typed openapi-fetch client bound to the CROSSUB mobile contract. Every
 * path, param, body and response is checked against `openapi.mobile.json`, so a
 * backend change that breaks a client surfaces as a TypeScript error here.
 */
export function createCrossubClient(
  options: CrossubClientOptions = {},
): CrossubClient {
  const { baseUrl = '/api/v1', getAccessToken, headers, credentials, fetch: fetchImpl } =
    options;

  const client = createClient<paths>({ baseUrl, headers, credentials, fetch: fetchImpl });

  if (getAccessToken) {
    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        const token = await getAccessToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
        return request;
      },
    };
    client.use(authMiddleware);
  }

  return client;
}
