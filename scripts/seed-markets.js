require('dotenv').config();
const mongoose = require('mongoose');
const Market = require('../src/models/Market');

const MARKETS = [
  { name: 'BİM', known_aliases: ['BIM', 'BIM A.S.', 'BİM A.Ş.'], chain_type: 'DISCOUNT' },
  { name: 'A101', known_aliases: ['A 101', 'A-101'], chain_type: 'DISCOUNT' },
  { name: 'ŞOK', known_aliases: ['SOK', 'ŞOK MARKET', 'SOK MARKET'], chain_type: 'DISCOUNT' },
  { name: 'Migros', known_aliases: ['MIGROS', 'MİGROS', 'Migros M', 'Macrocenter'], chain_type: 'SUPERMARKET' },
  { name: 'CarrefourSA', known_aliases: ['CARREFOUR', 'CarrefourSa'], chain_type: 'HYPERMARKET' },
  { name: 'Hakmar', known_aliases: ['HAKMAR'], chain_type: 'DISCOUNT' },
  { name: 'Onur Market', known_aliases: ['ONUR', 'ONUR MARKET'], chain_type: 'SUPERMARKET' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const m of MARKETS) {
    await Market.findOneAndUpdate({ name: m.name }, m, { upsert: true, new: true });
  }

  console.log(`Seeded ${MARKETS.length} markets`);
  await mongoose.disconnect();
}

seed().catch(console.error);
