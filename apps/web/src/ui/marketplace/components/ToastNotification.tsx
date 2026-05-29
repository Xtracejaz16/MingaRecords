interface ToastNotificationProps {
  message: string;
  onClose: () => void;
}

export function ToastNotification({ message }: ToastNotificationProps) {
  return (
    <div className="bg-[#0F0A00] border border-[#8B2500]/40 px-6 py-3 flex items-center gap-3 shadow-2xl animate-bounce mb-4 transition-opacity duration-300 pointer-events-auto">
      <span
        className="material-symbols-outlined text-[#8B2500] text-sm"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        favorite
      </span>
      <span className="font-display text-xs text-[#8B2500] tracking-widest uppercase">
        {message}
      </span>
    </div>
  );
}
