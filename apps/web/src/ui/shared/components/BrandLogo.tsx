interface BrandLogoProps {
  primaryColor?: string;
  accentColor?: string;
  className?: string;
}

export function BrandLogo({ primaryColor, accentColor, className }: BrandLogoProps) {
  return (
    <span className={`font-headline text-xl font-black tracking-widest ${primaryColor ?? 'text-muiscaGold'} ${className ?? ''}`}>
      MINGA <span className={accentColor ?? 'text-taironaTerracotta'}>RECORDS</span>
    </span>
  );
}
