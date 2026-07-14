export const EXAM_MODES = ['All', 'CAT', 'UPSC', 'SSC', 'Banking', 'CLAT', 'CUET', 'MBA', 'Defence Exams'] as const
export type ExamMode = (typeof EXAM_MODES)[number]

export const CATEGORIES = ['English', 'Vocabulary', 'GK', 'Static GK', 'Current Affairs', 'Editorials', 'Revision'] as const
export type Category = (typeof CATEGORIES)[number]

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Advanced'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const CONTENT_TYPES = [
  'Article',
  'Brief',
  'Editorial Analysis',
  'Vocabulary Set',
  'Revision Set',
  'Explainer',
  'Practice Passage',
  'Grammar Lesson',
] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const RECENCY_TAGS = ['Daily', 'Weekly', 'Monthly', 'Evergreen'] as const
export type RecencyTag = (typeof RECENCY_TAGS)[number]

export const READING_LEVELS = ['Foundational', 'Intermediate', 'Advanced'] as const
export type ReadingLevel = (typeof READING_LEVELS)[number]

export const SOURCE_TYPES = [
  'official_reference',
  'policy_reference',
  'financial_regulator',
  'editorial_reference',
  'report_reference',
  'original_practice',
  'original_brief',
] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export type Role = 'admin' | 'registered_learner'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type ProcessingStatus = 'new' | 'selected' | 'ignored'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'suspended'
  activeExamMode: ExamMode
  defaultExamMode: ExamMode
  createdAt?: string
}

export interface ContentListItem {
  id: string
  title: string
  slug: string
  summary: string
  category: Category
  contentType: ContentType
  difficulty: Difficulty
  readingLevel: ReadingLevel
  recencyTag: RecencyTag
  subjectTags: string[]
  topicTags: string[]
  examModeTags: ExamMode[]
  status: ContentStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  isBookmarked?: boolean
  isCompleted?: boolean
  bookmarkId?: string | null
}

export interface ContentDetail extends ContentListItem {
  body: string
  sourceMetadata?: {
    sourceName?: string
    sourceType?: SourceType
    sourceUrl?: string
    sourceDate?: string
  } | null
}

export interface LearnerQuestion {
  id: string
  questionText: string
  options: string[]
  difficulty: Difficulty
  subjectTags: string[]
  topicTags: string[]
  examModeTags: ExamMode[]
}

export interface AdminQuestion extends LearnerQuestion {
  correctAnswer: string
  explanation: string
  status: ContentStatus
  sourceContentId: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewRow {
  questionId: string
  questionText: string
  options: string[]
  difficulty: Difficulty
  topicTags: string[]
  selectedAnswer: string | null
  correctAnswer: string
  explanation: string
  isCorrect: boolean
}

export interface AttemptSummary {
  id: string
  examMode: ExamMode
  status: 'in_progress' | 'completed' | 'abandoned'
  score: number | null
  totalQuestions: number
  correctAnswers: number | null
  accuracy: number | null
  startedAt: string
  completedAt: string | null
  createdAt: string
}

export interface AttemptDetail extends AttemptSummary {
  attemptId: string
  review?: ReviewRow[]
}

export interface BookmarkRow {
  id: string
  examModeAtSave: ExamMode
  savedAt: string
  content: ContentListItem
}

export interface SavedQuestionRow {
  id: string
  reason: string
  examModeAtSave: ExamMode
  savedAt: string
  question: LearnerQuestion
}

export interface ProgressSummary {
  completedContent: number
  completedByCategory: Record<string, number>
  quizAttempts: number
  totalQuestionsAnswered: number
  correctAnswers: number
  overallAccuracy: number
  bookmarks: number
  savedQuestions: number
}

export interface CompletionRow {
  id: string
  completedAt: string
  examModeAtCompletion: ExamMode
  content: ContentListItem
}

export interface SourceItem {
  id: string
  sourceName: string
  sourceType: SourceType
  sourceUrl: string
  normalizedSourceUrl: string
  title: string
  sourceDate: string | null
  feedType: 'rss' | 'manual'
  fetchedAt: string
  processingStatus: ProcessingStatus
  internalMemo: string
  feedExcerpt: string
  relatedContentId: string | null
  createdAt: string
  updatedAt: string
}

export interface ListMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  statusCounts?: Record<string, number>
}

export interface AdminOverview {
  content: { total: number; published: number; draft: number; archived: number }
  questions: { total: number; published: number }
  sources: { new: number; selected: number; ignored: number }
  learners: number
  completedAttempts: number
  contentByCategory: Record<string, number>
  recentContent: ContentListItem[]
}
