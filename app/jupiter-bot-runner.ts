import { SimpleJupiterTelegramBot } from './src/simple-jupiter-telegram';

async function main() {
  console.log('🚀 Starting Jupiter Trading Bot...');
  
  const bot = new SimpleJupiterTelegramBot();
  
  try {
    await bot.launch();
    console.log('✅ Jupiter Telegram Bot is running!');
  } catch (error) {
    console.error('❌ Failed to start Jupiter bot:', error);
    process.exit(1);
  }
}

main().catch(console.error);