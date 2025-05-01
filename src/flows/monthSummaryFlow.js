const { addKeyword } = require('@builderbot/bot');
const pool_ = require('../db/postgresClient');
require('dotenv').config();
const DEFAULT_BUDGET = parseFloat(process.env.DEFAULT_BUDGET);
const idealSpentPercent = parseFloat(process.env.IDEAL_SPEND_BUDGET_PERCENT);


const monthSummaryFlow = addKeyword('MONTH_SUMMARY')
  .addAction(async (ctx, { flowDynamic, endFlow }) => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();


    try {
      // Fetch total spent
      const spentResult = await pool_.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_spent FROM expenses WHERE month = $1 AND year = $2`,
        [currentMonth, currentYear]
      );
      const totalSpent = parseFloat(spentResult.rows[0].total_spent) || 0;

      // Fetch budget
      const budgetResult = await pool_.query(
        `SELECT budgetamount FROM budgets WHERE monthint = $1 AND year = $2 LIMIT 1`,
        [currentMonth, currentYear]
      );
      const budget = budgetResult.rows.length > 0 ? budgetResult.rows[0].budgetamount : DEFAULT_BUDGET;

      const totalRemaining =  budget - totalSpent;
      const currentAvgSpent = totalSpent / currentDay;
      const requiredAvgSpend = totalRemaining / (totalDaysInMonth - currentDay || 1); // Avoid division by 0

      let daysYouWillLast = 0;
      if (currentAvgSpent > 0) {
        daysYouWillLast = totalRemaining / currentAvgSpent;
      }

      daysYouWillLast = Math.floor(daysYouWillLast); // Rounded to full days

      if(daysYouWillLast > (totalDaysInMonth - currentDay || 1) ){
        daysYouWillLast = (totalDaysInMonth - currentDay || 1);
      } 

      const topExpensesResult = await pool_.query(
        `SELECT notes, amount FROM expenses WHERE month = $1 AND year = $2 ORDER BY amount DESC LIMIT 5`,
        [currentMonth, currentYear]
      );
      
      const topExpenses = topExpensesResult.rows;
      
      let topExpenseText = '💸 *Top 5 Expenses This Month:*\n';
      
      if (topExpenses.length > 0) {
        topExpenses.forEach((expense, index) => {
          topExpenseText += `${index + 1}. ${expense.notes} - ₹${parseFloat(expense.amount).toLocaleString()}\n`;
        });
      } else {
        topExpenseText += 'No expenses recorded yet this month.\n';
      }
      

      // Create a summary message
      let dailyLimit = budget / totalDaysInMonth  ;
      let comment = '';
      if (requiredAvgSpend > dailyLimit) {
        comment = `✅ *You're doing great!*  \nKeep your expenses low and you will easily save more this month.  \nStay consistent and avoid unnecessary spending! ✨`;
      } else {
        comment = `⚠️ *Be careful!*  \nYour required average daily spend is a bit high.  \nTry to control unnecessary expenses if you want to meet your savings goal. 💪`;
      }

      const summaryMessage = `
📊 *Your Spending Summary for This Month*

💵 *Total Spent So Far:* ₹${totalSpent.toLocaleString()}
💰 *Money Left in Budget:* ₹${totalRemaining.toLocaleString()}

📈 *Average Daily Spending:* ₹${currentAvgSpent.toFixed(2)}
📉 *Daily Spending Limit to Stay on Track:* ₹${requiredAvgSpend.toFixed(2)}

🕰️ *At your current pace, your money will last another* *${daysYouWillLast} days*.

${topExpenseText}
${comment}
`;

      await flowDynamic(summaryMessage);
    } catch (error) {
      console.error('Error in month summary flow:', error);
      await flowDynamic('❌ Error fetching your summary. Please try again later.');
    }

    return endFlow();
  });

module.exports = monthSummaryFlow;