interface ZenuDividerProps {
  className?: string;
}

export function ZenuDivider({ className }: ZenuDividerProps) {
  return <div aria-hidden="true" className={`zenu-spiral-divider ${className ?? ''}`} />;
}
