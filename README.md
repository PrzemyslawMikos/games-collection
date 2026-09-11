# Kolekcja Gier

Polish, offline-first web application for tracking a physical video game collection.

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm test
npm run test:e2e
npm run build
npm run lint
```

## Data model

- `Game` is a canonical title with aliases and general notes.
- `GameEntry` represents an actual physical platform/version copy. It contains price, purchase date, condition, completion, and entry notes.
- `GamePlan` represents a planned or ordered acquisition and can be converted into a `GameEntry`.

The browser keeps the working copy in IndexedDB. GitHub synchronization writes versioned `collection.json` data to a separate private repository on its `data` branch. The Pages bundle never contains collection data.

## GitHub setup

The deployed app is intentionally a public static shell. Keep collection data private by:

1. Creating a separate private repository for the collection data.
2. Creating a GitHub App with repository-only Contents read/write access and enabling its device flow.
3. Installing the App only on the private data repository.
4. Deploying `worker/github-auth-proxy.ts` to a free Cloudflare Worker and setting its `ALLOWED_ORIGINS` variable to the local and Pages origins.
5. Adding `APP_CLIENT_ID`, `AUTH_PROXY_URL`, `DATA_REPOSITORY_OWNER`, and `DATA_REPOSITORY_NAME` as Actions secrets. GitHub reserves secret names beginning with `GITHUB_`.
6. Renaming the deployment branch to `master` and manually running `.github/workflows/deploy.yml` from that branch.

The private data repository must have a `data` branch. Create it in the repository's **Branches → New branch** screen before the first sync; it can point to the repository's initial commit and does not need `collection.json` yet. The first successful sync creates `collection.json` on that branch. If the branch already contains a file, the app requires an explicit remote load before replacing it, preventing an accidental overwrite.

GitHub's device-flow endpoints do not allow browser CORS. Local development uses the Vite proxy automatically. The deployed Pages app uses the Cloudflare Worker proxy only for `/login/device/code` and `/login/oauth/access_token`; it does not store tokens, private keys, or collection data. Deploy it with `npx wrangler deploy` after setting the production Pages origin in `wrangler.toml`.

Copy `.env.example` to `.env.local` for local development. The client ID and repository coordinates are public configuration; never put a personal access token or GitHub App private key in the frontend.

## Workbook migration

Use **Import i kopie** in the app to select `Kolekcja Gier V2.xlsm`. The import shows a review preview before replacing local data. Owned rows become physical entries; blank rows become planned acquisitions; `W drodze` becomes an ordered plan. Blue and orange row fills are mapped to sealed and used where the row is owned, while ambiguous non-owned colored rows are flagged for review.
