/**
 * Response DTO layer. These functions are the single boundary that decides
 * which fields leave the server. Answer keys (correctAnswer, explanation)
 * are only ever emitted by the admin serializer and the post-submit review
 * serializer; passwordHash never leaves.
 */

function safeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    activeExamMode: user.activeExamMode,
    defaultExamMode: user.defaultExamMode,
    createdAt: user.createdAt,
  };
}

/** List-card shape: summary metadata only, never the full body. */
function contentListItem(content, extras = {}) {
  if (!content) return null;
  return {
    id: String(content._id),
    title: content.title,
    slug: content.slug,
    summary: content.summary,
    category: content.category,
    contentType: content.contentType,
    difficulty: content.difficulty,
    readingLevel: content.readingLevel,
    recencyTag: content.recencyTag,
    subjectTags: content.subjectTags,
    topicTags: content.topicTags,
    examModeTags: content.examModeTags,
    status: content.status,
    publishedAt: content.publishedAt,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
    ...extras,
  };
}

/** Detail shape: includes the full body. */
function contentDetail(content, extras = {}) {
  if (!content) return null;
  return {
    ...contentListItem(content),
    body: content.body,
    sourceMetadata: content.sourceMetadata || null,
    ...extras,
  };
}

/** Learner-safe question: no correctAnswer, no explanation, no status leak. */
function learnerQuestion(question) {
  if (!question) return null;
  return {
    id: String(question._id),
    questionText: question.questionText,
    options: question.options,
    difficulty: question.difficulty,
    subjectTags: question.subjectTags,
    topicTags: question.topicTags,
    examModeTags: question.examModeTags,
  };
}

/** Admin question shape: includes the answer key for management screens. */
function adminQuestion(question) {
  if (!question) return null;
  return {
    ...learnerQuestion(question),
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    status: question.status,
    sourceContentId: question.sourceContentId ? String(question.sourceContentId) : null,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

/** Post-submit review row: the only learner payload carrying the answer key. */
function reviewQuestion(question, selectedAnswer) {
  if (!question) return null;
  return {
    questionId: String(question._id),
    questionText: question.questionText,
    options: question.options,
    difficulty: question.difficulty,
    topicTags: question.topicTags,
    selectedAnswer: selectedAnswer === undefined ? null : selectedAnswer,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    isCorrect: selectedAnswer === question.correctAnswer,
  };
}

function attemptSummary(attempt) {
  if (!attempt) return null;
  return {
    id: String(attempt._id),
    examMode: attempt.examMode,
    status: attempt.status,
    score: attempt.status === 'completed' ? attempt.score : null,
    totalQuestions: attempt.totalQuestions,
    correctAnswers: attempt.status === 'completed' ? attempt.correctAnswers : null,
    accuracy: attempt.status === 'completed' ? attempt.accuracy : null,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    createdAt: attempt.createdAt,
  };
}

function sourceItem(item) {
  if (!item) return null;
  return {
    id: String(item._id),
    sourceName: item.sourceName,
    sourceType: item.sourceType,
    sourceUrl: item.sourceUrl,
    normalizedSourceUrl: item.normalizedSourceUrl,
    title: item.title,
    sourceDate: item.sourceDate,
    feedType: item.feedType,
    fetchedAt: item.fetchedAt,
    processingStatus: item.processingStatus,
    internalMemo: item.internalMemo,
    feedExcerpt: item.feedExcerpt,
    relatedContentId: item.relatedContentId ? String(item.relatedContentId) : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

module.exports = {
  safeUser,
  contentListItem,
  contentDetail,
  learnerQuestion,
  adminQuestion,
  reviewQuestion,
  attemptSummary,
  sourceItem,
};
