const EXAM_MODES = ['All', 'CAT', 'UPSC', 'SSC', 'Banking', 'CLAT', 'CUET', 'MBA', 'Defence Exams'];

const CATEGORIES = ['English', 'Vocabulary', 'GK', 'Static GK', 'Current Affairs', 'Editorials', 'Revision'];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Advanced'];

const CONTENT_TYPES = [
  'Article',
  'Brief',
  'Editorial Analysis',
  'Vocabulary Set',
  'Revision Set',
  'Explainer',
  'Practice Passage',
  'Grammar Lesson',
];

const RECENCY_TAGS = ['Daily', 'Weekly', 'Monthly', 'Evergreen'];

const READING_LEVELS = ['Foundational', 'Intermediate', 'Advanced'];

const ROLES = ['admin', 'registered_learner'];

const USER_STATUSES = ['active', 'suspended'];

const CONTENT_STATUSES = ['draft', 'published', 'archived'];

const QUESTION_STATUSES = ['draft', 'published', 'archived'];

const ATTEMPT_STATUSES = ['in_progress', 'completed', 'abandoned'];

const SOURCE_TYPES = [
  'official_reference',
  'policy_reference',
  'financial_regulator',
  'editorial_reference',
  'report_reference',
  'original_practice',
  'original_brief',
];

const FEED_TYPES = ['rss', 'manual'];

const PROCESSING_STATUSES = ['new', 'selected', 'ignored'];

module.exports = {
  EXAM_MODES,
  CATEGORIES,
  DIFFICULTIES,
  CONTENT_TYPES,
  RECENCY_TAGS,
  READING_LEVELS,
  ROLES,
  USER_STATUSES,
  CONTENT_STATUSES,
  QUESTION_STATUSES,
  ATTEMPT_STATUSES,
  SOURCE_TYPES,
  FEED_TYPES,
  PROCESSING_STATUSES,
};
