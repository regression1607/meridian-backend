// Minimal Vercel test - no external requires
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Vercel serverless is working!',
    path: req.url,
    method: req.method,
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
};
