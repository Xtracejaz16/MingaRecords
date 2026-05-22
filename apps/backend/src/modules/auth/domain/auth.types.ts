export interface UserIdentity {
  id: string
  email: string
  role: 'artist' | 'buyer' | 'admin'
}

export interface AuthPort {
  verifyToken(token: string): Promise<UserIdentity>
}

export class AuthError extends Error {
  constructor(
    public readonly code: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN',
    message: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}