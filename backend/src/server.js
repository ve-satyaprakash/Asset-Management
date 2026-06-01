require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const errorHandler = require('./middleware/errorHandler');
const productTypeRoutes         = require('./routes/productTypeRoutes');
const assetRoutes               = require('./routes/assetRoutes');
const productRoutes             = require('./routes/productRoutes');
const vendorRoutes              = require('./routes/vendorRoutes');
const softwareTypeRoutes        = require('./routes/softwareTypeRoutes');
const softwareCategoryRoutes    = require('./routes/softwareCategoryRoutes');
const softwareLicenseTypeRoutes = require('./routes/softwareLicenseTypeRoutes');
const assetStateRoutes          = require('./routes/assetStateRoutes');
const manufacturerRoutes        = require('./routes/manufacturerRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Serve uploaded product images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/product-types',          productTypeRoutes);
app.use('/api/assets',                assetRoutes);
app.use('/api/products',              productRoutes);
app.use('/api/vendors',               vendorRoutes);
app.use('/api/software-types',        softwareTypeRoutes);
app.use('/api/software-categories',   softwareCategoryRoutes);
app.use('/api/software-license-types',softwareLicenseTypeRoutes);
app.use('/api/asset-states',          assetStateRoutes);
app.use('/api/manufacturers',         manufacturerRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
