import { useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { EXAM_MODES, type ExamMode } from '@/types'

/** Horizontal exam-mode pill strip shown in the learner topbar. */
export function ModeSwitcher() {
  const { user, setExamMode } = useAuth()
  const [pending, setPending] = useState<ExamMode | null>(null)
  const active = user?.activeExamMode ?? 'All'

  async function handleSelect(mode: ExamMode) {
    if (mode === active || pending) return
    setPending(mode)
    try {
      await setExamMode(mode)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Exam mode">
      {EXAM_MODES.map((mode) => {
        const isActive = mode === active
        return (
          <button
            key={mode}
            role="tab"
            aria-selected={isActive}
            onClick={() => void handleSelect(mode)}
            disabled={pending !== null}
            className={clsx(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
              isActive
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
            )}
          >
            {pending === mode ? '…' : mode}
          </button>
        )
      })}
    </div>
  )
}
