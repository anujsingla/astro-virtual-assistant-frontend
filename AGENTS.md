# AI Agent Guide — Astro Virtual Assistant Frontend

This document provides guidance for AI agents working in this repository. For Claude Code specifically, see [CLAUDE.md](./CLAUDE.md) which imports this file.

## Project Overview

**Chameleon** (astro-virtual-assistant-frontend) is a federated React application that provides a unified chatbot interface for multiple AI agents in Red Hat's Hybrid Cloud Console (HCC). It uses PatternFly 6, Scalprum (module federation), and a multi-client architecture to let users switch between AI services (Ask Red Hat, RHEL Lightspeed, Virtual Assistant, HCC AI).

This is a **temporary solution** that will be replaced by a unified AI routing service. See [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) for the full context.

## Documentation Index

| Document | Purpose |
|----------|---------|
| [docs/testing-guidelines.md](./docs/testing-guidelines.md) | Jest and Cypress testing patterns, mocking strategy |
| [docs/security-guidelines.md](./docs/security-guidelines.md) | Authentication, token handling, feature flags |
| [docs/api-contracts-guidelines.md](./docs/api-contracts-guidelines.md) | AI client architecture, StateManagerConfiguration, APIs |
| [docs/error-handling-guidelines.md](./docs/error-handling-guidelines.md) | Error patterns, silent degradation, logging |
| [docs/integration-guidelines.md](./docs/integration-guidelines.md) | Module federation, Chrome context, deployment |
| [docs/VAEmbed.md](./docs/VAEmbed.md) | VAEmbed component usage and customization |
| [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) | How to integrate a new AI agent into Chameleon |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | High-level architecture (Webpack, PatternFly, routing) |

## Project Structure

```
src/
├── aiClients/          # AI client manager hooks and types
│   ├── types.ts        # Models enum, StateManagerConfiguration, ClientAuthStatus
│   ├── useStateManager.ts  # Central manager registry (controls which services appear)
│   ├── useArhClient.ts     # Ask Red Hat integration
│   ├── useRhelLightSpeedManager.ts
│   ├── useVaManager.ts
│   └── vaClient.ts     # Custom VA client implementation
├── api/                # Direct API call functions (feedback, service accounts)
├── assets/             # SVG icons and images
├── Components/         # Feature-specific UI components
│   ├── ARHClient/      # Ask Red Hat custom components (feedback, quota)
│   ├── UniversalChatbot/  # Core chatbot UI (header, messages, footer, selection)
│   └── VAClient/       # VA-specific components
├── SharedComponents/   # Module federation entry points (exposed via Scalprum)
│   ├── AstroVirtualAssistant/  # Portal-based overlay (main entry)
│   └── VAEmbed/        # Inline embedded variant
├── types/              # TypeScript type definitions
└── utils/              # Singleton state management
```

## Key Conventions

### Component Organization

- **SharedComponents/**: Entry points exposed via module federation. Stable API required — changes here affect all consumer apps.
- **Components/**: Internal UI components. Per-service subdirectories (ARHClient, VAClient) for service-specific customizations.
- **aiClients/**: One file per AI service. Each exports an auth hook and a manager hook.

### Naming Conventions

- Components: PascalCase directories and files (`UniversalChatbot/UniversalChatbot.tsx`)
- Hooks: `use` prefix (`useArhClient.ts`, `useStateManager.ts`)
- Types: PascalCase interfaces, enums in `types.ts` files
- CSS: SASS files colocated with components, scoped under `.virtualAssistant` prefix

### State Management

- Global state via singleton pattern (`VirtualAssistantStateSingleton.ts`)
- AI conversation state via `@redhat-cloud-services/ai-client-state` and `ai-react-state`
- No Redux for new code — the redux dependencies are legacy
- Prefer `useVirtualAssistant()` hook over individual hooks for new code

### Adding a New AI Service

1. Create auth hook + manager hook in `src/aiClients/`
2. Add model to `Models` enum in `src/aiClients/types.ts`
3. Register in `src/aiClients/useStateManager.ts`
4. Manager array order determines default selection priority
5. See [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) for full details

### CSS Rules

- All custom styles must use `.virtualAssistant` prefix (configured in `fec.config.js`)
- Use PatternFly 6 utility classes (`pf-v6-u-*`) for layout and spacing
- Do not use global CSS selectors — they leak into other federated apps
- SCSS files live alongside their components

### TypeScript

- Strict mode enabled
- Use `ts-patch` with `@redhat-cloud-services/tsc-transform-imports` for import transforms
- Prefer `interface` over `type` for object shapes
- Export types from `types.ts` files in each feature directory

## Common Pitfalls

- **Manager order matters**: The first enabled manager in `useStateManager.ts` becomes the default chatbot. Reordering changes what users see first.
- **Scalprum hook loading**: Always handle `loading` and `error` states when consuming remote hooks via `useRemoteHook`.
- **Token refresh**: Always call `chrome.auth.getToken()` per request — never cache tokens.
- **SASS prefix**: Forgetting `.virtualAssistant` prefix causes style leaks across federated modules.
- **Redux is legacy**: Despite redux dependencies in package.json, new features should use the singleton state pattern or ai-client-state hooks.
- **Testing mocks**: The `src/__mocks__/` directory auto-mocks several packages. If tests behave unexpectedly, check if an auto-mock is interfering.

## PR Expectations

- All tests must pass (`npm test` and `npm run cypress:run:cp`)
- Lint must pass (`npm run lint`)
- Build must succeed (`npm run build`)
- New hooks and utilities should have Jest tests
- New UI components should have Cypress component tests
- Changes to exposed modules (SharedComponents/) require extra scrutiny — they are the public API
