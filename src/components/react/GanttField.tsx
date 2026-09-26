import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Il "Gantt vivo" dietro al titolo dell'hero.
 * La linea "oggi" segue il mouse (o si muove da sola su touch) e le attività
 * si riempiono man mano che il tempo passa. Allo scroll le barre scorrono a velocità diverse.
 */

type Task = { label: string; start: number; width: number; milestone?: boolean };

const TASKS: Task[] = [
  { label: 'Stima', start: 3, width: 12 },
  { label: 'Business case', start: 11, width: 13 },
  { label: 'Analisi', start: 20, width: 18 },
  { label: 'Sviluppo · wave 1', start: 32, width: 22 },
  { label: 'Sviluppo · wave 2', start: 48, width: 20 },
  { label: 'Collaudo', start: 63, width: 13, milestone: true },
  { label: 'Rilascio', start: 75, width: 7, milestone: true },
  { label: 'Chiusura', start: 82, width: 13 },
];
const WEEKS = 16;

export default function GanttField() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(pointer: fine)').matches;

    const fills = Array.from(el.querySelectorAll<HTMLElement>('[data-fill]'));
    const today = el.querySelector<HTMLElement>('[data-today]')!;
    const todayLabel = el.querySelector<HTMLElement>('[data-today-label]')!;
    // riferimenti diretti: l'intro può partire da un altro gsap.context (quello del preloader)
    // e lì i selettori testuali non troverebbero nulla
    const q = (sel: string) => Array.from(el.querySelectorAll<HTMLElement>(sel));
    const grid = q('.g-grid');
    const bars = q('.g-bar');
    const labels = q('.g-label');
    const todayEl = q('.g-today');

    // frazione 0..1 della linea "oggi"
    const state = { target: 0.42, current: 0.0 };

    const render = () => {
      state.current += (state.target - state.current) * 0.08;
      const pct = state.current * 100;
      today.style.transform = `translateX(${el.clientWidth * state.current}px)`;
      todayLabel.textContent = `W${String(Math.max(1, Math.ceil(state.current * WEEKS))).padStart(2, '0')}`;
      fills.forEach((f, i) => {
        const t = TASKS[i];
        const p = Math.min(1, Math.max(0, (pct - t.start) / t.width));
        f.style.transform = `scaleX(${p})`;
      });
    };

    const ctx = gsap.context(() => {
      if (reduced) {
        state.current = state.target;
        render();
        return;
      }

      gsap.set(grid, { scaleY: 0 });
      gsap.set(bars, { scaleX: 0 });
      gsap.set([...labels, ...todayEl], { autoAlpha: 0 });

      const intro = () => {
        gsap
          .timeline({ delay: 0.3 })
          .to(grid, { scaleY: 1, duration: 1.4, stagger: 0.03, ease: 'expo.inOut' })
          .to(bars, { scaleX: 1, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0.4)
          .to(labels, { autoAlpha: 1, duration: 0.6, stagger: 0.05 }, 0.8)
          .to(todayEl, { autoAlpha: 1, duration: 0.6 }, 1.1);
      };
      if (window.__introDone) intro();
      else window.addEventListener('intro:done', intro, { once: true });

      // Parallasse: ogni riga scorre a una velocità diversa
      q('.g-row').forEach((row, i) => {
        gsap.to(row, {
          xPercent: (i % 2 ? -1 : 1) * (6 + i * 2),
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        });
      });
      gsap.to(el, {
        yPercent: 25,
        autoAlpha: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      });

      gsap.ticker.add(render);
    }, el);

    let autoTween: gsap.core.Tween | undefined;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      state.target = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    };
    if (fine && !reduced) {
      window.addEventListener('pointermove', onMove);
    } else if (!reduced) {
      // su touch il tempo avanza da solo
      autoTween = gsap.fromTo(
        state,
        { target: 0.1 },
        { target: 0.95, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true },
      );
    }

    return () => {
      window.removeEventListener('pointermove', onMove);
      autoTween?.kill();
      gsap.ticker.remove(render);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      {/* griglia delle settimane */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: WEEKS }, (_, i) => (
          <div key={i} className="g-grid relative flex-1 origin-top border-l border-line/70">
            <span className={`label absolute left-1.5 top-24 text-[0.55rem] text-muted/60 md:top-28 md:block ${i % 4 ? 'hidden' : ''}`}>
              W{String(i + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>

      {/* attività */}
      <div className="absolute inset-x-0 top-[26%] bottom-[18%] flex flex-col justify-between">
        {TASKS.map((t) => (
          <div key={t.label} className="g-row relative h-8 md:h-10">
            <div className="absolute inset-y-0" style={{ left: `${t.start}%`, width: `${t.width}%` }}>
              <span className="g-label label absolute -top-1 left-0 hidden -translate-y-full whitespace-nowrap text-[0.58rem] text-muted md:block">
                {t.label}
              </span>
              <div className="g-bar absolute inset-x-0 bottom-0 h-2.5 origin-left overflow-hidden bg-fg/15">
                <div data-fill className="h-full w-full origin-left scale-x-0 bg-fg/60" />
              </div>
              {t.milestone && (
                <span className="g-label absolute -right-1.5 bottom-[-3px] h-3.5 w-3.5 rotate-45 bg-accent md:h-4 md:w-4" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* linea "oggi" */}
      <div data-today className="g-today absolute inset-y-0 left-0 w-px bg-accent will-change-transform">
        <span
          data-today-label
          className="label absolute bottom-[12%] left-2 rounded-sm bg-accent px-1.5 py-0.5 text-[0.6rem] text-black"
        >
          W01
        </span>
      </div>
    </div>
  );
}
