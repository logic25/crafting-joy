

# Guided Tour + Family Invite Email

## Part 1: Guided Tour for New Users

After a sibling signs up and completes onboarding, they land on the Chat page with no context. A lightweight guided tour will highlight key areas of the app so they know what to do.

### How it works
- On first login (after onboarding), a series of tooltip-style popover steps appear, highlighting key UI elements
- Steps walk through: Chat with Circle AI, Dashboard overview, Care Hub (medications/vitals), ER Card, and the Family page
- Users can skip the tour or go step-by-step with "Next" / "Got it" buttons
- A flag in localStorage tracks whether the tour has been completed so it only shows once
- No external library needed -- we'll build a simple overlay component using existing Popover/Dialog primitives

### Tour steps (5 total)
1. **Chat** -- "This is Circle AI. Ask anything about Mom's care -- medications, appointments, what happened today."
2. **Dashboard** -- "See Mom's vitals, upcoming appointments, and what the family has been doing at a glance."
3. **Care Hub** -- "Track medications, log blood pressure and weight, manage appointments and doctors."
4. **ER Card** -- "One-tap access to everything a first responder needs: allergies, meds, doctors, preferred hospital."
5. **Family** -- "See who's in your care circle and invite more family members."

### Implementation
- New component: `src/components/tour/GuidedTour.tsx` -- a floating card that highlights each nav item
- Uses a simple state machine (step index) with a semi-transparent backdrop
- Renders inside `AppLayout` only when the user hasn't completed the tour
- Tracks completion in `localStorage` with key `carecircle_tour_completed`

---

## Part 2: Family Invite Email Template

A new page at `/invite-email` (or a copyable template inside the Settings/Family page) that shows a ready-to-copy email you can paste into Gmail, iMessage, or any messaging app.

### Where it lives
- New component accessible from the **Family** page via a "Send Invite" button
- Opens a sheet/dialog with the pre-written email, a "Copy to clipboard" button, and a "Share" button (uses native Web Share API on mobile)

### Email content (personalized with your circle name and access code)

> **Subject:** Join Mom's CareCircle -- I need your help coordinating her care
>
> Hey!
>
> I set up an app called CareCircle so we can coordinate Mom's care in one place instead of scattered group texts. It tracks her medications, appointments, vitals, and has an AI assistant you can ask anything about her health.
>
> **Here's how to get started (takes 2 minutes):**
>
> 1. Go to [app URL]
> 2. Click "Get started" and then "Sign up"
> 3. Enter this access code when asked: **[ACCESS CODE]**
> 4. Fill in your name and you're in!
>
> Once you're in, the app will give you a quick tour so you know where everything is.
>
> Let me know if you have any questions!

### Implementation
- New component: `src/components/family/InviteEmailSheet.tsx`
- Fetches the current access code from `app_settings` (admin only) or lets the user manually type the code to include
- "Copy" button copies the full email text to clipboard
- "Share" button uses `navigator.share()` on supported devices
- Added to the Family page as a prominent action button

---

## Technical Summary

| Item | File | What |
|------|------|------|
| Guided tour component | `src/components/tour/GuidedTour.tsx` | 5-step floating walkthrough |
| Tour integration | `src/components/layout/AppLayout.tsx` | Render tour on first visit |
| Invite email sheet | `src/components/family/InviteEmailSheet.tsx` | Copyable email template |
| Family page update | `src/pages/Family.tsx` | Add "Send Invite" button |

No database changes needed. No new dependencies.

