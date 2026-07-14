export type BadgeTone = 'gray' | 'indigo' | 'green' | 'amber' | 'red' | 'blue' | 'purple'

export function difficultyTone(difficulty: string): BadgeTone {
  switch (difficulty) {
    case 'Easy':
      return 'green'
    case 'Medium':
      return 'amber'
    case 'Hard':
      return 'red'
    case 'Advanced':
      return 'purple'
    default:
      return 'gray'
  }
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'published':
      return 'green'
    case 'draft':
      return 'amber'
    case 'archived':
      return 'gray'
    case 'new':
      return 'blue'
    case 'selected':
      return 'green'
    case 'ignored':
      return 'gray'
    default:
      return 'gray'
  }
}
