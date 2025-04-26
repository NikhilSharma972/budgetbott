const { addKeyword } = require('@builderbot/bot');
const pool_ = require('../db/postgresClient');
require('dotenv').config();

const DEFAULT_BUDGET = parseFloat(process.env.DEFAULT_BUDGET);
const idealSpentPercent = parseFloat(process.env.IDEAL_SPEND_BUDGET_PERCENT);

const lastMonthSummaryFlow = addKeyword('LAST_MONTH_SUMMARY')
  .addAction(async (ctx, { flowDynamic, endFlow }) => {
    const today = new Date();
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth() + 1;
    const lastMonthYear = lastMonthDate.getFullYear();

    try {
      // Fetch total spent for last month
      const spentResult = await pool_.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_spent FROM expenses WHERE month = $1 AND year = $2`,
        [lastMonth, lastMonthYear]
      );

      const totalSpent = parseFloat(spentResult.rows[0].total_spent) || 0;

      // Fetch budget for last month
      const budgetResult = await pool_.query(
        `SELECT budgetamount FROM budgets WHERE monthint = $1 AND year = $2 LIMIT 1`,
        [lastMonth, lastMonthYear]
      );

      if (budgetResult.rows.length === 0 && totalSpent === 0) {
        await flowDynamic('📭 *No records available for last month.*');
        return endFlow();
      }

      const budget = budgetResult.rows.length > 0 ? budgetResult.rows[0].budget : DEFAULT_BUDGET;
      const spendRate = (totalSpent / budget) * 100;

      // Create summary message
      let comment = '';
      if (spendRate <= idealSpentPercent ) {
        comment = `🎉 *Great job!* You managed your expenses well and stayed within your budget. Keep it up! 🌟`;
      } else if (spendRate > 85 && spendRate <= 100) {
        comment = `😊 *Good effort!* You almost stayed within your budget. A little more control and you will be perfect! 👍`;
      } else {
        comment = `⚠️ *Overspent!* Try to manage your expenses better this month to stay on track. You can do it! 💪`;
      }

      const summaryMessage = `
📅 *Last Month's Summary*

💵 *Total Spent:* ₹${totalSpent.toLocaleString()}
💰 *Budget:* ₹${budget.toLocaleString()}
📊 *Spend Percent:* ${spendRate.toFixed(2)}%

${comment}
`;

      await flowDynamic(summaryMessage);
    } catch (error) {
      console.error('Error in last month summary flow:', error);
      await flowDynamic(`❌ Error fetching last month's summary. Please try again later.`);
    }

    return endFlow();
  });

module.exports = lastMonthSummaryFlow;
