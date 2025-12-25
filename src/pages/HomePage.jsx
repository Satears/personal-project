import React from 'react';
import { Layout, Carousel, Row, Col, Typography, Card, Button } from 'antd';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const { Content } = Layout;
const { Title, Text } = Typography;

// 模拟产品数据
const featuredProducts = [
  {
    id: 1,
    name: '高性能笔记本电脑 Pro Max',
    price: 9999,
    originalPrice: 11999,
    discount: 17,
    rating: 4.8,
    image: 'https://picsum.photos/400/400',
    category: '电子产品'
  },
  {
    id: 2,
    name: '超薄全面屏智能手机',
    price: 3999,
    originalPrice: 4599,
    discount: 13,
    rating: 4.6,
    image: 'https://picsum.photos/401/400',
    category: '电子产品'
  },
  {
    id: 3,
    name: '智能手表运动监测器',
    price: 1299,
    rating: 4.5,
    image: 'https://picsum.photos/402/400',
    category: '智能穿戴'
  },
  {
    id: 4,
    name: '无线蓝牙耳机',
    price: 899,
    originalPrice: 1299,
    discount: 31,
    rating: 4.7,
    image: 'https://picsum.photos/403/400',
    category: '音频设备'
  }
];

const HomePage = () => {
  const carouselItems = [
    {
      image: 'https://picsum.photos/1600/400',
      title: '夏季新品上市',
      description: '全场满300减50，限时抢购！',
      color: '#ff4d4f'
    },
    {
      image: 'https://picsum.photos/1601/400',
      title: '电子产品特惠',
      description: '精选电子产品低至7折',
      color: '#1890ff'
    },
    {
      image: 'https://picsum.photos/1602/400',
      title: '会员专享福利',
      description: '会员购物额外95折',
      color: '#52c41a'
    }
  ];

  const categories = [
    { name: '电子产品', icon: '📱' },
    { name: '家居生活', icon: '🏠' },
    { name: '时尚服饰', icon: '👔' },
    { name: '美妆个护', icon: '💄' },
    { name: '食品生鲜', icon: '🍎' },
    { name: '运动户外', icon: '⚽' }
  ];

  return (
    <Content className="home-content">
      {/* 轮播图 */}
      <Carousel autoplay className="home-carousel">
        {carouselItems.map((item, index) => (
          <div key={index} className="carousel-item">
            <img src={item.image} alt={item.title} className="carousel-image" />
            <div className="carousel-content">
              <Title level={3} style={{ color: item.color }}>{item.title}</Title>
              <Text style={{ fontSize: '18px' }}>{item.description}</Text>
              <Button type="primary" style={{ backgroundColor: item.color, marginTop: '16px' }}>
                立即查看
              </Button>
            </div>
          </div>
        ))}
      </Carousel>

      {/* 分类导航 */}
      <section className="categories-section">
        <Row gutter={[16, 16]} justify="center">
          {categories.map((category, index) => (
            <Col xs={8} sm={6} md={4} key={index}>
              <Link to={`/category/${category.name}`} className="category-link">
                <Card hoverable className="category-card">
                  <div className="category-icon">{category.icon}</div>
                  <Text strong>{category.name}</Text>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </section>

      {/* 推荐商品 */}
      <section className="products-section">
        <div className="section-header">
          <Title level={3}>推荐商品</Title>
          <Link to="/products" className="view-all-link">查看全部 →</Link>
        </div>
        <Row gutter={[16, 16]}>
          {featuredProducts.map(product => (
            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      </section>

      {/* 特色服务 */}
      <section className="services-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable className="service-card">
              <Title level={5}>🚚 快速配送</Title>
              <Text>全国包邮，次日送达</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable className="service-card">
              <Title level={5}>🔄 7天无理由退换</Title>
              <Text>购物无忧，售后保障</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable className="service-card">
              <Title level={5}>🔒 正品保障</Title>
              <Text>品牌直供，品质保证</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable className="service-card">
              <Title level={5}>💳 安全支付</Title>
              <Text>多种支付方式，安全便捷</Text>
            </Card>
          </Col>
        </Row>
      </section>
    </Content>
  );
};

export default HomePage;