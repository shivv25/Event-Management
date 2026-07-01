import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import TicketView from './pages/TicketView';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CheckInScanner from './pages/CheckInScanner';
import Auth from './pages/Auth';
import MyTickets from './pages/MyTickets';
import UserDashboard from './pages/UserDashboard';
import { Calendar, Ticket, LayoutDashboard, Scan, LogIn, LogOut, User, Sun, Moon } from 'lucide-react';

export const API_URL = '/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentView, setCurrentView] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [dbStatus, setDbStatus] = useState(null);

  // Check database health on boot
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setDbStatus(data.database))
      .catch(() => setDbStatus('offline'));
  }, []);

  // Sync theme
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync token and load user profile
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401 || res.status === 403) {
        // Token explicitly expired or invalid
        setToken('');
      } else {
        console.warn(`Server status ${res.status} during profile fetch. Session retained.`);
      }
    } catch (err) {
      console.error("Error fetching user profile (network offline):", err);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setCurrentView('home');
    showNotification('Logged out successfully');
  };

  const navigateTo = (view, data = null) => {
    if (view === 'event-details') {
      setSelectedEventId(data);
    } else if (view === 'ticket-view') {
      setSelectedTicketId(data);
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  // Render active view
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home navigateTo={navigateTo} showNotification={showNotification} />;
      case 'event-details':
        return (
          <EventDetails 
            eventId={selectedEventId} 
            token={token} 
            user={user}
            navigateTo={navigateTo} 
            showNotification={showNotification} 
          />
        );
      case 'my-tickets':
        return <MyTickets token={token} navigateTo={navigateTo} showNotification={showNotification} />;
      case 'user-dashboard':
        return (
          <UserDashboard
            token={token}
            user={user}
            setToken={setToken}
            navigateTo={navigateTo}
            showNotification={showNotification}
          />
        );
      case 'ticket-view':
        return (
          <TicketView 
            ticketId={selectedTicketId} 
            token={token} 
            navigateTo={navigateTo} 
            showNotification={showNotification} 
          />
        );
      case 'dashboard':
        return (
          <OrganizerDashboard 
            token={token} 
            user={user}
            setToken={setToken}
            navigateTo={navigateTo} 
            showNotification={showNotification} 
          />
        );
      case 'scanner':
        return <CheckInScanner token={token} showNotification={showNotification} />;
      case 'auth':
        return (
          <Auth 
            setToken={setToken} 
            navigateTo={navigateTo} 
            showNotification={showNotification} 
          />
        );
      default:
        return <Home navigateTo={navigateTo} showNotification={showNotification} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Dynamic Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(139, 92, 246, 0.95)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          animation: 'float 4s ease-in-out infinite',
          transition: 'all 0.3s ease'
        }}>
          {notification.message}
        </div>
      )}

      {/* Ephemeral Warning Banner */}
      {dbStatus === 'fallback_json' && (
        <div style={{
          background: 'linear-gradient(90deg, #c51162, #8a2be2)',
          color: '#ffffff',
          textAlign: 'center',
          padding: '8px 24px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          zIndex: 1000,
          position: 'relative',
          fontFamily: 'var(--font-body)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          ⚠️ Warning: Database is running in ephemeral Fallback Mode. Accounts and bookings will be wiped on page reload or container restart. Please configure MONGODB_URI to persist your data.
        </div>
      )}

      {/* Main App Navigation Bar */}
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigateTo('home')} style={{ cursor: 'pointer' }}>
          <Calendar size={28} color="#06b6d4" />
          <span>VibePass</span>
        </div>

        <ul className="nav-links">
          <li>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="var(--accent-violet)" />}
            </button>
          </li>
          <li>
            <span 
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => navigateTo('home')}
            >
              Explore Events
            </span>
          </li>

          {user && user.role === 'attendee' && (
            <>
              <li>
                <span 
                  className={`nav-link ${currentView === 'my-tickets' ? 'active' : ''}`}
                  onClick={() => navigateTo('my-tickets')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Ticket size={18} />
                  My Tickets
                </span>
              </li>
              <li>
                <span 
                  className={`nav-link ${currentView === 'user-dashboard' ? 'active' : ''}`}
                  onClick={() => navigateTo('user-dashboard')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <User size={18} />
                  My Dashboard
                </span>
              </li>
            </>
          )}

          {user && user.role === 'organizer' && (
            <>
              <li>
                <span 
                  className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => navigateTo('dashboard')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </span>
              </li>
              <li>
                <span 
                  className={`nav-link ${currentView === 'scanner' ? 'active' : ''}`}
                  onClick={() => navigateTo('scanner')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Scan size={18} />
                  Scan Check-In
                </span>
              </li>
            </>
          )}

          {user ? (
            <li style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border-glass)'
              }}>
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name} 
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--accent-pink)'
                    }} 
                  />
                ) : (
                  <User size={14} color="#ec4899" />
                )}
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{user.name}</span>
                <span style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: user.role === 'organizer' ? 'var(--accent-violet)' : 'var(--accent-cyan)',
                  color: 'white',
                  fontWeight: 800
                }}>
                  {user.role}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px'
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </li>
          ) : (
            <li>
              <button 
                className="btn-neon-violet" 
                onClick={() => navigateTo('auth')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              >
                <LogIn size={16} />
                Sign In
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Main Page Area */}
      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '30px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass)',
        marginTop: '60px',
        background: 'rgba(10, 7, 18, 0.5)',
        color: 'var(--text-muted)',
        fontSize: '14px'
      }}>
        <p>© 2026 VibePass Event Management. Designed with 3D interactions and glass aesthetics.</p>
      </footer>
    </div>
  );
}

export default App;
