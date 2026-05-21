import { flowItems } from '../../../data';

export function Ritual() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto reveal">
      <div className="text-center mb-16">
        <h2 className="font-cinzel text-4xl font-bold text-muiscaGold">EL RITUAL</h2>
        <p className="italic opacity-70">Cómo fluye la energía en nuestra red.</p>
      </div>
      
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        {/* Spiral Connector (Mobile Hidden) */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
          <svg fill="none" height="200" viewBox="0 0 100 100" width="200" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 50C70 50 80 30 80 15C80 5 70 5 60 15C40 35 40 65 60 85C70 95 80 95 80 85C80 70 70 50 50 50Z" stroke="#B5651D" strokeWidth="2" />
          </svg>
        </div>
        
        {/* Artist Side */}
        <div className="space-y-12">
          <div className="flex items-start gap-6">
            <div className="flex-none w-12 h-12 flex items-center justify-center bg-muiscaGold/10 text-muiscaGold">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
              </svg>
            </div>
            <div>
              <h4 className="font-cinzel text-lg font-bold mb-2">{flowItems[0].title}</h4>
              <p className="opacity-80">{flowItems[0].description}</p>
            </div>
          </div>
        </div>
        
        {/* Beatmaker Side */}
        <div className="space-y-12">
          <div className="flex items-start gap-6">
            <div className="flex-none w-12 h-12 flex items-center justify-center bg-wayuuJade/10 text-wayuuJade">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div>
              <h4 className="font-cinzel text-lg font-bold mb-2">{flowItems[1].title}</h4>
              <p className="opacity-80">{flowItems[1].description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
