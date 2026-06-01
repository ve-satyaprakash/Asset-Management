const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// GET /api/assets
async function getAssets(req, res, next) {
  try {
    const {
      page = '1', pageSize = '10',
      search = '', sortBy = 'id', sortOrder = 'asc',
      productTypeId, assetState, isActive = 'true',
    } = req.query;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE    = ['id', 'name', 'product', 'user', 'department', 'assetState', 'location', 'createdAt'];
    const safeSortBy  = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(productTypeId ? { productTypeId: parseInt(productTypeId, 10) } : {}),
      ...(assetState    ? { assetState } : {}),
      ...(search.trim() ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { product:     { contains: search, mode: 'insensitive' } },
          { user:        { contains: search, mode: 'insensitive' } },
          { department:  { contains: search, mode: 'insensitive' } },
          { assetState:  { contains: search, mode: 'insensitive' } },
          { location:    { contains: search, mode: 'insensitive' } },
          { vendor:      { contains: search, mode: 'insensitive' } },
          { assetTag:    { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        include: { productType: { select: { displayName: true, id: true } } },
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

// GET /api/assets/:id
async function getAsset(req, res, next) {
  try {
    const item = await prisma.asset.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: { productType: { select: { displayName: true, id: true } } },
    });
    if (!item) return res.status(404).json({ error: 'Asset not found.' });
    res.json(item);
  } catch (err) { next(err); }
}

// POST /api/assets
async function createAsset(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.asset.create({ data: buildPayload(req.body) });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

// PUT /api/assets/:id
async function updateAsset(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.asset.update({
      where: { id: parseInt(req.params.id, 10) },
      data: buildPayload(req.body),
      include: { productType: { select: { displayName: true, id: true } } },
    });
    res.json(item);
  } catch (err) { next(err); }
}

// DELETE /api/assets/:id  (soft delete)
async function deleteAsset(req, res, next) {
  try {
    await prisma.asset.update({
      where: { id: parseInt(req.params.id, 10) },
      data: { isActive: false },
    });
    res.json({ message: 'Asset deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body) {
  const toDate = (v) => (v ? new Date(v) : null);
  return {
    productTypeId:      parseInt(body.productTypeId, 10),
    name:               body.name?.trim(),
    assetTag:           body.assetTag?.trim()           || null,
    orgSerialNumber:    body.orgSerialNumber?.trim()    || null,
    description:        body.description?.trim()        || null,
    partNumber:         body.partNumber?.trim()         || null,
    product:            body.product?.trim()            || null,
    vendor:             body.vendor?.trim()             || null,
    barcode:            body.barcode?.trim()            || null,
    manufacturer:       body.manufacturer?.trim()       || null,
    assetState:         body.assetState?.trim()         || null,
    user:               body.user?.trim()               || null,
    department:         body.department?.trim()         || null,
    associatedToAssets: body.associatedToAssets?.trim() || null,
    site:               body.site?.trim()               || null,
    region:             body.region?.trim()             || null,
    location:           body.location?.trim()           || null,
    isLoanable:         Boolean(body.isLoanable),
    loanStart:          toDate(body.loanStart),
    loanEnd:            toDate(body.loanEnd),
    acquisitionDate:    toDate(body.acquisitionDate),
    expiryDate:         toDate(body.expiryDate),
    purchaseCost:       body.purchaseCost ? parseFloat(body.purchaseCost) : null,
    warrantyExpiryDate: toDate(body.warrantyExpiryDate),
    purchaseOrder:      body.purchaseOrder?.trim()      || null,
    purchaseOrderNo:    body.purchaseOrderNo?.trim()    || null,
    lastScanStatus:     body.lastScanStatus?.trim()     || null,
    lastScanTime:       toDate(body.lastScanTime),
    scanState:          body.scanState?.trim()          || null,
    stateComments:      body.stateComments?.trim()      || null,
    macAddress:         body.macAddress?.trim()          || null,
    serviceTag:         body.serviceTag?.trim()          || null,
    domain:             body.domain?.trim()              || null,
    smbiosVersion:      body.smbiosVersion?.trim()       || null,
    biosVersion:        body.biosVersion?.trim()         || null,
    biosManufacturer:   body.biosManufacturer?.trim()    || null,
    biosDate:           body.biosDate?.trim()            || null,
    osName:             body.osName?.trim()              || null,
    osVersion:          body.osVersion?.trim()           || null,
    osBuildNumber:      body.osBuildNumber?.trim()       || null,
    osServicePack:      body.osServicePack?.trim()       || null,
    osProductId:        body.osProductId?.trim()         || null,
    ram:                body.ram?.trim()                 || null,
    virtualMemory:      body.virtualMemory?.trim()       || null,
    physicalMemory:     body.physicalMemory?.trim()      || null,
    processors:         Array.isArray(body.processors) ? body.processors : [],
  };
}

module.exports = { getAssets, getAsset, createAsset, updateAsset, deleteAsset };
