use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct UpdateStrategy<'info> {
    #[account(
        mut,
        seeds = [b"trading-bot", authority.key().as_ref()],
        bump = trading_bot.bump,
        has_one = authority
    )]
    pub trading_bot: Account<'info, TradingBot>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct PauseBot<'info> {
    #[account(
        mut,
        seeds = [b"trading-bot", authority.key().as_ref()],
        bump = trading_bot.bump,
        has_one = authority
    )]
    pub trading_bot: Account<'info, TradingBot>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResumeBot<'info> {
    #[account(
        mut,
        seeds = [b"trading-bot", authority.key().as_ref()],
        bump = trading_bot.bump,
        has_one = authority
    )]
    pub trading_bot: Account<'info, TradingBot>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(
        mut,
        seeds = [b"trading-bot", authority.key().as_ref()],
        bump = trading_bot.bump,
        has_one = authority
    )]
    pub trading_bot: Account<'info, TradingBot>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn update_strategy_handler(ctx: Context<UpdateStrategy>, strategy_params: StrategyParams) -> Result<()> {
    let trading_bot = &mut ctx.accounts.trading_bot;
    
    trading_bot.strategy = strategy_params.strategy;
    
    msg!("Trading strategy updated for bot: {}", ctx.accounts.authority.key());
    Ok(())
}

pub fn pause_bot_handler(ctx: Context<PauseBot>) -> Result<()> {
    let trading_bot = &mut ctx.accounts.trading_bot;
    
    trading_bot.is_active = false;
    
    msg!("Trading bot paused for authority: {}", ctx.accounts.authority.key());
    Ok(())
}

pub fn resume_bot_handler(ctx: Context<ResumeBot>) -> Result<()> {
    let trading_bot = &mut ctx.accounts.trading_bot;
    
    trading_bot.is_active = true;
    
    msg!("Trading bot resumed for authority: {}", ctx.accounts.authority.key());
    Ok(())
}

pub fn withdraw_funds_handler(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
    // Check balance first
    require!(ctx.accounts.trading_bot.balance >= amount, crate::error::TradingBotError::InsufficientFunds);
    
    // Check actual account lamports before attempting withdrawal
    let bot_lamports = ctx.accounts.trading_bot.to_account_info().lamports();
    require!(bot_lamports >= amount, crate::error::TradingBotError::InsufficientFunds);
    
    // Update balance
    ctx.accounts.trading_bot.balance -= amount;
    
    // Transfer lamports
    **ctx.accounts.trading_bot.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;
    
    msg!("Withdrawn {} lamports from trading bot", amount);
    Ok(())
}