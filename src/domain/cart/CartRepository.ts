import type { CartItem } from './CartItem';

export interface CartRepository {
  /**
   * Returns all items currently in the cart.
   *
   * @returns An array of CartItem instances. Never returns null —
   *   an empty cart yields an empty array.
   */
  getItems(): CartItem[];

  /**
   * Adds an item to the cart.
   *
   * If an item with the same `beatId` already exists, its `quantity`
   * is incremented instead of creating a duplicate entry.
   *
   * @param item - The CartItem to add. Must be a valid CartItem with
   *   a non-empty `beatId`.
   */
  addItem(item: CartItem): void;

  /**
   * Removes an item from the cart by its `beatId`.
   *
   * If no item with the given `beatId` exists, the operation is a no-op.
   *
   * @param beatId - The unique beat identifier. Must be a non-empty string.
   */
  removeItem(beatId: string): void;

  /**
   * Removes all items from the cart.
   *
   * After execution, {@link getItems} returns an empty array.
   */
  clearCart(): void;

  /**
   * Computes the total price of all items in the cart.
   *
   * The total is the sum of each item's `price` multiplied by its `quantity`.
   * An empty cart yields `0`.
   *
   * @returns The computed total price.
   */
  getTotal(): number;

  /**
   * Returns the total number of items in the cart.
   *
   * This is the sum of all item `quantity` values, not the number of
   * distinct entries. An empty cart yields `0`.
   *
   * @returns The total item count.
   */
  getItemCount(): number;
}