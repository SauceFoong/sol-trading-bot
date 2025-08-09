pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("EroGopwwQVYXgbMZigR1UvQ9xZh7fviL4897ZUvYtt2F");

#[program]
pub mod solana_trading_bot {
    use super::*;

    pub fn initialize_bot(ctx: Context<InitializeBot>, params: InitializeBotParams) -> Result<()> {
        initialize::initialize_bot_handler(ctx, params)
    }

    pub fn update_strategy(ctx: Context<UpdateStrategy>, strategy_params: StrategyParams) -> Result<()> {
        instructions::update_strategy_handler(ctx, strategy_params)
    }

    pub fn execute_trade(ctx: Context<ExecuteTrade>, trade_params: TradeParams) -> Result<()> {
        instructions::execute_trade_handler(ctx, trade_params)
    }

    pub fn pause_bot(ctx: Context<PauseBot>) -> Result<()> {
        instructions::pause_bot_handler(ctx)
    }

    pub fn resume_bot(ctx: Context<ResumeBot>) -> Result<()> {
        instructions::resume_bot_handler(ctx)
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        instructions::withdraw_funds_handler(ctx, amount)
    }

    pub fn jupiter_swap(ctx: Context<JupiterSwap>, params: JupiterSwapParams) -> Result<()> {
        instructions::execute_jupiter_swap_handler(ctx, params)
    }

    pub fn raydium_swap(ctx: Context<RaydiumSwap>, params: RaydiumSwapParams) -> Result<()> {
        instructions::execute_raydium_swap_handler(ctx, params)
    }

    pub fn update_price(ctx: Context<UpdatePrice>, price_data: PriceData) -> Result<()> {
        instructions::update_price_handler(ctx, price_data)
    }

    pub fn check_strategy(ctx: Context<CheckStrategy>) -> Result<bool> {
        instructions::check_strategy_handler(ctx)
    }
}
