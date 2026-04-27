import { WayuuDivider } from '../../shared/components/WayuuDivider';

const FOOTER_LINKS = ['Indigenous Fund', 'Heritage License', 'Support Portal'] as const;

export function DashboardFooter() {
  return (
    <footer className="mt-auto flex w-full flex-col items-center gap-6 border-t border-taironaTerracotta/30 bg-obsidian py-12 px-8 font-headline">
      <div className="flex gap-12 text-[10px] uppercase tracking-[0.3em]">
        {FOOTER_LINKS.map((link) => (
          <a key={link} className="text-koguiCream/50 transition-colors hover:text-muiscaGold" href="#">
            {link}
          </a>
        ))}
      </div>
      <WayuuDivider className="w-48 opacity-20" />
      <p className="text-[10px] italic uppercase tracking-widest text-taironaTerracotta/60">© 2024 Minga Records. Handcrafted for the Modern Ancestor.</p>
    </footer>
  );
}
