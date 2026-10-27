// Game state types

export interface CafeLocationStock {
  beans: number; milk: number; sugar: number; cups: number;
}

export interface CafeMenuItem {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
}

export interface CafeLocationUpgrades {
  wifi: boolean;       // +8 satisfaction
  decor: boolean;      // +6 satisfaction
  aircon: boolean;     // +4 satisfaction
  music: boolean;      // +5 satisfaction
}

export interface CafeLocation {
  id: string;
  name: string;
  city: string;
  street: string;
  capacity: number;
  stock: CafeLocationStock;
  status: 'open' | 'needs-restock' | 'no-employee' | 'building';
  purchasePrice: number;
  hasEmployee: boolean;
  employeeSalary: number;
  upgrades: CafeLocationUpgrades;
  buildReadyAt?: number;
}

const MOROCCAN_CITIES = [
  { name: 'Casablanca', tier: 3 }, { name: 'Rabat', tier: 3 }, { name: 'Marrakech', tier: 3 },
  { name: 'Fès', tier: 2 }, { name: 'Tanger', tier: 2 }, { name: 'Oujda', tier: 2 }, { name: 'Agadir', tier: 2 },
  { name: 'Meknès', tier: 1 }, { name: 'Kénitra', tier: 1 }, { name: 'Tétouan', tier: 1 },
  { name: 'Nador', tier: 1 }, { name: 'Safi', tier: 1 }, { name: 'El Jadida', tier: 1 }, { name: 'Béni Mellal', tier: 1 },
];

const MOROCCAN_STREETS = [
  'Bd Mohammed V', 'Rue Hassan II', 'Av. des FAR', 'Bd Zerktouni',
  'Rue Allal Ben Abdellah', 'Av. Mohammed VI', 'Bd Anfa', 'Rue Tarik Ibn Ziad',
  'Bd de la Corniche', 'Rue Abdelkrim El Khattabi', 'Av. Moulay Ismail', 'Bd Bir Anzarane',
  'Rue Oqba Ibn Nafiaa', 'Av. Lalla Yacout', 'Bd de la Résistance', 'Rue Ibnou Sina',
  'Av. Prince Moulay Abdellah', 'Bd Rachidi', 'Rue Ghandi', 'Bd Al Massira',
  'Rue Palestine', 'Av. Mers Sultan', 'Bd de Paris', 'Rue Jaber Ibn Hayane',
];

export function generateCafeMarketplace(ownedLocations: string[] = []): Array<{
  id: string; city: string; street: string; price: number; capacity: number;
}> {
  const listings: Array<{ id: string; city: string; street: string; price: number; capacity: number }> = [];
  const usedCombos = new Set(ownedLocations);
  let attempts = 0;
  while (listings.length < 6 && attempts < 50) {
    attempts++;
    const city = MOROCCAN_CITIES[Math.floor(Math.random() * MOROCCAN_CITIES.length)];
    const street = MOROCCAN_STREETS[Math.floor(Math.random() * MOROCCAN_STREETS.length)];
    const combo = `${street}, ${city.name}`;
    if (usedCombos.has(combo)) continue;
    usedCombos.add(combo);
    const basePrice = city.tier === 3 ? 15000 : city.tier === 2 ? 8000 : 4000;
    const price = basePrice + Math.floor(Math.random() * basePrice * 0.5);
    const baseCap = city.tier === 3 ? 35 : city.tier === 2 ? 22 : 12;
    const capacity = baseCap + Math.floor(Math.random() * 15);
    listings.push({ id: randomId(), city: city.name, street, price, capacity });
  }
  return listings;
}

export interface CafeChainUpgrades {
  hasHQ: boolean;
  hqBuildReadyAt?: number;
  premiumBeans: boolean;
  website: boolean;
  loyaltyProgram: boolean;
  training: boolean;
  menuTier: number;
}

export interface CafeState {
  locations: CafeLocation[];
  menu: CafeMenuItem[];
  satisfaction: number;
  upgrades: CafeChainUpgrades;
}

export function getCafeBuildTime(locationIndex: number): number {
  const times = [0, 60, 120, 300, 600, 900, 1200, 1800, 2400, 3600];
  const idx = Math.min(locationIndex, times.length - 1);
  return (idx < times.length ? times[idx] : 3600) * 1000;
}

export const DEFAULT_CAFE_MENU: CafeMenuItem[] = [
  { id: 'espresso', name: 'Espresso', basePrice: 30, currentPrice: 30 },
  { id: 'latte', name: 'Latte', basePrice: 50, currentPrice: 50 },
  { id: 'cappuccino', name: 'Cappuccino', basePrice: 45, currentPrice: 45 },
  { id: 'tea', name: 'Tea', basePrice: 25, currentPrice: 25 },
  { id: 'pastry', name: 'Pastry', basePrice: 35, currentPrice: 35 },
];

// ===== AGENCY TYPES =====

export interface EmployeeSkills {
  code: number;
  design: number;
  management: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  skills: EmployeeSkills;
  salary: number; // per hour
  busy: boolean;
  projectId?: string;
}

export interface ProjectRequirements {
  code: number;
  design: number;
  management: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requirements: ProjectRequirements;
  payout: number;
  durationMs: number; // real-time duration in ms
  startedAt?: number; // timestamp when started
  progress: number; // 0-100
  assignedEmployees: string[];
  accepted: boolean;
}

export interface RecruitmentSearch {
  id: string;
  cost: number;
  startedAt: number;
  readyAt: number; // timestamp
  candidates: Employee[];
  completed: boolean;
}

export interface AgencyState {
  employees: Employee[];
  maxSlots: number;
  projects: Project[];
  availableProjects: Project[];
  completedProjects: Project[];
  completedCount: number;
  totalEarned: number;
  totalSalaryPaid: number;
  recruitmentSearches: RecruitmentSearch[];
}

// ===== REAL ESTATE TYPES =====

export interface PropertyUpgrade {
  id: string;
  name: string;
  icon: string;
  cost: number;
  installed: boolean;
  installing: boolean;
  installReadyAt?: number;
  valueBoost: number; // percentage boost to property value
  rentBoost: number; // percentage boost to rental income
}

export interface Property {
  id: string;
  name: string;
  city: string;
  street: string;
  type: 'Apartment' | 'Villa' | 'Riad' | 'Commercial';
  imageStyle: 'modern' | 'riad' | 'beach' | 'desert' | 'commercial';
  purchasePrice: number;
  currentValue: number;
  status: 'vacant' | 'rented' | 'for-sale';
  rentalIncome: number;
  upgrades: PropertyUpgrade[];
}

export interface RealEstateState {
  properties: Property[];
  marketListings: Property[];
  lastMarketRefresh: number;
}

// ===== OTHER BUSINESS TYPES =====

export interface EcomProduct {
  id: string; name: string; stock: number; maxStock: number;
  restockCost: number; sellingPrice: number;
}
export interface EcomOrder {
  id: string; productId: string; productName: string; quantity: number;
  customer: string; payout: number; deadline: number; fulfilled: boolean;
}
export interface EcomState {
  products: EcomProduct[];
  orders: EcomOrder[];
  reputation: number;
  shippingTier: number;
  warehouseLevel: number;
  autoFulfill: boolean;
}
export interface CryptoCoin {
  id: string; name: string; symbol: string; price: number;
  history: number[]; volatility: number;
}
export interface CryptoHolding {
  coinId: string; amount: number; avgBuyPrice: number;
}
export interface CryptoState {
  coins: CryptoCoin[];
  holdings: CryptoHolding[];
  tradeHistory: { coinId: string; type: 'buy' | 'sell'; amount: number; price: number; time: number }[];
  advancedAnalytics: boolean;
  lastCryptoTick: number;
}
export interface BankClient {
  id: string; name: string; deposit: number; interestRate: number;
}
export interface BankState {
  deposited: number;
  upgradeLevel: number;
  clients: BankClient[];
  maxClients: number;
}

// ===== HIGHWAY TYPES =====
export interface HighwayCity {
  id: string; name: string; x: number; y: number; tier: number;
}
export interface HighwayRoute {
  id: string; cityA: string; cityB: string;
  built: boolean; building: boolean;
  buildStartedAt?: number; buildReadyAt?: number;
  buildCost: number; lanes: number;
  tollPrice: number; baseTraffic: number; distance: number;
}
export interface HighwayState {
  routes: HighwayRoute[];
  totalRevenue: number;
}

// ===== SUPERMARKET TYPES =====
export interface SupermarketProduct {
  id: string; name: string; emoji: string; category: string;
  wholesalePrice: number; retailPrice: number;
  stock: number; maxStock: number; salesRate: number;
}
export interface SupermarketState {
  products: SupermarketProduct[];
  cashiers: number; maxCashiers: number; cashierSalary: number;
  storeLevel: number; totalRevenue: number; totalCost: number;
}

// ===== STREAMING TYPES =====
export type StreamingCategory = 'music' | 'gaming' | 'films';
export interface StreamingContent {
  id: string; name: string; popularity: number; licenseCost: number;
}
export interface StreamingState {
  category: StreamingCategory;
  catalog: StreamingContent[];
  availableContent: StreamingContent[];
  subscribers: number;
  subscriptionPrice: number;
  serverLevel: number;
  serverCostPerHour: number;
  maxSubscribers: number;
  totalRevenue: number;
  recommendationEngine: boolean;
  adNetwork: boolean;
}

// ===== SECURITY TYPES =====
export interface SecurityAgent {
  id: string; name: string; combat: number; surveillance: number; driving: number; salary: number;
}
export interface SecurityUnit {
  id: string; name: string; agentIds: string[];
  missionId?: string; busyUntil?: number;
}
export interface SecurityMission {
  id: string; celebrity: string; event: string;
  requiredScore: number; payout: number; durationMs: number;
  accepted: boolean; unitIds: string[]; startedAt?: number;
}
export interface SecurityEquipment {
  id: string; name: string; icon: string; cost: number; owned: boolean; scoreBoost: number;
}
export interface SecurityState {
  agents: SecurityAgent[];
  maxAgents: number;
  units: SecurityUnit[];
  activeMissions: SecurityMission[];
  availableMissions: SecurityMission[];
  completedMissions: SecurityMission[];
  equipment: SecurityEquipment[];
  completedCount: number;
  totalEarned: number;
}

// ===== OIL TYPES =====
export interface DrillingSite {
  id: string; name: string;
  built: boolean; building: boolean;
  buildStartedAt?: number; buildReadyAt?: number;
  machines: number; maxMachines: number;
  productionRate: number; // bbl per hour per machine
}
export interface OilState {
  drillingSites: DrillingSite[];
  oilStored: number;
  storageCapacity: number;
  storageUpgradeCost: number;
  oilSellPrice: number;
  machineCost: number;
  nextSiteCost: number;
  totalRevenue: number;
}

// ===== PRODUCTION TYPES =====
export type ProductionType = 'gold_mine' | 'wheat_farm' | 'lumber_camp' | 'iron_mine' | 'cotton_farm' | 'quarry';
export type ResourceType = 'gold' | 'wheat' | 'wood' | 'iron' | 'cotton' | 'stone';

export interface ProductionUpgrades {
  autoExportTargetId?: string; // factory biz id to auto-send to
  efficiency: number;   // 0-3, each +25% production rate
  workerCapacity: number; // 0-3, each +5 max workers
  harvestTech: number;  // 0-3, each -15% worker salary
}

export interface ProductionState {
  productionType: ProductionType;
  resourceType: ResourceType;
  stored: number;
  storageCapacity: number;
  workers: number;
  maxWorkers: number;
  workerSalary: number;
  productionRate: number;
  rawSellPrice: number;
  upgradeLevel: number;
  upgrades: ProductionUpgrades;
}

// ===== FACTORY TYPES =====
export type FactoryType = 'bakery' | 'sawmill' | 'jewelry_workshop' | 'steelworks' | 'textile_mill' | 'masonry';

export interface FactoryUpgrades {
  efficiency: number;   // 0-3, each +25% conversion rate
  workerCapacity: number; // 0-3, each +5 max workers
  automation: number;   // 0-3, each -15% worker salary
  qualityControl: number; // 0-3, each +20% sell price
  autoSell: boolean;    // auto-sell output when full
}

export interface FactoryState {
  factoryType: FactoryType;
  inputResource: ResourceType;
  outputName: string;
  inputStored: number;
  outputStored: number;
  inputCapacity: number;
  outputCapacity: number;
  conversionRate: number;
  sellPrice: number;
  workers: number;
  maxWorkers: number;
  workerSalary: number;
  upgradeLevel: number;
  totalRevenue: number;
  upgrades: FactoryUpgrades;
}

// ===== CASINO TYPES =====
export interface CasinoTableOwned { type: string; count: number; }
export interface CasinoUpgrades { security: boolean; vipLounge: boolean; freeBar: boolean; loyalty: boolean; }
export interface CasinoState {
  tables: CasinoTableOwned[];
  dealers: number;
  maxDealers: number;
  dealerSalary: number;
  totalRevenue: number;
  upgrades: CasinoUpgrades;
}

export const CASINO_TABLE_TYPES = [
  { type: 'slots', name: 'Slot Machines', icon: '🎰', cost: 15000, revenuePerH: 800, needsDealer: false },
  { type: 'blackjack', name: 'Blackjack', icon: '🃏', cost: 40000, revenuePerH: 2500, needsDealer: true },
  { type: 'poker', name: 'Poker', icon: '♠️', cost: 60000, revenuePerH: 4000, needsDealer: true },
  { type: 'roulette', name: 'Roulette', icon: '🎡', cost: 80000, revenuePerH: 3500, needsDealer: true },
  { type: 'baccarat', name: 'Baccarat VIP', icon: '💎', cost: 120000, revenuePerH: 8000, needsDealer: true },
];

// ===== NIGHT CLUB TYPES =====
export interface NightClubDJ { id: string; name: string; quality: number; salary: number; }
export interface NightClubUpgrades { soundSystem: boolean; lighting: boolean; smokeMachine: boolean; rooftop: boolean; }
export interface NightClubState {
  capacity: number;
  entryFee: number;
  bartenders: number;
  bartenderSalary: number;
  djs: NightClubDJ[];
  drinkStock: number;
  drinkPrice: number;
  totalRevenue: number;
  upgrades: NightClubUpgrades;
}

export const NIGHTCLUB_DJ_POOL = [
  'DJ Maroc', 'DJ Neon', 'DJ Pulse', 'DJ Sahara', 'DJ Midnight',
  'DJ Crystal', 'DJ Eclipse', 'DJ Nova', 'DJ Atlas', 'DJ Vibe',
];

// ===== AIRLINE TYPES =====
export interface AirlinePlane {
  id: string;
  type: string;
  name: string;
  capacity: number;
  speed: number;
  fuelPerKm: number;
  maintenancePerH: number;
  routeId?: string;
}

export interface AirlineRoute {
  id: string;
  cityAId: string;
  cityBId: string;
  distance: number;
  demand: number;
  ticketPrice: number;
}

export interface AirlineState {
  planes: AirlinePlane[];
  routes: AirlineRoute[];
  totalRevenue: number;
  totalCosts: number;
  loungeLevel: number;
  fuelEfficiency: boolean;
  frequentFlyer: boolean;
}

// ===== ISLAND TYPES =====
export interface IslandBuilding {
  id: string;
  type: string;
  name: string;
  icon: string;
  cost: number;
  built: boolean;
  building: boolean;
  buildReadyAt?: number;
  incomePerHour: number;
}

export interface OwnedIsland {
  id: string;
  customName: string;
  purchasePrice: number;
  buildings: IslandBuilding[];
}

// ===== HQ TYPES =====
export interface HQState {
  built: boolean;
  building: boolean;
  buildReadyAt?: number;
  level: number;
  upgrades: {
    maxBusinesses: number;
    incomeBoost: number;
    tapBoost: number;
    offlineHours: number;
  };
}

export const HQ_COST = 500000;
export const HQ_BUILD_TIME = 300000; // 5 min

export const HQ_UPGRADE_DEFS = [
  { key: 'maxBusinesses', name: '🏢 Business Slots', desc: '+5 max businesses per level', maxLevel: 8, costs: [100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000, 25000000] },
  { key: 'incomeBoost', name: '💰 Income Boost', desc: '+10% passive income per level', maxLevel: 5, costs: [200000, 500000, 1500000, 5000000, 15000000] },
  { key: 'tapBoost', name: '👆 Tap Boost', desc: '+25% tap power per level', maxLevel: 5, costs: [50000, 150000, 400000, 1000000, 3000000] },
  { key: 'offlineHours', name: '💤 Offline Time', desc: '+2h max offline earnings per level', maxLevel: 4, costs: [300000, 800000, 2000000, 6000000] },
];

export const ISLAND_BUILDING_DEFS = [
  { type: 'villa', name: 'Beach Villa', icon: '🏡', baseCost: 200000, incomePerHour: 500, buildTime: 300000 },
  { type: 'resort', name: 'Luxury Resort', icon: '🏨', baseCost: 1000000, incomePerHour: 3000, buildTime: 600000 },
  { type: 'helipad', name: 'Helipad', icon: '🚁', baseCost: 500000, incomePerHour: 0, buildTime: 180000 },
  { type: 'dock', name: 'Private Dock', icon: '⛵', baseCost: 300000, incomePerHour: 800, buildTime: 240000 },
  { type: 'garden', name: 'Tropical Garden', icon: '🌴', baseCost: 150000, incomePerHour: 200, buildTime: 120000 },
  { type: 'casino', name: 'Private Casino', icon: '🎰', baseCost: 5000000, incomePerHour: 15000, buildTime: 900000 },
];

export interface BusinessInstance {
  id: string;
  type: 'cafe' | 'agency' | 'realestate' | 'ecommerce' | 'crypto' | 'bank' | 'highway' | 'supermarket' | 'streaming' | 'security' | 'oil' | 'production' | 'factory' | 'airline' | 'casino' | 'nightclub';
  name: string;
  cafeState?: CafeState;
  agencyState?: AgencyState;
  realEstateState?: RealEstateState;
  ecomState?: EcomState;
  cryptoState?: CryptoState;
  bankState?: BankState;
  highwayState?: HighwayState;
  supermarketState?: SupermarketState;
  streamingState?: StreamingState;
  securityState?: SecurityState;
  oilState?: OilState;
  productionState?: ProductionState;
  factoryState?: FactoryState;
  airlineState?: AirlineState;
  casinoState?: CasinoState;
  nightClubState?: NightClubState;
}

// ===== MARKET EVENT TYPES =====
export type MarketEventType = 'oil_crash' | 'oil_boom' | 'tourist_boom' | 'tourist_slump' | 'crypto_bull' | 'crypto_bear' | 'real_estate_boom' | 'labor_strike' | 'tech_boom' | 'economic_boom';

export interface MarketEvent {
  id: string;
  type: MarketEventType;
  name: string;
  description: string;
  icon: string;
  affectedBizTypes: BusinessInstance['type'][];
  modifier: number; // multiplier: 1.5 = +50%, 0.7 = -30%
  startedAt: number;
  endsAt: number;
}

export const MARKET_EVENT_DEFINITIONS: Array<{
  type: MarketEventType;
  name: string;
  description: string;
  icon: string;
  affectedBizTypes: BusinessInstance['type'][];
  modifierRange: [number, number];
  durationMinutes: [number, number];
}> = [
  { type: 'oil_boom', name: 'Oil Price Surge', description: 'Global oil demand spikes!', icon: '🛢️📈', affectedBizTypes: ['oil'], modifierRange: [1.3, 1.6], durationMinutes: [2, 5] },
  { type: 'oil_crash', name: 'Oil Price Crash', description: 'Oil prices plummet...', icon: '🛢️📉', affectedBizTypes: ['oil'], modifierRange: [0.5, 0.7], durationMinutes: [2, 4] },
  { type: 'tourist_boom', name: 'Tourist Season', description: 'Tourists flood Morocco!', icon: '🏖️✨', affectedBizTypes: ['cafe', 'realestate', 'nightclub', 'casino'], modifierRange: [1.3, 1.5], durationMinutes: [3, 5] },
  { type: 'tourist_slump', name: 'Tourism Slump', description: 'Fewer visitors this season', icon: '🏖️💤', affectedBizTypes: ['cafe', 'realestate', 'nightclub', 'casino'], modifierRange: [0.6, 0.8], durationMinutes: [2, 4] },
  { type: 'crypto_bull', name: 'Crypto Bull Run', description: 'Coins are mooning! 🚀', icon: '📈🚀', affectedBizTypes: ['crypto'], modifierRange: [1.4, 1.8], durationMinutes: [1, 3] },
  { type: 'crypto_bear', name: 'Crypto Winter', description: 'Markets are bleeding...', icon: '📉❄️', affectedBizTypes: ['crypto'], modifierRange: [0.4, 0.7], durationMinutes: [2, 4] },
  { type: 'real_estate_boom', name: 'Property Boom', description: 'Real estate values soar!', icon: '🏠📈', affectedBizTypes: ['realestate'], modifierRange: [1.3, 1.5], durationMinutes: [3, 5] },
  { type: 'labor_strike', name: 'Labor Strike', description: 'Workers demand better wages', icon: '✊🏗️', affectedBizTypes: ['factory', 'production', 'supermarket'], modifierRange: [0.5, 0.7], durationMinutes: [1, 3] },
  { type: 'tech_boom', name: 'Tech Investment Wave', description: 'Investors love tech!', icon: '💻🔥', affectedBizTypes: ['agency', 'streaming', 'ecommerce'], modifierRange: [1.3, 1.6], durationMinutes: [2, 4] },
  { type: 'economic_boom', name: 'Economic Boom', description: 'The economy is thriving!', icon: '💰🎉', affectedBizTypes: ['cafe', 'supermarket', 'ecommerce', 'nightclub', 'casino', 'airline'], modifierRange: [1.2, 1.4], durationMinutes: [3, 5] },
];

export function generateMarketEvent(): MarketEvent {
  const def = MARKET_EVENT_DEFINITIONS[Math.floor(Math.random() * MARKET_EVENT_DEFINITIONS.length)];
  const modifier = def.modifierRange[0] + Math.random() * (def.modifierRange[1] - def.modifierRange[0]);
  const durationMs = (def.durationMinutes[0] + Math.random() * (def.durationMinutes[1] - def.durationMinutes[0])) * 60 * 1000;
  const now = Date.now();
  return {
    id: randomId(),
    type: def.type,
    name: def.name,
    description: def.description,
    icon: def.icon,
    affectedBizTypes: def.affectedBizTypes,
    modifier: Math.round(modifier * 100) / 100,
    startedAt: now,
    endsAt: now + durationMs,
  };
}

export function getEventModifierForBiz(events: MarketEvent[], bizType: BusinessInstance['type']): number {
  let mult = 1;
  for (const e of events) {
    if (e.affectedBizTypes.includes(bizType)) {
      mult *= e.modifier;
    }
  }
  return mult;
}

// ===== SOCIAL STATE (imported from SocialData) =====
export interface SocialState {
  millionaires: Array<{
    id: string;
    name: string;
    image: string;
    netWorth: number;
    relationship: number;
    isFriend: boolean;
    industry: string;
    personality: 'humble' | 'arrogant' | 'eccentric' | 'friendly';
  }>;
  stocks: Array<{
    companyId: string;
    currentPrice: number;
    priceHistory: number[];
  }>;
  holdings: Array<{
    companyId: string;
    shares: number;
    avgBuyPrice: number;
  }>;
  lastStockTick: number;
  actionCooldowns: { [millionaireId: string]: { [actionId: string]: number } };
}

export interface GameState {
  cash: number;
  totalEarned: number;
  tapPower: number;
  tapUpgradeLevel: number;
  cashPerSec: number;
  businesses: BusinessInstance[];
  ownedAssets: string[];
  ownedIslands: OwnedIsland[];
  hq?: HQState;
  lastSave: number;
  lastTick: number;
  lastIncomePayout: number;
  gameStarted: number;
  // Market events
  activeEvents: MarketEvent[];
  lastEventCheck: number;
  // Social
  socialState?: SocialState;
}

export function getMaxBusinesses(state: GameState): number {
  return 10 + (state.hq?.upgrades.maxBusinesses || 0) * 5;
}

// Type-based random names for production and factory
export const PRODUCTION_NAMES: Record<string, string[]> = {
  gold_mine: ['Eldorado Mining', 'Golden Vein Co', 'Nugget Creek', 'Aurelia Mines', 'Crown Gold', 'Atlas Goldworks'],
  wheat_farm: ['Golden Fields', 'Harvest Valley', 'Sunlit Acres', 'Grain & Glory', 'Prairie Gold', 'Fertile Crescent'],
  lumber_camp: ['Timber Ridge', 'Oakwood Logging', 'Cedar Valley', 'Ironbark Co', 'Forest Giant', 'Pine Peak Lumber'],
  iron_mine: ['Ironclad Mining', 'Magnetite Corp', 'Steel Vein', 'Deep Core Mining', 'Anvil Rock', 'Ferrous Peak'],
  cotton_farm: ['White Gold Fields', 'Cotton Crown', 'Silk Route Farms', 'Cloud Harvest', 'Blossom Fields', 'Thread & Seed'],
  quarry: ['Granite Peak', 'Stonehaven Quarry', 'Marble Ridge', 'Bedrock Co', 'Atlas Stone', 'Canyon Cut'],
};

export const FACTORY_NAMES: Record<string, string[]> = {
  bakery: ['Royal Bakery', 'Golden Crust', 'Artisan Bread Co', 'Daily Loaf', 'Flour & Fire', 'Crumb & Co'],
  sawmill: ['Plankworks', 'Cedar Mill', 'Timber Transform', 'Board & Beam', 'Precision Cut', 'Atlas Lumber Mill'],
  jewelry_workshop: ['Crown Jewels', 'Gem & Gold Studio', 'Brilliance Workshop', 'Artisan Gems', 'Velvet & Stone', 'Luxe Craft'],
  steelworks: ['Iron Forge', 'Steel Crown', 'Titan Steelworks', 'Alloy Masters', 'Furnace & Anvil', 'Apex Steel'],
  textile_mill: ['Silk & Thread', 'Loom Works', 'Fabric Crown', 'Weave & Spin', 'Cotton Cloud Mill', 'Atlas Textiles'],
  masonry: ['Brick & Mortar Co', 'Stone Craft', 'Foundation Works', 'Mason\'s Pride', 'Block & Build', 'Arch & Stone'],
};

export const BUSINESS_TYPES = [
  { type: 'cafe' as const, icon: '☕', name: 'Café Chain', cost: 15000, desc: 'Manage locations, stock ingredients, serve customers', color: '25 95% 53%' },
  { type: 'supermarket' as const, icon: '🛒', name: 'Neighborhood Store', cost: 25000, desc: 'Stock products, set prices, hire cashiers', color: '150 60% 45%' },
  { type: 'ecommerce' as const, icon: '📦', name: 'E-Commerce Store', cost: 40000, desc: 'Fulfill orders, manage inventory, build reputation', color: '280 70% 55%' },
  { type: 'production' as const, icon: '⛏️', name: 'Production Company', cost: 50000, desc: 'Mine gold, grow wheat, chop wood — produce raw resources', color: '35 70% 45%' },
  { type: 'crypto' as const, icon: '📈', name: 'Crypto Trading Desk', cost: 75000, desc: 'Trade volatile crypto coins for profit', color: '45 100% 50%' },
  { type: 'factory' as const, icon: '🏭', name: 'Factory', cost: 80000, desc: 'Transform raw resources into expensive finished goods', color: '200 50% 45%' },
  { type: 'realestate' as const, icon: '🏠', name: 'Real Estate', cost: 100000, desc: 'Buy, upgrade, rent or flip properties across Morocco', color: '142 71% 45%' },
  { type: 'agency' as const, icon: '💻', name: 'Programming Agency', cost: 150000, desc: 'Hire devs, complete client projects for big payouts', color: '210 100% 50%' },
  { type: 'security' as const, icon: '🛡️', name: 'Security Company', cost: 200000, desc: 'Hire agents, form units, protect VIP events', color: '30 80% 50%' },
  { type: 'streaming' as const, icon: '🎬', name: 'Streaming Platform', cost: 250000, desc: 'License content, grow subscribers, earn recurring revenue', color: '340 80% 55%' },
  { type: 'airline' as const, icon: '✈️', name: 'Airline Company', cost: 500000, desc: 'Buy planes, open routes, fly passengers worldwide', color: '210 90% 55%' },
  { type: 'casino' as const, icon: '🎰', name: 'Casino', cost: 500000, desc: 'Buy gaming tables, hire dealers, rake in the house edge', color: '280 70% 50%' },
  { type: 'nightclub' as const, icon: '🪩', name: 'Night Club', cost: 350000, desc: 'Hire DJs, stock the bar, host legendary nights', color: '310 80% 50%' },
  { type: 'highway' as const, icon: '🛣️', name: 'Highway Company', cost: 2000000, desc: 'Build highways between Moroccan cities, collect tolls', color: '200 70% 45%' },
  { type: 'bank' as const, icon: '🏦', name: 'Private Bank', cost: 5000000, desc: 'Park capital, earn compound interest, serve clients', color: '220 70% 50%' },
  { type: 'oil' as const, icon: '🛢️', name: 'Oil & Petroleum Corp', cost: 25000000, desc: 'Build drilling sites, extract oil, sell for millions', color: '15 70% 40%' },
];

// Hustle capped at ~400/tap to help bootstrap first few businesses (~30-40K)
export const TAP_POWERS = [2, 5, 12, 25, 50, 100, 200, 350, 500];
export const TAP_UPGRADE_COSTS = [0, 20, 80, 250, 800, 2500, 8000, 20000, 40000];

const FIRST_NAMES = ['Alex','Jordan','Sam','Casey','Morgan','Riley','Taylor','Quinn','Avery','Blake','Youssef','Amine','Karim','Nadia','Fatima','Omar','Sara','Hamza','Layla','Mehdi'];
const LAST_NAMES = ['Smith','Lee','Park','Chen','Davis','Kim','Brown','Garcia','Wilson','Moore','Benali','Tazi','Alaoui','Berrada','El Amrani','Fassi','Idrissi'];
const CUSTOMER_NAMES = ['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Henry','Iris','Jack'];
const PRODUCT_NAMES = ['Wireless Earbuds','Phone Case','USB Cable','Desk Lamp','Notebook'];
const CRYPTO_COINS: CryptoCoin[] = [
  { id: 'btg', name: 'BitGold', symbol: 'BTG', price: 1000, history: [], volatility: 0.03 },
  { id: 'eth', name: 'EtherMoon', symbol: 'ETM', price: 500, history: [], volatility: 0.04 },
  { id: 'dgf', name: 'DogeFi', symbol: 'DGF', price: 50, history: [], volatility: 0.06 },
  { id: 'stx', name: 'StableX', symbol: 'STX', price: 100, history: [], volatility: 0.005 },
  { id: 'nvc', name: 'NovaCoin', symbol: 'NVC', price: 200, history: [], volatility: 0.1 },
];
const CLIENT_NAMES = ['Rothschild Trust','Al-Fayed Group','Nakamura Holdings','Van der Berg Capital','Wellington Fund'];
const BANK_UPGRADE_NAMES = [
  'Basic Savings Vault','Investment Portfolio','Derivatives Desk',
  'Offshore Division','Central Bank License','Global Reserve Status'
];
const BANK_UPGRADE_COSTS = [0, 100000, 500000, 2000000, 10000000, 50000000];
const BANK_INTEREST_RATES = [0.02, 0.04, 0.04, 0.04, 0.08, 0.15];

export { BANK_UPGRADE_NAMES, BANK_UPGRADE_COSTS, BANK_INTEREST_RATES };

// ===== AGENCY PROJECT GENERATION =====

const AGENCY_CLIENT_NAMES = [
  'TechVentures', 'GreenLeaf Co.', 'Beldi Fusion', 'Atlas Digital', 'Maroc Solutions',
  'NovaTech', 'Sahara Logistics', 'OceanView Hotels', 'MedConnect', 'EduSpark',
  'CloudNine Labs', 'UrbanBite', 'FitPulse', 'ArtisanHub', 'PayStream',
  'DataForge', 'SmartCity Inc.', 'CraftBrew Co.', 'TravelMate', 'FinEdge',
];

const AGENCY_PROJECT_TEMPLATES = [
  { template: 'E-commerce platform for {client}', codeW: 3, designW: 2, mgmtW: 1 },
  { template: 'Corporate website for {client}', codeW: 2, designW: 3, mgmtW: 1 },
  { template: 'Mobile app for {client}', codeW: 4, designW: 2, mgmtW: 1 },
  { template: 'CRM system for {client}', codeW: 4, designW: 1, mgmtW: 2 },
  { template: 'Dashboard & analytics for {client}', codeW: 3, designW: 2, mgmtW: 2 },
  { template: 'Booking platform for {client}', codeW: 3, designW: 2, mgmtW: 2 },
  { template: 'Social media app for {client}', codeW: 3, designW: 3, mgmtW: 1 },
  { template: 'API & backend for {client}', codeW: 5, designW: 0, mgmtW: 2 },
  { template: 'Landing page redesign for {client}', codeW: 1, designW: 4, mgmtW: 1 },
  { template: 'Inventory management system for {client}', codeW: 3, designW: 1, mgmtW: 3 },
  { template: 'Payment gateway integration for {client}', codeW: 4, designW: 1, mgmtW: 2 },
  { template: 'Real-time chat system for {client}', codeW: 4, designW: 2, mgmtW: 1 },
  { template: 'HR portal for {client}', codeW: 2, designW: 2, mgmtW: 3 },
  { template: 'IoT monitoring dashboard for {client}', codeW: 4, designW: 2, mgmtW: 2 },
  { template: 'Food delivery app for {client}', codeW: 3, designW: 3, mgmtW: 2 },
];

const AGENCY_ROLES = [
  { role: 'Junior Developer', codeBase: [2, 4], designBase: [0, 1], mgmtBase: [0, 1], salaryBase: [15, 25] },
  { role: 'Senior Developer', codeBase: [4, 7], designBase: [0, 2], mgmtBase: [1, 3], salaryBase: [35, 55] },
  { role: 'Full-Stack Dev', codeBase: [3, 6], designBase: [1, 3], mgmtBase: [1, 2], salaryBase: [30, 50] },
  { role: 'UI/UX Designer', codeBase: [0, 2], designBase: [4, 7], mgmtBase: [0, 2], salaryBase: [25, 45] },
  { role: 'Product Manager', codeBase: [0, 1], designBase: [1, 3], mgmtBase: [4, 7], salaryBase: [30, 50] },
  { role: 'Tech Lead', codeBase: [3, 5], designBase: [1, 2], mgmtBase: [3, 6], salaryBase: [45, 70] },
  { role: 'DevOps Engineer', codeBase: [3, 5], designBase: [0, 1], mgmtBase: [2, 4], salaryBase: [35, 55] },
  { role: 'Intern', codeBase: [1, 2], designBase: [0, 1], mgmtBase: [0, 1], salaryBase: [5, 12] },
];

function randRange(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function randName(): string {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + ' ' +
    LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
}

export function generateAgencyProject(): Project {
  const tmpl = AGENCY_PROJECT_TEMPLATES[Math.floor(Math.random() * AGENCY_PROJECT_TEMPLATES.length)];
  const client = AGENCY_CLIENT_NAMES[Math.floor(Math.random() * AGENCY_CLIENT_NAMES.length)];
  const name = tmpl.template.replace('{client}', client);
  
  const scale = 1 + Math.random() * 4;
  const code = Math.round(tmpl.codeW * scale);
  const design = Math.round(tmpl.designW * scale);
  const management = Math.round(tmpl.mgmtW * scale);
  const totalReq = code + design + management;
  
  const minDuration = 30 * 60 * 1000;
  const maxDuration = 30 * 60 * 60 * 1000;
  const durationMs = minDuration + Math.floor(Math.random() * (maxDuration - minDuration));
  
  const durationHours = durationMs / (60 * 60 * 1000);
  const basePay = totalReq * 3000 + durationHours * 1200;
  const payout = Math.round(basePay * (0.8 + Math.random() * 0.8));
  
  const descriptions = [
    `Build a complete ${tmpl.template.split(' for ')[0].toLowerCase()} solution`,
    `Full development cycle from design to deployment`,
    `End-to-end project with client collaboration`,
  ];
  
  return {
    id: randomId(),
    name,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    requirements: { code, design, management },
    payout,
    durationMs,
    progress: 0,
    assignedEmployees: [],
    accepted: false,
  };
}

export function generateAgencyProjects(): Project[] {
  return Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => generateAgencyProject());
}

export function generateAgencyCandidate(): Employee {
  const roleInfo = AGENCY_ROLES[Math.floor(Math.random() * AGENCY_ROLES.length)];
  return {
    id: randomId(),
    name: randName(),
    role: roleInfo.role,
    skills: {
      code: randRange(roleInfo.codeBase[0], roleInfo.codeBase[1]),
      design: randRange(roleInfo.designBase[0], roleInfo.designBase[1]),
      management: randRange(roleInfo.mgmtBase[0], roleInfo.mgmtBase[1]),
    },
    salary: randRange(roleInfo.salaryBase[0], roleInfo.salaryBase[1]),
    busy: false,
  };
}

export function generateCandidates(): Employee[] {
  return Array.from({ length: 3 }, () => generateAgencyCandidate());
}

export function getRecruitmentCost(searchCount: number): number {
  return 2000 + searchCount * 1500;
}

export function getRecruitmentDuration(searchCount: number): number {
  return (120 + searchCount * 60) * 1000;
}

// ===== REAL ESTATE GENERATION =====

const RE_MOROCCAN_CITIES: Array<{ name: string; tier: number; imageStyle: Property['imageStyle'] }> = [
  { name: 'Casablanca', tier: 3, imageStyle: 'modern' },
  { name: 'Rabat', tier: 3, imageStyle: 'modern' },
  { name: 'Marrakech', tier: 3, imageStyle: 'riad' },
  { name: 'Fès', tier: 2, imageStyle: 'riad' },
  { name: 'Tanger', tier: 2, imageStyle: 'beach' },
  { name: 'Agadir', tier: 2, imageStyle: 'beach' },
  { name: 'Meknès', tier: 2, imageStyle: 'riad' },
  { name: 'Ouarzazate', tier: 1, imageStyle: 'desert' },
  { name: 'Errachidia', tier: 1, imageStyle: 'desert' },
  { name: 'Essaouira', tier: 1, imageStyle: 'beach' },
  { name: 'Kénitra', tier: 1, imageStyle: 'modern' },
  { name: 'Oujda', tier: 1, imageStyle: 'modern' },
  { name: 'Tétouan', tier: 1, imageStyle: 'beach' },
  { name: 'Nador', tier: 1, imageStyle: 'beach' },
];

const RE_STREETS = [
  'Bd Mohammed V', 'Rue Hassan II', 'Av. des FAR', 'Bd Zerktouni',
  'Rue Allal Ben Abdellah', 'Av. Mohammed VI', 'Bd Anfa', 'Rue Tarik Ibn Ziad',
  'Bd de la Corniche', 'Av. Moulay Ismail', 'Bd Bir Anzarane', 'Rue Ibnou Sina',
  'Av. Lalla Yacout', 'Bd de la Résistance', 'Rue Palestine', 'Bd Al Massira',
  'Derb Sidi Bouloukat', 'Rue Bab Agnaou', 'Av. Al Akhawayn', 'Bd Hassan I',
  'Rue Imam Malik', 'Av. Al Andalous', 'Bd Mohamed Diouri', 'Rue Oued Fès',
  'Av. Annakhil', 'Rue Atlas', 'Bd Yacoub El Mansour', 'Rue Beni Mellal',
  'Av. Moulay Rachid', 'Bd El Fida', 'Rue Taha Hussein', 'Av. Mekka',
];

const RE_PROPERTY_TYPES: Array<{ type: Property['type']; cities?: string[] }> = [
  { type: 'Apartment' },
  { type: 'Villa' },
  { type: 'Riad', cities: ['Marrakech', 'Fès', 'Meknès', 'Essaouira', 'Tétouan'] },
  { type: 'Commercial' },
];

function getPropertyImage(style: Property['imageStyle']): string {
  const map: Record<string, string> = {
    modern: '/properties/modern-apartment.jpg',
    riad: '/properties/riad.jpg',
    beach: '/properties/beach-villa.jpg',
    desert: '/properties/desert-house.jpg',
    commercial: '/properties/commercial.jpg',
  };
  return map[style] || map.modern;
}

export { getPropertyImage };

function createPropertyUpgrades(baseValue: number): PropertyUpgrade[] {
  const scale = baseValue / 10000;
  return [
    { id: 'wifi', name: 'Fiber WiFi', icon: '📶', cost: Math.round(500 * scale), installed: false, installing: false, valueBoost: 15, rentBoost: 25 },
    { id: 'parking', name: 'Private Parking', icon: '🅿️', cost: Math.round(800 * scale), installed: false, installing: false, valueBoost: 25, rentBoost: 30 },
    { id: 'aircon', name: 'Air Conditioning', icon: '❄️', cost: Math.round(600 * scale), installed: false, installing: false, valueBoost: 18, rentBoost: 22 },
    { id: 'security', name: '24/7 Security', icon: '🔒', cost: Math.round(1000 * scale), installed: false, installing: false, valueBoost: 30, rentBoost: 35 },
    { id: 'garden', name: 'Garden/Terrace', icon: '🌿', cost: Math.round(1200 * scale), installed: false, installing: false, valueBoost: 35, rentBoost: 25 },
    { id: 'pool', name: 'Swimming Pool', icon: '🏊', cost: Math.round(2000 * scale), installed: false, installing: false, valueBoost: 50, rentBoost: 45 },
  ];
}

export function generatePropertyListings(): Property[] {
  const listings: Property[] = [];
  const usedCombos = new Set<string>();
  let attempts = 0;

  while (listings.length < 12 && attempts < 100) {
    attempts++;
    const city = RE_MOROCCAN_CITIES[Math.floor(Math.random() * RE_MOROCCAN_CITIES.length)];
    const street = RE_STREETS[Math.floor(Math.random() * RE_STREETS.length)];
    const combo = `${street}, ${city.name}`;
    if (usedCombos.has(combo)) continue;
    usedCombos.add(combo);

    const validTypes = RE_PROPERTY_TYPES.filter(t => !t.cities || t.cities.includes(city.name));
    const propType = validTypes[Math.floor(Math.random() * validTypes.length)];

    const tierMult = city.tier === 3 ? 3 : city.tier === 2 ? 1.8 : 1;
    const typeMult = propType.type === 'Villa' ? 2.5 : propType.type === 'Riad' ? 2 : propType.type === 'Commercial' ? 1.8 : 1;
    const basePrice = 50000 + Math.random() * 50000;
    const price = Math.round(basePrice * tierMult * typeMult);

    const imageStyle = propType.type === 'Commercial' ? 'commercial' : city.imageStyle;
    const rentalIncome = Math.round(price * 0.003);

    listings.push({
      id: randomId(),
      name: `${street}, ${city.name}`,
      city: city.name,
      street,
      type: propType.type,
      imageStyle,
      purchasePrice: price,
      currentValue: price,
      status: 'vacant',
      rentalIncome,
      upgrades: createPropertyUpgrades(price),
    });
  }

  return listings;
}

// ===== CREATION =====

export function createInitialGameState(): GameState {
  const now = Date.now();
  return {
    cash: 0, totalEarned: 0, tapPower: 2, tapUpgradeLevel: 0,
    cashPerSec: 0, businesses: [], ownedAssets: [], ownedIslands: [], lastSave: now,
    lastTick: now, lastIncomePayout: now, gameStarted: now,
    activeEvents: [], lastEventCheck: now,
  };
}

export function createBusiness(type: BusinessInstance['type'], name: string, options?: { streamingCategory?: StreamingCategory; productionType?: string; factoryType?: string }): BusinessInstance {
  const id = randomId();
  const base: BusinessInstance = { id, type, name };
  switch (type) {
    case 'cafe':
      base.cafeState = {
        locations: [],
        menu: DEFAULT_CAFE_MENU.map(m => ({ ...m })),
        satisfaction: 50,
        upgrades: { hasHQ: false, premiumBeans: false, website: false, loyaltyProgram: false, training: false, menuTier: 0 },
      };
      break;
    case 'agency':
      base.agencyState = {
        employees: [
          { id: randomId(), name: randName(), role: 'Junior Developer', skills: { code: 3, design: 1, management: 0 }, salary: 18, busy: false },
          { id: randomId(), name: randName(), role: 'UI/UX Designer', skills: { code: 0, design: 3, management: 1 }, salary: 22, busy: false },
        ],
        maxSlots: 4,
        projects: [],
        availableProjects: generateAgencyProjects(),
        completedProjects: [],
        completedCount: 0,
        totalEarned: 0,
        totalSalaryPaid: 0,
        recruitmentSearches: [],
      };
      break;
    case 'realestate':
      base.realEstateState = {
        properties: [],
        marketListings: generatePropertyListings(),
        lastMarketRefresh: Date.now(),
      };
      break;
    case 'ecommerce':
      base.ecomState = {
        products: PRODUCT_NAMES.map((name, i) => ({
          id: randomId(), name, stock: 20, maxStock: 50,
          restockCost: 30 + i * 20, sellingPrice: 120 + i * 80,
        })),
        orders: [], reputation: 100, shippingTier: 0,
        warehouseLevel: 1, autoFulfill: false,
      };
      break;
    case 'crypto':
      base.cryptoState = {
        coins: CRYPTO_COINS.map(c => ({ ...c, history: Array.from({ length: 20 }, () => c.price * (1 + (Math.random() - 0.5) * c.volatility)) })),
        holdings: [], tradeHistory: [], advancedAnalytics: false, lastCryptoTick: Date.now(),
      };
      break;
    case 'bank':
      base.bankState = {
        deposited: 0, upgradeLevel: 0, clients: [], maxClients: 2,
      };
      break;
    case 'highway':
      base.highwayState = {
        routes: [],
        totalRevenue: 0,
      };
      break;
    case 'supermarket':
      base.supermarketState = {
        products: generateSupermarketProducts(),
        cashiers: 1, maxCashiers: 6, cashierSalary: 12,
        storeLevel: 1, totalRevenue: 0, totalCost: 0,
      };
      break;
    case 'streaming': {
      const cat = options?.streamingCategory || 'films';
      base.streamingState = {
        category: cat,
        catalog: [],
        availableContent: generateStreamingContent(cat),
        subscribers: 0,
        subscriptionPrice: 10,
        serverLevel: 1,
        serverCostPerHour: 50,
        maxSubscribers: 1000,
        totalRevenue: 0,
        recommendationEngine: false,
        adNetwork: false,
      };
      break;
    }
    case 'security':
      base.securityState = {
        agents: [],
        maxAgents: 6,
        units: [],
        activeMissions: [],
        availableMissions: generateSecurityMissions(),
        completedMissions: [],
        equipment: generateSecurityEquipment(),
        completedCount: 0,
        totalEarned: 0,
      };
      break;
    case 'oil': {
      const OIL_SITE_NAMES = ['Sahara Alpha', 'Atlas Bravo', 'Rif Charlie', 'Souss Delta', 'Draa Echo', 'Gharb Foxtrot'];
      base.oilState = {
        drillingSites: [],
        oilStored: 0,
        storageCapacity: 10000,
        storageUpgradeCost: 1000000,
        oilSellPrice: 10000, // $/bbl
        machineCost: 2000000,
        nextSiteCost: 5000000,
        totalRevenue: 0,
      };
      break;
    }
    case 'production': {
      const pType = (options?.productionType || 'wheat_farm') as ProductionType;
      const pInfo = PRODUCTION_TYPES.find(p => p.type === pType) || PRODUCTION_TYPES[0];
      base.productionState = {
        productionType: pInfo.type, resourceType: pInfo.resource,
        stored: 0, storageCapacity: 500, workers: 1, maxWorkers: 10,
        workerSalary: pInfo.workerSalary, productionRate: pInfo.baseRate,
        rawSellPrice: pInfo.rawSellPrice, upgradeLevel: 0,
        upgrades: { efficiency: 0, workerCapacity: 0, harvestTech: 0 },
      };
      break;
    }
    case 'factory': {
      const fType = (options?.factoryType || 'bakery') as FactoryType;
      const fInfo = FACTORY_TYPES.find(f => f.type === fType) || FACTORY_TYPES[0];
      base.factoryState = {
        factoryType: fInfo.type, inputResource: fInfo.inputResource,
        outputName: fInfo.outputName, inputStored: 0, outputStored: 0,
        inputCapacity: 500, outputCapacity: 500, conversionRate: fInfo.conversionRate,
        sellPrice: fInfo.sellPrice, workers: 1, maxWorkers: 10,
        workerSalary: fInfo.workerSalary, upgradeLevel: 0, totalRevenue: 0,
        upgrades: { efficiency: 0, workerCapacity: 0, automation: 0, qualityControl: 0, autoSell: false },
      };
      break;
    }
    case 'airline':
      base.airlineState = {
        planes: [], routes: [], totalRevenue: 0, totalCosts: 0,
        loungeLevel: 0, fuelEfficiency: false, frequentFlyer: false,
      };
      break;
    case 'casino':
      base.casinoState = {
        tables: [], dealers: 0, maxDealers: 20, dealerSalary: 40,
        totalRevenue: 0,
        upgrades: { security: false, vipLounge: false, freeBar: false, loyalty: false },
      };
      break;
    case 'nightclub':
      base.nightClubState = {
        capacity: 200, entryFee: 20, bartenders: 1, bartenderSalary: 25,
        djs: [], drinkStock: 100, drinkPrice: 10, totalRevenue: 0,
        upgrades: { soundSystem: false, lighting: false, smokeMachine: false, rooftop: false },
      };
      break;
  }
  return base;
}

export function generateEcomOrder(products: EcomProduct[]): EcomOrder {
  const p = products[Math.floor(Math.random() * products.length)];
  const qty = 1 + Math.floor(Math.random() * 3);
  return {
    id: randomId(), productId: p.id, productName: p.name,
    quantity: qty, customer: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    payout: p.sellingPrice * qty, deadline: 20 + Math.floor(Math.random() * 40),
    fulfilled: false,
  };
}

export function generateBankClient(): BankClient {
  return {
    id: randomId(),
    name: CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)],
    deposit: 50000 + Math.floor(Math.random() * 450000),
    interestRate: 0.01 + Math.random() * 0.02,
  };
}

// ===== HIGHWAY DATA =====
export const HIGHWAY_CITIES: HighwayCity[] = [
  { id: 'tanger', name: 'Tanger', x: 35, y: 8, tier: 3 },
  { id: 'tetouan', name: 'Tétouan', x: 42, y: 12, tier: 1 },
  { id: 'kenitra', name: 'Kénitra', x: 25, y: 22, tier: 1 },
  { id: 'rabat', name: 'Rabat', x: 22, y: 28, tier: 3 },
  { id: 'casablanca', name: 'Casablanca', x: 18, y: 36, tier: 3 },
  { id: 'eljadida', name: 'El Jadida', x: 14, y: 42, tier: 1 },
  { id: 'meknes', name: 'Meknès', x: 42, y: 28, tier: 2 },
  { id: 'fes', name: 'Fès', x: 50, y: 24, tier: 2 },
  { id: 'oujda', name: 'Oujda', x: 88, y: 18, tier: 2 },
  { id: 'benimellal', name: 'Béni Mellal', x: 45, y: 42, tier: 1 },
  { id: 'marrakech', name: 'Marrakech', x: 35, y: 50, tier: 3 },
  { id: 'essaouira', name: 'Essaouira', x: 15, y: 52, tier: 1 },
  { id: 'agadir', name: 'Agadir', x: 18, y: 62, tier: 2 },
  { id: 'ouarzazate', name: 'Ouarzazate', x: 52, y: 55, tier: 1 },
  { id: 'errachidia', name: 'Errachidia', x: 65, y: 42, tier: 1 },
];

const HIGHWAY_ROUTE_DEFS = [
  { a: 'tanger', b: 'kenitra', dist: 200 },
  { a: 'tanger', b: 'tetouan', dist: 60 },
  { a: 'kenitra', b: 'rabat', dist: 40 },
  { a: 'rabat', b: 'casablanca', dist: 90 },
  { a: 'rabat', b: 'meknes', dist: 140 },
  { a: 'casablanca', b: 'eljadida', dist: 100 },
  { a: 'casablanca', b: 'marrakech', dist: 240 },
  { a: 'meknes', b: 'fes', dist: 60 },
  { a: 'fes', b: 'oujda', dist: 350 },
  { a: 'fes', b: 'errachidia', dist: 320 },
  { a: 'marrakech', b: 'essaouira', dist: 180 },
  { a: 'marrakech', b: 'ouarzazate', dist: 200 },
  { a: 'marrakech', b: 'agadir', dist: 250 },
  { a: 'marrakech', b: 'benimellal', dist: 200 },
  { a: 'agadir', b: 'essaouira', dist: 170 },
  { a: 'casablanca', b: 'benimellal', dist: 300 },
];

export function calcHighwayDistance(cityA: HighwayCity, cityB: HighwayCity): number {
  const dx = cityA.x - cityB.x;
  const dy = cityA.y - cityB.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 7);
}

export function calcHighwayBuildCost(distance: number): number {
  return Math.round(distance * 3000 + 200000);
}

export function calcHighwayBuildTime(distance: number): number {
  return distance * 3000; // 3 sec per km
}

// ===== SUPERMARKET DATA =====
const SUPERMARKET_PRODUCT_DEFS = [
  { name: 'Bread', emoji: '🍞', cat: 'Bakery', wholesale: 1, retail: 3, rate: 30, max: 100 },
  { name: 'Croissant', emoji: '🥐', cat: 'Bakery', wholesale: 2, retail: 5, rate: 20, max: 80 },
  { name: 'Flatbread', emoji: '🫓', cat: 'Bakery', wholesale: 1.5, retail: 4, rate: 25, max: 80 },
  { name: 'Milk', emoji: '🥛', cat: 'Dairy', wholesale: 2, retail: 5, rate: 25, max: 100 },
  { name: 'Yogurt', emoji: '🫙', cat: 'Dairy', wholesale: 1, retail: 3, rate: 20, max: 80 },
  { name: 'Cheese', emoji: '🧀', cat: 'Dairy', wholesale: 4, retail: 10, rate: 10, max: 40 },
  { name: 'Chicken', emoji: '🍗', cat: 'Meat', wholesale: 8, retail: 18, rate: 12, max: 30 },
  { name: 'Beef', emoji: '🥩', cat: 'Meat', wholesale: 15, retail: 30, rate: 6, max: 20 },
  { name: 'Tomatoes', emoji: '🍅', cat: 'Produce', wholesale: 1, retail: 3, rate: 30, max: 100 },
  { name: 'Onions', emoji: '🧅', cat: 'Produce', wholesale: 0.5, retail: 2, rate: 25, max: 100 },
  { name: 'Oranges', emoji: '🍊', cat: 'Produce', wholesale: 1, retail: 3, rate: 20, max: 80 },
  { name: 'Water', emoji: '💧', cat: 'Beverages', wholesale: 0.5, retail: 2, rate: 40, max: 150 },
  { name: 'Juice', emoji: '🧃', cat: 'Beverages', wholesale: 2, retail: 5, rate: 15, max: 60 },
  { name: 'Soda', emoji: '🥤', cat: 'Beverages', wholesale: 2, retail: 4, rate: 15, max: 60 },
  { name: 'Chips', emoji: '🍟', cat: 'Snacks', wholesale: 1, retail: 3, rate: 18, max: 80 },
  { name: 'Chocolate', emoji: '🍫', cat: 'Snacks', wholesale: 2, retail: 5, rate: 12, max: 60 },
  { name: 'Cookies', emoji: '🍪', cat: 'Snacks', wholesale: 1.5, retail: 4, rate: 15, max: 70 },
  { name: 'Bleach', emoji: '🧴', cat: 'Household', wholesale: 2, retail: 5, rate: 5, max: 40 },
  { name: 'Detergent', emoji: '🧹', cat: 'Household', wholesale: 4, retail: 8, rate: 4, max: 30 },
  { name: 'Soap', emoji: '🧼', cat: 'Household', wholesale: 1, retail: 3, rate: 8, max: 50 },
];

export function generateSupermarketProducts(): SupermarketProduct[] {
  return SUPERMARKET_PRODUCT_DEFS.map(def => ({
    id: randomId(), name: def.name, emoji: def.emoji, category: def.cat,
    wholesalePrice: def.wholesale, retailPrice: def.retail,
    stock: Math.round(def.max * 0.5), maxStock: def.max, salesRate: def.rate,
  }));
}

export function formatCash(n: number): string {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e4) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + Math.floor(n).toLocaleString();
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

// Calculate total passive income per second
export function calcCashPerSec(state: GameState): number {
  let cps = 0;
  for (const biz of state.businesses) {
    if (biz.type === 'cafe' && biz.cafeState) {
      const cs = biz.cafeState;
      const satisfactionMult = cs.satisfaction / 100;
      const capacityMult = cs.upgrades.website ? 1.15 : 1;
      for (const loc of cs.locations) {
        if (!loc.hasEmployee) continue;
        const hasStock = loc.stock.beans > 0 && loc.stock.milk > 0 && loc.stock.sugar > 0 && loc.stock.cups > 0;
        if (!hasStock) continue;
        const avgPrice = cs.menu.reduce((s, m) => s + m.currentPrice, 0) / cs.menu.length;
        const effectiveCap = loc.capacity * capacityMult;
        let rev = (effectiveCap * avgPrice * satisfactionMult) / 3600;
        cps += rev;
        cps -= loc.employeeSalary / 3600;
      }
    }
    if (biz.type === 'agency' && biz.agencyState) {
      const totalSalary = biz.agencyState.employees.reduce((s, e) => s + e.salary, 0);
      cps -= totalSalary / 3600;
    }
    if (biz.type === 'realestate' && biz.realEstateState) {
      for (const p of biz.realEstateState.properties) {
        if (p.status === 'rented') cps += p.rentalIncome / 3600;
      }
    }
    if (biz.type === 'bank' && biz.bankState) {
      const bs = biz.bankState;
      const rate = BANK_INTEREST_RATES[bs.upgradeLevel];
      cps += (bs.deposited * rate) / 3600;
      if (bs.upgradeLevel >= 2) cps += 500 / 3600;
      for (const c of bs.clients) {
        const netProfit = c.deposit * (rate - c.interestRate);
        if (netProfit > 0) cps += netProfit / 3600;
      }
    }
    if (biz.type === 'highway' && biz.highwayState) {
      for (const route of biz.highwayState.routes) {
        if (!route.built) continue;
        const traffic = route.baseTraffic * route.lanes * Math.max(0.1, 1 - route.tollPrice / 50);
        cps += (traffic * route.tollPrice) / 3600;
      }
    }
    if (biz.type === 'supermarket' && biz.supermarketState) {
      const sm = biz.supermarketState;
      const cashierCap = sm.cashiers * 50;
      let totalDemand = 0;
      const demands: number[] = [];
      for (const p of sm.products) {
        const priceFactor = Math.max(0.1, 1 - (p.retailPrice - p.wholesalePrice * 2) / (p.wholesalePrice * 3));
        const demand = p.stock > 0 ? p.salesRate * priceFactor : 0;
        demands.push(demand);
        totalDemand += demand;
      }
      const tpRatio = totalDemand > 0 ? Math.min(1, cashierCap / totalDemand) : 1;
      for (let j = 0; j < sm.products.length; j++) {
        const sold = demands[j] * tpRatio;
        const actualSold = Math.min(sold, sm.products[j].stock);
        cps += (actualSold * sm.products[j].retailPrice) / 3600;
      }
      cps -= (sm.cashiers * sm.cashierSalary) / 3600;
    }
    if (biz.type === 'streaming' && biz.streamingState) {
      const ss = biz.streamingState;
      const subRevenue = ss.subscribers * ss.subscriptionPrice / 3600;
      const adRevenue = ss.adNetwork ? ss.subscribers * 2 / 3600 : 0;
      cps += subRevenue + adRevenue - ss.serverCostPerHour / 3600;
    }
    if (biz.type === 'security' && biz.securityState) {
      const agentSalary = biz.securityState.agents.reduce((s, a) => s + a.salary, 0);
      cps -= agentSalary / 3600;
    }
    if (biz.type === 'oil' && biz.oilState) {
      const maintenance = biz.oilState.drillingSites.reduce((s, site) => s + (site.built ? site.machines * 5000 : 0), 0);
      cps -= maintenance / 3600;
    }
    if (biz.type === 'production' && biz.productionState) {
      cps -= (biz.productionState.workers * biz.productionState.workerSalary) / 3600;
    }
    if (biz.type === 'factory' && biz.factoryState) {
      cps -= (biz.factoryState.workers * biz.factoryState.workerSalary) / 3600;
    }
    if (biz.type === 'airline' && biz.airlineState) {
      const al = biz.airlineState;
      const routeSupply: Record<string, number> = {};
      for (const plane of al.planes) {
        if (!plane.routeId) continue;
        const route = al.routes.find(r => r.id === plane.routeId);
        if (!route) continue;
        const tH = (route.distance * 2 / plane.speed) + 1;
        routeSupply[route.id] = (routeSupply[route.id] || 0) + plane.capacity * (24 / tH);
      }
      for (const plane of al.planes) {
        if (!plane.routeId) { cps -= plane.maintenancePerH * 0.3 / 3600; continue; }
        const route = al.routes.find(r => r.id === plane.routeId);
        if (!route) continue;
        const tH = (route.distance * 2 / plane.speed) + 1;
        const fPerH = 1 / tH;
        const bP = route.distance * 0.15 + 150;
        const pF = Math.max(0.1, 2 - route.ticketPrice / bP);
        const lF = Math.min(0.95, (route.demand * pF) / (routeSupply[route.id] || 1));
        const fM = al.fuelEfficiency ? 0.8 : 1;
        cps += (plane.capacity * lF * route.ticketPrice * fPerH) / 3600;
        cps -= (plane.fuelPerKm * route.distance * 2 * fPerH * fM + plane.maintenancePerH) / 3600;
      }
    }
    if (biz.type === 'casino' && biz.casinoState) {
      const cs2 = biz.casinoState;
      let occ = 0.5;
      if (cs2.upgrades.security) occ += 0.15;
      if (cs2.upgrades.freeBar) occ += 0.10;
      if (cs2.upgrades.loyalty) occ += 0.20;
      occ = Math.min(0.95, occ);
      const dealerTables = cs2.tables.filter(t => CASINO_TABLE_TYPES.find(ct => ct.type === t.type)?.needsDealer).reduce((s2, t) => s2 + t.count, 0);
      const dealerRatio = dealerTables > 0 ? Math.min(1, cs2.dealers / dealerTables) : 1;
      const vipMult = cs2.upgrades.vipLounge ? 1.25 : 1;
      for (const t of cs2.tables) {
        const info = CASINO_TABLE_TYPES.find(ct => ct.type === t.type);
        if (!info) continue;
        const eff = info.needsDealer ? dealerRatio : 1;
        cps += (t.count * info.revenuePerH * occ * eff * vipMult) / 3600;
      }
      cps -= (cs2.dealers * cs2.dealerSalary) / 3600;
    }
    if (biz.type === 'nightclub' && biz.nightClubState) {
      const nc = biz.nightClubState;
      let q = 30;
      const avgDJ = nc.djs.length > 0 ? nc.djs.reduce((s2, d) => s2 + d.quality, 0) / nc.djs.length : 0;
      q += avgDJ * 4;
      if (nc.upgrades.soundSystem) q += 20;
      if (nc.upgrades.lighting) q += 15;
      if (nc.upgrades.smokeMachine) q += 10;
      q = Math.min(100, q);
      const capM = nc.upgrades.rooftop ? 1.3 : 1;
      const effCap = nc.capacity * capM;
      const ncOcc = Math.min(0.95, q * 0.01 * Math.max(0.2, 2 - nc.entryFee / 30));
      const nightly = effCap * ncOcc;
      const entryRev = nightly * nc.entryFee;
      const drinkRev = Math.min(nightly * 2, nc.drinkStock) * nc.drinkPrice;
      cps += (entryRev + drinkRev) / (6 * 3600);
      cps -= (nc.djs.reduce((s2, d) => s2 + d.salary, 0) + nc.bartenders * nc.bartenderSalary) / 3600;
    }
  }
  return cps;
}

export function calcCafeSatisfaction(cs: CafeState): number {
  let sat = 50;
  for (const item of cs.menu) {
    const priceDiff = (item.currentPrice - item.basePrice) / item.basePrice;
    if (priceDiff > 0) sat -= priceDiff * 15;
  }
  if (cs.upgrades.premiumBeans) sat += 10;
  if (cs.upgrades.loyaltyProgram) sat += 8;
  sat += cs.upgrades.menuTier * 5;
  if (cs.locations.length > 0) {
    let locBonus = 0;
    for (const loc of cs.locations) {
      if (loc.upgrades.wifi) locBonus += 8;
      if (loc.upgrades.decor) locBonus += 6;
      if (loc.upgrades.aircon) locBonus += 4;
      if (loc.upgrades.music) locBonus += 5;
    }
    sat += locBonus / cs.locations.length;
  }
  return Math.max(0, Math.min(100, Math.round(sat)));
}

export function saveGame(state: GameState) {
  try {
    localStorage.setItem('bizempire_save', JSON.stringify({ ...state, lastSave: Date.now() }));
  } catch {}
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem('bizempire_save');
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (!parsed.lastIncomePayout) parsed.lastIncomePayout = parsed.lastTick;
      if (!parsed.ownedAssets) parsed.ownedAssets = [];
      if (!parsed.ownedIslands) parsed.ownedIslands = [];
      // Market events backward compatibility
      if (!parsed.activeEvents) parsed.activeEvents = [];
      if (!parsed.lastEventCheck) parsed.lastEventCheck = Date.now();
      for (const island of parsed.ownedIslands) {
        if (!(island as any).buildings) (island as any).buildings = [];
      }
      for (const biz of parsed.businesses) {
        if (biz.type === 'cafe' && biz.cafeState) {
          if (!biz.cafeState.menu) {
            biz.cafeState.menu = DEFAULT_CAFE_MENU.map(m => ({ ...m }));
          }
          if (biz.cafeState.satisfaction === undefined) {
            biz.cafeState.satisfaction = 50;
          }
          const u = biz.cafeState.upgrades as any;
          if (u.hasHQ === undefined) u.hasHQ = false;
          if (u.premiumBeans === undefined) u.premiumBeans = u.espresso || false;
          if (u.website === undefined) u.website = false;
          if (u.loyaltyProgram === undefined) u.loyaltyProgram = u.loyalty || false;
          if (u.training === undefined) u.training = false;
          if (u.menuTier === undefined) u.menuTier = 0;
          delete u.espresso; delete u.loyalty;
          for (const loc of biz.cafeState.locations) {
            if (!loc.stock) loc.stock = { beans: 100, milk: 100, sugar: 100, cups: 100 };
            if (!loc.capacity) loc.capacity = 15;
            if (!loc.city) loc.city = 'Casablanca';
            if (!loc.street) loc.street = 'Bd Mohammed V';
            if (!loc.purchasePrice) loc.purchasePrice = 300;
            if (loc.hasEmployee === undefined) loc.hasEmployee = true;
            if (!loc.employeeSalary) loc.employeeSalary = Math.round(loc.capacity * 0.8 + 5);
            if (!loc.upgrades) loc.upgrades = { wifi: false, decor: false, aircon: false, music: false };
            delete (loc as any).image;
          }
          delete (biz.cafeState as any).stock;
          biz.cafeState.satisfaction = calcCafeSatisfaction(biz.cafeState);
        }
        if (biz.type === 'agency' && biz.agencyState) {
          const as2 = biz.agencyState as any;
          if (!as2.recruitmentSearches) as2.recruitmentSearches = [];
          if (!as2.completedProjects) as2.completedProjects = [];
          if (as2.totalSalaryPaid === undefined) as2.totalSalaryPaid = 0;
          for (const emp of as2.employees) {
            if (!emp.skills) {
              const skill = emp.skill || 2;
              emp.skills = { code: skill, design: Math.floor(skill / 2), management: 0 };
              delete emp.skill;
            }
          }
          for (const proj of [...as2.projects, ...as2.availableProjects]) {
            if (typeof proj.requirements === 'string' || !proj.requirements?.code) {
              const reqs = parseInt(proj.requirements) || 2;
              proj.requirements = { code: reqs * 2, design: reqs, management: reqs };
            }
            if (!proj.durationMs) proj.durationMs = 3600000;
            if (!proj.description) proj.description = '';
          }
        }
        if (biz.type === 'realestate' && biz.realEstateState) {
          const rs = biz.realEstateState as any;
          for (const p of rs.properties) {
            if (!p.city) { p.city = 'Casablanca'; p.street = 'Bd Mohammed V'; }
            if (!p.imageStyle) p.imageStyle = 'modern';
            if (!p.upgrades) p.upgrades = [];
            // Migrate old type names
            if (p.type === 'Appartement') p.type = 'Apartment';
            delete p.tier;
            delete p.renovationProgress;
          }
          for (const p of rs.marketListings) {
            if (p.type === 'Appartement') p.type = 'Apartment';
          }
          if (rs.marketListings.length > 0 && !rs.marketListings[0].city) {
            rs.marketListings = generatePropertyListings();
          }
        }
        if (biz.type === 'crypto' && biz.cryptoState) {
          if (!(biz.cryptoState as any).lastCryptoTick) {
            (biz.cryptoState as any).lastCryptoTick = parsed.lastTick;
          }
        }
        if (biz.type === 'streaming' && biz.streamingState) {
          if (!biz.streamingState.availableContent) biz.streamingState.availableContent = generateStreamingContent(biz.streamingState.category);
          if (biz.streamingState.maxSubscribers === undefined) biz.streamingState.maxSubscribers = 500;
        }
        if (biz.type === 'security' && biz.securityState) {
          if (!biz.securityState.equipment) biz.securityState.equipment = generateSecurityEquipment();
          if (!biz.securityState.availableMissions) biz.securityState.availableMissions = generateSecurityMissions();
          if (!(biz.securityState as any).completedMissions) (biz.securityState as any).completedMissions = [];
          if ((biz.securityState as any).completedCount === undefined) (biz.securityState as any).completedCount = 0;
          if (biz.securityState.maxAgents === undefined) biz.securityState.maxAgents = 6;
        }
        if (biz.type === 'production' && biz.productionState) {
          if (!(biz.productionState as any).upgrades) (biz.productionState as any).upgrades = { efficiency: 0, workerCapacity: 0, harvestTech: 0 };
        }
        if (biz.type === 'factory' && biz.factoryState) {
          if (!(biz.factoryState as any).upgrades) (biz.factoryState as any).upgrades = { efficiency: 0, workerCapacity: 0, automation: 0, qualityControl: 0, autoSell: false };
        }
      }
      return parsed;
    }
  } catch {}
  return null;
}

// ===== STREAMING CONTENT GENERATION =====
const STREAMING_MUSIC = [
  { name: 'Desert Echoes', pop: 7, cost: 15000 }, { name: 'Neon Pulse', pop: 5, cost: 8000 },
  { name: 'Midnight Sessions', pop: 8, cost: 25000 }, { name: 'Atlas Beats', pop: 6, cost: 12000 },
  { name: 'Ocean Drive', pop: 9, cost: 40000 }, { name: 'Underground Vibes', pop: 4, cost: 5000 },
  { name: 'Golden Hour', pop: 7, cost: 18000 }, { name: 'Electric Dreams', pop: 8, cost: 30000 },
  { name: 'Sahara Nights', pop: 6, cost: 10000 }, { name: 'Crystal Clear', pop: 5, cost: 7000 },
  { name: 'Rhythm & Soul', pop: 9, cost: 50000 }, { name: 'Acoustic Paradise', pop: 7, cost: 15000 },
];
const STREAMING_GAMING = [
  { name: 'Cyber Warriors', pop: 8, cost: 30000 }, { name: 'Desert Storm', pop: 7, cost: 20000 },
  { name: 'Pixel Quest', pop: 5, cost: 8000 }, { name: 'Space Colony', pop: 9, cost: 60000 },
  { name: 'Battle Royale X', pop: 8, cost: 40000 }, { name: 'Shadow Realm', pop: 6, cost: 12000 },
  { name: 'Racing Legends', pop: 7, cost: 25000 }, { name: 'Zombie Frontier', pop: 6, cost: 14000 },
  { name: 'Castle Defense', pop: 5, cost: 7000 }, { name: 'Ocean Depths', pop: 7, cost: 18000 },
  { name: 'Dragon Age II', pop: 9, cost: 70000 }, { name: 'Indie Collection', pop: 4, cost: 5000 },
];
const STREAMING_FILMS = [
  { name: 'The Last Kingdom', pop: 9, cost: 80000 }, { name: 'Casablanca Nights', pop: 8, cost: 50000 },
  { name: 'Desert Runner', pop: 6, cost: 15000 }, { name: 'Ocean\'s Edge', pop: 7, cost: 25000 },
  { name: 'The Algorithm', pop: 5, cost: 10000 }, { name: 'Midnight Express', pop: 8, cost: 40000 },
  { name: 'Atlas Mountains', pop: 7, cost: 20000 }, { name: 'Neon City', pop: 6, cost: 12000 },
  { name: 'The Heist', pop: 9, cost: 100000 }, { name: 'Family Ties', pop: 5, cost: 8000 },
  { name: 'Rogue Agent', pop: 8, cost: 60000 }, { name: 'Silent Witness', pop: 7, cost: 22000 },
];

export function generateStreamingContent(category: StreamingCategory): StreamingContent[] {
  const defs = category === 'music' ? STREAMING_MUSIC : category === 'gaming' ? STREAMING_GAMING : STREAMING_FILMS;
  return defs.map(d => ({ id: randomId(), name: d.name, popularity: d.pop, licenseCost: d.cost }));
}

// ===== SECURITY GENERATION =====
const SECURITY_CELEBRITIES = [
  'Gad Elmaleh', 'Saad Lamjarred', 'Manal Benchlikha', 'French Montana',
  'Douzi', 'Elam Jay', 'Nabyla Maan', 'Ahmed Chawki',
  'DJ Snake', 'Mohamed Ramadan', 'Amr Diab', 'Nancy Ajram',
];
const SECURITY_EVENTS = [
  'Gala Dinner', 'Concert Tour', 'Film Premiere', 'Award Ceremony',
  'Private Party', 'Fashion Show', 'Sports Event', 'Charity Fundraiser',
  'Wedding Reception', 'Press Conference', 'Album Launch', 'Store Opening',
];

export function generateSecurityMission(): SecurityMission {
  const celeb = SECURITY_CELEBRITIES[Math.floor(Math.random() * SECURITY_CELEBRITIES.length)];
  const event = SECURITY_EVENTS[Math.floor(Math.random() * SECURITY_EVENTS.length)];
  const score = 5 + Math.floor(Math.random() * 25);
  const payout = Math.round(score * 4000 + Math.random() * score * 2000);
  const duration = (2 + Math.floor(Math.random() * 2)) * 3600000;
  return { id: randomId(), celebrity: celeb, event, requiredScore: score, payout, durationMs: duration, accepted: false, unitIds: [], startedAt: undefined };
}

export function generateSecurityMissions(): SecurityMission[] {
  return Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => generateSecurityMission());
}

export function generateSecurityAgent(): SecurityAgent {
  const combat = 1 + Math.floor(Math.random() * 8);
  const surveillance = 1 + Math.floor(Math.random() * 8);
  const driving = 1 + Math.floor(Math.random() * 6);
  const salary = Math.round((combat + surveillance + driving) * 8 + 25);
  return { id: randomId(), name: randName(), combat, surveillance, driving, salary };
}

export function generateSecurityEquipment(): SecurityEquipment[] {
  return [
    { id: 'vest', name: 'Tactical Vest', icon: '🦺', cost: 5000, owned: false, scoreBoost: 2 },
    { id: 'radio', name: 'Comm System', icon: '📡', cost: 12000, owned: false, scoreBoost: 3 },
    { id: 'camera', name: 'Surveillance Kit', icon: '📷', cost: 25000, owned: false, scoreBoost: 4 },
    { id: 'vehicle', name: 'Armored SUV', icon: '🚙', cost: 60000, owned: false, scoreBoost: 5 },
    { id: 'drone', name: 'Recon Drone', icon: '🛸', cost: 100000, owned: false, scoreBoost: 6 },
    { id: 'hq', name: 'Command Center', icon: '🏢', cost: 250000, owned: false, scoreBoost: 8 },
  ];
}

export function calcUnitScore(unit: SecurityUnit, agents: SecurityAgent[], equipment: SecurityEquipment[]): number {
  const agentScore = unit.agentIds.reduce((sum, id) => {
    const a = agents.find(ag => ag.id === id);
    return sum + (a ? a.combat + a.surveillance + a.driving : 0);
  }, 0);
  const equipBonus = equipment.filter(e => e.owned).reduce((s, e) => s + e.scoreBoost, 0);
  return agentScore + equipBonus;
}

// ===== PRODUCTION DATA =====
export const PRODUCTION_TYPES = [
  { type: 'gold_mine' as const, name: 'Gold Mine', icon: '⛏️', resource: 'gold' as ResourceType, resourceName: 'Gold', resourceIcon: '🥇', baseRate: 2, workerSalary: 80, rawSellPrice: 500, image: 'https://images.unsplash.com/photo-1605732562742-3023a888e56e?w=200&h=200&fit=crop' },
  { type: 'wheat_farm' as const, name: 'Wheat Farm', icon: '🌾', resource: 'wheat' as ResourceType, resourceName: 'Wheat', resourceIcon: '🌾', baseRate: 25, workerSalary: 15, rawSellPrice: 5, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop' },
  { type: 'lumber_camp' as const, name: 'Lumber Camp', icon: '🪵', resource: 'wood' as ResourceType, resourceName: 'Wood', resourceIcon: '🪵', baseRate: 15, workerSalary: 20, rawSellPrice: 10, image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=200&h=200&fit=crop' },
  { type: 'iron_mine' as const, name: 'Iron Mine', icon: '⚒️', resource: 'iron' as ResourceType, resourceName: 'Iron', resourceIcon: '🔩', baseRate: 5, workerSalary: 50, rawSellPrice: 80, image: 'https://images.unsplash.com/photo-1504197885166-c297e66bea55?w=200&h=200&fit=crop' },
  { type: 'cotton_farm' as const, name: 'Cotton Farm', icon: '🧵', resource: 'cotton' as ResourceType, resourceName: 'Cotton', resourceIcon: '🧶', baseRate: 20, workerSalary: 12, rawSellPrice: 6, image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200&h=200&fit=crop' },
  { type: 'quarry' as const, name: 'Stone Quarry', icon: '🪨', resource: 'stone' as ResourceType, resourceName: 'Stone', resourceIcon: '🪨', baseRate: 12, workerSalary: 25, rawSellPrice: 15, image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop' },
];

// ===== FACTORY DATA =====
export const FACTORY_TYPES = [
  { type: 'bakery' as const, name: 'Bakery', icon: '🍞', inputResource: 'wheat' as ResourceType, inputName: 'Wheat', outputName: 'Bread', outputIcon: '🍞', conversionRate: 20, sellPrice: 60, workerSalary: 18, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop' },
  { type: 'sawmill' as const, name: 'Sawmill', icon: '🪚', inputResource: 'wood' as ResourceType, inputName: 'Wood', outputName: 'Planks', outputIcon: '🪵', conversionRate: 12, sellPrice: 120, workerSalary: 22, image: 'https://images.unsplash.com/photo-1563198804-b144dfc1661c?w=200&h=200&fit=crop' },
  { type: 'jewelry_workshop' as const, name: 'Jewelry Workshop', icon: '💍', inputResource: 'gold' as ResourceType, inputName: 'Gold', outputName: 'Jewelry', outputIcon: '💎', conversionRate: 1, sellPrice: 5000, workerSalary: 120, image: 'https://images.unsplash.com/photo-1515562141589-67f0d952b2f3?w=200&h=200&fit=crop' },
  { type: 'steelworks' as const, name: 'Steelworks', icon: '🔩', inputResource: 'iron' as ResourceType, inputName: 'Iron', outputName: 'Steel', outputIcon: '⚙️', conversionRate: 4, sellPrice: 800, workerSalary: 60, image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop' },
  { type: 'textile_mill' as const, name: 'Textile Mill', icon: '👔', inputResource: 'cotton' as ResourceType, inputName: 'Cotton', outputName: 'Fabric', outputIcon: '🧵', conversionRate: 15, sellPrice: 80, workerSalary: 16, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop' },
  { type: 'masonry' as const, name: 'Masonry', icon: '🧱', inputResource: 'stone' as ResourceType, inputName: 'Stone', outputName: 'Bricks', outputIcon: '🧱', conversionRate: 10, sellPrice: 130, workerSalary: 20, image: 'https://images.unsplash.com/photo-1590075865003-e48277faa558?w=200&h=200&fit=crop' },
];

// ===== AIRLINE DATA =====
export const AIRLINE_CITIES = [
  { id: 'cmn', name: 'Casablanca', country: '🇲🇦', tier: 2 },
  { id: 'par', name: 'Paris', country: '🇫🇷', tier: 3 },
  { id: 'lon', name: 'London', country: '🇬🇧', tier: 3 },
  { id: 'mad', name: 'Madrid', country: '🇪🇸', tier: 2 },
  { id: 'nyc', name: 'New York', country: '🇺🇸', tier: 3 },
  { id: 'dxb', name: 'Dubai', country: '🇦🇪', tier: 3 },
  { id: 'ist', name: 'Istanbul', country: '🇹🇷', tier: 2 },
  { id: 'tyo', name: 'Tokyo', country: '🇯🇵', tier: 3 },
  { id: 'sin', name: 'Singapore', country: '🇸🇬', tier: 2 },
  { id: 'gru', name: 'São Paulo', country: '🇧🇷', tier: 2 },
];

export const AIRLINE_PLANE_TYPES = [
  { type: 'prop', name: 'Turboprop', icon: '🛩️', capacity: 20, speed: 400, fuelPerKm: 1.5, maintenancePerH: 150, cost: 1500000, range: 1500 },
  { type: 'regional', name: 'Regional Jet', icon: '✈️', capacity: 80, speed: 750, fuelPerKm: 3, maintenancePerH: 400, cost: 5000000, range: 3000 },
  { type: 'narrow', name: 'Narrow-Body', icon: '🛫', capacity: 180, speed: 850, fuelPerKm: 5, maintenancePerH: 1000, cost: 18000000, range: 6000 },
  { type: 'wide', name: 'Wide-Body', icon: '🛬', capacity: 350, speed: 900, fuelPerKm: 10, maintenancePerH: 2500, cost: 45000000, range: 14000 },
  { type: 'jumbo', name: 'Jumbo Jet', icon: '🌐', capacity: 550, speed: 930, fuelPerKm: 18, maintenancePerH: 5000, cost: 120000000, range: 16000 },
];

export function getAirlineRouteDistance(cityAId: string, cityBId: string): number {
  const d: Record<string, number> = {
    'cmn-par': 2100, 'cmn-lon': 2300, 'cmn-mad': 850, 'cmn-ist': 3200,
    'cmn-dxb': 5500, 'cmn-nyc': 5800, 'cmn-tyo': 11000, 'cmn-sin': 10500,
    'cmn-gru': 7500, 'par-lon': 350, 'par-mad': 1100, 'par-nyc': 5800,
    'par-dxb': 5200, 'par-ist': 2200, 'par-tyo': 9700, 'par-sin': 10700,
    'par-gru': 9200, 'lon-mad': 1300, 'lon-nyc': 5500, 'lon-dxb': 5500,
    'lon-ist': 2500, 'lon-tyo': 9500, 'lon-sin': 10800, 'lon-gru': 9400,
    'mad-ist': 2700, 'mad-nyc': 5700, 'mad-dxb': 5800, 'mad-tyo': 10500,
    'mad-sin': 10900, 'mad-gru': 8400, 'nyc-dxb': 11000, 'nyc-tyo': 10800,
    'nyc-gru': 7700, 'nyc-sin': 15300, 'nyc-ist': 8100, 'dxb-ist': 3000,
    'dxb-tyo': 7900, 'dxb-sin': 5800, 'dxb-gru': 11500, 'ist-tyo': 8700,
    'ist-sin': 8500, 'ist-gru': 10300, 'tyo-sin': 5300, 'tyo-gru': 18500,
    'sin-gru': 15500,
  };
  return d[`${cityAId}-${cityBId}`] || d[`${cityBId}-${cityAId}`] || 5000;
}

export function getAirlineRouteDemand(cityA: { tier: number }, cityB: { tier: number }): number {
  const tierSum = cityA.tier + cityB.tier;
  return (tierSum === 6 ? 500 : tierSum === 5 ? 300 : tierSum === 4 ? 150 : 80) + Math.floor(Math.random() * 100);
}

export function getAirlineRouteOpenCost(distance: number, tierSum: number): number {
  return Math.round(tierSum * 25000 + distance * 10);
}
