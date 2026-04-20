# Referencia: Módulo de Formularios (Crear / Editar)

Patrón para crear o editar cualquier entidad. Ejemplo con subida de beat.

---

## application/beats/CreateBeatUseCase.ts

```typescript
import { BeatsRepository } from '../../domain/beats/BeatsRepository'
import { Beat } from '../../domain/beats/Beat'

export interface CreateBeatInput {
  title: string
  genre: string
  bpm: number
  price: number
  audioFile: File
  tags: string[]
}

export class CreateBeatUseCase {
  constructor(private readonly beatsRepo: BeatsRepository) {}

  async execute(input: CreateBeatInput, producerId: string): Promise<Beat> {
    if (!input.title.trim()) throw new Error('El título es requerido')
    if (input.price <= 0) throw new Error('El precio debe ser mayor a 0')
    if (input.bpm < 60 || input.bpm > 300) throw new Error('BPM debe estar entre 60 y 300')
    if (!input.audioFile) throw new Error('Debes subir un archivo de audio')

    return this.beatsRepo.create(input, producerId)
  }
}
```

---

## infrastructure/beats/MockBeatsRepository.ts — agregar método create

```typescript
// Agregar en la clase MockBeatsRepository existente:

async create(input: CreateBeatInput, producerId: string): Promise<Beat> {
  await new Promise(r => setTimeout(r, 1000)) // simular upload

  const newBeat: Beat = {
    id: `beat-${Date.now()}`,
    title: input.title,
    producerId,
    producerName: 'BeatMaker99', // en mock usamos nombre fijo
    genre: input.genre,
    bpm: input.bpm,
    price: input.price,
    audioUrl: URL.createObjectURL(input.audioFile), // preview local
    tags: input.tags,
    createdAt: new Date().toISOString()
  }

  return newBeat
}
```

---

## ui/beats/hooks/useCreateBeat.ts

```typescript
import { useState } from 'react'
import { CreateBeatUseCase, CreateBeatInput } from '../../../application/beats/CreateBeatUseCase'
import { MockBeatsRepository } from '../../../infrastructure/beats/MockBeatsRepository'
import { Beat } from '../../../domain/beats/Beat'

const repo = new MockBeatsRepository()
const createBeatUseCase = new CreateBeatUseCase(repo)

const CURRENT_PRODUCER_ID = 'mock-001' // cuando haya auth real, vendrá del contexto

export function useCreateBeat() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Beat | null>(null)

  const createBeat = async (input: CreateBeatInput) => {
    setLoading(true)
    setError(null)
    try {
      const beat = await createBeatUseCase.execute(input, CURRENT_PRODUCER_ID)
      setCreated(beat)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { createBeat, loading, error, created }
}
```

---

## ui/beats/components/CreateBeatForm.tsx

```tsx
import { useState } from 'react'
import { useCreateBeat } from '../hooks/useCreateBeat'

export function CreateBeatForm() {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [bpm, setBpm] = useState(140)
  const [price, setPrice] = useState(0)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [tags, setTags] = useState('')

  const { createBeat, loading, error, created } = useCreateBeat()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile) return
    createBeat({
      title,
      genre,
      bpm,
      price,
      audioFile,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    })
  }

  if (created) {
    return <p>¡Beat "{created.title}" publicado! 🎧</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Título del beat"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <input
        placeholder="Género (trap, lofi, drill...)"
        value={genre}
        onChange={e => setGenre(e.target.value)}
      />
      <input
        type="number"
        placeholder="BPM"
        value={bpm}
        onChange={e => setBpm(Number(e.target.value))}
      />
      <input
        type="number"
        placeholder="Precio (USD)"
        value={price}
        onChange={e => setPrice(Number(e.target.value))}
      />
      <input
        type="file"
        accept="audio/*"
        onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
      />
      <input
        placeholder="Tags separados por coma (dark, hard, melodic)"
        value={tags}
        onChange={e => setTags(e.target.value)}
      />
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading || !audioFile}>
        {loading ? 'Publicando...' : 'Publicar beat'}
      </button>
    </form>
  )
}
```