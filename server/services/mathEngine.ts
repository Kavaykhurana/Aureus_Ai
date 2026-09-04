/**
 * Financial Math Engine for Deterministic Quantitative Risk
 * As specified in Aureus AI Blueprint Section 3.2 B.
 * Guarantees zero hallucinations for all risk metrics (VaR, Sharpe, Beta, Drawdown).
 */

export class FinancialMathEngine {
  /**
   * Calculates 95% 1-Day Historical Value at Risk (VaR).
   * @param dailyReturns Array of percentage returns (e.g. [-0.024, 0.015, ...])
   * @param portfolioValue Total portfolio notional (e.g. 708420)
   * @returns VaR amount in currency and VaR as percentage
   */
  public static calculateHistoricalVaR95(
    dailyReturns: number[],
    portfolioValue: number
  ): { varAmount: number; varPct: number } {
    if (!dailyReturns || dailyReturns.length === 0) {
      return { varAmount: 0, varPct: 0 };
    }

    // Sort returns in ascending order
    const sorted = [...dailyReturns].sort((a, b) => a - b);

    // 5th percentile index
    const index = Math.max(0, Math.ceil(0.05 * sorted.length) - 1);
    const worstReturnAt5th = sorted[index];

    // VaR is the absolute worst loss at the 5th percentile
    const varPct = Number(Math.abs(worstReturnAt5th * 100).toFixed(2));
    const varAmount = Number((portfolioValue * (varPct / 100)).toFixed(2));

    return { varAmount, varPct };
  }

  /**
   * Calculates Sharpe Ratio deterministically.
   * Sharpe = (Expected Return - Risk-Free Rate) / Annualized Volatility
   * @param annualizedReturn Annualized portfolio or asset return (e.g. 0.16 for 16%)
   * @param riskFreeRate Annualized risk-free rate (e.g. 0.045 for 4.5% 10Y US Treasury)
   * @param annualizedVol Annualized standard deviation of returns
   */
  public static calculateSharpeRatio(
    annualizedReturn: number,
    riskFreeRate: number = 0.045,
    annualizedVol: number
  ): number {
    if (annualizedVol <= 0) return 0;
    const sharpe = (annualizedReturn - riskFreeRate) / annualizedVol;
    return Number(sharpe.toFixed(2));
  }

  /**
   * Calculates Maximum Drawdown (MDD) from a historical price series.
   * Peak-to-trough decline.
   */
  public static calculateMaxDrawdown(priceSeries: number[]): number {
    if (!priceSeries || priceSeries.length < 2) return 0;

    let peak = priceSeries[0];
    let maxDrawdown = 0;

    for (const price of priceSeries) {
      if (price > peak) {
        peak = price;
      }
      const drawdown = (peak - price) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return Number((maxDrawdown * 100).toFixed(2));
  }

  /**
   * Calculates Beta relative to benchmark (e.g. S&P 500).
   * Beta = Covariance(Asset, Benchmark) / Variance(Benchmark)
   */
  public static calculateBeta(assetReturns: number[], benchmarkReturns: number[]): number {
    const n = Math.min(assetReturns.length, benchmarkReturns.length);
    if (n < 2) return 1.0;

    const meanAsset = assetReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanBench = benchmarkReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let benchVariance = 0;

    for (let i = 0; i < n; i++) {
      const assetDiff = assetReturns[i] - meanAsset;
      const benchDiff = benchmarkReturns[i] - meanBench;
      covariance += assetDiff * benchDiff;
      benchVariance += benchDiff * benchDiff;
    }

    if (benchVariance === 0) return 1.0;
    const beta = covariance / benchVariance;
    return Number(beta.toFixed(2));
  }

  /**
   * Calculates Annualized Volatility from daily returns.
   * Standard deviation * sqrt(252 trading days).
   */
  public static calculateVolatility(dailyReturns: number[]): number {
    if (!dailyReturns || dailyReturns.length < 2) return 0.2;

    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      (dailyReturns.length - 1);

    const dailyStdDev = Math.sqrt(variance);
    const annualizedVol = dailyStdDev * Math.sqrt(252);
    return Number(annualizedVol.toFixed(4));
  }
}
