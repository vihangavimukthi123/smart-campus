import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../api/authService';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const finalizeLogin = async () => {
      try {
        // Extract token from Cookie
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
          return null;
        };

        let token = getCookie('oauth2_auth_token');
        console.log('[AuthSuccess] Raw token from cookie:', token);
        
        // Tomcat sometimes wraps cookie values in quotes. Strip them if present.
        if (token && token.startsWith('"') && token.endsWith('"')) {
          token = token.slice(1, -1);
          console.log('[AuthSuccess] Stripped quotes. New token:', token);
        }

        if (token) {
          localStorage.setItem('token', token);
          console.log('[AuthSuccess] Token saved to localStorage.');
          // Delete cookie
          document.cookie = "oauth2_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        } else {
          // In React Strict Mode, the second run might see the cookie already deleted.
          // Fallback to checking if it's already in localStorage.
          token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No token found in cookie or localStorage');
          }
        }

        // Use the token for the request
        const response = await authService.getMe();

        if (response.data) {
          // 1. localStorage එකට දත්ත දානවා (Normal login එකේදී වගේම)
          localStorage.setItem('user', JSON.stringify(response.data));

          // 2. Global State (Context) එක update කරනවා
          setUser(response.data);

          // 3. දැන් Dashboard එකට යවනවා
          if (response.data.role === 'TECHNICIAN') {
            navigate('/technician-dashboard');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error("Auth success page error:", err);
        setErrorMsg(err.message || 'Unknown error occurred during authentication');
      }
    };

    finalizeLogin();
  }, [navigate, setUser]);

  if (errorMsg) {
    return (
      <div className="loading-page" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Authentication Failed</h2>
        <p>{errorMsg}</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    )
  }

  return (
    <div className="loading-page">
      <div className="spinner" />
      <p style={{ marginTop: '1rem', color: 'var(--clr-text-2)' }}>Finalizing login...</p>
    </div>
  );
}