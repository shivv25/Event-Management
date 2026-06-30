import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { User, Mail, ShieldCheck, X, ArrowRight, RefreshCw, Sparkles, QrCode, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function Checkout({ event, token, user, onClose, navigateTo, showNotification }) {
  const [attendeeName, setAttendeeName] = useState(user ? user.name : '');
  const [attendeeEmail, setAttendeeEmail] = useState(user ? user.email : '');
  const [loading, setLoading] = useState(false);
  
  // Razorpay order info state
  const [orderInfo, setOrderInfo] = useState(null);
  const [showMockGateway, setShowMockGateway] = useState(false);

  // Manual payment transaction validation state
  const [upiRefNo, setUpiRefNo] = useState('');
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300); // 5 minutes session countdown timer (300s)

  useEffect(() => {
    // Dynamically load Razorpay standard checkout overlay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Payment Session Expiry Countdown (5 minutes)
  useEffect(() => {
    if (!showMockGateway) return;
    
    setPaymentTimeLeft(300); // Reset to 300 seconds (5 minutes)
    setUpiRefNo(''); // Reset transaction ID input
    
    const sessionTimer = setInterval(() => {
      setPaymentTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(sessionTimer);
          // Session expired
          setShowMockGateway(false);
          setLoading(false);
          showNotification('Payment session expired. Please request a new checkout order.', 'error');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(sessionTimer);
  }, [showMockGateway]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      showNotification('Please fill in attendee name and email', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Request Order Creation from Backend API
      const res = await fetch(`${API_URL}/bookings/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: event._id })
      });

      const orderData = await res.json();
      if (!res.ok) {
        showNotification(orderData.error || 'Failed to create payment order ID.', 'error');
        setLoading(false);
        return;
      }

      setOrderInfo(orderData);

      // 2. Determine Gateway Type (Real SDK vs Mock Fallback Sandbox)
      if (orderData.isSimulated) {
        // Load our high-fidelity built-in sandbox mock overlay modal
        setShowMockGateway(true);
        setLoading(false); // turn off loading spinner so mock inputs are editable!
      } else {
        // Trigger real Razorpay script
        if (typeof window.Razorpay === 'undefined') {
          showNotification('Razorpay Checkout SDK is offline. Falling back to local Sandbox simulator...', 'warning');
          setShowMockGateway(true);
          setLoading(false);
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'VibePass Tickets',
          description: `1x Pass: ${event.title}`,
          order_id: orderData.id,
          prefill: {
            name: attendeeName,
            email: attendeeEmail
          },
          theme: {
            color: '#d47a5f' // Cozy Brand Terracotta accent
          },
          handler: async function (response) {
            await handleVerification(
              orderData.id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              false
            );
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error(err);
      showNotification('Network exception initializing checkout.', 'error');
      setLoading(false);
    }
  };

  const handleVerification = async (orderId, paymentId, signature, isMock) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings/razorpay-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event._id,
          attendeeName,
          attendeeEmail,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          isSimulated: isMock
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('Payment verified successfully! Pass issued.');
        onClose();
        navigateTo('ticket-view', data._id);
      } else {
        showNotification(data.error || 'Payment confirmation failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Connection check verification timeout.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Format seconds into MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{
      padding: '30px',
      position: 'relative',
      background: 'rgba(25, 18, 15, 0.98)', // Premium Cozy Dark Espresso background
      border: '1px solid var(--border-glass)',
      maxHeight: '95vh',
      overflowY: 'auto',
      maxWidth: '480px',
      width: '100%',
      margin: '0 auto',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      borderRadius: '24px'
    }}>
      {/* 1. Main Checkout view */}
      {!showMockGateway ? (
        <>
          {/* Close button */}
          <button 
            onClick={onClose}
            disabled={loading}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '5px'
            }}
          >
            <X size={20} />
          </button>

          <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Secure Checkout
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
            Book 1x ticket pass for <strong style={{ color: 'var(--accent-cyan)' }}>{event.title}</strong>
          </p>

          <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Attendee Full Name</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter name"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  disabled={loading}
                  required
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Email Address</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  disabled={loading}
                  required
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {/* Event Summary Card */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed var(--border-glass)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Pass Pricing
                </span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-pink)', fontFamily: 'var(--font-display)' }}>
                  ₹{event.price}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', background: 'rgba(123, 166, 142, 0.1)', padding: '4px 8px', borderRadius: '8px', fontWeight: 600 }}>
                  Razorpay Sandbox
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '5px' }}>
              <ShieldCheck size={16} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
              <span>
                Verified secure encrypted gateway checkout. UPI scanning method supported.
              </span>
            </div>

            <button
              type="submit"
              className="btn-neon-violet"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '14px',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="rotating" style={{ animation: 'spin 1.5s linear infinite' }} />
                  Processing Order...
                </>
              ) : (
                <>
                  Proceed to Secure Checkout <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        /* 2. Simulated webhook checkout portal with 5-minute timer and manual Transaction ID entry */
        <div style={{ padding: '5px 0', textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(to right, rgba(212, 122, 95, 0.1), rgba(217, 160, 91, 0.1))',
            borderBottom: '2px dashed rgba(255, 255, 255, 0.1)',
            padding: '12px 20px',
            borderRadius: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-pink)" />
              <strong style={{ fontWeight: 800, letterSpacing: '1px', fontSize: '13px', color: '#fff' }}>Razorpay Sandbox</strong>
            </div>

            {/* 5 Minute Countdown Timer Display */}
            <div style={{
              fontSize: '11px',
              color: paymentTimeLeft < 60 ? 'var(--accent-pink)' : 'var(--accent-cyan)',
              background: 'rgba(0,0,0,0.25)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              border: paymentTimeLeft < 60 ? '1px solid rgba(212,122,95,0.3)' : '1px solid rgba(123,166,142,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}>
              ⏱️ {formatTime(paymentTimeLeft)}
            </div>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
              <div>Order ID: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{orderInfo?.id}</strong></div>
              <div>Billing Name: <strong style={{ color: '#fff' }}>{attendeeName}</strong></div>
              <div>Billing Email: <strong style={{ color: '#fff' }}>{attendeeEmail}</strong></div>
              <div>Transaction Value: <strong style={{ color: 'var(--accent-pink)', fontWeight: 800 }}>₹{event.price} INR</strong></div>
            </div>

            {/* Custom QR Code Scanner Interface */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.01)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px dashed rgba(255,255,255,0.05)',
              textAlign: 'center',
              position: 'relative'
            }}>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QrCode size={14} color="var(--accent-cyan)" /> Scan QR Code via GPay, PhonePe, or Paytm
              </span>
              
              {/* Dynamic Padded Container generating price-aware UPI QR Code */}
              <div style={{
                background: '#fff',
                padding: '12px',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                display: 'inline-block',
                lineHeight: 0,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <QRCodeSVG 
                  value={`upi://pay?pa=vishalsingh2526@fam&pn=VibePass&am=${event.price}&cu=INR&tn=Booking_${event.title.replace(/\s+/g, '_')}`}
                  size={180}
                  level="M"
                  fgColor="#19120f"
                />
                
                {/* Glowing Scanning Radar Animation Effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(to right, transparent, var(--accent-cyan), transparent)',
                  boxShadow: '0 0 8px var(--accent-cyan)',
                  animation: 'radarScan 2s linear infinite'
                }}></div>
              </div>
              
              <div style={{ width: '100%' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Or Transfer to UPI ID:</span>
                <strong style={{ fontSize: '14px', color: 'var(--accent-pink)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                  vishalsingh2526@fam
                </strong>
              </div>

              {/* UTR Reference Input Field - Blocks completion until paid & entered */}
              <div className="form-group" style={{ width: '100%', marginTop: '12px', textAlign: 'left' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Enter UPI Transaction ID / 12-Digit UTR:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 612345678901"
                  maxLength={12}
                  value={upiRefNo}
                  onChange={(e) => setUpiRefNo(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  style={{
                    fontSize: '14px',
                    background: 'transparent',
                    textAlign: 'center',
                    letterSpacing: '1.5px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    borderColor: upiRefNo.length === 12 ? 'var(--accent-cyan)' : 'rgba(212, 122, 95, 0.3)'
                  }}
                />
                {upiRefNo.length !== 12 && (
                  <span style={{ fontSize: '10px', color: 'var(--accent-pink)', display: 'block', marginTop: '6px', lineHeight: '1.3' }}>
                    * Enter the 12-digit transaction Ref No. from your UPI app receipt to confirm scan (must start with 6).
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn-neon-cyan" 
              disabled={loading || upiRefNo.length !== 12}
              onClick={() => handleVerification(
                orderInfo.id,
                upiRefNo, // Save the actual typed UTR ref number as the transaction/payment ID!
                'sig_mock_' + Math.random().toString(36).substr(2, 14),
                true
              )}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: upiRefNo.length === 12 ? 1 : 0.6,
                cursor: upiRefNo.length === 12 ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="rotating" style={{ animation: 'spin 1.5s linear infinite' }} />
                  Verifying Reference...
                </>
              ) : (
                <>
                  <Check size={16} /> Confirm Payment after Scanning
                </>
              )}
            </button>

            <button 
              className="btn-glass" 
              disabled={loading}
              onClick={() => {
                setShowMockGateway(false);
                setLoading(false);
                setUpiRefNo('');
                showNotification('Transaction cancelled by customer.', 'warning');
              }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '13px',
                color: 'var(--accent-pink)',
                borderColor: 'rgba(212, 122, 95, 0.3)'
              }}
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      {/* Embedded inline keyframes for animations */}
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes radarScan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}

export default Checkout;
