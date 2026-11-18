# Chargeblast Challenge

Next.js App Router starter with TypeScript, Tailwind CSS, Oxlint, Oxfmt, and Vitest with React Testing Library.

## Development

Use Node.js 24 (`nvm use`), then:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The home page lives in `src/app/page.tsx`.

## Commands

| Command                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run lint`         | Lint with Oxlint, including React, Next.js, and accessibility rules |
| `npm run lint:fix`     | Apply available lint fixes                                          |
| `npm run format`       | Format with Oxfmt                                                   |
| `npm run format:check` | Check formatting                                                    |
| `npm run typecheck`    | Generate Next.js route types and check TypeScript                   |
| `npm test`             | Run Vitest once                                                     |
| `npm run test:watch`   | Run Vitest in watch mode                                            |
| `npm run build`        | Build for production                                                |
| `npm start`            | Serve the production build                                          |

Tests are colocated as `src/**/*.test.ts` or `src/**/*.test.tsx`. Vitest uses jsdom, the `@/*` alias, and jest-dom matchers. Async Server Components need integration or end-to-end tests.

GitHub Actions runs separate lint/format, typecheck, and unit test jobs on pushes and pull requests. The lockfile is committed for reproducible installs.

## Deployment

Import this repository as a new Next.js project in Vercel with Node.js 24. Default build settings work; no environment variables are required. Project credentials and `.vercel/` stay outside version control.
