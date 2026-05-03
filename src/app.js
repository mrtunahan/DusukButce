const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./api/routes/auth.routes');
const receiptsRoutes = require('./api/routes/receipts.routes');
const productsRoutes = require('./api/routes/products.routes');
const insightsRoutes = require('./api/routes/insights.routes');
const errorMiddleware = require('./api/middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/receipts', receiptsRoutes);
app.use('/products', productsRoutes);
app.use('/insights', insightsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorMiddleware);

module.exports = app;
