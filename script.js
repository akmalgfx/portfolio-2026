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
const lightboxClose = document.getElementById('lightbox-close');
let lastTrigger = null;

function openLightbox(trigger) {
  lastTrigger = trigger;
  lightboxVideo.src = trigger.dataset.video;
  lightbox.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  lightboxVideo.play();
  lightboxClose.focus({ preventScroll: true });
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  document.body.style.overflow = '';
  lightboxVideo.pause();
  lightboxVideo.removeAttribute('src');
  lightboxVideo.load();
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
