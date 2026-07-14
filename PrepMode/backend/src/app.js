const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const questionRoutes = require('./routes/questionRoutes');
const quizAttemptRoutes = require('./routes/quizAttemptRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const savedQuestionRoutes = require('./routes/savedQuestionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: false }));
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
});

app.use('/api', apiLimiter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'prepmode-api' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quiz-attempts', quizAttemptRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/saved-questions', savedQuestionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
