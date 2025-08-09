use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(
        mut,
        seeds = [b"trading-bot", authority.key().as_ref()],
        bump = trading_bot.bump,
        has_one = authority
    )]
    pub trading_bot: Account<'info, TradingBot>,
    
    pub authority: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PriceData {
    pub token_a_price: u64,
    pub token_b_price: u64,
    pub timestamp: i64,
    pub confidence: u32,
}

pub fn update_price_handler(ctx: Context<UpdatePrice>, price_data: PriceData) -> Result<()> {
    let trading_bot = &mut ctx.accounts.trading_bot;
    let strategy = &trading_bot.strategy;
    
    msg!("Price update - Token A: {}, Token B: {}", price_data.token_a_price, price_data.token_b_price);
    
    // Calculate price ratio
    let price_ratio = if price_data.token_b_price > 0 {
        (price_data.token_a_price * 10000) / price_data.token_b_price
    } else {
        0
    };
    
    // Check strategy conditions
    match strategy.strategy_type {
        StrategyType::GridTrading => {
            check_grid_trading_conditions(trading_bot, price_ratio)?;
        },
        StrategyType::DCA => {
            check_dca_conditions(trading_bot, price_ratio)?;
        },
        StrategyType::MeanReversion => {
            check_mean_reversion_conditions(trading_bot, price_ratio)?;
        },
        StrategyType::Arbitrage => {
            check_arbitrage_conditions(trading_bot, price_data)?;
        },
    }
    
    Ok(())
}

fn check_grid_trading_conditions(trading_bot: &TradingBot, price_ratio: u64) -> Result<()> {
    let strategy = &trading_bot.strategy;
    
    if price_ratio <= strategy.buy_threshold {
        msg!("Grid Trading: Buy signal triggered at ratio {}", price_ratio);
        // Emit buy signal event or set flag
    } else if price_ratio >= strategy.sell_threshold {
        msg!("Grid Trading: Sell signal triggered at ratio {}", price_ratio);
        // Emit sell signal event or set flag
    }
    
    Ok(())
}

fn check_dca_conditions(trading_bot: &TradingBot, _price_ratio: u64) -> Result<()> {
    let clock = Clock::get()?;
    let time_since_last_trade = clock.unix_timestamp - trading_bot.last_trade_timestamp;
    
    // DCA typically buys at regular intervals regardless of price
    if time_since_last_trade > 3600 { // 1 hour interval
        msg!("DCA: Time-based buy signal triggered");
        // Emit buy signal event or set flag
    }
    
    Ok(())
}

fn check_mean_reversion_conditions(trading_bot: &TradingBot, price_ratio: u64) -> Result<()> {
    let strategy = &trading_bot.strategy;
    
    // Simple mean reversion: buy when price is below threshold, sell when above
    if price_ratio <= strategy.buy_threshold {
        msg!("Mean Reversion: Buy signal - price below mean");
    } else if price_ratio >= strategy.sell_threshold {
        msg!("Mean Reversion: Sell signal - price above mean");
    }
    
    Ok(())
}

fn check_arbitrage_conditions(trading_bot: &TradingBot, price_data: PriceData) -> Result<()> {
    // Arbitrage logic would compare prices across different exchanges/pools
    // This is a simplified version
    let price_difference = if price_data.token_a_price > price_data.token_b_price {
        price_data.token_a_price - price_data.token_b_price
    } else {
        price_data.token_b_price - price_data.token_a_price
    };
    
    let threshold = trading_bot.strategy.buy_threshold;
    
    if price_difference > threshold {
        msg!("Arbitrage: Opportunity detected with {} difference", price_difference);
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct CheckStrategy<'info> {
    #[account(
        seeds = [b"trading-bot", authority.key().as_ref()],
        bump = trading_bot.bump,
        has_one = authority
    )]
    pub trading_bot: Account<'info, TradingBot>,
    
    pub authority: Signer<'info>,
}

pub fn check_strategy_handler(ctx: Context<CheckStrategy>) -> Result<bool> {
    let trading_bot = &ctx.accounts.trading_bot;
    
    require!(trading_bot.is_active, crate::error::TradingBotError::BotNotActive);
    
    let clock = Clock::get()?;
    let time_since_last_trade = clock.unix_timestamp - trading_bot.last_trade_timestamp;
    
    // Check if enough time has passed since last trade (prevent spam)
    let min_interval = 60; // 1 minute minimum
    
    if time_since_last_trade < min_interval {
        msg!("Strategy check: Not enough time passed since last trade");
        return Ok(false);
    }
    
    // Check stop loss
    if let Some(stop_loss) = trading_bot.strategy.stop_loss {
        if trading_bot.balance <= stop_loss {
            msg!("Strategy check: Stop loss triggered");
            return Ok(false);
        }
    }
    
    // Check take profit
    if let Some(take_profit) = trading_bot.strategy.take_profit {
        if trading_bot.balance >= take_profit {
            msg!("Strategy check: Take profit triggered");
            return Ok(false);
        }
    }
    
    Ok(true)
}