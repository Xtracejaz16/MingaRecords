import { Hero } from '../components/Hero';
import { Navigation } from '../components/Navigation';
import { Cosecha } from '../components/Cosecha';
import { Comunidad } from '../components/Comunidad';
import { Impulso } from '../components/Impulso';
import { Ritual } from '../components/Ritual';
import { Ofrendas } from '../components/Ofrendas';
import { Minga } from '../components/Minga';
import { Footer } from '../components/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function HomeScreen() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-obsidian text-koguiCream font-crimson">
      <Navigation />
      <Hero />
      <Cosecha />
      <Comunidad />
      <Impulso />
      <Ritual />
      <Ofrendas />
      <Minga />
      <Footer />

      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
