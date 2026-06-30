import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { Ticket, DollarSign, Award, Clock, Star, User, Settings, Check, AlertCircle } from 'lucide-react';

function UserDashboard({ token, user, setToken, navigateTo, showNotification }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'settings'
  
  // Profile settings state
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [profilePicture, setProfilePicture] = useState(user ? (user.profilePicture || '') : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');

  // Countdown timer state
  const [closestEvent, setClosestEvent] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
        calculateCountdown(data);
      } else {
        showNotification('Failed to fetch user dashboard data', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Server communication failure', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  // Find the next upcoming event and start timer
  const calculateCountdown = (ticketData) => {
    const now = new Date();
    const upcoming = ticketData
      .filter(b => b.status !== 'cancelled' && b.event)
      .map(b => b.event)
      .filter(e => new Date(`${e.date}T${e.time || '00:00'}`) > now)
      .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

    if (upcoming.length > 0) {
      setClosestEvent(upcoming[0]);
    }
  };

  // Run countdown updates
  useEffect(() => {
    if (!closestEvent) return;

    const timer = setInterval(() => {
      const eventTime = new Date(`${closestEvent.date}T${closestEvent.time || '00:00'}`).getTime();
      const now = new Date().getTime();
      const diff = eventTime - now;

      if (diff <= 0) {
        clearInterval(timer);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setClosestEvent(null);
        fetchBookings(); // refresh list
      } else {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [closestEvent]);

  // Profile update handler
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      showNotification('Name and email are required', 'error');
      return;
    }
    if (password && password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password: password || undefined, profilePicture })
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        showNotification('Profile updated successfully!');
        setPassword('');
        setConfirmPassword('');
      } else {
        showNotification(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Connection error while updating profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Feedback Submit handler
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    showNotification(`Thank you! Feedback rating of ${rating}★ submitted for ${feedbackEvent.title}.`);
    setShowFeedbackModal(false);
    setComments('');
    setRating(5);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
        <h2 className="floating">Generating your profile dashboard...</h2>
      </div>
    );
  }

  // Analytics Metrics
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const upcomingPasses = activeBookings.filter(b => b.event && new Date(`${b.event.date}T${b.event.time || '00:00'}`) > new Date());
  const pastPasses = activeBookings.filter(b => b.event && new Date(`${b.event.date}T${b.event.time || '00:00'}`) <= new Date());
  const attendedPasses = activeBookings.filter(b => b.status === 'checked-in');
  
  const totalSpent = activeBookings.reduce((sum, b) => sum + (b.paymentDetails?.amount || 0), 0);
  
  const sortedBookings = [...bookings].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
  const latestBookingId = sortedBookings.length > 0 ? sortedBookings[0]._id : null;

  return (
    <div className="page-container">
      {/* Welcome header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Hello, {user ? user.name : 'VibePass Member'}!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Welcome to your customized VibePass panel. Manage tickets, check status, and edit billing.
          </p>
        </div>
        
        {/* Navigation tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.03)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'overview' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              border: `1px solid ${activeTab === 'overview' ? 'var(--accent-violet)' : 'transparent'}`,
              color: activeTab === 'overview' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Ticket size={16} /> Passes Overview
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'settings' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              border: `1px solid ${activeTab === 'settings' ? 'var(--accent-violet)' : 'transparent'}`,
              color: activeTab === 'settings' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Settings size={16} /> Account settings
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Recently Booked Note Banner */}
          {bookings.some(b => b.purchaseDate && ((new Date() - new Date(b.purchaseDate)) / (1000 * 60 * 60) < 24)) && (
            <div className="glass-panel" style={{
              padding: '16px 20px',
              background: 'rgba(236, 72, 153, 0.05)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              borderRadius: '12px',
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertCircle size={20} color="var(--accent-pink)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#fff' }}>Note:</strong> You have recently booked a new gate pass. Please verify the event date and bring your QR ticket code for check-in scanning.
              </div>
            </div>
          )}

          {/* Metrics summary widgets */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '25px',
            marginBottom: '40px'
          }}>
            <div className="glass-panel" style={{
              padding: '24px',
              background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.08), var(--bg-card))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Investment</span>
                <DollarSign size={20} color="var(--accent-violet)" />
              </div>
              <h3 style={{ fontSize: '28px', color: '#fff' }}>₹{totalSpent}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accumulated ticket spent</span>
            </div>

            <div className="glass-panel" style={{
              padding: '24px',
              background: 'radial-gradient(circle at top right, rgba(6, 182, 212, 0.08), var(--bg-card))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Upcoming Passes</span>
                <Clock size={20} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '28px', color: '#fff' }}>{upcomingPasses.length}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Valid upcoming bookings</span>
            </div>

            <div className="glass-panel" style={{
              padding: '24px',
              background: 'radial-gradient(circle at top right, rgba(236, 72, 153, 0.08), var(--bg-card))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Attended Events</span>
                <Award size={20} color="var(--accent-pink)" />
              </div>
              <h3 style={{ fontSize: '28px', color: '#fff' }}>{attendedPasses.length}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Checked-in gates passes</span>
            </div>
          </div>

          {/* Interactive Countdown Timer */}
          {closestEvent && (
            <div className="glass-panel floating" style={{
              padding: '30px',
              marginBottom: '40px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--accent-cyan)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Next Upcoming Vibe
                </span>
                <h3 style={{ fontSize: '22px', marginBottom: '5px' }}>{closestEvent.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {closestEvent.date} at {closestEvent.time} | Venue: {closestEvent.location}
                </p>
              </div>

              {/* Countdown clock grid */}
              <div style={{ display: 'flex', gap: '15px' }}>
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hrs' },
                  { value: countdown.minutes, label: 'Min' },
                  { value: countdown.seconds, label: 'Sec' }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(10, 7, 18, 0.6)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    width: '65px',
                    padding: '10px 0'
                  }}>
                    <span style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: 'var(--accent-pink)',
                      fontFamily: 'monospace'
                    }}>
                      {String(item.value).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket passes section splits */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
            {/* Upcoming tickets */}
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Upcoming Gate Passes</h3>
              {upcomingPasses.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No upcoming passes. Explore the event grid to book!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {bookings
                    .filter(b => b.status !== 'cancelled' && b.event && new Date(`${b.event.date}T${b.event.time || '00:00'}`) > new Date())
                    .map((booking) => (
                      <div 
                        key={booking._id}
                        className="glass-panel" 
                        onClick={() => navigateTo('ticket-view', booking._id)}
                        style={{
                          padding: '20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          borderLeft: '4px solid var(--accent-cyan)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>{booking.event.title}</h4>
                            {booking._id === latestBookingId && (
                              <span style={{
                                fontSize: '9px',
                                background: 'rgba(236,72,153,0.15)',
                                color: 'var(--accent-pink)',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                boxShadow: '0 0 8px rgba(236,72,153,0.25)',
                                display: 'inline-block'
                              }}>
                                New Booking
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                            {booking.event.date} | Code: {booking.ticketCode.substring(4, 12)}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          background: booking.status === 'checked-in' ? 'rgba(34,197,94,0.1)' : 'rgba(6,182,212,0.1)',
                          color: booking.status === 'checked-in' ? '#22c55e' : 'var(--accent-cyan)',
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontWeight: 600
                        }}>
                          {booking.status === 'checked-in' ? 'Checked In' : 'Active Pass'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Past tickets history with feedback */}
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Passes History</h3>
              {pastPasses.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No past event history recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {bookings
                    .filter(b => b.status !== 'cancelled' && b.event && new Date(`${b.event.date}T${b.event.time || '00:00'}`) <= new Date())
                    .map((booking) => (
                      <div 
                        key={booking._id}
                        className="glass-panel" 
                        style={{
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{booking.event.title}</h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Ended: {booking.event.date}
                          </span>
                        </div>
                        
                        <button 
                          className="btn-glass"
                          onClick={() => {
                            setFeedbackEvent(booking.event);
                            setShowFeedbackModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Star size={12} color="#eab308" fill="#eab308" /> Feedback
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Settings profile updates Form */
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '22px', marginBottom: '8px', color: '#fff' }}>Profile Details</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '30px' }}>
            Update your credentials and account parameters securely.
          </p>

          <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
              <img
                src={profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt="Profile Preview"
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent-pink)',
                  boxShadow: '0 0 10px rgba(236,72,153,0.3)'
                }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>Choose Preset Avatar</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
                  ].map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Preset ${idx + 1}`}
                      onClick={() => setProfilePicture(url)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: profilePicture === url ? '2.5px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.15)',
                        boxShadow: profilePicture === url ? '0 0 8px var(--accent-cyan)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Profile Image URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://images.unsplash.com/... or base64"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>New Password (Leave blank to keep current)</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-neon-violet"
              disabled={updatingProfile}
              style={{ padding: '14px', marginTop: '10px' }}
            >
              {updatingProfile ? 'Saving Details...' : 'Save Configuration'}
            </button>
          </form>
        </div>
      )}

      {/* FEEDBACK MODAL OVERLAY */}
      {showFeedbackModal && feedbackEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(10, 7, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '30px',
            background: 'rgba(19, 15, 36, 0.98)',
            border: '1px solid var(--border-neon)'
          }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>Share Your Experience</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
              How was your experience at <strong>{feedbackEvent.title}</strong>?
            </p>

            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Star Rating select */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={36}
                    color={star <= rating ? '#eab308' : 'rgba(255,255,255,0.15)'}
                    fill={star <= rating ? '#eab308' : 'transparent'}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    onClick={() => setRating(star)}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />
                ))}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Review Comments</label>
                <textarea
                  className="form-input"
                  placeholder="Share a short note about the music, visuals, crowd..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  style={{ height: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" className="btn-glass" onClick={() => setShowFeedbackModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-neon-violet" style={{ flex: 2 }}>
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
