const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../src/app');

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        host: '127.0.0.1',
        port: server.address().port,
        method,
        path,
        headers: payload
          ? {
              'content-type': 'application/json',
              'content-length': Buffer.byteLength(payload)
            }
          : {}
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('review-service smoke', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  const health = await request(server, 'GET', '/health');
  assert.equal(health.status, 200);
  assert.match(health.body, /"status":"ok"/);

  const createInvalid = await request(server, 'POST', '/reviews', {});
  assert.equal(createInvalid.status, 400);

  const missing = await request(server, 'GET', '/_missing_route_');
  assert.equal(missing.status, 404);
});
