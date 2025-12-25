# 电商网站项目

这是一个完整的电商网站项目，包含前端React应用和后端Node.js API服务。

## 项目结构

```
shop/
├── backend/         # Node.js后端服务
│   ├── config/      # 配置文件
│   ├── controllers/ # 控制器
│   ├── models/      # 数据模型
│   ├── routes/      # 路由
│   ├── services/    # 业务服务
│   └── src/         # 源代码
├── src/             # React前端应用
│   ├── components/  # 可复用组件
│   ├── context/     # React上下文
│   ├── pages/       # 页面组件
│   └── services/    # API服务
├── deploy.sh        # 部署脚本
└── README.md        # 项目说明（当前文件）
```

## 技术栈

### 前端
- React 18
- Vite
- CSS Modules
- React Router
- Axios

### 后端
- Node.js
- Express
- MongoDB
- Mongoose
- JWT认证

## 功能特性

- 用户注册和登录
- 产品展示和搜索
- 购物车功能
- 订单管理
- 反馈系统
- 监控和性能分析

## 安装和运行

### 前置要求
- Node.js (v16+)
- MongoDB

### 后端设置

1. 进入后端目录：
```bash
cd backend
```

2. 安装依赖：
```bash
npm install
```

3. 创建环境变量文件：
```bash
cp .env.example .env
```

4. 配置环境变量（编辑.env文件）

5. 运行后端服务：
```bash
npm start
```

### 前端设置

1. 回到项目根目录：
```bash
cd ..
```

2. 安装依赖：
```bash
npm install
```

3. 运行开发服务器：
```bash
npm run dev
```

## 部署

### 使用部署脚本

1. 确保脚本有执行权限：
```bash
chmod +x deploy.sh
```

2. 运行部署脚本：
```bash
./deploy.sh
```

## 测试

### API验证
```bash
node scripts/verify_api.js
```

### 监控系统性能
```bash
node scripts/monitor_system_performance.js
```

## 安全性

- 使用JWT进行用户认证
- 密码加密存储
- CORS策略配置
- 输入验证和清理

## 作者

[Your Name]

## 许可证

MIT
