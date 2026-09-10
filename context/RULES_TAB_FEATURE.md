# Rules tab feature concept

## Goal

Add a third tab/view on the comparison page named "Rules".

This tab will let the user define how each criterion should influence the final ranking. The user can:

- assign a weight to each criterion
- configure how values affect the score
- define ranking behavior for enum values and other criterion types
- review the total weight pool, which must always sum to 100

## User flow

The Rules tab is the decision-logic configuration area for a comparison.

### Layout

- Top summary: Weight pool = 100
- Show remaining pool and total assigned
- List each criterion with its current weight and rule configuration

### Per criterion configuration

Each criterion row should allow:

- name
- weight
- rule type
- value behavior

### Weight model

- Each criterion gets a weight percentage
- Total weight across all comparable criteria must equal 100
- The UI should show remaining weight and validate the total
- If the user changes a weight, the remaining pool updates live

### Rule model

Each criterion can define how its values affect the score.

Examples:

- Number: higher is better / lower is better only
- Boolean: yes is better / no is better
- Enum: define tiers and assign values to them
- Rating: higher is better / lower is better

### Number rule design

Numeric criteria will use only two directions:

- Higher is better
- Lower is better

There will be no "neutral" numeric direction option. The rule is intentionally simple and user-facing.

For missing numeric values, the default behavior will be:

- missing value = neutral

This keeps the rule clear: the direction describes known values, while missing data is handled separately.

### Boolean rule design

Boolean criteria will use a simple binary preference rule:

- Yes is better
- No is better

There will be no "neutral" boolean direction option.

This keeps the decision model simple and makes the user choose the preferred side of the boolean value explicitly.

For missing boolean values, the default behavior will be:

- missing value = neutral

New boolean criteria should default to:

- Yes is better

This matches the most common user expectation for features and positive flags.

### Enum rule design

Enum criteria will use a tier-based model:

- each enum value belongs to a tier
- multiple values can share the same tier
- higher tiers are better
- values within the same tier are considered equally good

Example:

- Tier 5 - Great: Remote, Hybrid
- Tier 3 - Good: Onsite
- Tier 1 - Bad: Abroad onsite

This lets the user define a qualitative ordering without forcing every value to be ranked individually.

The default tier set for all new enum criteria will be:

1. Bad
2. Okay
3. Good
4. Very Good
5. Great

Users will be able to rename tier labels, reorder tier importance, and move values between tiers.

For v1, full custom tier-set creation is a later feature. The default 1–5 tier set is the starting point.

For missing enum values, the default behavior will be:

- missing value = neutral

### Rating rule design

Rating criteria will use a simple numeric scale chosen by the user, with the default being 1–5.

Default rating settings:

- scale: 1 to 5
- integer-only values
- higher is better by default
- user can reverse to lower is better when needed
- missing value = neutral
- no visible labels by default

This keeps ratings simple, familiar, and easy to understand for end users.

### V1 default behavior

- New criteria start with zeroed weights
- User can rebalance the weight pool manually
- Users can set rules for each criterion individually
- Missing values should default to neutral unless user chooses otherwise
- The UI should warn if missing values may distort results and make rankings less reliable

### Incomplete data warning

Because missing values are treated as neutral, they can distort the final ranking when they occur in highly weighted criteria.

The comparison UI should show a clear warning whenever:

- an entry is missing a value for a comparable criterion
- the missing criterion has non-zero weight
- the missing data is likely to materially affect the result

Recommended behavior:

- show a comparison-level warning banner when any entry has missing comparable data
- show row-level indicators for incomplete entries
- surface the affected criteria and their weights in the warning text
- use wording such as: "Incomplete data may distort ranking"

This warning is important because a neutral score is not the same as an informed score.

## Recommended UX

### Rules tab should feel like a priority editor

The user is not entering math; they are deciding what matters more.

Suggested interaction:

- Each criterion row shows name + weight + rule summary
- Clicking the row opens an inline or modal editor
- Weight controls are simple numeric inputs or sliders
- A live total at the top keeps the weight pool valid

### Example criterion rule editor

Price

- Weight: 30
- Direction: lower is better
- Missing values: treat as neutral

Contract type

- Weight: 20
- Enum tiers:
  - Tier 5 - Great: Full-time, Remote
  - Tier 3 - Good: Hybrid
  - Tier 2 - Okay: Contract
  - Tier 1 - Bad: Freelance

Custom enum tiers should be editable by the user. For default enum criteria, the app can start with the built-in tier scale:

1. Bad
2. Okay
3. Good
4. Very Good
5. Great

## Recommended rule engine

Use a normalized weighted score model:

- each criterion gets a normalized score between 0 and 1
- each criterion contributes weight * normalizedScore
- the final result is a weighted total score per entry

This allows mixed types to be compared in a clear, explainable way.

## Important design decisions

### 1. Weight total must be 100

This is the main rule for the whole ranking configuration.

### 2. Rule decisions are per criterion

Each criterion should independently define how its values contribute to ranking.

### 3. Enum ordering is first-class

Enum criteria are especially important because they often reflect real-world preference, not just numeric values.

Tier groups make enum ranking more human-friendly because they let the user group values that are equally good without manually ranking each option separately.

### 4. The UI should keep ranking logic transparent

The user should be able to see why a result ranks higher without deep technical knowledge.

## Proposed tabs

- Criteria
- Rules
- Entries

This keeps the comparison view focused while giving a dedicated place for ranking logic.

## Future extensions

Later, this model could support:

- pairwise preference questionnaire for automatic initial weights ([shipped](features/pairwise_weight_questionnaire.md))
- recommendation presets
- weighted score explanation panel
- “must-have” or veto criteria
- advanced custom scoring formulas

## Summary

The Rules tab is where the user defines the decision framework for the comparison. It should combine:

- a total weight pool of 100
- per-criterion weight assignment
- per-criterion value-to-score rules
- tier-based enum rules with custom tiers and a default 1–5 scale
- especially flexible handling for enum values and numeric directions

This gives the app a simple but powerful way to rank entries based on user priorities.
