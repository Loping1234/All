const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { env } = require('../config/env');
const { safeUser } = require('../utils/serializers');
const { badRequest, unauthorized, conflict } = require('../utils/httpError');
const { EXAM_MODES } = require('../utils/enums');

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/** Public signup. Role is ALWAYS registered_learner; never read from body. */
async function signup(req, res, next) {
  try {
    const { name, email, password, defaultExamMode } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw badRequest('Name must be at least 2 characters');
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw badRequest('A valid email is required');
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw badRequest('Password must be at least 8 characters');
    }
    const mode = EXAM_MODES.includes(defaultExamMode) ? defaultExamMode : 'All';

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) throw conflict('An account with this email already exists', 'EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'registered_learner',
      activeExamMode: mode,
      defaultExamMode: mode,
    });

    res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw badRequest('Email and password are required');

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
    if (!ok) throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    if (user.status !== 'active') throw unauthorized('This account is suspended', 'ACCOUNT_SUSPENDED');

    res.json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: safeUser(req.user) });
}

async function logout(_req, res) {
  // Stateless JWT: client discards the token.
  res.json({ message: 'Logged out' });
}

/** Update own profile: name and exam mode preferences only. */
async function updateMe(req, res, next) {
  try {
    const { name, activeExamMode, defaultExamMode } = req.body || {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) throw badRequest('Name must be at least 2 characters');
      req.user.name = name.trim();
    }
    if (activeExamMode !== undefined) {
      if (!EXAM_MODES.includes(activeExamMode)) throw badRequest('Invalid exam mode');
      req.user.activeExamMode = activeExamMode;
    }
    if (defaultExamMode !== undefined) {
      if (!EXAM_MODES.includes(defaultExamMode)) throw badRequest('Invalid exam mode');
      req.user.defaultExamMode = defaultExamMode;
    }
    await req.user.save();
    res.json({ user: safeUser(req.user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me, logout, updateMe };
