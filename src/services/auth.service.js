const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const BCRYPT_ROUNDS = 12;

async function register({ email, password, name }) {
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ email, password_hash, name });
  return user;
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  return issueTokens(user);
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.refresh_token_hash) {
    throw Object.assign(new Error('Token revoked'), { status: 401 });
  }

  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  if (hash !== user.refresh_token_hash) {
    throw Object.assign(new Error('Token reuse detected'), { status: 401 });
  }

  return issueTokens(user);
}

async function issueTokens(user) {
  const accessToken = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await User.findByIdAndUpdate(user._id, { refresh_token_hash: hash });

  return { access_token: accessToken, refresh_token: refreshToken };
}

module.exports = { register, login, refresh };
