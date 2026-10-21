import path from 'path';
import http from 'node:http';
import { defineConfig } from '@lark-apaas/coding-preset-vite-react';
import type { PluginOption, Connect } from 'vite';

function pythonApiProxy(): PluginOption {
  return {
    name: 'python-api-proxy',
    configureServer(server) {
      const basePath = process.env.CLIENT_BASE_PATH || '/';
      const apiPrefix = basePath.endsWith('/')
        ? `${basePath}api`
        : `${basePath}/api`;

      const middleware: Connect.NextHandleFunction = (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith(apiPrefix)) {
          next();
          return;
        }

        const targetPath = url.slice(apiPrefix.length) || '/';
        const targetUrl = `/api${targetPath}`;

        const options: http.RequestOptions = {
          hostname: 'localhost',
          port: 8000,
          path: targetUrl,
          method: req.method,
          headers: {
            ...req.headers,
            host: 'localhost:8000',
          },
        };

        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
          proxyRes.pipe(res);
        });

        proxyReq.on('error', () => {
          res.statusCode = 502;
          res.end('Bad Gateway');
        });

        req.pipe(proxyReq);
      };

      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  plugins: [pythonApiProxy() as PluginOption],
});
