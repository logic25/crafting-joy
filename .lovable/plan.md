

## CareThread Rebrand + 3 Critical Feature Fixes (Circle AI stays)

Same plan as before with one key change: **the AI assistant keeps the name "Circle"**. Only the app name changes from CareCircle to CareThread.

---

### Part 1: Rebrand CareCircle to CareThread (app name only)

| File | What changes |
|------|-------------|
| `vite.config.ts` | PWA manifest `name` and `short_name` to CareThread |
| `capacitor.config.ts` | `appName` to CareThread |
| `index.html` | `<title>`, meta tags, OG tags to CareThread |
| `src/components/layout/AppLayout.tsx` | Header branding text to CareThread |
| `src/pages/Auth.tsx` | Logo text to CareThread |
| `src/pages/Landing.tsx` | All "CareCircle" becomes "CareThread". **"Circle AI" stays as "Circle AI"** |
| `src/pages/Install.tsx` | All "CareCircle" to CareThread |
| `src/pages/Chat.tsx` | Welcome message says "I'm Circle" (unchanged). Loading indicator stays "C" |
| `src/pages/Onboarding.tsx` | Placeholder text to "Mom's Care Thread", info box updated |
| `src/pages/Terms.tsx` | CareCircle to CareThread, email to `legal@thecarethread.com` |
| `src/pages/Privacy.tsx` | CareCircle to CareThread, email to `privacy@thecarethread.com` |
| `src/components/family/InviteEmailSheet.tsx` | "CareCircle" to "CareThread" in invite text. Circle AI references stay |
| `src/components/tour/GuidedTour.tsx` | `TOUR_KEY` to `carethread_tour_completed`. "Circle AI" stays in tour steps |
| `src/components/chat/MessageBubble.tsx` | No changes needed (avatar already shows "C" for Circle) |
| `supabase/functions/circle-chat/index.ts` | FEEDBACK_SYSTEM_PROMPT: "CareCircle" to "CareThread". "Circle" stays as the AI name |
| `src/types/index.ts` | Update comment if it says CareCircle |
| `README.md` | CareCircle to CareThread. Circle AI references stay |

**Access code:** Database UPDATE from `carecircle2025` to `carethread2025`.

**What stays the same:**
- AI assistant name: **Circle** (everywhere)
- Avatar letter: **C**
- `senderName`: "Circle"
- Edge function folder: `circle-chat`
- All database table names

---

### Part 2: Fix 1 -- Medications Table + CRUD

**Database migration:**
- Create `medications` table: id, care_circle_id, care_recipient_id, name, dosage, frequency, instructions, purpose, prescriber, pharmacy, quantity, refills_remaining, start_date, end_date, is_active, added_by, source, notes, created_at, updated_at
- RLS policies using `is_circle_member()` for SELECT/INSERT/UPDATE, `is_circle_admin()` for DELETE
- Updated_at trigger

**New file: `src/hooks/useMedications.ts`**
- `useMedications(careCircleId)` -- fetch all, ordered by is_active DESC, name ASC
- `useAddMedication()` -- insert mutation
- `useUpdateMedication()` -- update mutation (discontinue = set is_active false + end_date)
- `useDeleteMedication()` -- delete mutation

**Updated files:**
- `src/pages/Medications.tsx` -- Wire to real data via hooks
- `src/components/medications/AddMedicationSheet.tsx` -- Persist to database on submit

---

### Part 2: Fix 2 -- Persist Chat History

**Database migration:**
- Create `chat_messages` table: id, care_circle_id, sender_id, sender_name, content, role ('user' | 'assistant'), metadata (jsonb), created_at
- RLS: circle members can SELECT and INSERT

**New file: `src/hooks/useChatHistory.ts`**
- `useChatHistory(careCircleId)` -- fetch last 50 messages
- `useSaveChatMessage()` -- insert mutation

**Updated: `src/pages/Chat.tsx`**
- Load last 50 messages on mount, display after welcome message
- Save both user and AI messages to database after each exchange

---

### Part 2: Fix 3 -- Dynamic AI Context

**Updated: `supabase/functions/circle-chat/index.ts`**
- Accept `careCircleId` in request body
- Query real data: care_recipients, medications, providers, appointments, health_readings, care_circle_members
- Build system prompt dynamically (AI still says "You are Circle, a warm and knowledgeable AI assistant...")
- Fallback prompt if no care recipient exists yet

**Updated: `src/pages/Chat.tsx`**
- Pass `careCircleId` when invoking `circle-chat`

---

### Summary

| Change | Scope |
|--------|-------|
| App name: CareCircle to CareThread | 17+ files |
| AI name: Circle | **No change** (stays Circle) |
| Contact emails | `@thecarethread.com` |
| Access code | `carethread2025` |
| New table: `medications` | Full CRUD + RLS |
| New table: `chat_messages` | Persistence + RLS |
| Edge function: dynamic context | Real DB data replaces hardcoded demo |
| Database table names | **No change** |

