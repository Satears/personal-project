import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import './App.css';

const { Content } = Layout;

// 登录注册页面和用户个人中心页面已在单独的文件中定义

function App() {
  return (
    <UserProvider>
      <CartProvider>
        <Router>
          <Layout className="app-layout">
            <Navbar />
            <Content className="app-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/user" element={<UserPage />} />
              </Routes>
            </Content>
          </Layout>
        </Router>
      </CartProvider>
    </UserProvider>
  );
}

export default App;