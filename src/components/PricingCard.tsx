import type { PricingTier } from '../types';

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  return (
    <div 
      className={`bg-stone-900 p-8 flex flex-col items-center text-center transform transition-transform duration-500 relative group ${
        tier.featured 
          ? 'border-2 border-wayuuJade hover:-translate-y-4 shadow-[0_0_40px_rgba(26,122,110,0.2)]' 
          : 'border-2 border-stone-800 hover:-translate-y-2'
      }`}
    >
      <div className={`absolute -top-4 px-4 py-1 text-xs font-cinzel tracking-widest ${
        tier.featured ? 'bg-wayuuJade text-white' : 'bg-stone-800'
      }`}>
        {tier.name}
      </div>
      
      <span className={`font-cinzel text-3xl mb-4 ${tier.featured ? 'text-wayuuJade' : ''}`}>
        ${tier.price}
      </span>
      <p className={`text-sm italic mb-8 ${tier.featured ? 'opacity-80' : 'opacity-60'}`}>
        {tier.description}
      </p>
      
      <ul className={`space-y-4 text-sm mb-10 flex-grow ${tier.featured ? '' : 'opacity-80'}`}>
        {tier.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      
      <button 
        className={`w-full py-3 font-cinzel tracking-widest transition-colors ${
          tier.featured 
            ? 'bg-wayuuJade hover:bg-koguiCream hover:text-obsidian' 
            : 'bg-stone-800 hover:bg-muiscaGold hover:text-obsidian'
        }`}
      >
        {tier.id === 'raiz' ? 'POPULAR' : tier.id === 'semilla' ? 'ADQUIRIR' : 'EXCLUSIVO'}
      </button>
    </div>
  );
}