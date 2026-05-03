module.exports = {
  apps: [
    {
      name: 'dusukbutce-api',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '500M',
    },
    {
      name: 'dusukbutce-worker',
      script: 'src/workers/receipt-processor.worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
    },
  ],
};
