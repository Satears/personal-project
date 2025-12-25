import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Input, Badge, Avatar } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, UserOutlined, HeartOutlined, HomeOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import './Navbar.css';

const { Header } = Layout;
const { Search } = Input;

const Navbar = () => {
  const { getCartItemCount } = useCart();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const cartItemCount = getCartItemCount();

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>
    },
    {
      key: 'products',
      icon: <AppstoreOutlined />,
      label: <Link to="/products">商品列表</Link>
    }
  ];

  // 处理个人中心点击事件
  const handleUserClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/user');
    } else {
      navigate('/login');
    }
  };

  return (
    <Header className="navbar">
      <div className="logo">
        <Link to="/">SHOP</Link>
      </div>
      <Menu theme="dark" mode="horizontal" className="nav-menu" items={menuItems} />
      <div className="navbar-right">
        <Search
          placeholder="搜索商品"
          allowClear
          enterButton={<SearchOutlined />}
          className="search-input"
        />
        <Link to="/favorites" className="nav-icon">
          <HeartOutlined />
        </Link>
        <Badge count={cartItemCount} showZero className="nav-icon">
          <Link to="/cart">
            <ShoppingCartOutlined />
          </Link>
        </Badge>
        <a href="#" className="nav-icon" onClick={handleUserClick}>
          <Avatar icon={<UserOutlined />} />
        </a>
      </div>
    </Header>
  );
};

export default Navbar;