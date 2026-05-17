import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const databaseUrl = process.env.DATABASE_URL
const redisUrl = process.env.REDIS_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for the Edge Medusa backend')
}

export default defineConfig({
  projectConfig: {
    databaseUrl,
    redisUrl,
    http: {
      storeCors: process.env.STORE_CORS || 'http://localhost:3000,https://*.edgemarketplacehub.com',
      adminCors: process.env.ADMIN_CORS || 'http://localhost:7001,http://localhost:3000',
      authCors: process.env.AUTH_CORS || 'http://localhost:7001,http://localhost:3000',
      jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
      cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_secret_change_me',
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
    path: '/app',
  },
  modules: [
    {
      resolve: '@medusajs/payment-stripe',
      options: {
        apiKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        capture: true,
      },
    },
    {
      resolve: '@medusajs/fulfillment-manual',
      options: {},
    },
    {
      resolve: '@medusajs/file-local',
      options: {
        upload_dir: process.env.MEDUSA_UPLOAD_DIR || 'static',
        backend_url: process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
      },
    },
  ],
})
