require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const errorHandler = require('./middleware/errorHandler');

const productTypeRoutes = require('./routes/productTypeRoutes');
const assetRoutes = require('./routes/assetRoutes');
const productRoutes = require('./routes/productRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const softwareTypeRoutes = require('./routes/softwareTypeRoutes');
const softwareCategoryRoutes = require('./routes/softwareCategoryRoutes');
const softwareLicenseTypeRoutes = require('./routes/softwareLicenseTypeRoutes');
const assetStateRoutes = require('./routes/assetStateRoutes');
const manufacturerRoutes = require('./routes/manufacturerRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed Origins from .env
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [];

console.log('Allowed Origins:', allowedOrigins);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman, mobile apps, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS blocked for origin: ${origin}`)
    );
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Handle Preflight Requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Static Files
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'public', 'uploads'))
);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/product-types', productTypeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/software-types', softwareTypeRoutes);
app.use('/api/software-categories', softwareCategoryRoutes);
app.use('/api/software-license-types', softwareLicenseTypeRoutes);
app.use('/api/asset-states', assetStateRoutes);
app.use('/api/manufacturers', manufacturerRoutes);

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});