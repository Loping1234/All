import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { quizApi, savedQuestionApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { Badge, Button, Card, PageHeader, Select, StatCard } from '@/components/common/ui'
import { difficultyTone } from '@/components/common/tones'
import { DIFFICULTIES, type AttemptDetail, type LearnerQuestion } from '@/types'

type Phase = 'config' | 'attempt' | 'result'

interface AttemptState {
  attemptId: string
  questions: LearnerQuestion[]
}

// ---------- Config ----------
function QuizConfig({ onStart }: { onStart: (attempt: AttemptState) => void }) {
  const { user } = useAuth()
  const examMode = user?.activeExamMode ?? 'All'
  const [difficulty, setDifficulty] = useState('')
  const [subject, setSubject] = useState('')
  const [count, setCount] = useState(5)
  const [error, setError] = useState<string | null>(null)

  const questionsQuery = useQuery({
    queryKey: ['quiz-pool', examMode, difficulty, subject],
    queryFn: () =>
      quizApi.listQuestions({
        examMode,
        difficulty: difficulty || undefined,
        subject: subject || undefined,
        limit: 50,
      }),
  })

  const attemptsQuery = useQuery({
    queryKey: ['attempts'],
    queryFn: () => quizApi.listAttempts({ limit: 5 }),
  })

  const startMutation = useMutation({
    mutationFn: async () => {
      const pool = questionsQuery.data?.questions ?? []
      const picked = pool.slice(0, count).map((q) => q.id)
      const result = await quizApi.startAttempt({ questionIds: picked, examMode })
      return { attemptId: result.attemptId, questions: result.questions }
    },
    onSuccess: onStart,
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const available = questionsQuery.data?.meta.total ?? 0
  const poolSize = questionsQuery.data?.questions.length ?? 0

  return (
    <div>
      <PageHeader
        title="Quizzes"
        description="Topic-wise and mixed practice to sharpen accuracy and speed. Answers are revealed only after you submit."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Available questions" value={questionsQuery.isLoading ? '…' : available} icon={<ListChecks className="h-5 w-5" aria-hidden />} />
        <StatCard
          label="Recent attempts"
          value={attemptsQuery.data?.length ?? 0}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Exam mode"
          value={examMode}
          hint="Switch modes from the top bar"
          icon={<Badge tone="indigo">{examMode}</Badge>}
        />
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-gray-900">Configure your quiz</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="quiz-subject" className="mb-1.5 block text-sm font-medium text-gray-700">
              Subject
            </label>
            <Select id="quiz-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">All subjects</option>
              <option value="English">English</option>
              <option value="Vocabulary">Vocabulary</option>
              <option value="GK">GK</option>
              <option value="Static GK">Static GK</option>
              <option value="Current Affairs">Current Affairs</option>
            </Select>
          </div>
          <div>
            <label htmlFor="quiz-difficulty" className="mb-1.5 block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <Select id="quiz-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">Any difficulty</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="quiz-count" className="mb-1.5 block text-sm font-medium text-gray-700">
              Questions
            </label>
            <Select id="quiz-count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n} disabled={n > poolSize}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setError(null)
              startMutation.mutate()
            }}
            loading={startMutation.isPending}
            disabled={poolSize === 0}
          >
            Start quiz
          </Button>
        </div>
        {poolSize === 0 && questionsQuery.isSuccess && (
          <p className="mt-3 text-sm text-amber-600">No questions match these filters — try removing a filter.</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </Card>

      {/* Recent attempts */}
      {attemptsQuery.data && attemptsQuery.data.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent attempts</h2>
          <Card className="divide-y divide-gray-100 p-0">
            {attemptsQuery.data.map((attempt) => (
              <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Badge tone="indigo">{attempt.examMode}</Badge>
                  <span className="text-sm text-gray-600">
                    {new Date(attempt.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {attempt.status === 'completed' ? (
                    <>
                      <span className="font-medium text-gray-900">
                        {attempt.score}/{attempt.totalQuestions}
                      </span>
                      <Badge tone={attempt.accuracy !== null && attempt.accuracy >= 60 ? 'green' : 'amber'}>
                        {attempt.accuracy}% accuracy
                      </Badge>
                    </>
                  ) : (
                    <Badge tone="gray">{attempt.status.replace('_', ' ')}</Badge>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}

// ---------- Attempt ----------
function QuizAttemptShell({
  attempt,
  onSubmitted,
}: {
  attempt: AttemptState
  onSubmitted: (result: AttemptDetail) => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const question = attempt.questions[index]
  const answeredCount = Object.keys(answers).length
  const total = attempt.questions.length

  const submitMutation = useMutation({
    mutationFn: () =>
      quizApi.submitAttempt(
        attempt.attemptId,
        attempt.questions.map((q) => ({ questionId: q.id, selectedAnswer: answers[q.id] ?? null }))
      ),
    onSuccess: onSubmitted,
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Quiz in progress</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>
            <strong className="text-gray-900">{answeredCount}</strong> answered
          </span>
          <span>
            <strong className="text-gray-900">{total - answeredCount}</strong> remaining
          </span>
        </div>
      </div>

      {/* Question palette */}
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Question palette">
        {attempt.questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setIndex(i)}
            aria-label={`Question ${i + 1}${answers[q.id] ? ', answered' : ''}`}
            aria-current={i === index}
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
              i === index
                ? 'bg-primary-600 text-white ring-2 ring-primary-200'
                : answers[q.id]
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="indigo">Question {index + 1} of {total}</Badge>
          <Badge tone={difficultyTone(question.difficulty)}>{question.difficulty}</Badge>
          {question.topicTags.slice(0, 2).map((tag) => (
            <Badge key={tag} tone="gray">
              {tag}
            </Badge>
          ))}
        </div>

        <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed text-gray-900">{question.questionText}</p>

        <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Answer options">
          {question.options.map((option, optionIndex) => {
            const selected = answers[question.id] === option
            return (
              <button
                key={option}
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  setAnswers((prev) => {
                    const next = { ...prev }
                    if (selected) delete next[question.id]
                    else next[question.id] = option
                    return next
                  })
                }
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                  selected
                    ? 'border-primary-500 bg-primary-50 text-primary-900 ring-1 ring-primary-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-gray-50'
                )}
              >
                <span
                  className={clsx(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    selected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                {option}
              </button>
            )
          })}
        </div>
      </Card>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
        </Button>
        {index < total - 1 ? (
          <Button variant="outline" onClick={() => setIndex((i) => i + 1)}>
            Next <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}>
            Submit quiz
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------- Result + review ----------
function QuizResult({ result, onRestart }: { result: AttemptDetail; onRestart: () => void }) {
  const queryClient = useQueryClient()
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({})

  const saveMutation = useMutation({
    mutationFn: (questionId: string) => savedQuestionApi.create(questionId, 'Saved from quiz review'),
    onSuccess: (_data, questionId) => {
      setSavedIds((prev) => ({ ...prev, [questionId]: true }))
      void queryClient.invalidateQueries({ queryKey: ['saved-questions'] })
    },
  })

  const review = result.review ?? []
  const accuracy = result.accuracy ?? 0

  return (
    <div>
      <PageHeader title="Quiz results" description="Review every question with the correct answer and explanation." />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Score" value={`${result.score}/${result.totalQuestions}`} />
        <StatCard label="Accuracy" value={`${accuracy}%`} />
        <StatCard label="Exam mode" value={result.examMode} />
      </div>

      <div className="space-y-4">
        {review.map((row, index) => (
          <Card key={row.questionId} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gray">Q{index + 1}</Badge>
                {row.isCorrect ? (
                  <Badge tone="green">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden /> Correct
                  </Badge>
                ) : row.selectedAnswer === null ? (
                  <Badge tone="amber">Skipped</Badge>
                ) : (
                  <Badge tone="red">
                    <XCircle className="mr-1 h-3.5 w-3.5" aria-hidden /> Incorrect
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveMutation.mutate(row.questionId)}
                disabled={!!savedIds[row.questionId]}
                aria-label={savedIds[row.questionId] ? 'Question saved' : 'Save question'}
              >
                {savedIds[row.questionId] ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-primary-600" aria-hidden /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" aria-hidden /> Save question
                  </>
                )}
              </Button>
            </div>

            <p className="mt-3 whitespace-pre-line text-[15px] font-medium text-gray-900">{row.questionText}</p>

            <div className="mt-4 space-y-2">
              {row.options.map((option) => {
                const isCorrectOption = option === row.correctAnswer
                const isSelected = option === row.selectedAnswer
                return (
                  <div
                    key={option}
                    className={clsx(
                      'flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm',
                      isCorrectOption
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : isSelected
                          ? 'border-red-300 bg-red-50 text-red-900'
                          : 'border-gray-200 text-gray-600'
                    )}
                  >
                    {isCorrectOption && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />}
                    {!isCorrectOption && isSelected && <XCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden />}
                    {option}
                    {isSelected && <span className="ml-auto text-xs font-medium opacity-70">Your answer</span>}
                  </div>
                )
              })}
            </div>

            <div className="mt-4 rounded-lg bg-primary-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Explanation</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{row.explanation}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={onRestart}>
          Take another quiz
        </Button>
      </div>
    </div>
  )
}

// ---------- Page ----------
export default function QuizzesPage() {
  const [phase, setPhase] = useState<Phase>('config')
  const [attempt, setAttempt] = useState<AttemptState | null>(null)
  const [result, setResult] = useState<AttemptDetail | null>(null)
  const queryClient = useQueryClient()

  const content = useMemo(() => {
    if (phase === 'attempt' && attempt) {
      return (
        <QuizAttemptShell
          attempt={attempt}
          onSubmitted={(res) => {
            setResult(res)
            setPhase('result')
            void queryClient.invalidateQueries({ queryKey: ['attempts'] })
            void queryClient.invalidateQueries({ queryKey: ['progress'] })
          }}
        />
      )
    }
    if (phase === 'result' && result) {
      return (
        <QuizResult
          result={result}
          onRestart={() => {
            setAttempt(null)
            setResult(null)
            setPhase('config')
          }}
        />
      )
    }
    return (
      <QuizConfig
        onStart={(state) => {
          setAttempt(state)
          setPhase('attempt')
        }}
      />
    )
  }, [phase, attempt, result, queryClient])

  return content
}

