import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useUser } from '../context/UserContext';
import { login, register } from '../services/authService';
import './LoginPage.css';

const { TabPane } = Tabs;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: contextLogin } = useUser();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 登录处理函数
  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const { email, password } = values;
      const response = await login(email, password);
      
      // 使用UserContext保存登录状态
      contextLogin(response.token, response.user);
      
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error('登录失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 注册处理函数
  const handleRegister = async (values) => {
    try {
      setLoading(true);
      const { username, email, password, phone, address } = values;
      
      // 调用注册API
      await register({
        username,
        email,
        password,
        phone,
        address
      });
      
      message.success('注册成功，请登录');
      // 切换到登录标签并清空表单
      form.setFieldsValue({});
    } catch (error) {
      message.error('注册失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h2 className="login-title">用户登录/注册</h2>
        <Tabs defaultActiveKey="login">
          <TabPane tab="登录" key="login">
            <Form
              name="login"
              className="login-form"
              initialValues={{ remember: true }}
              onFinish={handleLogin}
            >
              <Form.Item
                name="email"
                rules={[{ required: true, message: '请输入邮箱地址' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input
                  prefix={<MailOutlined className="site-form-item-icon" />}
                  placeholder="邮箱"
                  type="email"
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度至少6位' }]}
              >
                <Input
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  type="password"
                  placeholder="密码"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="注册" key="register">
            <Form
              name="register"
              className="register-form"
              onFinish={handleRegister}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名长度至少3位' }]}
              >
                <Input
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder="用户名"
                />
              </Form.Item>
              <Form.Item
                name="email"
                rules={[{ required: true, message: '请输入邮箱地址' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input
                  prefix={<MailOutlined className="site-form-item-icon" />}
                  placeholder="邮箱"
                  type="email"
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度至少6位' }]}
              >
                <Input
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  type="password"
                  placeholder="密码"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  type="password"
                  placeholder="确认密码"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="register-form-button" loading={loading}>
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
