#!/bin/bash

# 前端部署脚本 - deploy_frontend.sh
# 用途：自动化部署前端React应用

set -e  # 遇到错误时立即退出

echo "=== 前端部署脚本开始执行 ==="

# 配置变量
APP_NAME="shop-frontend"
DEPLOY_DIR="."
BUILD_DIR="dist"
STATIC_SERVER_DIR="/var/www/html/shop"
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

# 清理旧的构建文件
clean_old_build() {
  if [ -d "$BUILD_DIR" ]; then
    log "清理旧的构建文件..."
    rm -rf "$BUILD_DIR"
  fi
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
  npm ci
}

# 构建应用
build_app() {
  log "构建前端应用..."
  npm run build
}

# 验证构建结果
verify_build() {
  if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A "$BUILD_DIR")" ]; then
    log "错误：构建失败或构建目录为空"
    exit 1
  fi
  log "构建验证成功！"
}

# 部署到静态服务器
deploy_to_server() {
  log "准备部署到静态服务器..."
  
  # 检查目标部署目录是否存在
  if [ ! -d "$STATIC_SERVER_DIR" ]; then
    log "目标目录不存在，尝试创建: $STATIC_SERVER_DIR"
    if mkdir -p "$STATIC_SERVER_DIR"; then
      log "创建目录成功: $STATIC_SERVER_DIR"
    else
      log "警告：无法创建目标目录，可能需要提升权限"
    fi
  fi
  
  log "复制构建文件到目标目录..."
  # 使用rsync同步文件（保留权限并删除目标中的旧文件）
  if command -v rsync &> /dev/null; then
    rsync -av --delete "$BUILD_DIR/" "$STATIC_SERVER_DIR/"
  else
    # 备用方案：使用cp命令
    log "警告：未找到rsync，使用cp命令"
    rm -rf "$STATIC_SERVER_DIR/*"
    cp -r "$BUILD_DIR/"* "$STATIC_SERVER_DIR/"
  fi
  
  log "部署完成，静态文件已复制到: $STATIC_SERVER_DIR"
}

# 提供部署信息
deployment_info() {
  log "生成部署信息..."
  
  echo "\n======== 部署信息 ========" >> "$LOG_FILE"
  echo "应用名称: $APP_NAME" >> "$LOG_FILE"
  echo "部署日期: $(date)" >> "$LOG_FILE"
  echo "构建目录: $(pwd)/$BUILD_DIR" >> "$LOG_FILE"
  echo "目标目录: $STATIC_SERVER_DIR" >> "$LOG_FILE"
  echo "========================\n" >> "$LOG_FILE"
  
  echo "\n部署信息已生成并保存到日志文件"
}

# 主部署流程
main() {
  log "开始部署$APP_NAME..."
  
  cd "$DEPLOY_DIR" || {
    log "错误：无法进入部署目录 $DEPLOY_DIR"
    exit 1
  }
  
  check_node
  clean_old_build
  clean_old_deps
  install_deps
  build_app
  verify_build
  deploy_to_server
  deployment_info
  
  log "部署成功！"
  return 0
}

# 执行部署并捕获返回值
main
DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
  log "=== 前端部署完成，部署状态：成功 ==="
  echo "部署日志已保存到: $LOG_FILE"
  exit 0
else
  log "=== 前端部署完成，部署状态：失败 ==="
  echo "部署日志已保存到: $LOG_FILE"
  exit 1
fi
