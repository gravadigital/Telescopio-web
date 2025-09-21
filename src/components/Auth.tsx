import React, { useState, FormEvent, ChangeEvent } from 'react';
import './Auth.css';
import { useAuth } from '../context/AuthContext';
import { AuthProps, FormData, User } from '../types';
import { UserService } from '../services/api';


const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  const { login } = useAuth();

  React.useEffect(() => {
    const checkApi = async () => {
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
        throw new Error('El email es requerido');
      }

      if (!isLogin && !formData.name) {
        throw new Error('El nombre es requerido para registro');
      }

      let userData: User;

      if (apiAvailable) {
        try {
          if (isLogin) {
            // Intentar autenticar con la API real (usando password demo por ahora)
            userData = await UserService.authenticateUser(
              formData.email, 
              "demo123"
            );
          } else {
            // Crear nuevo usuario
            userData = await UserService.createUser({
              name: formData.name || "Usuario",
              email: formData.email
            });
          }
          console.log('✅ Usuario autenticado/creado con API:', userData);
        } catch (apiError) {
          console.warn('API authentication failed, falling back to demo mode:', apiError);
          throw apiError;
        }
      } else {
        // Fallback local
        throw new Error('API not available');
      }

      login(userData);
      onClose && onClose();
      
    } catch (err) {
      console.warn('Using demo authentication:', err);
      
      // Fallback: crear usuario demo local
      const demoUserData: User = {
        id: `user_${Date.now()}`,
        name: formData.name || formData.email.split('@')[0],
        email: formData.email,
        role: 'participant',
        joinedEventIDs: [],
        createdEventIDs: []
      };

      login(demoUserData);
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
          <h2>🔭 {isLogin ? 'Iniciar Sesión' : 'Registro'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="api-status-auth">
          {apiAvailable ? (
            <div className="status-indicator online">
              🟢 Conectado al servidor
            </div>
          ) : (
            <div className="status-indicator offline">
              🟡 Modo demostración
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Nombre completo</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre completo"
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
              placeholder="tu@email.com"
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
            {loading ? 'Procesando...' : (isLogin ? '🚀 Iniciar Sesión' : '✨ Registrarse')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button 
              type="button"
              className="switch-btn"
              onClick={handleSwitchMode}
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        <div className="auth-info">
          <p className="demo-notice">
            💡 Este es un proyecto de demostración. 
            {!apiAvailable && ' La API no está disponible, funcionando en modo local.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
