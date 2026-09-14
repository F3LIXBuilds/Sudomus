/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        const res = await authService.me();
        if (res && res.user) {
          setUser(res.user);
          setProfile({
            name: res.user.name || res.user.email?.split('@')[0] || 'User',
            user_type: res.user.role || res.user.user_type || 'user',
            email: res.user.email,
            wallet_address: res.user.wallet_address || null
          });
          localStorage.setItem('user', JSON.stringify(res.user));
        } else {
          throw new Error('No user returned');
        }
      } else {
        localStorage.removeItem('user');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error verifying auth token:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async () => {
    // Wait for the stored values to be written in the caller component
    // then fetch fresh user data
    await checkAuth();
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (newProfile) => {
    const res = await authService.updateProfile(newProfile);
    if (res && res.user) {
      const updatedUser = { ...user, ...res.user };
      const updatedProfile = {
        ...profile,
        name: res.user.name,
        user_type: res.user.role || res.user.user_type || profile?.user_type,
        email: res.user.email,
        wallet_address: res.user.wallet_address || profile?.wallet_address,
        phone: res.user.phone,
        bio: res.user.bio
      };
      setUser(updatedUser);
      setProfile(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return res.user;
    }
    throw new Error(res?.message || 'Failed to update profile');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, profile, login, logout, updateProfile, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
