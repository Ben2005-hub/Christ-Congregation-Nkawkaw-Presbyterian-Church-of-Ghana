// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/church.db'  // Use /tmp in production (Vercel)
  : path.join(__dirname, 'church.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    if (process.env.NODE_ENV === 'production') {
      console.error('Database path:', dbPath);
    }
  }
});

// Enable foreign keys for every connection
db.run('PRAGMA foreign_keys = ON');

db.serialize(() => {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      birthday TEXT,
      group_name TEXT,
      email TEXT,
      gender TEXT,
      address TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_type TEXT,
      recipient_id INTEGER,
      content TEXT,
      date_sent TEXT,
      FOREIGN KEY(recipient_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT,
      reference TEXT,
      note TEXT,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS message_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_phone TEXT,
      content TEXT,
      sent_at TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      name TEXT,
      password_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = {
  getTotalMembers: () => {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) AS count FROM members', (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.count : 0);
      });
    });
  },
  db,
  addMember: (member) => {
    const { name, phone, group_name, email, gender, address } = member;
    return new Promise((resolve, reject) => {
      const stmt = `INSERT INTO members (name, phone, group_name, email, gender, address) VALUES (?, ?, ?, ?, ?, ?)`;
      db.run(stmt, [name, phone, group_name, email, gender, address], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },
  getMembers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM members ORDER BY id DESC', (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },
  getMemberContacts: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, name, phone, email, birthday FROM members', (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },
  findBirthdayMembers: (mmdd) => { // mm-dd string
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM members WHERE strftime('%m-%d', birthday) = ?", [mmdd], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },
  getMemberById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM members WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
  ,
  // Payment helpers
  addPayment: (payment) => {
    const { member_id, type, amount, date, reference, note } = payment;
    return new Promise((resolve, reject) => {
      const stmt = `INSERT INTO payments (member_id, type, amount, date, reference, note) VALUES (?, ?, ?, ?, ?, ?)`;
      db.run(stmt, [member_id, type, amount, date || null, reference || null, note || null], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },
  searchMembers: (q) => {
    const like = `%${q}%`;
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM members WHERE name LIKE ? OR phone LIKE ? ORDER BY id DESC', [like, like], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  getPaymentsByMember: (memberId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM payments WHERE member_id = ? ORDER BY date DESC, id DESC', [memberId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  getPaymentById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM payments WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  deletePayment: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM payments WHERE id = ?', [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  },

  // Returns totals grouped by payment type for a member
  getPaymentTotalsByMember: (memberId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT type, IFNULL(SUM(amount),0) AS total FROM payments WHERE member_id = ? GROUP BY type', [memberId], (err, rows) => {
        if (err) return reject(err);
        const totals = {};
        rows.forEach(r => { totals[r.type] = r.total; });
        resolve(totals);
      });
    });
  },

  // Message helpers
  logMessage: (to_phone, content) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO message_log (to_phone, content, sent_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [to_phone, content], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  }
  ,
  /* Admin helpers */
  addAdmin: (admin) => {
    const { username, name, password } = admin;
    return new Promise(async (resolve, reject) => {
      try {
        const hash = await bcrypt.hash(password, 10);
        const stmt = `INSERT INTO admins (username, name, password_hash) VALUES (?, ?, ?)`;
        db.run(stmt, [username, name, hash], function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        });
      } catch (err) { reject(err); }
    });
  },
  findAdminByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM admins WHERE username = ?', [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  ensureInitialAdmin: async () => {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) AS count FROM admins', async (err, row) => {
        if (err) return reject(err);
        const count = row ? row.count : 0;
        if (count > 0) return resolve(false);
        // create initial admin
        try {
          const initial = { username: 'nkawkaw', name: 'Nkawkaw Nyamebekyere', password: 'Nkawkaw@123' };
          const hash = await bcrypt.hash(initial.password, 10);
          db.run(`INSERT INTO admins (username, name, password_hash) VALUES (?, ?, ?)`, [initial.username, initial.name, hash], function (err2) {
            if (err2) return reject(err2);
            resolve(true);
          });
        } catch (e) { reject(e); }
      });
    });
  }
};
