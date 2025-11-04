const db = require('../db');

(async function run() {
  try {
    // mm-dd
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const mmdd = `${mm}-${dd}`;
    console.log('Checking birthdays for', mmdd);
    const members = await db.findBirthdayMembers(mmdd);
    console.log('Found', members.length, 'birthdays');
    for (const m of members) {
      const content = `Happy birthday, ${m.name}! Blessings from your church.`;
      await db.logMessage(m.phone || '', content);
      console.log('Sent birthday message to', m.name, m.phone);
    }
    process.exit(0);
  } catch (err) {
    console.error('Birthday send failed', err);
    process.exit(1);
  }
})();
