// utils/smtAccountManager.js
const accounts = [
  { user: process.env.SMART_METER_USER_1, pass: process.env.SMART_METER_PASS_1, activeSlots: 0 },
  { user: process.env.SMART_METER_USER_2, pass: process.env.SMART_METER_PASS_2, activeSlots: 0 },
  { user: process.env.SMART_METER_USER_3, pass: process.env.SMART_METER_PASS_3, activeSlots: 0 },
  { user: process.env.SMART_METER_USER_4, pass: process.env.SMART_METER_PASS_4, activeSlots: 0 },
  { user: process.env.SMART_METER_USER_5, pass: process.env.SMART_METER_PASS_5, activeSlots: 0 },
];

const MAX_SLOTS = 5;

async function getNextAvailableAccount() {
  const wait = (ms) => new Promise(res => setTimeout(res, ms));
  let attempts = 0;

  while (attempts < 20) {
    for (const acc of accounts) {
      if (acc.activeSlots < MAX_SLOTS) {
        acc.activeSlots++;
        return acc;
      }
    }
    await wait(500);
    attempts++;
  }

  throw new Error('Todas las cuentas están ocupadas con 5 solicitudes activas.');
}

function releaseAccount(user) {
  const acc = accounts.find(a => a.user === user);
  if (acc && acc.activeSlots > 0) acc.activeSlots--;
}

module.exports = { getNextAvailableAccount, releaseAccount };
