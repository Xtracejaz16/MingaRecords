interface CartIconBadgeProps {
  itemCount: number;
  onClick: () => void;
}

export function CartIconBadge({ itemCount, onClick }: CartIconBadgeProps) {
  return (
    <button
      type="button"
      className="relative cursor-pointer"
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-koguiCream hover:text-muiscaGold transition-colors">
        shopping_bag
      </span>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-taironaTerracotta text-white text-[10px] w-4 h-4 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}
