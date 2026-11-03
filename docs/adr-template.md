# ADR-<NNNN>: <Short decision title>

<!-- Copy to docs/adr/adr-NNNN-short-decision-title.md. Use one ADR per significant decision.
     Keep it concise; remove optional sections that add no value.
     Once accepted, preserve the rationale. Record a changed decision in a new ADR
     and link it here rather than rewriting the original decision. -->

| Field           | Value                                 |
| --------------- | ------------------------------------- |
| Status          | Proposed                              |
| Date            | YYYY-MM-DD                            |
| Decision makers | <People responsible for the decision> |
| Related ADRs    | <Links, or None>                      |
| Supersedes      | <Link to an earlier ADR, or None>     |
| Superseded by   | <Link to a later ADR, or None>        |

<!-- Status: Proposed, Accepted, Rejected, Deprecated, or Superseded.
     Deprecated means no longer applicable; Superseded means replaced by another ADR. -->

## Context and problem

<What needs to be decided, why now, and what happens if we do nothing?
Describe the relevant current architecture, requirements, and constraints.>

## Decision drivers

<!-- List the criteria that matter, in priority order. Make constraints measurable where possible. -->

- <Driver or constraint, e.g. deployment complexity, team expertise, latency, or budget>
- <Driver or constraint>
- <Driver or constraint>

## Options considered

<!-- Include keeping the current approach when it is a realistic option. -->

| Option                         | Advantages | Disadvantages / risks   |
| ------------------------------ | ---------- | ----------------------- |
| A: <Option>                    | <Benefits> | <Costs and limitations> |
| B: <Option>                    | <Benefits> | <Costs and limitations> |
| C: <Option / current approach> | <Benefits> | <Costs and limitations> |

## Decision

We will **<chosen approach>** for **<scope>**.

<Explain how this satisfies the most important drivers and why it is preferable
to the alternatives. State the trade-offs we deliberately accept.>

## Consequences

### Benefits

- <Expected improvement>

### Costs and drawbacks

- <Ongoing cost, complexity, limitation, or dependency we accept>

### Risks and mitigations

- **<Risk>:** <How we will reduce or monitor it>

## Implementation and validation (optional)

<!-- Link to delivery work; keep the ADR focused on the decision and its rationale. -->

- **Implementation:** <Issue / pull request / migration plan>
- **Validation:** <Evidence or measurable criteria that will show the decision works>
- **Rollback or exit strategy:** <How to reverse or migrate away, if relevant>

## Review triggers (optional)

<What concrete change would justify revisiting this decision? For example,
traffic exceeding a threshold, a cost increase, or a new product requirement.>

## References (optional)

- <Link to supporting research, a prototype, benchmark, or discussion>
