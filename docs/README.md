# Project scope

This project explores a macOS-inspired search palette for web applications: a focused overlay that
helps people find, recognize, preview, and open content without losing their place in the application.

This document is the working entry point for contributors and coding agents. The root
[README](../README.md) serves as the public GitHub introduction. The scope below describes our current
direction; it is not a fixed backlog or a commitment to a particular design or implementation.

## Goals

- Make searching and opening content quick with both keyboard and pointer interaction.
- Help users recognize the right result through previews, context, and clear source locations.
- Support different kinds of content through a consistent search experience.
- Explore useful interactions that go beyond a list of links while keeping the interface focused.
- Build a frontend component that can later connect to a real search backend.
- Make the component reusable across the maintainer's Vue projects as part of their own Vue component
  library, with a public API independent of this demo application's providers.

## Intended capabilities

We intend to implement the following capabilities, with their exact behavior and delivery order refined
as we build:

- **Open and navigate:** A keyboard shortcut and visible trigger open the palette. Users can navigate,
  select, and dismiss it with predictable focus behavior.
- **Search supplied context:** Present results across the content and sources supplied by the host
  application or mocked service.
- **Recognize results:** Show useful titles, excerpts, content types, and source or location details.
- **Preview content:** Let users inspect a result before opening it. Previews may include text,
  metadata, or supplied thumbnails, with a useful fallback when a preview is unavailable.
- **Open and act:** Open the provided destination from a result. Supporting actions, such as copying
  a link or opening a new tab, can be added where useful.
- **Guide discovery:** Offer suggestions and useful starting points, such as recent or pinned items.
- **Refine searches:** Allow users to narrow the search by source, content type, or another meaningful
  scope without making the interface cumbersome.
- **Handle real conditions:** Provide clear loading, empty, error, and unavailable-content states.
- **Support different users and devices:** Include accessible interaction, responsive layouts, and
  appropriate visual and motion preferences.

## Exploration areas

These ideas are candidates for making the experience more useful. They are not all required for the
first version:

- Preview the passage that matched a query and explain why a result appeared.
- Search within a selected item or collection.
- Explore related content without leaving the palette.
- Offer helpful refinements when a search reaches a dead end.
- Show freshness information for content and previews.
- Resume a previous search with its context intact.

We will prioritize ideas that help users find, understand, or open content. The project does not need
to become a general-purpose launcher or assistant.

## Frontend and mock boundary

The frontend owns presentation and interaction: query input, selection, scope controls, preview
display, navigation, and local interface state.

A replaceable mocked service supplies search responses, including ordered results, suggestions,
preview content, and any relevance explanations or relationships. We are not implementing indexing,
ranking, or a search algorithm in the frontend. Fixtures should provide predictable scenarios for
developing and validating the component, including delays, failures, and responses arriving out of
order.

Website previews use supplied metadata and thumbnail assets in this project. Generating screenshots,
fetching arbitrary pages, and guaranteeing live embedded previews are outside the current scope.

## Out of scope

- A production search backend, crawling, indexing, or relevance algorithms.
- Live integrations with external content providers.
- Production authentication, authorization, or permission enforcement; the eventual backend must
  determine which content a user may receive.
- AI answer generation or other backend intelligence. Supplied suggestions and explanations can be
  demonstrated with mocks.

## Implementation guidance

Use the repository's existing Vue and TypeScript setup and follow its architecture conventions.
Keep the search experience separate from mock data so a future backend can replace the mock without
redesigning the interface. Avoid committing to a specific API shape, component library, shortcut, or
layout before implementation provides a reason to do so.

Validate meaningful user journeys with representative mocked content, including keyboard-only use,
opening destinations, inspecting previews, refining searches, and recovering from empty or failed
responses. Use the existing Storybook and testing tools where they help demonstrate or verify these
behaviors.

## Decisions and evolving scope

The [search palette implementation plan](search-palette-plan.md) describes the proposed delivery steps
and separation between behavior, presentation, and the mocked search service.

Update this document as the product direction changes. Keep detailed delivery tasks and implementation
choices out of this overview.

Record significant architectural decisions in `docs/adr/` using the
[ADR template](adr-template.md). Distinguish proposed decisions from accepted ones, and preserve the
rationale when a later ADR supersedes an earlier decision. Routine implementation choices do not need
an ADR.
