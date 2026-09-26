import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

/**
 * Motore delle animazioni. Le sezioni dichiarano cosa animare con attributi data-*:
 *   data-split="lines"      titolo che entra riga per riga (mascherato)
 *   data-split="hero"       come sopra, ma parte a fine preloader
 *   data-reveal             dissolvenza dal basso (="stagger" per animare i figli)
 *   data-scrub-words        testo che si "accende" parola per parola scrollando
 *   data-count              numero che conta fino al suo valore
 *   data-marquee            nastro che scorre e reagisce alla velocità di scroll
 *   data-magnetic           elemento attratto dal mouse
 *   data-theme="light"      la pagina passa ai colori chiari mentre la sezione è in vista
 *   data-horizontal         sezione che scorre in orizzontale (desktop)
 *   data-stack              card impilate che si rimpiccioliscono
 *   data-progress-line      linea che cresce con lo scroll
 */

gsap.registerPlugin(ScrollTrigger, SplitText);

const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel)) as T[];

function whenIntroDone(fn: () => void) {
  if (window.__introDone) fn();
  else window.addEventListener('intro:done', fn, { once: true });
}

/* ---------- Scroll fluido ---------- */
function initLenis() {
  const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  if (!window.__introDone) {
    lenis.stop();
    whenIntroDone(() => lenis.start());
  }

  // ancore interne gestite da Lenis
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href')!;
    const target = href === '#' || href === '#top' ? 0 : document.querySelector<HTMLElement>(href);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.6 });
    history.replaceState(null, '', href === '#' ? ' ' : href);
  });
  return lenis;
}

/* ---------- Titoli riga per riga ---------- */
function initSplits() {
  $$('[data-split]').forEach((el) => {
    const hero = el.dataset.split === 'hero';
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        const tween = gsap.from(self.lines, {
          yPercent: 115,
          rotate: hero ? 4 : 2,
          transformOrigin: '0% 100%',
          duration: hero ? 1.5 : 1.2,
          stagger: hero ? 0.12 : 0.09,
          ease: 'expo.out',
          delay: Number(el.dataset.delay ?? 0),
          paused: hero,
          scrollTrigger: hero ? undefined : { trigger: el, start: 'top 88%', once: true },
        });
        if (hero) whenIntroDone(() => tween.restart(true));
        return tween;
      },
    });
  });
}

/* ---------- Dissolvenze ---------- */
function initReveals() {
  $$('[data-reveal]').forEach((el) => {
    const stagger = el.dataset.reveal === 'stagger';
    const targets = stagger ? Array.from(el.children) : [el];
    const intro = el.dataset.revealIntro !== undefined;
    gsap.set(el, { visibility: 'visible' });
    const tween = gsap.from(targets, {
      y: 40,
      autoAlpha: 0,
      duration: 1.1,
      stagger: 0.08,
      ease: 'expo.out',
      delay: intro ? 0.6 : 0,
      paused: intro,
      scrollTrigger: intro ? undefined : { trigger: el, start: 'top 90%', once: true },
    });
    if (intro) whenIntroDone(() => tween.restart(true));
  });
}

/* ---------- Testo che si accende ---------- */
function initScrubWords() {
  $$('[data-scrub-words]').forEach((el) => {
    const split = SplitText.create(el.querySelectorAll('p'), { type: 'words' });
    gsap.fromTo(
      split.words,
      { opacity: 0.14 },
      {
        opacity: 1,
        stagger: 0.05,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 55%', scrub: 0.6 },
      },
    );
  });
}

/* ---------- Contatori ---------- */
function initCounters() {
  $$('[data-count]').forEach((el) => {
    const raw = el.textContent?.trim() ?? '';
    const m = raw.match(/^(\d+)(.*)$/);
    if (!m) return;
    const end = Number(m[1]);
    const rest = m[2];
    // anni tipo "2014": si parte da vicino, non da zero
    const from = end > 1900 ? end - 40 : 0;
    const o = { v: from };
    gsap.to(o, {
      v: end,
      duration: 2,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = Math.round(o.v) + rest),
    });
  });
}

/* ---------- Nastro che scorre ---------- */
function initMarquees(lenis: Lenis) {
  $$('[data-marquee]').forEach((el) => {
    const track = el.querySelector<HTMLElement>('[data-marquee-track]')!;
    // scorre sempre verso sinistra a velocità costante; lo scroll aggiunge solo una spinta
    const base = Number(el.dataset.marquee) || 40; // px al secondo
    let x = 0;
    let boost = 0;
    let skew = 0;
    gsap.ticker.add((_, delta) => {
      const v = lenis.velocity ?? 0;
      boost += (Math.min(Math.abs(v) * 25, 600) - boost) * 0.08;
      x -= ((base + boost) * delta) / 1000;
      const half = track.scrollWidth / 2;
      if (half > 0) x %= half;
      skew += (gsap.utils.clamp(-8, 8, -v * 0.35) - skew) * 0.1;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
    });
  });
}

/* ---------- Magnetismo ---------- */
function initMagnetic() {
  if (!matchMedia('(pointer: fine)').matches) return;
  $$('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ---------- Cambio tema ---------- */
function initThemes() {
  $$('[data-theme="light"]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => html.classList.toggle('theme-light', self.isActive),
    });
  });
}

/* ---------- Scorrimento orizzontale ---------- */
function initHorizontal() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    $$('[data-horizontal]').forEach((section) => {
      const track = section.querySelector<HTMLElement>('[data-horizontal-track]')!;
      const bar = section.querySelector<HTMLElement>('[data-horizontal-bar]');
      const distance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => bar && (bar.style.transform = `scaleX(${self.progress})`),
        },
      });
      // le card si inclinano leggermente mentre scorrono
      $$('[data-horizontal-card]', section).forEach((card) => {
        gsap.fromTo(
          card,
          { rotate: 3, y: 60 },
          {
            rotate: 0,
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: 'left 100%',
              end: 'left 45%',
              scrub: true,
            },
          },
        );
      });
    });
  });
}

/* ---------- Card impilate ---------- */
function initStacks() {
  $$('[data-stack]').forEach((stack) => {
    const cards = $$('[data-stack-card]', stack);
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      gsap.fromTo(card, { scale: 1, filter: 'brightness(1)' }, {
        scale: 0.92,
        filter: 'brightness(0.88)',
        ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true },
      });
    });
  });
}

/* ---------- Linee di avanzamento ---------- */
function initProgressLines() {
  $$('[data-progress-line]').forEach((line) => {
    gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: line.parentElement, start: 'top 70%', end: 'bottom 60%', scrub: true },
      },
    );
  });
}

/* ---------- Navigazione che si nasconde scendendo ---------- */
function initNav(lenis: Lenis) {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;
  let hidden = false;
  lenis.on('scroll', ({ scroll, direction }: { scroll: number; direction: number }) => {
    const hide = scroll > 200 && direction === 1;
    if (hide === hidden) return;
    hidden = hide;
    gsap.to(nav, { yPercent: hide ? -120 : 0, duration: 0.6, ease: 'expo.out' });
  });
}

async function init() {
  html.classList.add('motion-ready');
  if (reduced) {
    html.classList.remove('motion');
    return;
  }
  await document.fonts.ready;
  const lenis = initLenis();
  initSplits();
  initReveals();
  initScrubWords();
  initCounters();
  initMarquees(lenis);
  initMagnetic();
  initHorizontal();
  initStacks();
  initProgressLines();
  initThemes();
  initNav(lenis);
  // i trigger creati prima del pin orizzontale ma posti dopo di esso vanno ricalcolati in ordine
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

init();
