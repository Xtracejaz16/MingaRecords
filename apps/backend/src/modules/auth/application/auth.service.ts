import jwt from 'jsonwebtoken'
import { env } from '../../../config/env'
import { AuthError } from '../domain/auth.types'
import type { AuthPort, UserIdentity } from '../domain/auth.types'

export class JwtAuthService implements AuthPort {
  async verifyToken(token: string): Promise<UserIdentity> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as UserIdentity
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      }
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AuthError('EXPIRED_TOKEN', 'Token has expired')
      }
      throw new AuthError('INVALID_TOKEN', 'Token is invalid')
    }
  }
}