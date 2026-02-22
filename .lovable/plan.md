

# Access Code Registration Gate

## Overview
Add a required access code to the sign-up form so only people you share the code with can create accounts. Existing login for current users remains unchanged.

## How It Works
- When someone tries to sign up, they must enter a valid access code
- You set the access code in the backend (as a database setting)
- Share the code with siblings/friends via text or in person
- Change it anytime to revoke future access
- Sign-in (existing users) is not affected

## Technical Details

### 1. Database: Store the access code securely
- Create a `app_settings` table with a single row containing the hashed access code
- Add an edge function to validate the code server-side (never expose the real code to the client)
- Seed it with an initial access code you choose

### 2. Edge Function: `validate-access-code`
- Accepts a code, compares it against the stored value
- Returns success/failure
- Called during sign-up only

### 3. Auth Page Changes (`src/pages/Auth.tsx`)
- Add an "Access Code" input field to the sign-up form (not shown during sign-in)
- Validate the code via the edge function before calling `supabase.auth.signUp()`
- Show clear error if the code is wrong ("Invalid access code. Ask your family member for the code.")

### 4. Admin: Change the code
- Add a section in the existing Admin page (`src/pages/Admin.tsx`) to update the access code
- Only super admins can change it

## What You'll Do
1. After implementation, you'll see the access code in the admin panel
2. Share it with your siblings
3. They enter it when signing up
4. Change it whenever you want from the admin page

