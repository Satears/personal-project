// 部署验证脚本 - verify_deployment.js
// 用途：验证生产环境部署后，系统各核心功能和接口是否正常工作

const axios = require('axios');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost',
  timeout: 10000,
  logFile: `verification_${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
  retryCount: 3,
  retryDelay: 3000
};

// 日志记录函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  
  console[type === 'error' ? 'error' : 'log'](logMessage);
  
  try {
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  } catch (error) {
    console.error('无法写入日志文件:', error.message);
  }
}

// 重试函数
async function retry(fn, description, maxRetries = CONFIG.retryCount, delay = CONFIG.retryDelay) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      log(`尝试 ${i + 1}/${maxRetries}: ${description}`);
      return await fn();
    } catch (error) {
      lastError = error;
      log(`${description} 失败: ${error.message}. ${i < maxRetries - 1 ? '重试中...' : '已达到最大重试次数。'}`);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// 验证后端API健康状态
async function verifyApiHealth() {
  log('开始验证API健康状态...');
  
  const result = await retry(async () => {
    const response = await axios.get(`${CONFIG.apiBaseUrl}/health`, {
      timeout: CONFIG.timeout
    });
    return response.data;
  }, 'API健康检查');
  
  log(`API健康状态: ${result.status || 'OK'}`, 'success');
  return true;
}

// 验证产品API
async function verifyProductsApi() {
  log('开始验证产品API...');
  
  // 获取产品列表
  const productsResponse = await retry(async () => {
    const response = await axios.get(`${CONFIG.apiBaseUrl}/products`, {
      timeout: CONFIG.timeout,
      params: { limit: 5 }
    });
    return response.data;
  }, '获取产品列表');
  
  if (!productsResponse || !Array.isArray(productsResponse)) {
    throw new Error('产品列表格式不正确');
  }
  
  log(`成功获取 ${productsResponse.length} 个产品`, 'success');
  
  // 如果有产品，验证产品详情API
  if (productsResponse.length > 0) {
    const productId = productsResponse[0]._id || productsResponse[0].id;
    if (productId) {
      const productDetail = await retry(async () => {
        const response = await axios.get(`${CONFIG.apiBaseUrl}/products/${productId}`, {
          timeout: CONFIG.timeout
        });
        return response.data;
      }, `获取产品详情 (ID: ${productId})`);
      
      log(`成功获取产品详情: ${productDetail.name || productId}`, 'success');
    }
  }
  
  return true;
}

// 验证推荐产品API
async function verifyRecommendedProducts() {
  log('开始验证推荐产品API...');
  
  const response = await retry(async () => {
    return await axios.get(`${CONFIG.apiBaseUrl}/products/recommended`, {
      timeout: CONFIG.timeout,
      params: { limit: 5 }
    });
  }, '获取推荐产品');
  
  log(`成功获取推荐产品，数量: ${response.data.length}`, 'success');
  return true;
}

// 验证用户认证API (不进行实际登录，只检查端点是否可访问)
async function verifyAuthApi() {
  log('开始验证认证API端点...');
  
  // 尝试一个简单的GET请求到认证端点，不应返回404
  const response = await retry(async () => {
    try {
      // 这可能会返回401，但不应返回404
      return await axios.get(`${CONFIG.apiBaseUrl}/auth/me`, {
        timeout: CONFIG.timeout,
        validateStatus: status => status === 401 || status === 200 // 401是可接受的，表示未认证
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return error.response; // 401是预期的，认证端点工作正常
      }
      throw error;
    }
  }, '检查认证API端点');
  
  log(`认证API端点状态: ${response.status} (${response.status === 401 ? '需要认证，端点正常' : '认证状态正常'})`, 'success');
  return true;
}

// 验证前端可用性
async function verifyFrontend() {
  log('开始验证前端可用性...');
  
  const result = await retry(() => {
    return new Promise((resolve, reject) => {
      http.get(CONFIG.frontendUrl, (res) => {
        const statusCode = res.statusCode;
        
        if (statusCode >= 200 && statusCode < 400) {
          resolve({ status: 'ok', statusCode });
        } else {
          reject(new Error(`前端请求失败，状态码: ${statusCode}`));
        }
        
        res.resume(); // 消耗响应数据以释放内存
      }).on('error', (error) => {
        reject(new Error(`前端请求错误: ${error.message}`));
      }).setTimeout(CONFIG.timeout, () => {
        reject(new Error('前端请求超时'));
      });
    });
  }, '前端可用性检查');
  
  log(`前端可用性: ${result.status}, 状态码: ${result.statusCode}`, 'success');
  return true;
}

// 生成验证报告
function generateReport(results) {
  log('生成验证报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      apiBaseUrl: CONFIG.apiBaseUrl,
      frontendUrl: CONFIG.frontendUrl
    },
    results: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length
    }
  };
  
  // 将报告写入文件
  const reportFile = `deployment_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // 打印总结
  console.log('\n====================================');
  console.log('        部署验证报告');
  console.log('====================================');
  console.log(`时间: ${report.timestamp}`);
  console.log(`API基础URL: ${report.environment.apiBaseUrl}`);
  console.log(`前端URL: ${report.environment.frontendUrl}`);
  console.log('\n验证结果:');
  
  report.results.forEach(test => {
    console.log(`- ${test.name}: ${test.status === 'success' ? '✓ 成功' : '✗ 失败'}`);
    if (test.status === 'error') {
      console.log(`  错误: ${test.error}`);
    }
  });
  
  console.log('\n总结:');
  console.log(`- 总测试数: ${report.summary.total}`);
  console.log(`- 通过数: ${report.summary.passed}`);
  console.log(`- 失败数: ${report.summary.failed}`);
  
  const overallStatus = report.summary.failed === 0 ? '成功' : '失败';
  console.log(`\n整体状态: ${overallStatus}`);
  console.log(`\n详细报告已保存至: ${reportFile}`);
  console.log('====================================\n');
  
  return overallStatus === '成功';
}

// 主函数
async function main() {
  log('开始部署验证...');
  const results = [];
  
  try {
    // 验证后端API健康状态
    try {
      await verifyApiHealth();
      results.push({ name: 'API健康检查', status: 'success' });
    } catch (error) {
      results.push({ name: 'API健康检查', status: 'error', error: error.message });
    }
    
    // 验证产品API
    try {
      await verifyProductsApi();
      results.push({ name: '产品API验证', status: 'success' });
    } catch (error) {
      results.push({ name: '产品API验证', status: 'error', error: error.message });
    }
    
    // 验证推荐产品API
    try {
      await verifyRecommendedProducts();
      results.push({ name: '推荐产品API验证', status: 'success' });
    } catch (error) {
      results.push({ name: '推荐产品API验证', status: 'error', error: error.message });
    }
    
    // 验证认证API
    try {
      await verifyAuthApi();
      results.push({ name: '认证API验证', status: 'success' });
    } catch (error) {
      results.push({ name: '认证API验证', status: 'error', error: error.message });
    }
    
    // 验证前端可用性
    try {
      await verifyFrontend();
      results.push({ name: '前端可用性验证', status: 'success' });
    } catch (error) {
      results.push({ name: '前端可用性验证', status: 'error', error: error.message });
    }
    
  } catch (error) {
    log(`验证过程中发生未预期的错误: ${error.message}`, 'error');
  }
  
  // 生成报告并返回结果
  const allPassed = generateReport(results);
  process.exit(allPassed ? 0 : 1);
}

// 运行验证
if (require.main === module) {
  main().catch(error => {
    console.error('验证失败:', error);
    process.exit(1);
  });
}

// 导出函数，以便在其他脚本中使用
module.exports = {
  verifyApiHealth,
  verifyProductsApi,
  verifyRecommendedProducts,
  verifyAuthApi,
  verifyFrontend,
  main
};
