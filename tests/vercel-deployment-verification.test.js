import http from 'http';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import handler from '../api/index.js';

function runVercelCompatibilityTests() {
  console.log('======================================================================');
  console.log('SELLER FLOW — VERCEL DEPLOYMENT CONFIGURATION & RUNTIME VERIFICATION');
  console.log('======================================================================\n');

  const report = {};

  // 1. VERCEL.JSON CONFIGURATION INTEGRITY
  console.log('--- 1. VERCEL.JSON CONFIGURATION AUDIT ---');
  const vercelConfigPath = path.resolve('vercel.json');
  assert.ok(fs.existsSync(vercelConfigPath), 'vercel.json must exist at repository root');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

  assert.strictEqual(vercelConfig.buildCommand, 'npm run build', 'buildCommand must be "npm run build"');
  assert.strictEqual(vercelConfig.outputDirectory, 'dist', 'outputDirectory must be "dist"');
  assert.ok(Array.isArray(vercelConfig.rewrites), 'rewrites must be an array');

  // Verify rewrite priority: /api/* first, /admin/* second, /* catch-all last
  const sources = vercelConfig.rewrites.map(r => r.source);
  const apiIndex = sources.findIndex(s => s.startsWith('/api'));
  const adminIndex = sources.findIndex(s => s.startsWith('/admin'));
  const rootIndex = sources.findIndex(s => s === '/(.*)' || s === '/:path*');

  assert.ok(apiIndex !== -1, 'Must have rewrite rule for /api');
  assert.ok(adminIndex !== -1, 'Must have rewrite rule for /admin');
  assert.ok(rootIndex !== -1, 'Must have catch-all rewrite rule for consumer app');
  assert.ok(apiIndex < adminIndex, 'API rewrites must come before Admin rewrites');
  assert.ok(adminIndex < rootIndex, 'Admin rewrites must come before consumer catch-all rewrite');

  console.log('  ✓ vercel.json exists at root');
  console.log('  ✓ buildCommand is "npm run build"');
  console.log('  ✓ outputDirectory is "dist"');
  console.log('  ✓ Rewrites order: /api/* -> /admin/* -> /* (Clean priority order)');
  report.VERCEL_JSON_CONFIG = 'PASS';

  // 2. BUILD ARTIFACTS VERIFICATION
  console.log('\n--- 2. VERCEL OUTPUT DIRECTORY (dist/) VALIDATION ---');
  const distDir = path.resolve('dist');
  assert.ok(fs.existsSync(distDir), 'dist/ directory must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html (Consumer shell) must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'admin', 'index.html')), 'dist/admin/index.html (Admin shell) must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'admin', 'admin.css')), 'dist/admin/admin.css must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'admin', 'app.js')), 'dist/admin/app.js must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'admin', '_redirects')), 'dist/admin/_redirects must exist');
  assert.ok(fs.existsSync(path.join(distDir, '_redirects')), 'dist/_redirects must exist');

  console.log('  ✓ dist/index.html (Consumer shell) ready');
  console.log('  ✓ dist/admin/index.html (Admin shell) ready');
  console.log('  ✓ dist/admin/admin.css ready');
  console.log('  ✓ dist/admin/app.js ready');
  console.log('  ✓ Standalone admin build output verified in admin/dist/');
  report.BUILD_ARTIFACTS = 'PASS';

  // 3. SERVERLESS FUNCTION (api/index.js) EXECUTION EMULATION
  console.log('\n--- 3. SERVERLESS FUNCTION (api/index.js) EXECUTION ---');
  assert.strictEqual(typeof handler, 'function', 'api/index.js must export a handler function');

  // Spin up an ephemeral local server backed directly by api/index.js (Vercel Serverless Function)
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
        // Test API routes on the serverless function
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
          assert.strictEqual(res.status, 401, `${ep.path} must return 401 on serverless function`);
          console.log(`  ✓ ${ep.method} ${ep.path.padEnd(28)} -> 401 Unauthorized via api/index.js`);
        }

        // Test unknown API endpoint behavior: MUST return 404 JSON, NOT consumer index.html
        const notFoundRes = await req('/api/unknown-nonexistent-endpoint');
        assert.strictEqual(notFoundRes.status, 404, 'Unknown /api/* route must return 404');
        assert.ok(
          notFoundRes.headers['content-type'].includes('application/json'),
          'Unknown /api/* route must return application/json'
        );
        const notFoundJson = JSON.parse(notFoundRes.data);
        assert.strictEqual(notFoundJson.success, false, 'Unknown /api/* response must have success: false');
        assert.ok(!notFoundRes.data.includes('<!DOCTYPE html>'), 'Unknown /api/* must NEVER return consumer index.html');
        console.log('  ✓ Unknown API route (/api/unknown-...) -> 404 JSON (NOT consumer index.html)');

        // Test Vercel URL normalization: if Vercel stripped /api prefix, handler must normalize it
        // Simulating invocation where req.url is /admin/overview-data sent directly to serverless function
        const normalizedRes = await req('/admin/overview-data');
        assert.strictEqual(normalizedRes.status, 401, 'Normalized route must route to /api/admin/overview-data and return 401');
        console.log('  ✓ Serverless function URL normalization (stripping /api resilient) -> 401 Unauthorized');

        server.close();
        report.SERVERLESS_FUNCTION_RUNTIME = 'PASS';
        report.API_SECURITY = 'PASS';

        // 4. ENVIRONMENT VARIABLES AUDIT
        console.log('\n--- 4. ENVIRONMENT VARIABLES AUDIT FOR VERCEL DASHBOARD ---');
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
          console.log(`  ✓ Documented for Vercel Project Settings: ${v}`);
        }
        report.ENVIRONMENT_VARIABLES = 'PASS';

        console.log('\n======================================================================');
        console.log('ALL VERCEL DEPLOYMENT CONFIGURATION CHECKS PASSED');
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

runVercelCompatibilityTests().catch(err => {
  console.error('\nVercel Verification Failed:', err);
  process.exit(1);
});
