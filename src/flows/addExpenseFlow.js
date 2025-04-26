const { addKeyword } = require('@builderbot/bot');
const pool_ = require('../db/postgresClient');

const addExpenseFlow = addKeyword('ADD_EXPENSE_FLOW')
  .addAnswer(
    '💸 *Please enter the expense amount* (e.g., 1200 or 99.99)',
    { capture: true },
    async (ctx, { state, fallBack }) => {
      const amountInput = ctx.body.trim();
      
      // Validate amount
      if (!/^\d+(\.\d{1,2})?$/.test(amountInput)) {
        await fallBack('❌ Invalid amount! Please send a valid number like 1000 or 99.99.');
        return;
      }
      
      await state.update({ amount: parseFloat(amountInput) });
      // No flowDynamic here, just update state and continue to next question
    }
  )
  .addAnswer(
    '📝 *Please enter a note/description for this expense* (e.g., Grocery, Fuel, etc.)',
    { capture: true },
    async (ctx, { state }) => {
      const notes = ctx.body.trim();
      await state.update({ notes });
      // No intermediate feedback here either
    }
  )  
  .addAnswer(
    '✅ *Confirm your expense details:*\n\n👉 Reply *yes* to confirm, *no* to cancel.',
    { capture: true },
    async (ctx, { flowDynamic, state, endFlow, fallBack }) => {
      // Show expense details first
      const amount = await state.get('amount');
      const notes = await state.get('notes');
      
      await flowDynamic(`💵 Amount: *₹${amount}*\n📝 Notes: *${notes}*`);

    //   await flowDynamic(
    //     `✅ *Please confirm your expense details:*\n\n` +
    //     `💵 Amount: *₹${amount}*\n` +
    //     `📝 Notes: *${notes}*\n\n` +
    //     `👉 Reply *yes* to confirm, *no* to cancel.`
    //   );
      
      // Process confirmation
      const confirmation = ctx.body.trim().toLowerCase();
      
      if (confirmation === 'yes') {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const phoneNumber = ctx.from;
        
        try {
          await pool_.query(
            `INSERT INTO expenses (phone_number, year, month, amount, notes) VALUES ($1, $2, $3, $4, $5)`,
            [phoneNumber, year, month, amount, notes]
          );
          
          await flowDynamic('🎉 *Expense saved successfully!* 💸'); 


        } catch (error) {
          console.error('Database error:', error);
          await flowDynamic('❌ Error saving expense. Please try again later.');
        }
      } else if (confirmation === 'no') {
        await flowDynamic('🚫 *Expense creation cancelled.*');
      } else {
        await flowDynamic('⚠️ *Please reply with "yes" or "no" only.*');
        return fallBack();
      }
    }
  )
  .addAnswer(
    `📊 Would you like to see your current month\'s summary?\n👉 Reply *yes* or *no*`,
    { capture: true },
     async (ctx, { flowDynamic, gotoFlow, endFlow }) => {
    // Show expense details first
  
    const answer = ctx.body.trim().toLowerCase(); 

    if (answer === 'yes') {
        return gotoFlow(require('./monthSummaryFlow.js'));
      } else if (answer === 'no') {
        await flowDynamic('✨ Taking you back to Main Menu...');
        return gotoFlow(require('./budgetFlow.js'));
      } else {
        await flowDynamic('⚠️ *Please reply with \"yes\" or \"no\" only.*');
        return endFlow();
      }
 
}
);

module.exports = addExpenseFlow;