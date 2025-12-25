import axios from 'axios';

// 创建axios实例
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // 后端API基础URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器，添加认证令牌
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理错误
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    if (error.response) {
      // 服务器响应了，但状态码不是2xx
      const { status, data } = error.response;
      
      // 401未授权，清除本地存储的token并跳转登录
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 这里可以触发重定向到登录页的逻辑
        window.location.href = '/login';
      }
      
      // 返回错误信息
      return Promise.reject({
        message: data.message || '请求失败',
        errors: data.errors || {},
        status,
      });
    } else if (error.request) {
      // 请求已发送，但没有收到响应
      return Promise.reject({ message: '网络错误，请检查您的连接' });
    } else {
      // 请求配置出错
      return Promise.reject({ message: error.message });
    }
  }
);

// 登录API
export const login = async (email, password) => {
  try {
    const response = await API.post('/auth/login', { email, password });
    return response;
  } catch (error) {
    throw error;
  }
};

// 注册API
export const register = async (userData) => {
  try {
    const { username, email, password, phone, address } = userData;
    const response = await API.post('/auth/register', {
      username,
      email,
      password,
      phone,
      address,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  try {
    const response = await API.get('/auth/me');
    return response;
  } catch (error) {
    throw error;
  }
};

// 更新用户信息
export const updateProfile = async (userData) => {
  try {
    const response = await API.put('/auth/profile', userData);
    return response;
  } catch (error) {
    throw error;
  }
};

// 修改密码
export const changePassword = async (passwordData) => {
  try {
    const response = await API.put('/auth/change-password', passwordData);
    return response;
  } catch (error) {
    throw error;
  }
};

// 登出API
export const logout = async () => {
  try {
    const response = await API.post('/auth/logout');
    return response;
  } catch (error) {
    throw error;
  }
};

export default API;
