use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(trade_params: TradeParams)]
pub struct ExecuteTrade<'info> {
    #[account(
        mut,
        seeds = [b"trading-bot", authority.key().as_ref()],
        bump = trading_bot.bump,
        has_one = authority
    )]
    pub trading_bot: Account<'info, TradingBot>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn execute_trade_handler(ctx: Context<ExecuteTrade>, trade_params: TradeParams) -> Result<()> {
    let trading_bot = &mut ctx.accounts.trading_bot;
    
    require!(trading_bot.is_active, crate::error::TradingBotError::BotNotActive);
    
    let clock = Clock::get()?;
    
    match trade_params.trade_type {
        TradeType::Buy => {
            msg!("Executing BUY trade for amount: {}", trade_params.amount);
        },
        TradeType::Sell => {
            msg!("Executing SELL trade for amount: {}", trade_params.amount);
        }
    }
    
    trading_bot.total_trades += 1;
    trading_bot.last_trade_timestamp = clock.unix_timestamp;
    
    Ok(())
}