import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf-8');

describe('App architecture', () => {
  it('keeps side effects outside App.tsx', () => {
    expect(appSource).not.toContain('useEffect');
    expect(appSource).not.toContain('useState');
    expect(appSource).not.toContain('window.addEventListener');
    expect(appSource).not.toContain('window.history.replaceState');
    expect(appSource).not.toContain('window.scrollTo');
    expect(appSource).toContain('useAppShell');
  });
});
