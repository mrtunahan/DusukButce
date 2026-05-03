require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

start().catch((err) => {
  logger.error(err, 'Startup failed');
  process.exit(1);
});
