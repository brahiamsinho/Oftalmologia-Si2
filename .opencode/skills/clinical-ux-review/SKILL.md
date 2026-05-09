---
name: clinical-ux-review
description: Review web and mobile UX for ophthalmology workflows, accessibility, responsive behavior, forms, feedback states, and reusable UI patterns.
license: MIT
compatibility: opencode
metadata:
  project: oftalmologia-si2
  workflow: ux
---

# Clinical UX Review Skill

Use this skill when reviewing or implementing UI/UX in the Next.js dashboard or Flutter mobile app.

## Review Focus

- Clinical clarity: users should understand what action they are taking and what patient/context is affected.
- Accessibility: labels, focus, keyboard support, contrast, semantic HTML, readable text, and touch targets.
- Responsive behavior: desktop, tablet, and mobile layout should not hide critical actions.
- Feedback states: loading, empty, error, success, disabled, permission-denied, and validation states.
- Form quality: clear labels, required fields, error placement, backend error display, and no hidden submit buttons.
- Reusability: repeated cards, modals, tables, forms, or state patterns should become reusable components when useful.

## Workflow

1. Use a todo list when reviewing multiple screens/components.
2. Identify the user role: paciente, medico, especialista, administrativo, or admin.
3. Map the flow: screen, action, API call, response, UI feedback.
4. Check both happy path and error/empty states.
5. Recommend the smallest reusable improvement.

## Output

- UX problem.
- User impact.
- Recommended fix.
- Accessibility notes.
- Responsive notes.
- Reusability/componentization opportunity.
