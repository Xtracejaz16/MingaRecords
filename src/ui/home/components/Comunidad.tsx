import { ProducerCard } from './ProducerCard';
import { producers } from '../../../data';

export function Comunidad() {
  return (
    <section className="py-24 bg-obsidian/50 reveal" id="comunidad">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <h2 className="font-cinzel text-4xl font-bold text-muiscaGold">LA COMUNIDAD</h2>
        <div className="w-24 h-1 bg-zenuCopper mx-auto mt-4" />
      </div>
      <div className="flex justify-center overflow-x-auto gap-12 px-6 pb-12 snap-x">
        {producers.map((producer) => (
          <ProducerCard key={producer.id} producer={producer} />
        ))}
      </div>
    </section>
  );
}
