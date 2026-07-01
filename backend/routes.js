const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { sendOtpEmail, sendBillingAlertEmail } = require('./mail');
const crypto = require('crypto');
const Razorpay = require('razorpay');

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim()
    });
    console.log("Razorpay SDK initialized successfully with environment credentials.");
  } catch (err) {
    console.error("Razorpay SDK initialization error:", err.message);
  }
} else {
  console.log("No RAZORPAY_KEY_ID found in environment. Running Razorpay in stylized Sandbox Fallback mode.");
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_event_management_key';

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token is invalid or expired' });
    req.user = user;
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Requires role: ${role}` });
    }
    next();
  };
};

// --- AUTH ROUTES ---

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, profilePicture } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailKey = email.toLowerCase();
    const existingUser = await db.User.findOne({ email: emailKey });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit Registration OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempUserStore[emailKey] = {
      name,
      email: emailKey,
      password: hashedPassword,
      role: role || 'attendee',
      profilePicture: profilePicture || '',
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes expiration
    };

    console.log(`[Registration OTP Sandbox] OTP code generated for ${email}: ${otp}`);

    // Send SMTP verification email
    const etherealPreviewUrl = await sendOtpEmail(emailKey, otp);

    const isSandbox = !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS;
    res.status(201).json({
      otpRequired: true,
      email: emailKey,
      ...(isSandbox ? { mockOtp: otp, etherealPreviewUrl } : {})
    });
  } catch (err) {
    console.error("Server registration error:", err);
    res.status(500).json({ 
      error: 'Server registration error', 
      details: err.message,
      stack: err.stack 
    });
  }
});

// In-memory OTP storage: { email: { otp, expiresAt } }
const tempUserStore = {};
const resetOtpStore = {};

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await db.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Direct Login (no 2FA login OTP verification requested!)
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture }
    });
  } catch (err) {
    console.error("Server login error:", err);
    res.status(500).json({ 
      error: 'Server login error', 
      details: err.message,
      stack: err.stack 
    });
  }
});

// Verify OTP and complete registration
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Missing email or OTP code' });
    }

    const emailKey = email.toLowerCase();
    const tempUser = tempUserStore[emailKey];

    if (!tempUser) {
      return res.status(400).json({ error: 'No registration session found or expired' });
    }

    if (Date.now() > tempUser.expiresAt) {
      delete tempUserStore[emailKey];
      return res.status(400).json({ error: 'OTP code has expired. Please register again.' });
    }

    if (tempUser.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification OTP code. Try again.' });
    }

    // OTP matches! Create the user in database
    const newUser = await db.User.create({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      role: tempUser.role,
      profilePicture: tempUser.profilePicture
    });

    delete tempUserStore[emailKey];

    const token = jwt.sign({ id: newUser._id, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, profilePicture: newUser.profilePicture }
    });
  } catch (err) {
    console.error("Registration OTP verification failed:", err);
    res.status(500).json({ 
      error: 'Registration OTP verification failed', 
      details: err.message,
      stack: err.stack 
    });
  }
});

// Request password reset OTP
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please enter your email address' });
    }

    const emailKey = email.toLowerCase();
    const user = await db.User.findOne({ email: emailKey });
    if (!user) {
      return res.status(400).json({ error: 'No account registered with this email address' });
    }

    // Generate 6-digit Reset OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    resetOtpStore[emailKey] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins expiration
    };

    console.log(`[Forgot Password OTP Sandbox] Reset code generated for ${email}: ${otp}`);

    // Send reset verification email
    const etherealPreviewUrl = await sendOtpEmail(emailKey, otp);

    const isSandbox = !process.env.SMTP_HOST;
    res.json({
      otpRequired: true,
      email: user.email,
      ...(isSandbox ? { mockOtp: otp, etherealPreviewUrl } : {})
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// Reset password with verification OTP
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Missing email, OTP code, or new password' });
    }

    const emailKey = email.toLowerCase();
    const storedRecord = resetOtpStore[emailKey];

    if (!storedRecord) {
      return res.status(400).json({ error: 'No OTP generated or expired' });
    }

    if (Date.now() > storedRecord.expiresAt) {
      delete resetOtpStore[emailKey];
      return res.status(400).json({ error: 'Verification code has expired. Try again.' });
    }

    if (storedRecord.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await db.User.findOne({ email: emailKey });
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    await db.User.findByIdAndUpdate(user._id, { password: hashedPassword });
    delete resetOtpStore[emailKey];

    // Auto-login after password reset
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset password transaction failed' });
  }
});

// Get Current User Profile
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture });
  } catch (err) {
    res.status(500).json({ error: 'Profile fetch error' });
  }
});

// Update User Profile
router.put('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, profilePicture } = req.body;
    const userId = req.user.id;

    const user = await db.User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updates = {};
    if (name) updates.name = name;
    if (profilePicture) updates.profilePicture = profilePicture;
    if (email) {
      const lowerEmail = email.toLowerCase();
      if (lowerEmail !== user.email) {
        const existing = await db.User.findOne({ email: lowerEmail });
        if (existing) {
          return res.status(400).json({ error: 'Email already in use by another user' });
        }
        updates.email = lowerEmail;
      }
    }
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.User.findByIdAndUpdate(userId, updates, { new: true });
    
    // Generate fresh JWT token with updated info
    const token = jwt.sign(
      { id: updatedUser._id, role: updatedUser.role, name: updatedUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, profilePicture: updatedUser.profilePicture }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// --- EVENTS ROUTES ---

// List Events
router.get('/events', async (req, res) => {
  try {
    const { category, search } = req.query;
    let events = await db.Event.find();

    if (category) {
      events = events.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get Event Details
router.get('/events/:id', async (req, res) => {
  try {
    const event = await db.Event.findById(req.path.substring(8) || req.params.id);
    const parsedId = req.params.id;
    const finalEvent = await db.Event.findById(parsedId);
    if (!finalEvent) return res.status(404).json({ error: 'Event not found' });
    res.json(finalEvent);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching event details' });
  }
});

// Create Event (Organizer Only)
router.post('/events', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { title, description, date, time, location, price, capacity, category, coverImage } = req.body;
    if (!title || !description || !date || !time || !location || price === undefined || !capacity || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const defaultCover = coverImage || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80";

    const newEvent = await db.Event.create({
      title,
      description,
      date,
      time,
      location,
      price: Number(price),
      capacity: Number(capacity),
      category,
      coverImage: defaultCover,
      organizerId: req.user.id
    });

    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update Event (Organizer Only)
router.put('/events/:id', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const event = await db.Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Check if organizer owns this event
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this event' });
    }

    const updatedEvent = await db.Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete Event (Organizer Only)
router.delete('/events/:id', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const event = await db.Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    await db.Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});


// --- RAZORPAY PAYMENT ENDPOINTS ---

// 1. Create Razorpay Order
router.post('/bookings/razorpay-order', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required to create order' });
    }

    const event = await db.Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.ticketsSold >= event.capacity) {
      return res.status(400).json({ error: 'Event is sold out' });
    }

    const amountInPaise = event.price * 100;

    if (razorpayInstance) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: 'rcpt_' + Math.random().toString(36).substr(2, 9),
        payment_capture: 1
      };
      
      const order = await razorpayInstance.orders.create(options);
      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID.trim(),
        isSimulated: false
      });
    } else {
      // Sandbox Fallback Simulator Mode
      const simulatedOrderId = 'order_mock_' + Math.random().toString(36).substr(2, 14);
      res.json({
        id: simulatedOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: 'rzp_test_dummy_key_id',
        isSimulated: true
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Razorpay payment order' });
  }
});

// 2. Verify Razorpay Payment Signature & Record Booking
router.post('/bookings/razorpay-verify', authenticateToken, async (req, res) => {
  try {
    const { 
      eventId, 
      attendeeName, 
      attendeeEmail, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      isSimulated 
    } = req.body;

    if (!eventId || !attendeeName || !attendeeEmail || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing payment validation details' });
    }

    const event = await db.Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.ticketsSold >= event.capacity) {
      return res.status(400).json({ error: 'Event is sold out' });
    }

    // Deduplication check: verify this UTR has not been claimed/used already
    const isMongo = db.isMongoConnected();
    let duplicate = null;
    if (isMongo) {
      duplicate = await db.Booking.findOne({ "paymentDetails.paymentId": razorpay_payment_id });
    } else {
      const bookingsList = await db.Booking.find({});
      duplicate = bookingsList.find(b => b.paymentDetails && b.paymentDetails.paymentId === razorpay_payment_id);
    }

    if (duplicate) {
      return res.status(400).json({ error: 'This UPI Transaction UTR Reference has already been used for another booking!' });
    }

    // Verify signature & validate UTR format patterns
    let signatureVerified = false;
    if (isSimulated || razorpay_order_id.startsWith('order_mock_')) {
      // Verify UPI UTR format (must be 12-digit numeric starting with 6 for 2026 UPI transactions)
      const utrRegex = /^6\d{11}$/;
      if (!utrRegex.test(razorpay_payment_id)) {
        return res.status(400).json({ 
          error: 'Invalid UPI Transaction Ref No. A valid 2026 transaction ID must be a 12-digit number starting with the year code 6 (e.g. 6xxxxxxxxxxx). Please check your payment receipt.' 
        });
      }
      signatureVerified = true;
      console.log(`[Razorpay Sandbox Simulation] Payment Verified. Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);
    } else {
      if (!razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment signature for real transaction validation' });
      }
      
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET.trim())
        .update(body.toString())
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        signatureVerified = true;
      }
    }

    if (!signatureVerified) {
      return res.status(400).json({ error: 'Razorpay signature validation failed. Transaction rejected.' });
    }

    // Create the ticket record
    const uniqueTicketCode = 'tkt_' + Math.random().toString(36).substr(2, 10) + '_' + Date.now();
    const newBooking = await db.Booking.create({
      eventId: event._id,
      userId: req.user.id,
      status: 'booked',
      ticketCode: uniqueTicketCode,
      attendeeDetails: {
        name: attendeeName,
        email: attendeeEmail
      },
      paymentDetails: {
        paymentId: razorpay_payment_id,
        amount: event.price
      }
    });

    // Increment tickets sold counter on event
    await db.Event.findByIdAndUpdate(eventId, {
      $inc: { ticketsSold: 1 }
    });

    // Send async billing alert email notification receipt
    sendBillingAlertEmail(attendeeEmail, attendeeName, event, newBooking).catch(err => {
      console.error("Async billing alert mail delivery failed:", err);
    });

    res.status(201).json(newBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});


// Book Ticket (Simulated Payment included)
router.post('/bookings', authenticateToken, async (req, res) => {
  try {
    const { eventId, attendeeName, attendeeEmail, paymentCardNumber } = req.body;
    if (!eventId || !attendeeName || !attendeeEmail) {
      return res.status(400).json({ error: 'Missing booking details' });
    }

    const event = await db.Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.ticketsSold >= event.capacity) {
      return res.status(400).json({ error: 'Event is sold out' });
    }

    // High fidelity payment simulator
    if (paymentCardNumber && paymentCardNumber.replace(/\s/g, '').startsWith('4111')) {
      // Simulate Stripe/Gateway card declined for credit card demo
      return res.status(402).json({ error: 'Card Declined. Simulated checkout failure.' });
    }

    const simulatedPaymentId = 'ch_' + Math.random().toString(36).substr(2, 14);
    const uniqueTicketCode = 'tkt_' + Math.random().toString(36).substr(2, 10) + '_' + Date.now();

    // Create the booking
    const newBooking = await db.Booking.create({
      eventId: event._id,
      userId: req.user.id,
      status: 'booked',
      ticketCode: uniqueTicketCode,
      attendeeDetails: {
        name: attendeeName,
        email: attendeeEmail
      },
      paymentDetails: {
        paymentId: simulatedPaymentId,
        amount: event.price
      }
    });

    // Increment ticketsSold on event
    await db.Event.findByIdAndUpdate(eventId, {
      $inc: { ticketsSold: 1 }
    });

    // Send async billing alert email notification receipt
    sendBillingAlertEmail(attendeeEmail, attendeeName, event, newBooking).catch(err => {
      console.error("Async billing alert mail delivery failed:", err);
    });

    res.status(201).json(newBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process ticket booking' });
  }
});

// View My Bookings
router.get('/bookings/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.Booking.find({ userId: req.user.id });
    // Hydrate event details manually
    const hydratedBookings = await Promise.all(bookings.map(async (b) => {
      const bookingObj = b.toObject ? b.toObject() : (b._doc || b);
      const eventObj = await db.Event.findById(bookingObj.eventId);
      return {
        ...bookingObj,
        event: eventObj || null
      };
    }));
    res.json(hydratedBookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get Single Ticket details
router.get('/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await db.Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Ticket booking not found' });
    
    // Check ownership
    const event = await db.Event.findById(booking.eventId);
    const isOrganizer = req.user.role === 'organizer' && event && event.organizerId === req.user.id;
    if (booking.userId !== req.user.id && !isOrganizer) {
      return res.status(403).json({ error: 'Unauthorized to view this ticket' });
    }

    const bookingObj = booking.toObject ? booking.toObject() : (booking._doc || booking);

    res.json({
      ...bookingObj,
      event: event || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve ticket details' });
  }
});


// --- QR CHECK-IN SCAN ROUTE ---

// Scan Check-in
router.post('/checkin/scan', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { ticketCode } = req.body;
    if (!ticketCode) return res.status(400).json({ error: 'Ticket code is required' });

    const booking = await db.Booking.findOne({ ticketCode: ticketCode.trim() });
    if (!booking) {
      return res.status(404).json({ error: 'Invalid Ticket QR Code. Ticket not found.' });
    }

    // Verify event ownership
    const event = await db.Event.findById(booking.eventId);
    if (!event || (event.organizerId !== req.user.id && event.organizerId !== 'org_1')) {
      return res.status(403).json({ error: 'Unauthorized: You are not the organizer of this event.' });
    }

    if (booking.status === 'checked-in') {
      return res.status(400).json({
        error: 'Ticket Already Scanned!',
        booking: {
          ...booking,
          eventTitle: event.title
        }
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Ticket has been cancelled.' });
    }

    // Update to checked-in
    const updatedBooking = await db.Booking.findByIdAndUpdate(booking._id, { status: 'checked-in' }, { new: true });

    res.json({
      message: 'Check-in successful!',
      booking: {
        _id: updatedBooking._id,
        status: updatedBooking.status,
        attendeeName: updatedBooking.attendeeDetails.name,
        ticketCode: updatedBooking.ticketCode,
        eventTitle: event.title
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process QR check-in scan' });
  }
});


// --- ORGANIZER ANALYTICS ROUTE ---

router.get('/analytics', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    // Find all events owned by this organizer, plus include pre-seeded events
    let events = await db.Event.find();
    events = events.filter(e => e.organizerId === req.user.id || e.organizerId === 'org_1');
    const eventIds = events.map(e => e._id.toString());

    // Retrieve all bookings for these events
    const allBookings = await db.Booking.find();
    const relevantBookings = allBookings.filter(b => eventIds.includes(b.eventId.toString()));

    // Metrics calculations
    const totalEvents = events.length;
    let totalRevenue = 0;
    let ticketsSold = 0;
    let checkedInCount = 0;

    relevantBookings.forEach(b => {
      if (b.status !== 'cancelled') {
        ticketsSold++;
        totalRevenue += b.paymentDetails?.amount || 0;
        if (b.status === 'checked-in') {
          checkedInCount++;
        }
      }
    });

    const attendanceRate = ticketsSold > 0 ? Math.round((checkedInCount / ticketsSold) * 100) : 0;

    // Ticket sales by category
    const categoryStats = {};
    events.forEach(e => {
      categoryStats[e.category] = (categoryStats[e.category] || 0) + (e.ticketsSold || 0);
    });

    const categoryDistribution = Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value
    }));

    // Sales over time (last 7 days simulation based on booking dates)
    const salesOverTime = {};
    // Seed last 7 days with zero
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      salesOverTime[dateStr] = { revenue: 0, tickets: 0 };
    }

    relevantBookings.forEach(b => {
      if (b.status !== 'cancelled') {
        const dateStr = b.purchaseDate.split('T')[0];
        if (salesOverTime[dateStr]) {
          salesOverTime[dateStr].revenue += b.paymentDetails?.amount || 0;
          salesOverTime[dateStr].tickets += 1;
        }
      }
    });

    const salesTimeline = Object.entries(salesOverTime).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      tickets: data.tickets
    }));

    // Get top 5 recent bookings
    const recentBookings = [...relevantBookings]
      .filter(b => b.status !== 'cancelled')
      .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
      .slice(0, 5)
      .map(b => {
        const matchingEvent = events.find(e => e._id.toString() === b.eventId.toString());
        return {
          id: b._id,
          attendeeName: b.attendeeDetails?.name || 'Anonymous User',
          attendeeEmail: b.attendeeDetails?.email || '',
          eventTitle: matchingEvent ? matchingEvent.title : 'VibePass Event',
          purchaseDate: b.purchaseDate,
          amount: b.paymentDetails?.amount || 0
        };
      });

    res.json({
      summary: {
        totalEvents,
        totalRevenue,
        ticketsSold,
        attendanceRate
      },
      events: events.map(e => ({
        id: e._id,
        title: e.title,
        price: e.price,
        capacity: e.capacity,
        ticketsSold: e.ticketsSold,
        category: e.category,
        date: e.date
      })),
      categoryDistribution,
      salesTimeline,
      recentBookings
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute analytics data' });
  }
});

// Health Check Endpoint
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    database: db.isMongoConnected() ? 'mongodb' : 'fallback_json'
  });
});

module.exports = router;
