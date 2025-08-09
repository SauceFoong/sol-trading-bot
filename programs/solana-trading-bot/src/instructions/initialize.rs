use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(params: InitializeBotParams)]
pub struct InitializeBot<'info> {
    #[account(
        init,
        payer = authority,
        space = TradingBot::SIZE,
        seeds = [b"trading-bot", authority.key().as_ref()],
        bump
    )]
    pub trading_bot: Account<'info, TradingBot>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_bot_handler(ctx: Context<InitializeBot>, params: InitializeBotParams) -> Result<()> {
    let trading_bot = &mut ctx.accounts.trading_bot;
    let clock = Clock::get()?;
    
    trading_bot.authority = ctx.accounts.authority.key();
    trading_bot.is_active = true;
    trading_bot.strategy = params.strategy;
    trading_bot.balance = params.initial_balance;
    trading_bot.total_trades = 0;
    trading_bot.successful_trades = 0;
    trading_bot.last_trade_timestamp = 0;
    trading_bot.created_at = clock.unix_timestamp;
    trading_bot.bump = ctx.bumps.trading_bot;
    
    msg!("Trading bot initialized for authority: {}", ctx.accounts.authority.key());
    Ok(())
}
