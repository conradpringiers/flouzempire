// ===== SOCIAL SYSTEM =====

import { randomId } from './GameState';

// ===== MILLIONAIRES =====

export interface Millionaire {
  id: string;
  name: string;
  image: string;
  netWorth: number;
  relationship: number; // 0-100
  isFriend: boolean;
  industry: string;
  personality: 'humble' | 'arrogant' | 'eccentric' | 'friendly';
}

export const MILLIONAIRE_DATA: Omit<Millionaire, 'relationship' | 'isFriend'>[] = [
  { id: 'eloun', name: 'Eloun Mouzk', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face', netWorth: 250_000_000_000, industry: 'Tech & Space', personality: 'eccentric' },
  { id: 'jeff', name: 'Jeff Pesos', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', netWorth: 180_000_000_000, industry: 'E-commerce', personality: 'arrogant' },
  { id: 'bonald', name: 'Bonald Drunk', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', netWorth: 5_000_000_000, industry: 'Real Estate', personality: 'arrogant' },
  { id: 'bill', name: 'Bill Fences', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face', netWorth: 130_000_000_000, industry: 'Software', personality: 'humble' },
  { id: 'mark', name: 'Mark Zuckerbug', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', netWorth: 100_000_000_000, industry: 'Social Media', personality: 'eccentric' },
  { id: 'tim', name: 'Tim Kouke', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', netWorth: 2_000_000_000, industry: 'Tech Hardware', personality: 'humble' },
  { id: 'warren', name: 'Warren Muffet', image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=face', netWorth: 120_000_000_000, industry: 'Investments', personality: 'humble' },
  { id: 'larry', name: 'Larry Paige', image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face', netWorth: 95_000_000_000, industry: 'Search Engine', personality: 'friendly' },
  { id: 'sergey', name: 'Sergey Brinn', image: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face', netWorth: 90_000_000_000, industry: 'Search Engine', personality: 'eccentric' },
  { id: 'oprah', name: 'Oprah Windfree', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face', netWorth: 3_500_000_000, industry: 'Media', personality: 'friendly' },
  { id: 'richard', name: 'Richard Bransun', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face', netWorth: 4_000_000_000, industry: 'Airlines', personality: 'eccentric' },
  { id: 'jack', name: 'Jack Mah', image: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', netWorth: 35_000_000_000, industry: 'E-commerce', personality: 'friendly' },
  { id: 'steve', name: 'Steve Balmer', image: 'https://images.unsplash.com/photo-1615109398623-88346a601842?w=150&h=150&fit=crop&crop=face', netWorth: 80_000_000_000, industry: 'Software', personality: 'arrogant' },
  { id: 'jensen', name: 'Jensen Hwang', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', netWorth: 70_000_000_000, industry: 'AI & Chips', personality: 'humble' },
  { id: 'kim', name: 'Kim Kardishan', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', netWorth: 2_000_000_000, industry: 'Fashion', personality: 'arrogant' },
];

export interface MillionaireAction {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  relationGain: number;
  requiredWealth: number; // minimum player wealth to unlock
  cooldownMs: number;
}

export const MILLIONAIRE_ACTIONS: MillionaireAction[] = [
  { id: 'coffee', name: 'Coffee Meeting', icon: '☕', description: 'Have a casual coffee chat', cost: 1000, relationGain: 3, requiredWealth: 0, cooldownMs: 60000 },
  { id: 'dinner', name: 'Fancy Dinner', icon: '🍽️', description: 'Wine and dine at a 5-star restaurant', cost: 25000, relationGain: 8, requiredWealth: 100000, cooldownMs: 300000 },
  { id: 'gift', name: 'Luxury Gift', icon: '🎁', description: 'Send an expensive gift', cost: 100000, relationGain: 12, requiredWealth: 500000, cooldownMs: 600000 },
  { id: 'yacht', name: 'Yacht Party', icon: '🛥️', description: 'Host a party on your yacht', cost: 500000, relationGain: 20, requiredWealth: 5000000, cooldownMs: 1800000 },
  { id: 'island', name: 'Island Invitation', icon: '🏝️', description: 'Invite them to your private island', cost: 2000000, relationGain: 35, requiredWealth: 50000000, cooldownMs: 3600000 },
  { id: 'collab', name: 'Business Collab', icon: '🤝', description: 'Propose a business partnership', cost: 10000000, relationGain: 50, requiredWealth: 100000000, cooldownMs: 7200000 },
];

// ===== FICTIONAL COMPANIES =====

export interface FictionalCompany {
  id: string;
  name: string;
  ticker: string;
  logo: string;
  industry: string;
  basePrice: number;
  volatility: number;
  dividendYield: number; // percentage per hour
}

export const COMPANY_DATA: FictionalCompany[] = [
  { id: 'mapple', name: 'Mapple Inc.', ticker: 'MAPL', logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop', industry: 'Tech', basePrice: 185, volatility: 0.03, dividendYield: 0.1 },
  { id: 'macbonalds', name: 'MacBonalds', ticker: 'MCD', logo: 'https://images.unsplash.com/photo-1619454016518-697bc231e7cb?w=80&h=80&fit=crop', industry: 'Fast Food', basePrice: 95, volatility: 0.02, dividendYield: 0.15 },
  { id: 'goggle', name: 'Goggle', ticker: 'GOGL', logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=80&h=80&fit=crop', industry: 'Tech', basePrice: 145, volatility: 0.035, dividendYield: 0.08 },
  { id: 'adadad', name: 'Adadad', ticker: 'ADAD', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop', industry: 'Sports', basePrice: 75, volatility: 0.04, dividendYield: 0.12 },
  { id: 'niky', name: 'Niky', ticker: 'NIKY', logo: 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=80&h=80&fit=crop', industry: 'Sports', basePrice: 120, volatility: 0.035, dividendYield: 0.11 },
  { id: 'starbox', name: 'Starbox Coffee', ticker: 'SBUX', logo: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=80&h=80&fit=crop', industry: 'Food & Beverage', basePrice: 65, volatility: 0.025, dividendYield: 0.18 },
  { id: 'amason', name: 'Amason', ticker: 'AMZN', logo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=80&h=80&fit=crop', industry: 'E-commerce', basePrice: 180, volatility: 0.04, dividendYield: 0.05 },
  { id: 'tezla', name: 'Tezla Motors', ticker: 'TZLA', logo: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=80&h=80&fit=crop', industry: 'Automotive', basePrice: 220, volatility: 0.08, dividendYield: 0.02 },
  { id: 'microhard', name: 'Microhard', ticker: 'MHRD', logo: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=80&h=80&fit=crop', industry: 'Software', basePrice: 380, volatility: 0.025, dividendYield: 0.12 },
  { id: 'netflux', name: 'Netflux', ticker: 'NFLX', logo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=80&h=80&fit=crop', industry: 'Streaming', basePrice: 450, volatility: 0.05, dividendYield: 0.06 },
  { id: 'metabook', name: 'Metabook', ticker: 'META', logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&h=80&fit=crop', industry: 'Social Media', basePrice: 320, volatility: 0.045, dividendYield: 0.09 },
  { id: 'disny', name: 'Disny', ticker: 'DSNY', logo: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=80&h=80&fit=crop', industry: 'Entertainment', basePrice: 95, volatility: 0.03, dividendYield: 0.14 },
  { id: 'cocacolo', name: 'Cocacolo', ticker: 'COCO', logo: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=80&h=80&fit=crop', industry: 'Beverages', basePrice: 58, volatility: 0.015, dividendYield: 0.2 },
  { id: 'visaa', name: 'Visaa', ticker: 'VISA', logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=80&h=80&fit=crop', industry: 'Finance', basePrice: 275, volatility: 0.02, dividendYield: 0.15 },
  { id: 'nvideo', name: 'Nvideo', ticker: 'NVDA', logo: 'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=80&h=80&fit=crop', industry: 'Tech', basePrice: 850, volatility: 0.06, dividendYield: 0.04 },
  { id: 'samsing', name: 'Samsing', ticker: 'SAMS', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=80&h=80&fit=crop', industry: 'Electronics', basePrice: 68, volatility: 0.035, dividendYield: 0.13 },
  { id: 'sonny', name: 'Sonny', ticker: 'SONY', logo: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=80&h=80&fit=crop', industry: 'Electronics', basePrice: 85, volatility: 0.03, dividendYield: 0.11 },
  { id: 'intell', name: 'Intell', ticker: 'INTL', logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=80&h=80&fit=crop', industry: 'Tech', basePrice: 32, volatility: 0.04, dividendYield: 0.16 },
  { id: 'orakel', name: 'Orakel', ticker: 'ORCL', logo: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=80&h=80&fit=crop', industry: 'Software', basePrice: 125, volatility: 0.025, dividendYield: 0.14 },
  { id: 'salesforse', name: 'Salesforse', ticker: 'SLFS', logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&h=80&fit=crop', industry: 'Software', basePrice: 260, volatility: 0.03, dividendYield: 0.1 },
  { id: 'alibabba', name: 'Alibabba', ticker: 'BABA', logo: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=80&h=80&fit=crop', industry: 'E-commerce', basePrice: 85, volatility: 0.055, dividendYield: 0.07 },
  { id: 'ubear', name: 'Ubear', ticker: 'UBER', logo: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=80&h=80&fit=crop', industry: 'Transport', basePrice: 45, volatility: 0.045, dividendYield: 0.03 },
  { id: 'airbnbn', name: 'Airbnbn', ticker: 'ABNB', logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80&h=80&fit=crop', industry: 'Travel', basePrice: 135, volatility: 0.04, dividendYield: 0.05 },
  { id: 'paypaul', name: 'Paypaul', ticker: 'PYPL', logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=80&h=80&fit=crop', industry: 'Finance', basePrice: 65, volatility: 0.04, dividendYield: 0.08 },
  { id: 'jpmorgun', name: 'JP Morgun', ticker: 'JPM', logo: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=80&h=80&fit=crop', industry: 'Banking', basePrice: 195, volatility: 0.025, dividendYield: 0.18 },
];

export interface CompanyStock {
  companyId: string;
  currentPrice: number;
  priceHistory: number[];
}

export interface StockHolding {
  companyId: string;
  shares: number;
  avgBuyPrice: number;
}

// ===== SOCIAL STATE =====

export interface SocialState {
  millionaires: Millionaire[];
  stocks: CompanyStock[];
  holdings: StockHolding[];
  lastStockTick: number;
  actionCooldowns: { [millionaireId: string]: { [actionId: string]: number } };
}

export function createInitialSocialState(): SocialState {
  return {
    millionaires: MILLIONAIRE_DATA.map(m => ({
      ...m,
      relationship: 0,
      isFriend: false,
    })),
    stocks: COMPANY_DATA.map(c => ({
      companyId: c.id,
      currentPrice: c.basePrice,
      priceHistory: Array(20).fill(c.basePrice),
    })),
    holdings: [],
    lastStockTick: Date.now(),
    actionCooldowns: {},
  };
}

export function tickStocks(stocks: CompanyStock[]): CompanyStock[] {
  return stocks.map(stock => {
    const company = COMPANY_DATA.find(c => c.id === stock.companyId);
    if (!company) return stock;
    
    // Random walk with mean reversion
    const volatility = company.volatility;
    const change = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = (company.basePrice - stock.currentPrice) / company.basePrice * 0.01;
    
    let newPrice = stock.currentPrice * (1 + change + meanReversion);
    newPrice = Math.max(company.basePrice * 0.3, Math.min(company.basePrice * 3, newPrice));
    newPrice = Math.round(newPrice * 100) / 100;
    
    const newHistory = [...stock.priceHistory.slice(-19), newPrice];
    
    return {
      ...stock,
      currentPrice: newPrice,
      priceHistory: newHistory,
    };
  });
}

export function getPlayerRank(playerWealth: number, millionaires: Millionaire[]): number {
  const sorted = [...millionaires, { netWorth: playerWealth, id: 'player' }]
    .sort((a, b) => b.netWorth - a.netWorth);
  return sorted.findIndex(m => m.id === 'player') + 1;
}

export function getImpressionFactor(playerWealth: number, targetWealth: number): number {
  // How impressed is the millionaire based on your relative wealth
  const ratio = playerWealth / targetWealth;
  if (ratio >= 1) return 2; // You're richer, they're impressed!
  if (ratio >= 0.5) return 1.5;
  if (ratio >= 0.1) return 1;
  if (ratio >= 0.01) return 0.7;
  return 0.4; // You're much poorer, harder to impress
}

export function getFriendBonuses(friendCount: number): { incomeMultiplier: number; tapMultiplier: number } {
  return {
    incomeMultiplier: 1 + friendCount * 0.02, // +2% income per friend
    tapMultiplier: 1 + friendCount * 0.05, // +5% tap power per friend
  };
}

export function getCompanyTotalShares(): number {
  return 1_000_000; // Each company has 1M shares
}

export function getOwnershipPercentage(shares: number): number {
  return (shares / getCompanyTotalShares()) * 100;
}

export function getDividendPerHour(holdings: StockHolding[], stocks: CompanyStock[]): number {
  let total = 0;
  for (const h of holdings) {
    const stock = stocks.find(s => s.companyId === h.companyId);
    const company = COMPANY_DATA.find(c => c.id === h.companyId);
    if (stock && company) {
      // dividend = shares * price * yield / 100
      total += h.shares * stock.currentPrice * (company.dividendYield / 100);
    }
  }
  return total;
}
