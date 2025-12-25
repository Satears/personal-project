import axios from 'axios';

// 创建axios实例
const api = axios.create({
  // 使用环境变量中的API基础URL，如果没有则使用默认值
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取令牌
    const token = localStorage.getItem('token');
    
    // 如果令牌存在，则添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 处理网络错误
    if (!error.response) {
      console.error('网络错误，请检查您的网络连接');
      return Promise.reject(new Error('网络错误，请检查您的网络连接'));
    }
    
    // 处理401未授权错误（token过期或无效）
    if (error.response.status === 401) {
      // 清除本地存储的令牌和用户信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 可以选择重定向到登录页面
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // 提取错误信息
    const errorMessage = error.response.data?.message || '请求失败';
    console.error('API错误:', errorMessage);
    
    return Promise.reject(new Error(errorMessage));
  }
);

// 导出API请求方法
export default {
  // 用户相关API
  user: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (userData) => api.put('/auth/profile', userData),
    changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
    logout: () => api.post('/auth/logout')
  },
  
  // 产品相关API
  products: {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getRecommended: (params) => api.get('/products/recommended', { params }),
    getFeatured: (params) => api.get('/products/featured', { params })
  },
  
  // 购物车相关API
  cart: {
    // 注意：购物车功能在前端使用localStorage实现，但可以扩展为使用后端API
    // 这里预留了后端API接口的实现方式
    syncCart: (cartItems) => api.post('/cart/sync', { items: cartItems }),
    getCart: () => api.get('/cart'),
    updateCart: (cartData) => api.put('/cart', cartData)
  },
  
  // 订单相关API
  orders: {
    create: (orderData) => api.post('/orders', orderData),
    getMyOrders: (params) => api.get('/orders/my-orders', { params }),
    getOrderById: (id) => api.get(`/orders/${id}`)
  },
  
  // 支付相关API
  payment: {
    createPaymentIntent: (amount) => api.post('/payment/create-intent', { amount }),
    processPayment: (paymentData) => api.post('/payment/process', paymentData)
  }
};
