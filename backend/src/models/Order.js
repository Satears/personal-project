const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '订单必须属于一个用户']
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
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
      image: {
        type: String,
        required: true
      },
      sku: {
        type: String
      }
    }
  ],
  shippingAddress: {
    fullName: {
      type: String,
      required: [true, '收货人姓名不能为空']
    },
    phone: {
      type: String,
      required: [true, '联系电话不能为空']
    },
    address: {
      type: String,
      required: [true, '详细地址不能为空']
    },
    city: {
      type: String,
      required: [true, '城市不能为空']
    },
    zipCode: {
      type: String,
      required: [true, '邮政编码不能为空']
    },
    country: {
      type: String,
      required: [true, '国家/地区不能为空']
    }
  },
  paymentMethod: {
    type: String,
    required: [true, '支付方式不能为空'],
    enum: ['creditCard', 'paypal', 'bankTransfer', 'cod']
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: {
    type: Number,
    required: [true, '商品总价不能为空'],
    min: [0, '商品总价不能为负数']
  },
  shippingPrice: {
    type: Number,
    required: [true, '运费不能为空'],
    min: [0, '运费不能为负数'],
    default: 0
  },
  taxPrice: {
    type: Number,
    required: [true, '税费不能为空'],
    min: [0, '税费不能为负数'],
    default: 0
  },
  discountAmount: {
    type: Number,
    min: [0, '优惠金额不能为负数'],
    default: 0
  },
  totalPrice: {
    type: Number,
    required: [true, '订单总价不能为空'],
    min: [0, '订单总价不能为负数']
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  couponCode: {
    type: String,
    trim: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 生成订单号中间件
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // 生成格式：ORDER-YYYYMMDD-随机6位数
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
    this.orderNumber = `ORDER-${dateStr}-${randomStr}`;
  }
  next();
});

// 更新时间中间件
OrderSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Order', OrderSchema);