import { useState } from 'react';
import '../styles/Auth.css';

const API_URL = 'http://localhost:8000';

export default function Auth({ setUser }) {
  const [mode, setMode] = useState('choice'); // choice, login, register, otp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
          user_id: data.user_id,
          tenant_id: data.tenant_id,
          email
        }));
        setUser({ user_id: data.user_id, tenant_id: data.tenant_id, email });
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/send-otp?email=${email}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ OTP sent! Check console for code');
        setMode('otp');
      } else {
        setError(data.detail || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/verify-otp?email=${email}&otp=${otp}`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ OTP verified! Proceed to registration');
        setMode('register');
      } else {
        setError(data.detail || 'Invalid OTP');
      }
    } catch (err) {
      setError(err.message || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          company_name: companyName
        })
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
          user_id: data.user_id,
          tenant_id: data.tenant_id,
          email
        }));
        setUser({ user_id: data.user_id, tenant_id: data.tenant_id, email });
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>FMCG Demand Intelligence</h1>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        {mode === 'choice' && (
          <div className="choice-container">
            <h2>Welcome</h2>
            <button onClick={() => setMode('login')} className="choice-btn">
              Login
            </button>
            <button onClick={() => { setMode('send-otp'); setEmail(''); }} className="choice-btn">
              Register
            </button>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button type="button" onClick={() => setMode('choice')} className="back-btn">
              Back
            </button>
          </form>
        )}

        {mode === 'send-otp' && (
          <form onSubmit={handleSendOTP}>
            <h2>Register</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => setMode('choice')} className="back-btn">
              Back
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <h2>Verify OTP</h2>
            <p className="info">Check console for 6-digit code</p>
            <input
              type="text"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              maxLength="6"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => setMode('send-otp')} className="back-btn">
              Back
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <h2>Complete Registration</h2>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Register'}
            </button>
            <button type="button" onClick={() => setMode('send-otp')} className="back-btn">
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
