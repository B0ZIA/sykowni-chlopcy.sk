document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.AOS) {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
      disable: prefersReducedMotion
    });
  }

  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  const navbar = document.getElementById('navbar');
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  /* ---------- nawigacja: stan po scrollu ---------- */
  function onScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 20);
    scrollToTopBtn.classList.toggle('show', y > 500);
    updateScrollSpy();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    closeMobileMenu();
  };
  scrollToTopBtn.addEventListener('click', window.scrollToTop);

  /* ---------- menu mobilne ---------- */
  function closeMobileMenu() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) closeMobileMenu();
  });

  /* ---------- płynne przewijanie do sekcji ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      closeMobileMenu();

      const offset = target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight - 12;
      window.scrollTo({ top: Math.max(offset, 0), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- podświetlanie aktywnej sekcji ---------- */
  const sections = document.querySelectorAll('section[id], header[id]');
  const navItems = document.querySelectorAll('.nav-links a');

  function updateScrollSpy() {
    let currentId = '';
    const scrollY = window.scrollY + navbar.offsetHeight + 100;

    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        currentId = sec.getAttribute('id');
      }
    });

    navItems.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }
  updateScrollSpy();

  /* ---------- liczniki w pasku statystyk ---------- */
  const counters = document.querySelectorAll('.stat-num');
  if (counters.length) {
    const runCounter = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = 1200;

      if (prefersReducedMotion || target === 0) {
        el.textContent = `${target}${suffix}`;
        return;
      }

      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  /* ---------- FAQ ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-q');
    const answer = item.querySelector('.faq-a');
    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- formularz kontaktowy ---------- */
  const contactForm = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const formData = new FormData(contactForm);

      const isSK = document.documentElement.lang === 'sk';
      const sendingText = isSK ? 'Odosielanie...' : 'Wysyłanie...';
      const successText = isSK ? 'Ďakujeme! Vaša správa bola odoslaná.' : 'Dziękujemy! Twoja wiadomość została wysłana. Odezwiemy się najszybciej, jak to możliwe.';
      const errorText = isSK ? 'Vyskytla sa chyba. Skúste to prosím znova.' : 'Wystąpił błąd. Spróbuj ponownie lub zadzwoń: +48 574 977 131.';

      formMessage.textContent = sendingText;
      formMessage.className = 'form-message';
      if (submitBtn) submitBtn.disabled = true;

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        });

        if (!response.ok) throw new Error('Server error');

        contactForm.reset();
        formMessage.textContent = successText;
        formMessage.classList.add('success');
      } catch (error) {
        formMessage.textContent = errorText;
        formMessage.classList.add('error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  /* ---------- galeria przed / po ---------- */
  const galleryCards = document.querySelectorAll('.gallery-card');
  const overlay = document.getElementById('lightbox-overlay');
  const beforeImg = document.getElementById('lightbox-before');
  const afterImg = document.getElementById('lightbox-after');
  let currentIndex = 0;
  let lastFocused = null;

  function showLightboxPair(index) {
    const card = galleryCards[index];
    beforeImg.src = card.getAttribute('data-before');
    afterImg.src = card.getAttribute('data-after');
    overlay.style.display = 'flex';
    document.body.classList.add('noscroll');
    currentIndex = index;
  }

  function closeLightbox() {
    overlay.style.display = 'none';
    document.body.classList.remove('noscroll');
    if (lastFocused) lastFocused.focus();
  }

  galleryCards.forEach((card, index) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('click', () => {
      lastFocused = card;
      showLightboxPair(index);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        lastFocused = card;
        showLightboxPair(index);
      }
    });
  });

  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showLightboxPair((currentIndex - 1 + galleryCards.length) % galleryCards.length);
  });

  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showLightboxPair((currentIndex + 1) % galleryCards.length);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('lightbox-content')) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (overlay.style.display !== 'flex') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });
});
