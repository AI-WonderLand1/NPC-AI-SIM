## Summary

Describe what changed and why.

## Verification

List the commands or manual checks used to verify the change.

## Trust and security checklist

- [ ] No passwords, API keys, tokens, private keys, customer data, or production credentials are included.
- [ ] `npm run build` passes for application changes.
- [ ] `npm run verify:cognition` passes for cognition/runtime changes.
- [ ] Memory-service changes pass `python3 -m py_compile memory_service/app.py`.
- [ ] Authentication/authorization implications were reviewed for protected API or user-scoped changes.
- [ ] Model output remains advisory and authoritative actions are validated outside the model.
- [ ] User-controlled input, uploads, URLs, and tool/runtime actions are safely handled where applicable.
- [ ] Documentation/config examples were updated when behavior or configuration changed.

## Risk / rollback

Describe deployment risk, compatibility impact, and rollback steps if applicable.
