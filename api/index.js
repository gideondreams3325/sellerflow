import app from '../server.js';

export { app };

export default function handler(req, res) {
  try {
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    return app(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: 'SellerFlow is having trouble connecting right now. Please check your connection and try again.',
        code: 'SERVER_ERROR'
      });
    }
  }
}
