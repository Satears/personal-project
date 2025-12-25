// @desc    健康检查端点
// @route   GET /api/health
// @access  Public
const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  healthCheck
};