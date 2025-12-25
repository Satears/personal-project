// API验证脚本 - verify_api.js
// 用途：测试各个API端点的可用性和响应状态

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置API基础URL
const API_BASE_URL = 'http://localhost:5000/api';
const TIMEOUT = 5000; // 5秒超时

// 测试结果日志文件
const LOG_FILE = path.join(__dirname, 'api_verification_result.log');

// API端点列表
const API_ENDPOINTS = [
  // 公开API
  { method: 'GET', url: '/health', name: '健康检查', auth: false },
  { method: 'GET', url: '/products', name: '产品列表', auth: false },
  { method: 'GET', url: '/categories', name: '分类列表', auth: false },
  
  // 需要认证的API示例（测试时会被跳过）
  { method: 'GET', url: '/auth/me', name: '用户信息', auth: true },
  { method: 'GET', url: '/cart', name: '购物车', auth: true },
  { method: 'GET', url: '/orders', name: '订单列表', auth: true }
];

// 记录日志的函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage);
}

// 测试单个API端点
async function testEndpoint(endpoint) {
  const { method, url, name, auth } = endpoint;
  const fullUrl = `${API_BASE_URL}${url}`;
  
  // 如果需要认证，先跳过
  if (auth) {
    log(`⚠️  ${name} (${url}) 需要认证，跳过测试`);
    return { name, url, status: 'skipped', reason: '需要认证' };
  }
  
  try {
    log(`🔍  测试 ${name} (${method} ${url})`);
    
    const response = await axios({
      method,
      url: fullUrl,
      timeout: TIMEOUT
    });
    
    log(`✅  ${name} 测试成功 - 状态码: ${response.status}`);
    return { 
      name, 
      url, 
      status: 'success', 
      statusCode: response.status,
      responseTime: response.headers['x-response-time'] || '未知'
    };
  } catch (error) {
    const errorMessage = error.response ? 
      `错误状态码: ${error.response.status}` : 
      `请求失败: ${error.message}`;
    
    log(`❌  ${name} 测试失败 - ${errorMessage}`);
    return { 
      name, 
      url, 
      status: 'error', 
      error: errorMessage 
    };
  }
}

// 主测试函数
async function runApiVerification() {
  // 清空旧日志
  fs.writeFileSync(LOG_FILE, '=== API验证测试报告 ===\n');
  log('开始API验证测试...');
  
  const results = {
    total: API_ENDPOINTS.length,
    success: 0,
    error: 0,
    skipped: 0,
    details: []
  };
  
  // 测试所有端点
  for (const endpoint of API_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.details.push(result);
    
    // 更新统计
    if (result.status === 'success') results.success++;
    else if (result.status === 'error') results.error++;
    else if (result.status === 'skipped') results.skipped++;
    
    // 短暂延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 生成摘要报告
  log('\n=== 测试摘要 ===');
  log(`总测试端点: ${results.total}`);
  log(`成功: ${results.success}`);
  log(`失败: ${results.error}`);
  log(`跳过: ${results.skipped}`);
  
  // 判断整体状态
  if (results.error > 0) {
    log('❌ API验证测试整体失败');
  } else {
    log('✅ API验证测试整体成功');
  }
  
  // 将结果保存为JSON
  const jsonResults = JSON.stringify(results, null, 2);
  fs.writeFileSync(path.join(__dirname, 'api_verification_result.json'), jsonResults);
  
  return results;
}

// 执行验证
if (require.main === module) {
  runApiVerification()
    .then(results => {
      process.exit(results.error > 0 ? 1 : 0);
    })
    .catch(error => {
      log(`验证过程中出现错误: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runApiVerification };
