

# CareCircle — Merged Implementation Plan

This plan combines the previously approved redesign with the new AI-powered SOW into a single unified roadmap. The biggest shift: **the chat with Circle (AI agent) becomes the home tab**, and every other feature feeds into or is accessible from that conversation.

---

## What Exists Today

- 6 pages: Dashboard, Appointments, Medications, Family, Emergency, Settings
- Clinical "Medical Blue" design with Inter font
- Mock data for 3 caregivers (Manny, Sarah, Emily), care recipient (Maria Russell), 3 appointments, 5 medications
- Lovable Cloud enabled (no tables yet)
- All data is client-side mock data, nothing persisted

## What Changes

1. **Design**: Clinical blue becomes warm cream/sage/terracotta
2. **Architecture**: Dashboard-first becomes chat-first
3. **AI Agent**: Circle joins the family chat as a context-aware participant
4. **New features**: BP tracker, document vault, doctor instructions, fax integration
5. **Data**: Mock data replaced with database-backed persistence
6. **Auth**: Phone OTP + magic link email

---

## Build Order (10 Phases)

### Phase 1: Warm Design System
Replace the clinical aesthetic with the SOW's "warm modern" direction.

**Changes:**
- `index.html` — swap Google Font to Plus Jakarta Sans
- `src/index.css` — new HSL variables: soft cream background (`#FAF8F5`), muted sage green primary (`#7C9A82`), warm terracotta for warnings/alerts, warm gray foreground. Remove all clinical blue values. Update gradient utilities to sage/terracotta.
- `tailwind.config.ts` — update font-family to Plus Jakarta Sans, increase default spacing, soften box-shadow values to warm tones
- Update all utility classes (`.gradient-primary`, `.status-*`) for new palette

### Phase 2: Updated Types and Mock Data
Expand data structures to support new features, update mock data to match the SOW's family (Mom = Rosa Martinez, siblings = Manny, Maria, Jessica).

**New types in `src/types/index.ts`:**
- `BloodPressureReading` — systolic, diastolic, pulse, position, loggedBy, timestamp, notes
- `DoctorInstruction` — text, doctorName, dateGiven, status (done/in-progress/need-help)
- `ActionItem` — description, assignedTo, dueDate, status, linkedEntity
- `ChatMessage` — sender (family member or "circle"), content, timestamp, type (text/card/system), metadata
- `Document` — name, category, uploadedBy, date, relatedDoctor, fileUrl, thumbnailUrl
- Enhanced `Provider` — add fax, officeHours, portalUrl, notes, insuranceAccepted
- Enhanced `CareRecipient` — add photo, preferredPharmacy, structured conditions, standing instructions

**Updated `src/data/mockData.ts`:**
- Rosa Martinez as care recipient with Lisinopril 10mg, Jardiance 10mg, Omeprazole 20mg, Amlodipine 5mg
- Allergies: Penicillin (rash), Sulfa (severe)
- Doctors: Dr. Fuzaylov (cardiology), Dr. Patel (primary care), Dr. Mehta (gastro)
- BP readings for last 7 days
- Doctor instructions: "Elevate bed to 35 degrees", "Reduce sodium"
- Sample chat messages showing Circle interactions

### Phase 3: Navigation and Layout Rebrand
Restructure the app for the chat-first architecture.

**Changes to `src/components/layout/AppLayout.tsx`:**
- Rename to "CareCircle"
- Header: warm-toned logo mark (soft green circle), subtitle "Caring for Mom"
- Mobile bottom nav (4 tabs): Chat (home), Dashboard, Care Hub, ER Card
- Desktop sidebar: Chat, Dashboard, Care Hub (expandable: Meds, Appointments, Doctors, BP, Documents), ER Card, Family, Settings
- ER Card tab uses terracotta/red accent color to stand out

**Route changes in `src/App.tsx`:**
- `/` = Chat (new home)
- `/dashboard` = "How's Mom?" overview
- `/medications`, `/appointments`, `/doctors`, `/bp`, `/documents` = Care Hub sub-pages
- `/emergency` = ER Card
- `/family`, `/settings` = unchanged paths

### Phase 4: AI Chat — The Home Screen
Build the group chat with Circle as the default landing page. This is the soul of the app.

**New files:**
- `src/pages/Chat.tsx` — main chat page with message list + input
- `src/components/chat/MessageBubble.tsx` — renders human messages (warm) and Circle messages (sage green background with organic icon)
- `src/components/chat/ChatInput.tsx` — text input with send button, attachment button
- `src/components/chat/CircleCard.tsx` — renders rich formatted cards from Circle (ER card, medication list, appointment summary)

**Edge function: `supabase/functions/circle-chat/index.ts`**
- Receives messages + user context
- Uses Lovable AI (google/gemini-3-flash-preview) with a system prompt containing Mom's full medical context
- System prompt includes: all medications, conditions, allergies, doctors, recent BP readings, appointments, doctor instructions, activity history
- Streams responses back via SSE
- Handles 429/402 errors gracefully

**Circle's personality:**
- Warm, knowledgeable, never condescending
- First person plural ("Let me check Mom's records")
- Always defers medical judgment to doctors
- Can generate formatted cards (ER info, med lists, appointment summaries)

**Initial scope (no DB yet):** Chat works with in-memory messages + mock data context. Circle answers questions about Mom using the mock data passed in the system prompt.

### Phase 5: Dashboard — "How's Mom?"
Rebuild the current Index page as a silent check-in screen (now at `/dashboard`).

**Layout (top to bottom):**
1. **Mom's Status Card** — name, photo placeholder, status dot (green/yellow/red manually set), "Last updated by Maria, 2 hours ago"
2. **BP Trend Widget** — 7-day line chart (Recharts), latest reading large, tap to go to `/bp`
3. **Next Appointment Card** — doctor, date, who's going, "I'll go instead" quick action
4. **Active Doctor Instructions** — newest first with checkbox status
5. **Medication Alert Banner** — only shows if refills due
6. **Open Action Items** — assigned/unassigned tasks
7. **Recent Activity** — last 5 items

### Phase 6: ER Card Redesign
Transform the Emergency page into the instant-share lifesaver described in the SOW.

**Changes to `src/pages/Emergency.tsx`:**
- Auto-pulls all current data (meds, allergies, conditions, contacts, insurance, standing instructions)
- Large-format card layout optimized for handing phone to ER nurse
- Share actions:
  - "Text This" — Web Share API with formatted plain text fallback
  - "Copy All" — clipboard API
  - "Show on Screen" — large-text, high-contrast mode (dark bg, white text, huge font)
- Prominent terracotta/red header, always one tap from any screen
- "Last updated" auto-timestamp

### Phase 7: Medications and Appointments Rebuild
Update existing pages for warm design + new features.

**Medications (`src/pages/Medications.tsx`):**
- Allergy banner at top (terracotta accent, always visible)
- Cards with: name (large/bold), dose + frequency, prescriber, pharmacy (tap-to-call), refill status with 10-day warning
- Add Medication form (dialog): name, dose, frequency presets, prescribing doctor, pharmacy, quantity, start date, notes
- Discontinued section collapsed at bottom

**Appointments (`src/pages/Appointments.tsx`):**
- Cards with "Who's going?" avatars and "Questions to ask" list
- "I can't go" / "I'll cover it" coverage flow
- Post-Visit Summary form: what doctor said, new meds, new instructions, next appointment, anything concerning
- Keep list/calendar toggle

### Phase 8: New Pages — BP Tracker, Doctors, Documents

**Blood Pressure (`src/pages/BloodPressure.tsx`):**
- Quick Log: large friendly number inputs, position toggle, who's logging
- History: calendar dots + list view
- Trends: 7-day/30-day averages, Recharts line chart with doctor's target range overlay
- Doctor's target configurable, out-of-range readings flagged

**Doctors (`src/pages/Doctors.tsx`):**
- Rich contact cards: name, specialty, phone, fax, address (tap for maps), office hours, portal URL, notes
- Each card shows linked medications, appointments, instructions
- Add Doctor form

**Documents (`src/pages/Documents.tsx`):**
- Categories: Lab Results, Imaging, Discharge Summaries, Insurance, Prescriptions, Legal, Other
- Upload via file picker or camera
- Document cards with thumbnail, name, date, uploader, related doctor
- Share/download actions
- Search by keyword, doctor, date

### Phase 9: Database Schema and Authentication
Persist everything and enable multi-user.

**Database tables (with RLS):**
- `profiles` — linked to auth.users (name, phone, avatar, relationship)
- `user_roles` — separate roles table per security requirements
- `care_circles` — groups linking caregivers to a care recipient
- `care_circle_members` — junction table (user_id, care_circle_id)
- `care_recipients` — name, dob, photo_url, conditions, allergies, insurance, preferred_pharmacy, preferred_hospital
- `medications` — all fields from type, linked to care_recipient + provider
- `appointments` — all fields, linked to care_recipient + provider + assigned caregiver
- `providers` — name, specialty, phone, fax, address, office_hours, portal_url, notes
- `bp_readings` — systolic, diastolic, pulse, position, logged_by, timestamp, notes
- `doctor_instructions` — text, doctor_name, date_given, status, care_recipient_id
- `action_items` — description, assigned_to, due_date, status, linked entity
- `chat_messages` — sender_id, care_circle_id, content, type, metadata, timestamp
- `documents` — name, category, file_url, uploaded_by, date, related_provider_id
- `activity_log` — who, what, when, care_circle_id
- `visit_summaries` — linked to appointment

**RLS:** All tables scoped to care_circle membership via a `is_circle_member()` security definer function.

**Auth:**
- Phone OTP (primary) via built-in auth
- Magic link email (backup)
- Family invite flow: generate invite link, new member signs up and joins the care circle

**Realtime:** Enable on `chat_messages` and `activity_log` for live updates.

### Phase 10: Circle AI Enhancement
Once data is in the database, upgrade the Circle edge function.

**Enhancements:**
- System prompt dynamically built from live database queries (meds, appointments, BP, etc.)
- Circle can capture data from conversation (e.g., "Mom started a new med" triggers structured extraction via tool calling)
- Post-appointment debrief prompts (Circle notices a completed appointment and asks the attending caregiver how it went)
- Follow-up tracking: Circle checks for overdue action items and reminds in chat
- Proactive alerts: refills due, BP trending high, upcoming appointments

---

## What We Keep From Current Code

- All shadcn/ui components (button, card, badge, tabs, etc.)
- Recharts (already installed, used for BP charts)
- React Router structure (updated routes)
- AppLayout pattern (redesigned but same wrapper concept)
- date-fns for date formatting
- Card-based UI pattern throughout

## What We Replace

- Inter font with Plus Jakarta Sans
- Clinical blue palette with warm cream/sage/terracotta
- Dashboard as home with Chat as home
- Generic "Maria Russell" mock data with "Rosa Martinez" family from the SOW
- All hardcoded mock data with database queries (Phase 9)

## Suggested Build Sequence

I recommend building 1-2 phases per prompt for manageable changes:

1. **Phases 1 + 2** — Design system + data structures (visual foundation)
2. **Phase 3** — Navigation rebrand (structural change)
3. **Phase 4** — Chat + Circle AI (the soul of the app)
4. **Phase 5** — Dashboard ("How's Mom?")
5. **Phase 6** — ER Card (highest-impact single feature)
6. **Phase 7** — Medications + Appointments rebuild
7. **Phase 8** — BP Tracker, Doctors, Documents
8. **Phases 9 + 10** — Database + Auth + AI enhancement

