import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import Checkout from './Checkout';
import { Calendar, MapPin, ArrowLeft, Users, ShieldAlert, Award } from 'lucide-react';

function EventDetails({ eventId, token, user, navigateTo, showNotification }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
        } else {
          showNotification('Could not load event details', 'error');
          navigateTo('home');
        }
      } catch (err) {
        console.error(err);
        showNotification('Connection failure to server', 'error');
        navigateTo('home');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
        <h2 className="floating">Loading experience details...</h2>
      </div>
    );
  }

  if (!event) return null;

  const seatsLeft = event.capacity - event.ticketsSold;
  const isSoldOut = seatsLeft <= 0;

  const handleBookClick = () => {
    if (!token) {
      showNotification('Please sign in to buy event passes', 'error');
      navigateTo('auth');
      return;
    }
    if (user && user.role !== 'attendee') {
      showNotification('Organizers cannot book tickets', 'error');
      return;
    }
    setShowCheckout(true);
  };

  return (
    <div className="page-container">
      {/* Back button */}
      <button 
        onClick={() => navigateTo('home')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '30px',
          transition: 'color 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.color = '#fff'}
        onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
      >
        <ArrowLeft size={18} /> Back to explore
      </button>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        gap: '40px'
      }}>
        {/* Left column - Event Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Banner cover */}
          <div style={{
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            height: '420px',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <img 
              src={event.coverImage} 
              alt={event.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              background: 'linear-gradient(to top, rgba(10, 7, 18, 0.95) 0%, transparent 100%)',
              padding: '30px'
            }}>
              <span className={`badge badge-${event.category.toLowerCase()}`} style={{ marginBottom: '12px' }}>
                {event.category}
              </span>
              <h1 style={{ fontSize: '38px', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {event.title}
              </h1>
            </div>
          </div>

          {/* Description */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '15px', color: 'var(--text-primary)' }}>
              About this Experience
            </h3>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', fontSize: '15px' }}>
              {event.description}
            </p>
          </div>
        </div>

        {/* Right column - Ticket and booking details */}
        <div>
          <div className="glass-panel" style={{
            padding: '35px',
            position: 'sticky',
            top: '110px',
            background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.1), var(--bg-card))',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            {/* 3D Floating Ticket Visual Badge */}
            <div className="floating" style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '25px'
            }}>
              <div style={{
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px dashed var(--accent-violet)',
                borderRadius: '16px',
                padding: '12px 24px',
                textAlign: 'center',
                boxShadow: '0 0 15px rgba(139,92,246,0.2)'
              }}>
                <Award size={36} color="var(--accent-pink)" style={{ marginBottom: '5px' }} />
                <span style={{
                  display: 'block',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  letterSpacing: '1.5px'
                }}>
                  Verified VibePass
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <Calendar size={20} color="var(--accent-violet)" />
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Date and Time</span>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{event.date} at {event.time}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <MapPin size={20} color="var(--accent-cyan)" />
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Location</span>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{event.location}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <Users size={20} color="var(--accent-pink)" />
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Availability</span>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isSoldOut ? 'Sold Out' : `${seatsLeft} of ${event.capacity} passes left`}
                  </span>
                </div>
              </div>
            </div>

            {/* Price section */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-glass)',
              marginBottom: '25px'
            }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Pass Price</span>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>
                {event.price === 0 ? 'Free' : `₹${event.price}`}
              </span>
            </div>

            {/* Booking action button */}
            {isSoldOut ? (
              <button 
                className="btn-glass" 
                disabled 
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ShieldAlert size={18} /> Sold Out
              </button>
            ) : (
              <button 
                className="btn-neon-pink" 
                onClick={handleBookClick}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Book Tickets Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide-up 3D Checkout Modal */}
      {showCheckout && (
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
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            cursor: 'pointer'
          }} onClick={() => setShowCheckout(false)}></div>

          <div style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '520px',
            animation: 'float 6s ease-in-out infinite' // Dynamic floating feel
          }}>
            <Checkout 
              event={event} 
              token={token} 
              user={user}
              onClose={() => setShowCheckout(false)} 
              navigateTo={navigateTo}
              showNotification={showNotification}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetails;
