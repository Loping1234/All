import { apiClient } from './apiClient'
import type {
  AdminOverview,
  AdminQuestion,
  AttemptDetail,
  AttemptSummary,
  BookmarkRow,
  CompletionRow,
  ContentDetail,
  ContentListItem,
  ExamMode,
  LearnerQuestion,
  ListMeta,
  ProgressSummary,
  SavedQuestionRow,
  SourceItem,
  User,
} from '@/types'

// ---------- auth ----------
export const authApi = {
  signup: (body: { name: string; email: string; password: string; defaultExamMode?: ExamMode }) =>
    apiClient.post<{ token: string; user: User }>('/auth/signup', body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    apiClient.post<{ token: string; user: User }>('/auth/login', body).then((r) => r.data),
  me: () => apiClient.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  updateMe: (body: Partial<Pick<User, 'name' | 'activeExamMode' | 'defaultExamMode'>>) =>
    apiClient.patch<{ user: User }>('/auth/me', body).then((r) => r.data.user),
  logout: () => apiClient.post('/auth/logout').then(() => undefined),
}

// ---------- learner content ----------
export interface ContentQuery {
  category?: string
  examMode?: ExamMode
  difficulty?: string
  contentType?: string
  recency?: string
  topic?: string
  subject?: string
  search?: string
  page?: number
  pageSize?: number
}

export const contentApi = {
  list: (params: ContentQuery) =>
    apiClient.get<{ items: ContentListItem[]; meta: ListMeta }>('/content', { params }).then((r) => r.data),
  detail: (id: string) => apiClient.get<{ item: ContentDetail }>(`/content/${id}`).then((r) => r.data.item),
}

// ---------- quiz ----------
export const quizApi = {
  listQuestions: (params: { examMode?: ExamMode; difficulty?: string; subject?: string; topic?: string; limit?: number }) =>
    apiClient.get<{ questions: LearnerQuestion[]; meta: { total: number } }>('/questions', { params }).then((r) => r.data),
  startAttempt: (body: { questionIds: string[]; examMode: ExamMode }) =>
    apiClient
      .post<{
        attemptId: string
        status: string
        examMode: ExamMode
        totalQuestions: number
        questions: LearnerQuestion[]
      }>('/quiz-attempts/start', body)
      .then((r) => r.data),
  submitAttempt: (id: string, answers: { questionId: string; selectedAnswer: string | null }[]) =>
    apiClient.post<AttemptDetail>(`/quiz-attempts/${id}/submit`, { answers }).then((r) => r.data),
  listAttempts: (params?: { status?: string; examMode?: ExamMode; limit?: number }) =>
    apiClient.get<{ attempts: AttemptSummary[] }>('/quiz-attempts', { params }).then((r) => r.data.attempts),
  getAttempt: (id: string) => apiClient.get<AttemptDetail>(`/quiz-attempts/${id}`).then((r) => r.data),
}

// ---------- learner library ----------
export const bookmarkApi = {
  list: () => apiClient.get<{ bookmarks: BookmarkRow[] }>('/bookmarks').then((r) => r.data.bookmarks),
  create: (contentId: string) =>
    apiClient.post<{ bookmark: BookmarkRow }>('/bookmarks', { contentId }).then((r) => r.data.bookmark),
  remove: (id: string) => apiClient.delete(`/bookmarks/${id}`).then(() => undefined),
}

export const savedQuestionApi = {
  list: () => apiClient.get<{ savedQuestions: SavedQuestionRow[] }>('/saved-questions').then((r) => r.data.savedQuestions),
  create: (questionId: string, reason?: string) =>
    apiClient.post<{ savedQuestion: SavedQuestionRow }>('/saved-questions', { questionId, reason }).then((r) => r.data.savedQuestion),
  remove: (id: string) => apiClient.delete(`/saved-questions/${id}`).then(() => undefined),
}

export const progressApi = {
  summary: () => apiClient.get<{ summary: ProgressSummary }>('/progress/summary').then((r) => r.data.summary),
  history: (params?: { limit?: number }) =>
    apiClient
      .get<{ completions: CompletionRow[]; attempts: AttemptSummary[] }>('/progress', { params })
      .then((r) => r.data),
  byMode: (mode: ExamMode) =>
    apiClient
      .get<{ mode: ExamMode; summary: { completedContent: number; quizAttempts: number; totalQuestionsAnswered: number; correctAnswers: number; accuracy: number } }>(
        `/progress/by-mode/${encodeURIComponent(mode)}`
      )
      .then((r) => r.data),
  markComplete: (contentId: string) =>
    apiClient.post(`/progress/content/${contentId}/complete`).then(() => undefined),
  unmarkComplete: (contentId: string) =>
    apiClient.delete(`/progress/content/${contentId}/complete`).then(() => undefined),
}

// ---------- admin ----------
export interface AdminContentQuery {
  status?: string
  category?: string
  examMode?: ExamMode
  difficulty?: string
  contentType?: string
  topic?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface ContentPayload {
  title: string
  slug?: string
  summary: string
  body: string
  category: string
  contentType: string
  difficulty: string
  readingLevel?: string
  recencyTag?: string
  subjectTags?: string[]
  topicTags?: string[]
  examModeTags?: string[]
  status?: 'draft' | 'published'
  sourceMetadata?: { sourceName?: string; sourceType?: string; sourceUrl?: string; sourceDate?: string }
}

export interface QuestionPayload {
  questionText: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: string
  subjectTags?: string[]
  topicTags?: string[]
  examModeTags?: string[]
  status?: 'draft' | 'published'
}

export const adminApi = {
  overview: () => apiClient.get<{ overview: AdminOverview }>('/admin/overview').then((r) => r.data.overview),
  listUsers: (params?: { role?: string; search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<{ users: User[]; meta: ListMeta }>('/admin/users', { params }).then((r) => r.data),
  listTags: () =>
    apiClient
      .get<{ tags: { contentSubjectTags: { tag: string; count: number }[]; contentTopicTags: { tag: string; count: number }[]; questionTopicTags: { tag: string; count: number }[] } }>(
        '/admin/tags'
      )
      .then((r) => r.data.tags),

  listContent: (params: AdminContentQuery) =>
    apiClient.get<{ items: ContentListItem[]; meta: ListMeta }>('/admin/content', { params }).then((r) => r.data),
  getContent: (id: string) => apiClient.get<{ item: ContentDetail }>(`/admin/content/${id}`).then((r) => r.data.item),
  createContent: (body: ContentPayload) =>
    apiClient.post<{ item: ContentDetail }>('/admin/content', body).then((r) => r.data.item),
  updateContent: (id: string, body: Partial<ContentPayload>) =>
    apiClient.put<{ item: ContentDetail }>(`/admin/content/${id}`, body).then((r) => r.data.item),
  publishContent: (id: string) =>
    apiClient.patch<{ item: ContentDetail }>(`/admin/content/${id}/publish`).then((r) => r.data.item),
  unpublishContent: (id: string) =>
    apiClient.patch<{ item: ContentDetail }>(`/admin/content/${id}/unpublish`).then((r) => r.data.item),
  archiveContent: (id: string) =>
    apiClient.patch<{ item: ContentDetail }>(`/admin/content/${id}/archive`).then((r) => r.data.item),

  listQuestions: (params?: { status?: string; difficulty?: string; examMode?: ExamMode; search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<{ questions: AdminQuestion[]; meta: ListMeta }>('/admin/questions', { params }).then((r) => r.data),
  createQuestion: (body: QuestionPayload) =>
    apiClient.post<{ question: AdminQuestion }>('/admin/questions', body).then((r) => r.data.question),
  updateQuestion: (id: string, body: Partial<QuestionPayload>) =>
    apiClient.put<{ question: AdminQuestion }>(`/admin/questions/${id}`, body).then((r) => r.data.question),
  publishQuestion: (id: string) =>
    apiClient.patch<{ question: AdminQuestion }>(`/admin/questions/${id}/publish`).then((r) => r.data.question),
  archiveQuestion: (id: string) =>
    apiClient.patch<{ question: AdminQuestion }>(`/admin/questions/${id}/archive`).then((r) => r.data.question),

  listSourceItems: (params?: { processingStatus?: string; sourceType?: string; search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<{ items: SourceItem[]; meta: ListMeta }>('/admin/source-items', { params }).then((r) => r.data),
  createSourceItem: (body: {
    sourceName: string
    sourceType: string
    sourceUrl: string
    title: string
    sourceDate?: string
    feedType?: string
    internalMemo?: string
    feedExcerpt?: string
  }) => apiClient.post<{ item: SourceItem }>('/admin/source-items', body).then((r) => r.data.item),
  selectSourceItem: (id: string) =>
    apiClient.patch<{ item: SourceItem }>(`/admin/source-items/${id}/select`).then((r) => r.data.item),
  ignoreSourceItem: (id: string) =>
    apiClient.patch<{ item: SourceItem }>(`/admin/source-items/${id}/ignore`).then((r) => r.data.item),
  updateSourceMemo: (id: string, internalMemo: string) =>
    apiClient.patch<{ item: SourceItem }>(`/admin/source-items/${id}/memo`, { internalMemo }).then((r) => r.data.item),
}
