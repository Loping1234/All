const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  safeUser,
  contentListItem,
  contentDetail,
  learnerQuestion,
  adminQuestion,
  reviewQuestion,
  attemptSummary,
} = require('../src/utils/serializers');

const baseUser = {
  _id: 'u1',
  name: 'Demo',
  email: 'demo@prepmode.local',
  passwordHash: 'hash-should-never-leak',
  role: 'registered_learner',
  status: 'active',
  activeExamMode: 'CAT',
  defaultExamMode: 'CAT',
  createdAt: new Date(),
};

const baseQuestion = {
  _id: 'q1',
  questionText: 'Pick the synonym of laconic.',
  options: ['verbose', 'brief', 'ornate', 'skeptical'],
  correctAnswer: 'brief',
  explanation: 'Laconic means using few words.',
  difficulty: 'Easy',
  subjectTags: ['Vocabulary'],
  topicTags: ['Synonyms'],
  examModeTags: ['All'],
  status: 'published',
};

const baseContent = {
  _id: 'c1',
  title: 'Title',
  slug: 'title',
  summary: 'Summary',
  body: 'FULL BODY SHOULD NOT BE IN LIST',
  category: 'English',
  contentType: 'Explainer',
  difficulty: 'Medium',
  readingLevel: 'Intermediate',
  recencyTag: 'Evergreen',
  subjectTags: [],
  topicTags: [],
  examModeTags: ['All'],
  status: 'published',
  publishedAt: new Date(),
};

test('safeUser never exposes passwordHash', () => {
  const dto = safeUser(baseUser);
  assert.equal(dto.passwordHash, undefined);
  assert.equal(dto.email, baseUser.email);
  assert.equal(dto.role, 'registered_learner');
});

test('contentListItem omits the body; contentDetail includes it', () => {
  const list = contentListItem(baseContent);
  assert.equal(list.body, undefined);
  assert.equal(list.title, 'Title');
  const detail = contentDetail(baseContent);
  assert.equal(detail.body, baseContent.body);
});

test('learnerQuestion strips correctAnswer and explanation', () => {
  const dto = learnerQuestion(baseQuestion);
  assert.equal(dto.correctAnswer, undefined);
  assert.equal(dto.explanation, undefined);
  assert.deepEqual(dto.options, baseQuestion.options);
});

test('adminQuestion keeps the answer key for management screens', () => {
  const dto = adminQuestion(baseQuestion);
  assert.equal(dto.correctAnswer, 'brief');
  assert.equal(dto.explanation, baseQuestion.explanation);
});

test('reviewQuestion exposes the key and grades the selection', () => {
  const right = reviewQuestion(baseQuestion, 'brief');
  assert.equal(right.isCorrect, true);
  assert.equal(right.correctAnswer, 'brief');
  const wrong = reviewQuestion(baseQuestion, 'verbose');
  assert.equal(wrong.isCorrect, false);
  const skipped = reviewQuestion(baseQuestion, null);
  assert.equal(skipped.isCorrect, false);
  assert.equal(skipped.selectedAnswer, null);
});

test('attemptSummary hides score fields until completion', () => {
  const inProgress = attemptSummary({
    _id: 'a1',
    examMode: 'CAT',
    status: 'in_progress',
    score: 3,
    totalQuestions: 5,
    correctAnswers: 3,
    accuracy: 60,
    startedAt: new Date(),
  });
  assert.equal(inProgress.score, null);
  assert.equal(inProgress.correctAnswers, null);
  assert.equal(inProgress.accuracy, null);

  const done = attemptSummary({
    _id: 'a2',
    examMode: 'CAT',
    status: 'completed',
    score: 3,
    totalQuestions: 5,
    correctAnswers: 3,
    accuracy: 60,
    startedAt: new Date(),
    completedAt: new Date(),
  });
  assert.equal(done.score, 3);
  assert.equal(done.accuracy, 60);
});
