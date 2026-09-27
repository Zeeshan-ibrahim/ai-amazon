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

/** A plan as both apps see it — admins manage it, traders activate it. */
export type Plan = {
  id: string;
  name: string;
  /** Short label shown as a badge, e.g. "Gold". */
  tag: string;
  description: string;
  /** In USDT. */
  price: number;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanInput = {
  name: string;
  tag: string;
  description: string;
  price: number;
  imageUrl: string;
};

export type ContractStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

/** A trader's activation of a plan. `price` is what was debited. */
export type Contract = {
  id: string;
  planId: string;
  planName: string;
  tag: string;
  price: number;
  status: ContractStatus;
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

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'adjustment'
  | 'order_purchase'
  | 'order_sale'
  | 'plan_activation';

export type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  createdAt: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  amount: number;
  direction: 'credit' | 'debit';
  coin: string | null;
  network: string | null;
  /** Deposit: company wallet paid into. Withdrawal: member's destination. */
  address: string | null;
  /** When an admin approved or rejected it; settlements are stamped on creation. */
  reviewedAt: string | null;
};

export type FaqItem = { id: string; question: string; answer: string };

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

/** A catalog product on the admin Products screen. */
export type AdminProduct = {
  id: string;
  title: string;
  image: string | null;
  description: string;
  price: number;
  /** Return on the entry price, e.g. 2.5 for 2.5%. */
  profitPercentage: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  title: string;
  price: number;
  profitPercentage: number;
  imageUrl: string;
  description: string;
};

export type OrderStatus = 'assigned' | 'purchased' | 'completed';

/** A member's order as the admin sees it (Orders tab, right column). */
export type AdminOrder = {
  id: string;
  productId: string;
  title: string;
  image: string | null;
  price: number;
  profitPercentage: number;
  profit: number;
  totalReturn: number;
  status: OrderStatus;
  assignedAt: string;
  purchasedAt: string | null;
  completedAt: string | null;
};

export type AdminOrderEdit = Partial<Pick<AdminOrder, 'price' | 'profitPercentage' | 'status'>>;

/** The admin's view of a transaction: adds the receipt and internal note. */
export type LedgerEntry = Transaction & {
  receiptName: string | null;
  hasReceipt: boolean;
  note: string | null;
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
