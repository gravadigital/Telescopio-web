import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, AuthProviderProps } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ver si esto va en un config o algo asi
const TELESCOPIO_USER_KEY = 'telescopio_user';
const TELESCOPIO_TOKEN_KEY = 'telescopio_token';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {setItem, getItem, removeItem} = useLocalStorage();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if there's a saved user and token in localStorage
    const savedUser = getItem(TELESCOPIO_USER_KEY) as string;
    const savedToken = getItem(TELESCOPIO_TOKEN_KEY) as string;

    console.log('🔍 AuthContext: Checking saved session', {
      hasSavedUser: !!savedUser,
      hasSavedToken: !!savedToken
    });

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser) satisfies User;
        console.log('✅ Restored session for:', parsedUser.email);
        setUser(parsedUser);
        setToken(savedToken);
      } catch (error) {
        console.error('❌ Error parsing saved user:', error);
        removeItem(TELESCOPIO_USER_KEY);
        removeItem(TELESCOPIO_TOKEN_KEY);
      }
    } else {
      console.log('ℹ️ No saved session found. User must login.');
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string): void => {
    setUser(userData);
    setToken(authToken);
    setItem(TELESCOPIO_USER_KEY, JSON.stringify(userData));
    setItem(TELESCOPIO_TOKEN_KEY, authToken);
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    removeItem(TELESCOPIO_USER_KEY);
    removeItem(TELESCOPIO_TOKEN_KEY);
    // Redirect to home page after logout
    window.location.href = '/';
  };

  const updateUser = (updatedData: Partial<User>): void => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    setItem(TELESCOPIO_USER_KEY, JSON.stringify(updatedUser));
  };

  const joinEvent = (eventId: string): void => {
    if (!user) return;
    
    const updatedJoinedEvents = [...user.joinedEventIDs];
    if (!updatedJoinedEvents.includes(eventId)) {
      updatedJoinedEvents.push(eventId);
    }
    
    const updatedUser = { ...user, joinedEventIDs: updatedJoinedEvents };
    setUser(updatedUser);
    setItem(TELESCOPIO_USER_KEY, JSON.stringify(updatedUser));
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
