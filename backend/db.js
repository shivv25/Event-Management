const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const FALLBACK_FILE = path.join(__dirname, 'db_fallback.json');

// Initial default data if fallback file doesn't exist
const DEFAULT_DATA = {
  users: [
    {
      _id: "usr_sarah",
      name: "Sarah Connor",
      email: "sarah@vibepass.com",
      password: "", // dynamically hashed on load
      role: "attendee",
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: "org_1",
      name: "Alex Mercer",
      email: "alex@vibepass.com",
      password: "", // dynamically hashed on load
      role: "organizer",
      profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    }
  ],
  events: [
    {
      _id: "evt_1",
      title: "Neon Soundscape Festival",
      description: "Step into a multidimensional sensory experience featuring India's leading electronic music producers. Visuals mapped in 3D projection, featuring live sets by Nucleya, Ritviz, and Divine.",
      date: "2026-07-15",
      time: "20:00",
      location: "Nesco Center, Goregaon, Mumbai",
      price: 399,
      capacity: 500,
      ticketsSold: 142,
      category: "Music",
      coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_2",
      title: "Global Tech Summit 2026",
      description: "Connect with developers, creators, and visionaries shaping the future of decentralized computing, AI agents, and immersive web technologies. Includes 3D workshops and networking dinners.",
      date: "2026-08-10",
      time: "09:00",
      location: "KTPO Convention Centre, Whitefield, Bengaluru",
      price: 999,
      capacity: 1000,
      ticketsSold: 320,
      category: "Technology",
      coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_3",
      title: "Hyper-Real Digital Art Gallery",
      description: "An exhibition of physical-digital hybrid sculptures, interactive generative paintings, and immersive VR art galleries created by global creators.",
      date: "2026-09-05",
      time: "18:00",
      location: "National Gallery of Modern Art, New Delhi",
      price: 199,
      capacity: 200,
      ticketsSold: 98,
      category: "Art",
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_4",
      title: "Startup Venture Pitch 2026",
      description: "Witness the next generation of tech founders pitch their revolutionary ideas to global venture capitalists. Get tickets to network with angel investors, VC partners, and innovators.",
      date: "2026-10-12",
      time: "14:00",
      location: "T-Hub Phase 2, Madhapur, Hyderabad",
      price: 599,
      capacity: 300,
      ticketsSold: 120,
      category: "Business",
      coverImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_5",
      title: "Acoustic Sunset Session",
      description: "An intimate evening under the stars featuring unplugged performances from top indie singer-songwriters. Enjoy organic wines, cozy fire pits, and pure acoustic vibes with live sets by Prateek Kuhad, Anuv Jain, and Local Train.",
      date: "2026-07-28",
      time: "17:30",
      location: "Vagator Beach Hilltop, Anjuna, Goa",
      price: 299,
      capacity: 150,
      ticketsSold: 145,
      category: "Music",
      coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_6",
      title: "Cybersecurity Hackathon v3",
      description: "Join hundreds of security analysts, programmers, and white-hat hackers to solve complex capture-the-flag (CTF) challenges. Prizes worth $50,000 up for grabs.",
      date: "2026-08-22",
      time: "10:00",
      location: "IIT Madras Research Park, Taramani, Chennai",
      price: 199,
      capacity: 1500,
      ticketsSold: 924,
      category: "Technology",
      coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_7",
      title: "NFT & Web3 Creators Expo",
      description: "Connect with digital artists, smart contract devs, and Web3 visionaries. Experience spatial galleries and check out presentations on decentralized physical networks.",
      date: "2026-09-18",
      time: "11:00",
      location: "Nasscom Start-up Warehouse, Diamond District, Bengaluru",
      price: 499,
      capacity: 400,
      ticketsSold: 180,
      category: "Art",
      coverImage: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_8",
      title: "E-Commerce Growth Masterclass",
      description: "Learn advanced frameworks for scaling your store to $10M+ ARR. Topics include high-conversion checkouts, organic TikTok marketing, and programmatic retention flows.",
      date: "2026-10-25",
      time: "09:30",
      location: "Taj Lands End, Bandra West, Mumbai",
      price: 899,
      capacity: 250,
      ticketsSold: 112,
      category: "Business",
      coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_9",
      title: "Jazz & Wine Midnight Club",
      description: "Relax to the soothing sounds of live smooth jazz while tasting award-winning wines from local vineyards. Dim lighting, plush velvet seating, and sophisticated melodies featuring AR Rahman's instrumental ensemble.",
      date: "2026-07-10",
      time: "21:30",
      location: "Someplace Else, Park Street, Kolkata",
      price: 399,
      capacity: 100,
      ticketsSold: 88,
      category: "Music",
      coverImage: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_10",
      title: "AI Agent Hackathon & Demo Day",
      description: "Build autonomous software agents that execute multi-step workflows. Team up, code for 48 hours, and present to top builders in generative AI and LLM infrastructure.",
      date: "2026-08-05",
      time: "18:00",
      location: "Indiranagar AI Club Hub, Bengaluru",
      price: 199,
      capacity: 350,
      ticketsSold: 310,
      category: "Technology",
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_11",
      title: "Interactive Fluid Art Workshop",
      description: "Unleash your inner creator. Learn acrylic pouring techniques to design beautiful marbled canvases. All materials (acrylics, canvases, resin) and light snacks are provided.",
      date: "2026-09-12",
      time: "13:00",
      location: "Kala Ghoda Art District, Fort, Mumbai",
      price: 449,
      capacity: 80,
      ticketsSold: 74,
      category: "Art",
      coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_12",
      title: "Corporate Leadership Forum",
      description: "Understand structural pivots and leadership frameworks required to navigate high-volatility markets. Keynotes from executives of leading Indian tech giants.",
      date: "2026-11-05",
      time: "08:30",
      location: "Bharat Mandapam, Pragati Maidan, New Delhi",
      price: 999,
      capacity: 500,
      ticketsSold: 215,
      category: "Business",
      coverImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_13",
      title: "Retro Synthwave Arena",
      description: "A high-octane 80s throwback concert. Immersive laser lights, dynamic neon vectors, and heavy analog synthesizers featuring a special synth retrowave set by Arijit Singh & Diljit Dosanjh.",
      date: "2026-07-20",
      time: "22:00",
      location: "Hard Rock Cafe, Koregaon Park, Pune",
      price: 299,
      capacity: 600,
      ticketsSold: 410,
      category: "Music",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_14",
      title: "Quantum Computing Symposium",
      description: "An in-depth academic survey covering topological qubits, superconducting circuits, and quantum error correction codes. Join researchers from IISc and top institutions.",
      date: "2026-08-30",
      time: "13:30",
      location: "IISc Seminar Hall, Bangalore",
      price: 799,
      capacity: 400,
      ticketsSold: 180,
      category: "Technology",
      coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_15",
      title: "Abstract Sculptures Exhibit",
      description: "Stunning modern steel, glass, and clay abstract expressions from award-winning minimalist Indian artists. Curator-guided tours are available every hour.",
      date: "2026-09-24",
      time: "10:00",
      location: "Jehangir Art Gallery, Kala Ghoda, Mumbai",
      price: 199,
      capacity: 250,
      ticketsSold: 130,
      category: "Art",
      coverImage: "https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_16",
      title: "Global Finance & Crypto Panel",
      description: "A panel discussion exploring macroeconomics, stablecoin regulations, and central bank digital currencies (CBDCs) like Digital Rupee (e-Rupee) yields.",
      date: "2026-11-18",
      time: "15:00",
      location: "GIFT City Tower, Gandhinagar, Gujarat",
      price: 699,
      capacity: 400,
      ticketsSold: 290,
      category: "Business",
      coverImage: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_17",
      title: "Jharkhand Folk & Tribal Music Fest",
      description: "Experience the vibrant tribal rhythms and traditional folk music of Jharkhand. Live instrumental performances of Mandar, Nagara, and Flute by local artisans.",
      date: "2026-07-15",
      time: "18:00",
      location: "Morabadi Ground, Ranchi, Jharkhand",
      price: 19,
      capacity: 1000,
      ticketsSold: 0,
      category: "Music",
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_18",
      title: "Jamshedpur Tech Innovators Meet",
      description: "A gathering of developers, engineers, and tech enthusiasts in the Steel City. Workshops on AI agents, local startup incubation, and Web3 development.",
      date: "2026-08-20",
      time: "10:00",
      location: "XLRI Auditorium, Bistupur, Jamshedpur, Jharkhand",
      price: 19,
      capacity: 500,
      ticketsSold: 0,
      category: "Technology",
      coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_19",
      title: "Sohrai & Khovar Painting Exhibition",
      description: "Witness the beautiful, traditional mural art of Hazaribagh. Learn Sohrai and Khovar painting techniques from master tribal artists of Jharkhand.",
      date: "2026-09-10",
      time: "11:00",
      location: "Town Hall Art Gallery, Hazaribagh, Jharkhand",
      price: 19,
      capacity: 300,
      ticketsSold: 0,
      category: "Art",
      coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_20",
      title: "Steel City Business Conclave",
      description: "Connect with industrial leaders, manufacturers, and entrepreneurs in Jamshedpur. Focus on supply chain scaling, metallic processing, and modern manufacturing paradigms.",
      date: "2026-10-05",
      time: "09:30",
      location: "Tatanagar Chamber of Commerce, Bistupur, Jamshedpur, Jharkhand",
      price: 19,
      capacity: 400,
      ticketsSold: 0,
      category: "Business",
      coverImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_21",
      title: "Jamshedpur Acoustic Unplugged Night",
      description: "An intimate acoustic sunset session in Jamshedpur featuring unplugged indie covers and regional melodies. Enjoy live sets by local singer-songwriters.",
      date: "2026-07-28",
      time: "17:30",
      location: "Jubilee Park Amphitheatre, Sakchi, Jamshedpur, Jharkhand",
      price: 19,
      capacity: 250,
      ticketsSold: 0,
      category: "Music",
      coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_22",
      title: "Ranchi Smart City Hackathon",
      description: "Build tech solutions for sustainable municipal scaling, green waste management, and traffic optimization. Win prize pools and mentoring from tech mentors.",
      date: "2026-08-25",
      time: "09:00",
      location: "BIT Mesra Seminar Hall, Ranchi, Jharkhand",
      price: 19,
      capacity: 600,
      ticketsSold: 0,
      category: "Technology",
      coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_23",
      title: "Jamshedpur Digital Art & Craft Fair",
      description: "Explore digital illustration portfolios, traditional pottery, and hand-carved stone art in Jamshedpur. Immersive local artist booths.",
      date: "2026-09-15",
      time: "12:00",
      location: "Michael John Auditorium, Kadma, Jamshedpur, Jharkhand",
      price: 19,
      capacity: 350,
      ticketsSold: 0,
      category: "Art",
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_24",
      title: "Jharkhand Startup & Angel Network Summit",
      description: "The premier startup venture conclave in Ranchi. Connect Jharkhand founders with angel networks and venture capitalists for funding and ecosystem growth.",
      date: "2026-10-20",
      time: "10:00",
      location: "Chanakya BNR Hotel Conference Hall, Ranchi, Jharkhand",
      price: 19,
      capacity: 400,
      ticketsSold: 0,
      category: "Business",
      coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_25",
      title: "Steel City Rock Arena",
      description: "A high-octane rock concert in Jamshedpur. Dynamic lighting, high-wattage spatial sound, and heavy guitar riffs featuring regional rock bands.",
      date: "2026-07-22",
      time: "20:00",
      location: "G-Town Club Ground, Bistupur, Jamshedpur, Jharkhand",
      price: 19,
      capacity: 800,
      ticketsSold: 0,
      category: "Music",
      coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    },
    {
      _id: "evt_26",
      title: "Bokaro Web & Mobile Dev Workshop",
      description: "Learn React, Node.js, and deployment essentials in Bokaro Steel City. Hands-on coding session for students and software professionals.",
      date: "2026-08-30",
      time: "14:00",
      location: "Library Hall, Sector 4, Bokaro Steel City, Jharkhand",
      price: 19,
      capacity: 200,
      ticketsSold: 0,
      category: "Technology",
      coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
      organizerId: "org_1"
    }
  ],
  bookings: [
    {
      _id: "bk_1",
      eventId: "evt_1",
      userId: "usr_sarah",
      status: "checked-in",
      ticketCode: "tkt_soundscape_checked",
      attendeeDetails: { name: "Sarah Connor", email: "sarah@vibepass.com" },
      paymentDetails: { paymentId: "ch_mock_1", amount: 399 },
      purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "bk_2",
      eventId: "evt_1",
      userId: "usr_john",
      status: "booked",
      ticketCode: "tkt_soundscape_valid",
      attendeeDetails: { name: "John Connor", email: "john@vibepass.com" },
      paymentDetails: { paymentId: "ch_mock_2", amount: 399 },
      purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "bk_3",
      eventId: "evt_2",
      userId: "usr_sarah",
      status: "checked-in",
      ticketCode: "tkt_summit_checked",
      attendeeDetails: { name: "Sarah Connor", email: "sarah@vibepass.com" },
      paymentDetails: { paymentId: "ch_mock_3", amount: 999 },
      purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "bk_4",
      eventId: "evt_3",
      userId: "usr_bobby",
      status: "booked",
      ticketCode: "tkt_art_valid",
      attendeeDetails: { name: "Bobby Drake", email: "bobby@vibepass.com" },
      paymentDetails: { paymentId: "ch_mock_4", amount: 199 },
      purchaseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "bk_5",
      eventId: "evt_4",
      userId: "usr_peter",
      status: "checked-in",
      ticketCode: "tkt_pitch_checked",
      attendeeDetails: { name: "Peter Parker", email: "peter@vibepass.com" },
      paymentDetails: { paymentId: "ch_mock_5", amount: 599 },
      purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

// Force all default event prices to 19 INR
DEFAULT_DATA.events.forEach(e => { e.price = 19; });
DEFAULT_DATA.bookings.forEach(b => { if (b.paymentDetails) b.paymentDetails.amount = 19; });

// State
let isMongoConnected = false;
let fallbackStore = { ...DEFAULT_DATA };

// Load fallback store
function hashDefaultUsers() {
  const hash = bcrypt.hashSync('password123', 10);
  DEFAULT_DATA.users.forEach(u => {
    if (!u.password) u.password = hash;
  });
}

function loadFallback() {
  try {
    hashDefaultUsers();
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8');
      fallbackStore = JSON.parse(data);
      // Ensure local JSON DB contains the default users
      if (!fallbackStore.users || fallbackStore.users.length === 0) {
        console.log("Seeding local JSON database with default users...");
        fallbackStore.users = [ ...DEFAULT_DATA.users ];
        saveFallback();
      } else {
        // Ensure legacy user records have a profilePicture field
        let updated = false;
        fallbackStore.users.forEach(u => {
          if (!u.profilePicture) {
            u.profilePicture = u.role === 'attendee' 
              ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
              : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
            updated = true;
          }
        });
        if (updated) saveFallback();
      }
      // Ensure local JSON DB contains the new 16 events if it was created with only the legacy 3 events
      if (!fallbackStore.events || fallbackStore.events.length < 5) {
        console.log("Upgrading local JSON database file with 16 default events...");
        fallbackStore.events = [ ...DEFAULT_DATA.events ];
        saveFallback();
      }
      // Ensure bookings are seeded as well if local JSON database lacks them
      if (!fallbackStore.bookings || fallbackStore.bookings.length === 0) {
        console.log("Seeding local JSON database with initial booking samples...");
        fallbackStore.bookings = [ ...DEFAULT_DATA.bookings ];
        saveFallback();
      }

      // Synchronize default event details in local JSON fallback
      DEFAULT_DATA.events.forEach(e => {
        const mappedPrice = e.category === 'Music' ? 99 : e.category === 'Technology' ? 89 : e.category === 'Business' ? 79 : 59;
        e.price = mappedPrice;
        const existingIndex = fallbackStore.events.findIndex(fe => fe._id === e._id);
        if (existingIndex !== -1) {
          fallbackStore.events[existingIndex] = { ...fallbackStore.events[existingIndex], ...e };
        } else {
          fallbackStore.events.push(e);
        }
      });

      // Synchronize default bookings in local JSON fallback
      DEFAULT_DATA.bookings.forEach(b => {
        const existing = fallbackStore.bookings.find(fb => fb._id === b._id);
        if (existing) {
          if (!existing.paymentDetails) existing.paymentDetails = {};
          const event = DEFAULT_DATA.events.find(ev => ev._id === b.eventId);
          existing.paymentDetails.amount = event ? event.price : 99;
        }
      });

      // Migrate existing/custom event prices to range [59, 99]
      fallbackStore.events.forEach(e => {
        if (e.price < 59 || e.price > 99) {
          e.price = e.category === 'Music' ? 99 : e.category === 'Technology' ? 89 : e.category === 'Business' ? 79 : 59;
        }
      });
      fallbackStore.bookings.forEach(b => {
        const event = fallbackStore.events.find(ev => ev._id === b.eventId);
        if (event && b.paymentDetails) {
          b.paymentDetails.amount = event.price;
        }
      });

      saveFallback();
    } else {
      saveFallback();
    }
  } catch (err) {
    console.error("Failed to load JSON DB fallback, using defaults:", err);
  }
}

// Save fallback store
function saveFallback() {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(fallbackStore, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to save JSON DB fallback:", err);
  }
}

// Initialize connection
async function initDB() {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event-manager";
  try {
    console.log(`Connecting to MongoDB at: ${mongoURI}...`);
    // Set connection timeout to 3 seconds so fallback loads quickly if mongo is not running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    isMongoConnected = true;
    console.log("MongoDB connected successfully! Using Mongoose Models.");
    
    // Force update all events and bookings in MongoDB to 19 INR
    await MongoEvent.updateMany({}, { $set: { price: 19 } });
    await MongoBooking.updateMany({}, { $set: { "paymentDetails.amount": 19 } });

    hashDefaultUsers();

    // Seed default users into MongoDB if empty
    const userCount = await MongoUser.countDocuments();
    if (userCount === 0) {
      console.log("Seeding default users into MongoDB...");
      await MongoUser.insertMany(DEFAULT_DATA.users);
    } else {
      // Ensure existing seeded users have their default profile pictures
      await MongoUser.updateMany({ email: 'sarah@vibepass.com', profilePicture: { $exists: false } }, { $set: { profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' } });
      await MongoUser.updateMany({ email: 'alex@vibepass.com', profilePicture: { $exists: false } }, { $set: { profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' } });
    }

    // Seed default events into MongoDB if empty
    const count = await MongoEvent.countDocuments();
    if (count === 0) {
      console.log("Seeding 16 default events into MongoDB...");
      await MongoEvent.insertMany(DEFAULT_DATA.events);
    } else {
      console.log("Synchronizing default events details and price updates...");
      for (const e of DEFAULT_DATA.events) {
        const mappedPrice = e.category === 'Music' ? 99 : e.category === 'Technology' ? 89 : e.category === 'Business' ? 79 : 59;
        e.price = mappedPrice;
        await MongoEvent.findByIdAndUpdate(
          e._id,
          { 
            $set: { 
              title: e.title,
              description: e.description,
              date: e.date,
              time: e.time,
              location: e.location,
              price: e.price,
              capacity: e.capacity,
              ticketsSold: e.ticketsSold,
              category: e.category,
              coverImage: e.coverImage,
              organizerId: e.organizerId
            } 
          },
          { upsert: true, new: true }
        );
      }
      
      // Migrate any existing/custom MongoDB events whose prices are out of the [59, 99] range
      await MongoEvent.updateMany({ price: { $lt: 59 } }, { $set: { price: 99 } });
      await MongoEvent.updateMany({ price: { $gt: 99 } }, { $set: { price: 99 } });
    }

    // Seed default bookings into MongoDB if empty
    const bookingsCount = await MongoBooking.countDocuments();
    if (bookingsCount === 0) {
      console.log("Seeding default bookings into MongoDB...");
      await MongoBooking.insertMany(DEFAULT_DATA.bookings);
    } else {
      for (const b of DEFAULT_DATA.bookings) {
        const event = DEFAULT_DATA.events.find(ev => ev._id === b.eventId);
        const amount = event ? event.price : 99;
        await MongoBooking.findByIdAndUpdate(b._id, { $set: { "paymentDetails.amount": amount } });
      }
      // Migrate existing bookings to match their respective event price
      const allBookings = await MongoBooking.find({});
      for (const b of allBookings) {
        const ev = await MongoEvent.findById(b.eventId);
        if (ev) {
          await MongoBooking.findByIdAndUpdate(b._id, { $set: { "paymentDetails.amount": ev.price } });
        }
      }
    }
  } catch (err) {
    console.warn("MongoDB connection failed! Falling back to Local JSON database.");
    console.warn(`Error detail: ${err.message}`);
    isMongoConnected = false;
    loadFallback();
  }
}

// --- MONGOOSE SCHEMAS ---
const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['organizer', 'attendee'], default: 'attendee' },
  profilePicture: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }
});

const EventSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  ticketsSold: { type: Number, default: 0 },
  category: { type: String, required: true },
  coverImage: { type: String, required: true },
  organizerId: { type: String, required: true }
});

const BookingSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  purchaseDate: { type: String, default: () => new Date().toISOString() },
  status: { type: String, enum: ['booked', 'cancelled', 'checked-in'], default: 'booked' },
  ticketCode: { type: String, required: true, unique: true },
  attendeeDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  paymentDetails: {
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true }
  }
});

const MongoUser = mongoose.model('User', UserSchema);
const MongoEvent = mongoose.model('Event', EventSchema);
const MongoBooking = mongoose.model('Booking', BookingSchema);

// --- FALLBACK IN-MEMORY IMPLEMENTATION MOCKING MONGOOSE API ---
const mockID = () => '_' + Math.random().toString(36).substr(2, 9);

const UserFallback = {
  findOne: async (query) => {
    return fallbackStore.users.find(u => {
      return Object.entries(query).every(([k, v]) => u[k] === v);
    }) || null;
  },
  findById: async (id) => {
    return fallbackStore.users.find(u => u._id === id) || null;
  },
  create: async (data) => {
    const newUser = { _id: mockID(), profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', ...data };
    fallbackStore.users.push(newUser);
    saveFallback();
    return newUser;
  },
  findByIdAndUpdate: async (id, update) => {
    const idx = fallbackStore.users.findIndex(u => u._id === id);
    if (idx === -1) return null;
    fallbackStore.users[idx] = { ...fallbackStore.users[idx], ...update };
    saveFallback();
    return fallbackStore.users[idx];
  }
};

const EventFallback = {
  find: async (query = {}) => {
    // Basic query filter support
    let filtered = [...fallbackStore.events];
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) {
        filtered = filtered.filter(e => e[k] === v);
      }
    });
    return filtered;
  },
  findById: async (id) => {
    return fallbackStore.events.find(e => e._id === id) || null;
  },
  create: async (data) => {
    const newEvent = { _id: mockID(), ticketsSold: 0, ...data };
    fallbackStore.events.push(newEvent);
    saveFallback();
    return newEvent;
  },
  findByIdAndUpdate: async (id, update, options = {}) => {
    const idx = fallbackStore.events.findIndex(e => e._id === id);
    if (idx === -1) return null;
    const current = fallbackStore.events[idx];
    
    // Support update operators if any ($inc)
    let updated = { ...current };
    if (update.$inc) {
      Object.entries(update.$inc).forEach(([k, v]) => {
        updated[k] = (updated[k] || 0) + v;
      });
    }
    
    // Normal fields
    const normalFields = Object.keys(update).filter(k => !k.startsWith('$'));
    normalFields.forEach(k => {
      updated[k] = update[k];
    });

    fallbackStore.events[idx] = updated;
    saveFallback();
    return updated;
  },
  findByIdAndDelete: async (id) => {
    const idx = fallbackStore.events.findIndex(e => e._id === id);
    if (idx === -1) return null;
    const deleted = fallbackStore.events.splice(idx, 1)[0];
    saveFallback();
    return deleted;
  }
};

const BookingFallback = {
  find: async (query = {}) => {
    let filtered = [...fallbackStore.bookings];
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) {
        filtered = filtered.filter(b => b[k] === v);
      }
    });
    return filtered;
  },
  findOne: async (query = {}) => {
    return fallbackStore.bookings.find(b => {
      return Object.entries(query).every(([k, v]) => b[k] === v);
    }) || null;
  },
  findById: async (id) => {
    return fallbackStore.bookings.find(b => b._id === id) || null;
  },
  create: async (data) => {
    const newBooking = { _id: mockID(), purchaseDate: new Date().toISOString(), status: 'booked', ...data };
    fallbackStore.bookings.push(newBooking);
    saveFallback();
    return newBooking;
  },
  findByIdAndUpdate: async (id, update) => {
    const idx = fallbackStore.bookings.findIndex(b => b._id === id);
    if (idx === -1) return null;
    fallbackStore.bookings[idx] = { ...fallbackStore.bookings[idx], ...update };
    saveFallback();
    return fallbackStore.bookings[idx];
  }
};

const ObjectId = mongoose.Types.ObjectId;
const matchId = (id) => {
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { _id: new ObjectId(id) }] };
  }
  return { _id: id };
};

const formatUpdate = (update) => {
  const keys = Object.keys(update);
  const hasOperator = keys.some(k => k.startsWith('$'));
  return hasOperator ? update : { $set: update };
};

// Unified exports that automatically check connection state
module.exports = {
  initDB,
  isMongoConnected: () => isMongoConnected,
  User: {
    findOne: (q) => isMongoConnected ? MongoUser.findOne(q) : UserFallback.findOne(q),
    findById: async (id) => {
      if (isMongoConnected) {
        return mongoose.connection.db.collection('users').findOne(matchId(id));
      } else {
        return UserFallback.findById(id);
      }
    },
    create: (data) => isMongoConnected ? MongoUser.create(data) : UserFallback.create(data),
    findByIdAndUpdate: async (id, update, opt) => {
      if (isMongoConnected) {
        const q = matchId(id);
        const col = mongoose.connection.db.collection('users');
        await col.updateOne(q, formatUpdate(update));
        return col.findOne(q);
      } else {
        return UserFallback.findByIdAndUpdate(id, update, opt);
      }
    }
  },
  Event: {
    find: (q) => isMongoConnected ? MongoEvent.find(q) : EventFallback.find(q),
    findById: async (id) => {
      if (isMongoConnected) {
        return mongoose.connection.db.collection('events').findOne(matchId(id));
      } else {
        return EventFallback.findById(id);
      }
    },
    create: (data) => isMongoConnected ? MongoEvent.create(data) : EventFallback.create(data),
    findByIdAndUpdate: async (id, update, opt) => {
      if (isMongoConnected) {
        const q = matchId(id);
        const col = mongoose.connection.db.collection('events');
        await col.updateOne(q, formatUpdate(update));
        return col.findOne(q);
      } else {
        return EventFallback.findByIdAndUpdate(id, update, opt);
      }
    },
    findByIdAndDelete: async (id) => {
      if (isMongoConnected) {
        const q = matchId(id);
        const col = mongoose.connection.db.collection('events');
        const doc = await col.findOne(q);
        if (doc) {
          await col.deleteOne(q);
        }
        return doc;
      } else {
        return EventFallback.findByIdAndDelete(id);
      }
    }
  },
  Booking: {
    find: (q) => isMongoConnected ? MongoBooking.find(q) : BookingFallback.find(q),
    findOne: (q) => isMongoConnected ? MongoBooking.findOne(q) : BookingFallback.findOne(q),
    findById: async (id) => {
      if (isMongoConnected) {
        return mongoose.connection.db.collection('bookings').findOne(matchId(id));
      } else {
        return BookingFallback.findById(id);
      }
    },
    create: (data) => isMongoConnected ? MongoBooking.create(data) : BookingFallback.create(data),
    findByIdAndUpdate: async (id, update, opt) => {
      if (isMongoConnected) {
        const q = matchId(id);
        const col = mongoose.connection.db.collection('bookings');
        await col.updateOne(q, formatUpdate(update));
        return col.findOne(q);
      } else {
        return BookingFallback.findByIdAndUpdate(id, update, opt);
      }
    }
  }
};
