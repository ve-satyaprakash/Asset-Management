const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

function buildPath(id, lookup) {
  const item = lookup[id];
  if (!item) return '';
  if (item.parentId === null || item.parentId === undefined) return item.displayName;
  return `${buildPath(item.parentId, lookup)} >> ${item.displayName}`;
}

function getDescendantIds(id, childrenMap) {
  const result = [];
  const queue = [id];
  while (queue.length) {
    const current = queue.shift();
    const children = childrenMap[current] || [];
    for (const child of children) {
      result.push(child);
      queue.push(child);
    }
  }
  return result;
}

async function buildLookup() {
  const all = await prisma.productType.findMany({ where: { isActive: true } });
  return Object.fromEntries(all.map((r) => [r.id, r]));
}

// GET /api/product-types
async function getProductTypes(req, res, next) {
  try {
    const {
      page = '1',
      pageSize = '10',
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      assetType,
      assetCategory,
      category,
      isActive = 'true',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

    const SORTABLE = ['id', 'displayName', 'displayPluralName', 'apiName', 'apiPluralName', 'category', 'assetType', 'assetCategory', 'description', 'createdAt'];
    const safeSortBy = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where = {
      isActive: isActive === 'true',
      ...(search.trim()
        ? {
            OR: [
              { displayName:       { contains: search, mode: 'insensitive' } },
              { displayPluralName: { contains: search, mode: 'insensitive' } },
              { apiName:           { contains: search, mode: 'insensitive' } },
              { apiPluralName:     { contains: search, mode: 'insensitive' } },
              { category:          { contains: search, mode: 'insensitive' } },
              { assetType:         { contains: search, mode: 'insensitive' } },
              { assetCategory:     { contains: search, mode: 'insensitive' } },
              { description:       { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(assetType     ? { assetType }     : {}),
      ...(assetCategory ? { assetCategory } : {}),
      ...(category      ? { category }      : {}),
    };

    const [total, items] = await Promise.all([
      prisma.productType.count({ where }),
      prisma.productType.findMany({
        where,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    const lookup = await buildLookup();

    const data = items.map((item) => ({
      ...item,
      fullPath: buildPath(item.id, lookup),
    }));

    res.json({
      data,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/product-types/:id
async function getProductType(req, res, next) {
  try {
    const item = await prisma.productType.findUnique({
      where: { id: parseInt(req.params.id, 10) },
    });
    if (!item) return res.status(404).json({ error: 'Not found' });

    const lookup = await buildLookup();
    res.json({ ...item, fullPath: buildPath(item.id, lookup) });
  } catch (err) {
    next(err);
  }
}

// GET /api/product-types/all — lightweight list for parent dropdowns
async function getAllProductTypes(req, res, next) {
  try {
    const items = await prisma.productType.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
    const lookup = Object.fromEntries(items.map((r) => [r.id, r]));
    const data = items.map((item) => ({
      id:          item.id,
      displayName: item.displayName,
      parentId:    item.parentId,
      fullPath:    buildPath(item.id, lookup),
    }));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/product-types
async function createProductType(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const {
      displayName, displayPluralName,
      apiName, apiPluralName,
      category, assetType, assetCategory,
      description, parentId,
    } = req.body;

    const item = await prisma.productType.create({
      data: {
        displayName,
        displayPluralName,
        apiName,
        apiPluralName,
        category,
        assetType,
        assetCategory,
        description: description || null,
        parentId: parentId ? parseInt(parentId, 10) : null,
      },
    });
    const lookup = await buildLookup();
    res.status(201).json({ ...item, fullPath: buildPath(item.id, lookup) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/product-types/:id
async function updateProductType(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const id = parseInt(req.params.id, 10);
    const {
      displayName, displayPluralName,
      apiName, apiPluralName,
      category, assetType, assetCategory,
      description, parentId,
    } = req.body;

    // Guard against circular hierarchy
    if (parentId) {
      const allItems = await prisma.productType.findMany({ where: { isActive: true } });
      const childrenMap = {};
      for (const item of allItems) {
        if (item.parentId) {
          childrenMap[item.parentId] = childrenMap[item.parentId] || [];
          childrenMap[item.parentId].push(item.id);
        }
      }
      const descendants = getDescendantIds(id, childrenMap);
      if (parseInt(parentId, 10) === id || descendants.includes(parseInt(parentId, 10))) {
        return res.status(400).json({ error: 'Cannot set a descendant or self as parent.' });
      }
    }

    const item = await prisma.productType.update({
      where: { id },
      data: {
        displayName,
        displayPluralName,
        apiName,
        apiPluralName,
        category,
        assetType,
        assetCategory,
        description: description || null,
        parentId: parentId ? parseInt(parentId, 10) : null,
      },
    });
    const lookup = await buildLookup();
    res.json({ ...item, fullPath: buildPath(item.id, lookup) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/product-types/:id  (soft delete)
async function deleteProductType(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.productType.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: 'Product type deactivated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProductTypes,
  getProductType,
  getAllProductTypes,
  createProductType,
  updateProductType,
  deleteProductType,
};
