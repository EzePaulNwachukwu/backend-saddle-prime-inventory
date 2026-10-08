// One-off script to populate the database with sample users and products.
// Run with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');

// Every seeded user gets this password (hashed automatically by the User model's pre-save hook)
const DEFAULT_PASSWORD = 'Passw0rd!';

const usernames = [
  'ezepaul', 'chiomaokafor', 'tundeadeyemi', 'aishabello', 'emekaobi',
  'blessingeze', 'ibrahimyusuf', 'grace_uche', 'davidoyelaran', 'fatimasani',
  'kelechinwosu', 'olufunmiadeleke', 'josephinealabi', 'musaabdullahi', 'ngozianyanwu',
  'samuelakintola', 'halimasuleiman', 'peteronyekwere', 'rukayatlawal', 'victoressien',
];

// Only the first 3 accounts are admins; the rest are staff
const ADMIN_COUNT = 3;

const categories = ['Building Materials', 'Electronics', 'Stationery', 'Footwear', 'Provisions', 'Hardware', 'Cosmetics', 'Furniture', 'Plumbing', 'Electricals'];

const suppliers = ['Zenith Traders Ltd', 'Chuka & Sons Supplies', 'Golden Gate Distributors', 'Northbridge Wholesale', 'Marina Merchants Co.'];

// Pool of product templates: [name, category, basePrice]
const productPool = [
  ['Bag of Cement (50kg)', 'Building Materials', 6500],
  ['Iron Rod (12mm)', 'Building Materials', 8200],
  ['Rechargeable Lamp', 'Electronics', 5400],
  ['Extension Socket', 'Electronics', 2300],
  ['A4 Ream of Paper', 'Stationery', 3200],
  ['Ballpoint Pen (dozen)', 'Stationery', 900],
  ['Men\'s Leather Sandals', 'Footwear', 7500],
  ['Ladies Canvas Shoes', 'Footwear', 6800],
  ['Bag of Rice (50kg)', 'Provisions', 45000],
  ['Carton of Indomie Noodles', 'Provisions', 8500],
  ['Claw Hammer', 'Hardware', 3100],
  ['Padlock (Heavy Duty)', 'Hardware', 2700],
  ['Body Cream (Large)', 'Cosmetics', 1800],
  ['Perfume Oil (50ml)', 'Cosmetics', 4200],
  ['Plastic Chair', 'Furniture', 5600],
  ['Wooden Stool', 'Furniture', 4300],
  ['PVC Pipe (2 inch)', 'Plumbing', 2100],
  ['Water Tap (Brass)', 'Plumbing', 3900],
  ['Electric Cable (per roll)', 'Electricals', 12500],
  ['LED Bulb (9W)', 'Electricals', 1500],
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (arr) => arr[randomInt(0, arr.length - 1)];

// Picks `count` distinct products from the pool for a user's inventory
const pickProducts = (count) => {
  const shuffled = [...productPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const seedData = async () => {
  await connectDB();

  console.log('Clearing existing Users and Products...');
  await Product.deleteMany({});
  await User.deleteMany({});

  console.log('Creating 20 users...');
  const createdUsers = [];
  for (let i = 0; i < usernames.length; i++) {
    const user = await User.create({
      username: usernames[i],
      password: DEFAULT_PASSWORD,
      role: i < ADMIN_COUNT ? 'admin' : 'staff',
    });
    createdUsers.push(user);
  }

  console.log('Creating products for each user...');
  const productDocs = [];
  for (const user of createdUsers) {
    const userProducts = pickProducts(randomInt(4, 6));
    for (const [name, category, basePrice] of userProducts) {
      // Vary price slightly and occasionally dip below 10 to exercise the low-stock report
      const quantity = randomInt(1, 40);
      const price = Math.round(basePrice * (0.9 + Math.random() * 0.2));

      productDocs.push({
        name,
        category,
        quantity,
        price,
        supplier: pickRandom(suppliers),
        addedBy: user._id,
      });
    }
  }
  await Product.insertMany(productDocs);

  console.log(`Done. Created ${createdUsers.length} users and ${productDocs.length} products.`);
  console.log(`All users share the password: ${DEFAULT_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
};

seedData().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
