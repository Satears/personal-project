import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, message, Divider, Space } from 'antd';
import { UserOutlined, LogoutOutlined, EditOutlined, PhoneOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useUser } from '../context/UserContext';
import './UserPage.css';

const { Title, Text, Paragraph } = Typography;

const UserPage = () => {
  const navigate = useNavigate();
  const { user, isLoading, logout, refreshUser } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      logout();
      message.success('登出成功');
      navigate('/');
    } catch (error) {
      message.error('登出失败：' + (error.message || '未知错误'));
    }
  };

  // 刷新用户信息
  const handleRefreshUser = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
      message.success('用户信息已更新');
    } catch (error) {
      message.error('更新失败，请重新登录');
      navigate('/login');
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) {
    return (
      <div className="user-page-container">
        <Card className="user-card">
          <Title level={3} className="no-user-title">请先登录</Title>
          <Button 
            type="primary" 
            onClick={() => navigate('/login')}
            className="login-button"
          >
            去登录
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="user-page-container">
      <Card className="user-card">
        <div className="user-header">
          <div className="user-avatar">
            <UserOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
          </div>
          <div className="user-info">
            <Title level={3}>{user.username}</Title>
            <Paragraph type="secondary">{user.email}</Paragraph>
          </div>
        </div>
        
        <Divider />
        
        <div className="user-details">
          <div className="detail-item">
            <PhoneOutlined className="detail-icon" />
            <Text>手机号码：{user.phone || '未设置'}</Text>
          </div>
          <div className="detail-item">
            <HomeOutlined className="detail-icon" />
            <Text>地址：{user.address || '未设置'}</Text>
          </div>
          <div className="detail-item">
            <Text>角色：{user.role === 'admin' ? '管理员' : '普通用户'}</Text>
            
          </div>
        </div>
        
        <Divider />
        
        <div className="user-actions">
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              className="action-button"
              disabled={isLoading}
            >
              编辑资料
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              className="action-button"
              loading={refreshing}
              onClick={handleRefreshUser}
              disabled={isLoading}
            >
              刷新
            </Button>
            <Button 
              danger 
              icon={<LogoutOutlined />}
              className="action-button"
              onClick={handleLogout}
              disabled={isLoading || refreshing}
            >
              退出登录
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default UserPage;
