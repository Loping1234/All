# PrepMode Claude Code Goal

You are building PrepMode from scratch using this folder as the full project handoff.

Read files in this exact order:

1. `Summary.md`
2. `deep-research-report.md`
3. `Images/Readme.md`
4. UI screenshots under `Images/Admin/`
5. UI screenshots under `Images/Main-Learner-Images/`

## Controlling Source of Truth

`Summary.md` is the main implementation contract.

`deep-research-report.md` is the supporting architecture, product, API, data model, security, and QA reference.

`Images/` are visual references only.

If screenshots conflict with `Summary.md`, follow `Summary.md`.

If screenshots show unsupported features, ignore them.

## Build Goal

Build PrepMode as a focused exam-mode-based learning platform for:

* English
* Vocabulary
* GK
* Static GK
* Current Affairs
* Editorials
* Quizzes
* Revision
* Bookmarks
* Saved Questions
* Progress
* Admin Content Management
* Admin Source Inbox

Supported exam modes:

* All
* CAT
* UPSC
* SSC
* Banking
* CLAT
* CUET
* MBA
* Defence Exams

Do not expand into full exam preparation.

## Hard Scope Boundary

Do not build or show:

* Pro plans
* Upgrade prompts
* Paid plans
* Mock tests
* Study plans
* Notes as a visible nav label
* Community
* Leaderboard
* Marketplace
* Video courses
* AI generation
* AI study plans
* Full mock exams
* Quant
* Reasoning
* JEE
* Courses
* Syllabus
* Live classes
* Subscriptions
* Premium analytics

If any reference image contains these, treat them as visual noise and remove them.

## Content Policy

PrepMode is not a content aggregator.

Sources are inputs. PrepMode content is original educational output.

Do not scrape full articles.

Do not store full newspaper article bodies.

Do not auto-publish AI output.

Do not build AI draft generation in this version.

Admin/human review is required before learner-visible content is published.

Source Inbox stores metadata only.

## Visual System

Use one consistent design system across the whole app:

* light gray app background
* white raised cards
* pale sidebar
* indigo/purple primary accent
* soft lavender active states
* rounded corners
* thin borders
* soft shadows
* clean sans-serif typography
* consistent spacing
* consistent sidebar width
* consistent topbar height
* consistent card rhythm
* desktop-first responsive layout

Do not copy inconsistent sidebar colors or unsupported screenshot text.

Learner sidebar must use:

* Dashboard
* English
* GK
* Current Affairs
* Editorials
* Quizzes
* Revision
* Bookmarks
* Saved Questions
* Progress
* Profile

Admin sidebar must use:

* Admin Dashboard
* Manage Content
* Add Content
* Add Current Affairs
* Add Editorial
* Add Quiz
* Source Inbox
* Manage Tags
* Manage Users

## Technical Stack

Use:

* React
* Vite
* TypeScript if practical
* Tailwind CSS
* React Router
* Axios
* TanStack Query
* React Hook Form
* Zod
* shadcn/ui or equivalent reusable component primitives
* Radix UI where needed
* lucide-react
* Recharts where charts are needed
* Node.js
* Express
* MongoDB
* Mongoose
* JWT auth
* bcryptjs
* dotenv
* CORS
* helmet
* express-rate-limit

Do not add unnecessary packages.

## Execution Order

Build in this order:

1. Project scaffold
2. Backend foundation
3. Auth backend
4. Content backend
5. Quiz backend
6. Bookmarks, saved questions, progress backend
7. Source Inbox backend
8. Seed script and demo data
9. Frontend layout shell
10. Frontend auth
11. Learner content pages
12. English page polish
13. GK, Current Affairs, Editorials pages
14. Quiz UI
15. Bookmarks, Saved Questions, Revision, Progress
16. Admin Dashboard
17. Admin Manage Content
18. Admin Add/Edit Content
19. Admin Add Quiz
20. Admin Source Inbox
21. Landing, Login, Signup, Profile, UI states
22. Full QA
23. README and final report

Do not skip verification between phases.

## Required Behavior

Public landing page is static.

Learner pages must use real backend data.

Admin pages must use admin APIs.

Quizzes must not expose answers before submission.

Saved Questions must not expose correct answers or explanations.

Progress must not expose correct answers or explanations.

Content list cards must not expose full content body.

Content detail view can show full body.

Source Inbox must not be visible to learners.

Public signup must never create admin users.

## Environment Rules

Create `.env.example` files.

Do not create real `.env` files unless explicitly asked.

Do not hardcode secrets.

Do not commit credentials.

Use:

* backend API base `/api`
* frontend env key `VITE_API_BASE_URL`
* auth token key `prepmode_token`

## Required Verification

Backend:

```powershell
cd backend
npm test
node --check server.js
Get-ChildItem -Path 'server.js','src','test','scripts' -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Frontend:

```powershell
cd frontend
npm run build
npm run lint
```

Safety scans:

```powershell
rg -n "\b(Pro|Upgrade|Mock Tests|Study Plan|Notes|Paid|Community|Leaderboard|AI Study Plan|Video courses|Full mock tests|Unlimited analytics|predictive score|adaptive analytics|AI insights|premium analytics|ranking|advanced analytics|automated moderation|AI content generation|marketplace|subscription|premium)\b" src index.html public
rg -n "correctAnswer|explanation" src
rg -n "dangerouslySetInnerHTML" src
Test-Path .env
```

Allowed `correctAnswer` / `explanation` matches only:

* admin quiz form/API
* post-submit quiz result review
* progress aggregate `correctAnswers`

## Final Deliverable

Return a final implementation report with:

1. Files created
2. Files modified
3. Backend routes implemented
4. Frontend routes implemented
5. Models created
6. Demo seed data summary
7. Auth and role behavior
8. Data exposure safeguards
9. UI screens completed
10. Tests run
11. Build/lint results
12. Safety scan results
13. Known limitations
14. How to run locally
15. Demo credentials
16. Remaining recommended next steps

## Important

Do not blindly copy screenshots.

Extract the shared design language.

Use Summary.md as the legal and functional contract.

Use deep-research-report.md as the architecture and QA reference.

Use Images only for visual polish.
