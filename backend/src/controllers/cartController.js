const { Cart, Product } = require('../models');
const { successResponse, errorResponse, notFoundResponse, validationErrorResponse } = require('../utils/response');

/**
 * 获取用户购物车
 */
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId })
      .populate('items.product', 'name images price discountPrice stock');
      
    if (!cart) {
      // 如果购物车不存在，返回空购物车
      return successResponse(res, {
        items: [],
        totalItems: 0,
        totalPrice: 0
      }, 200, '购物车为空');
    }
    
    return successResponse(res, cart, 200, '获取购物车成功');
  } catch (error) {
    console.error('Get cart error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 添加商品到购物车
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return validationErrorResponse(res, { productId: '商品ID不能为空' });
    }
    
    // 验证商品是否存在且库存充足
    const product = await Product.findById(productId);
    if (!product) {
      return notFoundResponse(res, '商品不存在');
    }
    
    if (!product.isActive) {
      return errorResponse(res, '该商品已下架', 400);
    }
    
    if (product.stock < quantity) {
      return errorResponse(res, '库存不足', 400);
    }
    
    // 查找或创建购物车
    let cart = await Cart.findOne({ user: req.userId });
    
    if (!cart) {
      // 创建新购物车
      cart = new Cart({
        user: req.userId,
        items: []
      });
    }
    
    // 检查商品是否已在购物车中
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (existingItemIndex >= 0) {
      // 更新数量
      cart.items[existingItemIndex].quantity += quantity;
      
      // 检查更新后是否超过库存
      if (cart.items[existingItemIndex].quantity > product.stock) {
        return errorResponse(res, '更新后库存不足', 400);
      }
    } else {
      // 添加新商品到购物车
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        discountPrice: product.discountPrice || 0
      });
    }
    
    // 保存购物车（中间件会自动计算总计）
    await cart.save();
    
    // 重新获取购物车以获取关联的产品信息
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name images price discountPrice stock');
    
    return successResponse(res, updatedCart, 200, '商品添加到购物车成功');
  } catch (error) {
    console.error('Add to cart error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 更新购物车商品数量
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    
    if (!itemId || quantity === undefined) {
      return validationErrorResponse(res, {
        itemId: '商品项ID不能为空',
        quantity: '数量不能为空'
      });
    }
    
    if (quantity <= 0) {
      return validationErrorResponse(res, { quantity: '数量必须大于0' });
    }
    
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return notFoundResponse(res, '购物车不存在');
    }
    
    // 查找购物车中的商品项
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return notFoundResponse(res, '购物车中不存在该商品');
    }
    
    // 获取商品信息检查库存
    const product = await Product.findById(cart.items[itemIndex].product);
    if (product.stock < quantity) {
      return errorResponse(res, '库存不足', 400);
    }
    
    // 更新数量
    cart.items[itemIndex].quantity = quantity;
    
    // 保存购物车
    await cart.save();
    
    // 重新获取购物车
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name images price discountPrice stock');
    
    return successResponse(res, updatedCart, 200, '购物车商品数量更新成功');
  } catch (error) {
    console.error('Update cart item error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 从购物车中删除商品
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return notFoundResponse(res, '购物车不存在');
    }
    
    // 过滤掉要删除的商品
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    
    // 保存购物车
    await cart.save();
    
    // 重新获取购物车
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name images price discountPrice stock');
    
    return successResponse(res, updatedCart, 200, '从购物车中删除商品成功');
  } catch (error) {
    console.error('Remove from cart error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 清空购物车
 */
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return successResponse(res, { items: [], totalItems: 0, totalPrice: 0 }, 200, '购物车已为空');
    }
    
    cart.items = [];
    await cart.save();
    
    return successResponse(res, cart, 200, '购物车已清空');
  } catch (error) {
    console.error('Clear cart error:', error);
    return errorResponse(res, error.message);
  }
};