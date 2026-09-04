/**
 * Market Data Service
 * Provides stock quotes, historical returns, fundamentals, and benchmark data.
 */

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  peRatio: number;
  grossMarginPct: number;
  marketCapB: number;
  sector: string;
  dailyReturns: number[];
  priceSeries: number[];
}

const STOCK_REGISTRY: Record<string, StockQuote> = {
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    price: 132.40,
    change: 5.32,
    changePct: 4.18,
    peRatio: 46.8,
    grossMarginPct: 75.4,
    marketCapB: 3250,
    sector: "Technology",
    dailyReturns: [0.024, -0.012, 0.038, -0.015, 0.042, 0.018, -0.022, 0.031, -0.008, 0.019, 0.027, -0.011, 0.034, -0.024, 0.0418],
    priceSeries: [118.5, 121.2, 120.0, 124.5, 123.0, 127.8, 126.4, 128.2, 127.1, 129.5, 131.0, 129.8, 131.4, 127.1, 132.4],
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    price: 445.70,
    change: 5.98,
    changePct: 1.36,
    peRatio: 37.2,
    grossMarginPct: 69.8,
    marketCapB: 3310,
    sector: "Technology",
    dailyReturns: [0.009, -0.004, 0.012, 0.008, -0.007, 0.014, -0.002, 0.011, 0.005, -0.008, 0.0136],
    priceSeries: [430.0, 434.0, 432.5, 437.8, 441.2, 438.0, 444.0, 443.0, 448.0, 442.5, 445.7],
  },
  AMZN: {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    price: 186.10,
    change: 1.70,
    changePct: 0.92,
    peRatio: 41.5,
    grossMarginPct: 48.2,
    marketCapB: 1940,
    sector: "Consumer",
    dailyReturns: [0.012, -0.008, 0.015, 0.003, -0.011, 0.0092],
    priceSeries: [178.0, 180.2, 178.8, 181.5, 182.0, 184.4, 186.1],
  },
  META: {
    ticker: "META",
    name: "Meta Platforms",
    price: 498.20,
    change: -4.22,
    changePct: -0.84,
    peRatio: 26.4,
    grossMarginPct: 81.3,
    marketCapB: 1260,
    sector: "Technology",
    dailyReturns: [0.018, -0.014, 0.005, -0.0084],
    priceSeries: [490.0, 498.8, 492.0, 502.4, 498.2],
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    price: 184.50,
    change: -3.80,
    changePct: -2.02,
    peRatio: 62.1,
    grossMarginPct: 17.4,
    marketCapB: 588,
    sector: "Consumer Cyclical",
    dailyReturns: [-0.038, 0.021, -0.042, 0.015, -0.029, -0.0202],
    priceSeries: [205.0, 197.2, 201.3, 192.8, 195.7, 188.3, 184.5],
  },
  AMD: {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    price: 164.73,
    change: 3.40,
    changePct: 2.11,
    peRatio: 51.0,
    grossMarginPct: 52.6,
    marketCapB: 266,
    sector: "Technology",
    dailyReturns: [0.018, -0.015, 0.032, -0.009, 0.0211],
    priceSeries: [156.0, 158.8, 156.5, 161.4, 160.0, 164.73],
  },
  AVGO: {
    ticker: "AVGO",
    name: "Broadcom Inc.",
    price: 1732.12,
    change: -17.88,
    changePct: -1.02,
    peRatio: 38.4,
    grossMarginPct: 62.1,
    marketCapB: 808,
    sector: "Technology",
    dailyReturns: [-0.012, 0.025, -0.018, -0.0102],
    priceSeries: [1710.0, 1750.0, 1735.0, 1750.0, 1732.12],
  },
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 214.20,
    change: 1.85,
    changePct: 0.87,
    peRatio: 33.1,
    grossMarginPct: 46.2,
    marketCapB: 3280,
    sector: "Technology",
    dailyReturns: [0.008, -0.003, 0.011, 0.0087],
    priceSeries: [208.0, 209.5, 211.0, 212.35, 214.2],
  },
};

const BENCHMARK_SP500_RETURNS = [
  0.006, -0.003, 0.008, 0.002, -0.005, 0.009, -0.001, 0.007, 0.004, -0.006, 0.008
];

export class MarketDataService {
  public static getStockQuote(ticker: string): StockQuote {
    const sym = ticker.toUpperCase().trim();
    if (STOCK_REGISTRY[sym]) {
      return STOCK_REGISTRY[sym];
    }

    // Dynamic generator for arbitrary tickers entered by user
    const hash = sym.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 50 + (hash % 250);
    const changePct = Number((((hash % 9) - 4) * 0.75).toFixed(2));
    const change = Number(((basePrice * changePct) / 100).toFixed(2));

    const dailyReturns = [
      0.012, -0.008, 0.015, -0.011, 0.019, -0.005, 0.008, changePct / 100
    ];

    const priceSeries = [
      basePrice * 0.94,
      basePrice * 0.96,
      basePrice * 0.95,
      basePrice * 0.98,
      basePrice * 0.97,
      basePrice * 1.01,
      basePrice
    ].map((p) => Number(p.toFixed(2)));

    return {
      ticker: sym,
      name: `${sym} Holdings Inc.`,
      price: basePrice,
      change,
      changePct,
      peRatio: 22 + (hash % 30),
      grossMarginPct: 40 + (hash % 45),
      marketCapB: 20 + (hash % 500),
      sector: hash % 2 === 0 ? "Technology" : "Industrial",
      dailyReturns,
      priceSeries,
    };
  }

  public static getBenchmarkReturns(): number[] {
    return BENCHMARK_SP500_RETURNS;
  }
}
