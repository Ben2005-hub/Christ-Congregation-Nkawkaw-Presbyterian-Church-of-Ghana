
const members = [];

// Register a new member
function registerMember(data) {
  const id = members.length + 1;
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
  return member;
}

// Get all members
function getAllMembers() {
  return members;
}

function setLastBirthdaySent(memberId, dateStr) {
  const m = members.find(x => x.id === memberId);
  if (m) m.lastBirthdaySent = dateStr;
  return m;
}

module.exports = {
  registerMember,
  getAllMembers
  , setLastBirthdaySent
};
