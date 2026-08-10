/**
 * Reseed categories + products for testing (does NOT wipe users / banners / pages).
 *
 * - Categories collection: main categories only
 * - Subcategories collection: each has category ObjectId mapping
 * - Products: min ~100, one shared gray 154x154-style placeholder image
 * - Specs: latest markdown format
 *
 * Usage: npm run seed:catalog
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const { slugify } = require('../utils/helpers');
const { generateCategoryCode } = require('../utils/generateCategoryCode');
const { notDeleted } = require('../utils/audit');

/**
 * Dummy product image (gray placeholder like "154x154").
 */
const PREVIEW_IMAGE = 'https://placehold.co/600x600/e5e7eb/111111?text=154x154';

/** Full test catalog — categories + mapped subcategories (sheet-style SS fittings + marine lines) */
const CATALOG = [
  {
    name: 'SS FIITINGS 316',
    subs: [
      'Anchor Roller',
      'Boat Cleat',
      'Boat Bollard & Fairlead',
      'Marine Ladder',
      'Bow Chock',
      'Deck Plate',
      'Hatches',
      'Porthole',
      'Casting Hinge',
      'Pull Rings',
      'Latch',
      'Thru-Hull & Tank Vent',
      'Yacht Seat',
    ],
  },
  {
    name: 'Engine Control Cables & Levers',
    subs: ['Engine Control Levers', 'Engine Control Cables', 'Accessories'],
  },
  {
    name: 'Steering Wheel',
    subs: ['Steering Wheel Sports Model', 'Steering Wheel Basic Model'],
  },
  {
    name: 'Mechanical Steering',
    subs: [
      'Mechanical Steering Kit',
      'Mechanical Steering Kit With Tilt Mechanism',
      'Mechanical Helm',
      'Easy Connect Steering Cable',
      'Link Arm',
    ],
  },
  {
    name: 'Hydraulic Steering',
    subs: ['Outboard Hydraulic Steering MaviMare', 'Accessories'],
  },
  {
    name: 'Electrical Accessories',
    subs: [
      'Toggle Switch',
      'Navigation Light',
      'Battery Selector Switches',
      'SWITCH PANEL',
      'Horn',
      'Pump Systems',
      'Shore Power System',
      'Wipers',
    ],
  },
  {
    name: 'Fuel Systems',
    subs: [
      'Fuel Filters',
      'Fuel Tank Fittings',
      'Fuel Hose & Connectors',
      'Primer Bulbs',
    ],
  },
];

const ANCHOR_BASE = [
  { id: 'MK4242', description: 'AISI316 STAINLESS STEEL BOW ROLLER' },
  { id: 'MK4256', description: 'AISI316 STAINLESS STEEL BOW ROLLER' },
  { id: 'MK4275', description: 'AISI316 STAINLESS STEEL BOW ROLLER' },
  { id: 'MK4295', description: 'AISI316 STAINLESS STEEL BOW ROLLER HEAVY DUTY' },
  { id: 'MK4310', description: 'AISI316 STAINLESS STEEL ANCHOR ROLLER' },
  { id: 'MK4328', description: 'AISI316 STAINLESS STEEL ANCHOR ROLLER WIDE' },
  { id: 'MK4344', description: 'AISI316 STAINLESS STEEL BOW ROLLER COMPACT' },
  { id: 'MK4360', description: 'AISI316 STAINLESS STEEL ANCHOR ROLLER LONG' },
];

function titleCase(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\baisi316\b/gi, 'AISI316')
    .replace(/\bss\b/gi, 'SS')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Aisi316/g, 'AISI316');
}

function markdownSpecs({ id, category, subcategory, notes = [] }) {
  const lines = [
    `**Product Id:** ${id}`,
    `**Category:** ${category}`,
    `**Sub-Category:** ${subcategory}`,
    `**Material:** Marine grade`,
    ...notes.map((n) => `- ${n}`),
  ];
  return {
    mode: 'markdown',
    markdown: lines.join('\n\n'),
    image: '',
  };
}

async function createCategoryTree() {
  const parents = {};
  const subs = {};
  let parentCount = 0;
  let subCount = 0;

  for (let i = 0; i < CATALOG.length; i++) {
    const c = CATALOG[i];
    const code = await generateCategoryCode('cat');
    parents[c.name] = await Category.create({
      name: c.name,
      code,
      slug: slugify(c.name),
      sortOrder: i + 1,
      description: `${c.name} — test catalog`,
      image: PREVIEW_IMAGE,
      isActive: true,
    });
    parentCount += 1;

    for (let j = 0; j < c.subs.length; j++) {
      const subName = c.subs[j];
      const subCode = await generateCategoryCode('sub');
      const key = `${c.name}::${subName}`;
      subs[key] = await Subcategory.create({
        name: subName,
        code: subCode,
        slug: slugify(`${c.name}-${subName}`),
        category: parents[c.name]._id,
        sortOrder: j + 1,
        description: `${subName} under ${c.name}`,
        image: PREVIEW_IMAGE,
        isActive: true,
      });
      subCount += 1;
    }
  }

  return { parents, subs, parentCount, subCount };
}

async function nextSkuFactory() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const prefix = `prd-${mm}/${yy}-`;
  let seq = 1;
  const latest = await Product.findOne({
    sku: new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
  })
    .sort({ sku: -1 })
    .select('sku')
    .lean();
  if (latest?.sku) {
    const n = parseInt(latest.sku.slice(prefix.length), 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return () => {
    const sku = `${prefix}${String(seq).padStart(4, '0')}`;
    seq += 1;
    return sku;
  };
}

function buildProducts({ parents, subs }, nextSku) {
  const products = [];

  const push = ({
    id,
    description,
    categoryName,
    subName,
    price,
    salePrice = null,
    maxOrderQty = 5,
    isFeatured = false,
    isBestSeller = false,
    isNewArrival = false,
    notes = [],
  }) => {
    const categoryDoc = parents[categoryName];
    const subDoc = subs[`${categoryName}::${subName}`];
    if (!categoryDoc || !subDoc) {
      throw new Error(`Missing category mapping: ${categoryName} / ${subName}`);
    }
    const sku = nextSku();
    const name = `${titleCase(description)} ${id}`;
    products.push({
      name,
      slug: slugify(`${description}-${id}-${sku.replace(/[^a-zA-Z0-9]+/g, '-')}`),
      sku,
      shortDescription: titleCase(description),
      description: `${titleCase(description)}. Product Id ${id}. Category: ${categoryName} · ${subName}. Dummy test product.`,
      category: categoryDoc._id,
      subcategory: subDoc._id,
      price,
      salePrice,
      images: [PREVIEW_IMAGE],
      maxOrderQty,
      isFeatured,
      isBestSeller,
      isNewArrival,
      isActive: true,
      specifications: markdownSpecs({
        id,
        category: categoryName,
        subcategory: subName,
        notes: notes.length ? notes : ['Dummy catalog item', 'Placeholder image'],
      }),
    });
  };

  // --- SS FIITINGS / Anchor Roller (sheet-style) — 32 items ---
  let n = 0;
  for (let batch = 0; batch < 4; batch++) {
    for (const row of ANCHOR_BASE) {
      n += 1;
      const id = batch === 0 ? row.id : `${row.id}-B${batch + 1}`;
      push({
        id,
        description: row.description,
        categoryName: 'SS FIITINGS 316',
        subName: 'Anchor Roller',
        price: 4000 + n * 75,
        salePrice: n % 5 === 0 ? 3800 + n * 60 : null,
        maxOrderQty: 3,
        isFeatured: n <= 3,
        isBestSeller: n % 6 === 0,
        isNewArrival: n > 24,
        notes: ['Bow / anchor roller', 'AISI 316'],
      });
    }
  }

  // --- Other SS subcategories — ~3–4 each ---
  const ssExtras = [
    ['Boat Cleat', 'AISI316 STAINLESS STEEL BOAT CLEAT', 6],
    ['Boat Bollard & Fairlead', 'AISI316 BOLLARD AND FAIRLEAD', 4],
    ['Marine Ladder', 'AISI316 TELESCOPIC MARINE LADDER', 5],
    ['Bow Chock', 'AISI316 STAINLESS STEEL BOW CHOCK', 4],
    ['Deck Plate', 'AISI316 DECK PLATE ROUND', 4],
    ['Hatches', 'AISI316 DECK HATCH', 4],
    ['Porthole', 'AISI316 PORTHOLE', 3],
    ['Casting Hinge', 'AISI316 CASTING HINGE', 3],
    ['Pull Rings', 'AISI316 PULL RING', 3],
    ['Latch', 'AISI316 MARINE LATCH', 3],
    ['Thru-Hull & Tank Vent', 'AISI316 THRU HULL FITTING', 3],
    ['Yacht Seat', 'AISI316 YACHT SEAT HARDWARE', 3],
  ];
  for (const [subName, baseDesc, count] of ssExtras) {
    for (let i = 1; i <= count; i++) {
      push({
        id: `SS-${subName.slice(0, 3).toUpperCase()}${i}`,
        description: `${baseDesc} ${i}`,
        categoryName: 'SS FIITINGS 316',
        subName,
        price: 800 + i * 220 + subName.length * 15,
        salePrice: i === 1 ? 700 + i * 180 : null,
        maxOrderQty: subName === 'Marine Ladder' ? 2 : 8,
        isFeatured: i === 1 && subName === 'Boat Cleat',
        isBestSeller: subName === 'Marine Ladder' && i <= 2,
        isNewArrival: i === count,
      });
    }
  }

  // --- Engine control ---
  // Engine control levers — include classic twin slug for PDP demos
  for (let i = 1; i <= 6; i++) {
    push({
      id: `ECL-${i}`,
      description: `ENGINE CONTROL LEVER TYPE ${i}`,
      categoryName: 'Engine Control Cables & Levers',
      subName: 'Engine Control Levers',
      price: 9000 + i * 400,
      isBestSeller: i <= 2,
      maxOrderQty: 2,
    });
  }
  push({
    id: 'ECL-TWIN',
    description: 'ENGINE CONTROL LEVER TWIN',
    short: 'Twin-engine control lever',
    categoryName: 'Engine Control Cables & Levers',
    subName: 'Engine Control Levers',
    price: 14500,
    isFeatured: true,
    isBestSeller: true,
    maxOrderQty: 2,
    notes: ['Twin engine', 'Side mount', 'Outboard compatible'],
  });
  const twin = products.find((p) => p.name.includes('ECL-TWIN') || /lever twin/i.test(p.name));
  if (twin) {
    twin.slug = 'engine-control-lever-twin';
    twin.name = 'Engine Control Lever Twin';
  }
  for (const ft of [8, 10, 12, 14, 16, 18, 20]) {
    push({
      id: `ECC-${ft}`,
      description: `ENGINE CONTROL CABLE ${ft} FT`,
      categoryName: 'Engine Control Cables & Levers',
      subName: 'Engine Control Cables',
      price: 1200 + ft * 40,
      maxOrderQty: 10,
      notes: [`Length: ${ft} ft`],
    });
  }
  for (let i = 1; i <= 3; i++) {
    push({
      id: `ECA-${i}`,
      description: `ENGINE CONTROL ACCESSORY ${i}`,
      categoryName: 'Engine Control Cables & Levers',
      subName: 'Accessories',
      price: 650 + i * 100,
      maxOrderQty: 12,
    });
  }

  // --- Steering wheels ---
  for (let i = 1; i <= 5; i++) {
    push({
      id: `SWS-${i}`,
      description: `STEERING WHEEL SPORTS MODEL ${i}`,
      categoryName: 'Steering Wheel',
      subName: 'Steering Wheel Sports Model',
      price: 3500 + i * 250,
      isFeatured: i === 1,
      maxOrderQty: 4,
    });
  }
  for (let i = 1; i <= 4; i++) {
    push({
      id: `SWB-${i}`,
      description: `STEERING WHEEL BASIC MODEL ${i}`,
      categoryName: 'Steering Wheel',
      subName: 'Steering Wheel Basic Model',
      price: 2200 + i * 180,
      maxOrderQty: 5,
    });
  }

  // --- Mechanical steering ---
  for (const len of [18, 20, 22, 24, 26, 28, 30]) {
    push({
      id: `MKMS-${len}`,
      description: `MECHANICAL STEERING KIT ${len} FT`,
      categoryName: 'Mechanical Steering',
      subName: 'Mechanical Steering Kit',
      price: 8500 + len * 50,
      isBestSeller: true,
      isFeatured: len <= 22,
      isNewArrival: len >= 28,
      maxOrderQty: 2,
      notes: [`Cable length: ${len} ft`],
    });
  }
  for (let i = 1; i <= 3; i++) {
    push({
      id: `MKTMS-${i}`,
      description: `MECHANICAL STEERING KIT WITH TILT ${i}`,
      categoryName: 'Mechanical Steering',
      subName: 'Mechanical Steering Kit With Tilt Mechanism',
      price: 12000 + i * 500,
      isFeatured: i === 1,
      maxOrderQty: 2,
    });
  }
  for (let i = 1; i <= 3; i++) {
    push({
      id: `MH-${200 + i}`,
      description: `MECHANICAL HELM MH-${200 + i}`,
      categoryName: 'Mechanical Steering',
      subName: 'Mechanical Helm',
      price: 6500 + i * 300,
      maxOrderQty: 3,
    });
  }
  for (const ft of [10, 12, 14, 16]) {
    push({
      id: `ECSC-${ft}`,
      description: `EASY CONNECT STEERING CABLE ${ft} FT`,
      categoryName: 'Mechanical Steering',
      subName: 'Easy Connect Steering Cable',
      price: 2800 + ft * 60,
      maxOrderQty: 6,
    });
  }
  for (let i = 1; i <= 3; i++) {
    push({
      id: `LA-${i}`,
      description: `STEERING LINK ARM ${i}`,
      categoryName: 'Mechanical Steering',
      subName: 'Link Arm',
      price: 1800 + i * 150,
      maxOrderQty: 8,
    });
  }

  // --- Hydraulic ---
  for (let i = 1; i <= 5; i++) {
    push({
      id: `HYD-${i}`,
      description: `OUTBOARD HYDRAULIC STEERING MAVIMARE ${i}`,
      categoryName: 'Hydraulic Steering',
      subName: 'Outboard Hydraulic Steering MaviMare',
      price: 28000 + i * 1200,
      isFeatured: i === 1,
      maxOrderQty: 1,
    });
  }
  for (let i = 1; i <= 4; i++) {
    push({
      id: `HYA-${i}`,
      description: `HYDRAULIC STEERING ACCESSORY ${i}`,
      categoryName: 'Hydraulic Steering',
      subName: 'Accessories',
      price: 3200 + i * 400,
      maxOrderQty: 4,
    });
  }

  // --- Electrical ---
  const elecSets = [
    ['Toggle Switch', 'MARINE TOGGLE SWITCH', 5, 450],
    ['Navigation Light', 'NAVIGATION LIGHT LED', 5, 1200],
    ['Battery Selector Switches', 'BATTERY SELECTOR SWITCH', 4, 2100],
    ['SWITCH PANEL', 'SWITCH PANEL GANG', 4, 2600],
    ['Horn', 'MARINE HORN', 3, 980],
    ['Pump Systems', 'BILGE PUMP SYSTEM', 3, 4500],
    ['Shore Power System', 'SHORE POWER INLET', 3, 3800],
    ['Wipers', 'MARINE WIPER MOTOR', 3, 5200],
  ];
  for (const [subName, baseDesc, count, basePrice] of elecSets) {
    for (let i = 1; i <= count; i++) {
      push({
        id: `EL-${subName.slice(0, 3).toUpperCase()}${i}`,
        description: `${baseDesc} ${i}`,
        categoryName: 'Electrical Accessories',
        subName,
        price: basePrice + i * 120,
        isFeatured: i === 1 && subName === 'Navigation Light',
        isBestSeller: i === 1 && subName === 'Toggle Switch',
        isNewArrival: i === count,
        maxOrderQty: 10,
        notes: ['12V / 24V compatible'],
      });
    }
  }

  // --- Fuel Systems (7th category) ---
  const fuelSets = [
    ['Fuel Filters', 'MARINE FUEL FILTER WATER SEPARATOR', 5, 1850],
    ['Fuel Tank Fittings', 'MARINE FUEL TANK FITTING', 4, 980],
    ['Fuel Hose & Connectors', 'MARINE FUEL HOSE CONNECTOR', 5, 720],
    ['Primer Bulbs', 'MARINE FUEL PRIMER BULB', 4, 450],
  ];
  for (const [subName, baseDesc, count, basePrice] of fuelSets) {
    for (let i = 1; i <= count; i++) {
      push({
        id: `FS-${subName.slice(0, 3).toUpperCase()}${i}`,
        description: `${baseDesc} ${i}`,
        categoryName: 'Fuel Systems',
        subName,
        price: basePrice + i * 95,
        salePrice: i === 1 ? Math.round(basePrice * 0.9) : null,
        isFeatured: i === 1 && subName === 'Fuel Filters',
        isBestSeller: i <= 2 && subName === 'Primer Bulbs',
        isNewArrival: i === count,
        maxOrderQty: 10,
        notes: ['Marine fuel system', 'Compatible with petrol outboards'],
      });
    }
  }

  return products;
}

async function main() {
  await connectDB();

  console.log('Clearing categories, subcategories & products only...');
  await Product.deleteMany({});
  await Subcategory.deleteMany({});
  await Category.deleteMany({});

  console.log('Creating categories + subcategories collection...');
  const tree = await createCategoryTree();

  console.log('Creating products (placeholder 154x154 image)...');
  const nextSku = await nextSkuFactory();
  const products = buildProducts(tree, nextSku);
  await Product.insertMany(products);

  // Link related products within each subcategory (up to 6 peers)
  const all = await Product.find({ ...notDeleted }).select('_id subcategory');
  const bySub = new Map();
  for (const p of all) {
    const key = String(p.subcategory || '');
    if (!bySub.has(key)) bySub.set(key, []);
    bySub.get(key).push(p._id);
  }
  for (const ids of bySub.values()) {
    for (const id of ids) {
      const related = ids.filter((x) => String(x) !== String(id)).slice(0, 6);
      await Product.updateOne({ _id: id }, { $set: { relatedProducts: related } });
    }
  }

  console.log(
    `Done.\n` +
      `  Categories: ${tree.parentCount}\n` +
      `  Subcategories (own collection, category mapped): ${tree.subCount}\n` +
      `  Products: ${products.length}\n` +
      `  Image: ${PREVIEW_IMAGE}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
