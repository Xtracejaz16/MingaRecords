// Environment variable typing and loader (scaffold)

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
}

export type Env = typeof env
