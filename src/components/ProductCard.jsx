import React from 'react';
import { Card, Button, Badge, Rate, Typography, message } from 'antd';
import { ShoppingCartOutlined, HeartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const { Text, Title } = Typography;

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  
  const {
    id,
    name,
    price,
    originalPrice,
    discount,
    rating,
    image,
    category
  } = product;

  // 处理加入购物车
  const handleAddToCart = () => {
    addToCart(product);
    message.success(`${name} 已成功加入购物车！`);
  };

  // 处理收藏
  const handleFavorite = () => {
    message.info('收藏功能正在开发中...');
  };

  return (
    <Card
      hoverable
      cover={
        <div className="product-image-container">
          {
            discount && (
              <Badge.Ribbon text={`-${discount}%`} color="red" className="discount-badge">
                <img 
                  alt={name} 
                  src={image || 'https://picsum.photos/300/300'} 
                  className="product-image"
                />
              </Badge.Ribbon>
            ) || (
              <img 
                alt={name} 
                src={image || 'https://picsum.photos/300/300'} 
                className="product-image"
              />
            )
          }
          <div className="product-category">{category}</div>
        </div>
      }
      actions={[
        <Button 
          key="heart" 
          icon={<HeartOutlined />}
          type="text"
          onClick={handleFavorite}
        />,
        <Button 
          key="cart" 
          icon={<ShoppingCartOutlined />}
          type="primary"
          className="add-to-cart-btn"
          onClick={handleAddToCart}
        >
          加入购物车
        </Button>
      ]}
      className="product-card"
    >
      <Link to={`/product/${id}`} className="product-link">
        <Title level={5} className="product-name">{name}</Title>
      </Link>
      <Rate disabled defaultValue={rating || 0} className="product-rating" />
      <div className="product-price-container">
        <Text strong className="product-price">¥{price}</Text>
        {originalPrice && (
          <Text delete className="product-original-price">¥{originalPrice}</Text>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;