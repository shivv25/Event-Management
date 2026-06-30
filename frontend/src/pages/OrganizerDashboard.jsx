import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { LayoutDashboard, Plus, DollarSign, Calendar, Users, Eye, Trash2, Edit, X, Settings } from 'lucide-react';

function OrganizerDashboard({ token, user, setToken, navigateTo, showNotification }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'settings'

  // Profile settings state
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [profilePicture, setProfilePicture] = useState(user ? (user.profilePicture || '') : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Form states for creating event
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('0');
  const [capacity, setCapacity] = useState('100');
  const [category, setCategory] = useState('Music');
  const [coverImage, setCoverImage] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        showNotification('Failed to fetch analytics', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !date || !time || !location || !price || !capacity) {
      showNotification('All fields are required', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          date,
          time,
          location,
          price: Number(price),
          capacity: Number(capacity),
          category,
          coverImage
        })
      });

      if (res.ok) {
        showNotification('New event created successfully!');
        setShowCreateModal(false);
        // Reset form
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setLocation('');
        setPrice('0');
        setCapacity('100');
        setCategory('Music');
        setCoverImage('');
        fetchAnalytics(); // reload stats
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'Failed to create event', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error creating event', 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event? This will erase all its associated analytics.')) return;

    try {
      const res = await fetch(`${API_URL}/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification('Event successfully deleted');
        fetchAnalytics();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Delete request failed', 'error');
    }
  };

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

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
        <h2 className="floating">Generating organizer metrics dashboard...</h2>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, events, categoryDistribution, salesTimeline } = analytics;

  // Custom SVG path generator for Line Chart (Revenue over time)
  const generateLineChartPath = () => {
    if (!salesTimeline || salesTimeline.length === 0) return '';
    const width = 600;
    const height = 150;
    const padding = 20;

    const maxVal = Math.max(...salesTimeline.map(d => d.revenue), 100);
    const xStep = (width - padding * 2) / (salesTimeline.length - 1);

    const points = salesTimeline.map((d, index) => {
      const x = padding + index * xStep;
      // invert Y coordinate for SVG standard coordinate space
      const y = height - padding - (d.revenue / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="page-container">
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '32px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={28} color="var(--accent-violet)" /> Organizer Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time visual monitoring of tickets sales, revenue streams, and gate scan entries.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={activeTab === 'overview' ? 'btn-neon-violet' : 'btn-glass'}
              onClick={() => setActiveTab('overview')}
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LayoutDashboard size={14} /> Analytics & Events
            </button>
            <button 
              className={activeTab === 'settings' ? 'btn-neon-pink' : 'btn-glass'}
              onClick={() => setActiveTab('settings')}
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings size={14} /> Account Settings
            </button>
          </div>
          {activeTab === 'overview' && (
            <button className="btn-neon-pink" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
              <Plus size={18} /> Host New Event
            </button>
          )}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>

      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '25px',
        marginBottom: '45px'
      }}>
        {/* Metric 1 */}
        <div className="glass-panel" style={{
          padding: '24px',
          background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.1), var(--bg-card))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Total Revenue</span>
            <DollarSign size={20} color="var(--accent-violet)" />
          </div>
          <h3 style={{ fontSize: '28px', color: '#fff' }}>₹{summary.totalRevenue}</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accumulated earnings</span>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{
          padding: '24px',
          background: 'radial-gradient(circle at top right, rgba(236, 72, 153, 0.1), var(--bg-card))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Tickets Sold</span>
            <Users size={20} color="var(--accent-pink)" />
          </div>
          <h3 style={{ fontSize: '28px', color: '#fff' }}>{summary.ticketsSold}</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total booked passes</span>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{
          padding: '24px',
          background: 'radial-gradient(circle at top right, rgba(6, 182, 212, 0.1), var(--bg-card))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Attendance Rate</span>
            <Calendar size={20} color="var(--accent-cyan)" />
          </div>
          <h3 style={{ fontSize: '28px', color: '#fff' }}>{summary.attendanceRate}%</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Checked-in attendees</span>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{
          padding: '24px',
          background: 'radial-gradient(circle at top right, rgba(251, 191, 36, 0.1), var(--bg-card))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Active Events</span>
            <LayoutDashboard size={20} color="#fbbf24" />
          </div>
          <h3 style={{ fontSize: '28px', color: '#fff' }}>{summary.totalEvents}</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Created listings</span>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        gap: '30px',
        marginBottom: '45px'
      }}>
        {/* Revenue Line Chart */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Revenue Stream Timeline (Last 7 Days)</h3>
          {salesTimeline && salesTimeline.length > 0 ? (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg width="100%" height="180" viewBox="0 0 600 180" style={{ overflow: 'visible' }}>
                {/* Horizontal Grid lines */}
                <line x1="20" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,0.05)" />
                <line x1="20" y1="75" x2="580" y2="75" stroke="rgba(255,255,255,0.05)" />
                <line x1="20" y1="130" x2="580" y2="130" stroke="rgba(255,255,255,0.05)" />

                {/* Line Path */}
                <path
                  d={generateLineChartPath()}
                  fill="none"
                  stroke="var(--accent-violet)"
                  strokeWidth="3"
                  filter="drop-shadow(0px 0px 8px rgba(139,92,246,0.6))"
                />

                {/* Date markers */}
                {salesTimeline.map((d, index) => {
                  const xStep = (600 - 40) / (salesTimeline.length - 1);
                  const x = 20 + index * xStep;
                  return (
                    <g key={d.date}>
                      <circle 
                        cx={x} 
                        cy={180 - 20 - (d.revenue / Math.max(...salesTimeline.map(s => s.revenue), 100)) * 140} 
                        r="4" 
                        fill="var(--accent-cyan)" 
                      />
                      <text 
                        x={x} 
                        y="170" 
                        fill="var(--text-muted)" 
                        fontSize="9" 
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {d.date.substring(5)}
                      </text>
                      {/* Price tooltip representation */}
                      <text
                        x={x}
                        y={180 - 32 - (d.revenue / Math.max(...salesTimeline.map(s => s.revenue), 100)) * 140}
                        fill="#fff"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {d.revenue > 0 ? `₹${Math.round(d.revenue)}` : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No transactions processed yet.</p>
          )}
        </div>

        {/* Category breakdown bar charts */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Ticket Sales by Category</h3>
          {categoryDistribution.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {categoryDistribution.map((cat) => {
                const totalTickets = summary.ticketsSold || 1;
                const percentage = Math.round((cat.value / totalTickets) * 100);
                
                let color = 'var(--accent-violet)';
                if (cat.name === 'Technology') color = 'var(--accent-cyan)';
                if (cat.name === 'Art') color = 'var(--accent-pink)';
                if (cat.name === 'Business') color = '#fbbf24';

                return (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{cat.value} sold ({percentage}%)</span>
                    </div>
                    {/* Glowing bar */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: color,
                        boxShadow: `0 0 10px ${color}`,
                        borderRadius: '10px',
                        transition: 'width 1s ease'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No category analytics yet.</p>
          )}
        </div>
      </div>

      {/* Recent Bookings Feed Activity Panel */}
      {analytics.recentBookings && analytics.recentBookings.length > 0 && (
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '45px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-pink)',
              boxShadow: '0 0 8px var(--accent-pink)',
              animation: 'pulse 1.5s infinite'
            }}></span>
            Recent Bookings Feed
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {analytics.recentBookings.map((b) => (
              <div key={b.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                transition: 'all 0.3s ease'
              }}>
                <div>
                  <strong style={{ color: '#fff', fontSize: '14px' }}>{b.attendeeName}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                    ({b.attendeeEmail})
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Purchased 1x ticket for <strong style={{ color: 'var(--accent-cyan)' }}>{b.eventTitle}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-pink)' }}>
                    {b.amount === 0 ? 'Free' : `₹${b.amount}`}
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {new Date(b.purchaseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Created events tabular management */}
      <h3 style={{ fontSize: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Active Event Listings
      </h3>

      {events.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>You haven't listed any events yet.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Event Name</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Category</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Tickets Sold</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Price</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const soldPercent = Math.round((evt.ticketsSold / evt.capacity) * 100);
                  return (
                    <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>{evt.title}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge badge-${evt.category.toLowerCase()}`}>{evt.category}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>{evt.date}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{evt.ticketsSold}</span>
                          <span style={{ color: 'var(--text-muted)' }}>/ {evt.capacity}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '8px' }}>
                            {soldPercent}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                        {evt.price === 0 ? 'Free' : `₹${evt.price}`}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            onClick={() => handleDeleteEvent(evt.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-pink)',
                              cursor: 'pointer',
                              padding: '5px'
                            }}
                            title="Delete Event"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
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

      {/* CREATE EVENT FULL GLOW MODAL OVERLAY */}
      {showCreateModal && (
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
          <div style={{ position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}></div>

          <div className="glass-panel" style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '560px',
            padding: '30px',
            background: 'rgba(19, 15, 36, 0.95)',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <button 
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Host New Experience</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
              Publish an event listing. Your tickets will be immediately available for attendees to purchase.
            </p>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Event Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Neon Soundscape Festival"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Description</label>
                <textarea
                  className="form-input"
                  placeholder="Provide details about the event experience, lineup, highlights..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ height: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Location Venue</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Madison Square Garden / Virtual Stream URL"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Price ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="0 for Free"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Seat Capacity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 500"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    style={{ background: 'rgba(22, 16, 42, 0.95)', cursor: 'pointer' }}
                  >
                    <option value="Music">Music</option>
                    <option value="Technology">Technology</option>
                    <option value="Art">Art</option>
                    <option value="Business">Business</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Cover Image URL (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://unsplash.com/..."
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-neon-violet"
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '14px',
                  fontSize: '16px'
                }}
              >
                Publish Event Experience
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizerDashboard;
