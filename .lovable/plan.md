

# Multi-Model AI Routing + Real Cost Tracking

## Overview

This plan implements three major improvements: (1) smart model routing that picks the right AI model based on task complexity, (2) real token/cost tracking in the database, and (3) an upgraded Admin panel showing actual costs broken down by model tier.

---

## Step 1: Database Migration

Add tracking columns to `health_alerts`:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `model_used` | text | `'google/gemini-3-flash-preview'` | Which model handled this analysis |
| `complexity` | text | `'standard'` | Routing tier: lite, standard, or pro |
| `input_tokens` | integer | null | Actual input tokens from AI response |
| `output_tokens` | integer | null | Actual output tokens from AI response |
| `response_time_ms` | integer | null | How long the AI call took |
| `estimated_cost` | numeric | null | Calculated cost based on real tokens |

---

## Step 2: Model Router in `analyze-health-reading`

Add a `selectModel()` function that runs BEFORE calling the AI. The logic:

```text
New reading arrives
    |
    v
Is it within normal range?
  (BP: systolic 90-130, diastolic 60-85)
  (Weight: within 2% of recent average)
  (HR: 55-90 bpm)
    |
    |-- YES --> Have other signal types changed in last 7 days?
    |              |-- NO  --> LITE (gemini-2.5-flash-lite)
    |              |-- YES --> PRO  (gemini-2.5-pro)
    |
    |-- NO (abnormal) --> How many signal types have data?
                            |-- 1 type only --> STANDARD (gemini-3-flash-preview)
                            |-- 2+ types   --> PRO (gemini-2.5-pro)
                            |
                            Also: medication started in last 30 days?
                            |-- YES --> upgrade to PRO
```

**Lite tier** gets a minimal system prompt (just confirm normal, 1-2 sentences).
**Standard tier** keeps the current prompt (single-vital analysis).
**Pro tier** gets an expanded prompt with explicit cross-correlation and medication interaction instructions.

After the AI responds, capture `usage.prompt_tokens`, `usage.completion_tokens`, and `response_time_ms` from the gateway response and save them to the alert row.

**Cost calculation per model:**

| Model | Input cost (per 1M tokens) | Output cost (per 1M tokens) |
|-------|---------------------------|----------------------------|
| gemini-2.5-flash-lite | ~$0.075 | ~$0.30 |
| gemini-3-flash-preview | ~$0.15 | ~$0.60 |
| gemini-2.5-pro | ~$1.25 | ~$5.00 |

---

## Step 3: Rate Limiting

Before calling the AI, query today's alert count for this care circle. If it exceeds 10, skip the AI call and save a simple "Reading logged" alert with severity "normal" and `model_used = 'skipped'`. The reading itself still gets saved to `health_readings`.

---

## Step 4: Chat Model Routing in `circle-chat`

Add a lightweight keyword classifier before calling the AI:

- **Factual lookups** (pharmacy, doctor name, allergy list, appointment) --> `gemini-2.5-flash-lite`
- **Trend questions** ("how has BP been", "this week") --> `gemini-2.5-flash` (current model, stays the same)
- **Reasoning questions** ("why", "could medication cause", multiple health signals mentioned) --> `gemini-2.5-pro`

---

## Step 5: Admin Panel Upgrades

Replace hardcoded `$0.002` cost estimate with real data from the new columns:

1. **Model Breakdown Card** -- show calls and cost per model tier (Lite / Standard / Pro / Skipped), with a visual bar or pie breakdown
2. **Real Cost Totals** -- aggregate `estimated_cost` from the database instead of multiplying by a constant
3. **Cost Projection** -- "At current pace, this month will cost $X" based on daily average
4. **Per-Customer Cost** -- average cost per care circle
5. **Routing Decisions** -- show recent alerts with their `complexity` and `model_used` so you can see the router in action

---

## Files to Modify

| File | Change |
|------|--------|
| **New migration** | Add 6 columns to `health_alerts` |
| `supabase/functions/analyze-health-reading/index.ts` | Add `selectModel()` router, rate limiter, token/cost tracking, tiered prompts |
| `supabase/functions/circle-chat/index.ts` | Add keyword classifier for model selection |
| `src/pages/Admin.tsx` | Replace hardcoded costs with real DB data, add model breakdown card, cost projections, routing log |

---

## Technical Details

### analyze-health-reading changes

The function will be restructured as follows:

1. Fetch readings and recipient (same as now)
2. **NEW**: Call `selectModel(newReading, byType, readings)` which returns `{ model, complexity, systemPrompt }`
3. **NEW**: Check rate limit -- query `health_alerts` count for today for this circle
4. Call AI gateway with the selected model and appropriate prompt
5. **NEW**: Extract `usage.prompt_tokens` and `usage.completion_tokens` from the AI response
6. **NEW**: Calculate `estimated_cost` using the per-model token pricing
7. **NEW**: Measure `response_time_ms` using `Date.now()` before/after the AI call
8. Save alert with all new tracking fields

### circle-chat changes

1. **NEW**: Scan the last user message for keyword patterns
2. Select model based on classification
3. Call AI gateway with selected model (rest stays the same)

### Admin.tsx changes

1. Update `HealthAlert` interface to include `model_used`, `complexity`, `input_tokens`, `output_tokens`, `estimated_cost`, `response_time_ms`
2. Update the fetch query to include these new columns
3. Replace `estimatedCostPerCall * count` with `SUM(estimated_cost)` from actual data
4. Add a "Model Breakdown" card grouping alerts by `model_used`
5. Add cost projection: `(total cost / days with data) * 30`
6. Add per-circle cost breakdown
7. Show `model_used` badge on each alert in the recent alerts list

