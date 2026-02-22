

# CareCircle: Full Feature Build-Out

## What We're Building

Seven workstreams that take CareCircle from a prototype with mock data to a fully functional caregiving platform.

---

## 1. Weight Display -- Show lbs + % Change

Update the Weight page trend card to show real change between readings.

Example: **+3.2 lbs (+2.1%)** or **-1.5 lbs (-1.0%)**

**Files:** `src/pages/Weight.tsx`

---

## 2. Expanded Onboarding (3 steps --> 6 steps)

Every step saves real data to the database. New steps are skippable.

| Step | Collects | Status |
|------|----------|--------|
| 1. Name your circle | Circle name | Already works |
| 2. About your loved one | Name, DOB, doctor, hospital, conditions | Already works |
| 3. Allergies + insurance | Allergies (name + severity), insurance, pharmacy | **New** |
| 4. Emergency contacts | Up to 3 contacts (name, relationship, phone) | **New** |
| 5. Upload health docs | Insurance cards, lab results, prescriptions (optional) | **New** |
| 6. Invite family | Email + role selection, pre-added + email sent | **Fixed** |

**Database changes:**
- Add `emergency_contacts` column to `care_recipients`
- Create `documents` table + private storage bucket
- Create `circle_invitations` table with auto-join trigger (when invitee signs up, they land in the circle automatically)
- New `send-invite` backend function for email notifications

---

## 3. ER Card -- Real Data

Replace mock data in the Emergency page with actual database queries. The ER card will pull from whatever was entered during onboarding (allergies, insurance, conditions, emergency contacts, medications).

**Files:** `src/pages/Emergency.tsx`, new `useCareRecipient` hook

---

## 4. Appointments + Doctors -- Full CRUD

**Doctors page:** Add, edit, delete doctors with name, specialty, phone, address, notes.

**Appointments page:** Create appointments linked to saved doctors with date/time, type, location, purpose, "questions to ask" list, and caregiver assignment.

**Database:** Two new tables (`doctors`, `appointments`) with RLS policies following existing circle-member patterns.

---

## 5. Documents -- Real File Upload

Working upload button that saves files to cloud storage with metadata (name, category, uploader). Category filter and search work against real data. Reuses the same storage bucket and table created for onboarding uploads.

---

## 6. Caregiver Roles -- Family + Settings

**Family page:** Invite members by email, assign roles (admin / caregiver / view-only), remove members. Shows real member list from the database.

**Settings page:** "Manage Circle" section with role dropdowns, edit care recipient info, edit profile, working sign-out button.

---

## 7. Marketing Landing Page

Public page for unauthenticated visitors with:
- Hero section + CTA ("Get Started Free")
- Feature highlights (coordinate care, track health, ER card, family chat)
- "How it works" visual
- Routes to sign-up

Authenticated users bypass this and go straight to their dashboard.

---

## Build Order

```text
1. Weight display          (quick win, ~1 message)
2. Onboarding expansion    (captures data everything else needs)
3. ER Card DB hookup       (uses onboarding data immediately)
4. Doctors + Appointments  (new tables + full UI)
5. Documents upload        (storage already created in step 2)
6. Family + Settings roles (member management)
7. Landing page            (can be done anytime)
```

---

## Database Migrations Summary

| Migration | What |
|-----------|------|
| 1 | Add `emergency_contacts` jsonb to `care_recipients` |
| 2 | Create `documents` table + storage bucket + RLS |
| 3 | Create `circle_invitations` table + auto-join trigger |
| 4 | Create `doctors` table + RLS |
| 5 | Create `appointments` table + RLS |

---

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useCareRecipient.ts` | Fetch/update care recipient from DB |
| `src/hooks/useDoctors.ts` | CRUD for doctors |
| `src/hooks/useAppointments.ts` | CRUD for appointments |
| `src/hooks/useDocuments.ts` | CRUD for documents + file upload |
| `src/pages/Landing.tsx` | Marketing page |
| `supabase/functions/send-invite/index.ts` | Email invite notifications |

