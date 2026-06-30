import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { Search, MapPin, Calendar as CalendarIcon, Tag, SlidersHorizontal } from 'lucide-react';

function Home({ navigateTo, showNotification }) {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Music', 'Technology', 'Art', 'Business'];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (category) query.append('category', category);

      const res = await fetch(`${API_URL}/events?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else {
        showNotification('Failed to fetch events', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Could not connect to backend server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  // 3D Parallax Tilt Effect
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((centerY - y) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  return (
    <div className="page-container">
      {/* Hero Landing */}
      <div className="glass-panel" style={{
        padding: '60px 40px',
        textAlign: 'center',
        marginBottom: '50px',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, rgba(212, 122, 95, 0.12) 0%, var(--bg-secondary) 100%)'
      }}>
        {/* Abstract 3D background shapes */}
        <div className="floating" style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, var(--accent-cyan), transparent)',
          transform: 'rotate(45deg)',
          opacity: 0.25,
          pointerEvents: 'none'
        }}></div>
        <div className="floating" style={{
          position: 'absolute',
          bottom: '15%',
          right: '8%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-pink), transparent)',
          opacity: 0.2,
          animationDelay: '1.5s',
          pointerEvents: 'none'
        }}></div>

        <h1 style={{
          fontSize: '52px',
          marginBottom: '15px',
          background: 'linear-gradient(135deg, #ffffff 30%, #a855f7 70%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1.1'
        }}>
          Experience the Future of Events
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          maxWidth: '650px',
          margin: '0 auto 35px',
          fontWeight: 400
        }}>
          Book verified digital tickets with dynamic 3D interactions and scan instant QR passes at the entrance.
        </p>

        {/* Filter bar */}
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          maxWidth: '850px',
          margin: '0 auto',
          background: 'rgba(255,255,255,0.03)',
          padding: '12px',
          borderRadius: '20px',
          border: '1px solid var(--border-glass)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ flex: 2, minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search music, code summits, galleries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '45px', background: 'transparent', border: 'none' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <SlidersHorizontal size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                paddingLeft: '40px',
                background: 'var(--bg-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-neon-cyan" style={{
            padding: '10px 24px'
          }}>
            Search
          </button>
        </form>
      </div>

      {/* Events section */}
      <h2 style={{ fontSize: '28px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Tag size={22} color="var(--accent-violet)" /> Featured Events
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Discover unique immersive experiences happening near you or online.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <div className="floating" style={{ fontSize: '24px', fontWeight: 600 }}>Loading immersive experiences...</div>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '18px' }}>No events found matching your filter criteria.</p>
          <button className="btn-glass" onClick={() => { setSearch(''); setCategory(''); }} style={{ marginTop: '20px' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="event-grid">
          {events.map((evt) => {
            const seatsLeft = evt.capacity - evt.ticketsSold;
            return (
              <div 
                key={evt._id}
                className="tilt-card-wrapper"
                onClick={() => navigateTo('event-details', evt._id)}
              >
                <div 
                  className="tilt-card"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="tilt-card-image">
                    <img src={evt.coverImage} alt={evt.title} />
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      zIndex: 2
                    }}>
                      <span className={`badge badge-${evt.category.toLowerCase()}`}>
                        {evt.category}
                      </span>
                    </div>
                  </div>

                  <div className="tilt-card-content">
                    <h3 style={{ fontSize: '20px', marginBottom: '10px', lineHeight: '1.2' }}>{evt.title}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarIcon size={14} color="var(--accent-violet)" />
                        {evt.date} at {evt.time}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="var(--accent-cyan)" />
                        <span style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '260px'
                        }}>{evt.location}</span>
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      paddingTop: '15px'
                    }}>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Ticket price</span>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {evt.price === 0 ? 'Free' : `₹${evt.price}`}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          color: seatsLeft <= 10 ? 'var(--accent-pink)' : 'var(--accent-cyan)',
                          fontWeight: 600,
                          background: seatsLeft <= 10 ? 'rgba(236,72,153,0.1)' : 'rgba(6,182,212,0.1)',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          border: seatsLeft <= 10 ? '1px solid rgba(236,72,153,0.2)' : '1px solid rgba(6,182,212,0.2)'
                        }}>
                          {seatsLeft <= 0 ? 'Sold Out' : `${seatsLeft} passes left`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
