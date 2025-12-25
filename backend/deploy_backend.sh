#!/bin/bash

# 后端部署脚本 - deploy_backend.sh
# 用途：自动化部署后端服务

set -e  # 遇到错误时立即退出

echo "=== 后端部署脚本开始执行 ==="

# 配置变量
APP_NAME="shop-backend"
DEPLOY_DIR="."
NODE_ENV="production"
LOG_FILE="deploy_$(date +%Y%m%d_%H%M%S).log"

# 记录日志的函数
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

# 检查Node.js和npm
check_node() {
  log "检查Node.js和npm版本..."
  if ! command -v node &> /dev/null; then
    log "错误：未找到Node.js，请先安装Node.js 14+"
    exit 1
  fi
  if ! command -v npm &> /dev/null; then
    log "错误：未找到npm，请先安装npm"
    exit 1
  fi
  log "Node.js版本: $(node -v)"
  log "npm版本: $(npm -v)"
}

# 清理旧的node_modules
clean_old_deps() {
  if [ -d "node_modules" ]; then
    log "清理旧的依赖包..."
    rm -rf node_modules
  fi
}

# 安装依赖
install_deps() {
  log "安装依赖包..."
  npm ci --only=production
}

# 配置环境变量
setup_env() {
  log "配置环境变量..."
  if [ ! -f ".env.production" ]; then
    if [ -f ".env" ]; then
      log "复制.env为.env.production"
      cp .env .env.production
    else
      log "错误：未找到.env文件"
      exit 1
    fi
  fi
  export NODE_ENV=production
}

# 启动服务（使用PM2）
start_service() {
  log "启动后端服务..."
  if command -v pm2 &> /dev/null; then
    log "使用PM2启动服务..."
    pm2 start npm --name "$APP_NAME" -- run start:prod
    pm2 save
    pm2 status $APP_NAME
  else
    log "警告：未找到PM2，尝试直接启动服务（不推荐用于生产环境）"
    nohup npm run start:prod > app.log 2>&1 &
    log "服务已启动，PID: $!"
  fi
}

# 健康检查
health_check() {
  log "进行健康检查..."
  max_attempts=10
  attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:5000/api/health; then
      log "健康检查通过！"
      return 0
    fi
    log "健康检查失败，等待3秒后重试 ($attempt/$max_attempts)"
    sleep 3
    attempt=$((attempt + 1))
  done
  
  log "错误：健康检查在$max_attempts次尝试后失败"
  return 1
}

# 主部署流程
main() {
  log "开始部署$APP_NAME..."
  
  cd "$DEPLOY_DIR" || {
    log "错误：无法进入部署目录 $DEPLOY_DIR"
    exit 1
  }
  
  check_node
  clean_old_deps
  install_deps
  setup_env
  start_service
  
  if health_check; then
    log "部署成功！"
    return 0
  else
    log "部署失败！"
    return 1
  fi
}

# 执行部署并捕获返回值
main
DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
  log "=== 后端部署完成，部署状态：成功 ==="
  echo "部署日志已保存到: $LOG_FILE"
  exit 0
else
  log "=== 后端部署完成，部署状态：失败 ==="
  echo "部署日志已保存到: $LOG_FILE"
  exit 1
fi
