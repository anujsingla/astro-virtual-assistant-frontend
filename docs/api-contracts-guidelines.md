# API Contracts Guidelines

## AI Client Architecture

This app integrates multiple AI backends through a uniform client interface. All clients implement `IAIClient` from `@redhat-cloud-services/ai-client-common`.

### Client Stack

```
UniversalChatbot (UI)
    └── StateManager (from ai-client-state)
        └── IAIClient implementation (per-service)
            └── REST API (per-service backend)
```

### Available Clients

| Client | Package | Backend URL Pattern |
|--------|---------|-------------------|
| VA | Custom (`src/aiClients/vaClient.ts`) | `/api/virtual-assistant-v2/v2/talk` |
| ARH | `@redhat-cloud-services/arh-client` | `https://access.redhat.com` (prod) / `access.stage.redhat.com` (stage) |
| RHEL Lightspeed | `@redhat-cloud-services/rhel-lightspeed-client` | `window.location.origin + /api/lightspeed/v1` |
| OAI | Loaded dynamically via Scalprum | Provided by `assistedInstallerApp` |

## StateManagerConfiguration

Each AI service provides a `StateManagerConfiguration` object with:

```typescript
interface StateManagerConfiguration<T extends IAIClient> {
  model: Models;                    // Enum value identifying the service
  historyManagement: boolean;       // Whether the service manages conversation history
  streamMessages: boolean;          // Whether the service supports streaming responses
  modelName: string;                // Display name
  selectionTitle: string;           // Title shown in model selector dropdown
  selectionDescription: string;     // Description shown in model selector
  Component: React.ComponentType;   // UI component to render
  stateManager: StateManager<T>;    // Created via createClientStateManager()
  docsUrl?: string;                 // Link to service documentation
}
```

## Manager Registration Order

Managers are registered in `src/aiClients/useStateManager.ts`. The **first** enabled manager becomes the default. Order matters:

1. ARH (Ask Red Hat)
2. RHEL Lightspeed
3. VA (Virtual Assistant)
4. OAI (OpenShift Assisted Installer) — dynamically loaded

When adding a new service, place it in the `stateManagers` array at the desired priority position.

## VA Client API Contract

The VA backend (`/api/virtual-assistant-v2/v2/talk`) accepts:

```typescript
POST /api/virtual-assistant-v2/v2/talk
Headers: Authorization: Bearer <token>
Body: { message: string, session_id?: string }
```

Responses include typed payloads: `text`, `options` (buttons), `commands` (actions like redirect), and `pause` (typing indicator).

## Adding a New AI Service

Follow the steps in [ONBOARDING_GUIDE.md](../ONBOARDING_GUIDE.md):

1. Implement `IAIClient` — preferably in the [ai-web-clients](https://github.com/RedHatInsights/ai-web-clients) monorepo
2. Create an auth hook (`useYourServiceAuthenticated`)
3. Create a manager hook returning `StateManagerConfiguration`
4. Add the model to `Models` enum in `src/aiClients/types.ts`
5. Register in `src/aiClients/useStateManager.ts`

## Response Handling

- **Streaming**: Supported via `streamMessages: true`. The state manager handles chunked responses
- **History**: If `historyManagement: true`, the state manager tracks conversation turns
- **Errors**: Client errors surface as error messages in the chat UI. Never throw unhandled exceptions from client methods

## Environment-Specific URLs

- Stage: `access.stage.redhat.com` for ARH
- Prod: `access.redhat.com` for ARH
- The environment is detected automatically — do not hardcode environment-specific URLs in client code. Use configuration or Chrome context
