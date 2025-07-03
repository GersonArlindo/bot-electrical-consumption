// utils/smtAccountManager.js
const accounts = [
  { user: process.env.SMART_METER_USER_1, pass: process.env.SMART_METER_PASS_1, busy: false },
  { user: process.env.SMART_METER_USER_2, pass: process.env.SMART_METER_PASS_2, busy: false },
  { user: process.env.SMART_METER_USER_3, pass: process.env.SMART_METER_PASS_3, busy: false },
  { user: process.env.SMART_METER_USER_4, pass: process.env.SMART_METER_PASS_4, busy: false },
  { user: process.env.SMART_METER_USER_5, pass: process.env.SMART_METER_PASS_5, busy: false },
];

// Buscar una cuenta libre y marcarla como ocupada
async function getNextAvailableAccount() {
  const wait = (ms) => new Promise(res => setTimeout(res, ms));
  let attempts = 0;

  while (attempts < 20) { // Máximo ~10 segundos
    for (const acc of accounts) {
      if (!acc.busy) {
        acc.busy = true;
        return acc;
      }
    }
    await wait(500);
    attempts++;
  }

  throw new Error('Todas las cuentas SMT están en uso. Intenta de nuevo más tarde.');
}

// Liberar una cuenta después del uso
function releaseAccount(user) {
  const acc = accounts.find(a => a.user === user);
  if (acc) acc.busy = false;
}

module.exports = { getNextAvailableAccount, releaseAccount };