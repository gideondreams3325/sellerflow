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
        error: 'Unable to process request right now. Please try again later.',
        code: 'SERVER_ERROR'
      });
    }
  }
}
