export type Role = 'user' | 'admin';

export type User = {
  id: string;
  role: Role;
  status: 'active' | 'suspended';
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  /** Contact email shown on the profile; falls back to `loginEmail`. */
  email: string;
  loginEmail: string;
  phone: string;
  avatar: string | null;
  language: string;
  balance: number;
  /** True once a withdrawal PIN is set. */
  doubleLedgerPassword: boolean;
  createdAt: string;
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
  image: string | null;
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
    /** True until the trader has an approved deposit; `items` is empty meanwhile. */
    depositRequired: boolean;
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
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  amount: number;
  direction: 'credit' | 'debit';
};

export type Language = { code: string; label: string };

/** A company wallet traders pay into. */
export type Wallet = {
  id: string;
  coin: string;
  network: string;
  address: string;
};

/* --------------------------------------------------------------- admin */

export type Paged<T> = { total: number; items: T[] };

export type Member = User & {
  inviteCode: string;
  /** Max per withdrawal request; 0 = no limit. */
  withdrawalLimit: number;
  lastLoginAt: string | null;
  /** Assigned orders are visible to the member only once this is true. */
  hasApprovedDeposit: boolean;
};

export type MemberInput = {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  email?: string;
  role?: Role;
  withdrawalLimit?: number;
  password?: string;
};

export type CatalogProduct = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  profitPercentage: number;
  /** Whether the member being managed already has an open order for it. */
  assigned: boolean;
};

export type LedgerEntry = Transaction & {
  type: 'deposit' | 'withdrawal' | 'adjustment' | 'order_purchase' | 'order_sale';
  coin: string | null;
  network: string | null;
  /** Deposit: company wallet paid into. Withdrawal: member's destination. */
  address: string | null;
  receiptName: string | null;
  hasReceipt: boolean;
  note: string | null;
  reviewedAt: string | null;
};

/** A deposit/withdrawal in the admin Financials queue. */
export type FinancialRequest = LedgerEntry & {
  member: { id: string; displayName: string; email: string };
};

export type AuditEntry = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
  actor: { id: string; handle: string; role: Role } | null;
};
