# Antigravity / AI Agent Setup

1. Copy `AGENTS.md` and `.agent/` to the root of the Deshal ERP repository.
2. Ask the agent to begin every major feature with a repository audit, not implementation.
3. For CRM work, explicitly load:
   - `.agent/skills/crm/SKILL.md`
   - `.agent/skills/ux-ui/SKILL.md`
   - `.agent/skills/security/SKILL.md`
   - `.agent/skills/testing/SKILL.md`
   - `.agent/skills/database/SKILL.md`
4. Require the agent to follow `.agent/workflows/feature-development.md`.
5. Require a final report using `.agent/templates/task-report.md`.

## Recommended first prompt to the agent
Read `AGENTS.md` and all relevant files under `.agent/context/`. Inspect the current repository and produce a factual implementation baseline. Do not change code yet. Compare the current CRM implementation against the target CRM lifecycle documented in `.agent/context/product.md`. Return: current assets, gaps, reuse opportunities, migration risks, proposed data model, implementation phases, and acceptance criteria.
