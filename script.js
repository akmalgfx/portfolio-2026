// Akmalgfx — portfolio interactions: mobile nav, work filters, lightbox, scroll reveals.

// ---------- hero background video ----------
// An unsourced <video> still renders as a solid black box in most browsers,
// which is visibly darker than the --ink page background and shows as a
// seam. Keep it hidden until a real <source> is added.

const heroVideo = document.querySelector('.reel-video');

if (heroVideo && !heroVideo.querySelector('source')) {
  heroVideo.style.display = 'none';
}

// ---------- theme toggle ----------
// Dark is the default. The choice is remembered per browser; the inline
// script in <head> re-applies it before first paint.

const themeToggle = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const root = document.documentElement;

function syncThemeUi() {
  const light = root.dataset.theme === 'light';
  themeToggle.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  if (themeMeta) themeMeta.content = light ? '#f7f7f5' : '#0b0b0b';
}

themeToggle.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';

  // swap every colour in one frame; only the icon is allowed to animate
  root.classList.add('theme-switching');
  if (next === 'light') root.dataset.theme = 'light';
  else delete root.dataset.theme;
  getComputedStyle(root).color; // commit the new colours before re-enabling transitions
  setTimeout(() => root.classList.remove('theme-switching'), 0);

  try { localStorage.setItem('theme', next); } catch (e) {}
  syncThemeUi();
});

syncThemeUi();

// ---------- mobile nav ----------

const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');

navToggle.addEventListener('click', () => {
  const open = siteNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(open));
});

// close the menu after choosing a destination
siteNav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    siteNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ---------- work filters ----------

const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.work-card');

filters.forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.filter;

    filters.forEach((b) => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });

    cards.forEach((card) => {
      const show = key === 'all' || card.dataset.category === key;
      card.classList.toggle('is-hidden', !show);
    });
  });
});

// ---------- video lightbox ----------

const lightbox = document.getElementById('lightbox');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxEmbed = document.getElementById('lightbox-embed');
const lightboxClose = document.getElementById('lightbox-close');
let lastTrigger = null;

function openLightbox(trigger) {
  lastTrigger = trigger;
  const youtubeId = trigger.dataset.youtube;

  if (youtubeId) {
    // YouTube embed
    lightboxVideo.hidden = true;
    lightboxEmbed.hidden = false;
    lightboxEmbed.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`;
  } else {
    // self-hosted mp4
    lightboxEmbed.hidden = true;
    lightboxVideo.hidden = false;
    lightboxVideo.src = trigger.dataset.video;
    lightboxVideo.play();
  }

  lightbox.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus({ preventScroll: true });
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  document.body.style.overflow = '';
  // stop the mp4
  lightboxVideo.pause();
  lightboxVideo.removeAttribute('src');
  lightboxVideo.load();
  // stop the YouTube embed
  lightboxEmbed.removeAttribute('src');
  if (lastTrigger) lastTrigger.focus({ preventScroll: true });
}

document.querySelectorAll('.work-play').forEach((btn) => {
  btn.addEventListener('click', () => openLightbox(btn));
});

lightboxClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
});

// ---------- sticky CTA reveal ----------
// Show the floating mobile "Book a call" once the intro's own buttons have
// scrolled out of view.

const mobileCta = document.querySelector('.mobile-cta');
const introActions = document.querySelector('.intro-actions');

if (mobileCta && introActions) {
  let ticking = false;

  const updateCta = () => {
    const scrolledPast = introActions.getBoundingClientRect().bottom <= 0;
    mobileCta.classList.toggle('is-visible', scrolledPast);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateCta);
    }
  }, { passive: true });

  updateCta();
}

// ---------- smooth (inertia) scrolling ----------
// Lightweight Lenis-style momentum scroll: wheel/trackpad input is captured
// and eased toward a target position via a rAF lerp, giving the page a
// buttery, weighted feel. Touch scrolling is left native (custom momentum
// feels wrong under a finger) and the whole thing bows out for
// prefers-reduced-motion and coarse pointers.

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (prefersReduced || isTouch) return;

  const root = document.documentElement;
  root.classList.add('has-smooth-scroll');

  const EASE = 0.09;      // 0–1; lower = heavier / longer glide
  const WHEEL_MULT = 1;   // scale raw wheel delta

  let target = window.scrollY;
  let current = target;
  let running = false;

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const clamp = (v) => Math.max(0, Math.min(v, maxScroll()));

  // Skip the effect while the page is locked (e.g. lightbox open) or when
  // focus is inside a scrollable form control.
  const isLocked = () => document.body.style.overflow === 'hidden';

  function frame() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.4) {
      current = target;
      running = false;
    }
    window.scrollTo(0, current);
    if (running) requestAnimationFrame(frame);
  }

  function start() {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  window.addEventListener('wheel', (e) => {
    if (isLocked() || e.ctrlKey) return; // let pinch-zoom / locked states pass
    e.preventDefault();
    target = clamp(target + e.deltaY * WHEEL_MULT);
    start();
  }, { passive: false });

  // Keep our target in sync when the browser scrolls for reasons we didn't
  // drive (keyboard, scrollbar drag, focus jumps, resize).
  window.addEventListener('scroll', () => {
    if (!running) {
      current = window.scrollY;
      target = current;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    target = clamp(target);
  });

  // Route same-page anchor links (nav, back-to-top, CTAs) through the lerp so
  // they glide with the same easing instead of jumping.
  const HEADER_OFFSET = 64;
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const dest = document.querySelector(id);
      if (!dest) return;
      e.preventDefault();
      const top = dest.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      target = clamp(id === '#top' ? 0 : top);
      start();
    });
  });
})();

// ---------- scroll reveals ----------
// Items fade up a few pixels as they arrive, staggered within their group.
// Two rules keep this from ever stranding content:
//
//   1. Nothing in the first viewport is ever armed, so the opening fold is
//      always painted — no JS and reduced motion still get a finished page.
//   2. What's armed below the fold is released by a timer, not by an
//      IntersectionObserver or requestAnimationFrame. Headless and
//      background renderers skip both, which would leave every armed
//      section blank for the whole visit.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  const GROUPS = [
    // [selector, group selector for the stagger index]
    ['.work-card', '.work-grid'],
    ['.short', '.shorts'],
    ['.ugc-card', '.ugc-grid'],
    ['.service', '.services'],
    ['.about-photo, .about-text', '.about'],
  ];

  // Below this line an element is close enough to the fold to count as
  // already on screen; arming it would just make the first paint incomplete.
  const armLine = () => window.innerHeight * 0.92;

  let armed = [];

  GROUPS.forEach(([selector, groupSel]) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.getBoundingClientRect().top < armLine()) return;

      const group = el.closest(groupSel);
      const siblings = group ? [...group.querySelectorAll(selector)] : [];
      el.dataset.stagger = String(Math.max(0, siblings.indexOf(el)) % 2);
      el.classList.add('will-rise');
      armed.push(el);
    });
  });

  let poll = 0;

  const reveal = () => {
    const line = window.innerHeight - 40;

    armed = armed.filter((el) => {
      if (el.getBoundingClientRect().top > line) return true;
      el.classList.add('is-visible');
      return false;
    });

    if (!armed.length) {
      window.removeEventListener('scroll', reveal);
      window.removeEventListener('resize', reveal);
      clearInterval(poll);
    }
  };

  // A timer, not requestAnimationFrame or an IntersectionObserver: renderers
  // that aren't painting skip both, and every armed section would then stay
  // hidden for the whole visit. reveal() only toggles classes, so it doesn't
  // need to be frame-aligned, and the list shrinks to nothing as it goes —
  // the interval clears itself on the last reveal.
  poll = setInterval(reveal, 150);

  window.addEventListener('scroll', reveal, { passive: true });
  window.addEventListener('resize', reveal);
  reveal();
}
