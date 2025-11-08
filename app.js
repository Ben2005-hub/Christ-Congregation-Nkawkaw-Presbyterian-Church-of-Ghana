// app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Setup EJS for views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

// Static and body parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}));

// Import routes
const db = require('./db');
const authRoutes = require('./routes/auth');

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (process.env.NODE_ENV === 'production') {
    // Don't expose error details in production
    res.status(500).render('error', {
      message: 'Something went wrong!',
      layout: 'layout'
    });
  } else {
    res.status(500).render('error', {
      message: err.message,
      error: err,
      layout: 'layout'
    });
  }
});
const membersRoutes = require('./routes/members');
const messagesRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');

// Ensure initial admin exists
db.ensureInitialAdmin().then(created => {
  if (created) console.log('Initial admin created');
}).catch(err => console.error('Failed to ensure initial admin', err));

// Middleware to make user session and flash messages available in templates
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  // simple session-based flash: move message into locals and clear it
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/members', membersRoutes);
app.use('/messages', messagesRoutes);
app.use('/admin', adminRoutes);
app.use('/webhook', webhookRoutes);

// Dashboard route
app.get('/', ensureAuth, async (req, res) => {
  try {
    const total = await db.getTotalMembers();
    res.render('index', { total });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

module.exports = app;
