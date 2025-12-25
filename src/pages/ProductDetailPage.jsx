import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Image, Typography, Divider, Button, Rate, Badge, Card, message } from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined, HeartOutlined, ShareAltOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css';

const { Title, Paragraph, Text } = Typography;

// 模拟商品数据
const mockProducts = [
  {
    id: 1,
    name: '超薄笔记本电脑 2024新款',
    price: 5999,
    originalPrice: 6999,
    discount: 14,
    rating: 4.8,
    reviewCount: 1256,
    category: '电子产品',
    images: [
      'http://via.placeholder.com/600x400?text=商品主图1',
      'http://via.placeholder.com/600x400?text=商品主图2',
      'http://via.placeholder.com/600x400?text=商品主图3',
    ],
    description: '这款超薄笔记本电脑采用最新一代处理器，性能强劲且续航持久。14英寸高清显示屏，轻薄便携设计，适合办公和娱乐使用。',
    specifications: [
      { name: '处理器', value: 'Intel Core i7-1360P' },
      { name: '内存', value: '16GB DDR5' },
      { name: '存储', value: '512GB SSD' },
      { name: '显示屏', value: '14英寸 2.8K OLED' },
      { name: '显卡', value: 'Intel Iris Xe Graphics' },
      { name: '电池', value: '60Wh 长效电池' },
      { name: '重量', value: '1.2kg' },
    ],
    stock: 50,
  },
  {
    id: 2,
    name: '无线蓝牙耳机 主动降噪',
    price: 899,
    originalPrice: 1299,
    discount: 31,
    rating: 4.6,
    reviewCount: 2431,
    category: '数码产品',
    images: [
      'http://via.placeholder.com/600x400?text=耳机主图1',
      'http://via.placeholder.com/600x400?text=耳机主图2',
      'http://via.placeholder.com/600x400?text=耳机主图3',
    ],
    description: '高保真音质，主动降噪技术，续航可达30小时。舒适佩戴，IPX5防水，支持无线充电。',
    specifications: [
      { name: '驱动单元', value: '10mm 动态单元' },
      { name: '降噪深度', value: '40dB' },
      { name: '续航时间', value: '单次8小时，总30小时' },
      { name: '连接', value: '蓝牙5.3' },
      { name: '防水等级', value: 'IPX5' },
      { name: '充电方式', value: '无线充电/Type-C' },
    ],
    stock: 100,
  },
];

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟API请求延迟
    setTimeout(() => {
      const foundProduct = mockProducts.find(p => p.id.toString() === id);
      setProduct(foundProduct);
      setLoading(false);
    }, 300);
  }, [id]);

  if (loading) {
    return (
      <div className="product-detail-loading">
        <Title level={3}>加载中...</Title>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-not-found">
        <Title level={3}>商品不存在</Title>
        <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>返回</Button>
      </div>
    );
  }

  const handleQuantityChange = (action) => {
    if (action === 'decrease' && quantity > 1) {
      setQuantity(quantity - 1);
    } else if (action === 'increase' && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = () => {
    const productWithQuantity = { ...product, quantity };
    addToCart(productWithQuantity);
    message.success(`${product.name} 已成功加入购物车！`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleFavorite = () => {
    message.info('收藏功能正在开发中...');
  };

  const handleShare = () => {
    message.info('分享功能正在开发中...');
  };

  const isOutOfStock = product.stock <= 0;
  const canAddMore = quantity < product.stock;

  return (
    <div className="product-detail-page">
      <Button 
        type="link" 
        onClick={() => navigate(-1)} 
        className="back-button"
        icon={<ArrowLeftOutlined />}
      >
        返回
      </Button>
      
      <Row gutter={[24, 24]}>
        {/* 商品图片区域 */}
        <Col xs={24} lg={12}>
          <div className="product-image-section">
            <div className="main-image">
              <Image 
                src={product.images[currentImageIndex]} 
                alt={product.name}
                className="product-main-image"
              />
            </div>
            <div className="thumbnail-list">
              {product.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`thumbnail-item ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <Image src={image} alt={`缩略图 ${index + 1}`} className="thumbnail" />
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* 商品信息区域 */}
        <Col xs={24} lg={12}>
          <div className="product-info-section">
            <div className="product-category">{product.category}</div>
            <Title level={2} className="product-name">{product.name}</Title>
            
            <div className="product-rating">
              <Rate disabled defaultValue={product.rating} />
              <Text>{product.rating} ({product.reviewCount} 评价)</Text>
            </div>

            <Divider />

            <div className="product-price-section">
              {product.discount && (
                <Badge.Ribbon text={`-${product.discount}%`} color="red" className="discount-badge">
                  <div className="price-container">
                    <Text strong className="current-price">¥{product.price}</Text>
                    <Text delete className="original-price">¥{product.originalPrice}</Text>
                  </div>
                </Badge.Ribbon>
              ) || (
                <Text strong className="current-price">¥{product.price}</Text>
              )}
            </div>

            <Divider />

            {/* 数量选择 */}
            <div className="quantity-section">
              <Text strong>数量</Text>
              <div className="quantity-selector">
                <Button 
                  icon={<MinusOutlined />} 
                  disabled={quantity <= 1}
                  onClick={() => handleQuantityChange('decrease')}
                  size="small"
                />
                <span className="quantity-value">{quantity}</span>
                <Button 
                  icon={<PlusOutlined />} 
                  disabled={!canAddMore}
                  onClick={() => handleQuantityChange('increase')}
                  size="small"
                />
                <Text type="secondary">库存: {product.stock}件</Text>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="action-buttons">
              <Button 
                type="primary" 
                size="large" 
                className="add-to-cart-button"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                加入购物车
              </Button>
              <Button 
                type="default" 
                size="large" 
                className="buy-now-button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                立即购买
              </Button>
            </div>

            {/* 额外操作 */}
            <div className="extra-actions">
              <Button type="text" icon={<HeartOutlined />} onClick={handleFavorite}>
                收藏
              </Button>
              <Button type="text" icon={<ShareAltOutlined />} onClick={handleShare}>
                分享
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* 商品详情和规格 */}
      <Divider>
        <Title level={4}>商品详情</Title>
      </Divider>
      
      <div className="product-details-content">
        <Card title="商品描述" className="description-card">
          <Paragraph>{product.description}</Paragraph>
        </Card>

        <Card title="商品规格" className="specifications-card">
          <Row gutter={[24, 16]}>
            {product.specifications.map((spec, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <div className="spec-item">
                  <Text strong>{spec.name}:</Text>
                  <Text>{spec.value}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetailPage;