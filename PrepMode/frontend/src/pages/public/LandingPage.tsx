import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Globe2,
  GraduationCap,
  ListChecks,
  Newspaper,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Badge, Button, Card } from '@/components/common/ui'
import { EXAM_MODES } from '@/types'

const pillars = [
  {
    icon: BookOpen,
    title: 'English & Verbal',
    text: 'Reading comprehension passages, grammar lessons, and verbal strategy explainers.',
  },
  {
    icon: Sparkles,
    title: 'Vocabulary',
    text: 'Root-word sets, synonym clusters, idioms, and usage-first word building.',
  },
  {
    icon: Globe2,
    title: 'GK & Static GK',
    text: 'Awareness primers and recall-oriented material across polity, geography, and economy.',
  },
  {
    icon: Newspaper,
    title: 'Current Affairs',
    text: 'Framework-first briefs that teach you how to track recurring exam themes.',
  },
  {
    icon: GraduationCap,
    title: 'Editorials',
    text: 'Original editorial analysis with argument structure and vocabulary in context.',
  },
  {
    icon: ListChecks,
    title: 'Quizzes',
    text: 'Original practice questions with post-submit review and explanations.',
  },
  {
    icon: RotateCcw,
    title: 'Revision',
    text: 'Bookmarks and saved questions pulled into one focused revision queue.',
  },
  {
    icon: TrendingUp,
    title: 'Progress',
    text: 'Completion counts and quiz accuracy that show real movement, not noise.',
  },
]

const steps = [
  { title: 'Pick your exam mode', text: 'CAT, UPSC, SSC, Banking, CLAT, CUET, MBA, or Defence Exams — one switch reshapes your feed.' },
  { title: 'Study focused content', text: 'Read original, reviewed material across English, GK, current affairs, and editorials.' },
  { title: 'Practice and review', text: 'Attempt quizzes, see explanations after submitting, and save the questions worth revisiting.' },
  { title: 'Revise and track', text: 'Your bookmarks, saved questions, and completions roll into revision and progress views.' },
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge tone="indigo" className="mb-4">
              English + GK. One goal. Many exams.
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Focused learning for <span className="text-primary-600">competitive exams</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-gray-600">
              PrepMode helps you master English, Vocabulary, GK, Current Affairs, Editorials, and Revision —
              shaped by the exam you are preparing for, without the clutter.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg">
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link to="/exam-modes">
                <Button variant="outline" size="lg">
                  Explore exam modes
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden /> Original, reviewed content
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden /> 9 exam contexts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden /> Distraction-free
              </span>
            </div>
          </div>

          {/* Dashboard marketing preview (static illustration) */}
          <Card className="overflow-hidden p-0" aria-hidden>
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-32 rounded bg-gray-200" />
                  <div className="mt-2 h-2 w-44 rounded bg-gray-100" />
                </div>
                <Badge tone="indigo">CAT</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Completed', value: '126' },
                  { label: 'Quiz accuracy', value: '68%' },
                  { label: 'Saved items', value: '54' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-[10px] font-medium uppercase text-gray-400">{stat.label}</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {['Reading comprehension practice', 'Monetary policy explainer', 'Editorial of the week'].map((row) => (
                  <div key={row} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                        <BookOpen className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-medium text-gray-700">{row}</span>
                    </div>
                    <Bookmark className="h-3.5 w-3.5 text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Exam mode strip */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
            One workspace, every exam context
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {EXAM_MODES.map((mode) => (
              <span
                key={mode}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm"
              >
                {mode}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Everything you need. Nothing you don't.</h2>
            <p className="mt-3 text-gray-600">
              Eight focused pillars cover the language and awareness sections of every major exam.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="p-5 transition-shadow hover:shadow-card-hover">
                <span className="inline-flex rounded-lg bg-primary-50 p-2.5 text-primary-600">
                  <pillar.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{pillar.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{pillar.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">How exam mode shapes your prep</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6">
              <ShieldCheck className="h-6 w-6 text-primary-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-gray-900">Original by design</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                Every brief, passage, and question is original educational material. Sources inform our writing;
                they are never copied.
              </p>
            </Card>
            <Card className="p-6">
              <CheckCircle2 className="h-6 w-6 text-primary-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-gray-900">Reviewed before you see it</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                Nothing reaches your feed without editorial review. Drafts stay drafts until a human publishes them.
              </p>
            </Card>
            <Card className="p-6">
              <TrendingUp className="h-6 w-6 text-primary-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-gray-900">Honest progress</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                Completions and quiz accuracy — measured simply, reported plainly. No inflated promises.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-primary-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-14 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">Start studying in focus mode</h2>
          <p className="max-w-xl text-primary-100">
            Create a free account, pick your exam mode, and get a feed built for the way you prepare.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
              Create your account
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
