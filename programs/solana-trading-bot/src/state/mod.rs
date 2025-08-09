use anchor_lang::prelude::*;

#[account]
pub struct TradingBot {
    pub authority: Pubkey,
    pub is_active: bool,
    pub strategy: Strategy,
    pub balance: u64,
    pub total_trades: u64,
    pub successful_trades: u64,
    pub last_trade_timestamp: i64,
    pub created_at: i64,
    pub bump: u8,
}

impl TradingBot {
    pub const DISCRIMINATOR_SIZE: usize = 8;
    pub const PUBKEY_SIZE: usize = 32;
    pub const BOOL_SIZE: usize = 1;
    pub const U64_SIZE: usize = 8;
    pub const I64_SIZE: usize = 8;
    
    pub const SIZE: usize = Self::DISCRIMINATOR_SIZE
        + Self::PUBKEY_SIZE // authority
        + Self::BOOL_SIZE // is_active
        + Strategy::SIZE // strategy
        + Self::U64_SIZE // balance
        + Self::U64_SIZE // total_trades
        + Self::U64_SIZE // successful_trades
        + Self::I64_SIZE // last_trade_timestamp
        + Self::I64_SIZE // created_at
        + 1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Strategy {
    pub strategy_type: StrategyType,
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub buy_threshold: u64,
    pub sell_threshold: u64,
    pub max_slippage: u16,
    pub trade_amount: u64,
    pub stop_loss: Option<u64>,
    pub take_profit: Option<u64>,
}

impl Strategy {
    pub const SIZE: usize = 1 // strategy_type
        + 32 // token_a
        + 32 // token_b
        + 8 // buy_threshold
        + 8 // sell_threshold
        + 2 // max_slippage
        + 8 // trade_amount
        + 1 + 8 // stop_loss (Option<u64>)
        + 1 + 8; // take_profit (Option<u64>)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum StrategyType {
    GridTrading,
    DCA,
    Arbitrage,
    MeanReversion,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct InitializeBotParams {
    pub strategy: Strategy,
    pub initial_balance: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StrategyParams {
    pub strategy: Strategy,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TradeParams {
    pub amount: u64,
    pub min_amount_out: u64,
    pub trade_type: TradeType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum TradeType {
    Buy,
    Sell,
}