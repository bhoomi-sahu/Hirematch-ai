const jwt = require('jsonwebtoken');

jest.mock('../../src/models', () => ({
  User: { findById: jest.fn() },
}));

const { User } = require('../../src/models');
const { protect, authorize, optionalProtect } = require('../../src/middleware/auth.middleware');

const JWT_SECRET = 'test_jwt_secret_do_not_use_in_production'; // matches tests/setup.js

const buildReq = (headers = {}) => ({ headers });
const buildRes = () => ({});

describe('auth.middleware protect()', () => {
  test('rejects a request with no Authorization header', async () => {
    const req = buildReq();
    const next = jest.fn();
    await protect(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('rejects a malformed Authorization header (missing "Bearer")', async () => {
    const req = buildReq({ authorization: 'sometoken' });
    const next = jest.fn();
    await protect(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('rejects an invalid/garbage token', async () => {
    const req = buildReq({ authorization: 'Bearer not-a-real-token' });
    const next = jest.fn();
    await protect(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('rejects an expired token', async () => {
    const expiredToken = jwt.sign({ id: 'u1', role: 'candidate' }, JWT_SECRET, { expiresIn: -10 });
    const req = buildReq({ authorization: `Bearer ${expiredToken}` });
    const next = jest.fn();
    await protect(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: expect.stringContaining('expired') }));
  });

  test('rejects a valid token whose user no longer exists', async () => {
    const token = jwt.sign({ id: 'ghost-user' }, JWT_SECRET, { expiresIn: '1h' });
    User.findById.mockResolvedValue(null);
    const req = buildReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();
    await protect(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('rejects a valid token for a suspended user', async () => {
    const token = jwt.sign({ id: 'u1' }, JWT_SECRET, { expiresIn: '1h' });
    User.findById.mockResolvedValue({ _id: 'u1', role: 'candidate', isActive: false });
    const req = buildReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();
    await protect(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  test('attaches req.user and calls next() with no error for a valid token', async () => {
    const token = jwt.sign({ id: 'u1' }, JWT_SECRET, { expiresIn: '1h' });
    const fakeUser = { _id: 'u1', role: 'candidate', isActive: true };
    User.findById.mockResolvedValue(fakeUser);
    const req = buildReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();
    await protect(req, buildRes(), next);
    expect(req.user).toEqual(fakeUser);
    expect(next).toHaveBeenCalledWith(); // called with no arguments = success
  });
});

describe('auth.middleware optionalProtect()', () => {
  test('proceeds without a user when no token is present', async () => {
    const req = buildReq();
    const next = jest.fn();
    await optionalProtect(req, buildRes(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  test('proceeds without a user (and without error) for an invalid token', async () => {
    const req = buildReq({ authorization: 'Bearer garbage' });
    const next = jest.fn();
    await optionalProtect(req, buildRes(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  test('attaches req.user for a valid token', async () => {
    const token = jwt.sign({ id: 'u1' }, JWT_SECRET, { expiresIn: '1h' });
    const fakeUser = { _id: 'u1', role: 'recruiter' };
    User.findById.mockResolvedValue(fakeUser);
    const req = buildReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();
    await optionalProtect(req, buildRes(), next);
    expect(req.user).toEqual(fakeUser);
  });
});

describe('auth.middleware authorize() — role-based access control', () => {
  test('rejects when no req.user is present at all', () => {
    const middleware = authorize('admin');
    const req = {};
    const next = jest.fn();
    middleware(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('blocks a candidate from accessing a recruiter-only route', () => {
    const middleware = authorize('recruiter');
    const req = { user: { role: 'candidate' } };
    const next = jest.fn();
    middleware(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  test('blocks a recruiter from accessing an admin-only route', () => {
    const middleware = authorize('admin');
    const req = { user: { role: 'recruiter' } };
    const next = jest.fn();
    middleware(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  test('allows access when the role matches', () => {
    const middleware = authorize('candidate');
    const req = { user: { role: 'candidate' } };
    const next = jest.fn();
    middleware(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('allows access when multiple roles are permitted and one matches', () => {
    const middleware = authorize('recruiter', 'admin');
    const req = { user: { role: 'admin' } };
    const next = jest.fn();
    middleware(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});
