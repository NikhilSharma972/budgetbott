const { addKeyword, EVENTS } = require('@builderbot/bot');

const menuHandlerFlow = addKeyword(EVENTS.ACTION)
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
  });

module.exports = menuHandlerFlow;
