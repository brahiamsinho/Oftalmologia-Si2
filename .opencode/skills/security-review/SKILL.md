---
name: security-review
description: Review secrets, environment handling, auth, permissions, tenant isolation, CORS, JWT, audit logs, and clinical data exposure risks.
license: MIT
compatibility: opencode
metadata:
  project: oftalmologia-si2
  workflow: security
---

# Security Review Skill

Use this skill when reviewing backend, frontend, mobile, Docker, deployment, auth, roles, tenant isolation, or clinical data handling.

## Checklist

- No real `.env`, credentials, tokens, private keys, or production secrets are read or printed.
- No hardcoded API URLs, IPs, ports, domains, tokens, or credentials.
- Django `DEBUG`, `ALLOWED_HOSTS`, CORS, CSRF, JWT, and secret settings are environment-driven.
- DRF permissions are explicit for sensitive endpoints.
- Querysets are scoped by user role and tenant where required.
- Serializers do not allow clients to spoof tenant, user, role, audit fields, or ownership.
- Mutations of sensitive clinical data are audited in bitacora when consistent with existing modules.
- Frontend/mobile do not expose protected data or duplicate backend business rules as the only validation layer.
- Docker/VM deployment does not expose databases or internal services unnecessarily.

## Workflow

1. Use a todo list for any non-trivial security review.
2. Review findings by severity: critical, high, medium, low.
3. Prefer concrete file/line evidence.
4. Recommend the smallest safe fix.
5. Include validation tests or commands.

## Output Format

Findings first:
- Severity.
- File/line.
- Risk.
- Why it matters.
- Recommended fix.
- Test/validation.

If no issues are found, state that explicitly and list residual risks.
