import type { Producer } from '../types';

interface ProducerCardProps {
  producer: Producer;
}

export function ProducerCard({ producer }: ProducerCardProps) {
  return (
    <div className="flex-none w-64 snap-center group">
      <div className="relative mb-6">
        <div 
          className={`absolute inset-0 border-2 border-dashed border-muiscaGold rounded-full animate-[spin_${producer.rotationSpeed || 10}s_linear_infinite]`}
          style={{ 
            animationDirection: producer.rotationDirection === 'reverse' ? 'reverse' : 'normal'
          }}
        />
        <div className="p-3">
          <img 
            alt={producer.name} 
            className="rounded-full grayscale hover:grayscale-0 transition-all duration-500 border-4 border-obsidian" 
            src={producer.imageUrl} 
          />
        </div>
      </div>
      <div className="text-center">
        <h4 className="font-cinzel text-lg font-bold">{producer.name}</h4>
        <p className="text-xs tracking-widest text-zenuCopper">{producer.region}</p>
      </div>
    </div>
  );
}