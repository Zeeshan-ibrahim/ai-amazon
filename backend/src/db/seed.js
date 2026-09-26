/**
 * Development data. Safe to re-run: each section only fills what's missing.
 * Never run against production.
 *
 *   trader@demo.test  approved deposit → sees their assigned orders
 *   locked@demo.test  pending deposit only → assigned orders stay hidden
 *                     until an admin approves it (Members → Ledger)
 *   admin@demo.test   admin panel
 */
import { pool, query } from './pool.js';
import { findByEmail, hashSecret, ROLES } from '../models/users.js';

const PASSWORD = 'password123';

if (process.env.NODE_ENV === 'production') {
  console.error('refusing to seed demo data in production');
  process.exit(1);
}

/* ------------------------------------------------------------ accounts */

const accounts = [
  {
    email: 'trader@demo.test',
    role: ROLES.USER,
    username: 'avance',
    first_name: 'Alexandra',
    last_name: 'Vance',
    contact_email: 'avance@email.com',
    phone: '355466587',
    avatar_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces',
    balance: 122,
    withdrawal_pin: '1234',
  },
  {
    email: 'locked@demo.test',
    role: ROLES.USER,
    username: 'ohaddad',
    first_name: 'Omar',
    last_name: 'Haddad',
    balance: 0,
  },
  { email: 'mia.chen@demo.test', role: ROLES.USER, username: 'miachen', first_name: 'Mia', last_name: 'Chen', balance: 4210.5 },
  { email: 'leo.martins@demo.test', role: ROLES.USER, username: 'leom', first_name: 'Leo', last_name: 'Martins', balance: 318.2 },
  { email: 'admin@demo.test', role: ROLES.ADMIN, username: 'admin', balance: 0 },
];

for (const { withdrawal_pin, ...account } of accounts) {
  if (await findByEmail(account.email)) continue;
  const row = {
    ...account,
    password_hash: await hashSecret(PASSWORD),
    withdrawal_pin_hash: withdrawal_pin ? await hashSecret(withdrawal_pin) : null,
  };
  const columns = Object.keys(row);
  await query(
    `INSERT INTO users (${columns.join(', ')})
     VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})`,
    Object.values(row)
  );
  console.log(`created ${account.email} (${account.role}) / ${PASSWORD}`);
}

/* ------------------------------------------------------------- catalog */

const img = (id) => `https://images.unsplash.com/${id}?w=800&h=800&fit=crop`;

// [title, price, profit %, image?] — spread across the admin's price segments.
const catalog = [
  ['OEMTOOLS OEM24884 30 Inch Oscillating Wall Fan', 180, 4, img('photo-1614547164905-5f9e0ac3bcb1')],
  ['Anker 737 Power Bank PowerCore 24K', 96.5, 4, img('photo-1609091839311-d5365f9ff1c5')],
  ['Ninja AF101 Air Fryer 4 Quart', 129.99, 4, img('photo-1626074353765-517a681e40be')],
  ['Logitech MX Master 3S Wireless Mouse', 99, 4, img('photo-1527864550417-7fd91fc51a46')],
  ['Instant Pot Duo 7-in-1 Electric Pressure Cooker', 89.95, 4, img('photo-1585515320310-259814833e62')],
  ['Kindle Paperwhite Signature Edition 32GB', 189.99, 3.5],
  ['JBL Charge 5 Portable Bluetooth Speaker', 179.95, 3.2],
  ['Dyson V8 Origin Cordless Vacuum', 349.99, 2.8],
  ['Breville Bambino Plus Espresso Machine', 499.95, 2.5],
  ['Sony WH-1000XM5 Noise Cancelling Headphones', 398, 2.4],
  ['iRobot Roomba j7+ Self-Emptying Robot Vacuum', 799.99, 1.9],
  ['Apple iPad Air 11-inch M2 128GB', 599, 1.6],
  ['Traeger Pro 575 Wood Pellet Grill', 899.99, 1.4],
  ['Samsung 55" Class OLED S90D 4K Smart TV', 1499.99, 1.1],
  ['Peloton Bike Basics Package', 1445, 0.9],
  ['DJI Mavic 3 Classic Drone with RC', 1599, 0.8],
  ['Canon EOS R6 Mark II Mirrorless Body', 2499, 0.6],
  ['Apple MacBook Pro 14" M3 Pro 18GB 512GB', 1999, 0.5],
  ['755 808 940 1064nm Diode Laser Machine Commercial', 3059, 0.1],
  ['Cabbing Machine 6" 1/4HP 1800RPM Lapidary Grinder', 4727, 0.03],
  ['Sonoscape S2 Portable Ultrasound Machine with Transducer', 4950, 0.1],
  ['Cold Laser Therapy Machine 30W 810nm 980nm', 4078, 0.3],
  ['Bambu Lab X1 Carbon 3D Printer Combo', 1449, 0.7],
  ['Rolex-Style Automatic Diver Watch Collector Lot', 6200, 0.08],
  ['Commercial Ice Cream Machine 3-Flavor Soft Serve', 5480, 0.06],
  ['Industrial Laser Engraver 60W CO2 Workstation', 7899, 0.05],
  ['Mitsubishi Mini Split Heat Pump 24000 BTU', 5250, 0.07],
  ['Yamaha P-515 Digital Piano with Stand', 1799.99, 0.9],
  ['ECOFLOW DELTA Pro Portable Power Station', 3699, 0.2],
  ['Garmin Fenix 7X Pro Sapphire Solar', 899.99, 1.3],
];

const { rows: productCount } = await query('SELECT count(*)::int AS n FROM products');
if (productCount[0].n === 0) {
  for (const [title, price, profit, image] of catalog) {
    await query(
      'INSERT INTO products (title, price, profit_percentage, image_url) VALUES ($1, $2, $3, $4)',
      [title, price, profit, image ?? null]
    );
  }
  console.log(`created ${catalog.length} catalog products`);
}

/* ------------------------------------------------------------- wallets */

// Placeholder addresses — replace from the admin Wallets section before real use.
const wallets = [
  ['USDT', 'ERC20', '0x7E0d4e9d377D428a4C6438dbA8a3636088c279c6'],
  ['USDT', 'ERC20', '0x9Fb2c41Ad7Aa1Cc0Ee8B5d2F4a1937Ef55De9021'],
  ['USDT', 'TRC20', 'TXq4mW9vRb7kLp2cDs8nGh3jYf6aZu1eQw'],
  ['BTC', 'BITCOIN', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'],
];

const { rows: walletCount } = await query('SELECT count(*)::int AS n FROM wallets');
if (walletCount[0].n === 0) {
  for (const [coin, network, address] of wallets) {
    await query('INSERT INTO wallets (coin, network, address) VALUES ($1, $2, $3)', [coin, network, address]);
  }
  console.log(`created ${wallets.length} deposit wallets`);
}

/* -------------------------------------------------- ledger + orders */

const admin = await findByEmail('admin@demo.test');

async function seedLedger(email, entries) {
  const user = await findByEmail(email);
  const { rows } = await query('SELECT 1 FROM transactions WHERE user_id = $1 LIMIT 1', [user.id]);
  if (rows.length) return;
  for (const [type, amount, status] of entries) {
    await query(
      `INSERT INTO transactions
         (user_id, type, direction, amount, status, coin, network, reviewed_by, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, 'USDT', 'TRC20', $6, $7)`,
      [user.id, type, type === 'deposit' ? 'credit' : 'debit', amount, status,
        status === 'pending' ? null : admin.id, status === 'pending' ? null : new Date()]
    );
  }
  console.log(`created ledger for ${email}`);
}

async function seedOrders(email, count) {
  const user = await findByEmail(email);
  const { rows } = await query('SELECT 1 FROM orders WHERE user_id = $1 LIMIT 1', [user.id]);
  if (rows.length) return;
  await query(
    `INSERT INTO orders (user_id, product_id, price, profit_percentage, assigned_by)
     SELECT $1, id, price, profit_percentage, $2 FROM products
      ORDER BY price LIMIT $3`,
    [user.id, admin.id, count]
  );
  console.log(`assigned ${count} orders to ${email}`);
}

// Historical records that explain the seeded balances; they don't move them.
await seedLedger('trader@demo.test', [['deposit', 122, 'approved']]);
await seedLedger('locked@demo.test', [['deposit', 250, 'pending']]);
await seedLedger('mia.chen@demo.test', [['deposit', 4210.5, 'approved']]);
await seedLedger('leo.martins@demo.test', [['deposit', 318.2, 'approved']]);

await seedOrders('trader@demo.test', 3);
await seedOrders('locked@demo.test', 2);

await pool.end();
