# Rules and weights feature plan

## Goal

Implement the Rules tab and weighted comparison logic for a comparison.

The feature should let users:

- assign a weight to each comparable criterion
- define how a criterion impacts ranking
- review a total weight pool that must equal 100
- see ranking results based on weighted normalized values
- receive warnings when missing data may distort the result

## Scope

This feature covers:

- shared data contract
- backend rule persistence
- frontend Rules tab UI
- scoring engine for comparison ranking
- incomplete-data warning behavior

## Implementation order

### 1) Define the shared domain model

Create the shared schema first so frontend and backend use the same rules.

Required fields:

- comparison id
- criterion id
- criterion name
- criterion type
- is comparable
- weight
- rule config

Rule config by type:

- number: direction = higher | lower
- boolean: preferredValue = true | false
- enum: tier assignments, ordered from worst to best
- rating: scale, default 1–5, direction = higher | lower

Also define:

- weight pool total = 100
- all comparable criteria must total to 100
- missing value behavior = neutral

### 2) Add backend support for rule persistence

Implement API routes for:

- fetch rules for a comparison
- update criterion weight
- update criterion rule config
- list criteria with rule metadata
- save enum tier assignments

Important rules:

- total weight across comparable criteria must equal 100
- rule updates must validate the criterion type
- rule config must match the criterion type

### 3) Build the Rules tab UI

The first UI slice should allow:

- list criteria with name and weight
- weight input per criterion
- live total and remaining weight display
- open/edit a criterion config panel
- save rule updates

Minimal working interaction:

- criteria list
- per-criterion weight control
- rule type editor
- validation for total = 100

### 4) Add the scoring engine

Ranking should be computed per entry, not by pairwise comparison.

Algorithm:

- only comparable criteria participate in scoring
- for each criterion, gather all values for that criterion in the current comparison
- normalize each value to [0, 1] based on that criterion’s direction and current dataset
- treat missing values as neutral = 0.5
- multiply normalized score by the criterion weight
- sum weighted contributions per entry
- final score = sum(weight * normalizedScore)
- sort entries by final score descending

### 5) Numeric scoring formula

For a numeric criterion:

- higher is better:
  score = (value - min) / (max - min)
- lower is better:
  score = (max - value) / (max - min)

If min = max:

- all values should be treated as equal, usually 1

Missing values:

- neutral = 0.5

### 6) Boolean scoring formula

For boolean criteria:

- preferred value = 1
- other value = 0
- missing value = 0.5

### 7) Enum scoring formula

Each enum value belongs to a tier.

Tier order:

- 1 = Bad
- 2 = Okay
- 3 = Good
- 4 = Very Good
- 5 = Great

Convert tier rank to a normalized score:

- tierScore = tierRank / maxTier
- higher tiers are better
- values within the same tier are equal

### 8) Rating scoring formula

Rating uses a numeric scale, default 1–5.

Behavior:

- default scale = 1 to 5
- integer-only values
- higher is better by default
- user may reverse to lower is better
- missing value = 0.5

### 9) Add incomplete-data warning

Missing values can distort ranking if they are treated as neutral.

The UI should warn when:

- a comparable criterion has missing values
- the missing criterion has non-zero weight
- the missing data is likely to materially affect the result

Recommended warning behavior:

- comparison-level banner: "Incomplete data may distort ranking"
- row-level indicators for incomplete entries
- show the affected criteria and their weights in the warning text

### 10) Add tests

Test the following early:

- total weight equals 100
- number normalization: higher is better and lower is better
- boolean preferred value logic
- enum tier ordering and grouping
- rating normalization
- missing values = neutral
- ranking order for example datasets
- warning shows when missing data affects ranking

## Risks and known pitfalls

### Missing values are not the same as bad values

Missing data should not be treated as zero unless explicitly desired. For v1, neutral is safer and more understandable.

### Relative normalization depends on dataset

A value can be a strong score in one comparison and a weak score in another, because the normalization is relative to the current comparison set.

### Zero-weight criteria are silent contributors

A criterion with weight 0 effectively drops out of ranking. The UI should make this visible to avoid confusion.

### Text criteria are intentionally not comparable

Text is not part of ranking unless translated into an enum or other comparable type. This should be explicit in UX and docs.

## Recommended final behavior

The Rules feature should behave like a weighted decision engine where:

- the user defines how important each comparable criterion is
- each criterion defines how its values turn into a score
- each entry is scored independently
- entries are sorted by final weighted total
- incomplete data triggers a warning so the user knows the ranking may be less trustworthy

## Minimum v1 deliverable

The initial version should support:

- numeric criteria
- boolean criteria
- enum criteria with tiers
- rating criteria
- total weight validation = 100
- ranking based on weighted normalized values
- warning for missing data

This gives a clear, usable, and implementable v1 feature without broader complexity like pairwise comparisons or custom advanced formulas.
