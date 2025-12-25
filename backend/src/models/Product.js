const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '产品名称不能为空'],
    trim: true
  },
  description: {
    type: String,
    required: [true, '产品描述不能为空']
  },
  price: {
    type: Number,
    required: [true, '产品价格不能为空'],
    min: [0, '价格不能为负数']
  },
  discountPrice: {
    type: Number,
    min: [0, '折扣价格不能为负数']
  },
  images: [
    {
      url: {
        type: String,
        required: true
      },
      alt: {
        type: String,
        trim: true
      }
    }
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '产品必须属于一个分类']
  },
  brand: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, '库存数量不能为空'],
    min: [0, '库存不能为负数'],
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    trim: true
  },
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [
    {
      type: String,
      trim: true
    }
  ],
  specifications: [
    {
      name: {
        type: String,
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 计算平均评分中间件
ProductSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = parseFloat((sum / this.ratings.length).toFixed(1));
    this.totalReviews = this.ratings.length;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }
  next();
});

// 更新时间中间件
ProductSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Product', ProductSchema);