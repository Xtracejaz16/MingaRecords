import { PricingCard } from './PricingCard';
import { pricingTiers } from '../../../data';

export function Ofrendas() {
  return (
    <section className="py-24 px-6 bg-emberaNavy/30 reveal" id="ofrendas">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-cinzel text-4xl font-bold text-muiscaGold">LAS OFRENDAS</h2>
          <p className="italic opacity-70">El intercambio justo por el espíritu del sonido.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}
