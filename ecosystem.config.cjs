/**
 * PM2 ecosystem config — Playwright Watcher
 *
 * Arrancar:   pm2 start ecosystem.config.cjs
 * Parar:      pm2 stop pw-watcher
 * Logs:       pm2 logs pw-watcher
 * Status:     pm2 status
 * Auto-start no boot: pm2 startup && pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'pw-watcher',
      script: 'scripts/playwright-transfer/local-queue-watcher.mjs',
      interpreter: 'node',
      interpreter_args: '--env-file=.env.local --env-file=.env.playwright.prod',
      cwd: '/Users/carlosvalente/Desktop/frontendAS',
      env: {
        WATCHER_ENV: 'production',
      },
      // Reiniciar automaticamente se o processo cair
      autorestart: true,
      // Aguardar 3s antes de reiniciar após crash
      restart_delay: 3000,
      // Máximo de 10 restarts em 30 minutos (evita loop infinito)
      max_restarts: 10,
      min_uptime: '30s',
      // Logs
      out_file: './logs/pw-watcher-out.log',
      error_file: './logs/pw-watcher-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
