import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import './Auth.css';
import { useAuth } from '../../context/AuthContext';
import { AuthProps, FormData, User } from '../../types';
import { UserService } from '../../services/api';
import ApiStatusAuth from '../api-status-auth/ApiStatusAuth';


const Auth: React.FC<AuthProps> = ({ onClose, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState<boolean>(initialMode === 'login');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  const { login } = useAuth();

  useEffect(() => {
    const checkApi = () => {
      const isHealthy = true; 
      setApiAvailable(isHealthy);
    };
    checkApi();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.email) {
        throw new Error('Email is required');
      }

      if (!isLogin && !formData.name) {
        throw new Error('Name is required for registration');
      }

      let userData: User;
      let token: string;

      if (apiAvailable) {
        try {
          if (isLogin) {
            // Try to authenticate with real API (using demo password for now)
            const authResponse = await UserService.authenticateUser(
              formData.email,
              "demo123"
            );
            userData = authResponse.user;
            token = authResponse.token;
            console.log('✅ User authenticated with API:', userData);
            console.log('🔑 Token received:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
            login(userData, token);
            onClose && onClose();
          } else {
            // Create new user
            const createResponse = await UserService.createUser({
              name: formData.name || "User",
              email: formData.email
            });
            console.log('✅ User created successfully:', createResponse.user.email);
            
            // Show success message and switch to login mode
            setError(''); // Clear any previous errors
            alert(`Registration successful!\n\nEmail: ${createResponse.user.email}\nPassword: demo123\n\nPlease login with these credentials.`);
            setIsLogin(true);
            setFormData({ name: '', email: formData.email }); // Keep email for convenience
          }
        } catch (apiError: any) {
          console.error('API authentication failed:', apiError);
          setError(apiError.message || 'Authentication failed. Please check your credentials.');
          setLoading(false);
          return;
        }
      } else {
        throw new Error('API not available');
      }
      
    } catch (err: any) {
      console.warn('Using demo authentication:', err);
      
      // Fallback: create local demo user
      const demoUserData: User = {
        id: `user_${Date.now()}`,
        name: formData.name || formData.email.split('@')[0],
        email: formData.email,
        role: 'participant',
        joinedEventIDs: [],
        createdEventIDs: []
      };

      // Use a dummy token for demo mode
      const demoToken = 'demo-token-' + Date.now();
      login(demoUserData, demoToken);
      onClose && onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = (): void => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ name: '', email: '' });
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>🔭 {isLogin ? 'Login' : 'Register'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <ApiStatusAuth apiAvailable={apiAvailable} />

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? '🚀 Login' : '✨ Register')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button 
              type="button"
              className="switch-btn"
              onClick={handleSwitchMode}
            >
              {isLogin ? 'Register here' : 'Login'}
            </button>
          </p>
        </div>

        <div className="auth-info">
          <p className="demo-notice">
            💡 This is a demo project. 
            {!apiAvailable && ' API is not available, running in local mode.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
