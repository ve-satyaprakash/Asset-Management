const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

async function getManufacturers(req, res, next) {
  try {
    const {
      page = '1', pageSize = '10',
      search = '', sortBy = 'id', sortOrder = 'asc',
      isActive = 'true',
    } = req.query;

    const pageNum      = Math.max(1, parseInt(page, 10));
    const pageSizeNum  = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE     = ['id', 'name', 'isActive', 'createdAt'];
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
      prisma.manufacturer.count({ where }),
      prisma.manufacturer.findMany({
        where,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

async function getManufacturer(req, res, next) {
  try {
    const item = await prisma.manufacturer.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (!item) return res.status(404).json({ error: 'Manufacturer not found.' });
    res.json(item);
  } catch (err) { next(err); }
}

async function getAllManufacturers(req, res, next) {
  try {
    const items = await prisma.manufacturer.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

async function createManufacturer(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.manufacturer.create({ data: buildPayload(req.body) });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function updateManufacturer(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const item = await prisma.manufacturer.update({
      where: { id: parseInt(req.params.id, 10) },
      data: buildPayload(req.body),
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function deleteManufacturer(req, res, next) {
  try {
    await prisma.manufacturer.update({ where: { id: parseInt(req.params.id, 10) }, data: { isActive: false } });
    res.json({ message: 'Manufacturer deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body) {
  return {
    name:        body.name?.trim(),
    description: body.description?.trim() || null,
    isActive:    body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}

module.exports = { getManufacturers, getManufacturer, getAllManufacturers, createManufacturer, updateManufacturer, deleteManufacturer };
