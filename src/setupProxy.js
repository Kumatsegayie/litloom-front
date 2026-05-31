const { createProxyMiddleware } = require('http-proxy-middleware');

// Proxy API and uploads to Strapi during development.
// Set REACT_APP_STRAPI_URL in frontend/.env (e.g. http://localhost:1337)
function normalizeTarget(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) return 'http://localhost:1337';

  try {
    const parsed = new URL(raw);
    let pathname = String(parsed.pathname || '').replace(/\/+$/, '');
    if (/^\/(api|admin)$/i.test(pathname)) {
      pathname = '';
    }
    return `${parsed.origin}${pathname}`;
  } catch {
    return raw.replace(/\/(api|admin)\/?$/i, '');
  }
}

const target = normalizeTarget(process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      logLevel: 'warn'
    })
  );

  app.use(
    '/uploads',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      logLevel: 'warn'
    })
  );
};
