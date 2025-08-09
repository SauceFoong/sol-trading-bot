use anchor_lang::prelude::*;

#[error_code]
pub enum TradingBotError {
    #[msg("Trading bot is not active")]
    BotNotActive,
    #[msg("Insufficient funds for operation")]
    InsufficientFunds,
    #[msg("Invalid strategy parameters")]
    InvalidStrategy,
    #[msg("Trade amount too small")]
    TradeAmountTooSmall,
    #[msg("Trade amount too large")]
    TradeAmountTooLarge,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Price threshold not met")]
    PriceThresholdNotMet,
    #[msg("Unauthorized access")]
    Unauthorized,
}
