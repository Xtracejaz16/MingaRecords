# Referencia: Módulo Auth (Login / Registro)

Código completo listo para copiar. Reemplazar `beats.com` y nombres de usuario según el proyecto.

---

## domain/auth/User.ts

```typescript
export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string
  token: string
  role: 'producer' | 'buyer' | 'admin'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  username: string
}
```

---

## domain/auth/AuthRepository.ts

```typescript
import { User, LoginCredentials, RegisterCredentials } from './User'

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<User>
  register(credentials: RegisterCredentials): Promise<User>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
}
```

---

## application/auth/LoginUseCase.ts

```typescript
import { AuthRepository } from '../../domain/auth/AuthRepository'
import { LoginCredentials, User } from '../../domain/auth/User'

export class LoginUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<User> {
    if (!credentials.email.trim()) {
      throw new Error('El email es requerido')
    }
    if (!credentials.password.trim()) {
      throw new Error('La contraseña es requerida')
    }
    if (credentials.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }
    return this.authRepo.login(credentials)
  }
}
```

---

## application/auth/RegisterUseCase.ts

```typescript
import { AuthRepository } from '../../domain/auth/AuthRepository'
import { RegisterCredentials, User } from '../../domain/auth/User'

export class RegisterUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(credentials: RegisterCredentials): Promise<User> {
    if (!credentials.email.includes('@')) {
      throw new Error('Email inválido')
    }
    if (credentials.username.length < 3) {
      throw new Error('El username debe tener al menos 3 caracteres')
    }
    if (credentials.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }
    return this.authRepo.register(credentials)
  }
}
```

---

## infrastructure/auth/MockAuthRepository.ts

```typescript
import { AuthRepository } from '../../domain/auth/AuthRepository'
import { User, LoginCredentials, RegisterCredentials } from '../../domain/auth/User'

const STORAGE_KEY = 'auth_user'

// Usuarios de prueba
const MOCK_USERS: User[] = [
  {
    id: 'mock-001',
    email: 'producer@beats.com',
    username: 'BeatMaker99',
    token: 'mock-token-producer',
    role: 'producer'
  },
  {
    id: 'mock-002',
    email: 'buyer@beats.com',
    username: 'MusicLover',
    token: 'mock-token-buyer',
    role: 'buyer'
  }
]

export class MockAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<User> {
    await new Promise(r => setTimeout(r, 700)) // simular latencia

    const user = MOCK_USERS.find(u => u.email === credentials.email)

    if (!user || credentials.password !== '123456') {
      throw new Error('Email o contraseña incorrectos')
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    await new Promise(r => setTimeout(r, 900))

    const exists = MOCK_USERS.find(u => u.email === credentials.email)
    if (exists) throw new Error('Este email ya está registrado')

    const newUser: User = {
      id: `mock-${Date.now()}`,
      email: credentials.email,
      username: credentials.username,
      token: `mock-token-${Date.now()}`,
      role: 'buyer'
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    return newUser
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }

  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  }
}
```

---

## infrastructure/auth/ApiAuthRepository.ts

```typescript
import { AuthRepository } from '../../domain/auth/AuthRepository'
import { User, LoginCredentials, RegisterCredentials } from '../../domain/auth/User'

 const BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? '/api/auth'

export class ApiAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<User> {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? 'Error al iniciar sesión')
    }
    return res.json()
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? 'Error al registrarse')
    }
    return res.json()
  }

  async logout(): Promise<void> {
    await fetch(`${BASE_URL}/logout`, { method: 'POST' })
  }

  async getCurrentUser(): Promise<User | null> {
    const res = await fetch(`${BASE_URL}/me`)
    if (!res.ok) return null
    return res.json()
  }
}
```

---

## ui/auth/hooks/useLogin.ts

```typescript
import { useState } from 'react'
import { LoginUseCase } from '../../../application/auth/LoginUseCase'
import { MockAuthRepository } from '../../../infrastructure/auth/MockAuthRepository'
import { User } from '../../../domain/auth/User'

const repo = new MockAuthRepository()           // ← cambiar a ApiAuthRepository cuando esté la API
const loginUseCase = new LoginUseCase(repo)

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const loggedUser = await loginUseCase.execute({ email, password })
      setUser(loggedUser)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error, user }
}
```

---

## ui/auth/components/LoginForm.tsx

```tsx
import { useState } from 'react'
import { useLogin } from '../hooks/useLogin'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, user } = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login(email, password)
  }

  if (user) {
    return <p>Bienvenido, {user.username} 🎧</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        disabled={loading}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        disabled={loading}
      />
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
```
