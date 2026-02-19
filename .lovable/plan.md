

# Path to HIPAA Compliance and Medical Records Integration

## Why Records Matter

Right now Circle answers from manually-entered data (meds, BP readings, appointments). With actual medical records, Circle could:
- Read lab results and explain them in plain language
- Spot trends across visits automatically
- Flag conflicts between what different doctors prescribed
- Summarize discharge instructions without anyone typing them in

That's the difference between a "nice tool" and a "can't live without it" product.

## When HIPAA Kicks In

You cross the HIPAA line the moment you:
1. **Pull data from a hospital/doctor system** (EHR integration via Epic, Cerner, etc.)
2. **Receive data from a provider on behalf of a patient** (fax, secure message, API)
3. **A healthcare provider pays you** to manage their patient data

Right now (family self-entering data) = consumer app, no HIPAA required.

## The Build Sequence

### Stage 1: Launch Without HIPAA (Now - Month 3)
What you're building today. Family enters everything manually.

- Finish Phase 9 (auth, database, RLS)
- Add Stripe billing
- Ship to real families, get feedback
- Revenue target: prove people will pay

### Stage 2: "Bring Your Own Records" (Month 3-6)
Let families **upload** documents (PDFs, photos of paperwork). Still consumer app territory.

- Document upload with OCR (extract text from photos of lab results)
- Circle reads uploaded documents and adds context to answers
- Privacy policy clearly states "you control your data"
- This is a gray area — not technically HIPAA, but implement HIPAA-grade security anyway

### Stage 3: HIPAA Compliance (Month 6-9)
Prepare infrastructure for provider integrations.

**What's needed:**
- **Business Associate Agreement (BAA)** with your cloud provider — Supabase offers a HIPAA-compliant tier with BAA
- **Encryption** — already have TLS in transit; add encryption at rest for PHI columns
- **Audit logging** — track every access to medical records (who viewed what, when)
- **Access controls** — role-based, time-limited, with session management
- **Breach notification process** — documented procedure
- **Security risk assessment** — formal document (templates available, ~$2-5K with a consultant)
- **HIPAA training** for anyone with data access
- **Data retention and deletion policies**

**Cost estimate:** $5K-15K for initial compliance setup (consultant + BAA + infrastructure upgrades)

### Stage 4: Medical Records Integration (Month 9-12)
Connect to real health systems.

**Options from easiest to hardest:**

| Approach | Effort | What You Get |
|----------|--------|-------------|
| Apple Health Records API | Low | Patient-authorized sharing of records from 900+ hospitals |
| SMART on FHIR (open standard) | Medium | Direct EHR read access with patient consent |
| Health Gorilla / Particle Health | Medium | Aggregator APIs — one integration, many sources |
| Direct Epic/Cerner integration | High | Deepest access, requires vendor certification |

**Recommended first integration:** Apple Health Records or a FHIR aggregator like Health Gorilla. Patient authorizes sharing, you receive structured data (labs, meds, conditions, encounters) without needing a relationship with each hospital.

## What to Build Right Now

To prepare for this path without slowing down your launch:

1. **Finish Phase 9** — auth, database, RLS (security foundation)
2. **Add document upload** (Stage 2) — families upload PDFs/photos, Circle reads them
3. **Build audit logging** into the database from day one — track data access
4. **Structure your data model** to match FHIR resources (your types already align well)
5. **Keep AI processing server-side only** — never send PHI to client-side AI

## Bottom Line

- **Launch now** as a consumer app (no HIPAA needed)
- **Month 3-6**: Add document uploads with HIPAA-grade security
- **Month 6-9**: Get formally HIPAA compliant (~$10K)
- **Month 9-12**: Connect to real medical records via FHIR/aggregators
- Records integration is what turns a $10/mo tool into a $30-50/mo product families depend on

The key insight: **build the security infrastructure now** (Phase 9 with proper RLS, audit logs, encryption patterns) so HIPAA compliance later is a paperwork exercise, not a rewrite.

