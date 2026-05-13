# Security Policy

## Reporting a Vulnerability

Please do not open public issues for suspected vulnerabilities.

Send a private report to the maintainers with:

- Affected version or commit.
- Reproduction steps.
- Impact and affected data, if known.
- Any suggested mitigation.

The maintainers will acknowledge the report, investigate, and coordinate a fix before public disclosure when the issue is confirmed.

## Supported Versions

Until the first stable release, security fixes target the default branch.

## Frontend Security Notes

- Do not commit `.env` files or production build artifacts containing private configuration.
- Keep `VITE_API_URL` scoped to public API origins only.
- Report any XSS, auth-flow, token-storage, or access-control issue privately.
