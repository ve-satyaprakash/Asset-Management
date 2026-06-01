const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

async function getVendors(req, res, next) {
  try {
    const {
      page = '1', pageSize = '10',
      search = '', sortBy = 'id', sortOrder = 'asc',
      isActive = 'true', currency, contactPerson,
    } = req.query;

    const pageNum      = Math.max(1, parseInt(page, 10));
    const pageSizeNum  = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE     = ['id', 'name', 'currency', 'contactPerson', 'email', 'phone', 'isActive', 'createdAt'];
    const safeSortBy   = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(currency      ? { currency:      { contains: currency,      mode: 'insensitive' } } : {}),
      ...(contactPerson ? { contactPerson: { contains: contactPerson, mode: 'insensitive' } } : {}),
      ...(search.trim() ? {
        OR: [
          { name:          { contains: search, mode: 'insensitive' } },
          { currency:      { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { email:         { contains: search, mode: 'insensitive' } },
          { phone:         { contains: search, mode: 'insensitive' } },
          { website:       { contains: search, mode: 'insensitive' } },
          { description:   { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

async function getVendor(req, res, next) {
  try {
    const item = await prisma.vendor.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (!item) return res.status(404).json({ error: 'Vendor not found.' });
    res.json(item);
  } catch (err) { next(err); }
}

async function getAllVendors(req, res, next) {
  try {
    const items = await prisma.vendor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

async function createVendor(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.vendor.create({ data: buildPayload(req.body) });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function updateVendor(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.vendor.update({
      where: { id: parseInt(req.params.id, 10) },
      data: buildPayload(req.body),
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function deleteVendor(req, res, next) {
  try {
    await prisma.vendor.update({ where: { id: parseInt(req.params.id, 10) }, data: { isActive: false } });
    res.json({ message: 'Vendor deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body) {
  return {
    name:          body.name?.trim(),
    currency:      body.currency?.trim()      || null,
    contactPerson: body.contactPerson?.trim() || null,
    email:         body.email?.trim()         || null,
    phone:         body.phone?.trim()         || null,
    fax:           body.fax?.trim()           || null,
    website:       body.website?.trim()       || null,
    isActive:      body.isActive !== undefined ? Boolean(body.isActive) : true,
    description:   body.description?.trim()   || null,
    doorNumber:    body.doorNumber?.trim()    || null,
    street:        body.street?.trim()        || null,
    landmark:      body.landmark?.trim()      || null,
    city:          body.city?.trim()          || null,
    state:         body.state?.trim()         || null,
    postalCode:    body.postalCode?.trim()    || null,
    country:       body.country?.trim()       || null,
  };
}

module.exports = { getVendors, getVendor, getAllVendors, createVendor, updateVendor, deleteVendor };
