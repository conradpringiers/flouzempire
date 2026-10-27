import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  GameState, BusinessInstance, createInitialGameState, createBusiness,
  calcCashPerSec, saveGame, loadGame, formatCash, TAP_UPGRADE_COSTS, TAP_POWERS,
  generateEcomOrder, randomId, generateBankClient,
  BANK_UPGRADE_COSTS, BANK_INTEREST_RATES, BUSINESS_TYPES,
  calcCafeSatisfaction, CafeMenuItem, CafeState, getCafeBuildTime,
  generateAgencyCandidate, getRecruitmentCost, getRecruitmentDuration,
  generateAgencyProjects, generatePropertyListings,
  StreamingCategory, HIGHWAY_CITIES, calcHighwayDistance, calcHighwayBuildCost, calcHighwayBuildTime,
  generateStreamingContent, generateSecurityMission, generateSecurityMissions, generateSecurityAgent, calcUnitScore,
  OwnedIsland, PRODUCTION_TYPES, FACTORY_TYPES,
  AIRLINE_PLANE_TYPES, AIRLINE_CITIES, getAirlineRouteDistance, getAirlineRouteDemand, getAirlineRouteOpenCost,
  HQ_COST, HQ_BUILD_TIME, HQ_UPGRADE_DEFS, ISLAND_BUILDING_DEFS,
  CASINO_TABLE_TYPES, NIGHTCLUB_DJ_POOL,
  MarketEvent, generateMarketEvent, getEventModifierForBiz, SocialState,
} from './GameState';
import {
  createInitialSocialState, tickStocks, MILLIONAIRE_ACTIONS, COMPANY_DATA,
  getDividendPerHour, getImpressionFactor,
} from './SocialData';

type Action =
  | { type: 'TAP' }
  | { type: 'UPGRADE_TAP' }
  | { type: 'BUY_BUSINESS'; bizType: BusinessInstance['type']; name?: string; streamingCategory?: StreamingCategory; productionType?: string; factoryType?: string }
  | { type: 'TICK'; dt: number }
  | { type: 'SET_STATE'; state: GameState }
  | { type: 'RESET_GAME' }
  | { type: 'RENAME_BUSINESS'; bizId: string; name: string }
  // Cafe
  | { type: 'CAFE_BUY_LOCATION'; bizId: string; city: string; street: string; price: number; capacity: number }
  | { type: 'CAFE_RESTOCK_LOCATION'; bizId: string; locationId: string; item: string; qty: number }
  | { type: 'CAFE_SET_MENU_PRICE'; bizId: string; itemId: string; price: number }
  | { type: 'CAFE_UPGRADE'; bizId: string; upgrade: string }
  | { type: 'CAFE_BUILD_HQ'; bizId: string }
  | { type: 'CAFE_HIRE_EMPLOYEE'; bizId: string; locationId: string }
  | { type: 'CAFE_FIRE_EMPLOYEE'; bizId: string; locationId: string }
  | { type: 'CAFE_LOCATION_UPGRADE'; bizId: string; locationId: string; upgrade: string }
  // Agency
  | { type: 'AGENCY_HIRE'; bizId: string; employee: any; searchId?: string }
  | { type: 'AGENCY_FIRE'; bizId: string; empId: string }
  | { type: 'AGENCY_ACCEPT_PROJECT'; bizId: string; projectId: string; employeeIds?: string[] }
  | { type: 'AGENCY_DECLINE_PROJECT'; bizId: string; projectId: string }
  | { type: 'AGENCY_EXPAND'; bizId: string }
  | { type: 'AGENCY_RECRUIT'; bizId: string }
  // Real Estate
  | { type: 'RE_BUY_PROPERTY'; bizId: string; propertyId: string }
  | { type: 'RE_RENT'; bizId: string; propertyId: string }
  | { type: 'RE_UNRENT'; bizId: string; propertyId: string }
  | { type: 'RE_SELL'; bizId: string; propertyId: string }
  | { type: 'RE_UPGRADE_PROPERTY'; bizId: string; propertyId: string; upgradeId: string }
  // E-commerce
  | { type: 'ECOM_FULFILL'; bizId: string; orderId: string }
  | { type: 'ECOM_RESTOCK'; bizId: string; productId: string }
  | { type: 'ECOM_SET_PRICE'; bizId: string; productId: string; price: number }
  | { type: 'ECOM_TOGGLE_AUTO'; bizId: string }
  | { type: 'ECOM_UPGRADE_SHIPPING'; bizId: string }
  | { type: 'ECOM_UPGRADE_WAREHOUSE'; bizId: string }
  // Crypto
  | { type: 'CRYPTO_BUY'; bizId: string; coinId: string; amount: number }
  | { type: 'CRYPTO_SELL'; bizId: string; coinId: string; amount: number }
  | { type: 'CRYPTO_UPGRADE_ANALYTICS'; bizId: string }
  // Bank
  | { type: 'BANK_DEPOSIT'; bizId: string; amount: number }
  | { type: 'BANK_WITHDRAW'; bizId: string; amount: number }
  | { type: 'BANK_UPGRADE'; bizId: string }
  | { type: 'BANK_ACCEPT_CLIENT'; bizId: string }
  // Highway
  | { type: 'HIGHWAY_CREATE_ROUTE'; bizId: string; cityAId: string; cityBId: string }
  | { type: 'HIGHWAY_SET_TOLL'; bizId: string; routeId: string; price: number }
  | { type: 'HIGHWAY_UPGRADE_LANE'; bizId: string; routeId: string }
  // Supermarket
  | { type: 'SUPERMARKET_RESTOCK'; bizId: string; productId: string; qty: number }
  | { type: 'SUPERMARKET_RESTOCK_ALL'; bizId: string }
  | { type: 'SUPERMARKET_SET_PRICE'; bizId: string; productId: string; price: number }
  | { type: 'SUPERMARKET_HIRE_CASHIER'; bizId: string }
  | { type: 'SUPERMARKET_FIRE_CASHIER'; bizId: string }
  | { type: 'SUPERMARKET_UPGRADE_STORE'; bizId: string }
  // Streaming
  | { type: 'STREAMING_LICENSE'; bizId: string; contentId: string }
  | { type: 'STREAMING_SET_PRICE'; bizId: string; price: number }
  | { type: 'STREAMING_UPGRADE_SERVER'; bizId: string }
  | { type: 'STREAMING_BUY_RECOMMENDATION'; bizId: string }
  | { type: 'STREAMING_BUY_ADS'; bizId: string }
  // Security
  | { type: 'SECURITY_HIRE_AGENT'; bizId: string }
  | { type: 'SECURITY_FIRE_AGENT'; bizId: string; agentId: string }
  | { type: 'SECURITY_CREATE_UNIT'; bizId: string; name: string; agentIds: string[] }
  | { type: 'SECURITY_DISBAND_UNIT'; bizId: string; unitId: string }
  | { type: 'SECURITY_ACCEPT_MISSION'; bizId: string; missionId: string; unitIds: string[] }
  | { type: 'SECURITY_BUY_EQUIPMENT'; bizId: string; equipmentId: string }
  // Oil
  | { type: 'OIL_BUILD_SITE'; bizId: string }
  | { type: 'OIL_ADD_MACHINE'; bizId: string; siteId: string }
  | { type: 'OIL_SELL'; bizId: string; quantity: number }
  | { type: 'OIL_UPGRADE_STORAGE'; bizId: string }
  // Production
  | { type: 'PRODUCTION_HIRE'; bizId: string }
  | { type: 'PRODUCTION_FIRE'; bizId: string }
  | { type: 'PRODUCTION_SELL'; bizId: string; amount: number }
  | { type: 'PRODUCTION_UPGRADE_STORAGE'; bizId: string }
  | { type: 'PRODUCTION_UPGRADE'; bizId: string; upgrade: 'efficiency' | 'workerCapacity' | 'harvestTech' }
  | { type: 'PRODUCTION_SET_AUTO_EXPORT'; bizId: string; targetBizId?: string }
  // Factory
  | { type: 'FACTORY_SELL'; bizId: string; amount: number }
  | { type: 'FACTORY_HIRE'; bizId: string }
  | { type: 'FACTORY_FIRE'; bizId: string }
  | { type: 'FACTORY_IMPORT'; fromBizId: string; toBizId: string; amount: number }
  | { type: 'FACTORY_UPGRADE_STORAGE'; bizId: string }
  | { type: 'FACTORY_UPGRADE'; bizId: string; upgrade: 'efficiency' | 'workerCapacity' | 'automation' | 'qualityControl' }
  | { type: 'FACTORY_TOGGLE_AUTO_SELL'; bizId: string }
  // Airline
  | { type: 'AIRLINE_BUY_PLANE'; bizId: string; planeType: string }
  | { type: 'AIRLINE_OPEN_ROUTE'; bizId: string; cityAId: string; cityBId: string }
  | { type: 'AIRLINE_ASSIGN_PLANE'; bizId: string; planeId: string; routeId: string }
  | { type: 'AIRLINE_UNASSIGN_PLANE'; bizId: string; planeId: string }
  | { type: 'AIRLINE_SET_TICKET'; bizId: string; routeId: string; price: number }
  | { type: 'AIRLINE_UPGRADE'; bizId: string; upgrade: string }
  // Casino
  | { type: 'CASINO_BUY_TABLE'; bizId: string; tableType: string }
  | { type: 'CASINO_HIRE_DEALER'; bizId: string }
  | { type: 'CASINO_FIRE_DEALER'; bizId: string }
  | { type: 'CASINO_UPGRADE'; bizId: string; upgrade: string }
  // Night Club
  | { type: 'NIGHTCLUB_HIRE_DJ'; bizId: string }
  | { type: 'NIGHTCLUB_FIRE_DJ'; bizId: string; djId: string }
  | { type: 'NIGHTCLUB_SET_ENTRY'; bizId: string; price: number }
  | { type: 'NIGHTCLUB_SET_DRINK_PRICE'; bizId: string; price: number }
  | { type: 'NIGHTCLUB_RESTOCK'; bizId: string; qty: number }
  | { type: 'NIGHTCLUB_HIRE_BARTENDER'; bizId: string }
  | { type: 'NIGHTCLUB_UPGRADE'; bizId: string; upgrade: string }
  // Islands
  | { type: 'BUY_ISLAND'; islandId: string; name: string; cost: number }
  | { type: 'RENAME_ISLAND'; islandId: string; name: string }
  | { type: 'ISLAND_BUILD'; islandId: string; buildingType: string }
  // HQ
  | { type: 'BUILD_HQ' }
  | { type: 'HQ_UPGRADE'; upgrade: string }
  | { type: 'BUY_ASSET'; assetId: string; cost: number }
  // Social
  | { type: 'SOCIAL_ACTION'; millionaireId: string; actionId: string }
  | { type: 'SOCIAL_ADD_FRIEND'; millionaireId: string }
  | { type: 'STOCK_BUY'; companyId: string; shares: number }
  | { type: 'STOCK_SELL'; companyId: string; shares: number }
  | { type: 'AGENCY_REDEEM'; bizId: string; projectId: string }
  | { type: 'SECURITY_REDEEM'; bizId: string; missionId: string };

function findBiz(state: GameState, bizId: string): BusinessInstance | undefined {
  return state.businesses.find(b => b.id === bizId);
}

function updateBiz(state: GameState, bizId: string, updater: (b: BusinessInstance) => BusinessInstance): GameState {
  return { ...state, businesses: state.businesses.map(b => b.id === bizId ? updater({ ...b }) : b) };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'TAP': {
      const tapMult = 1 + (state.hq?.upgrades.tapBoost || 0) * 0.25;
      const tapAmount = Math.round(state.tapPower * tapMult);
      return { ...state, cash: state.cash + tapAmount, totalEarned: state.totalEarned + tapAmount };
    }
    case 'UPGRADE_TAP': {
      const nextLevel = state.tapUpgradeLevel + 1;
      if (nextLevel >= TAP_UPGRADE_COSTS.length) return state;
      const cost = TAP_UPGRADE_COSTS[nextLevel];
      if (state.cash < cost) return state;
      return { ...state, cash: state.cash - cost, tapUpgradeLevel: nextLevel, tapPower: TAP_POWERS[nextLevel] };
    }
    case 'BUY_BUSINESS': {
      const info = BUSINESS_TYPES.find(b => b.type === action.bizType);
      if (!info || state.cash < info.cost) return state;
      const maxBiz = 10 + (state.hq?.upgrades.maxBusinesses || 0) * 5;
      if (state.businesses.length >= maxBiz) return state;
      const biz = createBusiness(action.bizType, action.name || info.name, { streamingCategory: action.streamingCategory, productionType: action.productionType, factoryType: action.factoryType });
      return { ...state, cash: state.cash - info.cost, businesses: [...state.businesses, biz] };
    }
    case 'RENAME_BUSINESS': {
      return updateBiz(state, action.bizId, b => {
        b.name = action.name;
        return b;
      });
    }
    case 'RESET_GAME': {
      localStorage.removeItem('bizempire_save');
      localStorage.removeItem('seen_tutorials');
      return createInitialGameState();
    }
    case 'TICK': {
      let s = { ...state, activeEvents: [...(state.activeEvents || [])] };
      const dt = action.dt / 1000;
      const incomeMult = 1 + (s.hq?.upgrades.incomeBoost || 0) * 0.10;
      const cps = calcCashPerSec(s) * incomeMult;
      s.cashPerSec = cps;

      const now = Date.now();

      // === MARKET EVENTS ===
      // Remove expired events
      const expiredEvents = s.activeEvents.filter(e => now >= e.endsAt);
      s.activeEvents = s.activeEvents.filter(e => now < e.endsAt);
      for (const e of expiredEvents) {
        toast.info(`${e.icon} ${e.name} ended`, { description: 'Market returns to normal' });
      }

      // Check for new random event (every 5 minutes, 15% chance, max 1 event)
      const EVENT_CHECK_INTERVAL = 300000; // 5 min
      if (!s.lastEventCheck) s.lastEventCheck = now;
      if (now - s.lastEventCheck >= EVENT_CHECK_INTERVAL) {
        s.lastEventCheck = now;
        // 15% chance of new event, max 1 active event
        if (Math.random() < 0.15 && s.activeEvents.length < 1) {
          const newEvent = generateMarketEvent();
          s.activeEvents.push(newEvent);
          const modifierText = newEvent.modifier >= 1 
            ? `+${Math.round((newEvent.modifier - 1) * 100)}% revenue` 
            : `${Math.round((newEvent.modifier - 1) * 100)}% revenue`;
          toast(newEvent.icon + ' ' + newEvent.name, { 
            description: `${newEvent.description} (${modifierText})`,
            duration: 5000,
          });
        }
      }

      // HQ construction
      if (s.hq && s.hq.building && s.hq.buildReadyAt && now >= s.hq.buildReadyAt) {
        s.hq = { ...s.hq, built: true, building: false, buildReadyAt: undefined };
      }

      // Island building construction
      s.ownedIslands = s.ownedIslands.map(island => {
        const buildings = (island.buildings || []).map(b => {
          if (b.building && b.buildReadyAt && now >= b.buildReadyAt) {
            return { ...b, built: true, building: false, buildReadyAt: undefined };
          }
          return b;
        });
        // Island income
        const islandIncome = buildings.filter(b => b.built).reduce((sum, b) => sum + b.incomePerHour, 0);
        if (islandIncome > 0) {
          s.cash += (islandIncome * dt) / 3600;
          s.totalEarned += (islandIncome * dt) / 3600;
        }
        return { ...island, buildings };
      });

      const elapsedSinceLastPayout = (now - s.lastIncomePayout) / 1000;
      if (elapsedSinceLastPayout >= 60 || action.dt >= 60000) {
        const minutes = action.dt >= 60000 ? action.dt / 60000 : Math.floor(elapsedSinceLastPayout / 60);
        // Apply event modifiers to income
        let totalIncome = 0;
        for (const biz of s.businesses) {
          const bizIncome = calcCashPerSec({ ...s, businesses: [biz] }) * minutes * 60;
          const eventMod = getEventModifierForBiz(s.activeEvents, biz.type);
          totalIncome += bizIncome * eventMod;
        }
        if (totalIncome > 0) {
          s.cash += totalIncome;
          s.totalEarned += totalIncome;
        }
        s.lastIncomePayout = now;
      }

      for (let i = 0; i < s.businesses.length; i++) {
        const biz = { ...s.businesses[i] };

        if (biz.type === 'cafe' && biz.cafeState) {
          const cs = { ...biz.cafeState, upgrades: { ...biz.cafeState.upgrades } };
          const consumeMultiplier = cs.upgrades.training ? 0.8 : 1;
          const satisfactionMult = cs.satisfaction / 100;
          if (cs.upgrades.hqBuildReadyAt && now >= cs.upgrades.hqBuildReadyAt) {
            cs.upgrades.hasHQ = true;
            cs.upgrades.hqBuildReadyAt = undefined;
          }
          cs.locations = cs.locations.map(loc => {
            const nloc = { ...loc, stock: { ...loc.stock }, upgrades: { ...loc.upgrades } };
            if (nloc.status === 'building' && nloc.buildReadyAt && now >= nloc.buildReadyAt) {
              nloc.status = 'no-employee';
              nloc.buildReadyAt = undefined;
            }
            if (nloc.status === 'building') return nloc;
            if (!nloc.hasEmployee) { nloc.status = 'no-employee'; return nloc; }
            const salesPerSec = (nloc.capacity * satisfactionMult) / 3600;
            const consumeRate = salesPerSec * consumeMultiplier * dt;
            nloc.stock.beans = Math.max(0, nloc.stock.beans - consumeRate);
            nloc.stock.milk = Math.max(0, nloc.stock.milk - consumeRate);
            nloc.stock.sugar = Math.max(0, nloc.stock.sugar - consumeRate * 0.5);
            nloc.stock.cups = Math.max(0, nloc.stock.cups - consumeRate);
            const hasStock = nloc.stock.beans > 0 && nloc.stock.milk > 0 && nloc.stock.sugar > 0 && nloc.stock.cups > 0;
            nloc.status = hasStock ? 'open' : 'needs-restock';
            return nloc;
          });
          biz.cafeState = cs;
        }

        if (biz.type === 'agency' && biz.agencyState) {
          const as2 = { ...biz.agencyState, completedProjects: [...(biz.agencyState.completedProjects || [])] };

          as2.recruitmentSearches = as2.recruitmentSearches.map(search => {
            if (!search.completed && now >= search.readyAt) {
              return { ...search, completed: true };
            }
            return search;
          });

          as2.projects = as2.projects.map(p => {
            if (!p.accepted || !p.startedAt) return p;
            const elapsed = now - p.startedAt;
            const newProgress = Math.min(100, (elapsed / p.durationMs) * 100);
            if (newProgress >= 100 && p.progress < 100) {
              // Move to completed - don't auto-pay, player must redeem
              // Crescendo: payout scales with completedCount
              const crescendo = 1 + as2.completedCount * 0.1;
              const boostedPayout = Math.round(p.payout * crescendo);
              as2.completedProjects.push({ ...p, progress: 100, payout: boostedPayout });
              as2.completedCount++;
              as2.employees = as2.employees.map(e =>
                p.assignedEmployees.includes(e.id) ? { ...e, busy: false, projectId: undefined } : e
              );
            }
            return { ...p, progress: newProgress };
          }).filter(p => p.progress < 100 || !p.accepted);

          const salaryPerSec = as2.employees.reduce((sum, e) => sum + e.salary, 0) / 3600;
          const salaryDeduction = salaryPerSec * dt;
          s.cash -= salaryDeduction;
          as2.totalSalaryPaid += salaryDeduction;

          biz.agencyState = as2;
        }

        if (biz.type === 'realestate' && biz.realEstateState) {
          const rs = { ...biz.realEstateState };
          rs.properties = rs.properties.map(p => {
            let np = { ...p, upgrades: p.upgrades.map(u => ({ ...u })) };
            // Very slow natural appreciation: ~0.001% per second → ~3.6% per hour
            np.currentValue += np.currentValue * 0.00001 * dt;

            for (const u of np.upgrades) {
              if (u.installing && u.installReadyAt && now >= u.installReadyAt) {
                u.installing = false;
                u.installed = true;
                u.installReadyAt = undefined;
                np.currentValue *= (1 + u.valueBoost / 100);
                np.rentalIncome = Math.round(np.currentValue * 0.003);
              }
            }
            return np;
          });
          biz.realEstateState = rs;
        }

        if (biz.type === 'ecommerce' && biz.ecomState) {
          const es = { ...biz.ecomState, orders: [...biz.ecomState.orders], products: biz.ecomState.products.map(p => ({ ...p })) };
          if (Math.random() < (es.reputation / 100) * 0.02 * dt && es.orders.length < 20) {
            es.orders.push(generateEcomOrder(es.products));
          }
          es.orders = es.orders.map(o => {
            if (o.fulfilled) return o;
            return { ...o, deadline: o.deadline - dt };
          });
          const missed = es.orders.filter(o => !o.fulfilled && o.deadline <= 0);
          if (missed.length > 0) {
            es.reputation = Math.max(0, es.reputation - missed.length * 2);
            es.orders = es.orders.filter(o => o.fulfilled || o.deadline > 0);
          }
          if (es.autoFulfill) {
            for (const o of es.orders) {
              if (o.fulfilled) continue;
              const prod = es.products.find(p => p.id === o.productId);
              if (prod && prod.stock >= o.quantity) {
                prod.stock -= o.quantity;
                o.fulfilled = true;
                s.cash += o.payout * 0.9;
                s.totalEarned += o.payout * 0.9;
              }
            }
          }
          es.orders = es.orders.filter(o => !o.fulfilled || o.deadline > -5);
          biz.ecomState = es;
        }

        if (biz.type === 'crypto' && biz.cryptoState) {
          const crs = { ...biz.cryptoState };
          const now2 = Date.now();
          const elapsed2 = now2 - (crs.lastCryptoTick || now2);
          const ticks = Math.floor(elapsed2 / 60000);
          if (ticks > 0) {
            crs.coins = crs.coins.map(c => {
              let price = c.price;
              const hist = [...c.history];
              for (let t = 0; t < Math.min(ticks, 480); t++) {
                const change = price * (Math.random() - 0.5) * c.volatility * 2;
                price = Math.max(0.01, price + change);
                hist.push(price);
              }
              return { ...c, price, history: hist.slice(-60) };
            });
            crs.lastCryptoTick = now2;
          }
          biz.cryptoState = crs;
        }

        if (biz.type === 'bank' && biz.bankState) {
          const bs = { ...biz.bankState };
          const rate = BANK_INTEREST_RATES[bs.upgradeLevel];
          const interest = bs.deposited * rate * dt / 3600;
          bs.deposited += interest;
          for (const c of bs.clients) {
            const clientInterest = c.deposit * c.interestRate * dt / 3600;
            s.cash -= clientInterest;
          }
          biz.bankState = bs;
        }

        if (biz.type === 'highway' && biz.highwayState) {
          const hs = { ...biz.highwayState, routes: biz.highwayState.routes.map(r => ({ ...r })) };
          const now3 = Date.now();
          for (const route of hs.routes) {
            if (route.building && route.buildReadyAt && now3 >= route.buildReadyAt) {
              route.built = true;
              route.building = false;
              route.buildReadyAt = undefined;
              route.buildStartedAt = undefined;
            }
          }
          for (const route of hs.routes) {
            if (!route.built) continue;
            const traffic = route.baseTraffic * route.lanes * Math.max(0.1, 1 - route.tollPrice / 50);
            hs.totalRevenue += (traffic * route.tollPrice * dt) / 3600;
          }
          biz.highwayState = hs;
        }

        if (biz.type === 'supermarket' && biz.supermarketState) {
          const sm = { ...biz.supermarketState, products: biz.supermarketState.products.map(p => ({ ...p })) };
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
          let revenue = 0;
          for (let j = 0; j < sm.products.length; j++) {
            const sold = (demands[j] * tpRatio * dt) / 3600;
            const actualSold = Math.min(sold, sm.products[j].stock);
            sm.products[j].stock = Math.max(0, sm.products[j].stock - actualSold);
            revenue += actualSold * sm.products[j].retailPrice;
          }
          s.cash += revenue;
          s.totalEarned += revenue;
          sm.totalRevenue += revenue;
          const salaryCost = (sm.cashiers * sm.cashierSalary * dt) / 3600;
          s.cash -= salaryCost;
          sm.totalCost += salaryCost;
          biz.supermarketState = sm;
        }

        if (biz.type === 'streaming' && biz.streamingState) {
          const ss = { ...biz.streamingState };
          const catalogPop = ss.catalog.reduce((s2, c) => s2 + c.popularity, 0);
          const priceFactor = Math.max(0.1, 1 - ss.subscriptionPrice / 30);
          const recoMult = ss.recommendationEngine ? 2 : 1;
          const growthPerHour = catalogPop * priceFactor * recoMult * 5;
          ss.subscribers = Math.min(ss.maxSubscribers, ss.subscribers + (growthPerHour / 3600) * dt);
          if (ss.catalog.length === 0) ss.subscribers = Math.max(0, ss.subscribers - dt * 0.01);
          const subRev = (ss.subscribers * ss.subscriptionPrice * dt) / 3600;
          const adRev = ss.adNetwork ? (ss.subscribers * 2 * dt) / 3600 : 0;
          const serverCost = (ss.serverCostPerHour * dt) / 3600;
          s.cash += subRev + adRev - serverCost;
          s.totalEarned += subRev + adRev;
          ss.totalRevenue += subRev + adRev;
          biz.streamingState = ss;
        }

        if (biz.type === 'security' && biz.securityState) {
          const sec = { ...biz.securityState, activeMissions: biz.securityState.activeMissions.map(m => ({ ...m })), units: biz.securityState.units.map(u => ({ ...u })), completedMissions: [...(biz.securityState.completedMissions || [])] };
          const now4 = Date.now();
          sec.activeMissions = sec.activeMissions.filter(m => {
            if (m.startedAt && now4 >= m.startedAt + m.durationMs) {
              // Move to completed - don't auto-pay, player must redeem
              // Crescendo: payout scales with completedCount
              const crescendo = 1 + (sec.completedCount || 0) * 0.1;
              const boostedPayout = Math.round(m.payout * crescendo);
              sec.completedMissions.push({ ...m, payout: boostedPayout });
              sec.completedCount = (sec.completedCount || 0) + 1;
              for (const uid of m.unitIds) {
                const unit = sec.units.find(u => u.id === uid);
                if (unit) { unit.missionId = undefined; unit.busyUntil = undefined; }
              }
              return false;
            }
            return true;
          });
          const agentSalary = (sec.agents.reduce((sum, a) => sum + a.salary, 0) * dt) / 3600;
          s.cash -= agentSalary;
          // Refresh missions if needed
          if (sec.availableMissions.length === 0 && sec.activeMissions.length === 0 && sec.completedMissions.length === 0) {
            sec.availableMissions = generateSecurityMissions();
          }
          biz.securityState = sec;
        }

        if (biz.type === 'oil' && biz.oilState) {
          const os = { ...biz.oilState, drillingSites: biz.oilState.drillingSites.map(s2 => ({ ...s2 })) };
          const now5 = Date.now();
          // Complete construction
          for (const site of os.drillingSites) {
            if (site.building && site.buildReadyAt && now5 >= site.buildReadyAt) {
              site.built = true;
              site.building = false;
              site.buildReadyAt = undefined;
              site.buildStartedAt = undefined;
            }
          }
          // Oil production
          let totalProd = 0;
          for (const site of os.drillingSites) {
            if (!site.built) continue;
            totalProd += site.machines * site.productionRate;
          }
          const produced = (totalProd * dt) / 3600;
          os.oilStored = Math.min(os.storageCapacity, os.oilStored + produced);
          // Maintenance cost
          const maintenance = os.drillingSites.reduce((sum2, site) => sum2 + (site.built ? site.machines * 5000 : 0), 0);
          s.cash -= (maintenance * dt) / 3600;
          biz.oilState = os;
        }

        if (biz.type === 'production' && biz.productionState) {
          const ps = { ...biz.productionState, upgrades: { ...biz.productionState.upgrades } };
          const effMult = 1 + ps.upgrades.efficiency * 0.25;
          const salaryMult = 1 - ps.upgrades.harvestTech * 0.15;
          const produced = (ps.workers * ps.productionRate * effMult * dt) / 3600;
          ps.stored = Math.min(ps.storageCapacity, ps.stored + produced);
          s.cash -= (ps.workers * ps.workerSalary * salaryMult * dt) / 3600;
          // Auto-export to linked factory
          if (ps.upgrades.autoExportTargetId && ps.stored > 0) {
            const targetIdx = s.businesses.findIndex(b => b.id === ps.upgrades.autoExportTargetId);
            if (targetIdx >= 0) {
              const target = { ...s.businesses[targetIdx] };
              if (target.factoryState && target.factoryState.inputResource === ps.resourceType) {
                const tfs = { ...target.factoryState, upgrades: { ...target.factoryState.upgrades } };
                const space = tfs.inputCapacity - tfs.inputStored;
                const transfer = Math.min(ps.stored, space);
                if (transfer > 0) {
                  ps.stored -= transfer;
                  tfs.inputStored += transfer;
                  target.factoryState = tfs;
                  s.businesses[targetIdx] = target;
                }
              }
            }
          }
          biz.productionState = ps;
        }

        if (biz.type === 'factory' && biz.factoryState) {
          const fs = { ...biz.factoryState, upgrades: { ...biz.factoryState.upgrades } };
          const effMult = 1 + fs.upgrades.efficiency * 0.25;
          const salaryMult = 1 - fs.upgrades.automation * 0.15;
          const priceMult = 1 + fs.upgrades.qualityControl * 0.20;
          const canProcess = Math.min(fs.inputStored, (fs.workers * fs.conversionRate * effMult * dt) / 3600);
          const outputSpace = fs.outputCapacity - fs.outputStored;
          const actual = Math.min(canProcess, outputSpace);
          fs.inputStored -= actual;
          fs.outputStored += actual;
          s.cash -= (fs.workers * fs.workerSalary * salaryMult * dt) / 3600;
          // Auto-sell when output is above 80%
          if (fs.upgrades.autoSell && fs.outputStored > fs.outputCapacity * 0.8) {
            const sellAmt = Math.floor(fs.outputStored * 0.5);
            if (sellAmt > 0) {
              const revenue = sellAmt * fs.sellPrice * priceMult;
              fs.outputStored -= sellAmt;
              fs.totalRevenue += revenue;
              s.cash += revenue;
              s.totalEarned += revenue;
            }
          }
          biz.factoryState = fs;
        }

        if (biz.type === 'airline' && biz.airlineState) {
          // ... keep existing airline tick code
          const al = { ...biz.airlineState, planes: biz.airlineState.planes.map(p => ({ ...p })) };
          let rev = 0, cost = 0;
          const rSupply: Record<string, number> = {};
          for (const plane of al.planes) {
            if (!plane.routeId) continue;
            const route = al.routes.find(r => r.id === plane.routeId);
            if (!route) continue;
            const tH = (route.distance * 2 / plane.speed) + 1;
            rSupply[route.id] = (rSupply[route.id] || 0) + plane.capacity * (24 / tH);
          }
          for (const plane of al.planes) {
            if (!plane.routeId) { cost += (plane.maintenancePerH * 0.3 * dt) / 3600; continue; }
            const route = al.routes.find(r => r.id === plane.routeId);
            if (!route) continue;
            const tH = (route.distance * 2 / plane.speed) + 1;
            const fPerH = 1 / tH;
            const bP = route.distance * 0.15 + 150;
            const pF = Math.max(0.1, 2 - route.ticketPrice / bP);
            const lF = Math.min(0.95, (route.demand * pF) / (rSupply[route.id] || 1));
            const fM = al.fuelEfficiency ? 0.8 : 1;
            rev += (plane.capacity * lF * route.ticketPrice * fPerH * dt) / 3600;
            cost += ((plane.fuelPerKm * route.distance * 2 * fPerH * fM + plane.maintenancePerH) * dt) / 3600;
          }
          s.cash += rev - cost;
          s.totalEarned += rev;
          al.totalRevenue += rev;
          al.totalCosts += cost;
          biz.airlineState = al;
        }

        // Casino tick
        if (biz.type === 'casino' && biz.casinoState) {
          const cs2 = { ...biz.casinoState, tables: biz.casinoState.tables.map(t => ({ ...t })), upgrades: { ...biz.casinoState.upgrades } };
          let occ = 0.5;
          if (cs2.upgrades.security) occ += 0.15;
          if (cs2.upgrades.freeBar) occ += 0.10;
          if (cs2.upgrades.loyalty) occ += 0.20;
          occ = Math.min(0.95, occ);
          const dealerTables = cs2.tables.filter(t => CASINO_TABLE_TYPES.find(ct => ct.type === t.type)?.needsDealer).reduce((sum2, t) => sum2 + t.count, 0);
          const dealerRatio = dealerTables > 0 ? Math.min(1, cs2.dealers / dealerTables) : 1;
          const vipMult = cs2.upgrades.vipLounge ? 1.25 : 1;
          let casinoRev = 0;
          for (const t of cs2.tables) {
            const info = CASINO_TABLE_TYPES.find(ct => ct.type === t.type);
            if (!info) continue;
            const eff = info.needsDealer ? dealerRatio : 1;
            casinoRev += (t.count * info.revenuePerH * occ * eff * vipMult * dt) / 3600;
          }
          const casinoCost = (cs2.dealers * cs2.dealerSalary * dt) / 3600;
          s.cash += casinoRev - casinoCost;
          s.totalEarned += casinoRev;
          cs2.totalRevenue += casinoRev;
          biz.casinoState = cs2;
        }

        // Night Club tick
        if (biz.type === 'nightclub' && biz.nightClubState) {
          const nc = { ...biz.nightClubState, djs: [...biz.nightClubState.djs], upgrades: { ...biz.nightClubState.upgrades } };
          let q = 30;
          const avgDJ = nc.djs.length > 0 ? nc.djs.reduce((sum2, d) => sum2 + d.quality, 0) / nc.djs.length : 0;
          q += avgDJ * 4;
          if (nc.upgrades.soundSystem) q += 20;
          if (nc.upgrades.lighting) q += 15;
          if (nc.upgrades.smokeMachine) q += 10;
          q = Math.min(100, q);
          const capMult = nc.upgrades.rooftop ? 1.3 : 1;
          const effCap = nc.capacity * capMult;
          const ncOcc = Math.min(0.95, q * 0.01 * Math.max(0.2, 2 - nc.entryFee / 30));
          const nightly = effCap * ncOcc;
          const entryRev = nightly * nc.entryFee;
          const drinksSold = Math.min(nightly * 2, nc.drinkStock);
          const drinkRev = drinksSold * nc.drinkPrice;
          // Consume drinks proportionally per hour (6h night cycle)
          const drinkConsumePerSec = drinksSold / (6 * 3600);
          nc.drinkStock = Math.max(0, nc.drinkStock - drinkConsumePerSec * dt);
          const ncRevPerSec = (entryRev + drinkRev) / (6 * 3600);
          const ncCostPerSec = (nc.djs.reduce((sum2, d) => sum2 + d.salary, 0) + nc.bartenders * nc.bartenderSalary) / 3600;
          s.cash += (ncRevPerSec - ncCostPerSec) * dt;
          s.totalEarned += ncRevPerSec * dt;
          nc.totalRevenue += ncRevPerSec * dt;
          biz.nightClubState = nc;
        }

        s.businesses[i] = biz;
      }

      // === SOCIAL / STOCKS TICK ===
      if (!s.socialState) {
        s.socialState = createInitialSocialState();
      } else {
        const STOCK_TICK_INTERVAL = 30000; // 30 seconds
        if (now - s.socialState.lastStockTick >= STOCK_TICK_INTERVAL) {
          s.socialState = {
            ...s.socialState,
            stocks: tickStocks(s.socialState.stocks),
            lastStockTick: now,
          };
        }
        // Dividend income
        const dividendPerHour = getDividendPerHour(s.socialState.holdings, s.socialState.stocks);
        if (dividendPerHour > 0) {
          const dividendIncome = (dividendPerHour * dt) / 3600;
          s.cash += dividendIncome;
          s.totalEarned += dividendIncome;
        }
      }

      s.lastTick = now;
      return s;
    }
    case 'SET_STATE':
      return action.state;

    // CAFE ACTIONS
    case 'CAFE_BUY_LOCATION': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cafeState || state.cash < action.price) return state;
      const salaryBase = Math.round(action.capacity * 0.8 + 5);
      const locIndex = biz.cafeState.locations.length;
      const buildTime = getCafeBuildTime(locIndex);
      const isInstant = buildTime === 0;
      const now = Date.now();
      return { ...updateBiz(state, action.bizId, b => {
        b.cafeState!.locations.push({
          id: randomId(),
          name: `${action.street}, ${action.city}`,
          city: action.city,
          street: action.street,
          capacity: action.capacity,
          stock: { beans: 100, milk: 100, sugar: 100, cups: 100 },
          status: isInstant ? 'no-employee' : 'building',
          purchasePrice: action.price,
          hasEmployee: false,
          employeeSalary: salaryBase,
          upgrades: { wifi: false, decor: false, aircon: false, music: false },
          buildReadyAt: isInstant ? undefined : now + buildTime,
        });
        return b;
      }), cash: state.cash - action.price };
    }
    case 'CAFE_RESTOCK_LOCATION': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cafeState) return state;
      const costPerUnit = 1;
      const cost = action.qty * costPerUnit;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.cafeState!.locations = b.cafeState!.locations.map(l => {
          if (l.id !== action.locationId) return l;
          const stock = { ...l.stock };
          (stock as any)[action.item] = Math.min(100, (stock as any)[action.item] + action.qty);
          return { ...l, stock };
        });
        return b;
      }), cash: state.cash - cost };
    }
    case 'CAFE_SET_MENU_PRICE': {
      return updateBiz(state, action.bizId, b => {
        b.cafeState!.menu = b.cafeState!.menu.map(m =>
          m.id === action.itemId ? { ...m, currentPrice: action.price } : m
        );
        b.cafeState!.satisfaction = calcCafeSatisfaction(b.cafeState!);
        return b;
      });
    }
    case 'CAFE_UPGRADE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cafeState || !biz.cafeState.upgrades.hasHQ) return state;
      const costs: Record<string, number> = { premiumBeans: 8000, website: 12000, loyaltyProgram: 10000, training: 10000, menu: 5000 };
      const cost = costs[action.upgrade] || 200;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        if (action.upgrade === 'menu') b.cafeState!.upgrades.menuTier = Math.min(3, b.cafeState!.upgrades.menuTier + 1);
        else (b.cafeState!.upgrades as any)[action.upgrade] = true;
        b.cafeState!.satisfaction = calcCafeSatisfaction(b.cafeState!);
        return b;
      }), cash: state.cash - cost };
    }
    case 'CAFE_BUILD_HQ': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cafeState || biz.cafeState.upgrades.hasHQ || biz.cafeState.upgrades.hqBuildReadyAt) return state;
      const cost = 25000;
      if (state.cash < cost) return state;
      const buildTime = 120000;
      return { ...updateBiz(state, action.bizId, b => {
        b.cafeState!.upgrades.hqBuildReadyAt = Date.now() + buildTime;
        return b;
      }), cash: state.cash - cost };
    }
    case 'CAFE_HIRE_EMPLOYEE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cafeState) return state;
      const loc = biz.cafeState.locations.find(l => l.id === action.locationId);
      if (!loc || loc.hasEmployee) return state;
      return updateBiz(state, action.bizId, b => {
        b.cafeState!.locations = b.cafeState!.locations.map(l =>
          l.id === action.locationId ? { ...l, hasEmployee: true, status: 'open' as const } : l
        );
        return b;
      });
    }
    case 'CAFE_FIRE_EMPLOYEE': {
      return updateBiz(state, action.bizId, b => {
        b.cafeState!.locations = b.cafeState!.locations.map(l =>
          l.id === action.locationId ? { ...l, hasEmployee: false, status: 'no-employee' as const } : l
        );
        return b;
      });
    }
    case 'CAFE_LOCATION_UPGRADE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cafeState) return state;
      const costs: Record<string, number> = { wifi: 3000, decor: 4000, aircon: 5000, music: 2000 };
      const cost = costs[action.upgrade] || 150;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.cafeState!.locations = b.cafeState!.locations.map(l => {
          if (l.id !== action.locationId) return l;
          return { ...l, upgrades: { ...l.upgrades, [action.upgrade]: true } };
        });
        b.cafeState!.satisfaction = calcCafeSatisfaction(b.cafeState!);
        return b;
      }), cash: state.cash - cost };
    }

    // AGENCY ACTIONS
    case 'AGENCY_HIRE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.agencyState || biz.agencyState.employees.length >= biz.agencyState.maxSlots) return state;
      return updateBiz(state, action.bizId, b => {
        b.agencyState!.employees.push(action.employee);
        if (action.searchId) {
          b.agencyState!.recruitmentSearches = b.agencyState!.recruitmentSearches.map(s => {
            if (s.id !== action.searchId) return s;
            return { ...s, candidates: s.candidates.filter((c: any) => c.id !== action.employee.id) };
          }).filter(s => s.candidates.length > 0 || !s.completed);
        }
        return b;
      });
    }
    case 'AGENCY_FIRE': {
      return updateBiz(state, action.bizId, b => {
        b.agencyState!.employees = b.agencyState!.employees.filter(e => e.id !== action.empId);
        return b;
      });
    }
    case 'AGENCY_ACCEPT_PROJECT': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.agencyState) return state;
      const proj = biz.agencyState.availableProjects.find(p => p.id === action.projectId);
      if (!proj) return state;
      const employeeIds = action.employeeIds || [];
      if (employeeIds.length === 0) return state;
      return updateBiz(state, action.bizId, b => {
        const as2 = b.agencyState!;
        as2.availableProjects = as2.availableProjects.filter(p => p.id !== action.projectId);
        const acceptedProj = { ...proj, accepted: true, assignedEmployees: employeeIds, startedAt: Date.now() };
        as2.projects.push(acceptedProj);
        as2.employees = as2.employees.map(e =>
          employeeIds.includes(e.id) ? { ...e, busy: true, projectId: proj.id } : e
        );
        return b;
      });
    }
    case 'AGENCY_DECLINE_PROJECT': {
      return updateBiz(state, action.bizId, b => {
        b.agencyState!.availableProjects = b.agencyState!.availableProjects.filter(p => p.id !== action.projectId);
        return b;
      });
    }
    case 'AGENCY_REDEEM': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.agencyState) return state;
      const proj = (biz.agencyState.completedProjects || []).find(p => p.id === action.projectId);
      if (!proj) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.agencyState!.completedProjects = (b.agencyState!.completedProjects || []).filter(p => p.id !== action.projectId);
        b.agencyState!.totalEarned += proj.payout;
        return b;
      }), cash: state.cash + proj.payout, totalEarned: state.totalEarned + proj.payout };
    }
    case 'AGENCY_EXPAND': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.agencyState) return state;
      const cost = biz.agencyState.maxSlots * 5000;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.agencyState!.maxSlots += 2;
        return b;
      }), cash: state.cash - cost };
    }
    case 'AGENCY_RECRUIT': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.agencyState) return state;
      const searchCount = biz.agencyState.recruitmentSearches.length;
      const cost = getRecruitmentCost(searchCount);
      if (state.cash < cost) return state;
      const duration = getRecruitmentDuration(searchCount);
      const now = Date.now();
      const candidates = Array.from({ length: 3 }, () => generateAgencyCandidate());
      return { ...updateBiz(state, action.bizId, b => {
        b.agencyState!.recruitmentSearches.push({
          id: randomId(),
          cost,
          startedAt: now,
          readyAt: now + duration,
          candidates,
          completed: false,
        });
        return b;
      }), cash: state.cash - cost };
    }

    // REAL ESTATE
    case 'RE_BUY_PROPERTY': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.realEstateState) return state;
      const listing = biz.realEstateState.marketListings.find(p => p.id === action.propertyId);
      if (!listing || state.cash < listing.purchasePrice) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.realEstateState!.properties.push({ ...listing, upgrades: listing.upgrades.map(u => ({ ...u })) });
        b.realEstateState!.marketListings = b.realEstateState!.marketListings.filter(p => p.id !== action.propertyId);
        return b;
      }), cash: state.cash - listing.purchasePrice };
    }
    case 'RE_RENT': {
      return updateBiz(state, action.bizId, b => {
        b.realEstateState!.properties = b.realEstateState!.properties.map(p =>
          p.id === action.propertyId && p.status === 'vacant' ? { ...p, status: 'rented' as const, rentalIncome: Math.round(p.currentValue * 0.003) } : p
        );
        return b;
      });
    }
    case 'RE_UNRENT': {
      return updateBiz(state, action.bizId, b => {
        b.realEstateState!.properties = b.realEstateState!.properties.map(p =>
          p.id === action.propertyId && p.status === 'rented' ? { ...p, status: 'vacant' as const } : p
        );
        return b;
      });
    }
    case 'RE_UPGRADE_PROPERTY': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.realEstateState) return state;
      const prop = biz.realEstateState.properties.find(p => p.id === action.propertyId);
      if (!prop) return state;
      const upgrade = prop.upgrades.find(u => u.id === (action as any).upgradeId);
      if (!upgrade || upgrade.installed || upgrade.installing) return state;
      if (state.cash < upgrade.cost) return state;
      const installTime = 60000 + Math.random() * 180000;
      return { ...updateBiz(state, action.bizId, b => {
        b.realEstateState!.properties = b.realEstateState!.properties.map(p => {
          if (p.id !== action.propertyId) return p;
          return { ...p, upgrades: p.upgrades.map(u => {
            if (u.id !== (action as any).upgradeId) return u;
            return { ...u, installing: true, installReadyAt: Date.now() + installTime };
          })};
        });
        return b;
      }), cash: state.cash - upgrade.cost };
    }
    case 'RE_SELL': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.realEstateState) return state;
      const prop = biz.realEstateState.properties.find(p => p.id === action.propertyId);
      if (!prop) return state;
      const salePrice = Math.floor(prop.currentValue * 0.95);
      return { ...updateBiz(state, action.bizId, b => {
        b.realEstateState!.properties = b.realEstateState!.properties.filter(p => p.id !== action.propertyId);
        return b;
      }), cash: state.cash + salePrice, totalEarned: state.totalEarned + salePrice };
    }

    // E-COMMERCE
    case 'ECOM_FULFILL': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.ecomState) return state;
      const order = biz.ecomState.orders.find(o => o.id === action.orderId);
      if (!order || order.fulfilled) return state;
      const prod = biz.ecomState.products.find(p => p.id === order.productId);
      if (!prod || prod.stock < order.quantity) return state;
      let ns = updateBiz(state, action.bizId, b => {
        const es = b.ecomState!;
        es.products = es.products.map(p => p.id === order.productId ? { ...p, stock: p.stock - order.quantity } : p);
        es.orders = es.orders.map(o => o.id === action.orderId ? { ...o, fulfilled: true } : o);
        es.reputation = Math.min(100, es.reputation + 0.5);
        return b;
      });
      ns.cash += order.payout;
      ns.totalEarned += order.payout;
      return ns;
    }
    case 'ECOM_RESTOCK': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.ecomState) return state;
      const prod = biz.ecomState.products.find(p => p.id === action.productId);
      if (!prod) return state;
      const qty = prod.maxStock - prod.stock;
      const cost = Math.ceil(qty * prod.restockCost * 0.5);
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.ecomState!.products = b.ecomState!.products.map(p =>
          p.id === action.productId ? { ...p, stock: p.maxStock } : p
        );
        return b;
      }), cash: state.cash - cost };
    }
    case 'ECOM_SET_PRICE': {
      return updateBiz(state, action.bizId, b => {
        b.ecomState!.products = b.ecomState!.products.map(p =>
          p.id === action.productId ? { ...p, sellingPrice: action.price } : p
        );
        return b;
      });
    }
    case 'ECOM_TOGGLE_AUTO': {
      return updateBiz(state, action.bizId, b => {
        b.ecomState!.autoFulfill = !b.ecomState!.autoFulfill;
        return b;
      });
    }
    case 'ECOM_UPGRADE_SHIPPING': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.ecomState || biz.ecomState.shippingTier >= 2) return state;
      const cost = (biz.ecomState.shippingTier + 1) * 5000;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.ecomState!.shippingTier++;
        return b;
      }), cash: state.cash - cost };
    }
    case 'ECOM_UPGRADE_WAREHOUSE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.ecomState) return state;
      const cost = biz.ecomState.warehouseLevel * 8000;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.ecomState!.warehouseLevel++;
        b.ecomState!.products = b.ecomState!.products.map(p => ({ ...p, maxStock: p.maxStock + 25 }));
        return b;
      }), cash: state.cash - cost };
    }

    // CRYPTO
    case 'CRYPTO_BUY': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cryptoState) return state;
      const coin = biz.cryptoState.coins.find(c => c.id === action.coinId);
      if (!coin) return state;
      const cost = coin.price * action.amount;
      if (state.cash < cost) return state;
      let ns = { ...state, cash: state.cash - cost };
      ns = updateBiz(ns, action.bizId, b => {
        const cs = b.cryptoState!;
        const existing = cs.holdings.find(h => h.coinId === action.coinId);
        if (existing) {
          existing.avgBuyPrice = (existing.avgBuyPrice * existing.amount + cost) / (existing.amount + action.amount);
          existing.amount += action.amount;
        } else {
          cs.holdings.push({ coinId: action.coinId, amount: action.amount, avgBuyPrice: coin.price });
        }
        cs.tradeHistory.push({ coinId: action.coinId, type: 'buy', amount: action.amount, price: coin.price, time: Date.now() });
        return b;
      });
      return ns;
    }
    case 'CRYPTO_SELL': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cryptoState) return state;
      const coin = biz.cryptoState.coins.find(c => c.id === action.coinId);
      const holding = biz.cryptoState.holdings.find(h => h.coinId === action.coinId);
      if (!coin || !holding || holding.amount < action.amount) return state;
      const revenue = coin.price * action.amount;
      let ns = { ...state, cash: state.cash + revenue, totalEarned: state.totalEarned + Math.max(0, revenue - holding.avgBuyPrice * action.amount) };
      ns = updateBiz(ns, action.bizId, b => {
        const cs = b.cryptoState!;
        cs.holdings = cs.holdings.map(h => {
          if (h.coinId !== action.coinId) return h;
          return { ...h, amount: h.amount - action.amount };
        }).filter(h => h.amount > 0.0001);
        cs.tradeHistory.push({ coinId: action.coinId, type: 'sell', amount: action.amount, price: coin.price, time: Date.now() });
        return b;
      });
      return ns;
    }
    case 'CRYPTO_UPGRADE_ANALYTICS': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.cryptoState || biz.cryptoState.advancedAnalytics) return state;
      const cost = 25000;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.cryptoState!.advancedAnalytics = true;
        return b;
      }), cash: state.cash - cost };
    }

    // BANK
    case 'BANK_DEPOSIT': {
      if (state.cash < action.amount) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.bankState!.deposited += action.amount;
        return b;
      }), cash: state.cash - action.amount };
    }
    case 'BANK_WITHDRAW': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.bankState || biz.bankState.deposited < action.amount) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.bankState!.deposited -= action.amount;
        return b;
      }), cash: state.cash + action.amount };
    }
    case 'BANK_UPGRADE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.bankState) return state;
      const nextLevel = biz.bankState.upgradeLevel + 1;
      if (nextLevel >= BANK_UPGRADE_COSTS.length) return state;
      const cost = BANK_UPGRADE_COSTS[nextLevel];
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.bankState!.upgradeLevel = nextLevel;
        if (nextLevel >= 3) b.bankState!.maxClients += 2;
        return b;
      }), cash: state.cash - cost };
    }
    case 'BANK_ACCEPT_CLIENT': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.bankState || biz.bankState.clients.length >= biz.bankState.maxClients) return state;
      return updateBiz(state, action.bizId, b => {
        b.bankState!.clients.push(generateBankClient());
        return b;
      });
    }

    // HIGHWAY
    case 'HIGHWAY_CREATE_ROUTE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.highwayState) return state;
      const cityA = HIGHWAY_CITIES.find(c => c.id === action.cityAId);
      const cityB = HIGHWAY_CITIES.find(c => c.id === action.cityBId);
      if (!cityA || !cityB || action.cityAId === action.cityBId) return state;
      const exists = biz.highwayState.routes.some(r =>
        (r.cityA === action.cityAId && r.cityB === action.cityBId) ||
        (r.cityA === action.cityBId && r.cityB === action.cityAId)
      );
      if (exists) return state;
      const distance = calcHighwayDistance(cityA, cityB);
      const buildCost = calcHighwayBuildCost(distance);
      if (state.cash < buildCost) return state;
      const buildTime = calcHighwayBuildTime(distance);
      const now = Date.now();
      const baseTraffic = (cityA.tier + cityB.tier) * 40;
      const newRoute = {
        id: `${action.cityAId}-${action.cityBId}`,
        cityA: action.cityAId, cityB: action.cityBId,
        built: false, building: true,
        buildStartedAt: now, buildReadyAt: now + buildTime,
        buildCost, lanes: 1, tollPrice: 5, baseTraffic, distance,
      };
      return { ...updateBiz(state, action.bizId, b => {
        b.highwayState!.routes = [...b.highwayState!.routes, newRoute];
        return b;
      }), cash: state.cash - buildCost };
    }
    case 'HIGHWAY_SET_TOLL': {
      return updateBiz(state, action.bizId, b => {
        b.highwayState!.routes = b.highwayState!.routes.map(r =>
          r.id === action.routeId ? { ...r, tollPrice: Math.max(1, Math.min(50, action.price)) } : r
        );
        return b;
      });
    }
    case 'HIGHWAY_UPGRADE_LANE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.highwayState) return state;
      const route = biz.highwayState.routes.find(r => r.id === action.routeId);
      if (!route || !route.built || route.lanes >= 4) return state;
      const cost = Math.round(route.lanes * 5000 * route.distance / 100);
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.highwayState!.routes = b.highwayState!.routes.map(r =>
          r.id === action.routeId ? { ...r, lanes: r.lanes + 1 } : r
        );
        return b;
      }), cash: state.cash - cost };
    }

    // SUPERMARKET
    case 'SUPERMARKET_RESTOCK': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.supermarketState) return state;
      const prod = biz.supermarketState.products.find(p => p.id === action.productId);
      if (!prod) return state;
      const qty = Math.min(action.qty, prod.maxStock - Math.round(prod.stock));
      const cost = qty * prod.wholesalePrice;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.supermarketState!.products = b.supermarketState!.products.map(p =>
          p.id === action.productId ? { ...p, stock: Math.round(p.stock) + qty } : p
        );
        b.supermarketState!.totalCost += cost;
        return b;
      }), cash: state.cash - cost };
    }
    case 'SUPERMARKET_RESTOCK_ALL': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.supermarketState) return state;
      let totalCost = 0;
      for (const p of biz.supermarketState.products) {
        const needed = p.maxStock - Math.round(p.stock);
        totalCost += needed * p.wholesalePrice;
      }
      if (state.cash < totalCost || totalCost <= 0) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.supermarketState!.products = b.supermarketState!.products.map(p => ({ ...p, stock: p.maxStock }));
        b.supermarketState!.totalCost += totalCost;
        return b;
      }), cash: state.cash - totalCost };
    }
    case 'SUPERMARKET_SET_PRICE': {
      return updateBiz(state, action.bizId, b => {
        b.supermarketState!.products = b.supermarketState!.products.map(p =>
          p.id === action.productId ? { ...p, retailPrice: Math.max(p.wholesalePrice, action.price) } : p
        );
        return b;
      });
    }
    case 'SUPERMARKET_HIRE_CASHIER': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.supermarketState || biz.supermarketState.cashiers >= biz.supermarketState.maxCashiers) return state;
      return updateBiz(state, action.bizId, b => {
        b.supermarketState!.cashiers++;
        return b;
      });
    }
    case 'SUPERMARKET_FIRE_CASHIER': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.supermarketState || biz.supermarketState.cashiers <= 1) return state;
      return updateBiz(state, action.bizId, b => {
        b.supermarketState!.cashiers--;
        return b;
      });
    }
    case 'SUPERMARKET_UPGRADE_STORE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.supermarketState) return state;
      const cost = biz.supermarketState.storeLevel * 10000;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.supermarketState!.storeLevel++;
        b.supermarketState!.maxCashiers++;
        b.supermarketState!.products = b.supermarketState!.products.map(p => ({
          ...p, maxStock: Math.round(p.maxStock * 1.2)
        }));
        return b;
      }), cash: state.cash - cost };
    }

    // STREAMING
    case 'STREAMING_LICENSE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.streamingState) return state;
      const content = biz.streamingState.availableContent.find(c => c.id === action.contentId);
      if (!content || state.cash < content.licenseCost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        const ss = b.streamingState!;
        ss.catalog.push(content);
        ss.availableContent = ss.availableContent.filter(c => c.id !== action.contentId);
        return b;
      }), cash: state.cash - content.licenseCost };
    }
    case 'STREAMING_SET_PRICE': {
      return updateBiz(state, action.bizId, b => {
        b.streamingState!.subscriptionPrice = Math.max(1, Math.min(50, action.price));
        return b;
      });
    }
    case 'STREAMING_UPGRADE_SERVER': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.streamingState) return state;
      const cost = biz.streamingState.serverLevel * 20000;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.streamingState!.serverLevel++;
        b.streamingState!.maxSubscribers += 1000;
        b.streamingState!.serverCostPerHour += 30;
        return b;
      }), cash: state.cash - cost };
    }
    case 'STREAMING_BUY_RECOMMENDATION': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.streamingState || biz.streamingState.recommendationEngine) return state;
      if (state.cash < 50000) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.streamingState!.recommendationEngine = true;
        return b;
      }), cash: state.cash - 50000 };
    }
    case 'STREAMING_BUY_ADS': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.streamingState || biz.streamingState.adNetwork) return state;
      if (state.cash < 30000) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.streamingState!.adNetwork = true;
        return b;
      }), cash: state.cash - 30000 };
    }

    // SECURITY
    case 'SECURITY_HIRE_AGENT': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.securityState || biz.securityState.agents.length >= biz.securityState.maxAgents) return state;
      const agent = generateSecurityAgent();
      const cost = agent.salary * 50;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.securityState!.agents.push(agent);
        return b;
      }), cash: state.cash - cost };
    }
    case 'SECURITY_FIRE_AGENT': {
      return updateBiz(state, action.bizId, b => {
        b.securityState!.agents = b.securityState!.agents.filter(a => a.id !== action.agentId);
        b.securityState!.units = b.securityState!.units.map(u => ({
          ...u, agentIds: u.agentIds.filter(id => id !== action.agentId)
        })).filter(u => u.agentIds.length > 0);
        return b;
      });
    }
    case 'SECURITY_CREATE_UNIT': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.securityState || action.agentIds.length === 0) return state;
      const usedAgents = new Set(biz.securityState.units.flatMap(u => u.agentIds));
      if (action.agentIds.some(id => usedAgents.has(id))) return state;
      return updateBiz(state, action.bizId, b => {
        b.securityState!.units.push({ id: randomId(), name: action.name, agentIds: action.agentIds });
        return b;
      });
    }
    case 'SECURITY_DISBAND_UNIT': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.securityState) return state;
      const unit = biz.securityState.units.find(u => u.id === action.unitId);
      if (!unit || unit.missionId) return state;
      return updateBiz(state, action.bizId, b => {
        b.securityState!.units = b.securityState!.units.filter(u => u.id !== action.unitId);
        return b;
      });
    }
    case 'SECURITY_ACCEPT_MISSION': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.securityState) return state;
      const mission = biz.securityState.availableMissions.find(m => m.id === action.missionId);
      if (!mission) return state;
      const units = action.unitIds.map(uid => biz.securityState!.units.find(u => u.id === uid)).filter(Boolean);
      if (units.some(u => u!.missionId)) return state;
      const totalScore = units.reduce((s2, u) => s2 + calcUnitScore(u!, biz.securityState!.agents, biz.securityState!.equipment), 0);
      if (totalScore < mission.requiredScore) return state;
      const now = Date.now();
      return updateBiz(state, action.bizId, b => {
        const sec = b.securityState!;
        sec.availableMissions = sec.availableMissions.filter(m => m.id !== action.missionId);
        sec.activeMissions.push({ ...mission, accepted: true, unitIds: action.unitIds, startedAt: now });
        for (const uid of action.unitIds) {
          sec.units = sec.units.map(u => u.id === uid ? { ...u, missionId: mission.id, busyUntil: now + mission.durationMs } : u);
        }
        return b;
      });
    }
    case 'SECURITY_BUY_EQUIPMENT': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.securityState) return state;
      const equip = biz.securityState.equipment.find(e => e.id === action.equipmentId);
      if (!equip || equip.owned || state.cash < equip.cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.securityState!.equipment = b.securityState!.equipment.map(e =>
          e.id === action.equipmentId ? { ...e, owned: true } : e
        );
        return b;
      }), cash: state.cash - equip.cost };
    }
    case 'SECURITY_REDEEM': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.securityState) return state;
      const mission = (biz.securityState.completedMissions || []).find(m => m.id === action.missionId);
      if (!mission) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.securityState!.completedMissions = (b.securityState!.completedMissions || []).filter(m => m.id !== action.missionId);
        b.securityState!.totalEarned += mission.payout;
        // Refresh missions if all done
        if (b.securityState!.availableMissions.length === 0 && b.securityState!.activeMissions.length === 0 && b.securityState!.completedMissions.length === 0) {
          b.securityState!.availableMissions = generateSecurityMissions();
        }
        return b;
      }), cash: state.cash + mission.payout, totalEarned: state.totalEarned + mission.payout };
    }

    // OIL
    case 'OIL_BUILD_SITE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.oilState || state.cash < biz.oilState.nextSiteCost) return state;
      const cost = biz.oilState.nextSiteCost;
      const siteNames = ['Sahara Alpha', 'Atlas Bravo', 'Rif Charlie', 'Souss Delta', 'Draa Echo', 'Gharb Foxtrot', 'Tadla Golf', 'Ziz Hotel'];
      const siteName = siteNames[biz.oilState.drillingSites.length % siteNames.length];
      const buildTime = 600000 + biz.oilState.drillingSites.length * 300000; // 10min + 5min per site
      const now = Date.now();
      return { ...updateBiz(state, action.bizId, b => {
        b.oilState!.drillingSites.push({
          id: randomId(), name: siteName,
          built: false, building: true,
          buildStartedAt: now, buildReadyAt: now + buildTime,
          machines: 0, maxMachines: 5,
          productionRate: 50, // 50 bbl/h per machine
        });
        b.oilState!.nextSiteCost = Math.round(cost * 1.8);
        return b;
      }), cash: state.cash - cost };
    }
    case 'OIL_ADD_MACHINE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.oilState) return state;
      const site = biz.oilState.drillingSites.find(s => s.id === action.siteId);
      if (!site || !site.built || site.machines >= site.maxMachines) return state;
      if (state.cash < biz.oilState.machineCost) return state;
      const cost = biz.oilState.machineCost;
      return { ...updateBiz(state, action.bizId, b => {
        b.oilState!.drillingSites = b.oilState!.drillingSites.map(s =>
          s.id === action.siteId ? { ...s, machines: s.machines + 1 } : s
        );
        return b;
      }), cash: state.cash - cost };
    }
    case 'OIL_SELL': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.oilState || biz.oilState.oilStored < action.quantity) return state;
      const revenue = action.quantity * biz.oilState.oilSellPrice;
      return { ...updateBiz(state, action.bizId, b => {
        b.oilState!.oilStored -= action.quantity;
        b.oilState!.totalRevenue += revenue;
        return b;
      }), cash: state.cash + revenue, totalEarned: state.totalEarned + revenue };
    }
    case 'OIL_UPGRADE_STORAGE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.oilState || state.cash < biz.oilState.storageUpgradeCost) return state;
      const cost = biz.oilState.storageUpgradeCost;
      return { ...updateBiz(state, action.bizId, b => {
        b.oilState!.storageCapacity += 5000;
        b.oilState!.storageUpgradeCost = Math.round(cost * 1.5);
        return b;
      }), cash: state.cash - cost };
    }

    // ISLANDS
    case 'BUY_ISLAND': {
      if (state.cash < action.cost) return state;
      if (state.ownedIslands.some(i => i.id === action.islandId)) return state;
      return { ...state, cash: state.cash - action.cost, ownedIslands: [...state.ownedIslands, { id: action.islandId, customName: action.name, purchasePrice: action.cost, buildings: [] }] };
    }
    case 'RENAME_ISLAND': {
      return { ...state, ownedIslands: state.ownedIslands.map(i => i.id === action.islandId ? { ...i, customName: action.name } : i) };
    }

    case 'BUY_ASSET': {
      if (state.cash < action.cost) return state;
      return { ...state, cash: state.cash - action.cost, ownedAssets: [...(state.ownedAssets || []), action.assetId] };
    }

    // PRODUCTION
    case 'PRODUCTION_HIRE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.productionState || biz.productionState.workers >= biz.productionState.maxWorkers) return state;
      const cost = biz.productionState.workerSalary * 100;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => { b.productionState!.workers++; return b; }), cash: state.cash - cost };
    }
    case 'PRODUCTION_FIRE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.productionState || biz.productionState.workers <= 0) return state;
      return updateBiz(state, action.bizId, b => { b.productionState!.workers--; return b; });
    }
    case 'PRODUCTION_SELL': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.productionState || biz.productionState.stored < action.amount) return state;
      const revenue = action.amount * biz.productionState.rawSellPrice;
      return { ...updateBiz(state, action.bizId, b => { b.productionState!.stored -= action.amount; return b; }), cash: state.cash + revenue, totalEarned: state.totalEarned + revenue };
    }
    case 'PRODUCTION_UPGRADE_STORAGE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.productionState) return state;
      const cost = (biz.productionState.upgradeLevel + 1) * 10000;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => { b.productionState!.storageCapacity += 500; b.productionState!.upgradeLevel++; return b; }), cash: state.cash - cost };
    }

    // FACTORY
    case 'FACTORY_SELL': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.factoryState || biz.factoryState.outputStored < action.amount) return state;
      const priceMult = 1 + (biz.factoryState.upgrades?.qualityControl || 0) * 0.20;
      const revenue = action.amount * biz.factoryState.sellPrice * priceMult;
      return { ...updateBiz(state, action.bizId, b => { b.factoryState!.outputStored -= action.amount; b.factoryState!.totalRevenue += revenue; return b; }), cash: state.cash + revenue, totalEarned: state.totalEarned + revenue };
    }
    case 'FACTORY_HIRE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.factoryState || biz.factoryState.workers >= biz.factoryState.maxWorkers) return state;
      const cost = biz.factoryState.workerSalary * 100;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => { b.factoryState!.workers++; return b; }), cash: state.cash - cost };
    }
    case 'FACTORY_FIRE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.factoryState || biz.factoryState.workers <= 0) return state;
      return updateBiz(state, action.bizId, b => { b.factoryState!.workers--; return b; });
    }
    case 'FACTORY_IMPORT': {
      const fromBiz = findBiz(state, action.fromBizId);
      const toBiz = findBiz(state, action.toBizId);
      if (!fromBiz?.productionState || !toBiz?.factoryState) return state;
      if (fromBiz.productionState.resourceType !== toBiz.factoryState.inputResource) return state;
      const amount = Math.min(action.amount, Math.floor(fromBiz.productionState.stored), toBiz.factoryState.inputCapacity - toBiz.factoryState.inputStored);
      if (amount <= 0) return state;
      let s2 = updateBiz(state, action.fromBizId, b => { b.productionState!.stored -= amount; return b; });
      s2 = updateBiz(s2, action.toBizId, b => { b.factoryState!.inputStored += amount; return b; });
      return s2;
    }
    case 'FACTORY_UPGRADE_STORAGE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.factoryState) return state;
      const cost = (biz.factoryState.upgradeLevel + 1) * 15000;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => { b.factoryState!.inputCapacity += 500; b.factoryState!.outputCapacity += 500; b.factoryState!.upgradeLevel++; return b; }), cash: state.cash - cost };
    }
    // Production upgrades
    case 'PRODUCTION_UPGRADE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.productionState) return state;
      const u = biz.productionState.upgrades;
      const level = u[action.upgrade];
      const maxLevels: Record<string, number> = { efficiency: 3, workerCapacity: 8, harvestTech: 3 };
      if (level >= maxLevels[action.upgrade]) return state;
      const costs: Record<string, number[]> = {
        efficiency: [8000, 20000, 50000],
        workerCapacity: [10000, 25000, 50000, 80000, 120000, 180000, 260000, 360000],
        harvestTech: [6000, 15000, 40000],
      };
      const cost = costs[action.upgrade][level];
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        const ps = b.productionState!;
        ps.upgrades = { ...ps.upgrades, [action.upgrade]: level + 1 };
        if (action.upgrade === 'workerCapacity') ps.maxWorkers += 5;
        return b;
      }), cash: state.cash - cost };
    }
    case 'PRODUCTION_SET_AUTO_EXPORT': {
      return updateBiz(state, action.bizId, b => {
        b.productionState!.upgrades = { ...b.productionState!.upgrades, autoExportTargetId: action.targetBizId };
        return b;
      });
    }
    // Factory upgrades
    case 'FACTORY_UPGRADE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.factoryState) return state;
      const u = biz.factoryState.upgrades;
      const level = u[action.upgrade];
      const maxLevels: Record<string, number> = { efficiency: 3, workerCapacity: 8, automation: 3, qualityControl: 3 };
      if (level >= maxLevels[action.upgrade]) return state;
      const costs: Record<string, number[]> = {
        efficiency: [12000, 30000, 75000],
        workerCapacity: [15000, 40000, 75000, 120000, 180000, 260000, 360000, 480000],
        automation: [10000, 25000, 60000],
        qualityControl: [20000, 50000, 120000],
      };
      const cost = costs[action.upgrade][level];
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        const fs = b.factoryState!;
        fs.upgrades = { ...fs.upgrades, [action.upgrade]: level + 1 };
        if (action.upgrade === 'workerCapacity') fs.maxWorkers += 5;
        return b;
      }), cash: state.cash - cost };
    }
    case 'FACTORY_TOGGLE_AUTO_SELL': {
      return updateBiz(state, action.bizId, b => {
        b.factoryState!.upgrades = { ...b.factoryState!.upgrades, autoSell: !b.factoryState!.upgrades.autoSell };
        return b;
      });
    }

    // AIRLINE
    case 'AIRLINE_BUY_PLANE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.airlineState) return state;
      const pt = AIRLINE_PLANE_TYPES.find(p => p.type === action.planeType);
      if (!pt || state.cash < pt.cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        b.airlineState!.planes.push({ id: randomId(), type: pt.type, name: pt.name, capacity: pt.capacity, speed: pt.speed, fuelPerKm: pt.fuelPerKm, maintenancePerH: pt.maintenancePerH });
        return b;
      }), cash: state.cash - pt.cost };
    }
    case 'AIRLINE_OPEN_ROUTE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.airlineState) return state;
      const cA = AIRLINE_CITIES.find(c => c.id === action.cityAId);
      const cB = AIRLINE_CITIES.find(c => c.id === action.cityBId);
      if (!cA || !cB || action.cityAId === action.cityBId) return state;
      if (biz.airlineState.routes.some(r => (r.cityAId === action.cityAId && r.cityBId === action.cityBId) || (r.cityAId === action.cityBId && r.cityBId === action.cityAId))) return state;
      const dist = getAirlineRouteDistance(action.cityAId, action.cityBId);
      const openCost = getAirlineRouteOpenCost(dist, cA.tier + cB.tier);
      if (state.cash < openCost) return state;
      const demand = getAirlineRouteDemand(cA, cB);
      const basePrice = Math.round(dist * 0.15 + 150);
      return { ...updateBiz(state, action.bizId, b => {
        b.airlineState!.routes.push({ id: `${action.cityAId}-${action.cityBId}`, cityAId: action.cityAId, cityBId: action.cityBId, distance: dist, demand, ticketPrice: basePrice });
        return b;
      }), cash: state.cash - openCost };
    }
    case 'AIRLINE_ASSIGN_PLANE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.airlineState) return state;
      const plane = biz.airlineState.planes.find(p => p.id === action.planeId);
      const route = biz.airlineState.routes.find(r => r.id === action.routeId);
      if (!plane || !route) return state;
      const pt = AIRLINE_PLANE_TYPES.find(p => p.type === plane.type);
      if (pt && route.distance > pt.range) return state;
      return updateBiz(state, action.bizId, b => {
        b.airlineState!.planes = b.airlineState!.planes.map(p => p.id === action.planeId ? { ...p, routeId: action.routeId } : p);
        return b;
      });
    }
    case 'AIRLINE_UNASSIGN_PLANE': {
      return updateBiz(state, action.bizId, b => {
        b.airlineState!.planes = b.airlineState!.planes.map(p => p.id === action.planeId ? { ...p, routeId: undefined } : p);
        return b;
      });
    }
    case 'AIRLINE_SET_TICKET': {
      return updateBiz(state, action.bizId, b => {
        b.airlineState!.routes = b.airlineState!.routes.map(r => r.id === action.routeId ? { ...r, ticketPrice: Math.max(10, action.price) } : r);
        return b;
      });
    }
    case 'AIRLINE_UPGRADE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.airlineState) return state;
      if (action.upgrade === 'fuel' && !biz.airlineState.fuelEfficiency) {
        if (state.cash < 200000) return state;
        return { ...updateBiz(state, action.bizId, b => { b.airlineState!.fuelEfficiency = true; return b; }), cash: state.cash - 200000 };
      }
      if (action.upgrade === 'loyalty' && !biz.airlineState.frequentFlyer) {
        if (state.cash < 150000) return state;
        return { ...updateBiz(state, action.bizId, b => { b.airlineState!.frequentFlyer = true; return b; }), cash: state.cash - 150000 };
      }
      if (action.upgrade === 'lounge') {
        const cost = (biz.airlineState.loungeLevel + 1) * 100000;
        if (state.cash < cost) return state;
        return { ...updateBiz(state, action.bizId, b => { b.airlineState!.loungeLevel++; return b; }), cash: state.cash - cost };
      }
      return state;
    }

    // HQ
    case 'BUILD_HQ': {
      if (state.hq?.built || state.hq?.building) return state;
      if (state.cash < HQ_COST) return state;
      const now = Date.now();
      return { ...state, cash: state.cash - HQ_COST, hq: { built: false, building: true, buildReadyAt: now + HQ_BUILD_TIME, level: 0, upgrades: { maxBusinesses: 0, incomeBoost: 0, tapBoost: 0, offlineHours: 0 } } };
    }
    case 'HQ_UPGRADE': {
      if (!state.hq?.built) return state;
      const def = HQ_UPGRADE_DEFS.find(d => d.key === action.upgrade);
      if (!def) return state;
      const currentLevel = (state.hq.upgrades as any)[action.upgrade] || 0;
      if (currentLevel >= def.maxLevel) return state;
      const cost = def.costs[currentLevel];
      if (state.cash < cost) return state;
      return { ...state, cash: state.cash - cost, hq: { ...state.hq, upgrades: { ...state.hq.upgrades, [action.upgrade]: currentLevel + 1 } } };
    }
    // Island building
    case 'ISLAND_BUILD': {
      const island = state.ownedIslands.find(i => i.id === action.islandId);
      if (!island) return state;
      const bDef = ISLAND_BUILDING_DEFS.find(d => d.type === action.buildingType);
      if (!bDef) return state;
      if ((island.buildings || []).some(b => b.type === action.buildingType)) return state;
      if (state.cash < bDef.baseCost) return state;
      const now = Date.now();
      const newBuilding = { id: randomId(), type: bDef.type, name: bDef.name, icon: bDef.icon, cost: bDef.baseCost, built: false, building: true, buildReadyAt: now + bDef.buildTime, incomePerHour: bDef.incomePerHour };
      return { ...state, cash: state.cash - bDef.baseCost, ownedIslands: state.ownedIslands.map(i => i.id === action.islandId ? { ...i, buildings: [...(i.buildings || []), newBuilding] } : i) };
    }

    // CASINO
    case 'CASINO_BUY_TABLE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.casinoState) return state;
      const ct = CASINO_TABLE_TYPES.find(t => t.type === action.tableType);
      if (!ct || state.cash < ct.cost) return state;
      return { ...updateBiz(state, action.bizId, b => {
        const existing = b.casinoState!.tables.find(t => t.type === action.tableType);
        if (existing) existing.count++;
        else b.casinoState!.tables.push({ type: action.tableType, count: 1 });
        return b;
      }), cash: state.cash - ct.cost };
    }
    case 'CASINO_HIRE_DEALER': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.casinoState || biz.casinoState.dealers >= biz.casinoState.maxDealers) return state;
      return updateBiz(state, action.bizId, b => { b.casinoState!.dealers++; return b; });
    }
    case 'CASINO_FIRE_DEALER': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.casinoState || biz.casinoState.dealers <= 0) return state;
      return updateBiz(state, action.bizId, b => { b.casinoState!.dealers--; return b; });
    }
    case 'CASINO_UPGRADE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.casinoState) return state;
      const costs: Record<string, number> = { security: 80000, vipLounge: 150000, freeBar: 60000, loyalty: 100000 };
      const cost = costs[action.upgrade] || 50000;
      if (state.cash < cost || (biz.casinoState.upgrades as any)[action.upgrade]) return state;
      return { ...updateBiz(state, action.bizId, b => {
        (b.casinoState!.upgrades as any)[action.upgrade] = true;
        return b;
      }), cash: state.cash - cost };
    }

    // NIGHT CLUB
    case 'NIGHTCLUB_HIRE_DJ': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.nightClubState || biz.nightClubState.djs.length >= 5 || state.cash < 5000) return state;
      const names = NIGHTCLUB_DJ_POOL;
      const dj = { id: randomId(), name: names[Math.floor(Math.random() * names.length)], quality: 3 + Math.floor(Math.random() * 7), salary: 30 + Math.floor(Math.random() * 50) };
      return { ...updateBiz(state, action.bizId, b => { b.nightClubState!.djs.push(dj); return b; }), cash: state.cash - 5000 };
    }
    case 'NIGHTCLUB_FIRE_DJ': {
      return updateBiz(state, action.bizId, b => { b.nightClubState!.djs = b.nightClubState!.djs.filter(d => d.id !== action.djId); return b; });
    }
    case 'NIGHTCLUB_SET_ENTRY': {
      return updateBiz(state, action.bizId, b => { b.nightClubState!.entryFee = Math.max(5, Math.min(100, action.price)); return b; });
    }
    case 'NIGHTCLUB_SET_DRINK_PRICE': {
      return updateBiz(state, action.bizId, b => { b.nightClubState!.drinkPrice = Math.max(3, action.price); return b; });
    }
    case 'NIGHTCLUB_RESTOCK': {
      const cost = action.qty * 3;
      if (state.cash < cost) return state;
      return { ...updateBiz(state, action.bizId, b => { b.nightClubState!.drinkStock += action.qty; return b; }), cash: state.cash - cost };
    }
    case 'NIGHTCLUB_HIRE_BARTENDER': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.nightClubState || biz.nightClubState.bartenders >= 6) return state;
      return updateBiz(state, action.bizId, b => { b.nightClubState!.bartenders++; return b; });
    }
    case 'NIGHTCLUB_UPGRADE': {
      const biz = findBiz(state, action.bizId);
      if (!biz?.nightClubState) return state;
      const costs: Record<string, number> = { soundSystem: 50000, lighting: 40000, smokeMachine: 25000, rooftop: 120000 };
      const cost = costs[action.upgrade] || 30000;
      if (state.cash < cost || (biz.nightClubState.upgrades as any)[action.upgrade]) return state;
      return { ...updateBiz(state, action.bizId, b => { (b.nightClubState!.upgrades as any)[action.upgrade] = true; return b; }), cash: state.cash - cost };
    }

    // ===== SOCIAL =====
    case 'SOCIAL_ACTION': {
      if (!state.socialState) return state;
      const mill = state.socialState.millionaires.find(m => m.id === action.millionaireId);
      const act = MILLIONAIRE_ACTIONS.find(a => a.id === action.actionId);
      if (!mill || !act) return state;
      if (state.cash < act.cost) return state;
      if (state.totalEarned < act.requiredWealth) return state;
      
      const now = Date.now();
      const cooldowns = state.socialState.actionCooldowns || {};
      const millCooldowns = cooldowns[action.millionaireId] || {};
      if (millCooldowns[action.actionId] && now < millCooldowns[action.actionId]) return state;

      const impressionMult = getImpressionFactor(state.totalEarned, mill.netWorth);
      const relationGain = Math.round(act.relationGain * impressionMult);
      const newRelation = Math.min(100, mill.relationship + relationGain);

      return {
        ...state,
        cash: state.cash - act.cost,
        socialState: {
          ...state.socialState,
          millionaires: state.socialState.millionaires.map(m =>
            m.id === action.millionaireId ? { ...m, relationship: newRelation } : m
          ),
          actionCooldowns: {
            ...cooldowns,
            [action.millionaireId]: {
              ...millCooldowns,
              [action.actionId]: now + act.cooldownMs,
            },
          },
        },
      };
    }

    case 'SOCIAL_ADD_FRIEND': {
      if (!state.socialState) return state;
      const mill = state.socialState.millionaires.find(m => m.id === action.millionaireId);
      if (!mill || mill.relationship < 80 || mill.isFriend) return state;

      return {
        ...state,
        socialState: {
          ...state.socialState,
          millionaires: state.socialState.millionaires.map(m =>
            m.id === action.millionaireId ? { ...m, isFriend: true } : m
          ),
        },
      };
    }

    case 'STOCK_BUY': {
      if (!state.socialState) return state;
      const stock = state.socialState.stocks.find(s => s.companyId === action.companyId);
      if (!stock) return state;
      const totalCost = stock.currentPrice * action.shares;
      if (state.cash < totalCost) return state;

      const existingHolding = state.socialState.holdings.find(h => h.companyId === action.companyId);
      let newHoldings;
      if (existingHolding) {
        const newShares = existingHolding.shares + action.shares;
        const newAvg = (existingHolding.avgBuyPrice * existingHolding.shares + totalCost) / newShares;
        newHoldings = state.socialState.holdings.map(h =>
          h.companyId === action.companyId ? { ...h, shares: newShares, avgBuyPrice: newAvg } : h
        );
      } else {
        newHoldings = [...state.socialState.holdings, {
          companyId: action.companyId,
          shares: action.shares,
          avgBuyPrice: stock.currentPrice,
        }];
      }

      return {
        ...state,
        cash: state.cash - totalCost,
        socialState: { ...state.socialState, holdings: newHoldings },
      };
    }

    case 'STOCK_SELL': {
      if (!state.socialState) return state;
      const holding = state.socialState.holdings.find(h => h.companyId === action.companyId);
      const stock = state.socialState.stocks.find(s => s.companyId === action.companyId);
      if (!holding || !stock || holding.shares < action.shares) return state;

      const revenue = stock.currentPrice * action.shares;
      const newShares = holding.shares - action.shares;
      let newHoldings;
      if (newShares <= 0) {
        newHoldings = state.socialState.holdings.filter(h => h.companyId !== action.companyId);
      } else {
        newHoldings = state.socialState.holdings.map(h =>
          h.companyId === action.companyId ? { ...h, shares: newShares } : h
        );
      }

      return {
        ...state,
        cash: state.cash + revenue,
        socialState: { ...state.socialState, holdings: newHoldings },
      };
    }

    default:
      return state;
  }
}

interface GameCtx {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const GameContext = createContext<GameCtx | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [offlineInfo] = useState(() => {
    const saved = loadGame();
    if (!saved) return null;
    const now = Date.now();
    const elapsed = Math.min(now - saved.lastTick, 8 * 60 * 60 * 1000);
    if (elapsed < 60000) return null;
    const cps = calcCashPerSec(saved);
    const minutes = Math.floor(elapsed / 60000);
    const income = cps * minutes * 60;
    return { elapsed, income };
  });

  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = loadGame();
    if (saved) {
      const now = Date.now();
      const elapsed = Math.min(now - saved.lastTick, 8 * 60 * 60 * 1000);
      const cps = calcCashPerSec(saved);
      if (cps > 0 && elapsed > 60000) {
        const minutes = Math.floor(elapsed / 60000);
        const income = cps * minutes * 60;
        saved.cash += income;
        saved.totalEarned += income;
      }
      for (const biz of saved.businesses) {
        if (biz.type === 'cafe' && biz.cafeState) {
          if (biz.cafeState.upgrades.hqBuildReadyAt && now >= biz.cafeState.upgrades.hqBuildReadyAt) {
            biz.cafeState.upgrades.hasHQ = true;
            biz.cafeState.upgrades.hqBuildReadyAt = undefined;
          }
          for (const loc of biz.cafeState.locations) {
            if (loc.status === 'building' && loc.buildReadyAt && now >= loc.buildReadyAt) {
              loc.status = 'no-employee';
              loc.buildReadyAt = undefined;
            }
          }
        }
        if (biz.type === 'agency' && biz.agencyState) {
          for (const search of biz.agencyState.recruitmentSearches) {
            if (!search.completed && now >= search.readyAt) {
              search.completed = true;
            }
          }
          for (const proj of biz.agencyState.projects) {
            if (proj.accepted && proj.startedAt) {
              const elapsed = now - proj.startedAt;
              proj.progress = Math.min(100, (elapsed / proj.durationMs) * 100);
              if (proj.progress >= 100) {
                saved.cash += proj.payout;
                saved.totalEarned += proj.payout;
                biz.agencyState.completedCount++;
                biz.agencyState.totalEarned += proj.payout;
                biz.agencyState.employees = biz.agencyState.employees.map(e =>
                  proj.assignedEmployees.includes(e.id) ? { ...e, busy: false, projectId: undefined } : e
                );
              }
            }
          }
          biz.agencyState.projects = biz.agencyState.projects.filter(p => p.progress < 100 || !p.accepted);
          if (biz.agencyState.availableProjects.length === 0) {
            biz.agencyState.availableProjects = generateAgencyProjects();
          }
        }
        // Complete real estate upgrades that finished offline
        if (biz.type === 'realestate' && biz.realEstateState) {
          for (const prop of biz.realEstateState.properties) {
            for (const u of prop.upgrades) {
              if (u.installing && u.installReadyAt && now >= u.installReadyAt) {
                u.installing = false;
                u.installed = true;
                u.installReadyAt = undefined;
                prop.currentValue *= (1 + u.valueBoost / 100);
                prop.rentalIncome = Math.round(prop.currentValue * 0.003);
              }
            }
          }
        }
        if (biz.type === 'highway' && biz.highwayState) {
          for (const route of biz.highwayState.routes) {
            if (route.building && route.buildReadyAt && now >= route.buildReadyAt) {
              route.built = true;
              route.building = false;
              route.buildReadyAt = undefined;
              route.buildStartedAt = undefined;
            }
          }
        }
        if (biz.type === 'streaming' && biz.streamingState) {
          const ss = biz.streamingState;
          const catalogPop = ss.catalog.reduce((s2, c) => s2 + c.popularity, 0);
          const priceFactor = Math.max(0.1, 1 - ss.subscriptionPrice / 30);
          const recoMult = ss.recommendationEngine ? 2 : 1;
          const growthPerHour = catalogPop * priceFactor * recoMult;
          const hours = Math.min(elapsed / 3600000, 8);
          ss.subscribers = Math.min(ss.maxSubscribers, ss.subscribers + growthPerHour * hours);
        }
        if (biz.type === 'security' && biz.securityState) {
          const sec = biz.securityState;
          sec.activeMissions = sec.activeMissions.filter(m => {
            if (m.startedAt && now >= m.startedAt + m.durationMs) {
              saved.cash += m.payout;
              saved.totalEarned += m.payout;
              sec.totalEarned += m.payout;
              for (const uid of m.unitIds) {
                const unit = sec.units.find(u => u.id === uid);
                if (unit) { unit.missionId = undefined; unit.busyUntil = undefined; }
              }
              return false;
            }
            return true;
          });
          if (sec.availableMissions.length === 0) {
            sec.availableMissions = generateSecurityMissions();
          }
        }
        if (biz.type === 'crypto' && biz.cryptoState) {
          const lastTick = biz.cryptoState.lastCryptoTick || saved.lastTick;
          const ticksElapsed = Math.min(Math.floor((now - lastTick) / 60000), 480);
          if (ticksElapsed > 0) {
            biz.cryptoState.coins = biz.cryptoState.coins.map(c => {
              let price = c.price;
              const hist = [...c.history];
              for (let t = 0; t < ticksElapsed; t++) {
                const change = price * (Math.random() - 0.5) * c.volatility * 2;
                price = Math.max(0.01, price + change);
                hist.push(price);
              }
              return { ...c, price, history: hist.slice(-60) };
            });
            biz.cryptoState.lastCryptoTick = now;
          }
        }
        // Complete oil construction offline
        if (biz.type === 'oil' && biz.oilState) {
          for (const site of biz.oilState.drillingSites) {
            if (site.building && site.buildReadyAt && now >= site.buildReadyAt) {
              site.built = true;
              site.building = false;
              site.buildReadyAt = undefined;
              site.buildStartedAt = undefined;
            }
          }
          // Offline oil production
          const hours = Math.min(elapsed / 3600000, 8);
          let totalProd = 0;
          for (const site of biz.oilState.drillingSites) {
            if (!site.built) continue;
            totalProd += site.machines * site.productionRate;
          }
          biz.oilState.oilStored = Math.min(biz.oilState.storageCapacity, biz.oilState.oilStored + totalProd * hours);
        }
        if (biz.type === 'production' && biz.productionState) {
          if (!biz.productionState.upgrades) biz.productionState.upgrades = { efficiency: 0, workerCapacity: 0, harvestTech: 0 };
          const hours = Math.min(elapsed / 3600000, 8);
          const effMult = 1 + biz.productionState.upgrades.efficiency * 0.25;
          biz.productionState.stored = Math.min(biz.productionState.storageCapacity, biz.productionState.stored + biz.productionState.workers * biz.productionState.productionRate * effMult * hours);
          // Auto-export offline
          if (biz.productionState.upgrades.autoExportTargetId) {
            const target = saved.businesses.find(b => b.id === biz.productionState!.upgrades.autoExportTargetId);
            if (target?.factoryState && target.factoryState.inputResource === biz.productionState.resourceType) {
              const space = target.factoryState.inputCapacity - target.factoryState.inputStored;
              const transfer = Math.min(biz.productionState.stored, space);
              if (transfer > 0) {
                biz.productionState.stored -= transfer;
                target.factoryState.inputStored += transfer;
              }
            }
          }
        }
        if (biz.type === 'factory' && biz.factoryState) {
          if (!biz.factoryState.upgrades) biz.factoryState.upgrades = { efficiency: 0, workerCapacity: 0, automation: 0, qualityControl: 0, autoSell: false };
          const hours = Math.min(elapsed / 3600000, 8);
          const effMult = 1 + biz.factoryState.upgrades.efficiency * 0.25;
          const canProcess = Math.min(biz.factoryState.inputStored, biz.factoryState.workers * biz.factoryState.conversionRate * effMult * hours);
          const space = biz.factoryState.outputCapacity - biz.factoryState.outputStored;
          const actual = Math.min(canProcess, space);
          biz.factoryState.inputStored -= actual;
          biz.factoryState.outputStored += actual;
          // Auto-sell offline
          if (biz.factoryState.upgrades.autoSell && biz.factoryState.outputStored > biz.factoryState.outputCapacity * 0.8) {
            const sellAmt = Math.floor(biz.factoryState.outputStored * 0.5);
            if (sellAmt > 0) {
              const priceMult = 1 + biz.factoryState.upgrades.qualityControl * 0.20;
              const revenue = sellAmt * biz.factoryState.sellPrice * priceMult;
              biz.factoryState.outputStored -= sellAmt;
              biz.factoryState.totalRevenue += revenue;
              saved.cash += revenue;
              saved.totalEarned += revenue;
            }
          }
        }
      }
      saved.lastTick = now;
      saved.lastIncomePayout = now;
      return saved;
    }
    return createInitialGameState();
  });

  useEffect(() => {
    if (!offlineInfo || offlineInfo.income <= 0) return;
    const mins = Math.floor(offlineInfo.elapsed / 60000);
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${remainMins}m` : `${mins}m`;
    setTimeout(() => {
      toast(`Welcome back! You were away for ${timeStr}`, {
        description: `You earned ${formatCash(offlineInfo.income)} while offline`,
        duration: 6000,
      });
    }, 500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;
      dispatch({ type: 'TICK', dt });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      saveGame(stateRef.current);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = () => saveGame(stateRef.current);
    window.addEventListener('beforeunload', handler);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handler();
    });
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export { formatCash };
