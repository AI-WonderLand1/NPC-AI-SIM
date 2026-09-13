# Security Policy

NPC-AI-SIM is developed by **AI WONDERLAND INNOVATION** and is under active development.

## Supported versions

Security fixes are applied to the latest supported `main` branch and the production deployment built from it. Older development branches and abandoned builds are not independently supported.

## Reporting a vulnerability

Do **not** report exploitable vulnerabilities, credentials, private user data, or working attack details in a public issue or discussion.

Preferred reporting paths:

1. Use GitHub private vulnerability reporting for this repository when available.
2. Otherwise email **security@dreammakerhub.website**.

Include the affected commit or deployment if known, the affected endpoint/component, impact, reproduction steps, and a minimal proof of concept when necessary. Redact real credentials and user data.

## Security-sensitive areas

Reports are especially useful when they involve:

- authentication or authorization bypass;
- AI-provider credential exposure or BYOK leakage;
- unsafe model/tool output handling;
- prompt or tool-call injection that crosses an authorization boundary;
- file/model upload parsing, path traversal, or stored XSS;
- API rate-limit bypass or resource exhaustion;
- cross-user NPC memory or project access;
- unsafe runtime action execution;
- SSRF, command injection, SQL/NoSQL injection, or remote code execution;
- WebSocket/runtime bridge authorization;
- memory-service exposure or insecure MongoDB/Mem0 configuration;
- secrets exposed through logs, browser bundles, errors, or repository history.

## AI/runtime boundary

Model output is advisory and must not be treated as proof that an action is authorized or executed. The authoritative runtime is expected to validate allowed actions, ownership, capability scope, and relevant game/application state before execution.

## Secrets

Do not commit real provider keys, database credentials, tokens, private keys, or production `.env` files. `.env.example` must contain placeholders only. Provider credentials should remain server-side wherever practical.

## Current hardening status

The repository is actively being hardened. The README documents known production limitations, including authentication/entitlement work that is not yet complete. Security documentation should not be read as a claim that every possible control is already implemented.
