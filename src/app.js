// --- Setup Global Error Handlers ---

process.on('uncaughtException', (error) => {
    console.error(`[${new Date().toISOString()}] ❌ Uncaught Exception:`, error);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${new Date().toISOString()}] ❌ Unhandled Rejection at:`, promise, 'reason:', reason);
  });
  
  // --- Imports ---
  
  const { join } = require('path');
  const { createBot, createProvider, createFlow, addKeyword, utils } = require('@builderbot/bot');
  const { PostgreSQLAdapter: Database } = require('@builderbot/database-postgres');
  const { TwilioProvider: Provider } = require('@builderbot/provider-twilio');
  require('dotenv').config();
  
  // --- Flows ---
  
  const budgetFlow = require('./flows/budgetFlow.js');
  const addExpenseFlow = require('./flows/addExpenseFlow.js');
  const monthSummaryFlow = require('./flows/monthSummaryFlow.js');
  const lastMonthSummaryFlow = require('./flows/lastMonthSummaryFlow.js');
  const menuHandlerFlow = require('./flows/menuHandlerFlow.js');
  const currentBudgetFlow = require('./flows/currentBudgetFlow.js');
  
  // --- Server Configuration ---
  
  const PORT = process.env.PORT ?? 3008;
  
  // --- Main ---
  
  const main = async () => {
    try {
      console.log(`[${new Date().toISOString()}] 🚀 Starting BudgetBot...`); 
      
  
      const adapterProvider = createProvider(Provider, {
        accountSid: process.env.accountSid,
        authToken: process.env.authToken,
        vendorNumber: process.env.vendorNumber,
      });

      adapterProvider.server.post(
        '/webhook',
        async (req, res) => {
          const { from, body } = req.body;
          await adapterProvider.incoming(from, body); // Pass to builderbot
          res.status(200).end(); // Clean empty 200 OK
        }
      );
      
  
      const adapterDB = new Database({
        host: process.env.POSTGRES_DB_HOST,
        user: process.env.POSTGRES_DB_USER,
        database: process.env.POSTGRES_DB_NAME,
        password: process.env.POSTGRES_DB_PASSWORD,
        port: +process.env.POSTGRES_DB_PORT,
      });
  
      const adapterFlow = createFlow([
        budgetFlow,
        menuHandlerFlow,
        currentBudgetFlow,
        addExpenseFlow,
        monthSummaryFlow,
        lastMonthSummaryFlow
      ]);
  
      const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
      });

    //   adapterProvider.server.post(
    //     '/webhook',
    //     handleCtx(async (bot, req, res) => {
    //       res.status(200).end();
    //     })
    //   );
  
    //   // --- Setup Webhook Route ---
    //   adapterProvider.server.post(
    //     '/webhook',
    //     handleCtx(async (bot, req, res) => {
    //       res.status(200).end();
    //     })
    //   );
  
    //   // --- Health Check Route for Railway ---
    //   adapterProvider.server.get('/', (req, res) => {
    //     res.status(200).send('✅ BudgetBot is running!');
    //   });
  
      // --- Start Server ---
      httpServer(+PORT);
  
      console.log(`[${new Date().toISOString()}] 🛜 HTTP Server ON`);
      console.log(`[POST]: http://localhost:${PORT}/webhook`);
      console.log(`[GET]: http://localhost:${PORT}/`);
      console.log(`[${new Date().toISOString()}] 🆗 Successful DB Connection`);
      console.log(`[${new Date().toISOString()}] 🚀 BudgetBot started successfully and ready!`);
  
      // --- Keep Node.js process alive ---
      await new Promise(() => {});
  
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Fatal Error in main():`, error);
      process.exit(1); // Optional clean exit
    }
  };
  
  main();
  