/**
 * Demo (in-memory) data source.
 *
 * Everything the API serves that has not moved to Postgres yet. Users,
 * balances, products, orders, plans, transactions and deposit wallets already
 * live in Postgres. Each export below will
 * become a table as its rules are defined, so keep the shapes stable — the
 * frontend types mirror them 1:1.
 */

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
  requiredOrders: 25,
  notice: {
    eyebrow: 'Mandatory tradings',
    title: 'Order arbitrage threshold requirement',
    quote: 'Users must complete 25 orders whenever they start working.',
    footnote: 'Orders guaranteed by Amazon liquidation matched pools.',
  },
};

export const planMeta = {
  title: 'Store Logistics Partnership Packages',
  subtitle:
    'Partner directly with top-tier international digital retail houses. Secure high priority slots on bulk liquidation parcels and receive immediate yield distributions upon transaction close.',
  guarantee:
    'All committed logistic partnership capitals on "Quick on Amazon" are 100% principal insured under our dynamic retail reserve policy protocols. Yield paybacks are computed dynamically and processed autonomously back to your balance wallet directly following Super Admin auditing.',
};

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '简体中文' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

/** Help & Platform FAQ, in display order. Answers describe the rules the API enforces. */
export const faq = [
  {
    id: 'unlock',
    question: 'Why can’t I see any orders yet?',
    answer:
      'Orders assigned to you stay hidden until your first deposit is approved. Open Deposit, pay into one of the listed company wallets and upload the receipt — once an admin approves it, your queue unlocks.',
  },
  {
    id: 'deposit-time',
    question: 'How long does a deposit take?',
    answer:
      'Deposits stay Pending until an admin checks your receipt. Your balance moves only when the deposit is approved. You can follow every request under Deposit Records.',
  },
  {
    id: 'purchase-sell',
    question: 'How do purchasing and selling work?',
    answer:
      'Purchasing an order deducts its price from your balance and moves it to Sell Products. Selling it pays back the price plus the order’s profit percentage and moves it to Completed Orders.',
  },
  {
    id: 'insufficient',
    question: 'What if my balance is too low for an order?',
    answer:
      'The order card shows exactly how much is missing. Make a deposit for at least that amount; once it is approved you can purchase the order.',
  },
  {
    id: 'withdraw',
    question: 'How do I withdraw?',
    answer:
      'Open Withdraw, enter the amount and your USDT (TRC20) address, and confirm with your withdrawal PIN. The request is reviewed by an admin, and the balance is deducted when it is approved. Your account may have a maximum amount per withdrawal.',
  },
  {
    id: 'pin',
    question: 'What is the withdrawal PIN?',
    answer:
      'A second 4–6 digit password that protects withdrawals. Set it under Manage Settings → Withdrawal PIN; the first time, your login password authorizes it.',
  },
  {
    id: 'rejected',
    question: 'My request was rejected. What now?',
    answer:
      'A rejected deposit or withdrawal never moves your balance. Check the details under Deposit or Withdrawal Records and submit a new request, or contact support.',
  },
];
