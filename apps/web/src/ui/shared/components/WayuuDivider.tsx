interface WayuuDividerProps {
  className?: string;
}

export function WayuuDivider({ className }: WayuuDividerProps) {
  return <div aria-hidden="true" className={`wayuu-diamond-border ${className ?? ''}`} />;
}
