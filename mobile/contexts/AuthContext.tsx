import React, { createContext, useContext, useEffect, useState } from 'react';
import { secureStorage } from '../lib/secureStorage';
import { api } from '../lib/api';
import { flushEventQueue } from '../lib/events';

type User = { id: number; email: string; username: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await secureStorage.getItemAsync('token');
        if (t) {
          api.setToken(t);
          const res = await api.get('/users/me').catch(() => null);
          if (res?.data) {
            setUser(res.data);
            setToken(t);
            flushEventQueue();
          } else {
            await secureStorage.deleteItemAsync('token');
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    await secureStorage.setItemAsync('token', t);
    api.setToken(t);
    setToken(t);
    setUser(u);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await api.post('/auth/register', { email, password, name });
    const { token: t, user: u } = res.data;
    await secureStorage.setItemAsync('token', t);
    api.setToken(t);
    setToken(t);
    setUser(u);
  };

  const signInWithGoogle = async () => {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) GoogleSignin.configure({ webClientId: clientId });
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    if (!idToken) throw new Error('Google sign-in cancelled');
    const res = await api.post('/auth/google', { idToken });
    const { token: t, user: u } = res.data;
    await secureStorage.setItemAsync('token', t);
    api.setToken(t);
    setToken(t);
    setUser(u);
  };

  const signInWithApple = async () => {
    const AppleAuthentication = await import('expo-apple-authentication').then(m => m.default);
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const identityToken = credential.identityToken;
    if (!identityToken) throw new Error('Apple sign-in failed');
    const name = credential.fullName
      ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join('')
      : undefined;
    const res = await api.post('/auth/apple', { identityToken, name });
    const { token: t, user: u } = res.data;
    await secureStorage.setItemAsync('token', t);
    api.setToken(t);
    setToken(t);
    setUser(u);
  };

  const logout = async () => {
    await secureStorage.deleteItemAsync('token');
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        signInWithGoogle,
        signInWithApple,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
