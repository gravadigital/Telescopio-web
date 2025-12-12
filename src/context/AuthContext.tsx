import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, AuthProviderProps } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if there's a saved user and token in localStorage
    const savedUser = localStorage.getItem('telescopio_user');
    const savedToken = localStorage.getItem('telescopio_token');

    console.log('🔍 AuthContext: Checking saved session', {
      hasSavedUser: !!savedUser,
      hasSavedToken: !!savedToken
    });

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        console.log('✅ Restored session for:', parsedUser.email);
        setUser(parsedUser);
        setToken(savedToken);
      } catch (error) {
        console.error('❌ Error parsing saved user:', error);
        localStorage.removeItem('telescopio_user');
        localStorage.removeItem('telescopio_token');
      }
    } else {
      console.log('ℹ️ No saved session found. User must login.');
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string): void => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('telescopio_user', JSON.stringify(userData));
    localStorage.setItem('telescopio_token', authToken);
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('telescopio_user');
    localStorage.removeItem('telescopio_token');
    // Redirect to home page after logout
    window.location.href = '/';
  };

  const updateUser = (updatedData: Partial<User>): void => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('telescopio_user', JSON.stringify(updatedUser));
  };

  const joinEvent = (eventId: string): void => {
    if (!user) return;
    
    const updatedJoinedEvents = [...user.joinedEventIDs];
    if (!updatedJoinedEvents.includes(eventId)) {
      updatedJoinedEvents.push(eventId);
    }
    
    const updatedUser = { ...user, joinedEventIDs: updatedJoinedEvents };
    setUser(updatedUser);
    localStorage.setItem('telescopio_user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    updateUser,
    joinEvent,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
