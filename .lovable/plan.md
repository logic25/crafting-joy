

## Fix the Invite Modal

The current modal is overcomplicated. Here's what we'll change in `src/components/family/InviteEmailSheet.tsx`:

### What changes

1. **Remove the "Open Email App" button** -- the mailto: link doesn't work reliably on most devices
2. **Show the invite message by default** -- no hidden toggle, the full message is visible right away so you can see exactly what you're sending
3. **One big "Copy Invite Text" button** -- tap it, then paste into iMessage, WhatsApp, email, whatever you use
4. **Keep email fields optional** -- you can jot down who you plan to invite, but the core action is just copy and paste
5. **Show access code prominently** -- so you can also just tell someone the code verbally if needed

### What the invite message includes

- Link to the app
- Access code (carecircle2025)
- Step-by-step signup instructions
- How to install as an app (iPhone + Android)
- Examples of what to ask Circle (updated to be more generic since data won't exist yet -- e.g., "Add Mom's medications" instead of "What meds does Mom take?")

### Recommended approach

Send to your sister first. She does onboarding, adds Mom's doctors, meds, appointments, and emergency contacts. Then send to your brother -- he signs up, skips onboarding (auto-linked to the circle), and sees everything your sister already entered.

### Technical details

- Single file change: `src/components/family/InviteEmailSheet.tsx`
- Remove `Mail` button and `handleSendEmail` function
- Remove `showPreview` state -- message is always visible
- Remove email validation logic tied to the send button
- Keep `handleCopy` with clipboard API
- Update invite text to say "add Mom's info" instead of "ask about Mom's info" since the database will be empty initially

