// HTTP xəta sinifi
export class HttpError extends Error {
  constructor(status, code, details = null) {
    super(code);
    this.status  = status;
    this.code    = code;
    this.details = details;
  }
}

// Async controller-lar üçün wrapper
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Global error handler
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error:   err.code,
      details: err.details ?? undefined,
    });
  }

  // Bilinən PostgreSQL xətaları
  if (err.code === '23505') {
    return res.status(409).json({ error: 'DUPLICATE_ENTRY' });
  }
  if (err.code === '23503') {
    return res.status(422).json({ error: 'REFERENCE_NOT_FOUND' });
  }

  console.error('Server xətası:', err);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
}
