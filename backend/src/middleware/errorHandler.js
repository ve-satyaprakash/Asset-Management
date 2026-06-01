function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this API Name already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Invalid parent reference.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
