# @crossub-thongz/api-contract

The **single source of truth** for the CROSSUB mobile API: an OpenAPI 3 contract
generated from the live NestJS decorators, the TypeScript types derived from it, and a
typed [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) client. Every mobile app
(Tenant / Landlord / Contractor / Inspector / Agent) builds against this — no
hand-written, drift-prone API clients.

Two specs are generated:

- **`openapi.mobile.json`** — the mobile contract: only the `/api/v1` facades, served
  under a `/api/v1` server. **This drives the published types + client.**
- `openapi.json` — the full internal spec (staff + all routes), for reference and the
  later web migration.

## Install (mobile repos)

Published to **GitHub Packages** under the `@crossub-thongz` scope. In each consuming
repo add an `.npmrc`:

```
@crossub-thongz:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

then:

```bash
pnpm add @crossub-thongz/api-contract
```

## Use

```ts
import { createCrossubClient } from '@crossub-thongz/api-contract';

// baseUrl defaults to '/api/v1' (forwarded by each app's BFF proxy to the API).
const api = createCrossubClient({
  getAccessToken: () => store.accessToken, // the token from POST /auth/login
});

const { data, error } = await api.GET('/tenant/tenancies');
//      ^ fully typed from the contract
```

Raw types when you need them:

```ts
import type { paths, components } from '@crossub-thongz/api-contract';

type Tenancy = components['schemas']['TenantTenancyResponseDto'];
```

Paths are **facade-relative** — the `/api/v1` prefix lives in the server / `baseUrl`,
e.g. `/tenant/tenancies`, `/auth/login`, `/contractor/jobs/{jobId}/accept`.

## Regenerate

From the repo root, after any API change:

```bash
pnpm --filter @crossub/api contract           # → openapi.json + openapi.mobile.json + src/types.ts
pnpm --filter @crossub-thongz/api-contract build   # → dist (types + client)
```

Commit the regenerated specs whenever the API surface changes, so consumers can pin to
a known contract. Browse the live API at `/api/docs` (Swagger UI) / `/api/openapi.json`.
