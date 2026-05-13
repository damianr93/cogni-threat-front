# Contributing

Thank you for helping improve CogniThreat.

## Quick Path

1. Open an issue for bugs, features, or larger refactors before implementing.
2. Fork the repository and create a focused branch.
3. Run the relevant checks before opening a pull request.

```bash
corepack enable
pnpm install
pnpm run build
pnpm run lint
```

## Development Setup

Use the backend repository for the full-stack Docker path:

```bash
cd ../cogni-threat
cp .env.template .env
docker compose up --build
```

For frontend-only development, run `pnpm run dev`. The dev server proxies `/api` to the backend.

## Pull Request Guidelines

- Keep changes small and reviewable.
- Include tests or a clear manual verification note for behavior changes.
- Preserve the existing MUI and shared surface patterns unless the change is explicitly redesigning them.
- Update documentation when commands, environment variables, or deployment behavior changes.

## Code of Conduct

Be respectful, constructive, and security-conscious. The goal is a useful community threat-intelligence platform, not winning arguments.
