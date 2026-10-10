module.exports = {
  apps: [
    {
      name: 'oscarsoft',
      script: 'server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5050
      }
    },
    {
      name: 'barigo-backend',
      script: 'barigo/backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5055
      }
    }
  ]
};
