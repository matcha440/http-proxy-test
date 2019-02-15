const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  selfHandleResponse: true
});

proxy.on('proxyReq', (proxyReq, req, res) => {
  proxyReq.setHeader('x-foo', 'bar');
  proxyReq.removeHeader('remove-this-header');
});

proxy.on('proxyRes', (proxyRes, req, res) => {
  proxyRes.pipe(res);
});

module.exports = function (target) {
  return function (req, res, next) {
    proxy.web(req, res, {
      target: target
    });
  };
};
