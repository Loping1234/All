const mongoose = require('mongoose');
const { ROLES, USER_STATUSES, EXAM_MODES } = require('../utils/enums');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'registered_learner', required: true },
    status: { type: String, enum: USER_STATUSES, default: 'active', required: true },
    activeExamMode: { type: String, enum: EXAM_MODES, default: 'All' },
    defaultExamMode: { type: String, enum: EXAM_MODES, default: 'All' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
