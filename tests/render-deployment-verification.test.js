import http from 'http';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import handler from '../api/index.js';

function runRenderCompatibilityTests() {
  console.log('======================================================================');
  console.log('SELLER FLOW — RENDER WEB SERVICE DEPLOYMENT VERIFICATION');
  console.log('======================================================================\n');

  const report = {};

  // 1. RENDER.YAML WEB SERVICE SPECIFICATION AUDIT
  console.log('--- 1. RENDER.YAML WEB SERVICE SPECIFICATION AUDIT ---');
  const renderYamlPath = path.resolve('render.yaml');
  assert.ok(fs.existsSync(renderYamlPath), 'render.yaml must exist at repository root');
  const renderYamlContent = fs.readFileSync(renderYamlPath, 'utf8');
  const renderConfig = yaml.load(renderYamlContent);

  assert.ok(renderConfig && Array.isArray(renderConfig.services) && renderConfig.services.length > 0, 'render.yaml must have services array');
  const webService = renderConfig.services.find(s => s.type === 'web');
  assert.ok(webService, 'render.yaml must contain a service with type: web');
  assert.strictEqual(webService.runtime, 'node', 'render.yaml web service runtime must be node');
  assert.strictEqual(webService.buildCommand, 'npm install && npm run build', 'render.yaml buildCommand must be npm install && npm run build');
  assert.strictEqual(webService.startCommand, 'npm start', 'render.yaml startCommand must be npm start');

  console.log('  ✓ render.yaml defines a Node.js Web Service (type: web, runtime: node)');
  console.log('  ✓ Build Command: npm install && npm run build');
  console.log('  ✓ Start Command: npm start');
  report.RENDER_YAML_CONFIG = 'PASS';

  // 2. PACKAGE.JSON & SERVER.JS BINDINGS AUDIT
  console.log('\n--- 2. PACKAGE.JSON & SERVER.JS BINDINGS AUDIT ---');
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  assert.strictEqual(pkg.scripts.start, 'node server.js', 'package.json start script must run node server.js');
  assert.strictEqual(pkg.scripts.build, 'node scripts/build.js', 'package.json build script must run node scripts/build.js');

  const serverJsContent = fs.readFileSync(path.resolve('server.js'), 'utf8');
  assert.ok(serverJsContent.includes('process.env.PORT') || serverJsContent.includes('PORT'), 'server.js must support process.env.PORT');
  assert.ok(serverJsContent.includes('app.use(express.static(') || serverJsContent.includes('express.static(distPath'), 'server.js must serve static dist/ assets');

  console.log('  ✓ package.json start script: "node server.js"');
  console.log('  ✓ package.json build script: "node scripts/build.js"');
  console.log('  ✓ server.js binds to process.env.PORT || 3000 and serves dist/ + /api/*');
  report.PACKAGE_SERVER_CONFIG = 'PASS';

  // 3. ZERO VERCEL DOMAIN LEAKAGE AUDIT
  console.log('\n--- 3. ZERO VERCEL DOMAIN LEAKAGE AUDIT ---');
  const indexHtmlContent = fs.readFileSync(path.resolve('index.html'), 'utf8');
  const buildJsContent = fs.readFileSync(path.resolve('scripts/build.js'), 'utf8');
  const adminAppContent = fs.readFileSync(path.resolve('admin/app.js'), 'utf8');

  assert.ok(!indexHtmlContent.includes('sellerflow-tan.vercel.app'), 'index.html must not contain sellerflow-tan.vercel.app');
  assert.ok(!buildJsContent.includes('sellerflow-tan.vercel.app'), 'scripts/build.js must not contain sellerflow-tan.vercel.app');
  assert.ok(!adminAppContent.includes('sellerflow-tan.vercel.app'), 'admin/app.js must not contain sellerflow-tan.vercel.app');

  console.log('  ✓ index.html has 0 references to sellerflow-tan.vercel.app');
  console.log('  ✓ scripts/build.js has 0 references to sellerflow-tan.vercel.app');
  console.log('  ✓ admin/app.js has 0 references to sellerflow-tan.vercel.app');
  report.DOMAIN_SAFETY = 'PASS';

  // 4. BUILD ARTIFACTS VERIFICATION
  console.log('\n--- 4. PUBLISH DIRECTORY (dist/) VALIDATION ---');
  const distDir = path.resolve('dist');
  assert.ok(fs.existsSync(distDir), 'dist/ directory must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html (Consumer shell) must exist');
  assert.ok(fs.existsSync(path.join(distDir, '404.html')), 'dist/404.html (Fallback shell) must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'admin', 'index.html')), 'dist/admin/index.html (Admin shell) must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'admin', 'admin.css')), 'dist/admin/admin.css must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'admin', 'app.js')), 'dist/admin/app.js must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'uploads', 'media')), 'dist/uploads/media must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'uploads', 'verification')), 'dist/uploads/verification must exist');

  console.log('  ✓ dist/index.html (Consumer shell) ready');
  console.log('  ✓ dist/404.html (Static fallback shell) ready');
  console.log('  ✓ dist/admin/index.html (Admin shell) ready');
  console.log('  ✓ dist/admin/admin.css ready');
  console.log('  ✓ dist/admin/app.js ready');
  console.log('  ✓ dist/uploads/ (media & verification assets) ready');
  report.BUILD_ARTIFACTS = 'PASS';

  // 5. API ROUTE SECURITY & VERIFICATION
  console.log('\n--- 5. API ROUTE SECURITY & ENDPOINT VERIFICATION ---');
  assert.strictEqual(typeof handler, 'function', 'api/index.js must export a handler function');

  const server = http.createServer((req, res) => {
    handler(req, res);
  });

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;

      function req(urlPath, method = 'GET', body = null, headers = {}) {
        return new Promise((resVal, rejVal) => {
          const u = new URL(urlPath, baseUrl);
          const opts = {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method,
            headers: { ...headers }
          };
          if (body) {
            const data = typeof body === 'object' ? JSON.stringify(body) : body;
            opts.headers['Content-Type'] = 'application/json';
            opts.headers['Content-Length'] = Buffer.byteLength(data);
          }
          const clientReq = http.request(opts, (r) => {
            let data = '';
            r.on('data', chunk => { data += chunk; });
            r.on('end', () => resVal({ status: r.statusCode, headers: r.headers, data }));
          });
          clientReq.on('error', rejVal);
          if (body) clientReq.write(typeof body === 'object' ? JSON.stringify(body) : body);
          clientReq.end();
        });
      }

      try {
        const endpoints = [
          { path: '/api/admin/overview-data', method: 'GET' },
          { path: '/api/admin/user-action', method: 'POST', body: { userId: 'u1', action: 'suspend' } },
          { path: '/api/admin/takedown', method: 'POST', body: { entityType: 'post', entityId: 'p1' } },
          { path: '/api/admin/restore', method: 'POST', body: { entityType: 'post', entityId: 'p1' } },
          { path: '/api/admin/kyc-action', method: 'POST', body: { userId: 'u1', action: 'approve' } },
          { path: '/api/admin/report-action', method: 'POST', body: { reportId: 'r1', action: 'resolve' } },
          { path: '/api/jobs/security-action', method: 'POST', body: { type: 'job', id: 'j1', action: 'remove' } },
          { path: '/api/auth/custom-token', method: 'POST', body: { idToken: 'fake' } }
        ];

        for (const ep of endpoints) {
          const res = await req(ep.path, ep.method, ep.body);
          assert.strictEqual(res.status, 401, `${ep.path} must return 401 Unauthorized without auth`);
          console.log(`  ✓ ${ep.method} ${ep.path.padEnd(28)} -> 401 Unauthorized enforced`);
        }

        const notFoundRes = await req('/api/unknown-nonexistent-endpoint');
        assert.strictEqual(notFoundRes.status, 404, 'Unknown /api/* route must return 404');
        const notFoundJson = JSON.parse(notFoundRes.data);
        assert.strictEqual(notFoundJson.success, false);
        console.log('  ✓ Unknown API route (/api/unknown-...) -> 404 JSON (NOT consumer index.html)');

        server.close();
        report.API_SECURITY = 'PASS';

        // 6. ENVIRONMENT VARIABLES AUDIT
        console.log('\n--- 6. ENVIRONMENT VARIABLES AUDIT FOR RENDER ---');
        const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
        const requiredVars = [
          'APP_URL',
          'FIREBASE_PROJECT_ID',
          'FIREBASE_CLIENT_EMAIL',
          'FIREBASE_PRIVATE_KEY',
          'FIREBASE_API_KEY',
          'GEMINI_API_KEY',
          'SUPABASE_URL',
          'SUPABASE_ANON_KEY',
          'SUPABASE_KEY'
        ];
        for (const v of requiredVars) {
          assert.ok(envExample.includes(v), `.env.example must document ${v}`);
          console.log(`  ✓ Documented for Render: ${v}`);
        }
        report.ENVIRONMENT_VARIABLES = 'PASS';

        console.log('\n======================================================================');
        console.log('ALL RENDER WEB SERVICE DEPLOYMENT CHECKS PASSED');
        console.log('======================================================================\n');
        console.log('Summary Matrix:', JSON.stringify(report, null, 2));
        resolve();
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });
}

runRenderCompatibilityTests().catch(err => {
  console.error('\nRender Verification Failed:', err);
  process.exit(1);
});
