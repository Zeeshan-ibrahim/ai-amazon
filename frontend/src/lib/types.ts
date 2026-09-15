export type User = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  loginEmail: string;
  phone: string;
  avatar: string;
  status: string;
  role: string;
  balance: number;
  doubleLedgerPassword: boolean;
  language: string;
};

export type Stat = {
  id: string;
  label: string;
  value: number;
  format: 'currency' | 'count-plus';
  icon: 'flame' | 'bars' | 'box';
};

export type Tutorial = { eyebrow: string; title: string; body: string };

export type Capability = { id: string; label: string; value: string };

export type Campaign = { id: string; title: string; body: string };

export type TopEarner = {
  rank: string;
  name: string;
  title: string;
  earned: number;
  avatar: string;
};

export type DashboardPayload = {
  user: User;
  stats: Stat[];
  balance: number;
  tutorial: Tutorial;
  capabilities: Capability[];
  campaigns: Campaign[];
  topEarners: TopEarner[];
};

export type LiveDeposit = { id: string; amount: number; status: string };

export type ProductTab = 'purchase' | 'sell' | 'completed';
export type ProductState = 'assigned' | 'awaiting' | 'completed';

export type Product = {
  id: string;
  name: string;
  image: string;
  amount: number;
  profitPercentage: number;
  expectedProfit: number;
  totalReturn: number;
  assignedDate: string;
  completedDate?: string;
  state: ProductState;
  tab: ProductTab;
};

export type ProductsPayload = {
  meta: {
    availableBalance: number;
    completed: number;
    requiredOrders: number;
    notice: {
      eyebrow: string;
      title: string;
      quote: string;
      footnote: string;
    };
  };
  items: Product[];
  counts: Record<ProductTab, number>;
};

export type Plan = {
  id: string;
  index: string;
  name: string;
  partner: string;
  cycleDays: number;
  investment: number;
  dailyYield: number;
  estimatedYield: number;
  totalPayout: number;
  description: string;
};

export type Contract = {
  id: string;
  planId: string;
  planName: string;
  investment: number;
  totalPayout: number;
  status: string;
  createdAt: string;
};

export type PlansPayload = {
  meta: {
    title: string;
    subtitle: string;
    guarantee: string;
    availableBalance: number;
  };
  items: Plan[];
  contracts: Contract[];
};

export type Transaction = {
  id: string;
  title: string;
  createdAt: string;
  status: string;
  amount: number;
  direction: 'credit' | 'debit';
};

export type Language = { code: string; label: string };

export type DepositAsset = {
  id: string;
  symbol: string;
  network: string;
  networkLabel: string;
  address: string;
  confirmations: string;
  minAmount: number;
};
