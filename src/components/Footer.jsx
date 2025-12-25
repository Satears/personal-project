import React from 'react';
import { Layout, Row, Col, Typography, Divider } from 'antd';
import { Link } from 'react-router-dom';
import './Footer.css';

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

const Footer = () => {
  return (
    <AntFooter className="footer">
      <Row gutter={[32, 32]}>
        <Col xs={24} md={6}>
          <Title level={4} className="footer-title">关于我们</Title>
          <ul className="footer-list">
            <li><Link to="/about">公司简介</Link></li>
            <li><Link to="/contact">联系我们</Link></li>
            <li><Link to="/careers">招贤纳士</Link></li>
          </ul>
        </Col>
        <Col xs={24} md={6}>
          <Title level={4} className="footer-title">客户服务</Title>
          <ul className="footer-list">
            <li><Link to="/faq">常见问题</Link></li>
            <li><Link to="/shipping">配送信息</Link></li>
            <li><Link to="/returns">退换货政策</Link></li>
          </ul>
        </Col>
        <Col xs={24} md={6}>
          <Title level={4} className="footer-title">商家合作</Title>
          <ul className="footer-list">
            <li><Link to="/sell">商家入驻</Link></li>
            <li><Link to="/promote">推广服务</Link></li>
            <li><Link to="/api">开放平台</Link></li>
          </ul>
        </Col>
        <Col xs={24} md={6}>
          <Title level={4} className="footer-title">关注我们</Title>
          <div className="footer-social">
            <Text>微信公众号：SHOP商城</Text>
            <br />
            <Text>客服电话：400-123-4567</Text>
            <br />
            <Text>工作时间：9:00-21:00</Text>
          </div>
        </Col>
      </Row>
      <Divider />
      <div className="footer-bottom">
        <Text>© 2024 SHOP商城. 保留所有权利。</Text>
      </div>
    </AntFooter>
  );
};

export default Footer;