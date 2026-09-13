# Contributing to NPC-AI-SIM

Thanks for helping improve NPC-AI-SIM.

NPC-AI-SIM is a publicly viewable, source-available AI WONDERLAND INNOVATION project. The repository's `LICENSE` controls how the code may be used. Public visibility does not grant rights beyond that license.

## Before making changes

- Read `README.md`, `NPC_SYSTEM_SPEC.md`, and the relevant implementation notes.
- Search existing issues and pull requests before creating parallel architecture.
- Keep NPC cognition/runtime contracts versioned and explicit.
- Treat model output as advisory. Do not move authoritative game/runtime decisions into unvalidated model output.
- Do not commit real secrets, provider keys, private user data, or production `.env` files.

## Local setup

```bash
git clone https://github.com/AI-WonderLand1/NPC-AI-SIM.git
cd NPC-AI-SIM
npm install
cp .env.example .env
```

For changes that affect the application, verify at least:

```bash
npm run build
npm run verify:cognition
```

For memory-service changes, also verify Python syntax:

```bash
python3 -m py_compile memory_service/app.py
```

## Pull requests

Keep pull requests focused. Describe what changed, why it changed, how it was verified, and any compatibility or security implications.

Changes involving authentication, provider credentials, memory, uploads, networking, tool/runtime actions, or user-scoped data should explicitly describe authorization and failure behavior.

## Security issues

Do not open a public issue for an exploitable vulnerability. Follow `SECURITY.md` and use GitHub private vulnerability reporting or `security@dreammakerhub.website`.

## License

By submitting a contribution, you represent that you have the right to submit it and that the contribution may be incorporated into this project subject to the repository's licensing and contribution terms.
