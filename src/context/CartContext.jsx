import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建购物车Context
const CartContext = createContext(null);

// 购物车Provider组件
export const CartProvider = ({ children }) => {
  // 从localStorage加载购物车数据
  const loadCartFromStorage = () => {
    try {
      const cartData = localStorage.getItem('cart');
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('加载购物车数据失败:', error);
      return [];
    }
  };

  // 购物车商品列表
  const [cartItems, setCartItems] = useState(loadCartFromStorage);
  
  // 保存购物车数据到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('保存购物车数据失败:', error);
    }
  }, [cartItems]);

  // 添加商品到购物车
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      // 检查商品是否已在购物车中
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // 如果已存在，增加数量
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // 如果不存在，添加新商品
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  // 从购物车移除商品
  const removeFromCart = (productId) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.id !== productId)
    );
  };

  // 更新购物车中商品的数量
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  // 清空购物车
  const clearCart = () => {
    setCartItems([]);
  };

  // 计算购物车中的商品总数
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // 计算购物车总价
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // 提供给子组件的值
  const contextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// 自定义Hook，方便使用购物车Context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart必须在CartProvider内部使用');
  }
  return context;
};
