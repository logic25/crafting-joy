# CareCircle

A family-centered caregiving coordination platform that answers the question: **"How's Mom?"**

## What It Does

CareCircle is a mobile-first, chat-first app that helps families coordinate care for aging loved ones. At its core is **Circle AI** — a warm, knowledgeable assistant that knows Mom's medications, doctors, blood pressure trends, and appointments so the whole family stays informed.

### Key Features

- **AI Care Assistant (Circle)** — Ask questions like "When is Mom's next appointment?" or "What medications is she on?" and get instant, context-aware answers
- **Family Group Chat** — Coordinate care tasks and share updates with siblings and caregivers in one place
- **Medication Tracking** — Monitor prescriptions, refill dates, and medication schedules with AI-powered label extraction
- **Blood Pressure & Weight Logging** — Track vitals over time with trend analysis and AI health insights
- **Appointment Management** — Schedule, assign coverage, and log visit summaries
- **Doctor & Provider Directory** — Keep all provider contacts, office hours, and portal links organized
- **Document Storage** — Upload and organize lab results, discharge papers, insurance cards, and more
- **Emergency Info** — One-tap access to allergies, emergency contacts, and preferred hospital

### Security & Access

- **Access Code Registration** — Sign-up requires a family access code, so only people you invite can create accounts
- **Role-Based Access** — Super admin, circle admin, caregiver, and view-only roles
- **Row-Level Security** — All data is scoped to care circles with enforced database policies
- **Inactivity Auto-Logout** — Sessions expire after inactivity for added security
- **Audit Logging** — Track who did what across the platform

### AI-Powered Health Intelligence

- **Smart Model Routing** — Automatically selects the right AI model (lite/standard/pro) based on reading complexity to optimize cost and quality
- **Health Alerts** — AI analyzes every health reading and flags trends or concerns with severity levels
- **Cost Tracking** — Real-time AI usage and cost monitoring in the admin dashboard

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (Supabase) — auth, database, edge functions, RLS
- **AI:** Google Gemini via Lovable AI gateway with tiered model routing
- **Mobile:** Capacitor-ready for iOS and Android builds
- **Styling:** Mobile-first responsive design with dark/light mode support

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the dev server
npm run dev
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── cards/        # Dashboard cards (activity, appointments, meds)
│   ├── chat/         # Chat input and message bubbles
│   ├── layout/       # App shell and navigation
│   ├── medications/  # Medication management sheets
│   └── ui/           # shadcn/ui primitives
├── contexts/         # Auth context provider
├── hooks/            # Custom React hooks (health sync, care circle, audit log, etc.)
├── pages/            # Route pages (Dashboard, Chat, Medications, Admin, etc.)
├── types/            # TypeScript interfaces
└── integrations/     # Backend client configuration

supabase/
├── functions/        # Edge functions (Circle AI, health analysis, medication extraction, access code validation)
└── migrations/       # Database schema migrations
```

## License

Private — All rights reserved.
