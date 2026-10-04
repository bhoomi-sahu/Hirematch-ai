process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/hirematch_ai_test';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.JWT_SECRET = 'test_jwt_secret_do_not_use_in_production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.AI_PROVIDER = 'gemini';
// Left blank on purpose: tests should exercise the deterministic fallback
// path by default. Tests that specifically cover the live-AI path set/mock
// this themselves within that test file.
process.env.AI_API_KEY = '';
process.env.RESUME_MAX_SIZE_MB = '5';
