const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  selfHandleResponse: true
});

proxy.on('proxyReq', (proxyReq, req, res) => {
  proxyReq.setHeader('x-foo', 'bar');
  proxyReq.removeHeader('remove-this-header');
});

proxy.on('proxyRes', (proxyRes, req, res) => {
  if (proxyRes.statusCode < 500) {
    proxyRes.pipe(res);
  } else {
    // We would want to intercept and write a generic error message in the event
    // that the downstream service gives an error.  This is a common practice to
    // prevent leaking of code implementation details to the calling client.
    res.status(500).end('Internal Server Error');
  }
});

module.exports = function (target) {
  return function (req, res, next) {
    proxy.web(req, res, {
      target: target
    });
  };
};
