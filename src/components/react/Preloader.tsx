import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

type Props = { words: string[]; name: string };

declare global {
  interface Window {
    __introDone?: boolean;
  }
}

function finishIntro() {
  window.__introDone = true;
  window.dispatchEvent(new Event('intro:done'));
  try {
    sessionStorage.setItem('mp-intro', '1');
  } catch {
    /* storage non disponibile: pazienza, il preloader si rivedrà */
  }
}

export default function Preloader({ words, name }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [word, setWord] = useState(0);
  const [gone, setGone] = useState(false);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (document.documentElement.dataset.intro === 'seen') {
      setGone(true);
      finishIntro();
      return;
    }

    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setGone(true);
        },
      });
      tl.from('.pl-bar', { scaleX: 0, duration: 0.6, ease: 'power3.out' })
        .to(
          counter,
          {
            v: 100,
            duration: 2.1,
            ease: 'power2.inOut',
            onUpdate: () => {
              const v = Math.round(counter.v);
              setCount(v);
              setWord(Math.min(words.length - 1, Math.floor((v / 100) * words.length)));
            },
          },
          0.1,
        )
        .to('.pl-progress', { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0.1)
        .to('.pl-inner', { yPercent: -30, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, '+=0.15')
        // la chiusura del sipario avvia l'intro dell'hero a metà corsa;
        // setTimeout fa partire gli ascoltatori fuori dal gsap.context del preloader
        .add(() => setTimeout(finishIntro, 0), '-=0.1')
        .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '<');
    }, el);
    return () => ctx.revert();
  }, [words.length]);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="preloader fixed inset-0 z-[100] bg-fg text-bg"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
      aria-hidden="true"
    >
      <div className="pl-inner wrap flex h-full flex-col justify-between py-6">
        <div className="label flex justify-between">
          <span>{name}</span>
          <span>Caricamento</span>
        </div>

        <div className="relative h-[1.1em] overflow-hidden display text-[clamp(3.5rem,14vw,13rem)]">
          {words.map((w, i) => (
            <span
              key={w}
              className="absolute inset-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{
                transform: `translateY(${(i - word) * 100}%)`,
                opacity: i === word ? 1 : 0,
                fontStyle: i === words.length - 1 ? 'italic' : undefined,
              }}
            >
              {w}
              {i === words.length - 1 ? '.' : ''}
            </span>
          ))}
        </div>

        <div>
          <div className="flex items-end justify-between">
            <span className="label">Roma, IT</span>
            <span className="display tabular-nums text-[clamp(3rem,9vw,8rem)] leading-none">
              {String(count).padStart(3, '0')}
            </span>
          </div>
          <div className="pl-bar mt-4 h-px origin-left bg-bg/25">
            <div className="pl-progress h-px origin-left scale-x-0 bg-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}
