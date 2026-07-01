import React, { useState } from 'react';
import { API_URL } from '../App';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';

function Auth({ setToken, navigateTo, showNotification }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee'); // 'attendee' or 'organizer'
  const [loading, setLoading] = useState(false);

  // Auth View State: 'auth' | 'otp' | 'forgot' | 'reset'
  const [authStep, setAuthStep] = useState('auth');
  const [otpCode, setOtpCode] = useState('');
  const [latestMockOtp, setLatestMockOtp] = useState('');
  const [etherealUrl, setEtherealUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const body = isRegister ? { name, email, password, role } : { email, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        if (data.otpRequired) {
          setLatestMockOtp(data.mockOtp);
          setEtherealUrl(data.etherealPreviewUrl || '');
          setAuthStep('otp');
          showNotification('📧 [Sandbox Mail] OTP sent successfully!');
          setTimeout(() => {
            showNotification(`Your 2FA Login OTP Code is: ${data.mockOtp}`, 'success');
          }, 1000);
        } else {
          setToken(data.token);
          showNotification(isRegister ? 'Registered successfully!' : `Welcome back, ${data.user.name}!`);
          navigateTo('home');
        }
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Authentication failed');
        showNotification(errorMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error connecting to API server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      showNotification('Please enter a valid 6-digit OTP code', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        showNotification(`OTP verified. Welcome back, ${data.user.name}!`);
        navigateTo('home');
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'OTP verification failed');
        showNotification(errorMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network communication error verifying OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const body = isRegister ? { name, email, password, role } : { email, password };
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.otpRequired) {
        setLatestMockOtp(data.mockOtp);
        setEtherealUrl(data.etherealPreviewUrl || '');
        setOtpCode('');
        showNotification('📧 [Sandbox Mail] New OTP code has been re-delivered!');
        setTimeout(() => {
          showNotification(`New 2FA Login OTP Code: ${data.mockOtp}`, 'success');
        }, 1000);
      } else {
        showNotification('Failed to generate a new OTP', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Resend request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showNotification('Please enter your registered email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        setLatestMockOtp(data.mockOtp);
        setEtherealUrl(data.etherealPreviewUrl || '');
        setOtpCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setAuthStep('reset');
        showNotification('📧 [Sandbox Mail] Reset OTP sent successfully!');
        setTimeout(() => {
          showNotification(`Password Reset OTP Code: ${data.mockOtp}`, 'success');
        }, 1000);
      } else {
        showNotification(data.error || 'Failed to request reset OTP', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error requesting password reset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      showNotification('Please enter the 6-digit verification code', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        showNotification(`Password reset successfully! Welcome back, ${data.user.name}!`);
        setAuthStep('auth');
        navigateTo('home');
      } else {
        showNotification(data.error || 'Failed to reset password', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error submitting reset password request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (roleType) => {
    if (roleType === 'attendee') {
      setName('Sarah Connor');
      setEmail('sarah@vibepass.com');
      setPassword('password123');
      setRole('attendee');
    } else {
      setName('Alex Mercer');
      setEmail('alex@vibepass.com');
      setPassword('password123');
      setRole('organizer');
    }
    showNotification(`Filled demo data for: ${roleType}`);
  };

  return (
    <div className="page-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '70vh'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Neon Glow background elements inside card */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.2)',
          filter: 'blur(40px)',
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {authStep === 'auth' && (
            <>
              <h2 style={{
                fontSize: '32px',
                textAlign: 'center',
                marginBottom: '10px',
                background: 'linear-gradient(to right, #fff, var(--text-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {isRegister ? 'Create VibePass Account' : 'Welcome to VibePass'}
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginBottom: '30px',
                fontSize: '14px'
              }}>
                {isRegister ? 'Join us to get exclusive ticket passes' : 'Sign in to access your dashboard and event tickets'}
              </p>

              <form onSubmit={handleSubmit}>
                {isRegister && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ paddingLeft: '45px', width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '45px', width: '100%' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ margin: 0 }}>Password</label>
                    {!isRegister && (
                      <span
                        onClick={() => setAuthStep('forgot')}
                        style={{ fontSize: '12px', color: 'var(--accent-pink)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
                      >
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: '45px', width: '100%' }}
                    />
                  </div>
                </div>

                {isRegister && (
                  <div className="form-group">
                    <label>Account Role</label>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                      <label style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: role === 'attendee' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${role === 'attendee' ? 'var(--accent-cyan)' : 'var(--border-glass)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}>
                        <input
                          type="radio"
                          name="role"
                          value="attendee"
                          checked={role === 'attendee'}
                          onChange={() => setRole('attendee')}
                          style={{ display: 'none' }}
                        />
                        <span style={{ color: role === 'attendee' ? '#fff' : 'var(--text-secondary)' }}>Attendee</span>
                      </label>

                      <label style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: role === 'organizer' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${role === 'organizer' ? 'var(--accent-violet)' : 'var(--border-glass)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}>
                        <input
                          type="radio"
                          name="role"
                          value="organizer"
                          checked={role === 'organizer'}
                          onChange={() => setRole('organizer')}
                          style={{ display: 'none' }}
                        />
                        <span style={{ color: role === 'organizer' ? '#fff' : 'var(--text-secondary)' }}>Organizer</span>
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className={role === 'organizer' ? 'btn-neon-violet' : 'btn-neon-pink'}
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '15px',
                    padding: '14px',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
                </button>
              </form>

              {/* Toggle link */}
              <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                </span>
                <span
                  onClick={() => setIsRegister(!isRegister)}
                  style={{
                    color: isRegister ? 'var(--accent-cyan)' : 'var(--accent-pink)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </span>
              </div>

              {/* Quick Demo Credentials Panel */}
              <div style={{
                marginTop: '35px',
                paddingTop: '25px',
                borderTop: '1px solid var(--border-glass)'
              }}>
                <h4 style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  textAlign: 'center',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <ShieldCheck size={14} /> Quick Demo Logins
                </h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-glass"
                    onClick={() => {
                      setIsRegister(false);
                      fillDemo('attendee');
                    }}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                  >
                    Sarah (Attendee)
                  </button>
                  <button
                    type="button"
                    className="btn-glass"
                    onClick={() => {
                      setIsRegister(false);
                      fillDemo('organizer');
                    }}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                  >
                    Alex (Organizer)
                  </button>
                </div>
              </div>
            </>
          )}

          {authStep === 'otp' && (
            <>
              <form onSubmit={handleOtpSubmit}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1.5px solid var(--accent-cyan)',
                    boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)',
                    padding: '16px',
                    borderRadius: '50%',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'float 3s ease-in-out infinite'
                  }}>
                    <ShieldCheck size={36} />
                  </div>
                </div>

                <h3 style={{
                  fontSize: '22px',
                  textAlign: 'center',
                  marginBottom: '10px',
                  color: '#fff'
                }}>
                  OTP Verification
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  marginBottom: '30px',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  A 6-digit security validation code has been sent to:<br />
                  <strong style={{ color: 'var(--accent-cyan)' }}>{email}</strong>
                </p>

                {etherealUrl && (
                  <div style={{
                    marginTop: '-20px',
                    marginBottom: '25px',
                    textAlign: 'center',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)'
                  }}>
                    <a
                      href={etherealUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent-pink)',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📧 Open Dynamic Sandbox Inbox →
                    </a>
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'block', textAlign: 'center', marginBottom: '10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="••••••"
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      letterSpacing: '12px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-glass)',
                      width: '100%',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-neon-cyan"
                  disabled={loading || otpCode.length < 6}
                  style={{
                    width: '100%',
                    marginTop: '25px',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Verifying Code...' : 'Verify OTP'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px', fontSize: '14px' }}>
                <span
                  onClick={() => {
                    setAuthStep('auth');
                    setOtpCode('');
                  }}
                  style={{ color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Back to Sign In
                </span>
                
                <span
                  onClick={handleResendOtp}
                  style={{ color: 'var(--accent-pink)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Resend OTP
                </span>
              </div>
            </>
          )}

          {authStep === 'forgot' && (
            <>
              <h2 style={{
                fontSize: '30px',
                textAlign: 'center',
                marginBottom: '10px',
                background: 'linear-gradient(to right, #fff, var(--text-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Reset Password
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginBottom: '30px',
                fontSize: '14px'
              }}>
                Enter your email address to receive a secure password reset verification code.
              </p>

              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '45px', width: '100%' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-neon-pink"
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '25px',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                </button>
              </form>

              <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px' }}>
                <span
                  onClick={() => setAuthStep('auth')}
                  style={{ color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Return to Sign In
                </span>
              </div>
            </>
          )}

          {authStep === 'reset' && (
            <>
              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    background: 'rgba(236, 72, 153, 0.1)',
                    border: '1.5px solid var(--accent-pink)',
                    boxShadow: '0 0 15px rgba(236, 72, 153, 0.2)',
                    padding: '16px',
                    borderRadius: '50%',
                    color: 'var(--accent-pink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'float 3s ease-in-out infinite'
                  }}>
                    <Lock size={36} />
                  </div>
                </div>

                <h3 style={{
                  fontSize: '22px',
                  textAlign: 'center',
                  marginBottom: '10px',
                  color: '#fff'
                }}>
                  Enter Reset OTP Code
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  marginBottom: '30px',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  Enter the 6-digit reset code simulated-sent to:<br />
                  <strong style={{ color: 'var(--accent-cyan)' }}>{email}</strong>
                </p>

                {etherealUrl && (
                  <div style={{
                    marginTop: '-20px',
                    marginBottom: '25px',
                    textAlign: 'center',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)'
                  }}>
                    <a
                      href={etherealUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent-pink)',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📧 Open Dynamic Sandbox Inbox →
                    </a>
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'block', textAlign: 'center', marginBottom: '10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="••••••"
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      letterSpacing: '12px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-glass)',
                      width: '100%',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Choose New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-neon-violet"
                  disabled={loading || otpCode.length < 6}
                  style={{
                    width: '100%',
                    marginTop: '25px',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password & Sign In'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px', fontSize: '14px' }}>
                <span
                  onClick={() => setAuthStep('auth')}
                  style={{ color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Cancel Reset
                </span>
                
                <span
                  onClick={handleForgotPasswordSubmit}
                  style={{ color: 'var(--accent-pink)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Resend Code
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
