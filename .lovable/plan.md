

# Smart Health Correlation Engine

## The Core Idea

Instead of analyzing each vital in isolation, Circle looks across ALL health signals together and connects dots the family might miss:

- "Mom gained 3 lbs this week. Amlodipine (started Jan 20) lists weight gain and ankle swelling as common side effects. Worth mentioning to Dr. Fuzaylov at the March 20 visit."
- "Mom's resting heart rate has been 10 BPM higher than usual for 3 days, and her sleep dropped from 7 hrs to 5. Could be stress or medication related -- keep an eye on it."
- "Mom's step count dropped 40% this week and BP is trending up. Reduced activity can affect blood pressure. Encourage the daily 20-minute walk Dr. Patel recommended."

## What Health Signals We Track

| Signal | Source Today | Future (HealthKit/Google Health) |
|--------|-------------|----------------------------------|
| Blood Pressure | Manual entry | Auto-sync from Withings/Omron |
| Weight | Manual entry | Auto-sync from smart scale |
| Heart Rate | Manual entry | Apple Watch continuous |
| Steps / Activity | Manual entry | Phone + Watch auto |
| Sleep | Manual entry | Apple Watch auto |
| Blood Glucose | Manual entry | Compatible glucose monitors |
| Medications | Already in system | Same |
| Symptoms / Notes | Manual entry | Same |

## Model Choice: `google/gemini-3-flash-preview`

Why this model and not Gemini 2.5 Flash:
- Gemini 3 Flash Preview is the latest generation -- better at multi-step reasoning across different data types
- Fast enough for real-time alerts (sub-2 second responses)
- Can correlate medication side effect profiles against observed health trends
- Cheaper than Pro, but strong enough for this pattern-matching task

Why not Gemini Pro:
- Pro is best for image analysis or very complex reasoning with huge context
- Our health data fits well within Flash's capabilities
- Cost and latency matter since we analyze every new reading

## How the Correlation Works

When ANY health reading is logged (BP, weight, heart rate, steps, etc.), the edge function:

1. Pulls ALL recent health data (last 14-30 days across all signal types)
2. Pulls current medications with start dates
3. Sends everything to Gemini 3 Flash with a system prompt that includes known drug side effects
4. Gets back a structured assessment with severity and cross-signal correlations

### Example System Prompt (for the edge function)

```
You are a family health monitoring assistant for Rosa Martinez, age 73.

Current medications (with common side effects):
- Lisinopril 10mg (since Jan 20): dry cough, dizziness, hyperkalemia
- Jardiance 10mg (since Jan 22): UTIs, dehydration, weight loss
- Omeprazole 20mg (since Jan 15): B12 deficiency long-term, bone density
- Amlodipine 5mg (since Jan 20): ankle swelling, weight gain, fatigue

When a new health reading arrives, analyze it against:
1. The trend in that specific metric (is it changing?)
2. Cross-signal correlations (did another metric change around the same time?)
3. Medication timeline (did a change start after a med was added/changed?)
4. Known side effect profiles of current medications

Respond with:
- severity: normal | watch | attention | urgent
- summary: 2-3 sentences for the family in warm, plain language
- correlations: any connections you see between signals
- action: what the family should do (if anything)
```

## Technical Implementation

### Step 1: Database tables

**`health_readings`** (unified table for all vitals, not just BP)
- `id` (uuid)
- `care_circle_id` (uuid, references care_circles)
- `care_recipient_id` (text)
- `type` (text -- bp, weight, heart_rate, steps, sleep, glucose, spo2, temperature)
- `value_primary` (numeric -- systolic for BP, lbs for weight, bpm for HR, etc.)
- `value_secondary` (numeric, nullable -- diastolic for BP, null for others)
- `value_tertiary` (numeric, nullable -- pulse for BP readings)
- `unit` (text -- mmHg, lbs, bpm, steps, hours, mg/dL, %, F)
- `source` (text -- manual, apple_health, google_health, device)
- `logged_by` (uuid)
- `logged_by_name` (text)
- `notes` (text, nullable)
- `metadata` (jsonb, nullable -- position for BP, fasting for glucose, etc.)
- `created_at` (timestamptz)

RLS: circle members can read/insert for their circle.

**`health_alerts`** (Circle's assessments)
- `id` (uuid)
- `care_circle_id` (uuid)
- `reading_id` (uuid, references health_readings, nullable)
- `severity` (text -- normal, watch, attention, urgent)
- `title` (text)
- `message` (text)
- `correlations` (jsonb -- what signals were cross-referenced)
- `action_needed` (text, nullable)
- `acknowledged_by` (uuid[], nullable)
- `created_at` (timestamptz)

RLS: circle members can read; system inserts via service role.

Also: grant `super_admin` role to current user account for admin dashboard access.

### Step 2: Edge function -- `analyze-health-reading`

A single edge function that handles ALL health signal types:
- Receives: new reading + type
- Fetches: last 30 days of ALL health readings for that care recipient (across all types)
- Fetches: current medications with start dates
- Calls: `google/gemini-3-flash-preview` with the correlation prompt
- Saves: alert to `health_alerts` table
- Returns: the alert to the client

### Step 3: Update Blood Pressure page

- Switch from mock `bpReadings` to `health_readings` table (filtered by `type = 'bp'`)
- After logging a BP reading, call `analyze-health-reading` edge function
- Show Circle's assessment as a card below the chart
- Add source badge (manual / Apple Health / device)
- Keep existing chart and history UI

### Step 4: Add Weight tracking page

- New page at `/weight` with similar structure to BP page
- Log weight readings (stored as `type = 'weight'` in `health_readings`)
- Show trend chart
- When weight is logged, the same `analyze-health-reading` function checks correlations with medications and other vitals

### Step 5: Dashboard health alert card

- Show the most recent health alert on the Dashboard
- Color-coded by severity (green/yellow/orange/red)
- Shows correlation info when relevant ("Related to: Amlodipine started Jan 20")

### Step 6: Update navigation

- Add Weight to the sidebar navigation
- Update Dashboard quick actions

## Apple App Store Compliance

Apple explicitly supports this use case. Their HealthKit guidelines state:
- Apps CAN read health data with user permission
- Apps CAN share data with family members if the user consents
- Apps MUST have a privacy policy explaining data usage
- Apps MUST NOT use health data for advertising
- CareCircle fits squarely in the "caregiving" category Apple encourages

## Files to Create/Modify

- **New migration** -- create `health_readings` and `health_alerts` tables with RLS, add super_admin for current user
- **New edge function** -- `supabase/functions/analyze-health-reading/index.ts`
- **New hook** -- `src/hooks/useHealthReadings.ts` (CRUD for health_readings, filtered by type)
- **New hook** -- `src/hooks/useHealthAlerts.ts` (read alerts for a circle)
- **New page** -- `src/pages/Weight.tsx` (weight tracking with chart)
- **Modified** -- `src/pages/BloodPressure.tsx` (database queries instead of mock data, alert display)
- **Modified** -- `src/pages/Dashboard.tsx` (health alert card)
- **Modified** -- `src/App.tsx` (add /weight route)
- **Modified** -- `src/components/layout/AppLayout.tsx` (add Weight to nav)
- **Modified** -- `supabase/config.toml` (add analyze-health-reading function)

