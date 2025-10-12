const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// in-memory admin store: { username, passwordHash }
const admins = [
  { username: 'admin', passwordHash: bcrypt.hashSync('admin123', 8) }
];

function addAdmin({ username, password }) {
  if (admins.find(a => a.username === username)) {
    return { error: 'Username already exists' };
  }
  const passwordHash = bcrypt.hashSync(password, 8);
  admins.push({ username, passwordHash });
  return { success: true };
}

function authenticateAdmin({ username, password }) {
  const admin = admins.find(a => a.username === username);
  if (!admin) return { error: 'Invalid credentials' };
  if (!bcrypt.compareSync(password, admin.passwordHash)) return { error: 'Invalid credentials' };
  // return JWT
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
  return { success: true, token };
}

function verifyToken(req) {
  const auth = req.headers && req.headers.authorization;
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

module.exports = { addAdmin, authenticateAdmin, verifyToken };
