# Empire Tycoon

You are an expert mobile game designer and frontend developer.

Create a fully playable business simulator

optimized for mobile (touch-friendly, vertical layout, max-width 420px).



---



## CORE STRUCTURE — 2 MAIN TABS



### Tab 1 — 💰 HUSTLE (Cookie Clicker)

- Full screen with a large tap button (thumb-friendly, bottom-center)

- Displays: current cash (large animated counter), cash/sec, tap power

- Each tap earns $X, floating "+$X" animation on tap

- Tap upgrades purchasable here (cost cash, increase tap power)

- Background shows subtle animated cash particles



### Tab 2 — 🏢 BUSINESSES

- Shows a scrollable list of owned businesses as cards

- Each card: business icon, name, type, revenue/sec, a "Manage →" button

- At the top: a "+ New Business" button

- Opens a modal listing all available business types to purchase

- Each type shows: icon, name, description, unlock cost, what mechanic it uses

- Tapping "Manage →" on a card navigates to that business's dedicated screen

> Tu peux avoir plusieurs fois un business, en bref c'est pas tu debloque café tu gere un café, tu peux ouvrir plusieurs café, le menu nouveau business te permet de créer en echange d'argent un nouveau business

---



## NAVIGATION PATTERN

- 2 bottom tabs: Hustle | Businesses

- Each business opens a DEDICATED FULL SCREEN with its own UI

- Back button (top-left arrow) returns to the Businesses tab

- Each business screen is completely unique in layout and mechanics



---



## THE 6 BUSINESSES — Each with its own screen & mechanics



---



### 1. ☕ CAFÉ CHAIN

**Purchase cost:** $500

**Screen layout:**



#### Establishments Tab

- List of owned café locations (start with 1)

- Each location shows: name, revenue/day, status (Open/Needs restock)

- "Open New Location" button — costs money, adds a new café

- Each location can be renamed



#### Stock Management Tab

- 4 ingredients to manage: Coffee Beans, Milk, Sugar, Cups

- Each ingredient shows: current stock (units), consumption rate/day, reorder button

- If any stock hits 0 → that café stops generating revenue

- "Restock All" button costs money, refills everything

- Stock depletes in real-time (visible countdown bars)



#### Upgrades Tab

- Espresso Machine Upgrade — +20% revenue per location

- Loyalty Card Program — +15% customer retention (revenue bonus)

- Staff Training — reduces stock consumption rate by 20%

- New Menu Items (x3 tiers) — each adds flat revenue bonus



**Revenue logic:** Each open location with full stock generates passive income/sec.

Running out of stock pauses that location's income until restocked.



---



### 2. 💻 PROGRAMMING AGENCY

**Purchase cost:** $2,000

**Screen layout:**



#### Team Tab

- Grid of employee slots (start with 2 slots, expand up to 10)

- Each employee has: name, role (Junior/Mid/Senior Dev, Designer, PM), skill level (1-5), salary/day

- "Hire" button opens hiring panel: shows 3 random candidates with different skill/cost combos

- Employees can be fired (lose their current project assignment)



#### Projects Tab

- List of available client projects (3 visible at a time, refreshes every X seconds)

- Each project shows: name, required skills (e.g. "needs 2 Senior Devs + 1 Designer"), deadline, payout ($)

- "Accept Project" assigns required employees to it, locks them for the duration

- Progress bar shows project completion in real-time

- On completion: receive payout, employees become free again

- Declining a project removes it



#### Finance Tab

- Monthly salary expense (auto-deducted)

- Total projects completed

- Average project value

- "Expand Office" upgrade — unlocks more employee slots



**Revenue logic:** No passive income. Money comes ONLY from completing projects.

If you have idle employees, you're losing money (salaries still paid).



---



### 3. 🏠 REAL ESTATE

**Purchase cost:** $5,000

**Screen layout:**



#### Portfolio Tab

- List of owned properties, each showing:

- Property name/address, type (Apartment/House/Commercial), purchase price

- Current value (fluctuates slowly over time ±5% per day)

- Status: Vacant / Rented / Being Renovated / Listed for Sale

- "Buy Property" button → opens market (see Market Tab)



#### Market Tab

- 5 available properties to buy at any time (refreshes daily in-game)

- Each property: type, location tier (Downtown/Suburbs/Rural), price, estimated rental income

- Properties in Downtown cost more but appreciate faster

- "Buy" button purchases it and adds to portfolio



#### Management Tab (per property, tap a property to open)

- Choice: Rent it out (steady income/month) OR Renovate (costs money, increases value +20-40%) OR List for Sale

- Renovation takes time (progress bar), during which no rental income

- "Sell" button: list at current market value, sells instantly at 90% or wait for "full price" (takes longer)



**Revenue logic:** Rented properties generate passive income/sec.

Selling appreciated properties generates large lump sums.

Goal is to buy low, renovate, sell high OR hold and collect rent.



---



### 4. 📦 E-COMMERCE STORE

**Purchase cost:** $1,500

**Screen layout:**



#### Orders Tab

- Live feed of incoming orders (auto-generated, scroll up over time)

- Each order: product name, quantity, customer, payout, fulfillment deadline

- "Fulfill" button ships the order IF stock is available

- Missed orders (deadline passed) = refund + reputation hit (shown as %)

- Reputation affects order rate: low reputation = fewer orders coming in



#### Inventory Tab

- List of 5 products you sell

- Each product: name, stock level, reorder cost, selling price

- "Restock" button for each product (costs money, refills stock)

- Option to adjust selling price (higher price = more profit per order but fewer orders)

- "Add New Product" (costs $) — unlocks new product category = more order types



#### Logistics Tab

- Shipping speed: Standard / Express / Same-Day (each tier costs more but fulfills faster)

- Warehouse upgrade: increases max stock capacity

- "Auto-fulfill" toggle: when ON, orders auto-ship but you earn 10% less per order



**Revenue logic:** Money comes from fulfilling orders.

If out of stock = can't fulfill = lose reputation = fewer orders = less money.

Balance restock timing with order volume.



---



### 5. 📈 CRYPTO TRADING DESK

**Purchase cost:** $3,000

**Screen layout:**



#### Market Tab

- 5 fictional cryptocurrencies with live price charts (animated sparklines, prices update every 2 seconds)

- BitGold (BTG), EtherMoon (ETH), DogeFi (DGF), StableX (STX — low volatility), NovaCoin (NVC)

- Each coin shows: current price, 24h change %, mini chart

- "Buy" / "Sell" buttons with quantity input (+/- stepper)

- Portfolio value shown at top



#### Portfolio Tab

- Holdings list: coin, amount owned, avg buy price, current value, P&L (green/red)

- Total portfolio value, total invested, total P&L

- "Sell All" button per coin



#### Analytics Tab

- Simple indicators per coin: Trend (↑↑ / ↑ / → / ↓ / ↓↓)

- Volume indicator (High/Medium/Low)

- "Unlock Advanced Analytics" upgrade — shows more detailed signals

- Trading history log



**Revenue logic:** Pure buy/sell speculation. No passive income.

Prices fluctuate algorithmically. STX is safe, NVC is extremely volatile.

Player must actively trade to profit.



---



### 6. 🏦 PRIVATE BANK

**Purchase cost:** $20,000

**Screen layout:**



#### Vault Tab

- Shows: Capital Deposited, Interest Rate %, Daily Interest Earned

- Input field: deposit more capital from your cash balance

- Withdraw button (takes money out, stops generating interest on that amount)

- Interest compounds daily (in-game time)



#### Upgrades Tab (the main mechanic for this business)

- Linear upgrade tree, each upgrade unlocks the next:

1. Basic Savings Vault — 2% daily interest (default)

2. Investment Portfolio — 4% daily interest ($10k)

3. Derivatives Desk — +$500/day flat bonus ($50k)

4. Offshore Division — interest is tax-free (no deductions) ($200k)

5. Central Bank License — 8% daily interest + 1% of all other businesses' revenue ($1M)

6. Global Reserve Status — 15% daily interest + 2% of all businesses ($10M)



#### Clients Tab

- Accept "high-value clients" who deposit money with you

- Each client: deposit amount, interest you must pay them, net profit to you

- Limited slots (expand with upgrades)

- Clients leave if you miss an interest payment



**Revenue logic:** Pure passive income based on deposited capital and interest rate.

Most hands-off business. Reward for having lots of capital to park.



---



## GLOBAL SYSTEMS



### Time

- Game runs in real-time

- "Game Day" = 10 real minutes

- All timers, stock depletion, project deadlines based on game days



### Save System

- Auto-save to localStorage every 30 seconds

- Offline earnings: when player returns, passive businesses (Café, Real Estate, Bank) earned while away (up to 8 hours)

- Crypto, E-commerce, Programming: no offline earnings (require active management)



### Cash Display

- Always visible at top of every screen

- Format: $1,234,567 with animated count-up

- Net worth shown in smaller text below



---



## VISUAL STYLE



- **Background:** #F8F9FA (near white)

- **Cards:** Pure white, 12px radius, subtle shadow

- **Accent color:** #1DB954 (Spotify green) for positive actions

- **Danger color:** #FF4757 for losses, warnings

- **Font:** "DM Sans" from Google Fonts — clean, modern, readable

- **Icons:** Emoji for business types, simple SVG icons for UI elements

- **Numbers:** Always animated count-up, color-coded (green = gain, red = loss)

- **Buttons:** Rounded pill style, solid fill for primary, outline for secondary

- **Charts:** Simple CSS/canvas sparklines, no heavy libraries



---



## TECHNICAL REQUIREMENTS

- Google Fonts allowed (DM Sans)

- Game loop: setInterval every 100ms for income ticks

- LocalStorage for full game state persistence

- Touch events (touchstart/end) + mouse fallback

- Mobile-first: max-width 420px, centered on desktop

- Screen navigation: simple JS show/hide divs (no router needed)

- Each business screen is a separate <div> toggled visible/hidden



---



## TONE

Satisfying, clean, and deep.

Every business should feel like a different mini-game.

The player should always feel in control and always have something to optimize.

Numbers going up = dopamine. Make it feel premium.



Build the complete, fully playable game.



ALSO, make the game that you can put it as an app on homescreen with IOS

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hustle-and-flow-inc.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5ac348c0-d02b-4b77-acf7-0b2a8633b467).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
