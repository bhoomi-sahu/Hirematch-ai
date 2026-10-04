const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads/resumes');
const MAX_SIZE_MB = parseInt(process.env.RESUME_MAX_SIZE_MB, 10) || 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_ROOT);
  },
  filename: (req, file, cb) => {
    // Never trust the original filename. Generate our own, keep only a safe extension.
    const safeExt = '.pdf';
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

const ALLOWED_PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/octet-stream',
  'application/x-pdf',
  'binary/octet-stream',
  'application/x-binary',
]);

const fileFilter = (req, file, cb) => {
  const mimeType = (file.mimetype || '').toLowerCase();
  const fileExt = path.extname(file.originalname || '').toLowerCase();
  const isPdfMime = mimeType === '' ? false : ALLOWED_PDF_MIME_TYPES.has(mimeType);
  const isPdfExt = fileExt === '.pdf';

  if ((!isPdfMime && !isPdfExt) || (mimeType && !isPdfMime && !isPdfExt)) {
    return cb(ApiError.badRequest('Only PDF files are allowed for resume uploads'), false);
  }

  cb(null, true);
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 20,
  },
});

// Wrap multer errors into our ApiError format so the centralized error handler renders them nicely
const wrapMulter = (handler) => (req, res, next) => {
  handler(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest(`File exceeds the maximum allowed size of ${MAX_SIZE_MB}MB`));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(ApiError.badRequest('You can upload a maximum of 20 resumes at once'));
        }
        return next(ApiError.badRequest(err.message));
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  fileFilter,
  uploadSingleResume: wrapMulter(multerInstance.single('resume')),
  uploadManyResumes: wrapMulter(multerInstance.array('resumes', 20)),
  UPLOAD_ROOT,
  MAX_SIZE_MB,
};
