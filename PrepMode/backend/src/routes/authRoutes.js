const express = require('express');
const { signup, login, me, logout, updateMe } = require('../controllers/authController');
const { requireAnyUser } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAnyUser, me);
router.patch('/me', requireAnyUser, updateMe);
router.post('/logout', requireAnyUser, logout);

module.exports = router;
