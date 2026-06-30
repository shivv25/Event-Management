const nodemailer = require('nodemailer');

let transporter = null;

// Initialize mail transport
async function initMail() {
  const host = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : null;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT.toString().trim()) : 587;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;

  if (host && user && pass) {
    console.log(`Configuring custom SMTP transport at ${host}:${port}...`);
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: port == 465,
      auth: { user, pass }
    });
    
    // Verify transporter connection on startup to catch auth errors in logs immediately
    transporter.verify((err) => {
      if (err) {
        console.error("SMTP Mail Transporter verification failed on startup:", err);
      } else {
        console.log("SMTP Mail Transporter connection verified and ready!");
      }
    });
  } else {
    // Skip Ethereal test accounts creation in production serverless environments to avoid function timeouts
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.log("SMTP configuration missing. In production serverless mode, email transmissions will fallback to server logs.");
      transporter = null;
    } else {
      console.log("SMTP configuration missing in .env. Creating Ethereal SMTP test account...");
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log(`===================================================`);
        console.log(`🚀 Ethereal SMTP Test Account created!`);
        console.log(`✉️ Username: ${testAccount.user}`);
        console.log(`🔑 Password: ${testAccount.pass}`);
        console.log(`===================================================`);
      } catch (err) {
        console.error("Failed to create Ethereal SMTP account. Emails will fallback to logs only.", err);
      }
    }
  }
}

// Send OTP Email
async function sendOtpEmail(toEmail, otp) {
  if (!transporter) {
    console.log(`[Email Fallback] To: ${toEmail} | OTP: ${otp}`);
    return null;
  }

  const sender = process.env.SMTP_USER 
    ? `"VibePass Verification" <${process.env.SMTP_USER}>` 
    : '"VibePass Verification" <no-reply@vibepass.com>';

  const mailOptions = {
    from: sender,
    to: toEmail,
    subject: 'VibePass Verification Code: ' + otp,
    text: `Your VibePass 2FA login verification code is: ${otp}. This code is valid for 5 minutes. If you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafafa;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #8b5cf6; margin: 0;">VibePass Security</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Event Entry & Management Portal</p>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 16px; color: #334155; margin-top: 0;">Your login verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ec4899; background-color: #f3e8ff; padding: 15px; border-radius: 8px; display: inline-block; margin: 15px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">This security code is active for 5 minutes. Do not share this code with anyone.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
          &copy; 2026 VibePass Inc. All rights reserved.
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Email] Sent OTP verification to ${toEmail}. MessageID: ${info.messageId}`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✉️ [Ethereal Sandbox] Preview email body at: ${previewUrl}`);
      return previewUrl;
    }
  } catch (err) {
    console.error("Failed to deliver SMTP email:", err);
  }
  return null;
}

// Send Billing Alert Email upon Event Booking
async function sendBillingAlertEmail(toEmail, attendeeName, event, booking) {
  if (!transporter) {
    console.log(`[Email Fallback] To: ${toEmail} | Billing Alert for Event: ${event.title}`);
    return null;
  }

  const sender = process.env.SMTP_USER 
    ? `"VibePass Receipts" <${process.env.SMTP_USER}>` 
    : '"VibePass Receipts" <no-reply@vibepass.com>';

  const mailOptions = {
    from: sender,
    to: toEmail,
    subject: `Booking Confirmed: ${event.title} - Ticket Issued!`,
    text: `Hello ${attendeeName},\n\nYour ticket booking for ${event.title} has been confirmed successfully.\nEvent Details:\nDate: ${event.date}\nTime: ${event.time}\nLocation: ${event.location}\n\nTicket Code: ${booking.ticketCode}\nAmount Paid: ₹${event.price} INR\nTransaction Ref: ${booking.paymentDetails.paymentId}\n\nThank you for choosing VibePass!\n\nBest Regards,\nThe VibePass Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #d47a5f; border-radius: 16px; background-color: #fcfbfa; color: #19120f;">
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px dashed #d47a5f; padding-bottom: 20px;">
          <h2 style="color: #d47a5f; margin: 0; font-family: 'Georgia', serif;">VibePass Confirmed</h2>
          <p style="color: #a36f37; font-size: 14px; margin-top: 5px; font-weight: bold; letter-spacing: 1px;">OFFICIAL RECEIPT & DIGITAL PASS</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid rgba(212,122,95,0.15); box-shadow: 0 4px 12px rgba(0,0,0,0.02); margin-bottom: 20px;">
          <p style="font-size: 16px; margin-top: 0; line-height: 1.5;">
            Hello <strong>${attendeeName}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.5; color: #3d302c;">
            We are excited to confirm your booking for the following experience! Your digital ticket pass has been verified and registered securely in our gateway database.
          </p>
          
          <!-- Event details block -->
          <div style="background-color: #f7f3ed; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #d47a5f;">
            <h3 style="margin: 0 0 10px 0; color: #19120f; font-size: 18px;">${event.title}</h3>
            <table style="width: 100%; font-size: 14px; color: #463b36; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-weight: bold; width: 80px;">Date & Time:</td>
                <td style="padding: 4px 0;">${event.date} at ${event.time}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold;">Location:</td>
                <td style="padding: 4px 0;">${event.location}</td>
              </tr>
            </table>
          </div>

          <!-- Billing block -->
          <h4 style="margin: 20px 0 10px 0; color: #d47a5f; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Transaction Parameters</h4>
          <table style="width: 100%; font-size: 14px; color: #463b36; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
              <td style="padding: 8px 0;">Ticket Price:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #19120f;">₹${event.price}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
              <td style="padding: 8px 0;">Amount Paid:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #7ba68e;">₹${event.price} INR</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
              <td style="padding: 8px 0;">Transaction Ref (UTR):</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; color: #19120f;">${booking.paymentDetails.paymentId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Pass Ticket Code:</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; color: #d9a05b; font-weight: bold;">${booking.ticketCode}</td>
            </tr>
          </table>
          
          <p style="font-size: 12px; color: #a36f37; line-height: 1.5; margin-bottom: 0; text-align: center; font-weight: bold;">
            * Please present this email receipt or the QR Code from your VibePass dashboard at the entrance gate.
          </p>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #a36f37;">
          <p style="margin: 0;">Thank you for your business! Enjoy the event.</p>
          <p style="margin: 5px 0 0 0;">&copy; 2026 VibePass Inc. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Email] Sent billing alert to ${toEmail}. MessageID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✉️ [Ethereal Sandbox] Preview email receipt body at: ${previewUrl}`);
      return previewUrl;
    }
  } catch (err) {
    console.error("Failed to deliver billing alert SMTP email:", err);
  }
  return null;
}

module.exports = {
  initMail,
  sendOtpEmail,
  sendBillingAlertEmail
};
