import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button, Card } from '@/components/common/ui'

const modes = [
  { mode: 'All', text: 'The full PrepMode library across every exam context — ideal when you are exploring or preparing broadly.' },
  { mode: 'CAT', text: 'Reading comprehension, verbal ability, parajumbles, and editorial-grade vocabulary for management entrance prep.' },
  { mode: 'UPSC', text: 'Current affairs frameworks, editorial analysis, polity and economy awareness for civil services preparation.' },
  { mode: 'SSC', text: 'Grammar, error spotting, one-word substitutions, and static GK recall for staff selection exams.' },
  { mode: 'Banking', text: 'Banking awareness, monetary policy concepts, English language practice, and economy fundamentals.' },
  { mode: 'CLAT', text: 'Passage-based English, legal-adjacent current awareness, and inference-driven verbal practice.' },
  { mode: 'CUET', text: 'University entrance English and general test material with foundational reading support.' },
  { mode: 'MBA', text: 'Verbal ability and awareness material aligned with management entrance tests beyond CAT.' },
  { mode: 'Defence Exams', text: 'English, GK, and current awareness material for NDA, CDS, AFCAT, and allied defence exams.' },
]

export default function ExamModesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Exam modes</h1>
        <p className="mt-3 text-gray-600">
          Exam modes are contexts, not separate apps. Switching modes reshapes your content feed, quizzes, and
          revision queue around the exam you are preparing for — your library and progress stay with you.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((entry) => (
          <Card key={entry.mode} className="p-5">
            <h2 className="font-semibold text-primary-700">{entry.mode}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{entry.text}</p>
          </Card>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link to="/signup">
          <Button size="lg">
            Pick your mode and start
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </div>
    </div>
  )
}
