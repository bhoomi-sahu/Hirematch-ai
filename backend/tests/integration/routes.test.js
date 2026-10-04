const request = require('supertest');
const app = require('../../src/app');

describe('Route wiring — GET /api/health', () => {
  test('responds with a status field and JSON content-type', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.data).toHaveProperty('status');
  });
});

describe('Route wiring — unknown routes', () => {
  test('returns 404 for a route that does not exist', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.statusCode).toBe(404);
  });
});

describe('Route wiring — protected routes reject unauthenticated requests', () => {
  test.each([
    ['/api/resumes', 'get'],
    ['/api/applications/candidate', 'get'],
    ['/api/admin/stats', 'get'],
    ['/api/jobs/recruiter/my', 'get'],
  ])('%s (%s) returns 401 without a token', async (path, method) => {
    const res = await request(app)[method](path);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects a malformed/garbage JWT with 401, not a 500 crash', async () => {
    const res = await request(app).get('/api/resumes').set('Authorization', 'Bearer garbage-token-value');
    expect(res.statusCode).toBe(401);
  });
});

describe('Route wiring — public routes are reachable without auth', () => {
  // Note: GET /api/jobs itself queries MongoDB, so it isn't exercised here —
  // this test suite intentionally runs without a live database connection.
  // Job-listing behavior (filters, pagination, match scoring) is covered by
  // the mocked jobService unit tests instead. Here we only confirm the route
  // is public (not blocked by auth) using a route that can't reach Mongo.

  test('GET / (root welcome route) responds without auth', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toMatch(/JoBMatch/i);
  });
});
