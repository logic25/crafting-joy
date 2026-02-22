# CareCircle

A family-centered caregiving coordination platform that answers the question: **"How's Mom?"**

## What It Does

CareCircle is a mobile-first, chat-first app that helps families coordinate care for aging loved ones. At its core is **Circle AI** — a warm, knowledgeable assistant that knows Mom's medications, doctors, blood pressure trends, and appointments so the whole family stays informed.

### Key Features

- **AI Care Assistant (Circle)** — Ask questions like "When is Mom's next appointment?" or "What medications is she on?" and get instant, context-aware answers
- **Family Group Chat** — Coordinate care tasks and share updates with siblings and caregivers in one place
- **Medication Tracking** — Monitor prescriptions, refill dates, and medication schedules
- **Blood Pressure Logging** — Track vitals over time with trend analysis
- **Appointment Management** — Schedule, assign coverage, and log visit summaries
- **Doctor & Provider Directory** — Keep all provider contacts, office hours, and portal links organized
- **Document Storage** — Upload and organize lab results, discharge papers, insurance cards, and more
- **Emergency Info** — One-tap access to allergies, emergency contacts, and preferred hospital

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (Supabase) — auth, database, edge functions
- **AI:** Google Gemini via Lovable AI gateway
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
│   └── ui/           # shadcn/ui primitives
├── contexts/         # Auth context provider
├── data/             # Mock data for development
├── hooks/            # Custom React hooks
├── pages/            # Route pages (Dashboard, Chat, Medications, etc.)
├── types/            # TypeScript interfaces
└── integrations/     # Backend client configuration

supabase/
├── functions/        # Edge functions (Circle AI chat)
└── migrations/       # Database schema migrations
```

## License

Private — All rights reserved.
