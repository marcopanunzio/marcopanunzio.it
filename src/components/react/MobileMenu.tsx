import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';

type Item = { label: string; href: string };
type Props = { items: Item[]; email: string };

declare global {
  interface Window {
    __lenis?: { scrollTo: (target: string | number | HTMLElement, opts?: object) => void; stop(): void; start(): void };
  }
}

export default function MobileMenu({ items, email }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!panel.current) return;
    const ctx = gsap.context(() => {
      tl.current = gsap
        .timeline({ paused: true })
        .set(panel.current, { display: 'flex' })
        .fromTo(
          panel.current,
          { clipPath: 'circle(0% at calc(100% - 3rem) 2rem)' },
          { clipPath: 'circle(150% at calc(100% - 3rem) 2rem)', duration: 0.9, ease: 'expo.inOut' },
        )
        .from('.mm-link', { yPercent: 110, duration: 0.8, stagger: 0.06, ease: 'expo.out' }, '-=0.45')
        .from('.mm-foot', { autoAlpha: 0, y: 10, duration: 0.4 }, '-=0.5');
    }, panel);
    return () => ctx.revert();
  }, [mounted]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!tl.current) return;
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      window.__lenis?.stop();
      tl.current.timeScale(1).play();
    } else {
      window.__lenis?.start();
      tl.current.timeScale(1.6).reverse();
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    setTimeout(() => {
      if (window.__lenis) window.__lenis.scrollTo(href, { duration: 1.6 });
      else document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }, 350);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="label relative z-[70] flex items-center gap-2 md:hidden"
      >
        <span className="relative block h-2.5 w-5">
          <span
            className="absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500"
            style={{ transform: open ? 'translateY(5px) rotate(45deg)' : 'none' }}
          />
          <span
            className="absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-500"
            style={{ transform: open ? 'translateY(-5px) rotate(-45deg)' : 'none' }}
          />
        </span>
        {open ? 'Chiudi' : 'Menu'}
      </button>

      {mounted && createPortal(
      <div
        ref={panel}
        id="mobile-menu"
        className="wrap fixed inset-0 z-[60] hidden flex-col justify-between bg-accent pb-8 pt-28 text-black md:hidden"
        aria-hidden={!open}
      >
        <nav>
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={item.href} className="overflow-hidden">
                <a
                  href={item.href}
                  onClick={(e) => go(e, item.href)}
                  tabIndex={open ? 0 : -1}
                  className="mm-link display flex items-baseline gap-3 text-[clamp(2.8rem,13vw,5rem)]"
                >
                  <span className="label text-xs">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href={`mailto:${email}`} tabIndex={open ? 0 : -1} className="mm-foot label">
          {email}
        </a>
      </div>,
      document.body,
      )}
    </>
  );
}
