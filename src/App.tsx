import { useScrollReveal } from './hooks';
import {
  Navigation,
  Hero,
  Cosecha,
  Comunidad,
  Impulso,
  Ritual,
  Ofrendas,
  Minga,
  Footer,
} from './components';
import './index.css';

function App() {
  // Initialize scroll reveal animations
  useScrollReveal();

  return (
    <div className="bg-obsidian text-koguiCream font-crimson overflow-x-hidden">
      {/* Grain overlay texture */}
      <div className="grain-overlay" />
      
      {/* Skip to content for accessibility */}
      <a 
        href="#cosecha" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-muiscaGold focus:text-obsidian focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <Hero />
      
      {/* La Cosecha (Beat Catalog) */}
      <Cosecha />
      
      {/* La Comunidad (Producer Community) */}
      <Comunidad />
      
      {/* El Impulso (Stats) */}
      <Impulso />
      
      {/* El Ritual (Flow) */}
      <Ritual />
      
      {/* Las Ofrendas (Pricing) */}
      <Ofrendas />
      
      {/* Nuestra Minga (Manifesto) */}
      <Minga />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;