import { body, param, query, validationResult } from 'express-validator';

// Validasiya nəticəsini yoxla
export function checkErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'VALIDATION_ERROR',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const validateOwnerLogin = [
  body('username').trim().notEmpty().withMessage('İstifadəçi adı tələb olunur'),
  body('password').notEmpty().withMessage('Şifrə tələb olunur'),
  checkErrors,
];

export const validateEmployeeLogin = [
  body('hrCode').trim().notEmpty().withMessage('HR kodu tələb olunur'),
  body('password').notEmpty().withMessage('Şifrə tələb olunur'),
  checkErrors,
];

// ─── Məhsullar ────────────────────────────────────────────────────────────────
export const validateCreateProduct = [
  body('name').trim().notEmpty().isLength({ max: 120 }).withMessage('Ad tələb olunur (max 120 simvol)'),
  body('base_price').isFloat({ min: 0 }).withMessage('Qiymət 0-dan böyük olmalıdır'),
  body('segment').isIn(['simple', 'fast', 'premium']).withMessage('Seqment: simple, fast və ya premium'),
  body('stock_qty').optional().isInt({ min: 0 }).withMessage('Stok miqdarı 0-dan böyük olmalıdır'),
  body('category_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Kateqoriya ID tam ədəd olmalıdır'),
  body('ingredients').optional().isArray().withMessage('İnqredientlər siyahı olmalıdır'),
  body('ingredients.*.ingredient_id').optional().isInt({ min: 1 }),
  body('ingredients.*.quantity').optional().isFloat({ min: 0 }),
  checkErrors,
];

export const validateUpdateProduct = [
  body('name').optional().trim().notEmpty().isLength({ max: 120 }),
  body('base_price').optional().isFloat({ min: 0 }),
  body('segment').optional().isIn(['simple', 'fast', 'premium']),
  body('stock_qty').optional().isInt({ min: 0 }),
  body('is_available').optional().isBoolean(),
  checkErrors,
];

// ─── Sifarişlər ───────────────────────────────────────────────────────────────
export const validateCreateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Ən az bir məhsul seçilməlidir'),
  body('items.*.productId').isUUID().withMessage('Məhsul ID UUID formatında olmalıdır'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Miqdar ən az 1 olmalıdır'),
  body('sessionId').trim().notEmpty().withMessage('Sessiya ID tələb olunur'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Qeyd max 500 simvol'),
  checkErrors,
];

export const validateConfirmOrder = [
  body('paymentType').isIn(['cash', 'card']).withMessage('Ödəniş növü: cash və ya card'),
  checkErrors,
];

export const validateUpdateStatus = [
  body('status').isIn(['preparing', 'ready', 'completed', 'cancelled']).withMessage('Yanlış status'),
  checkErrors,
];

// ─── Endirimlər ───────────────────────────────────────────────────────────────
export const validateCreateDiscount = [
  body('productId').isUUID().withMessage('Məhsul ID UUID formatında olmalıdır'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Endirim növü: percentage və ya fixed'),
  body('discountValue').isFloat({ min: 0.01, max: 100 }).withMessage('Endirim dəyəri 0.01–100 arasında'),
  body('startsAt').optional().isISO8601().withMessage('Başlanğıc tarix ISO format'),
  body('endsAt').optional({ nullable: true }).isISO8601().withMessage('Bitmə tarixi ISO format'),
  checkErrors,
];

export const validateUpdateDiscount = [
  body('discountType').optional().isIn(['percentage', 'fixed']),
  body('discountValue').optional().isFloat({ min: 0.01, max: 100 }),
  body('isActive').optional().isBoolean(),
  body('endsAt').optional({ nullable: true }).isISO8601(),
  checkErrors,
];

// ─── İşçilər ──────────────────────────────────────────────────────────────────
export const validateCreateEmployee = [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Ad Soyad tələb olunur'),
  body('hrCode').trim().notEmpty().isLength({ min: 3, max: 20 }).matches(/^[A-Z0-9]+$/)
    .withMessage('HR kodu böyük hərf və rəqəmlərdən ibarət olmalıdır (məs. EMP001)'),
  body('password').isLength({ min: 6 }).withMessage('Şifrə ən az 6 simvol'),
  checkErrors,
];

export const validateUpdateEmployee = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('hrCode').optional().trim().isLength({ min: 3, max: 20 }).matches(/^[A-Z0-9]+$/),
  checkErrors,
];

// ─── Stok ─────────────────────────────────────────────────────────────────────
export const validateStockIntake = [
  body('productId').isUUID().withMessage('Məhsul ID UUID formatında olmalıdır'),
  body('quantity').isInt({ min: 1 }).withMessage('Miqdar ən az 1 olmalıdır'),
  body('notes').optional().isLength({ max: 500 }),
  checkErrors,
];

// ─── Redaktə sorğusu ──────────────────────────────────────────────────────────
export const validateEditRequest = [
  body('productId').isUUID().withMessage('Məhsul ID UUID formatında olmalıdır'),
  body('requestedChanges').isObject().withMessage('Dəyişikliklər obekt formatında olmalıdır'),
  body('comment').trim().notEmpty().isLength({ min: 10, max: 500 })
    .withMessage('Şərh ən az 10 simvol (səbəbi izah edin)'),
  checkErrors,
];

// ─── AI Chat ──────────────────────────────────────────────────────────────────
export const validateAiChat = [
  body('messages').isArray({ min: 1 }).withMessage('Mesaj siyahısı boş ola bilməz'),
  body('messages.*.role').isIn(['user', 'assistant']).withMessage('Mesaj rolu user və ya assistant'),
  body('messages.*.content').trim().notEmpty().withMessage('Mesaj mətni boş ola bilməz'),
  checkErrors,
];
