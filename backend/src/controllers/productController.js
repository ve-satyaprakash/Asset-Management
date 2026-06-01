const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// ── Multer config ──────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'products');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF and WebP images are allowed.'));
  },
});

const uploadMiddleware = upload.single('image');

// ── Shared include ─────────────────────────────────────────────────────────
const INCLUDE = {
  productType:  { select: { id: true, displayName: true } },
  manufacturer: { select: { id: true, name: true } },
};

// ── GET /api/products ──────────────────────────────────────────────────────
async function getProducts(req, res, next) {
  try {
    const {
      page = '1', pageSize = '10',
      search = '', sortBy = 'id', sortOrder = 'asc',
      isActive = 'true', manufacturerId, productTypeId,
    } = req.query;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE    = ['id', 'name', 'partNo', 'cost', 'isActive', 'createdAt'];
    const safeSortBy  = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(manufacturerId ? { manufacturerId: parseInt(manufacturerId, 10) } : {}),
      ...(productTypeId  ? { productTypeId:  parseInt(productTypeId, 10)  } : {}),
      ...(search.trim() ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { partNo:      { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where, include: INCLUDE,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({
      data: items,
      pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) },
    });
  } catch (err) { next(err); }
}

// ── GET /api/products/:id ──────────────────────────────────────────────────
async function getProduct(req, res, next) {
  try {
    const item = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: INCLUDE,
    });
    if (!item) return res.status(404).json({ error: 'Product not found.' });
    res.json(item);
  } catch (err) { next(err); }
}

// ── GET /api/products/all ──────────────────────────────────────────────────
async function getAllProducts(req, res, next) {
  try {
    const items = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, productTypeId: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

// ── POST /api/products ─────────────────────────────────────────────────────
async function createProduct(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.product.create({
      data: buildPayload(req.body),
      include: INCLUDE,
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

// ── PUT /api/products/:id ──────────────────────────────────────────────────
async function updateProduct(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.product.update({
      where: { id: parseInt(req.params.id, 10) },
      data:  buildPayload(req.body),
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

// ── POST /api/products/:id/images ─────────────────────────────────────────
async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

    const id      = parseInt(req.params.id, 10);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Product not found.' });
    }

    const current = Array.isArray(product.images) ? product.images : [];
    const updated = [...current, req.file.filename];

    const item = await prisma.product.update({
      where: { id },
      data:  { images: updated },
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

// ── DELETE /api/products/:id/images/:filename ──────────────────────────────
async function deleteImage(req, res, next) {
  try {
    const id       = parseInt(req.params.id, 10);
    const filename = req.params.filename;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const current = Array.isArray(product.images) ? product.images : [];
    const updated = current.filter((f) => f !== filename);

    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const item = await prisma.product.update({
      where: { id },
      data:  { images: updated },
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

// ── DELETE /api/products/:id ───────────────────────────────────────────────
async function deleteProduct(req, res, next) {
  try {
    await prisma.product.update({
      where: { id: parseInt(req.params.id, 10) },
      data:  { isActive: false },
    });
    res.json({ message: 'Product deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body) {
  return {
    name:           body.name?.trim(),
    productTypeId:  parseInt(body.productTypeId, 10),
    manufacturerId: body.manufacturerId ? parseInt(body.manufacturerId, 10) : null,
    partNo:         body.partNo?.trim()      || null,
    cost:           body.cost != null && body.cost !== '' ? parseFloat(body.cost) : null,
    isActive:       body.isActive !== undefined ? Boolean(body.isActive) : true,
    description:    body.description?.trim() || null,
  };
}

module.exports = { getProducts, getProduct, getAllProducts, createProduct, updateProduct, deleteProduct, uploadImage, deleteImage, uploadMiddleware };
