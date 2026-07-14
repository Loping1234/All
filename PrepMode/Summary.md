C:\Users\PRANAY\OneDrive\Documents\PrepMode\Summary.md

Below is a full handoff prompt for Claude Code / Fable 5 in xhigh mode. Store it in a README or goal file and run it as the master build instruction.

# PrepMode Full Project Build Prompt

You are building **PrepMode** from scratch.

PrepMode is a premium exam-preparation web application focused on:

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

The product must feel like a serious modern edtech SaaS dashboard, not a generic coaching website.

Primary tagline:

> English + GK. One Goal. Many Exams.

Core positioning:

> Focused Learning for Competitive Exams

The app must support multiple exam modes:

* All
* CAT
* UPSC
* SSC
* Banking
* CLAT
* CUET
* MBA
* Defence Exams

The app should be production-quality enough for local demo, portfolio presentation, and later deployment.

---

# 1. Core Product Rule

PrepMode is not a content aggregator.

Permanent content policy:

> Sources are inputs. PrepMode content is original educational output.

Never build a flow where external source content is copied and directly shown to learners.

Allowed flow:

```text
SourceItem
→ DraftItem, later
→ ContentItem
→ QuizQuestion
```

For this build, implement:

```text
SourceItem
ContentItem
QuizQuestion
Bookmark
SavedQuestion
Progress
QuizAttempt
User
```

Do not implement AI draft generation unless explicitly requested later.

Do not implement scraping.

Do not store full article bodies from newspapers or third-party sources.

---

# 2. Recommended Tech Stack

Use this stack unless the existing repo already has a different locked setup.

## Frontend

* React
* Vite
* TypeScript preferred
* Tailwind CSS v4
* React Router
* Axios
* TanStack Query
* React Hook Form
* Zod
* shadcn/ui
* Radix UI
* lucide-react
* Recharts
* Framer Motion only for subtle UI motion if already installed or if explicitly allowed
* No unnecessary UI libraries
* Avoid SweetAlert2
* Avoid direct Popper.js usage
* Avoid Chart.js unless Recharts cannot satisfy a chart need

## Backend

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
* morgan or simple logger
* node:test or Jest/Vitest for backend tests

## Database

* MongoDB local or MongoDB Atlas

## Deployment Later

* Frontend: Vercel or Netlify
* Backend: Render, Railway, or VPS
* Database: MongoDB Atlas

Do not implement deployment unless explicitly requested.

---

# 3. Project Structure

Create a monorepo-style project:

```text
prepmode/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      scripts/
      utils/
      validators/
      app.js
      server.js
    test/
    .env.example
    .gitignore
    package.json

  frontend/
    src/
      api/
      assets/
      components/
        common/
        navigation/
        content/
        quiz/
        saved/
        progress/
        admin/
      config/
      context/
      hooks/
      layouts/
      pages/
        public/
        learner/
        admin/
        system/
      routes/
      styles/
      App.jsx or App.tsx
      main.jsx or main.tsx
      index.css
    .env.example
    .gitignore
    package.json

  README.md
```

Use consistent naming.

Do not put secrets into git.

---

# 4. Environment Variables

## Backend `.env.example`

Create:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/prepmode
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## Frontend `.env.example`

Create:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Do not create real `.env` automatically.

Ensure:

```text
backend/.env
frontend/.env
```

are ignored by `.gitignore`.

---

# 5. Backend Requirements

## 5.1 Express App

Implement:

* `server.js`
* `src/app.js`
* JSON body parsing
* CORS
* helmet
* route registration
* central error handler
* not found handler

Backend API base:

```text
/api
```

---

# 6. Auth System

## User Roles

Use strict role values:

```js
admin
registered_learner
```

No public admin signup.

## User Model

Fields:

```js
name
email
passwordHash
role
status
activeExamMode
defaultExamMode
createdAt
updatedAt
```

Constraints:

* email unique
* passwordHash never returned
* role default: `registered_learner`
* signup cannot create admin
* admin must be seeded manually or created locally through script

## Auth Routes

Implement:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

Behavior:

* Signup creates only registered learner.
* Login returns JWT token and safe user object.
* `/me` returns current authenticated user.
* Logout can be stateless and return success.
* Failed `/me` should be handled by frontend by clearing auth.

## Auth Middleware

Implement:

```js
protect
requireRole(...roles)
optionalAuth
```

Rules:

* `protect` is strict.
* `optionalAuth` only used for public learner-readable content if necessary.
* Admin routes require `protect + requireRole("admin")`.
* Learner routes require `protect + requireRole("registered_learner")`.

---

# 7. Exam Mode Support

Supported modes:

```js
[
  "All",
  "CAT",
  "UPSC",
  "SSC",
  "Banking",
  "CLAT",
  "CUET",
  "MBA",
  "Defence Exams"
]
```

User should have:

```js
activeExamMode
defaultExamMode
```

Frontend should allow switching active exam mode locally or through backend profile update if implemented.

---

# 8. Content System

## ContentItem Model

Create `ContentItem`.

Fields:

```js
title
slug
summary
body
category
subjectTags
topicTags
examModeTags
difficulty
contentType
recencyTag
revisionValueTags
readingLevel
status
publishedAt
createdBy
updatedBy
modeSpecificNotes
createdAt
updatedAt
```

Enums:

### category

```js
English
Vocabulary
GK
Static GK
Current Affairs
Editorials
Revision
```

### difficulty

```js
Easy
Medium
Hard
Advanced
```

### contentType

```js
Article
Note
Brief
Editorial Analysis
Vocabulary Set
Revision Set
Explainer
Practice Passage
Grammar Lesson
```

### status

```js
draft
published
archived
```

Rules:

* Learners only see `published`.
* Admin can create/update/publish/unpublish/archive.
* `body` can contain plain text or markdown-style text, but frontend must render safely as text unless a safe markdown renderer is intentionally added later.
* Do not use `dangerouslySetInnerHTML`.

## Public/Learner Content Routes

```text
GET /api/content
GET /api/content/:id
GET /api/content/slug/:slug
```

Allowed query params:

```text
examMode
subject
topic
difficulty
contentType
recency
```

Do not require learners to send `status`.

Backend should internally limit visible content to published.

Exam mode behavior:

When `examMode=CAT`, return:

```text
Content with examModeTags containing CAT
OR
Content with examModeTags containing All
```

Same logic for other modes.

## Admin Content Routes

```text
GET    /api/admin/content
POST   /api/admin/content
PUT    /api/admin/content/:id
PATCH  /api/admin/content/:id/publish
PATCH  /api/admin/content/:id/unpublish
PATCH  /api/admin/content/:id/archive
DELETE /api/admin/content/:id
```

Delete can soft-delete or archive.

Admin route only.

---

# 9. Quiz System

## QuizQuestion Model

Fields:

```js
questionText
options
correctAnswer
explanation
subjectTags
topicTags
examModeTags
difficulty
contentType
status
createdBy
updatedBy
sourceContentId
createdAt
updatedAt
```

Rules:

* correctAnswer must exactly match one of the options.
* Learner question list must not expose `correctAnswer` or `explanation`.
* Post-submit quiz review may expose correctAnswer and explanation.
* Admin can create questions with correctAnswer and explanation.

## Learner Question Routes

```text
GET /api/questions
GET /api/questions/:id
```

Learner response must exclude:

```text
correctAnswer
explanation
```

## Admin Question Routes

```text
POST  /api/admin/questions
PUT   /api/admin/questions/:id
PATCH /api/admin/questions/:id/publish
PATCH /api/admin/questions/:id/archive
```

---

# 10. Quiz Attempt System

## QuizAttempt Model

Fields:

```js
user
examMode
questionIds
answers
score
totalQuestions
correctAnswers
accuracy
status
startedAt
completedAt
createdAt
updatedAt
```

Status:

```js
in_progress
completed
abandoned
```

## Routes

```text
POST /api/quiz-attempts/start
POST /api/quiz-attempts/:id/submit
GET  /api/quiz-attempts
GET  /api/quiz-attempts/:id
```

Rules:

* Start creates attempt.
* Submit evaluates answers server-side.
* Result review returns:

  * selectedAnswer
  * correctAnswer
  * explanation
  * score
  * accuracy
* Before submission, do not expose answers/explanations.

---

# 11. Bookmark System

## Bookmark Model

Fields:

```js
user
content
examModeAtSave
createdAt
updatedAt
```

Unique:

```js
user + content
```

Routes:

```text
GET    /api/bookmarks
POST   /api/bookmarks
DELETE /api/bookmarks/:id
```

Rules:

* User can only access own bookmarks.
* Bookmark cards should not expose full content body.

---

# 12. Saved Questions System

## SavedQuestion Model

Fields:

```js
user
question
examModeAtSave
reason
createdAt
updatedAt
```

Unique:

```js
user + question
```

Routes:

```text
GET    /api/saved-questions
POST   /api/saved-questions
DELETE /api/saved-questions/:id
```

Rules:

* Saved question listing must not expose `correctAnswer` or `explanation`.
* Save action can appear after quiz result review.

---

# 13. Progress System

## ContentCompletion Model

Fields:

```js
user
content
examModeAtCompletion
completedAt
createdAt
updatedAt
```

Unique:

```js
user + content
```

Progress routes:

```text
GET    /api/progress/summary
GET    /api/progress
GET    /api/progress/by-mode/:examMode
POST   /api/progress/content/:contentId/complete
DELETE /api/progress/content/:contentId/complete
```

Progress summary should include:

```js
completedContentCount
quizAttemptsCount
questionsAttempted
correctAnswers
accuracy
bookmarkCount
savedQuestionCount
lastActivityAt
```

Rules:

* Progress `correctAnswers` is aggregate count, not leaked answer data.
* Progress UI must not show `correctAnswer` or `explanation`.
* Progress recent content must not show full body.

---

# 14. Source Inbox System

Implement admin-only Source Inbox.

This is metadata/provenance only.

## SourceItem Model

Fields:

```js
sourceName
sourceType
sourceUrl
normalizedSourceUrl
title
sourceDate
feedType
fetchedAt
processingStatus
notes
feedExcerpt
relatedContentId
createdBy
updatedBy
createdAt
updatedAt
```

Enums:

### sourceType

```js
official_reference
policy_reference
financial_regulator
editorial_reference
report_reference
original_practice
original_note
```

### feedType

```js
rss
manual
```

### processingStatus

```js
new
selected
ignored
```

Rules:

* SourceItem is admin-only.
* SourceItem does not create content.
* SourceItem does not create quiz.
* SourceItem does not create draft in this version.
* Do not store full article body.
* Do not fetch article page.
* Do not scrape HTML.
* Do not auto-fetch sources on startup.
* No cron.

## URL Normalization

Store both:

```js
sourceUrl
normalizedSourceUrl
```

Deduplicate on:

```js
normalizedSourceUrl
```

Normalization rules:

* lowercase protocol and hostname
* remove hash
* remove trailing slash unless root
* remove only tracking query params:

  * utm_source
  * utm_medium
  * utm_campaign
  * utm_term
  * utm_content
  * fbclid
  * gclid
* sort remaining query params
* preserve meaningful query params:

  * PRID
  * id
  * Id
  * ID
  * articleId
  * itemId
  * doListing
  * sid
  * smid
  * ssid
* do not follow redirects
* do not remove unknown query params

## Source Routes

```text
GET   /api/admin/source-items
POST  /api/admin/source-items
PATCH /api/admin/source-items/:id/select
PATCH /api/admin/source-items/:id/ignore
PATCH /api/admin/source-items/:id/notes
POST  /api/admin/source-items/fetch
```

Rules:

* Manual add only stores metadata.
* Fetch is manual trigger only.
* RSS fetch may have feed config with `feedUrl: null` until verified.
* If feedUrl is null, return skipped summary.
* If no XML parser dependency exists, use minimal parser for:

  * title
  * link
  * pubDate
  * description
* `feedExcerpt` max 500 characters.
* No full article body.

---

# 15. Demo Seed Data

Create:

```text
backend/scripts/seedDemoData.js
backend/scripts/DEMO_WALKTHROUGH.md
```

Seed script must:

* refuse `NODE_ENV=production`
* be manual only
* not auto-run
* upsert by stable identifiers
* not delete non-demo data
* be idempotent
* run twice without duplicates

Demo accounts:

## Admin

```text
name: PrepMode Admin
email: demo.admin@prepmode.local
password: DemoAdmin123!
role: admin
status: active
activeExamMode: All
defaultExamMode: All
```

## Learner

```text
name: Demo Learner
email: demo.learner@prepmode.local
password: DemoLearner123!
role: registered_learner
status: active
activeExamMode: CAT
defaultExamMode: CAT
```

Seed:

* at least 50–100 content items if practical
* minimum 12 representative content items
* at least 100 quiz questions if practical
* minimum 8 representative quiz questions
* sample bookmarks
* sample saved questions
* sample content completions
* optional completed quiz attempt if model shape is stable

Seed categories:

* English
* Vocabulary
* GK
* Static GK
* Current Affairs
* Editorials
* Revision

Do not seed:

* Quant
* Reasoning
* Puzzles
* Full Mock Tests
* Paid plans
* AI features
* Community
* Marketplace
* Video courses
* Live classes

## Seed Source Metadata

Every seeded content item must have `modeSpecificNotes`.

Use flat metadata:

```js
modeSpecificNotes: {
  sourceName,
  sourceType,
  sourceUrl,
  sourceDate,
  isOriginalSummary: true
}
```

`sourceUrl` and `sourceDate` only when truthful.

`isOriginalSummary: true` means:

```text
PrepMode-authored educational output.
```

It does not mean:

```text
reviewed
fact-checked
legally cleared
admin-approved
```

Use sourceType:

```text
official_reference
policy_reference
financial_regulator
editorial_reference
report_reference
original_practice
original_note
```

Do not fabricate provenance.

---

# 16. Frontend Architecture

## Core Layouts

Create:

```text
PublicLayout
LearnerLayout
AdminLayout
```

## Public Routes

```text
/
 /exam-modes
/about
/login
/signup
/403
/500
*
```

## Learner Routes

Protected by registered learner role:

```text
/dashboard
/english
/gk
/current-affairs
/editorials
/quizzes
/revision
/bookmarks
/saved-questions
/progress
/profile
```

## Admin Routes

Protected by admin role:

```text
/admin
/admin/content
/admin/content/new
/admin/quizzes/new
/admin/current-affairs/new
/admin/editorials/new
/admin/tags
/admin/users
/admin/source-inbox
```

## Route Guard Rules

* unauthenticated protected routes redirect to `/login`
* learner trying admin route goes to `/403`
* admin trying learner route goes to `/403`
* authenticated learner visiting `/login` or `/signup` redirects to `/dashboard`
* authenticated admin visiting `/login` or `/signup` redirects to `/admin`

---

# 17. Frontend Design System

Create reusable primitives:

```text
Button
Card
Badge
EmptyState
LoadingState
PlaceholderPage
LearnerPageShell
PageHeader
SectionHeader
StatCard
FilterBar
Tabs
ModalShell
ListError
FormField
Input
Select
Textarea
ListRow
ActionCard
MetricCard
```

Visual style:

```text
light gray background
white raised cards
indigo/purple accents
soft gradients
rounded corners
subtle borders
soft shadows
clean typography
consistent spacing
desktop-first responsive
```

Do not use visible word:

```text
Notes
```

Use instead:

```text
memos
briefs
material
revision
saved material
```

Blocked UI terms:

```text
Pro
Upgrade
Mock Tests
Study Plan
Notes
Paid
Community
Leaderboard
AI Study Plan
Video courses
Full mock tests
Unlimited analytics
predictive score
adaptive analytics
AI insights
premium analytics
ranking
advanced analytics
automated moderation
AI content generation
marketplace
subscription
premium
```

Do not show these in frontend copy.

---

# 18. Landing Page

Create a premium static landing page at `/`.

Visual direction:

* modern edtech SaaS
* hero copy on left
* dashboard mockup on right
* floating exam mode pills
* product pillar cards
* workflow section
* dashboard preview section
* source/content credibility section
* CTA band
* footer

Hero:

```text
Eyebrow:
English + GK. One Goal. Many Exams.

Heading:
Focused Learning for Competitive Exams

Subheading:
Build exam-ready command over English, GK, current affairs, editorials, quizzes, and revision inside one focused PrepMode workspace.
```

CTAs:

```text
Get Started -> /signup
Explore Exam Modes -> /exam-modes
```

Sections:

1. Navbar
2. Hero
3. Exam mode strip
4. Product pillars
5. How PrepMode Works
6. Dashboard preview
7. Source/content credibility
8. CTA band
9. Footer

Do not fetch data on landing page.

Do not import learner dashboard.

Do not use external images/videos.

---

# 19. Learner Dashboard

Dashboard should include:

* Welcome back
* Current Mode
* Today’s English
* Today’s Awareness
* Daily Quiz
* Saved / Revision
* Progress Summary
* Editorial of the Day
* Recommended For You

Can start static, but ideally pull latest content counts if easy.

Do not overclaim analytics.

---

# 20. English Module

This is the most important learner module visually.

Design it as a mini product.

## English Home Page

Route:

```text
/english
```

Must fetch real backend content from:

```text
GET /api/content
```

Use categories:

```js
["English", "Vocabulary"]
```

Use active exam mode:

```js
user.activeExamMode || "All"
```

Do not send `status`.

UI sections:

* Page header: English & Verbal
* Featured English item
* Explore Topics
* Search and filters
* Dynamic content feed
* Right sidebar with simple content counts

Explore Topics should remain clickable filters:

```text
Reading Comprehension
Grammar
Vocabulary
Para Summary
Cloze Practice
Editorial Vocabulary
```

Filters:

```text
search
difficulty
contentType
readingLevel
topic
```

Dynamic feed cards show:

```text
title
summary
category
contentType
difficulty
readingLevel
recencyTag
topicTags
examModeTags
publishedAt
Read button
```

Click opens content detail modal.

## Reading Comprehension UI

For RC content, detail view should feel like:

* passage title
* metadata row
* full passage body
* right sidebar:

  * passage summary
  * key vocabulary
  * reading level
  * estimated time
  * topic tags
* action buttons:

  * Save for Revision
  * Mark Complete
  * Start Practice if linked questions exist
* comprehension question panel if questions are connected

## Vocabulary Builder UI

Show:

* vocabulary set title
* word list
* selected word detail
* meaning
* usage sentence
* synonyms
* antonyms
* practice actions:

  * Match
  * Fill in the Blank
  * Quick Quiz
* progress strip

## Grammar Practice UI

Show:

* grammar topic cards
* selected lesson
* rule explanation
* correct/incorrect examples
* practice questions
* explanation drawers after submission or reveal
* lesson objectives sidebar

## Quiz Attempt UI

Show:

* question number
* answered count
* unanswered count
* time if implemented
* passage/question card
* options
* question palette
* previous/next
* submit

Before submission:

```text
do not show correctAnswer
do not show explanation
```

## Quiz Result Review UI

After submission, show:

* score
* accuracy
* total questions
* correct/incorrect summary
* reviewed questions
* selected answer
* correct answer
* explanation
* Save Question
* Add to Revision
* Retry Similar, only if actual route exists; otherwise omit

---

# 21. GK / Current Affairs / Editorials

Routes:

```text
/gk
/current-affairs
/editorials
```

Each must use real backend content.

Mappings:

```js
/gk -> ["GK", "Static GK"]
/current-affairs -> ["Current Affairs"]
/editorials -> ["Editorials"]
```

Each page should have:

* page header
* filters
* dynamic content feed
* detail modal
* bookmark action
* mark complete action

No static mock-only main content.

---

# 22. Quizzes

Route:

```text
/quizzes
```

Must be dynamic.

Use:

```text
GET /api/questions
POST /api/quiz-attempts/start
POST /api/quiz-attempts/:id/submit
GET /api/quiz-attempts
```

Before submission:

* no correctAnswer
* no explanation

After submission:

* show correctAnswer
* show explanation
* allow Save Question

---

# 23. Bookmarks / Saved Questions / Revision

Routes:

```text
/bookmarks
/saved-questions
/revision
```

Bookmarks:

* list saved content
* remove bookmark
* no full body in card

Saved Questions:

* list saved question metadata
* do not show correctAnswer
* do not show explanation
* remove saved question

Revision:

* combine bookmarks and saved questions
* tabs:

  * All Revision
  * Bookmarked Content
  * Saved Questions
* no correctAnswer/explanation leakage

---

# 24. Progress Page

Route:

```text
/progress
```

Use:

```text
GET /api/progress/summary
GET /api/progress
GET /api/progress/by-mode/:examMode
```

Show:

* completed content count
* quiz attempts
* questions attempted
* correct answers aggregate
* accuracy
* bookmark count
* saved question count
* recent activity

Do not show:

```text
correctAnswer
explanation
full content body
```

---

# 25. Admin UI

## Admin Dashboard

Route:

```text
/admin
```

Show:

* content metrics
* published questions count
* quick actions

## Manage Content

Route:

```text
/admin/content
```

Features:

* filter by status/category/mode/difficulty/type/topic
* publish
* unpublish
* archive
* delete/archive

## Add Content

Routes:

```text
/admin/content/new
/admin/current-affairs/new
/admin/editorials/new
```

Use same form with presets.

## Add Quiz Question

Route:

```text
/admin/quizzes/new
```

Fields:

* questionText
* options
* correctAnswer
* explanation
* subjectTags
* topicTags
* examModeTags
* difficulty
* contentType
* status

## Tags and Users

Routes:

```text
/admin/tags
/admin/users
```

If backend routes do not exist, keep safe reference-only pages. Do not call missing endpoints.

## Source Inbox

Route:

```text
/admin/source-inbox
```

Use SourceItem APIs.

UI:

* manual source add
* fetch sources
* filters
* source list
* select
* ignore
* edit internal memo

No publish button.

No generate AI button.

No quiz generation button.

---

# 26. API Client

Frontend `apiClient` must:

* use `VITE_API_BASE_URL`
* fallback to `http://localhost:5000/api`
* attach token from `localStorage.getItem("prepmode_token")`
* on 401, optionally clear token if needed
* preserve error message
* attach `status` and `data` to error object for duplicate handling

Token key:

```text
prepmode_token
```

---

# 27. Content API Hook

Create `useContent`.

Inputs:

```js
{
  examMode,
  categories,
  filters
}
```

Behavior:

* calls `/content`
* sends only learner-safe backend params:

  * examMode
  * subject
  * topic
  * difficulty
  * contentType
  * recency
* never sends status
* filters category client-side if backend lacks category filter
* handles stale responses
* returns:

  * contents
  * isLoading
  * error
  * refetch

---

# 28. Modal Detail

Content detail modal:

* fetch by slug preferred
* fallback by id
* render body safely
* no raw HTML
* bookmark action
* mark complete action for learner
* no admin controls

---

# 29. UI Accuracy Requirements

The English section should visually resemble high-quality dashboard mockups:

* left learner sidebar
* top bar
* clean cards
* purple accents
* right summary sidebar
* dynamic feed cards
* content detail reading view
* vocabulary builder view
* grammar practice view
* quiz attempt view
* result review view

Do not generate only generic cards.

Make it feel like a real product.

---

# 30. Data Visibility / Security Rules

Strictly enforce:

* passwordHash never returned
* public signup cannot create admin
* learner content route never returns draft/archived content
* learner question route never returns correctAnswer/explanation
* saved question list never returns correctAnswer/explanation
* revision never shows correctAnswer/explanation
* progress never shows correctAnswer/explanation
* full content body not shown in preview cards
* no `dangerouslySetInnerHTML`
* frontend never sends `userId`
* frontend never sends `createdBy`
* frontend never sends `passwordHash`
* frontend never sends signup role

---

# 31. Testing Requirements

## Backend

Run:

```powershell
cd backend
npm test
node --check server.js
Get-ChildItem -Path 'server.js','src','test','scripts' -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Create tests for:

* auth
* content visibility
* quiz answer hiding
* quiz submit result review
* bookmarks
* saved questions
* progress
* source item routes
* seed idempotency where practical

## Frontend

Run:

```powershell
cd frontend
npm run build
npm run lint
```

Blocked-term scan:

```powershell
rg -n "\b(Pro|Upgrade|Mock Tests|Study Plan|Notes|Paid|Community|Leaderboard|AI Study Plan|Video courses|Full mock tests|Unlimited analytics|predictive score|adaptive analytics|AI insights|premium analytics|ranking|advanced analytics|automated moderation|AI content generation|marketplace|subscription|premium)\b" src index.html public
```

Exposure scan:

```powershell
rg -n "correctAnswer|explanation" src
```

Allowed matches only:

* admin quiz management
* post-submit quiz result review
* progress aggregate `correctAnswers`

Check:

```powershell
rg -n "dangerouslySetInnerHTML" src
Test-Path .env
```

Expected:

* no `dangerouslySetInnerHTML`
* frontend `.env` false unless user explicitly created local one

---

# 32. Manual QA Flow

Complete this full flow:

1. Start backend.
2. Start frontend.
3. Run demo seed.
4. Login as demo learner.
5. Visit `/dashboard`.
6. Visit `/english`.
7. Confirm real English/Vocabulary DB content appears.
8. Use topic filter.
9. Use search.
10. Open content detail.
11. Bookmark content.
12. Mark content complete.
13. Visit `/gk`.
14. Confirm real GK content.
15. Visit `/current-affairs`.
16. Confirm real current affairs content.
17. Visit `/editorials`.
18. Confirm real editorial content.
19. Visit `/quizzes`.
20. Start quiz.
21. Confirm no answers visible before submit.
22. Submit quiz.
23. Confirm answers/explanations visible after submit.
24. Save question.
25. Visit `/saved-questions`.
26. Confirm saved question appears without answer/explanation.
27. Visit `/bookmarks`.
28. Confirm bookmark appears without full body.
29. Visit `/revision`.
30. Confirm bookmarks and saved questions appear.
31. Visit `/progress`.
32. Confirm completion and quiz data appear.
33. Logout.
34. Login as demo admin.
35. Visit `/admin`.
36. Create content.
37. Publish content.
38. Create quiz question.
39. Visit `/admin/source-inbox`.
40. Add manual source.
41. Test duplicate source URL.
42. Mark source selected.
43. Mark source ignored.
44. Edit internal memo.
45. Confirm no learner page exposes SourceItem.

---

# 33. Final Deliverables

The final project must include:

* working backend
* working frontend
* working auth
* demo accounts
* seed data
* dynamic learner content pages
* polished English UI
* quizzes
* bookmarks
* saved questions
* revision
* progress
* admin content management
* admin source inbox
* safe source policy
* README setup instructions
* `.env.example` files
* tests passing

---

# 34. README Requirements

Create root README with:

* project overview
* features
* stack
* folder structure
* setup backend
* setup frontend
* env variables
* run tests
* run seed
* demo credentials
* content policy
* source inbox explanation
* known limitations
* future roadmap

Demo credentials section:

```text
Admin:
demo.admin@prepmode.local
DemoAdmin123!

Learner:
demo.learner@prepmode.local
DemoLearner123!
```

Clearly label as local demo credentials.

---

# 35. Known Limitations To Document

* Source Inbox stores metadata only.
* No AI draft generator yet.
* No scheduled RSS fetching yet.
* No deployment config yet.
* No payment/subscription.
* No community features.
* No leaderboard.
* No full mock tests.
* Content quality depends on admin-reviewed material.
* Source URLs are references, not runtime dependencies.

---

# 36. Build Strategy

Work in milestones.

Do not try to build everything in one uncontrolled edit.

Milestone order:

```text
1. Backend foundation
2. Auth
3. Content models/routes
4. Quiz models/routes
5. Bookmarks/saved/progress
6. Source Inbox backend
7. Seed data
8. Frontend foundation/layouts/routes
9. Auth frontend
10. Learner content pages
11. English module polish
12. Quiz frontend
13. Bookmarks/saved/revision/progress
14. Admin frontend
15. Source Inbox frontend
16. Landing page
17. Full QA
18. README
```

After each milestone:

```text
run relevant build/tests
fix errors before continuing
do not skip verification
```

---

# 37. Final Response Format

When finished, return a report with:

1. Files created
2. Files modified
3. Backend features implemented
4. Frontend features implemented
5. Demo data summary
6. Routes implemented
7. Security rules enforced
8. Tests run
9. Build results
10. Manual QA completed
11. Known limitations
12. How to run project
13. Demo credentials
14. Remaining recommended next steps

---

# 38. Absolute Guardrails

Do not:

* add hidden paid/pro features
* use blocked terms in visible UI
* create public admin signup
* store full external articles
* scrape websites
* auto-publish AI content
* expose correct answers before quiz submission
* expose saved-question answers
* expose full content body in preview cards
* use `dangerouslySetInnerHTML`
* commit `.env`
* hardcode secrets
* weaken auth checks
* modify role restrictions to make testing easier
* invent backend routes without wiring them properly
* leave static placeholder pages where dynamic pages are required

The finished app must be usable as a real study product, not only a visual shell.
