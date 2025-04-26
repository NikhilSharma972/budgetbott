
const { addKeyword } = require('@builderbot/bot');
require('dotenv').config();

const parseAllowedNumbers = () => {
  const raw = process.env.ALLOWED_NUMBERS || '';
  const entries = raw.split(',').map(entry => {
    const [number, name] = entry.split(':');
    return [number.trim(), name.trim()];
  });
  return Object.fromEntries(entries);
};

const allowedNumbers = parseAllowedNumbers();


const showMainMenu = async (flowDynamic) => {
    await flowDynamic(
`✨ *Please choose an option:* ✨

━━━━━━━━━━━━━━━━
*1️⃣ Check This Month's Budget*
Track how much you've spent 💸
━━━━━━━━━━━━━━━━
*2️⃣ Add an Expense*
Record a new transaction 📝
━━━━━━━━━━━━━━━━
*3️⃣ Create This Month's Summary*
Get a full report 📊
━━━━━━━━━━━━━━━━
*4️⃣ View Last Month's Summary*
See past performance 📈
━━━━━━━━━━━━━━━━

👉 *Please reply with 1, 2, 3 or 4*`
    );
};


const budgetFlow = addKeyword(['hi', 'hello'])
  .addAction(async (ctx, { flowDynamic }) => {
    const sender = ctx.from;
    const name = allowedNumbers[sender];

    if (!name) {
      await flowDynamic('❌ You are not authorized to use this bot.');
      return;
    }

    await flowDynamic(`🎉 Hi *${name}*! Welcome to your Budget Assistant!`);
    await showMainMenu(flowDynamic);
  })
  .addAnswer('', { capture: true }, async (ctx, { flowDynamic, gotoFlow, endFlow }) => {
    const option = ctx.body.trim();

    if (!['1', '2', '3', '4'].includes(option)) {
      await flowDynamic('❌ *Invalid choice!* Please reply with *1, 2, 3,* or *4*.');
      return;
    }

    if (option === '1') {
      return gotoFlow(require('./currentBudgetFlow.js'));
    }

    if (option === '2') {
      return gotoFlow(require('./addExpenseFlow.js'));
    }

    if (option === '3') {
      return gotoFlow(require('./monthSummaryFlow.js'));
    }

    if (option === '4') {
      return gotoFlow(require('./lastMonthSummaryFlow.js'));
    }

    return endFlow();
  });


module.exports = budgetFlow;





