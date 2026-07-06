// Akmal — portfolio interactions: mobile nav, work filters, scroll reveals.

// ---------- hero background video ----------
// An unsourced <video> still renders as a solid black box in most browsers,
// which is visibly darker than the --ink page background and shows as a
// seam. Keep it hidden until a real <source> is added.

const heroVideo = document.querySelector('.hero-bg-video');

if (heroVideo && !heroVideo.querySelector('source')) {
  heroVideo.style.display = 'none';
}

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

// ---------- hero load reveal cleanup ----------
// animation-fill-mode: forwards keeps these elements permanently promoted to
// their own compositor layer, which can render a faint seam against the
// solid dark background. Drop the animation once it's done so the layer
// is released and the element paints normally again.

document.querySelectorAll('.reveal-1, .reveal-2, .reveal-3, .reveal-4').forEach((el) => {
  el.addEventListener('animationend', () => {
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  }, { once: true });
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
// Show the floating mobile buttons only once the user has scrolled past the
// bottom of the Short Films section.

const ctaGroup = document.querySelector('.mobile-cta-group');
const shortsSection = document.getElementById('shorts');

if (ctaGroup && shortsSection) {
  let ticking = false;

  const updateCta = () => {
    const scrolledPast = shortsSection.getBoundingClientRect().bottom <= 0;
    ctaGroup.classList.toggle('is-visible', scrolledPast);
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
  const HEADER_OFFSET = 80;
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

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.section-head, .work-card, .short, .service, .process li, .about, .tool, .contact-headline');

  targets.forEach((el) => el.classList.add('will-reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}
