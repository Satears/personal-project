import React, { useState } from 'react';
import { Layout, Row, Col, Typography, Input, Select, Checkbox, Radio, Slider, Button, Space } from 'antd';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// 模拟产品数据
const mockProducts = [
  {
    id: 1,
    name: '高性能笔记本电脑 Pro Max',
    price: 9999,
    originalPrice: 11999,
    discount: 17,
    rating: 4.8,
    image: 'https://picsum.photos/400/400',
    category: '电子产品',
    brand: 'TechBrand'
  },
  {
    id: 2,
    name: '超薄全面屏智能手机',
    price: 3999,
    originalPrice: 4599,
    discount: 13,
    rating: 4.6,
    image: 'https://picsum.photos/401/400',
    category: '电子产品',
    brand: 'PhoneTech'
  },
  {
    id: 3,
    name: '智能手表运动监测器',
    price: 1299,
    rating: 4.5,
    image: 'https://picsum.photos/402/400',
    category: '智能穿戴',
    brand: 'WearFit'
  },
  {
    id: 4,
    name: '无线蓝牙耳机',
    price: 899,
    originalPrice: 1299,
    discount: 31,
    rating: 4.7,
    image: 'https://picsum.photos/403/400',
    category: '音频设备',
    brand: 'SoundTech'
  },
  {
    id: 5,
    name: '机械键盘青轴',
    price: 499,
    originalPrice: 699,
    discount: 29,
    rating: 4.9,
    image: 'https://picsum.photos/404/400',
    category: '电脑配件',
    brand: 'KeyMaster'
  },
  {
    id: 6,
    name: '无线鼠标游戏专用',
    price: 299,
    rating: 4.4,
    image: 'https://picsum.photos/405/400',
    category: '电脑配件',
    brand: 'MousePro'
  },
  {
    id: 7,
    name: '4K超高清显示器',
    price: 2499,
    originalPrice: 2999,
    discount: 17,
    rating: 4.6,
    image: 'https://picsum.photos/406/400',
    category: '电脑配件',
    brand: 'DisplayTech'
  },
  {
    id: 8,
    name: '智能音箱AI助手',
    price: 399,
    originalPrice: 599,
    discount: 33,
    rating: 4.3,
    image: 'https://picsum.photos/407/400',
    category: '智能家居',
    brand: 'HomeAI'
  }
];

const ProductsPage = () => {
  const [products, setProducts] = useState(mockProducts);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [brandFilter, setBrandFilter] = useState([]);
  const [discountFilter, setDiscountFilter] = useState(false);

  // 分类列表
  const categories = ['电子产品', '智能穿戴', '音频设备', '电脑配件', '智能家居'];
  // 品牌列表
  const brands = ['TechBrand', 'PhoneTech', 'WearFit', 'SoundTech', 'KeyMaster', 'MousePro', 'DisplayTech', 'HomeAI'];

  // 过滤产品
  const filteredProducts = products.filter(product => {
    // 搜索文本过滤
    const matchesSearch = searchText === '' || 
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.category.toLowerCase().includes(searchText.toLowerCase());

    // 分类过滤
    const matchesCategory = categoryFilter.length === 0 || 
      categoryFilter.includes(product.category);

    // 价格范围过滤
    const matchesPrice = product.price >= priceRange[0] && 
      product.price <= priceRange[1];

    // 评分过滤
    const matchesRating = ratingFilter === null || 
      product.rating >= ratingFilter;

    // 品牌过滤
    const matchesBrand = brandFilter.length === 0 || 
      brandFilter.includes(product.brand);

    // 折扣过滤
    const matchesDiscount = !discountFilter || 
      (product.originalPrice && product.originalPrice > product.price);

    return matchesSearch && matchesCategory && matchesPrice && 
           matchesRating && matchesBrand && matchesDiscount;
  });

  // 排序产品
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'priceAsc':
        return a.price - b.price;
      case 'priceDesc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'discount':
        const discountA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice * 100 : 0;
        const discountB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice * 100 : 0;
        return discountB - discountA;
      default:
        return 0;
    }
  });

  // 处理搜索
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // 处理分类选择
  const handleCategoryChange = (values) => {
    setCategoryFilter(values);
  };

  // 处理品牌选择
  const handleBrandChange = (values) => {
    setBrandFilter(values);
  };

  // 处理折扣过滤
  const handleDiscountChange = (e) => {
    setDiscountFilter(e.target.checked);
  };

  // 处理评分过滤
  const handleRatingChange = (e) => {
    setRatingFilter(parseFloat(e.target.value));
  };

  // 处理排序变化
  const handleSortChange = (value) => {
    setSortBy(value);
  };

  return (
    <Layout className="products-page">
      <Content className="content">
        <div className="products-header">
          <Title level={2}>所有商品</Title>
          <Text type="secondary">共 {sortedProducts.length} 件商品</Text>
        </div>
        
        <div className="main-layout">
          {/* 筛选侧边栏 */}
          <div className="filter-sidebar">
            <div className="filter-section">
              <Title level={4}>搜索</Title>
              <Search
                placeholder="搜索商品名称或分类"
                allowClear
                enterButton
                size="large"
                onSearch={handleSearch}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="filter-section">
              <Title level={4}>分类</Title>
              <Select
                mode="multiple"
                placeholder="选择分类"
                style={{ width: '100%' }}
                value={categoryFilter}
                onChange={handleCategoryChange}
              >
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </div>

            <div className="filter-section">
              <Title level={4}>品牌</Title>
              <Select
                mode="multiple"
                placeholder="选择品牌"
                style={{ width: '100%' }}
                value={brandFilter}
                onChange={handleBrandChange}
              >
                {brands.map(brand => (
                  <Option key={brand} value={brand}>{brand}</Option>
                ))}
              </Select>
            </div>

            <div className="filter-section">
              <Title level={4}>价格范围</Title>
              <Slider
                range
                min={0}
                max={10000}
                value={priceRange}
                onChange={setPriceRange}
                marks={{
                  0: '¥0',
                  2500: '¥2500',
                  5000: '¥5000',
                  7500: '¥7500',
                  10000: '¥10000'
                }}
              />
              <div className="price-range-text">
                <Text>¥{priceRange[0]} - ¥{priceRange[1]}</Text>
              </div>
            </div>

            <div className="filter-section">
              <Title level={4}>评分</Title>
              <Radio.Group onChange={handleRatingChange} value={ratingFilter}>
                <Space direction="vertical">
                  <Radio value={4}>4星及以上</Radio>
                  <Radio value={3}>3星及以上</Radio>
                  <Radio value={2}>2星及以上</Radio>
                  <Radio value={1}>1星及以上</Radio>
                  <Radio value={null}>全部评分</Radio>
                </Space>
              </Radio.Group>
            </div>

            <div className="filter-section">
              <Title level={4}>其他</Title>
              <Checkbox checked={discountFilter} onChange={handleDiscountChange}>
                仅显示有折扣商品
              </Checkbox>
            </div>
          </div>

          {/* 商品列表 */}
          <div className="products-container">
            <div className="products-toolbar">
              <Text type="secondary">显示 {sortedProducts.length} 件商品</Text>
              <Select
                defaultValue="default"
                style={{ width: 150 }}
                onChange={handleSortChange}
              >
                <Option value="default">默认排序</Option>
                <Option value="priceAsc">价格从低到高</Option>
                <Option value="priceDesc">价格从高到低</Option>
                <Option value="rating">评分从高到低</Option>
                <Option value="discount">折扣从高到低</Option>
              </Select>
            </div>

            <div className="products-grid">
              <Row gutter={[16, 16]}>
                {sortedProducts.map(product => (
                  <Col xs={24} sm={12} md={12} lg={8} xl={6} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>

              {sortedProducts.length === 0 && (
                <div className="no-products">
                  <Text type="secondary">没有找到符合条件的商品</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ProductsPage;