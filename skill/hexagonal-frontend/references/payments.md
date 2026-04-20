# Referencia: Módulo de Pagos

Patrón para checkout, órdenes y transacciones. Ejemplo con compra de beat.

---

## domain/payments/Order.ts

```typescript
export interface OrderItem {
  beatId: string
  beatTitle: string
  price: number
}

export interface Order {
  id: string
  buyerId: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

export interface CheckoutInput {
  buyerId: string
  items: OrderItem[]
  paymentMethodId: string // token de Stripe u otro procesador
}
```

---

## domain/payments/PaymentsRepository.ts

```typescript
import { Order, CheckoutInput } from './Order'

export interface PaymentsRepository {
  checkout(input: CheckoutInput): Promise<Order>
  getOrdersByBuyer(buyerId: string): Promise<Order[]>
  getOrderById(orderId: string): Promise<Order>
}
```

---

## application/payments/CheckoutUseCase.ts

```typescript
import { PaymentsRepository } from '../../domain/payments/PaymentsRepository'
import { CheckoutInput, Order } from '../../domain/payments/Order'

export class CheckoutUseCase {
  constructor(private readonly paymentsRepo: PaymentsRepository) {}

  async execute(input: CheckoutInput): Promise<Order> {
    if (!input.items.length) throw new Error('El carrito está vacío')
    if (!input.paymentMethodId) throw new Error('Método de pago requerido')

    const total = input.items.reduce((sum, item) => sum + item.price, 0)
    if (total <= 0) throw new Error('El total debe ser mayor a 0')

    return this.paymentsRepo.checkout(input)
  }
}
```

---

## infrastructure/payments/MockPaymentsRepository.ts

```typescript
import { PaymentsRepository } from '../../domain/payments/PaymentsRepository'
import { Order, CheckoutInput } from '../../domain/payments/Order'

export class MockPaymentsRepository implements PaymentsRepository {
  private orders: Order[] = []

  async checkout(input: CheckoutInput): Promise<Order> {
    await new Promise(r => setTimeout(r, 1200)) // simular procesamiento

    // Simular fallo con paymentMethodId 'fail' para probar error handling
    if (input.paymentMethodId === 'fail') {
      throw new Error('Pago rechazado. Verifica tu método de pago.')
    }

    const order: Order = {
      id: `order-${Date.now()}`,
      buyerId: input.buyerId,
      items: input.items,
      total: input.items.reduce((sum, item) => sum + item.price, 0),
      status: 'completed',
      createdAt: new Date().toISOString()
    }

    this.orders.push(order)
    return order
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    await new Promise(r => setTimeout(r, 400))
    return this.orders.filter(o => o.buyerId === buyerId)
  }

  async getOrderById(orderId: string): Promise<Order> {
    await new Promise(r => setTimeout(r, 300))
    const order = this.orders.find(o => o.id === orderId)
    if (!order) throw new Error('Orden no encontrada')
    return order
  }
}
```

---

## ui/payments/hooks/useCheckout.ts

```typescript
import { useState } from 'react'
import { CheckoutUseCase } from '../../../application/payments/CheckoutUseCase'
import { MockPaymentsRepository } from '../../../infrastructure/payments/MockPaymentsRepository'
import { Order, OrderItem } from '../../../domain/payments/Order'

const repo = new MockPaymentsRepository()
const checkoutUseCase = new CheckoutUseCase(repo)

export function useCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)

  const checkout = async (
    buyerId: string,
    items: OrderItem[],
    paymentMethodId: string
  ) => {
    setLoading(true)
    setError(null)
    try {
      const result = await checkoutUseCase.execute({ buyerId, items, paymentMethodId })
      setOrder(result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { checkout, loading, error, order }
}
```