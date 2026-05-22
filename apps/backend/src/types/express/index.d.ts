import type { UserIdentity } from '../../modules/auth/domain/auth.types'

declare global {
  namespace Express {
    interface Request {
      user?: UserIdentity
    }
  }
}

export {}