import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser } from '../services/authService';

// 创建用户上下文
const UserContext = createContext();

// 用户上下文提供者组件
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 检查用户登录状态并验证token有效性
  useEffect(() => {
    const verifyTokenAndLoadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const userFromStorage = localStorage.getItem('user');
        
        if (token) {
          // 优先使用本地存储的用户信息
          if (userFromStorage) {
            try {
              const parsedUser = JSON.parse(userFromStorage);
              setUser(parsedUser);
            } catch (parseError) {
              console.error('解析本地用户信息失败:', parseError);
              localStorage.removeItem('user');
            }
          }
          
          // 尝试从后端验证token并刷新用户信息
          try {
            const userData = await getCurrentUser();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (error) {
            // Token无效或过期，清除本地存储
            console.warn('Token验证失败，但仍保留本地用户信息用于显示:', error);
            // 不立即清除本地存储，允许用户查看部分信息
          }
        } else {
          // 没有token，确保用户状态为null
          setUser(null);
        }
      } catch (error) {
        console.error('检查用户状态时出错:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyTokenAndLoadUser();
  }, []);

  // 登录函数
  const login = (token, userInfo) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
  };
  
  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const userData = await getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      // Token可能已过期
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // 检查是否已登录
  const isAuthenticated = !!user;

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// 自定义钩子，方便在组件中使用用户上下文
export const useUser = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
};