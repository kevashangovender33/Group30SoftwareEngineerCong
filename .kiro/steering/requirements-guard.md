# Requirements Guard

## Purpose

Before implementing any feature, change, or addition, always compare the request against the project requirements defined in `#[[file:docs/requirements.md]]`.

## Rules

1. **Cross-reference first** — When asked to build or modify functionality, check whether the request aligns with an existing requirement (REQ-001 through REQ-021). If it maps to one or more requirements, proceed with implementation.

2. **Ask when unclear** — If a request does not clearly map to any documented requirement, or conflicts with one, stop and ask the user for clarification before making changes. Do not assume intent.

3. **Ask when extending scope** — If a request would add functionality beyond what the requirements describe (new payment types, additional data sources, external integrations, etc.), confirm with the user that this is intentional before proceeding.

4. **Respect constraints** — REQ-001 explicitly restricts the system to localized mock data with no external integrations. Any request that appears to violate this constraint must be flagged and confirmed with the user.

5. **Cite the requirement** — When implementing a feature, reference the relevant REQ identifier(s) so there is traceability between code and requirements.
