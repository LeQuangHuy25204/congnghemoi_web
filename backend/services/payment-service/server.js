const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const { connectToMongo } = require('../../config/db');
const requestLogger = require('../../shared/middlewares/requestLogger');
const errorHandler = require('../../shared/middlewares/errorHandler');
const paymentRoutes = require('./routes/paymentRoutes');
const healthRoutes = require('./routes/healthRoutes');
const config = require('./config');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));
app.use(requestLogger);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/health', healthRoutes);
app.use('/api/payments', paymentRoutes);

app.use(errorHandler);

const startServer = async () => {
  await connectToMongo(config.mongoUrl);
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[${config.serviceName}] listening on port ${config.port}`);
  });
};

startServer();
