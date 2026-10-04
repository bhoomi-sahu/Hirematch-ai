const { fileFilter } = require('../../src/middleware/upload.middleware');
const ApiError = require('../../src/utils/ApiError');

describe('upload middleware PDF validation', () => {
  test('accepts PDFs when the browser reports application/octet-stream but the file extension is .pdf', () => {
    const file = {
      originalname: 'resume.pdf',
      mimetype: 'application/octet-stream',
    };

    const cb = jest.fn();
    fileFilter({}, file, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('accepts PDFs when the MIME type is missing but the file extension is .pdf', () => {
    const file = {
      originalname: 'resume.pdf',
      mimetype: '',
    };

    const cb = jest.fn();
    fileFilter({}, file, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('rejects non-PDF files', () => {
    const file = {
      originalname: 'notes.txt',
      mimetype: 'text/plain',
    };

    const cb = jest.fn();
    fileFilter({}, file, cb);

    expect(cb.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(cb.mock.calls[0][0].statusCode).toBe(400);
    expect(cb.mock.calls[0][1]).toBe(false);
  });
});
