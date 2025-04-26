const { addKeyword } = require('@builderbot/bot');
const pool_ = require('../db/postgresClient');
const DEFAULT_BUDGET = parseFloat(process.env.DEFAULT_BUDGET) || 70000;

const currentBudgetFlow = addKeyword('CURRENT_BUDGET')
  .addAction(async (ctx, { flowDynamic, endFlow }) => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const result = await pool_.query(
      `SELECT budgetamount FROM budgets WHERE monthint = $1 AND year = $2 LIMIT 1`,
      [month, year]
    );

    const budget = result.rows.length > 0 ? result.rows[0].budgetamount : DEFAULT_BUDGET;

    await flowDynamic(`💰 Your budget for this month is: *₹${budget.toLocaleString()}*`);

    return endFlow();
  });

module.exports = currentBudgetFlow;
