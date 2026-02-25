# Agents & AI Context

Documentation for AI agents and humans working on Open Lingo. Provides shared context to reduce duplicate exploration and ensure consistent decisions.

## Structure

```
docs/agents/
├── README.md           # This file
└── basecontext/        # Foundational context docs
    ├── FRONTEND_CONTEXT.md   # Frontend architecture, theme system, UI patterns
    └── AUTH_STRATEGY.md      # Auth & session architecture (planned)
```

## Base Context

Base context docs cover system-wide concerns that affect multiple features:

- **FRONTEND_CONTEXT** – Theme strategy, design tokens, shared components, layout patterns
- **AUTH_STRATEGY** – Token refresh, device sessions, multi-device sync, logout invalidation

## Usage

- Reference these docs when starting a new task or agent session
- Update them when architecture changes
- Keep content concise; link to code and other docs for details
