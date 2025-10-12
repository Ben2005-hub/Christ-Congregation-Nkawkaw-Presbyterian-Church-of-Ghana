
const fs = require('fs');
const path = require('path');

// persist members to server/data/members.json so registrations survive restarts
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'members.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let members = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    members = JSON.parse(raw || '[]');
  }
} catch (e) {
  console.error('Failed to load members data:', e.message);
  members = [];
}

function persist() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
  } catch (e) {
    console.error('Failed to persist members data:', e.message);
  }
}

// Register a new member
function registerMember(data) {
  // assign a stable numeric id
  const id = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
  // accept optional dob field (ISO string or YYYY-MM-DD)
  const member = { id, ...data };
  if (!member.type) member.type = 'new';
  // track last birthday message sent date (YYYY-MM-DD)
  if (!member.lastBirthdaySent) member.lastBirthdaySent = null;
  if (member.dob) {
    // normalize to YYYY-MM-DD if possible
    try {
      const d = new Date(member.dob);
      if (!isNaN(d)) member.dob = d.toISOString().slice(0, 10);
    } catch (e) {
      // keep original
    }
  }
  members.push(member);
  persist();
  return member;
}

// Get all members
function getAllMembers() {
  return members;
}

function setLastBirthdaySent(memberId, dateStr) {
  const m = members.find(x => x.id === memberId);
  if (m) {
    m.lastBirthdaySent = dateStr;
    persist();
  }
  return m;
}

module.exports = {
  registerMember,
  getAllMembers,
  setLastBirthdaySent
};
