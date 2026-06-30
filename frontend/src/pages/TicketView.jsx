import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, User, ChevronRight, Share2, Printer, RefreshCw } from 'lucide-react';

function TicketView({ ticketId, token, navigateTo, showNotification }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/bookings/${ticketId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTicket(data);
        } else {
          showNotification('Could not load ticket details', 'error');
          navigateTo('home');
        }
      } catch (err) {
        console.error(err);
        showNotification('Connection error while fetching ticket', 'error');
        navigateTo('home');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
        <h2 className="floating">Generating your digital ticket pass...</h2>
      </div>
    );
  }

  if (!ticket || !ticket.event) return null;

  const event = ticket.event;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // Copy ticket code to clipboard
    navigator.clipboard.writeText(ticket.ticketCode);
    showNotification('Ticket validation code copied to clipboard!');
  };

  return (
    <div className="page-container">
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Your VibePass is Ready!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Click or hover on the ticket to flip it and view entry details.
        </p>
      </div>

      {/* 3D Ticket Flip Card */}
      <div className="ticket-3d-container">
        <div 
          className={`ticket-3d-card ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front Face */}
          <div className="ticket-front" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="ticket-header" style={{
              background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
              borderBottom: '2px dashed rgba(255, 255, 255, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--accent-cyan)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}>
                  Official Pass
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: ticket.status === 'checked-in' ? '#22c55e' : '#eab308',
                  background: ticket.status === 'checked-in' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: ticket.status === 'checked-in' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(234,179,8,0.3)'
                }}>
                  {ticket.status === 'checked-in' ? 'Attended' : 'Valid Pass'}
                </span>
              </div>
              <h3 style={{ fontSize: '22px', marginTop: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.title}
              </h3>
            </div>

            <div className="ticket-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Event details block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <Calendar size={16} color="var(--accent-violet)" />
                  <span>{event.date} at {event.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <MapPin size={16} color="var(--accent-cyan)" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '380px' }}>
                    {event.location}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <User size={16} color="var(--accent-pink)" />
                  <span>Pass Holder: <strong>{ticket.attendeeDetails.name}</strong></span>
                </div>
              </div>

              {/* QR Code Container */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#fff',
                padding: '20px',
                borderRadius: '16px',
                margin: '20px auto 0',
                width: '180px',
                height: '180px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                position: 'relative'
              }}>
                <QRCodeSVG 
                  value={ticket.ticketCode} 
                  size={140}
                  level="H"
                  fgColor="#0a0712"
                />
              </div>
            </div>

            <div className="ticket-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {ticket.ticketCode.substring(0, 18)}...
              </span>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}>
                Flip Card <RefreshCw size={12} />
              </span>
            </div>
          </div>

          {/* Back Face */}
          <div className="ticket-back" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="ticket-header" style={{
              background: 'linear-gradient(to right, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.15))',
              borderBottom: '2px dashed rgba(255, 255, 255, 0.15)'
            }}>
              <h3 style={{ fontSize: '20px' }}>Entry Instructions</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>VibePass Gate Verification</p>
            </div>

            <div className="ticket-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <div>
                <h4 style={{ color: '#fff', marginBottom: '5px', fontSize: '15px' }}>1. Present QR Code</h4>
                <p>Present the QR code on the front face of this card to the organizer at the gates for scan check-in.</p>
              </div>

              <div>
                <h4 style={{ color: '#fff', marginBottom: '5px', fontSize: '15px' }}>2. Identity Verification</h4>
                <p>Bring matching identification that matches the attendee details: <strong>{ticket.attendeeDetails.name}</strong>.</p>
              </div>

              <div>
                <h4 style={{ color: '#fff', marginBottom: '5px', fontSize: '15px' }}>3. Terms of Use</h4>
                <p>This is a single-use digital ticket. Once scanned, it will register as checked-in and cannot be reused.</p>
              </div>
            </div>

            <div className="ticket-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>VibePass Verified Secure</span>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}>
                Flip Card <RefreshCw size={12} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Button Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginTop: '40px'
      }}>
        <button className="btn-glass" onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Share2 size={16} /> Share Pass
        </button>
        <button className="btn-glass" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={16} /> Print Ticket
        </button>
        <button 
          className="btn-neon-cyan" 
          onClick={() => navigateTo('my-tickets')}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0891b2 100%)',
            color: '#000',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          My Tickets <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default TicketView;
