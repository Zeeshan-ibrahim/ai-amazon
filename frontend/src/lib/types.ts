/** See docs/roles.md. Both admin roles use the admin portal. */
export type Role = 'user' | 'sub_admin' | 'super_admin';

export const ADMIN_ROLES: readonly Role[] = ['super_admin', 'sub_admin'];

/** The sub-admin who created a record; null means the super-admin owns it. */
export type AddedBy = { id: string; handle: string } | null;

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

/** A promotional banner — admins manage it, traders see it on the dashboard. */
export type Banner = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  /** Pre-filled message for the Telegram support chat when the banner is tapped. */
  supportNote: string;
  createdAt: string;
  updatedAt: string;
};

export type BannerInput = {
  title: string;
  description: string;
  imageUrl: string;
  supportNote: string;
};

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
  banners: Banner[];
  /** Telegram support link from the admin Wallets & Support screen. */
  supportUrl: string | null;
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
  | 'plan_activation'
  | 'plan_refund';

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
  /** The sub-admin who owns this account. Only traders can have one. */
  addedBy: AddedBy;
};

export type MemberInput = {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  email?: string;
  /** Super-admin only, like `status` and `ownerId`. */
  role?: Role;
  status?: User['status'];
  /** The owning sub-admin's id; null hands the account to the super-admin. */
  ownerId?: string | null;
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
  /** null = the super-admin's shared catalog. */
  addedBy: AddedBy;
  /** False for shared products a sub-admin can assign but not change. */
  editable: boolean;
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
  /** `role` is `sub_admin` for a sub-admin's own request (super-admins only see those). */
  member: { id: string; displayName: string; email: string; role: Role };
};

export type WalletInput = Omit<Wallet, 'id'>;

/** Group-wide settings from the admin Wallets & Support screen. */
export type Settings = {
  telegramSupportUrl: string | null;
  /** Max per withdrawal for members without their own limit; 0 = no limit. */
  globalWithdrawalLimit: number;
  updatedAt: string;
};

/** The admin Group Overview (My Acc). */
export type AdminOverview = {
  /** Accounts with role `user`. */
  members: number;
  activeProducts: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  /** Sum of all member balances right now. */
  totalVolume: number;
  /** All-time total of approved deposits. */
  approvedDeposits: number;
  diagnostics: {
    admin: { role: Role; username: string; email: string };
    database: { connected: boolean; latencyMs: number | null };
    /** Last applied migration, e.g. "012_settings". */
    schema: { version: string; appliedAt: string } | null;
  };
  generatedAt: string;
};

/** A plan activation in the admin Plan Requests queue. */
export type PlanRequest = Contract & {
  image: string | null;
  reviewedAt: string | null;
  member: { id: string; displayName: string; email: string };
};

export type AuditEntry = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
  actor: { id: string; handle: string; role: Role } | null;
};

/** A plan on the admin Plans screen. */
export type AdminPlan = Plan & { addedBy: AddedBy };

/** A row on the super-admin's Sub-admins page. */
export type SubAdmin = User & {
  inviteCode: string;
  lastLoginAt: string | null;
  stats: {
    members: number;
    /** Sum of their members' balances. */
    memberBalance: number;
    plans: number;
    products: number;
    /** The sub-admin's own deposit/withdrawal requests awaiting a super-admin. */
    pendingRequests: number;
  };
};

export type SubAdminDetail = {
  subAdmin: SubAdmin;
  members: Paged<Member>;
  plans: AdminPlan[];
  products: Paged<AdminProduct>;
};

/** A sub-admin's My Balance screen. */
export type AdminBalance = {
  balance: number;
  transactions: Transaction[];
  wallets: Wallet[];
};
