---
description: Review security risks: secrets, auth, permissions, tenant isolation, CORS, env config, and clinical data exposure.
agent: code-review
subtask: true
---

Use a todo list because this is a multi-area security review.

Perform a security-focused review for: $ARGUMENTS

Focus areas:
- Secrets and accidental credential exposure.
- Hardcoded API URLs, IPs, ports, domains, tokens, or keys.
- Django `DEBUG`, `ALLOWED_HOSTS`, CORS, CSRF, JWT settings, and permissions.
- DRF serializers/viewsets that allow spoofing user, tenant, role, audit metadata, or ownership.
- Tenant isolation leaks through querysets, filters, nested objects, or writable foreign keys.
- Frontend/mobile exposure of sensitive data or unsafe environment handling.
- Docker/deployment risks and public service exposure.

Rules:
- Do not read real `.env` files or secrets.
- Findings first, ordered by severity.
- Include file and line references when possible.
- If no finding is found, say so and list residual testing gaps.

Deliver:
- Severity-ordered findings.
- Evidence and affected files.
- Recommended fixes.
- Tests or checks that should validate the fixes.
