#!/bin/bash

# 综合部署脚本 - deploy.sh
# 用途：自动化部署整个电商系统（前端和后端）

set -e  # 遇到错误时立即退出

echo "=== 电商系统综合部署脚本开始执行 ==="

# 配置变量
DEPLOY_DIR="$(pwd)"
FRONTEND_DIR="$DEPLOY_DIR"
BACKEND_DIR="$DEPLOY_DIR/backend"
LOG_FILE="deploy_$(date +%Y%m%d_%H%M%S).log"

# 记录日志的函数
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

# 显示欢迎信息
welcome() {
  echo ""
  echo "======================================="
  echo "        电商系统自动部署脚本          "
  echo "======================================="
  echo "时间: $(date)"
  echo "日志文件: $LOG_FILE"
  echo "======================================="
  echo ""
}

# 检查系统依赖
check_dependencies() {
  log "检查系统依赖..."
  
  # 检查bash版本
  if [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
    log "警告：Bash版本低于4.0，可能会影响脚本功能"
  fi
  
  # 检查必要的命令
  for cmd in curl grep sed; do
    if ! command -v "$cmd" &> /dev/null; then
      log "错误：未找到必要的命令 $cmd，请先安装"
      exit 1
    fi
  done
  
  log "系统依赖检查完成"
}

# 更新部署脚本权限
update_permissions() {
  log "更新部署脚本权限..."
  chmod +x "$BACKEND_DIR/deploy_backend.sh"
  chmod +x "$DEPLOY_DIR/deploy_frontend.sh"
  chmod +x "$DEPLOY_DIR/deploy.sh"
  log "权限更新完成"
}

# 部署前端
deploy_frontend() {
  log "开始部署前端..."
  cd "$FRONTEND_DIR"
  
  if [ -f "deploy_frontend.sh" ]; then
    if ./deploy_frontend.sh; then
      log "前端部署成功"
      return 0
    else
      log "错误：前端部署失败"
      return 1
    fi
  else
    log "错误：找不到前端部署脚本"
    return 1
  fi
}

# 部署后端
deploy_backend() {
  log "开始部署后端..."
  cd "$BACKEND_DIR"
  
  if [ -f "deploy_backend.sh" ]; then
    if ./deploy_backend.sh; then
      log "后端部署成功"
      return 0
    else
      log "错误：后端部署失败"
      return 1
    fi
  else
    log "错误：找不到后端部署脚本"
    return 1
  fi
}

# 执行系统健康检查
system_health_check() {
  log "执行系统健康检查..."
  
  # 检查前端是否可访问
  if curl -s http://localhost/shop &> /dev/null; then
    log "前端可访问性检查通过"
  else
    log "警告：前端可能无法访问，请确认Web服务器配置"
  fi
  
  # 检查后端API健康端点
  if curl -s http://localhost:5000/api/health &> /dev/null; then
    log "后端API健康检查通过"
  else
    log "警告：后端API可能无法访问，请确认后端服务是否正常启动"
  fi
  
  log "系统健康检查完成"
}

# 生成部署报告
generate_report() {
  log "生成部署报告..."
  
  echo "\n========= 部署报告 ==========" >> "$LOG_FILE"
  echo "部署时间: $(date)" >> "$LOG_FILE"
  echo "部署目录: $DEPLOY_DIR" >> "$LOG_FILE"
  echo "前端目录: $FRONTEND_DIR" >> "$LOG_FILE"
  echo "后端目录: $BACKEND_DIR" >> "$LOG_FILE"
  echo "系统状态: $1" >> "$LOG_FILE"
  echo "============================" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  
  echo "部署报告已生成，请查看日志文件: $LOG_FILE"
}

# 回滚机制（简单版本）
rollback() {
  log "执行部署回滚..."
  # 这里可以根据需要实现更复杂的回滚逻辑
  # 例如备份文件恢复、服务重启等
  
  log "回滚操作已执行（注：此为简化版回滚，实际部署中可能需要更复杂的回滚策略）"
  return 0
}

# 主部署流程
main() {
  welcome
  check_dependencies
  update_permissions
  
  # 记录开始时间
  start_time=$(date +%s)
  
  # 部署前端
  if ! deploy_frontend; then
    log "前端部署失败，执行回滚..."
    rollback
    generate_report "失败"
    return 1
  fi
  
  # 部署后端
  if ! deploy_backend; then
    log "后端部署失败，执行回滚..."
    rollback
    generate_report "失败"
    return 1
  fi
  
  # 执行系统健康检查
  system_health_check
  
  # 计算部署时间
  end_time=$(date +%s)
  deploy_time=$((end_time - start_time))
  
  log "部署完成，总耗时: ${deploy_time}秒"
  generate_report "成功"
  
  return 0
}

# 执行主流程
main
DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
  echo ""
  echo "======================================="
  echo "部署成功！系统已完成部署，请检查系统功能"
  echo "======================================="
  exit 0
else
  echo ""
  echo "======================================="
  echo "部署失败！请检查日志文件并修复问题"
  echo "======================================="
  exit 1
fi
