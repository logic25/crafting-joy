

## Build Missing Features + Admin Roadmap Kanban

This implements 5 core feature gaps and adds a Roadmap Kanban tab to the Admin dashboard. The roadmap will be seeded with 15 items (some promoted from backlog to "planned" per your request).

---

### 1. Wire Documents Page to Real Data

**Edit `src/pages/Documents.tsx`:**
- Remove hardcoded `sampleDocs` array
- Add `useQuery` to fetch from `documents` table filtered by `care_circle_id` (via `useCareCircle`)
- Wire category filter and search against fetched data
- "View" button generates a signed URL from Supabase Storage and opens in new tab
- Pass `onUploaded` callback to `UploadDocumentSheet` to trigger query invalidation
- Add delete button (confirmation dialog) for circle admins

### 2. "I'll Go" Volunteer Button on Appointments

**Edit `src/pages/Appointments.tsx`:**
- Next to "Needs someone to attend" warning, add an "I'll go" button
- On click: update `assigned_caregiver_id`, `assigned_caregiver_name`, `coverage_status` to "assigned"
- If current user is already assigned, show "Can't make it" button to unclaim
- Add a "Past" section showing appointments with `date_time < now()` or `status = 'completed'`
- Past appointments show "Add Summary" button (opens VisitSummarySheet)

### 3. Post-Visit Summary Sheet

**Create `src/components/appointments/VisitSummarySheet.tsx`:**
- Form with: assessment (textarea), next steps (textarea), medication changes (textarea), concerning flag (checkbox)
- Saves as JSON to existing `visit_summary` JSONB column
- Sets `status` to "completed"
- Invalidates appointments query on save

### 4. Edit and Delete Providers

**Create `src/components/doctors/EditProviderSheet.tsx`:**
- Same form fields as AddProviderSheet but pre-populated with existing data
- Calls `supabase.from("providers").update(...)` on save
- Invalidates providers query

**Edit `src/pages/Doctors.tsx`:**
- Add edit (pencil) and delete (trash) icons on each provider card
- Edit opens EditProviderSheet with provider data
- Delete shows confirmation dialog, then removes the provider
- Query invalidation on both actions

### 5. Persist Notification Preferences

**Database migration:**
- Create `notification_preferences` table: id (uuid PK), user_id (uuid, unique, references auth.users), appointment_reminders (boolean default true), refill_reminders (boolean default true), coverage_requests (boolean default true), family_updates (boolean default true), created_at, updated_at
- RLS: users can SELECT/INSERT/UPDATE/DELETE only their own row (`user_id = auth.uid()`)

**Edit `src/pages/Settings.tsx`:**
- Fetch preferences on mount from `notification_preferences` for current user
- Toggle switches call upsert to update the database row
- Create row on first toggle if none exists

### 6. Admin Roadmap Kanban Board

**Database migration:**
- Create `roadmap_items` table: id (uuid PK), title (text NOT NULL), description (text), status (text NOT NULL default 'backlog'), category (text), priority (integer default 0), created_at (timestamptz default now()), updated_at (timestamptz default now())
- RLS: super admins can full CRUD; all authenticated users can SELECT
- Updated_at trigger
- Seed with 15 items (see below)

**Edit `src/pages/Admin.tsx`:**
- Add a "Roadmap" tab to the existing TabsList
- Render a 4-column Kanban layout: Backlog | Planned | In Progress | Shipped
- Each card shows title, description snippet, category badge
- Status change via a dropdown on each card (move between columns)
- "Add Item" button to create new roadmap items (inline form or sheet)
- Edit title/description inline
- Delete option on each card

**Seeded Roadmap Items:**

| # | Title | Status | Category |
|---|-------|--------|----------|
| 1 | Push notifications and reminders | planned | Notifications |
| 2 | Google Calendar sync | planned | Integrations |
| 3 | SMS family invites | planned | Family |
| 4 | Document camera scan (OCR) | planned | Documents |
| 5 | Export care report as PDF | planned | Documents |
| 6 | Medication refill alerts | planned | Medications |
| 7 | Fax to doctor's office | planned | Integrations |
| 8 | Medication interaction checker | planned | AI |
| 9 | Telehealth appointment links | planned | Appointments |
| 10 | Voice notes in chat | backlog | Chat |
| 11 | Apple Watch integration | backlog | Health |
| 12 | Caregiver shift scheduling | backlog | Family |
| 13 | Insurance claims tracker | backlog | Documents |
| 14 | Symptom diary with photo | backlog | Health |
| 15 | Multi-language support | backlog | Accessibility |

---

### Technical Summary

| Action | File / Resource |
|--------|----------------|
| **Migrate** | Create `notification_preferences` table + RLS |
| **Migrate** | Create `roadmap_items` table + RLS + seed data |
| **Edit** | `src/pages/Documents.tsx` -- real DB data, signed URLs, delete |
| **Edit** | `src/pages/Appointments.tsx` -- volunteer button, past section, summary trigger |
| **Edit** | `src/pages/Doctors.tsx` -- edit/delete actions on providers |
| **Edit** | `src/pages/Settings.tsx` -- persist notification toggles |
| **Edit** | `src/pages/Admin.tsx` -- add Roadmap Kanban tab |
| **Create** | `src/components/appointments/VisitSummarySheet.tsx` |
| **Create** | `src/components/doctors/EditProviderSheet.tsx` |

