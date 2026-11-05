# Orbi Search

A Vue search component with mock data.

This is a frontend spike: a place to explore interaction and establish a component foundation before
connecting it to a real application. Search responses come from a local fixture service. There is no
production search backend or GraphQL schema in this repository.

## Explore the playground

- Open search with the launcher or Cmd/Ctrl+K.
- Search across 32 sample documents, decisions, links, notes, issues, and design files.
- Narrow a query with scope chips and compare provider-supplied counts.
- Read previews, inspect source locations, and open supplied destinations.
- Try slow, empty, error, and missing-preview scenarios.
- Switch appearance and language to inspect light/dark and English/German layouts.

Try **design → Decisions** to narrow results, **canary** to match preview content, or
**release checklist → Links** to exercise empty-state recovery.

Mock result destinations use external URLs, including example.com placeholders.

## Run locally

Use a compatible Node.js and pnpm installation, or the versions selected by mise.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. For component examples:

```sh
pnpm storybook
```

## Component boundary

The palette accepts an injected SearchService. The host supplies scopes, context, translated labels,
and navigation behavior. A headless Vue composable owns requests, cancellation, selection, and retry;
Vue components own rendering, focus, scrolling, and motion.

In a real project, implement the service with the application's existing client and map its responses
to the component contract. GraphQL, authentication, indexing, and ranking remain outside the reusable UI.

See the [component usage guide](src/features/search-palette/README.md) for the API and integration details.

## Development checks

```sh
pnpm typecheck
pnpm lint:check
pnpm build
pnpm test:run
pnpm test:storybook
```

Install browsers before running browser tests:

```sh
pnpm exec playwright install
pnpm e2e
```

The suite covers request races, scopes, previews, keyboard and touch interactions, responsive layouts,
and automated accessibility checks. Real-device assistive technology testing remains a manual step.

## Project notes

- [Project scope and contributor/agent guidance](docs/README.md)
- [Search palette plan](docs/search-palette-plan.md)
- [Scope-chip interactions](docs/scope-chips-plan.md)
- [Architecture decisions](docs/adr/)
- [Shared styling foundation](src/app/styles/README.md)

Library distribution packaging, production backend integration, and more advanced search features are
future work. The playground and the reusable component remain separate so either can evolve.
