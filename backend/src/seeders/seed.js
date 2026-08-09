require('dotenv').config();
const connectDB = require('../config/db');
const env = require('../config/env');
const User = require('../models/User');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Page = require('../models/Page');
const { slugify } = require('../utils/helpers');
const { generateCategoryCode } = require('../utils/generateCategoryCode');

const img = (seed, w = 600, h = 600) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

const seed = async () => {
  await connectDB();

  console.log('Clearing collections...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Subcategory.deleteMany({}),
    Product.deleteMany({}),
    Banner.deleteMany({}),
    Page.deleteMany({}),
  ]);

  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'MarineKart',
    email: env.adminEmail,
    password: env.adminPassword,
    role: 'admin',
    phone: '0123456789',
  });

  const customer = await User.create({
    firstName: 'Demo',
    lastName: 'Customer',
    email: 'customer@marinekart.com',
    password: 'Customer@123',
    role: 'customer',
    phone: '9876543210',
  });

  const dealer = await User.create({
    firstName: 'Corporate',
    lastName: 'Partner',
    email: 'corporate@marinekart.com',
    password: 'Corporate@123',
    role: 'corporate',
    phone: '9876543211',
    priceMultiplier: 0.85,
    isActive: true,
    companyName: 'Demo Marine Corp',
    gstNumber: '27AAAAA0000A1Z5',
    companyAddress: {
      line1: '12 Harbour Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
    },
  });

  const mainCats = [
    { name: 'SS FIITINGS 316', sortOrder: 1 },
    { name: 'Engine Control Cables & Levers', sortOrder: 2 },
    { name: 'Steering Wheel', sortOrder: 3 },
    { name: 'Mechanical Steering', sortOrder: 4 },
    { name: 'Hydraulic Steering', sortOrder: 5 },
    { name: 'Electrical Accessories', sortOrder: 6 },
  ];

  const parents = {};
  for (const c of mainCats) {
    const code = await generateCategoryCode('cat');
    parents[c.name] = await Category.create({
      name: c.name,
      code,
      slug: slugify(c.name),
      sortOrder: c.sortOrder,
      description: `${c.name} marine products`,
      image: img(`cat-${slugify(c.name)}`, 400, 400),
    });
  }

  const subMap = {
    'SS FIITINGS 316': [
      'Boat Bollard & Fairlead',
      'Boat Cleat',
      'Casting Hinge',
      'Pull Rings',
      'Latch',
      'Thru-Hull & Tank Vent',
      'Deck Plate',
      'Marine Ladder',
      'Hatches',
      'Porthole',
      'Yacht Seat',
      'Anchor Roller',
      'Bow Chock',
    ],
    'Engine Control Cables & Levers': [
      'Accessories',
      'Engine Control Levers',
      'Engine Control Cables',
    ],
    'Steering Wheel': ['Steering Wheel Sports Model', 'Steering Wheel Basic Model'],
    'Mechanical Steering': [
      'Easy Connect Steering Cable',
      'Mechanical Steering Kit With Tilt Mechanism',
      'Mechanical Helm',
      'Mechanical Steering Kit',
      'Link Arm',
    ],
    'Hydraulic Steering': ['Accessories', 'Outboard Hydraulic Steering MaviMare'],
    'Electrical Accessories': [
      'Battery Selector Switches',
      'Toggle Switch',
      'SWITCH PANEL',
      'Shore Power System',
      'Automatic Battery Charger',
      'Wipers',
      'Horn',
      'Navigation Light',
      'Windlass',
      'Instrumentation',
      'Pump Systems',
      'Marine Toilets',
      'SENSOR',
      'Ignition Starter Switches',
    ],
  };

  const subs = {};
  for (const [parentName, list] of Object.entries(subMap)) {
    for (let i = 0; i < list.length; i++) {
      const name = list[i];
      const code = await generateCategoryCode('sub');
      const uniqueSlug = slugify(`${parentName}-${name}`);
      subs[`${parentName}::${name}`] = await Subcategory.create({
        name,
        code,
        slug: uniqueSlug,
        category: parents[parentName]._id,
        sortOrder: i + 1,
      });
    }
  }

  const sub = (parentName, name) => subs[`${parentName}::${name}`];

  const ss = parents['SS FIITINGS 316'];
  const cleatSub = sub('SS FIITINGS 316', 'Boat Cleat');
  const bollardSub = sub('SS FIITINGS 316', 'Boat Bollard & Fairlead');
  const ladderSub = sub('SS FIITINGS 316', 'Marine Ladder');
  const hatchSub = sub('SS FIITINGS 316', 'Hatches');

  const levers = parents['Engine Control Cables & Levers'];
  const leverSub = sub('Engine Control Cables & Levers', 'Engine Control Levers');
  const cableSub = sub('Engine Control Cables & Levers', 'Engine Control Cables');

  const wheel = parents['Steering Wheel'];
  const sportsWheelSub = sub('Steering Wheel', 'Steering Wheel Sports Model');
  const basicWheelSub = sub('Steering Wheel', 'Steering Wheel Basic Model');

  const mechKit = parents['Mechanical Steering'];
  const mechSub = sub('Mechanical Steering', 'Mechanical Steering Kit');
  const tiltSub = sub('Mechanical Steering', 'Mechanical Steering Kit With Tilt Mechanism');
  const helmSub = sub('Mechanical Steering', 'Mechanical Helm');

  const hydraulic = parents['Hydraulic Steering'];
  const hydroSub = sub('Hydraulic Steering', 'Outboard Hydraulic Steering MaviMare');
  const hydroAccSub = sub('Hydraulic Steering', 'Accessories');

  const elec = parents['Electrical Accessories'];
  const toggleSub = sub('Electrical Accessories', 'Toggle Switch');
  const battSub = sub('Electrical Accessories', 'Battery Selector Switches');
  const navSub = sub('Electrical Accessories', 'Navigation Light');
  const hornSub = sub('Electrical Accessories', 'Horn');
  const pumpSub = sub('Electrical Accessories', 'Pump Systems');
  const panelSub = sub('Electrical Accessories', 'SWITCH PANEL');

  const lengths = [18, 20, 22, 24, 26, 28, 30];
  const products = [];

  for (const len of lengths) {
    products.push({
      name: `Mechanical Steering Kit MKMS-1.2-${len}`,
      slug: slugify(`mechanical-steering-kit-mkms-1-2-${len}`),
      sku: 'prd-08/26-0001',
      shortDescription: 'Mechanical Steering Kit',
      description:
        'High-quality mechanical steering kit designed for marine outboard applications. Durable, corrosion-resistant components for reliable helm control.',
      category: mechKit._id,
      subcategory: mechSub._id,
      price: 8500 + len * 50,
      salePrice: null,
      images: [img(`mkms-1-2-${len}`)],
      isBestSeller: true,
      isFeatured: len <= 22,
      isNewArrival: len >= 28,
      specifications: {
        mode: 'markdown',
        markdown: `**Cable Length:** ${len} ft\n\n**Model:** MKMS-1.2-${len}`,
        image: '',
      },
    });
  }

  products.push(
    {
      name: 'Mechanical Steering Kit With Tilt Mechanism MKTMS-1.3-06',
      slug: slugify('mechanical-steering-kit-with-tilt-mktms-1-3-06'),
      sku: 'prd-08/26-0002',
      shortDescription: 'Mechanical Steering Kit With Tilt Mechanism',
      description: 'Mechanical steering kit with integrated tilt mechanism for ergonomic helm adjustment.',
      category: mechKit._id,
      subcategory: tiltSub._id,
      price: 12500,
      isBestSeller: true,
      isFeatured: true,
      isNewArrival: true,
    },
    {
      name: 'Mechanical Helm MH-200',
      slug: slugify('mechanical-helm-mh-200'),
      sku: 'prd-08/26-0003',
      shortDescription: 'Mechanical Helm',
      description: 'Compact mechanical helm unit compatible with standard marine steering cables.',
      category: mechKit._id,
      subcategory: helmSub._id,
      price: 6800,
      isFeatured: true,
    },
    {
      name: 'SS Boat Cleat 6 inch',
      slug: slugify('ss-boat-cleat-6-inch'),
      sku: 'prd-08/26-0004',
      shortDescription: 'Boat Cleat',
      description: '316 stainless steel boat cleat for deck mooring. Corrosion resistant.',
      category: ss._id,
      subcategory: cleatSub._id,
      price: 890,
      isBestSeller: true,
      isFeatured: true,
      specifications: {
        mode: 'markdown',
        markdown: '**Material:** SS 316\n\n**Size:** 6 inch',
        image: '',
      },
    },
    {
      name: 'SS Boat Cleat 8 inch',
      slug: slugify('ss-boat-cleat-8-inch'),
      sku: 'prd-08/26-0005',
      shortDescription: 'Boat Cleat',
      description: '316 stainless steel heavy-duty boat cleat.',
      category: ss._id,
      subcategory: cleatSub._id,
      price: 1190,
      isNewArrival: true,
    },
    {
      name: 'SS Bollard & Fairlead Combo',
      slug: slugify('ss-bollard-fairlead-combo'),
      sku: 'prd-08/26-0006',
      shortDescription: 'Boat Bollard & Fairlead',
      description: 'Marine bollard and fairlead set in polished 316 stainless steel.',
      category: ss._id,
      subcategory: bollardSub._id,
      price: 3450,
      isFeatured: true,
    },
    {
      name: 'Telescopic Marine Ladder 4 Step',
      slug: slugify('telescopic-marine-ladder-4-step'),
      sku: 'prd-08/26-0007',
      shortDescription: 'Marine Ladder',
      description: 'Folding telescopic boarding ladder, 4 steps, SS 316.',
      category: ss._id,
      subcategory: ladderSub._id,
      price: 7800,
      salePrice: 6990,
      isBestSeller: true,
      isNewArrival: true,
    },
    {
      name: 'Deck Hatch Square 450mm',
      slug: slugify('deck-hatch-square-450mm'),
      sku: 'prd-08/26-0008',
      shortDescription: 'Hatches',
      description: 'Watertight deck hatch with SS frame, 450mm opening.',
      category: ss._id,
      subcategory: hatchSub._id,
      price: 9200,
      isFeatured: true,
    },
    {
      name: 'Engine Control Lever Twin',
      slug: slugify('engine-control-lever-twin'),
      sku: 'prd-08/26-0009',
      shortDescription: 'Engine Control Levers',
      description: 'Twin-engine control lever with side mount for outboard applications.',
      category: levers._id,
      subcategory: leverSub._id,
      price: 14500,
      isBestSeller: true,
      isFeatured: true,
    },
    {
      name: 'Engine Control Cable 12ft',
      slug: slugify('engine-control-cable-12ft'),
      sku: 'prd-08/26-0010',
      shortDescription: 'Engine Control Cables',
      description: 'Universal push-pull engine control cable, 12 ft.',
      category: levers._id,
      subcategory: cableSub._id,
      price: 1850,
      isNewArrival: true,
    },
    {
      name: 'Engine Control Cable 16ft',
      slug: slugify('engine-control-cable-16ft'),
      sku: 'prd-08/26-0011',
      shortDescription: 'Engine Control Cables',
      description: 'Universal push-pull engine control cable, 16 ft.',
      category: levers._id,
      subcategory: cableSub._id,
      price: 2150,
      isBestSeller: true,
    },
    {
      name: 'Sports Steering Wheel 350mm',
      slug: slugify('sports-steering-wheel-350mm'),
      sku: 'prd-08/26-0012',
      shortDescription: 'Steering Wheel Sports Model',
      description: 'Soft-grip sports steering wheel, 350mm, marine grade.',
      category: wheel._id,
      subcategory: sportsWheelSub._id,
      price: 4200,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
    },
    {
      name: 'Basic Steering Wheel 340mm',
      slug: slugify('basic-steering-wheel-340mm'),
      sku: 'prd-08/26-0013',
      shortDescription: 'Steering Wheel Basic Model',
      description: 'Standard polyurethane rim steering wheel for boats.',
      category: wheel._id,
      subcategory: basicWheelSub._id,
      price: 2800,
      isFeatured: true,
    },
    {
      name: 'Hydraulic Steering Kit Outboard',
      slug: slugify('hydraulic-steering-kit-outboard'),
      sku: 'prd-08/26-0014',
      shortDescription: 'Outboard Hydraulic Steering MaviMare',
      description: 'Complete outboard hydraulic steering kit with helm pump and cylinder.',
      category: hydraulic._id,
      subcategory: hydroSub._id,
      price: 28500,
      isBestSeller: true,
      isFeatured: true,
      isNewArrival: true,
    },
    {
      name: 'Hydraulic Steering Hose 5m',
      slug: slugify('hydraulic-steering-hose-5m'),
      sku: 'prd-08/26-0015',
      shortDescription: 'Accessories',
      description: 'High-pressure hydraulic steering hose, 5 metre.',
      category: hydraulic._id,
      subcategory: hydroAccSub._id,
      price: 3200,
    },
    {
      name: 'Toggle Switch Mk11103',
      slug: slugify('toggle-switch-mk11103'),
      sku: 'prd-08/26-0016',
      shortDescription: 'Toggle Switch',
      description: 'Marine-grade toggle switch for electrical accessories.',
      category: elec._id,
      subcategory: toggleSub._id,
      price: 450,
      isFeatured: true,
      isNewArrival: true,
    },
    {
      name: 'Battery Selector Switches Mk11211',
      slug: slugify('battery-selector-switches-mk11211'),
      sku: 'prd-08/26-0017',
      shortDescription: 'Battery Selector Switches',
      description: 'Heavy-duty battery selector switch for marine electrical systems.',
      category: elec._id,
      subcategory: battSub._id,
      price: 2200,
      isBestSeller: true,
    },
    {
      name: 'Battery Selector Switches Mk11210',
      slug: slugify('battery-selector-switches-mk11210'),
      sku: 'prd-08/26-0018',
      shortDescription: 'Battery Selector Switches',
      description: 'Battery selector switch Mk11210 for dual battery setups.',
      category: elec._id,
      subcategory: battSub._id,
      price: 2100,
      isFeatured: true,
    },
    {
      name: 'Navigation Light',
      slug: slugify('navigation-light'),
      sku: 'prd-08/26-0019',
      shortDescription: 'Navigation Light',
      description: 'Exclusive offer navigation light — durable LED marine navigation light.',
      category: elec._id,
      subcategory: navSub._id,
      price: 3200,
      salePrice: 2240,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
    },
    {
      name: 'Electric Marine Horn Dual',
      slug: slugify('electric-marine-horn-dual'),
      sku: 'prd-08/26-0020',
      shortDescription: 'Horn',
      description: 'Dual trumpet electric horn, 12V marine waterproof.',
      category: elec._id,
      subcategory: hornSub._id,
      price: 1650,
      isNewArrival: true,
    },
    {
      name: 'Bilge Pump 1100 GPH',
      slug: slugify('bilge-pump-1100-gph'),
      sku: 'prd-08/26-0021',
      shortDescription: 'Pump Systems',
      description: 'Submersible bilge pump 1100 GPH with automatic float switch.',
      category: elec._id,
      subcategory: pumpSub._id,
      price: 3900,
      salePrice: 3490,
      isBestSeller: true,
      isFeatured: true,
    },
    {
      name: '6-Gang Switch Panel LED',
      slug: slugify('6-gang-switch-panel-led'),
      sku: 'prd-08/26-0022',
      shortDescription: 'SWITCH PANEL',
      description: '6-gang waterproof switch panel with LED indicators.',
      category: elec._id,
      subcategory: panelSub._id,
      price: 2750,
      isFeatured: true,
      isNewArrival: true,
    }
  );

  // Ensure every product has at least one image
  for (const p of products) {
    if (!p.images?.length) {
      p.images = [img(p.sku || p.slug || p.name)];
    }
  }

  await Product.insertMany(products);

  await Banner.insertMany([
    {
      title: 'NAVIGATION LIGHT',
      subtitle: 'Exclusive Offer -30% Off This Week',
      position: 'hero',
      link: '/products/navigation-light',
      image: img('hero-nav-light', 1200, 600),
      sortOrder: 1,
    },
    {
      title: 'Mechanical Steering',
      subtitle: 'Exclusive Offer -30% Off This Week',
      position: 'hero',
      link: '/category/mechanical-steering',
      image: img('hero-mech-steering', 1200, 600),
      sortOrder: 2,
    },
    {
      title: 'Stainless Steel Hardware',
      subtitle: 'Exclusive Offer -30% Off This Week',
      position: 'hero',
      image: img('hero-ss-hardware', 1200, 600),
      sortOrder: 3,
    },
    {
      title: 'ELECTRICAL ACCESSORIES',
      subtitle: 'Instrumentation',
      position: 'side_top',
      link: '/category/electrical-accessories',
      image: img('side-electrical', 600, 320),
      sortOrder: 1,
    },
    {
      title: 'OUTBOARD STEERING AND CONTROL SYSTEM',
      subtitle: 'Engine Control Lever',
      position: 'side_bottom',
      link: '/category/engine-control-cables-levers',
      image: img('side-control-lever', 600, 320),
      sortOrder: 1,
    },
  ]);

  await Page.insertMany([
    {
      slug: 'about-us',
      title: 'About Us',
      content:
        'We are a team of designers and developers that create high quality marine e-commerce solutions. MarineKart supplies premium marine hardware, steering systems, and electrical accessories.',
      meta: {
        phone: '0123456789',
        email: 'info@marinekart.com',
        address: 'Your address goes here..',
        hotline: '0123456789',
      },
    },
    {
      slug: 'contact-us',
      title: 'Contact Us',
      content: 'Reach out to our support team anytime.',
      meta: {
        phone: '0123456789',
        email: 'demo@example.com',
        address: 'Your address goes here..',
        hotline: '0123456789',
      },
    },
    {
      slug: 'faq',
      title: 'Frequently Asked Questions',
      content: '',
      faqItems: [
        {
          question: 'Why do I need to login to view prices?',
          answer:
            'MarineKart is a B2B-focused storefront. Product prices are shown only to registered customers and may vary for corporate customers.',
        },
        {
          question: 'How do I track my order?',
          answer: 'Log in to My Account → Orders to view status and history.',
        },
        {
          question: 'What payment modes are supported?',
          answer: 'We support COD, UPI, card, and bank transfer.',
        },
      ],
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content:
        'We respect your privacy. Personal data collected during registration and checkout is used only to fulfill orders and improve our services.',
    },
    {
      slug: 'delivery-information',
      title: 'Delivery Information',
      content: 'We offer fast delivery across serviceable regions. Delivery timelines depend on location.',
    },
  ]);

  console.log('Seed complete.');
  console.log(`Products inserted: ${products.length}`);
  console.log({
    admin: { email: admin.email, password: env.adminPassword },
    customer: { email: customer.email, password: 'Customer@123' },
    corporate: { email: dealer.email, password: 'Corporate@123', priceMultiplier: 0.85 },
  });

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
