/**
 * Demo (in-memory) data source.
 *
 * Everything the API serves lives here for now. When we introduce a real
 * database each exported object below becomes a table / collection, so keep
 * the shapes stable — the frontend types mirror them 1:1.
 */

export const user = {
  id: 'USER_d7a751',
  firstName: 'Sarah',
  lastName: 'John',
  displayName: 'Alexandra Vance',
  username: '',
  email: '123@gmail.com',
  loginEmail: 'avance@email.com',
  phone: '355466587',
  avatar:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces',
  status: 'ACTIVE TRADER',
  role: 'user',
  balance: 122.0,
  doubleLedgerPassword: true,
  language: 'en',
};

export const dashboardStats = [
  { id: 'earnings', label: 'Earnings Tofay', value: 15493790, format: 'currency', icon: 'flame' },
  { id: 'profits', label: 'Profits Distributed:', value: 10576481, format: 'currency', icon: 'bars' },
  { id: 'orders', label: 'Completed Orders:', value: 186876, format: 'count-plus', icon: 'box' },
];

export const tutorial = {
  eyebrow: 'Arbitrage Tutorial',
  title: 'How can I earn with "Quick on Amazon"?',
  body:
    'It is simple! Access the "Products" screen to view current active Amazon store items. Make a wholesale "Purchase" on eligible lots, then pivot straight to the "Sell Products" tab to broadcast them as completed items. We immediately pay back your Initial Price plus the arbitrage margin straight into your ledger balance.',
};

export const capabilities = [
  { id: 'verification', label: 'Order verification', value: 'Instant Payback' },
  { id: 'success', label: 'Arbitrage success', value: '100% Guaranteed' },
  { id: 'goal', label: 'Required orders goal', value: '25 cycles / day' },
  { id: 'partners', label: 'Partner networks', value: 'Amazon, Alibaba' },
];

export const campaigns = [];

export const topEarners = [
  {
    rank: '01',
    name: 'William Rodriguez',
    title: 'Master Arbitrage Specialist',
    earned: 168900.5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces',
  },
  {
    rank: '02',
    name: 'Isabella Wilson',
    title: 'Diamond Partner Retail Yield',
    earned: 189450.3,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces',
  },
  {
    rank: '03',
    name: 'James Carter',
    title: 'Global Logistics Fulfillment',
    earned: 171240.6,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces',
  },
];

export const liveDeposits = [
  { id: 'd1', amount: 10367, status: 'VERIFIED' },
  { id: 'd2', amount: 14211, status: 'VERIFIED' },
  { id: 'd3', amount: 16372, status: 'VERIFIED' },
  { id: 'd4', amount: 13834, status: 'VERIFIED' },
  { id: 'd5', amount: 9120, status: 'VERIFIED' },
  { id: 'd6', amount: 21480, status: 'VERIFIED' },
];

export const productsMeta = {
  availableBalance: 120.63,
  completed: 12,
  requiredOrders: 25,
  notice: {
    eyebrow: 'Mandatory tradings',
    title: 'Order arbitrage threshold requirement',
    quote: 'Users must complete 25 orders whenever they start working.',
    footnote: 'Orders guaranteed by Amazon liquidation matched pools.',
  },
};

export const products = [
  {
    id: 'ORD-1001',
    name: 'OEMTOOLS OEM24884 30 Inch Oscillating Wall Fan',
    image:
      'https://images.unsplash.com/photo-1614547164905-5f9e0ac3bcb1?w=800&h=800&fit=crop',
    amount: 180.0,
    profitPercentage: 4,
    expectedProfit: 7.2,
    totalReturn: 187.2,
    assignedDate: '2026-08-08',
    state: 'assigned',
    tab: 'purchase',
  },
  {
    id: 'ORD-1002',
    name: 'Anker 737 Power Bank PowerCore 24K',
    image:
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=800&fit=crop',
    amount: 96.5,
    profitPercentage: 4,
    expectedProfit: 3.86,
    totalReturn: 100.36,
    assignedDate: '2026-08-07',
    state: 'awaiting',
    tab: 'purchase',
  },
  {
    id: 'ORD-0994',
    name: 'Ninja AF101 Air Fryer 4 Quart',
    image:
      'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&h=800&fit=crop',
    amount: 129.99,
    profitPercentage: 4,
    expectedProfit: 5.2,
    totalReturn: 135.19,
    assignedDate: '2026-08-06',
    state: 'assigned',
    tab: 'sell',
  },
  {
    id: 'ORD-0981',
    name: 'Logitech MX Master 3S Wireless Mouse',
    image:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop',
    amount: 99.0,
    profitPercentage: 4,
    expectedProfit: 3.96,
    totalReturn: 102.96,
    assignedDate: '2026-08-04',
    completedDate: '2026-08-05',
    state: 'completed',
    tab: 'completed',
  },
  {
    id: 'ORD-0975',
    name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
    image:
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&h=800&fit=crop',
    amount: 89.95,
    profitPercentage: 4,
    expectedProfit: 3.6,
    totalReturn: 93.55,
    assignedDate: '2026-08-03',
    completedDate: '2026-08-03',
    state: 'completed',
    tab: 'completed',
  },
];

export const plans = [
  {
    id: 'silver',
    index: '01',
    name: 'Silver',
    partner: 'Amazon Partner',
    cycleDays: 7,
    investment: 50,
    dailyYield: 4,
    estimatedYield: 2,
    totalPayout: 52,
    description:
      'Entry-level trading package backed by high-demand Amazon consumer products.',
  },
  {
    id: 'gold',
    index: '02',
    name: 'Gold',
    partner: 'Alibaba Partner',
    cycleDays: 15,
    investment: 500,
    dailyYield: 8,
    estimatedYield: 40,
    totalPayout: 540,
    description:
      'Professional package backed by industrial wholesale logistics via Alibaba.',
  },
  {
    id: 'platinum',
    index: '03',
    name: 'Platinum',
    partner: 'Walmart Partner',
    cycleDays: 30,
    investment: 1000,
    dailyYield: 12,
    estimatedYield: 120,
    totalPayout: 1120,
    description:
      'Elite investment package leveraging Walmart distribution chains.',
  },
  {
    id: 'diamond',
    index: '04',
    name: 'Diamond',
    partner: 'AliExpress Partner',
    cycleDays: 60,
    investment: 5000,
    dailyYield: 15,
    estimatedYield: 750,
    totalPayout: 5750,
    description:
      'Ultimate trading portfolio built on worldwide volume express arbitrage.',
  },
];

export const planMeta = {
  title: 'Store Logistics Partnership Packages',
  subtitle:
    'Partner directly with top-tier international digital retail houses. Secure high priority slots on bulk liquidation parcels and receive immediate yield distributions upon transaction close.',
  guarantee:
    'All committed logistic partnership capitals on "Quick on Amazon" are 100% principal insured under our dynamic retail reserve policy protocols. Yield paybacks are computed dynamically and processed autonomously back to your balance wallet directly following Super Admin auditing.',
  availableBalance: 0,
};

export const myContracts = [];

export const transactions = [
  {
    id: 'tx_2',
    title: 'User successfully logged in at 8/8/2026, 8:58:17 PM',
    createdAt: '2026-08-08T20:58:17.000Z',
    status: 'COMPLETED',
    amount: 0,
    direction: 'debit',
  },
  {
    id: 'tx_1',
    title: 'Account successfully created.',
    createdAt: '2026-08-08T20:58:16.000Z',
    status: 'COMPLETED',
    amount: 0,
    direction: 'debit',
  },
];

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '简体中文' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

export const depositAssets = [
  {
    id: 'usdt-trc20',
    symbol: 'USDT',
    network: 'TRC20',
    networkLabel: 'Network: TRON (TRC20)',
    address: '0x7E0d4e9d377D428a4C6438dbA8a3636088c279c6',
    confirmations: '1 Network Block',
    minAmount: 10,
  },
  {
    id: 'usdt-erc20',
    symbol: 'USDT',
    network: 'ERC20',
    networkLabel: 'Network: ETHEREUM (ERC20)',
    address: '0x9Fb2c41Ad7Aa1Cc0Ee8B5d2F4a1937Ef55De9021',
    confirmations: '12 Network Blocks',
    minAmount: 10,
  },
  {
    id: 'btc',
    symbol: 'Bitcoin',
    network: 'BTC',
    networkLabel: 'Network: BITCOIN',
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    confirmations: '2 Network Blocks',
    minAmount: 10,
  },
];
