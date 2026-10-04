const { validateRegister } = require('../../src/validators/auth.validator');
const ApiError = require('../../src/utils/ApiError');

describe('auth validator registration rules', () => {
  test('candidate registration succeeds with the basic payload', () => {
    const req = {
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secret123',
        role: 'candidate',
      },
    };

    const next = jest.fn();
    validateRegister(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  test('recruiter registration requires a company name', () => {
    const req = {
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secret123',
        role: 'recruiter',
      },
    };

    const next = jest.fn();
    validateRegister(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/company name/i);
  });

  test('admin registration requires the admin access code', () => {
    const req = {
      body: {
        name: 'Super Admin',
        email: 'admin@example.com',
        password: 'secret123',
        role: 'admin',
      },
    };

    const next = jest.fn();
    validateRegister(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/admin access code/i);
  });
});
