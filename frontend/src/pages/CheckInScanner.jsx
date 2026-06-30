import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Scan, CheckCircle, AlertTriangle, XCircle, Camera, Keyboard } from 'lucide-react';

function CheckInScanner({ token, showNotification }) {
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'duplicate' | 'invalid', message: '', booking: {} }
  const [scannerMode, setScannerMode] = useState('simulator'); // 'simulator' or 'camera'
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    let scanner = null;
    
    if (scannerMode === 'camera' && cameraActive) {
      // Initialize html5-qrcode scanner
      scanner = new Html5QrcodeScanner(
        "qr-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // On scan success
          handleCodeVerification(decodedText);
          // Stop camera scanning
          setCameraActive(false);
          if (scanner) {
            scanner.clear().catch(err => console.warn(err));
          }
        },
        (error) => {
          // Scan errors are triggered continuously while searching, we suppress them to avoid console clutter.
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.warn("Clear error:", err));
      }
    };
  }, [scannerMode, cameraActive]);

  const handleCodeVerification = async (codeToVerify) => {
    if (!codeToVerify || !codeToVerify.trim()) {
      showNotification('Please enter a ticket code', 'error');
      return;
    }

    setLoading(true);
    setScanResult(null);

    try {
      const res = await fetch(`${API_URL}/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketCode: codeToVerify.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        setScanResult({
          type: 'success',
          message: data.message || 'Check-in successful!',
          booking: data.booking
        });
        showNotification('Check-in confirmed!', 'success');
      } else {
        // Check for specific error cases
        if (res.status === 404) {
          setScanResult({
            type: 'invalid',
            message: data.error || 'Ticket not found.'
          });
          showNotification('Invalid Ticket QR Code', 'error');
        } else if (data.error && data.error.includes('Already Scanned')) {
          setScanResult({
            type: 'duplicate',
            message: data.error,
            booking: data.booking
          });
          showNotification('Duplicate Ticket Scan!', 'error');
        } else {
          setScanResult({
            type: 'invalid',
            message: data.error || 'Check-in processing error'
          });
          showNotification(data.error || 'Scan failed', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showNotification('Network connection issue', 'error');
    } finally {
      setLoading(false);
      setTicketCode('');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleCodeVerification(ticketCode);
  };

  return (
    <div className="page-container" style={{ maxWidth: '680px' }}>
      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Scan size={28} color="var(--accent-cyan)" /> Gate Scan Check-In
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Scan attendee ticket codes via live device camera or process tickets manually.
        </p>
      </div>

      {/* Mode selectors */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.03)',
        padding: '6px',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => { setScannerMode('simulator'); setCameraActive(false); setScanResult(null); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: scannerMode === 'simulator' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            border: `1px solid ${scannerMode === 'simulator' ? 'var(--accent-violet)' : 'transparent'}`,
            color: scannerMode === 'simulator' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
        >
          <Keyboard size={18} /> Code Simulator
        </button>

        <button
          onClick={() => { setScannerMode('camera'); setCameraActive(true); setScanResult(null); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: scannerMode === 'camera' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            border: `1px solid ${scannerMode === 'camera' ? 'var(--accent-cyan)' : 'transparent'}`,
            color: scannerMode === 'camera' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
        >
          <Camera size={18} /> Live QR Scanner
        </button>
      </div>

      {/* SCANNER PANELS */}
      <div className="glass-panel" style={{ padding: '35px', marginBottom: '30px', textAlign: 'center' }}>
        {scannerMode === 'simulator' ? (
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0, textAlign: 'left' }}>
              <label>Enter Ticket Verification Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. tkt_x9y2z..."
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                style={{ fontSize: '15px', padding: '14px 16px' }}
              />
            </div>
            <button
              type="submit"
              className="btn-neon-violet"
              disabled={loading}
              style={{ padding: '14px', fontSize: '15px' }}
            >
              {loading ? 'Verifying Code...' : 'Scan & Validate Pass'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {cameraActive ? (
              <div 
                id="qr-reader" 
                style={{ 
                  width: '100%', 
                  maxWidth: '380px', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-glass)'
                }}
              ></div>
            ) : (
              <div style={{ padding: '40px 20px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Camera scanner paused. Click below to reactivate scanner module.
                </p>
                <button className="btn-neon-cyan" onClick={() => setCameraActive(true)}>
                  Activate Camera Scan
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SCAN RESULTS DISPLAY PANELS */}
      {scanResult && (
        <div className="glass-panel floating" style={{
          padding: '24px',
          border: `1px solid ${
            scanResult.type === 'success' ? '#22c55e' : 
            scanResult.type === 'duplicate' ? '#f97316' : '#ef4444'
          }`,
          background: `radial-gradient(circle at top right, ${
            scanResult.type === 'success' ? 'rgba(34,197,94,0.1)' : 
            scanResult.type === 'duplicate' ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)'
          }, var(--bg-card))`,
          boxShadow: `0 8px 32px 0 ${
            scanResult.type === 'success' ? 'rgba(34,197,94,0.15)' : 
            scanResult.type === 'duplicate' ? 'rgba(249,115,22,0.15)' : 'rgba(239,68,68,0.15)'
          }`
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {scanResult.type === 'success' && <CheckCircle size={44} color="#22c55e" style={{ flexShrink: 0 }} />}
            {scanResult.type === 'duplicate' && <AlertTriangle size={44} color="#f97316" style={{ flexShrink: 0 }} />}
            {scanResult.type === 'invalid' && <XCircle size={44} color="#ef4444" style={{ flexShrink: 0 }} />}

            <div>
              <h3 style={{
                fontSize: '20px',
                color: '#fff',
                marginBottom: '6px'
              }}>
                {scanResult.type === 'success' && 'CHECK-IN CONFIRMED'}
                {scanResult.type === 'duplicate' && 'DUPLICATE TICKET WARNING'}
                {scanResult.type === 'invalid' && 'INVALID TICKET PASS'}
              </h3>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>
                {scanResult.message}
              </p>

              {scanResult.booking && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-glass)',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div>Attendee: <strong style={{ color: '#fff' }}>{scanResult.booking.attendeeName}</strong></div>
                  <div>Event: <strong style={{ color: '#fff' }}>{scanResult.booking.eventTitle}</strong></div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Code: {scanResult.booking.ticketCode}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckInScanner;
