import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * Cursore custom: un punto preciso e un anello che lo insegue.
 * Su link e pulsanti l'anello si espande; con `data-cursor="testo"` mostra un'etichetta.
 * Attivo solo con mouse e senza "riduci movimento".
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = matchMedia('(pointer: fine)').matches;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return;
    const html = document.documentElement;
    html.classList.add('has-cursor');

    gsap.set([dot.current, ring.current], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' });

    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };

    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('a, button, [data-cursor]');
      const text = t?.dataset.cursor ?? '';
      setLabel(text);
      gsap.to(ring.current, {
        scale: t ? (text ? 3.2 : 1.9) : 1,
        backgroundColor: text ? 'var(--accent)' : 'rgba(0,0,0,0)',
        borderColor: text ? 'var(--accent)' : 'currentColor',
        duration: 0.45,
        ease: 'power3.out',
      });
      gsap.to(dot.current, { scale: t ? 0 : 1, duration: 0.3 });
    };

    const leave = () => {
      shown = false;
      gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 });
    };
    const down = () => gsap.to(ring.current, { scale: '-=0.3', duration: 0.15 });
    const up = () => gsap.to(ring.current, { scale: '+=0.3', duration: 0.3 });

    window.addEventListener('pointermove', move);
    document.addEventListener('pointerover', over);
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      html.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[110] text-white mix-blend-difference">
      <div ref={dot} className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-current" />
      <div
        ref={ring}
        className="fixed left-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-current"
      >
        <span className="label text-[0.28rem] leading-none tracking-[0.1em] text-black">{label}</span>
      </div>
    </div>
  );
}
