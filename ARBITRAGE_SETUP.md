# 🔄 Arbitrage Strategy Setup Guide

## 🎯 Quick Setup Commands

### **1. Switch to Arbitrage Strategy**
```
/set_strategy arbitrage
```

### **2. Apply Optimized Arbitrage Parameters**
```
/update_params EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v So11111111111111111111111111111111111111112 5 15 100 250000
```

**What these parameters mean:**
- **Token A**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC)
- **Token B**: `So11111111111111111111111111111111111111112` (SOL)
- **Min Profit**: `5` = 0.05 USDC minimum profit per trade
- **Max Time**: `15` = 15 second execution window
- **Max Slippage**: `100` = 1% maximum slippage
- **Trade Size**: `250000` = 0.25 USDC per arbitrage trade

## 🚀 Alternative Token Pairs for Arbitrage

### **USDC/USDT Arbitrage (Stablecoin arb)**
```
/update_params EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB 2 10 50 1000000
```
- Lower profit threshold (0.02 USDC)
- Faster execution (10 seconds)
- Larger trade size (1 USDC)
- Stablecoins have tighter spreads

### **SOL/ETH Arbitrage (High volatility)**
```
/update_params So11111111111111111111111111111111111111112 7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs 50 20 150 100000
```
- Higher profit threshold (0.50 USDC)
- Longer execution window (20 seconds)
- Higher slippage tolerance (1.5%)
- Smaller trade size (0.1 USDC)

## ⚙️ Arbitrage Strategy Optimization Tips

### **🎯 Profit Thresholds**
- **Conservative**: 0.05-0.10 USDC (fewer but safer trades)
- **Aggressive**: 0.02-0.05 USDC (more frequent trades)
- **High Volume**: 0.01-0.02 USDC (maximum frequency)

### **⏱️ Execution Speed**
- **Fast Markets**: 5-10 seconds (highly liquid pairs)
- **Standard**: 10-15 seconds (most pairs)
- **Slow/Illiquid**: 20-30 seconds (exotic pairs)

### **💧 Slippage Settings**
- **Stablecoins**: 0.1-0.5% (very tight)
- **Major tokens**: 0.5-1% (moderate)
- **Volatile tokens**: 1-2% (higher tolerance)

### **💰 Position Sizing**
- **Start Small**: 0.1-0.5 USDC while testing
- **Scale Up**: 1-5 USDC once proven profitable
- **Large Size**: 10+ USDC for established strategies

## 📊 Recommended Arbitrage Setups

### **Setup 1: Conservative Stablecoin Arb**
```
Token Pair: USDC/USDT
Min Profit: 0.05 USDC
Max Time: 8 seconds
Slippage: 0.3%
Trade Size: 2 USDC

Command:
/update_params EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB 50 8 30 2000000
```

### **Setup 2: Aggressive SOL/USDC Arb**
```  
Token Pair: SOL/USDC
Min Profit: 0.03 USDC
Max Time: 12 seconds
Slippage: 0.8%
Trade Size: 0.5 USDC

Command:
/update_params So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 30 12 80 500000
```

### **Setup 3: High-Frequency Micro Arb**
```
Token Pair: SOL/USDC  
Min Profit: 0.01 USDC
Max Time: 5 seconds
Slippage: 1.2%
Trade Size: 0.1 USDC

Command:
/update_params So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 10 5 120 100000
```

## 🔍 Monitoring Your Arbitrage Bot

### **Track Performance**
```
/status    # Check trade statistics
/balance   # Monitor profit accumulation
/trades    # View recent arbitrage executions
```

### **Key Metrics to Watch**
- **Success Rate**: >70% successful trades
- **Average Profit**: Should exceed minimum threshold
- **Execution Time**: Staying within time limits
- **Slippage**: Actual vs maximum allowed

## 🚨 Arbitrage Risk Management

### **⚠️ Important Considerations**
1. **Gas Fees**: Ensure profits exceed transaction costs
2. **Market Volatility**: Higher volatility = more opportunities but more risk
3. **Liquidity**: Ensure sufficient liquidity on both sides
4. **Competition**: Other bots may take opportunities quickly

### **🛡️ Safety Settings**
- Start with small trade sizes
- Set reasonable profit thresholds
- Monitor for unusual behavior
- Keep slippage tight but realistic

## 📈 Getting Started

### **Phase 1: Testing (First Day)**
1. Use Setup 1 (Conservative) with 0.1 USDC trades
2. Monitor for 2-4 hours
3. Check success rate and profitability

### **Phase 2: Optimization (Day 2-3)**
1. Adjust parameters based on results
2. Try different token pairs
3. Gradually increase trade size

### **Phase 3: Scaling (Week 1+)**
1. Use profitable parameters
2. Increase position sizes
3. Consider multiple strategies

## 🎯 Expected Results

**Conservative Setup**: 2-5 trades per hour, 0.05-0.15 USDC profit per trade
**Aggressive Setup**: 5-15 trades per hour, 0.02-0.08 USDC profit per trade
**High-Frequency Setup**: 10-30 trades per hour, 0.01-0.05 USDC profit per trade

---

**Ready to start arbitrage trading?** 🚀
Begin with the Conservative setup and monitor results!