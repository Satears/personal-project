const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '购物车必须属于一个用户']
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: [true, '商品数量不能为空'],
        min: [1, '商品数量至少为1']
      },
      price: {
        type: Number,
        required: [true, '商品价格不能为空'],
        min: [0, '价格不能为负数']
      },
      discountPrice: {
        type: Number,
        min: [0, '折扣价格不能为负数']
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  totalItems: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新购物车统计信息中间件
CartSchema.pre('save', function(next) {
  let totalItems = 0;
  let totalPrice = 0;
  
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      totalItems += item.quantity;
      const itemPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
      totalPrice += itemPrice * item.quantity;
    });
  }
  
  this.totalItems = totalItems;
  this.totalPrice = totalPrice;
  next();
});

// 更新时间中间件
CartSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Cart', CartSchema);