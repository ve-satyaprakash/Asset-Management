const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

async function getSoftwareLicenseTypes(req, res, next) {
  try {
    const {
      page = '1', pageSize = '10',
      search = '', sortBy = 'id', sortOrder = 'asc',
      isActive = 'true',
    } = req.query;

    const pageNum      = Math.max(1, parseInt(page, 10));
    const pageSizeNum  = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE     = ['id', 'name', 'trackBy', 'isPerpetual', 'isFreeLicense', 'isActive', 'createdAt'];
    const safeSortBy   = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(search.trim() ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.softwareLicenseType.count({ where }),
      prisma.softwareLicenseType.findMany({
        where,
        include: { manufacturer: { select: { id: true, name: true } } },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

async function getSoftwareLicenseType(req, res, next) {
  try {
    const item = await prisma.softwareLicenseType.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: { manufacturer: { select: { id: true, name: true } } },
    });
    if (!item) return res.status(404).json({ error: 'Software License Type not found.' });
    res.json(item);
  } catch (err) { next(err); }
}

async function getAllSoftwareLicenseTypes(req, res, next) {
  try {
    const items = await prisma.softwareLicenseType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

async function createSoftwareLicenseType(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.softwareLicenseType.create({
      data: buildPayload(req.body),
      include: { manufacturer: { select: { id: true, name: true } } },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function updateSoftwareLicenseType(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.softwareLicenseType.update({
      where: { id: parseInt(req.params.id, 10) },
      data: buildPayload(req.body),
      include: { manufacturer: { select: { id: true, name: true } } },
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function deleteSoftwareLicenseType(req, res, next) {
  try {
    await prisma.softwareLicenseType.update({ where: { id: parseInt(req.params.id, 10) }, data: { isActive: false } });
    res.json({ message: 'Software License Type deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body) {
  return {
    name:                 body.name?.trim(),
    manufacturerId:       body.manufacturerId ? parseInt(body.manufacturerId, 10) : null,
    trackBy:              body.trackBy?.trim()              || null,
    installationsAllowed: body.installationsAllowed?.trim() || null,
    isPerpetual:          Boolean(body.isPerpetual),
    isFreeLicense:        Boolean(body.isFreeLicense),
    licenseOption:        body.licenseOption?.trim()        || null,
    description:          body.description?.trim()          || null,
    isActive:             body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}

module.exports = { getSoftwareLicenseTypes, getSoftwareLicenseType, getAllSoftwareLicenseTypes, createSoftwareLicenseType, updateSoftwareLicenseType, deleteSoftwareLicenseType };
