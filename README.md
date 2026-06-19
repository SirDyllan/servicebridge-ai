# ServiceBridge AI - Benefits Navigator

ServiceBridge AI is a web-first MVP for the USAII Global AI Hackathon 2026 Undergraduate track.

Category: Public Services  
Direction: Direction A - Benefits Navigator

The product helps students, unemployed youth, caregivers, and low-income families understand public or social support pathways they may match, what documents they should prepare, what steps to take next, and where a human or official office must verify the final decision.

This is not a general public-service portal, legal tool, medical tool, or final eligibility engine. It is a benefits navigation and document-readiness assistant with responsible AI guardrails.

## Demo Flow

Primary scenario:

```txt
I am 18, I am a student, I lost my part-time job, and I need help with food and school expenses. I do not have an ID yet.
```

The MVP flow:

1. User starts a guided check.
2. The app collects free text plus structured intake fields.
3. The guidance API classifies the benefits need.
4. Retrieval selects relevant support records.
5. AI or local fallback generates possible matches, document readiness, uncertainty notes, next steps, source labels, and human referral.
6. The user opens the handoff guide, official source, or Google Maps search link.
7. Human control begins at the official office, program website, student affairs desk, social worker, registry office, or verified support provider.

## Pages

```txt
/          Landing page
/intake    Guided benefits intake
/results   Possible support matches and document checklist
/handoff   Curated office and human handoff search
```

## API Routes

```txt
GET  /api/directory
POST /api/directory/seed
POST /api/chat
POST /api/guidance
POST /api/feedback
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| AI | OpenAI API first, Gemini fallback optional |
| Data | Firestore via REST when configured, local fallback records otherwise |
| Maps | Curated office cards + Google Maps search links, no embedded Maps API required |
| Hosting | Vercel-ready |

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local`, then add keys as needed.

```txt
OPENAI_API_KEY=
GEMINI_API_KEY=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

`OPENAI_API_KEY` is the primary provider for the current MVP. If it is missing, the app still runs with deterministic local guidance from the service directory. `GEMINI_API_KEY` is optional for a later provider switch.

The map/handoff feature does not require a Google Maps API key in this hackathon build. It uses curated office types from the service records, then opens a user-controlled Google Maps search link. A future production build can add embedded maps only after exact offices, coordinates, and source verification are available.

## Programs Carousel

The landing page includes a swipeable Programs section with source-backed starting points such as SNAP, Medicaid / CHIP, TANF, LIHEAP, BEAM, Zimbabwe National ID Replacement, State ID / REAL ID, and Women Affairs support. Cards use "may be a possible match" language, show documents to prepare, and keep final eligibility with the official agency.

## Curated Office Handoff

The `/handoff` page is the simple map module for the hackathon MVP.

It:

- Uses curated service records and office types.
- Helps users find where to verify benefit requirements, documents, or human support.
- Opens Google Maps search links such as "student affairs office Mutare" or "civil registry office Mutare".
- Does not invent exact addresses, phone numbers, office hours, or eligibility decisions.
- Shows verification status and "verify before visiting" guidance.

## Floating Chatbot

The app includes a floating ServiceBridge AI Assistant on every page.

The assistant normally uses OpenAI to interpret the user's plain-language situation and explain possible support pathways. To reduce over-reliance and improve reliability, the system also includes a grounded knowledge-base fallback built from structured service records and safe templates. If the OpenAI API is unavailable, an urgent safety case is detected, or the model call fails, users still receive document checklists, next steps, and human referral guidance.

Chatbot flow:

1. User enters a plain-language message.
2. The assistant asks follow-up questions when the message is vague or missing details such as location, urgency, ID status, proof of enrollment, or income status.
3. Safety helper detects emergency, medical, abuse, self-harm, or legal-risk language.
4. Retrieval selects relevant benefit-support records from Firestore when configured, otherwise local records.
5. OpenAI generates structured guidance when safe and available.
6. Grounded fallback returns the same JSON shape when OpenAI is unavailable or unsuitable.
7. The UI shows reply text, follow-up questions, possible matches, missing documents, human referral, and action buttons.
8. When document readiness is relevant, the chatbot can show radio-style quick checks such as "Have it" or "Missing" for documents like a birth certificate, ID, proof of residence, student letter, or income proof.

Action buttons:

- Create checklist
- Show required documents
- Find nearby office
- Speak to human
- Rate this guidance

## Firestore

Firestore is used for:

- `service_records`: structured benefit/support pathways.
- `user_feedback`: user flags and review signals.

Seed records:

```bash
curl -X POST http://localhost:3000/api/directory/seed
```

The app falls back to local records if Firebase is not configured or if Firestore is empty.

## Data Sources and Disclosure

The MVP contains synthetic/sample support records for demo purposes. Each record includes:

- `id`
- `serviceName`
- `category`
- `targetUser`
- `possibleEligibility`
- `documentsNeeded`
- `steps`
- `sourceLabel`
- `sourceUrl`
- `verificationStatus`
- `location`
- `coordinates`
- `keywords`
- `lastVerified`
- `dataOwner`
- `updateCadence`

Before real deployment, sample records should be replaced or supplemented with verified local government, campus, NGO, and community-support sources.

Current sample categories:

- Student food support
- Emergency food relief
- Student welfare support
- Education assistance and scholarship readiness
- Healthcare access referral
- Youth employment support
- Childcare and family support
- ID and document readiness
- Human verification and referral

## Responsible AI Guardrails

ServiceBridge AI must:

- Never say the user qualifies or is approved.
- Use "may qualify", "possible match", and "verify with the official office" language.
- Never invent official requirements, phone numbers, addresses, deadlines, or eligibility decisions.
- Never provide legal, medical, immigration, or emergency decisions.
- Route urgent danger, homelessness tonight, abuse, or medical emergency to human or emergency support.
- Keep source labels and uncertainty visible.
- Keep final decisions with human advisers or official offices.

## Human-in-the-Loop Handoff

The AI prepares the user. It does not replace people.

Humans remain involved for:

- Final eligibility decisions.
- Verification of documents and deadlines.
- Urgent, sensitive, legal, medical, or safety issues.
- Confirming program rules, appointments, fees, application windows, and accepted documents.

The handoff happens after the result page. ServiceBridge AI shows possible matches, documents to prepare, official/source links, and a curated office search. The user then verifies requirements with official agencies, program websites, student affairs offices, social workers, civil registry/national registry staff, or verified support organizations. Those humans make the final decision, not the AI.

## Verify Before Deployment

```bash
npm run lint
npm run build
```

For the 3-5 minute demo, use:

1. Landing page problem framing.
2. Intake page demo scenario.
3. Results page possible matches.
4. Document readiness for missing ID.
5. Curated office handoff with Google Maps search links.
6. Human referral card.
7. Feedback form for improving future guidance.

## Test Messages

Use these messages to test the chatbot and demo flow:

```txt
I am 18, I am a student, I lost my part-time job, and I need help with food and school expenses. I do not have an ID yet.
I need help with school fees.
I lost my job and need emergency food.
I have no ID but need public support.
I need healthcare support but I do not know what documents are needed.
I am a single parent and need help with childcare and food.
I need help but I do not know which office to visit.
```

## Deployment

Recommended deployment target: Vercel.

Before deploying:

```bash
npm run lint
npm run build
```

Set these environment variables in Vercel:

```txt
OPENAI_API_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

`OPENAI_API_KEY` must remain server-side only. Do not expose it as a `NEXT_PUBLIC_` variable.

## Hackathon Submission Notes

### Elevator Pitch

ServiceBridge AI is an AI-powered benefits navigator that helps students, unemployed youth, caregivers, and low-income families understand possible public support, prepare required documents, and verify next steps with the right human or official office.

### About the Project

Many students and low-income users miss food, education, emergency, and family-support pathways because benefit rules are confusing, document requirements are unclear, and users often do not know which office to visit. ServiceBridge AI turns a plain-language situation into possible support pathways, document checklists, safe next steps, source labels, uncertainty notes, and human referral guidance. The primary demo follows an 18-year-old student who lost part-time work, needs food and school-expense support, and does not have an ID yet.

### AI Architecture Explanation

Input: user message, guided intake answers, location and document status, conversation history, and structured service records.

AI capability: natural language understanding, classification, retrieval/RAG from service records, recommendation of possible support pathways, conversational follow-up, and structured output.

Processing: the system detects urgent or risky language, classifies the user's support need, retrieves matching service records, checks document readiness, asks follow-up questions where information is missing, and generates safe guidance through OpenAI. If OpenAI is unavailable or unsuitable, a grounded fallback uses the same service records and templates to return checklists, next steps, and human referral guidance.

Output: the user receives possible support pathways, why each may fit, missing documents, next steps, source labels, uncertainty notes, and a human verification route.

### Human-in-the-Loop Decision

ServiceBridge AI does not make final eligibility decisions. Final approval, official document interpretation, deadlines, emergency decisions, health decisions, and legal decisions remain with government offices, student affairs offices, social workers, case workers, qualified professionals, or verified support organizations.

### Responsible AI Guardrail

Risk: users may over-rely on AI guidance or misunderstand possible matches as guaranteed eligibility.

Mitigation: the system uses "may qualify" and "possible match" language, shows uncertainty, uses source labels, avoids invented requirements, does not provide legal or medical decisions, includes a grounded fallback, and directs users to human or official verification.

### Decision Impact Statement

Before ServiceBridge AI, a user may search multiple confusing sources and still not know what support, documents, or office they need. After ServiceBridge AI, the user receives a clear possible pathway, document checklist, next steps, source transparency, and human verification route.
