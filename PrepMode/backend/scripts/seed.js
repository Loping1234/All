/**
 * PrepMode idempotent demo seed (local use only).
 * Run: npm run seed   (safe to run multiple times; upserts by natural keys)
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { connectDb, disconnectDb } = require('../src/config/db');
const User = require('../src/models/User');
const ContentItem = require('../src/models/ContentItem');
const QuizQuestion = require('../src/models/QuizQuestion');
const Bookmark = require('../src/models/Bookmark');
const SavedQuestion = require('../src/models/SavedQuestion');
const ContentCompletion = require('../src/models/ContentCompletion');
const QuizAttempt = require('../src/models/QuizAttempt');
const SourceItem = require('../src/models/SourceItem');
const { normalizeSourceUrl } = require('../src/utils/normalizeUrl');

const SEED_DATA_DIR = path.join(__dirname, 'seed-data');

const DEMO_ADMIN = { name: 'Demo Admin', email: 'demo.admin@prepmode.local', password: 'DemoAdmin123!' };
const DEMO_LEARNER = { name: 'Demo Learner', email: 'demo.learner@prepmode.local', password: 'DemoLearner123!' };

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(SEED_DATA_DIR, file), 'utf8'));
}

async function upsertUser({ name, email, password }, role, examMode) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({
    name,
    email,
    passwordHash,
    role,
    activeExamMode: examMode,
    defaultExamMode: examMode,
  });
}

async function upsertContent(items, adminId) {
  let created = 0;
  for (const item of items) {
    const result = await ContentItem.updateOne(
      { slug: item.slug },
      {
        $setOnInsert: {
          ...item,
          status: 'published',
          publishedAt: new Date(),
          createdBy: adminId,
          updatedBy: adminId,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
  }
  return created;
}

async function upsertQuestions(questions, adminId) {
  let created = 0;
  for (const question of questions) {
    const result = await QuizQuestion.updateOne(
      { questionText: question.questionText },
      {
        $setOnInsert: {
          ...question,
          status: 'published',
          createdBy: adminId,
          updatedBy: adminId,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
  }
  return created;
}

const SOURCE_ITEMS = [
  {
    sourceName: 'Reserve Bank of India',
    sourceType: 'financial_regulator',
    sourceUrl: 'https://www.rbi.org.in/Scripts/AnnualPolicy.aspx?utm_source=rss&id=mpc-overview',
    title: 'Monetary policy framework reference page',
    feedType: 'manual',
    processingStatus: 'selected',
    internalMemo: 'Stable reference for the monetary policy explainer brief. Use for terminology only.',
    feedExcerpt: 'Official reference describing the monetary policy framework and committee structure.',
  },
  {
    sourceName: 'Press Information Bureau',
    sourceType: 'official_reference',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=100001',
    title: 'Government scheme classification reference release',
    feedType: 'manual',
    processingStatus: 'new',
    internalMemo: '',
    feedExcerpt: 'Reference release explaining central sector versus centrally sponsored schemes.',
  },
  {
    sourceName: 'Election Commission of India',
    sourceType: 'official_reference',
    sourceUrl: 'https://www.eci.gov.in/about-eci/?section=mandate',
    title: 'Election process and mandate overview',
    feedType: 'manual',
    processingStatus: 'new',
    internalMemo: 'Candidate source for the election process tracking brief.',
    feedExcerpt: 'Official overview of the constitutional mandate and election process.',
  },
  {
    sourceName: 'Ministry of Education',
    sourceType: 'policy_reference',
    sourceUrl: 'https://www.education.gov.in/nep/about-nep?ref=newsletter',
    title: 'Foundational literacy policy reference',
    feedType: 'rss',
    processingStatus: 'selected',
    internalMemo: 'Background for the foundational literacy editorial analysis. Original essay only.',
    feedExcerpt: 'Policy reference page describing foundational literacy and numeracy goals.',
  },
  {
    sourceName: 'ISRO',
    sourceType: 'official_reference',
    sourceUrl: 'https://www.isro.gov.in/missions/overview?utm_campaign=feed',
    title: 'Launch vehicle and missions overview',
    feedType: 'rss',
    processingStatus: 'ignored',
    internalMemo: 'Too broad for a single brief; revisit when writing a focused capsule.',
    feedExcerpt: 'Overview of launch vehicles and mission families.',
  },
  {
    sourceName: 'NITI Aayog',
    sourceType: 'report_reference',
    sourceUrl: 'https://www.niti.gov.in/reports/logistics-overview',
    title: 'Logistics and competitiveness report landing page',
    feedType: 'manual',
    processingStatus: 'new',
    internalMemo: '',
    feedExcerpt: 'Report reference on logistics costs and manufacturing competitiveness.',
  },
];

async function upsertSourceItems(adminId) {
  let created = 0;
  for (const source of SOURCE_ITEMS) {
    const normalizedSourceUrl = normalizeSourceUrl(source.sourceUrl);
    const result = await SourceItem.updateOne(
      { normalizedSourceUrl },
      {
        $setOnInsert: {
          ...source,
          normalizedSourceUrl,
          sourceDate: new Date('2026-06-01'),
          fetchedAt: new Date(),
          createdBy: adminId,
          updatedBy: adminId,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
  }
  return created;
}

async function seedLearnerActivity(learner) {
  const counts = { bookmarks: 0, savedQuestions: 0, completions: 0, attempts: 0 };

  const someContent = await ContentItem.find({ status: 'published' })
    .sort({ slug: 1 })
    .limit(8);
  for (const content of someContent.slice(0, 4)) {
    const result = await Bookmark.updateOne(
      { user: learner._id, content: content._id },
      { $setOnInsert: { examModeAtSave: learner.activeExamMode } },
      { upsert: true }
    );
    if (result.upsertedCount) counts.bookmarks += 1;
  }
  for (const content of someContent.slice(4, 8)) {
    const result = await ContentCompletion.updateOne(
      { user: learner._id, content: content._id },
      { $setOnInsert: { examModeAtCompletion: learner.activeExamMode, completedAt: new Date() } },
      { upsert: true }
    );
    if (result.upsertedCount) counts.completions += 1;
  }

  const someQuestions = await QuizQuestion.find({ status: 'published' })
    .sort({ questionText: 1 })
    .limit(8);
  for (const question of someQuestions.slice(0, 3)) {
    const result = await SavedQuestion.updateOne(
      { user: learner._id, question: question._id },
      {
        $setOnInsert: {
          examModeAtSave: learner.activeExamMode,
          reason: 'Revisit this one before the next practice round',
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) counts.savedQuestions += 1;
  }

  // One completed demo attempt (idempotent: only create if none exists)
  const existingAttempt = await QuizAttempt.findOne({ user: learner._id, status: 'completed' });
  if (!existingAttempt && someQuestions.length >= 5) {
    const attemptQuestions = someQuestions.slice(0, 5);
    let correct = 0;
    const answers = attemptQuestions.map((question, index) => {
      // First three answered correctly, rest with the first wrong option
      const isCorrect = index < 3;
      const selected = isCorrect
        ? question.correctAnswer
        : question.options.find((o) => o !== question.correctAnswer);
      if (selected === question.correctAnswer) correct += 1;
      return { questionId: question._id, selectedAnswer: selected };
    });
    await QuizAttempt.create({
      user: learner._id,
      examMode: learner.activeExamMode,
      questionIds: attemptQuestions.map((q) => q._id),
      answers,
      score: correct,
      totalQuestions: attemptQuestions.length,
      correctAnswers: correct,
      accuracy: Math.round((correct / attemptQuestions.length) * 10000) / 100,
      status: 'completed',
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      completedAt: new Date(),
    });
    counts.attempts = 1;
  }

  return counts;
}

async function main() {
  await connectDb();
  console.log('Connected. Seeding PrepMode demo data...');

  const admin = await upsertUser(DEMO_ADMIN, 'admin', 'All');
  const learner = await upsertUser(DEMO_LEARNER, 'registered_learner', 'CAT');
  console.log(`Users ready: ${admin.email} (admin), ${learner.email} (learner)`);

  const contentFiles = [
    'english-rc.json',
    'english-grammar.json',
    'vocabulary.json',
    'gk.json',
    'static-gk.json',
    'current-affairs.json',
    'editorials.json',
    'revision.json',
  ];
  const questionFiles = [
    'questions-vocab.json',
    'questions-grammar.json',
    'questions-gk.json',
    'questions-static-gk.json',
    'questions-current-affairs.json',
    'questions-verbal.json',
  ];

  let contentCreated = 0;
  for (const file of contentFiles) {
    const { items } = readJson(file);
    contentCreated += await upsertContent(items, admin._id);
  }
  let questionsCreated = 0;
  for (const file of questionFiles) {
    const { questions } = readJson(file);
    questionsCreated += await upsertQuestions(questions, admin._id);
  }
  const sourcesCreated = await upsertSourceItems(admin._id);
  const activity = await seedLearnerActivity(learner);

  const [contentTotal, questionTotal, sourceTotal] = await Promise.all([
    ContentItem.countDocuments({}),
    QuizQuestion.countDocuments({}),
    SourceItem.countDocuments({}),
  ]);

  console.log('--- Seed summary ---');
  console.log(`Content items:   +${contentCreated} new (total ${contentTotal})`);
  console.log(`Quiz questions:  +${questionsCreated} new (total ${questionTotal})`);
  console.log(`Source items:    +${sourcesCreated} new (total ${sourceTotal})`);
  console.log(
    `Learner activity: +${activity.bookmarks} bookmarks, +${activity.savedQuestions} saved questions, ` +
      `+${activity.completions} completions, +${activity.attempts} attempts`
  );
  console.log('Demo admin:   demo.admin@prepmode.local / DemoAdmin123!');
  console.log('Demo learner: demo.learner@prepmode.local / DemoLearner123!');

  await disconnectDb();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  try {
    await disconnectDb();
  } catch {}
  process.exit(1);
});
