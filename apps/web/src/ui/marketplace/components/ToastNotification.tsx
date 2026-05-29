interface ToastNotificationProps {
  message: string;
  onClose: () => void;
}

export function ToastNotification({ message, onClose }: ToastNotificationProps) {
  return (
    <div className="bg-surface border border-taironaTerracotta/40 px-6 py-3 flex items-center gap-3 shadow-2xl motion-safe:animate-bounce mb-4 transition-opacity duration-300 pointer-events-auto">
      <span
        className="material-symbols-outlined text-taironaTerracotta text-sm"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        favorite
      </span>
      <span className="font-display text-xs text-taironaTerracotta tracking-widest uppercase">
        {message}
      </span>
      <button
        type="button"
        className="ml-auto text-taironaTerracotta/60 hover:text-taironaTerracotta transition-colors cursor-pointer"
        onClick={onClose}
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
