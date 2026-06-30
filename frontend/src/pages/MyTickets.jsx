import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { Ticket, Calendar, MapPin, ChevronRight } from 'lucide-react';

function MyTickets({ token, navigateTo, showNotification }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_URL}/bookings/my-bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        } else {
          showNotification('Could not retrieve bookings list', 'error');
        }
      } catch (err) {
        console.error(err);
        showNotification('Connection failure to API backend', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
        <h2 className="floating">Retrieving your passes...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 style={{ fontSize: '32px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Ticket size={28} color="var(--accent-pink)" /> My Booked Tickets
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Select a pass below to reveal its digital verification barcode.
      </p>

      {bookings.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 30px' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            You haven't booked any event passes yet.
          </p>
          <button className="btn-neon-violet" onClick={() => navigateTo('home')}>
            Explore Events
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {bookings.map((booking) => {
            const event = booking.event;
            if (!event) return null;
            return (
              <div 
                key={booking._id}
                className="glass-panel"
                onClick={() => navigateTo('ticket-view', booking._id)}
                style={{
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'radial-gradient(circle at right, rgba(236, 72, 153, 0.05), var(--bg-card))',
                  transition: 'transform 0.3s ease, border-color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(5px)';
                  e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <img 
                    src={event.coverImage} 
                    alt={event.title} 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }}
                  />
                  <div>
                    <span className={`badge badge-${event.category.toLowerCase()}`} style={{ fontSize: '10px', marginBottom: '5px' }}>
                      {event.category}
                    </span>
                    <h3 style={{ fontSize: '18px', margin: '4px 0' }}>{event.title}</h3>
                    
                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} color="var(--accent-violet)" />
                        {event.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="var(--accent-cyan)" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: booking.status === 'checked-in' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                      color: booking.status === 'checked-in' ? '#22c55e' : '#eab308',
                      border: booking.status === 'checked-in' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(234,179,8,0.2)'
                    }}>
                      {booking.status === 'checked-in' ? 'checked in' : 'active pass'}
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'monospace' }}>
                      ID: {booking.ticketCode.substring(4, 12)}
                    </span>
                  </div>
                  <ChevronRight size={20} color="var(--text-secondary)" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyTickets;
