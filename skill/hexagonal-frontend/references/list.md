# Referencia: Módulo de Listados (Productos, Beats, etc.)

Patrón para listar, filtrar y paginar cualquier colección de items.
Reemplazar `Beat` con el nombre de tu entidad.

---

## domain/beats/Beat.ts

```typescript
export interface Beat {
  id: string
  title: string
  producerId: string
  producerName: string
  genre: string
  bpm: number
  price: number
  audioUrl: string
  imageUrl?: string
  tags: string[]
  createdAt: string
}

export interface BeatsFilter {
  genre?: string
  minPrice?: number
  maxPrice?: number
  minBpm?: number
  maxBpm?: number
  search?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

---

## domain/beats/BeatsRepository.ts

```typescript
import { Beat, BeatsFilter, PaginatedResult } from './Beat'

export interface BeatsRepository {
  getAll(filter?: BeatsFilter, page?: number, pageSize?: number): Promise<PaginatedResult<Beat>>
  getById(id: string): Promise<Beat>
  getByProducer(producerId: string): Promise<Beat[]>
}
```

---

## application/beats/GetBeatsUseCase.ts

```typescript
import { BeatsRepository } from '../../domain/beats/BeatsRepository'
import { Beat, BeatsFilter, PaginatedResult } from '../../domain/beats/Beat'

export class GetBeatsUseCase {
  constructor(private readonly beatsRepo: BeatsRepository) {}

  async execute(
    filter?: BeatsFilter,
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResult<Beat>> {
    if (page < 1) throw new Error('La página debe ser mayor a 0')
    if (pageSize > 50) throw new Error('Máximo 50 items por página')
    return this.beatsRepo.getAll(filter, page, pageSize)
  }
}
```

---

## infrastructure/beats/MockBeatsRepository.ts

```typescript
import { BeatsRepository } from '../../domain/beats/BeatsRepository'
import { Beat, BeatsFilter, PaginatedResult } from '../../domain/beats/Beat'

const MOCK_BEATS: Beat[] = [
  {
    id: 'beat-001',
    title: 'Dark Trap Wave',
    producerId: 'mock-001',
    producerName: 'BeatMaker99',
    genre: 'trap',
    bpm: 140,
    price: 29.99,
    audioUrl: '/mock/audio/dark-trap.mp3',
    tags: ['dark', 'hard', 'melodic'],
    createdAt: '2024-01-15'
  },
  {
    id: 'beat-002',
    title: 'Chill Lo-Fi',
    producerId: 'mock-001',
    producerName: 'BeatMaker99',
    genre: 'lofi',
    bpm: 85,
    price: 19.99,
    audioUrl: '/mock/audio/chill-lofi.mp3',
    tags: ['chill', 'study', 'relax'],
    createdAt: '2024-01-20'
  }
  // agregar más según necesidad
]

export class MockBeatsRepository implements BeatsRepository {
  async getAll(
    filter?: BeatsFilter,
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResult<Beat>> {
    await new Promise(r => setTimeout(r, 500))

    let filtered = [...MOCK_BEATS]

    if (filter?.genre) {
      filtered = filtered.filter(b => b.genre === filter.genre)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.producerName.toLowerCase().includes(q) ||
        b.tags.some(t => t.includes(q))
      )
    }
    if (filter?.minPrice != null) {
      filtered = filtered.filter(b => b.price >= filter.minPrice!)
    }
    if (filter?.maxPrice != null) {
      filtered = filtered.filter(b => b.price <= filter.maxPrice!)
    }

    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)

    return { items, total: filtered.length, page, pageSize }
  }

  async getById(id: string): Promise<Beat> {
    await new Promise(r => setTimeout(r, 300))
    const beat = MOCK_BEATS.find(b => b.id === id)
    if (!beat) throw new Error('Beat no encontrado')
    return beat
  }

  async getByProducer(producerId: string): Promise<Beat[]> {
    await new Promise(r => setTimeout(r, 400))
    return MOCK_BEATS.filter(b => b.producerId === producerId)
  }
}
```

---

## ui/beats/hooks/useBeats.ts

```typescript
import { useState, useEffect } from 'react'
import { GetBeatsUseCase } from '../../../application/beats/GetBeatsUseCase'
import { MockBeatsRepository } from '../../../infrastructure/beats/MockBeatsRepository'
import { Beat, BeatsFilter, PaginatedResult } from '../../../domain/beats/Beat'

const repo = new MockBeatsRepository()   // ← cambiar a ApiBeatsRepository cuando esté la API
const getBeatsUseCase = new GetBeatsUseCase(repo)

export function useBeats(filter?: BeatsFilter, page = 1) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PaginatedResult<Beat> | null>(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getBeatsUseCase.execute(filter, page)
        setResult(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [JSON.stringify(filter), page])

  return { loading, error, result }
}
```

---

## ui/beats/components/BeatsList.tsx

```tsx
import { useState } from 'react'
import { useBeats } from '../hooks/useBeats'
import { BeatsFilter } from '../../../domain/beats/Beat'

export function BeatsList() {
  const [filter, setFilter] = useState<BeatsFilter>({})
  const [page, setPage] = useState(1)
  const { loading, error, result } = useBeats(filter, page)

  if (loading) return <p>Cargando beats...</p>
  if (error) return <p>Error: {error}</p>
  if (!result) return null

  return (
    <div>
      <input
        placeholder="Buscar beats..."
        onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
      />

      <div>
        {result.items.map(beat => (
          <div key={beat.id}>
            <h3>{beat.title}</h3>
            <p>{beat.producerName} · {beat.bpm} BPM · ${beat.price}</p>
          </div>
        ))}
      </div>

      <div>
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button
          disabled={result.items.length < 12}
          onClick={() => setPage(p => p + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
```