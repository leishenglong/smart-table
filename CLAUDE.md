# gstack

## Web Browsing

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

## Available Skills

- `/office-hours` - Startup diagnostic and builder brainstorm
- `/plan-ceo-review` - Product strategy and direction review
- `/plan-eng-review` - Engineering architecture and approach review
- `/plan-design-review` - Design review before implementation
- `/plan-devex-review` - Developer experience review
- `/design-consultation` - Design system consultation from scratch
- `/design-shotgun` - Visual design exploration
- `/design-html` - HTML design implementation
- `/design-review` - Design audit with fix loop
- `/review` - PR review
- `/ship` - Ship workflow
- `/land-and-deploy` - Merge, deploy, and verify
- `/canary` - Post-deploy monitoring loop
- `/benchmark` - Performance regression detection
- `/browse` - Headless browser for web interactions
- `/connect-chrome` - Connect to Chrome browser
- `/qa` - QA testing with browser automation
- `/qa-only` - Report-only QA without fixes
- `/setup-browser-cookies` - Setup browser cookies for authentication
- `/setup-deploy` - One-time deploy configuration
- `/retro` - Retrospective analysis
- `/investigate` - Systematic root-cause debugging
- `/document-release` - Post-ship documentation updates
- `/codex` - Multi-AI second opinion via OpenAI Codex
- `/cso` - OWASP Top 10 + STRIDE security audit
- `/autoplan` - Auto-review pipeline: CEO → design → eng
- `/devex-review` - Developer experience review
- `/careful` - Careful mode for sensitive operations
- `/freeze` - Freeze current state
- `/guard` - Guard rails for safe operation
- `/unfreeze` - Unfreeze previously frozen state
- `/gstack-upgrade` - Upgrade gstack to latest version
- `/learn` - Learning and documentation skill

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
