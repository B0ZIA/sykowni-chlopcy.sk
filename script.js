/* =========================================================
   Sykowni Chłopcy – logika strony
   Bez zależności zewnętrznych: odsłanianie sekcji, nawigacja,
   galeria przed/po, opinie z Google i formularz kontaktowy.
   ========================================================= */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  /* ---------- teksty budowane w JS ----------
     Plik jest wspólny dla sykowni-chlopcy.pl i sykowni-chlopcy.sk, więc
     każdy komunikat, który nie stoi w HTML-u, ma tu obie wersje językowe.
     Wersję wybiera atrybut lang na <html> – innych przełączników nie ma. */
  const STRINGS = {
    pl: {
      menuOpen: 'Otwórz menu',
      menuClose: 'Zamknij menu',
      formSending: 'Wysyłanie...',
      formSuccess: 'Dziękujemy! Twoja wiadomość została wysłana. Odezwiemy się najszybciej, jak to możliwe.',
      formError: 'Wystąpił błąd. Spróbuj ponownie za chwilę.',
      formErrorPhone: phone => `Wystąpił błąd. Spróbuj ponownie lub zadzwoń: ${phone}.`,
      formInvalid: 'Sprawdź proszę zaznaczone pola.',
      fieldRequired: 'To pole jest wymagane.',
      fieldEmail: 'Podaj poprawny adres e-mail.',
      fieldShort: 'Napisz proszę chociaż kilka słów.',
      reviewMore: 'Czytaj więcej',
      reviewLess: 'Zwiń',
      reviewAuthorFallback: 'Klient Google',
      /* po „na podstawie" liczebnik zawsze łączy się z dopełniaczem: 3 opinii, 5 opinii */
      reviewsBasedOn: count => `na podstawie ${count} opinii`,
      reviewsPage: page => `Opinie – strona ${page}`,
      ratingLabel: rating => `Ocena ${rating} na 5`,
      lightboxTitle: 'Porównanie przed i po',
      lightboxFallbackLabel: 'realizacja',
      lightboxShot: (index, total) => ` (ujęcie ${index} z ${total})`,
      lightboxBeforeAlt: label => `${label} – stan przed pracami`,
      lightboxAfterAlt: label => `${label} – stan po pracach`,
      lightboxThumb: (scope, index, total) => `${scope} – ujęcie ${index} z ${total}`,
      pinLabel: (number, text) => `Szczegół ${number}: ${text}`
    },
    sk: {
      menuOpen: 'Otvoriť menu',
      menuClose: 'Zavrieť menu',
      formSending: 'Odosielanie...',
      formSuccess: 'Ďakujeme! Vaša správa bola odoslaná. Ozveme sa čo najskôr.',
      formError: 'Vyskytla sa chyba. Skúste to prosím o chvíľu znova.',
      formErrorPhone: phone => `Vyskytla sa chyba. Skúste to prosím znova alebo zavolajte: ${phone}.`,
      formInvalid: 'Skontrolujte prosím zvýraznené polia.',
      fieldRequired: 'Toto pole je povinné.',
      fieldEmail: 'Zadajte platnú e-mailovú adresu.',
      fieldShort: 'Napíšte prosím aspoň pár slov.',
      reviewMore: 'Čítať viac',
      reviewLess: 'Zbaliť',
      reviewAuthorFallback: 'Zákazník Google',
      reviewsBasedOn: count => `na základe ${count} hodnotení`,
      reviewsPage: page => `Hodnotenia – strana ${page}`,
      ratingLabel: rating => `Hodnotenie ${rating} z 5`,
      lightboxTitle: 'Porovnanie pred a po',
      lightboxFallbackLabel: 'realizácia',
      lightboxShot: (index, total) => ` (záber ${index} z ${total})`,
      lightboxBeforeAlt: label => `${label} – stav pred prácami`,
      lightboxAfterAlt: label => `${label} – stav po prácach`,
      lightboxThumb: (scope, index, total) => `${scope} – záber ${index} z ${total}`,
      pinLabel: (number, text) => `Detail ${number}: ${text}`
    }
  };

  const t = STRINGS[document.documentElement.lang] || STRINGS.pl;

  /* Numer do oddzwonienia bierzemy z sekcji kontaktu, żeby komunikat o błędzie
     wysyłki nie rozjeżdżał się z tym, co widać na stronie – a przy okazji ten
     sam plik obsługuje polski i słowacki numer bez osobnej stałej. */
  const phoneNumber = document.querySelector('.contact-info a[href^="tel:"] p')?.textContent.trim() || '';

  /* ikony pochodzą ze sprite'a wklejonego na początku <body>;
     w kodzie budujemy taki sam znacznik, jaki jest w HTML-u */
  function icon(name, className) {
    const wrap = document.createElement('i');
    wrap.className = className ? `ico ${className}` : 'ico';
    wrap.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${name}`);
    svg.appendChild(use);
    wrap.appendChild(svg);
    return wrap;
  }

  /* ---------- odsłanianie sekcji przy przewijaniu ---------- */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -70px 0px', threshold: 0.01 });

    items.forEach(el => {
      if (el.dataset.revealDelay) el.style.setProperty('--reveal-delay', `${el.dataset.revealDelay}ms`);
      observer.observe(el);
    });

    /* siatka bezpieczeństwa: gdyby obserwator się nie odezwał (karta otwarta
       w tle, nietypowa przeglądarka), po chwili pokazujemy to, co i tak
       mieści się na ekranie – treść nigdy nie zostaje niewidoczna */
    setTimeout(() => {
      items.forEach(el => {
        if (el.classList.contains('is-revealed')) return;
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('is-revealed');
      });
    }, 2500);
  }

  /* elementy dosłane później (np. karty opinii) też mają wjechać płynnie */
  function revealLater(root) {
    root.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach(el => el.classList.add('is-revealed'));
  }

  const navbar = document.getElementById('navbar');
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  /* ---------- nawigacja: cień paska i przycisk „do góry" ---------- */
  function initScrollState() {
    if (!navbar || !scrollToTopBtn) return;
    let ticking = false;
    const apply = () => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 20);
      scrollToTopBtn.classList.toggle('show', y > 500);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }, { passive: true });
    apply();
  }

  /* ---------- podświetlanie aktywnej sekcji ----------
     Obserwator zamiast liczenia offsetTop przy każdym pikselu przewijania:
     ta sama funkcja, ale bez wymuszania przeliczeń układu strony. */
  function initScrollSpy() {
    const sections = Array.from(document.querySelectorAll('main section[id], main header[id]'));
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (!sections.length || !links.length || !('IntersectionObserver' in window)) return;

    const visible = new Set();
    const mark = () => {
      const current = sections.find(section => visible.has(section));
      const hash = current ? `#${current.id}` : '';
      links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === hash));
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      mark();
    }, { rootMargin: '-90px 0px -55% 0px', threshold: 0 });

    sections.forEach(section => observer.observe(section));
  }

  /* ---------- menu mobilne ---------- */
  function closeMobileMenu() {
    if (!navLinks.classList.contains('open')) return;
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', t.menuOpen);
  }

  function initMobileMenu() {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? t.menuClose : t.menuOpen);
      /* menu wjeżdża z visibility:hidden – fokus da się przenieść dopiero
         po przemalowaniu, inaczej przeglądarka go ignoruje */
      if (open) {
        requestAnimationFrame(() => {
          const first = navLinks.querySelector('a');
          if (first && navLinks.classList.contains('open')) first.focus();
        });
      }
    });

    document.addEventListener('click', e => {
      if (!navLinks.classList.contains('open')) return;
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) closeMobileMenu();
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !navLinks.classList.contains('open')) return;
      closeMobileMenu();
      hamburger.focus();
    });
  }

  /* ---------- wybór wersji językowej ---------- */
  function initLangMenu() {
    const toggle = document.getElementById('lang-toggle');
    const menu = document.getElementById('lang-menu');
    if (!toggle || !menu) return;

    const close = () => {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', e => {
      if (!menu.hidden && !menu.contains(e.target)) close();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !menu.hidden) {
        close();
        toggle.focus();
      }
    });
  }

  /* ---------- płynne przewijanie do sekcji ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        closeMobileMenu();

        const offset = target.getBoundingClientRect().top + window.scrollY - (navbar?.offsetHeight || 0) - 12;
        window.scrollTo({ top: Math.max(offset, 0), behavior: scrollBehavior });
        /* adres w pasku ma odpowiadać temu, co widać – bez skoku strony */
        if (history.replaceState) history.replaceState(null, '', targetId);
      });
    });

    scrollToTopBtn?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: scrollBehavior });
      closeMobileMenu();
    });
  }

  /* ---------- liczniki w pasku statystyk ---------- */
  function initCounters() {
    const counters = document.querySelectorAll('.stat-num');
    if (!counters.length) return;

    const run = el => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = 1200;

      if (prefersReducedMotion || target === 0) {
        el.textContent = `${target}${suffix}`;
        return;
      }

      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    const items = Array.from(document.querySelectorAll('.faq-item'));

    const collapse = item => {
      const answer = item.querySelector('.faq-a');
      item.classList.remove('open');
      answer.style.maxHeight = null;
      answer.inert = true;
      item.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    };

    items.forEach(item => {
      const question = item.querySelector('.faq-q');
      const answer = item.querySelector('.faq-a');
      if (!question || !answer) return;

      /* zwinięta odpowiedź jest niewidoczna, więc nie może też łapać fokusu */
      answer.inert = true;

      question.addEventListener('click', () => {
        const wasOpen = item.classList.contains('open');
        items.filter(other => other.classList.contains('open')).forEach(collapse);
        if (wasOpen) return;

        item.classList.add('open');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
        answer.inert = false;
        question.setAttribute('aria-expanded', 'true');
      });
    });

    /* po zmianie szerokości okna tekst zajmuje inną liczbę linii */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        items.filter(item => item.classList.contains('open')).forEach(item => {
          const answer = item.querySelector('.faq-a');
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        });
      }, 150);
    });
  }

  /* ---------- formularz kontaktowy ---------- */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');
    if (!form || !formMessage) return;

    const errorMessage = phoneNumber ? t.formErrorPhone(phoneNumber) : t.formError;

    const setFieldError = (field, message) => {
      const group = field.closest('.form-group');
      const box = group ? group.querySelector('.field-error') : null;
      group?.classList.toggle('has-error', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (!box) return;
      box.textContent = message || '';
      box.hidden = !message;
    };

    const validateField = field => {
      const value = field.value.trim();
      if (field.required && !value) return t.fieldRequired;
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return t.fieldEmail;
      if (field.tagName === 'TEXTAREA' && value && value.length < 5) return t.fieldShort;
      return '';
    };

    const fields = Array.from(form.querySelectorAll('input[required], textarea[required]'));
    fields.forEach(field => {
      /* komunikat znika, gdy tylko pole zostanie poprawione */
      field.addEventListener('input', () => {
        if (field.closest('.form-group')?.classList.contains('has-error')) {
          setFieldError(field, validateField(field));
        }
      });
      field.addEventListener('blur', () => setFieldError(field, validateField(field)));
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      let firstInvalid = null;
      fields.forEach(field => {
        const message = validateField(field);
        setFieldError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        formMessage.textContent = t.formInvalid;
        formMessage.className = 'form-message error';
        firstInvalid.focus();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      formMessage.textContent = t.formSending;
      formMessage.className = 'form-message';
      if (submitBtn) submitBtn.disabled = true;

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        });
        if (!response.ok) throw new Error('Server error');

        form.reset();
        fields.forEach(field => setFieldError(field, ''));
        formMessage.textContent = t.formSuccess;
        formMessage.className = 'form-message success';
      } catch (error) {
        formMessage.textContent = errorMessage;
        formMessage.className = 'form-message error';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  /* ---------- opinie: dane z wizytówki Google ----------
     reviews.json wypełnia raz na dobę GitHub Action (tools/fetch_reviews.py).
     Sekcja startuje ukryta i pokazuje się dopiero przy komplecie opinii –
     mniej niż MIN_REVIEWS wygląda gorzej niż brak sekcji w ogóle. */
  const MIN_REVIEWS = 2;

  /* ---------- przełącznik sekcji „Jak pracujemy" / „Ako pracujeme" ----------
     true  – sekcja widoczna razem z odnośnikami w menu, w stopce i w bloku
             „O firmie";
     false – sekcja i wszystkie odnośniki do niej znikają.
     Przy false sekcja mignie na ułamek sekundy, zanim skrypt zdąży ją schować –
     skrypt jest wczytywany z defer. */
  const SHOW_PROCESS = false;

  const GOOGLE_G_SVG = `
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
    </svg>`;

  function buildStars(rating) {
    const stars = document.createElement('div');
    stars.className = 'rv-stars';
    stars.setAttribute('role', 'img');
    stars.setAttribute('aria-label', t.ratingLabel(rating));
    for (let i = 1; i <= 5; i++) {
      stars.appendChild(icon(i <= Math.round(rating) ? 'i-star' : 'i-star-o', i <= Math.round(rating) ? '' : 'is-empty'));
    }
    return stars;
  }

  function buildReviewCard(review) {
    const card = document.createElement('article');
    card.className = 'review-card';

    const head = document.createElement('div');
    head.className = 'rv-head';

    const avatar = document.createElement('span');
    avatar.className = 'rv-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.style.setProperty('--av', review.color || '#1A73E8');
    avatar.textContent = review.initials || '?';
    if (review.photo) {
      const photo = document.createElement('img');
      photo.className = 'rv-photo';
      photo.src = review.photo;
      photo.alt = '';
      photo.loading = 'lazy';
      photo.referrerPolicy = 'no-referrer';
      photo.addEventListener('error', () => photo.remove());
      avatar.appendChild(photo);
    }

    const meta = document.createElement('div');
    meta.className = 'rv-meta';
    const name = document.createElement('strong');
    name.textContent = review.author || t.reviewAuthorFallback;
    const time = document.createElement('span');
    time.textContent = review.relativeTime || '';
    meta.append(name, time);

    const logo = document.createElement('span');
    logo.className = 'rv-g';
    logo.setAttribute('aria-hidden', 'true');
    logo.innerHTML = GOOGLE_G_SVG;

    head.append(avatar, meta, logo);

    const text = document.createElement('p');
    text.className = 'rv-text';
    text.textContent = review.text || '';

    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'rv-more';
    more.textContent = t.reviewMore;

    card.append(head, buildStars(review.rating || 5), text, more);
    return card;
  }

  function renderGoogleReviews(data, track) {
    if (!data || !Array.isArray(data.reviews) || data.reviews.length < MIN_REVIEWS) return false;

    track.replaceChildren(...data.reviews.map(buildReviewCard));

    const summary = document.querySelector('.google-card');
    if (!summary) return true;

    const count = data.ratingCount || data.reviews.length;
    const rating = typeof data.rating === 'number'
      ? data.rating
      : data.reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / data.reviews.length;

    const num = summary.querySelector('.gc-num');
    if (num) num.textContent = rating.toFixed(1).replace('.', ',');

    const oldStars = summary.querySelector('.rv-stars');
    if (oldStars) oldStars.replaceWith(buildStars(rating));

    const counter = summary.querySelector('.gc-count');
    if (counter) counter.textContent = t.reviewsBasedOn(count);

    const profile = summary.querySelector('a[href*="google"]');
    if (profile && data.profileUrl) profile.href = data.profileUrl;

    /* rozkład ocen pokazujemy tylko wtedy, gdy mamy komplet opinii –
       Google udostępnia treść najwyżej pięciu, więc przy większej liczbie byłby zmyślony */
    const bars = summary.querySelector('.gc-bars');
    if (bars) {
      if (data.reviews.length >= count) {
        Array.from(bars.querySelectorAll('li')).forEach((row, index) => {
          const stars = 5 - index;
          const share = data.reviews.filter(r => Math.round(r.rating || 5) === stars).length / count * 100;
          row.querySelector('.gc-bar i').style.setProperty('--w', `${share}%`);
        });
      } else {
        bars.remove();
      }
    }

    return true;
  }

  async function loadGoogleReviews(track) {
    try {
      const response = await fetch('reviews.json', { cache: 'no-cache' });
      if (!response.ok) return false;
      return renderGoogleReviews(await response.json(), track);
    } catch (error) {
      /* brak pliku albo błąd sieci – sekcja zostaje ukryta */
      if (location.protocol === 'file:') {
        console.info(
          'Opinie: przeglądarka blokuje wczytanie reviews.json przy otwarciu strony jako plik (file://). ' +
          'Uruchom podgląd przez serwer, np. „python -m http.server 4173" i wejdź na http://localhost:4173.'
        );
      }
      return false;
    }
  }

  function revealReviewsSection() {
    document.querySelectorAll('#reviews, .js-reviews-link').forEach(el => { el.hidden = false; });
    const section = document.getElementById('reviews');
    if (section) revealLater(section);
  }

  /* ---------- karuzela opinii ---------- */
  function initReviewsCarousel(track) {
    const cards = Array.from(track.querySelectorAll('.review-card'));
    const dots = document.getElementById('reviews-dots');
    const prev = document.getElementById('reviews-prev');
    const next = document.getElementById('reviews-next');
    if (!cards.length || !dots || !prev || !next) return;

    /* szerokość jednej karty razem z odstępem */
    const cardStep = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);
    const perView = () => Math.max(1, Math.round(track.clientWidth / cardStep()));
    const pageCount = () => Math.max(1, Math.ceil(cards.length / perView()));
    const currentPage = () => Math.min(
      Math.round(track.scrollLeft / (cardStep() * perView())),
      pageCount() - 1
    );

    function scrollToPage(page) {
      const index = Math.min(Math.max(page, 0) * perView(), cards.length - 1);
      track.scrollTo({ left: cards[index].offsetLeft - cards[0].offsetLeft, behavior: scrollBehavior });
    }

    function syncControls() {
      const page = currentPage();
      Array.from(dots.children).forEach((dot, i) => {
        dot.classList.toggle('is-active', i === page);
        dot.setAttribute('aria-current', i === page ? 'true' : 'false');
      });
      prev.disabled = page === 0;
      next.disabled = page >= pageCount() - 1;
    }

    function buildDots() {
      dots.replaceChildren();
      for (let i = 0; i < pageCount(); i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', t.reviewsPage(i + 1));
        dot.addEventListener('click', () => scrollToPage(i));
        dots.appendChild(dot);
      }
      syncControls();
    }

    /* „czytaj więcej" pokazujemy tylko tam, gdzie tekst faktycznie się nie mieści */
    function checkClamped() {
      cards.forEach(card => {
        if (card.classList.contains('expanded')) return;
        const text = card.querySelector('.rv-text');
        if (!text) return;
        card.classList.toggle('has-more', text.scrollHeight - text.clientHeight > 4);
      });
    }

    cards.forEach(card => {
      const moreBtn = card.querySelector('.rv-more');
      if (!moreBtn) return;
      moreBtn.addEventListener('click', () => {
        const expanded = card.classList.toggle('expanded');
        moreBtn.textContent = expanded ? t.reviewLess : t.reviewMore;
      });
    });

    prev.addEventListener('click', () => scrollToPage(currentPage() - 1));
    next.addEventListener('click', () => scrollToPage(currentPage() + 1));
    track.addEventListener('scroll', syncControls, { passive: true });

    const refresh = () => {
      buildDots();
      checkClamped();
    };

    /* Liczba kropek zależy od tego, ile kart mieści się w kadrze, a to znamy
       dopiero po ułożeniu sekcji – którą odsłaniamy przed chwilą. Obserwator
       przelicza je przy każdej zmianie szerokości toru, więc łapie zarówno
       pierwsze ułożenie, jak i późniejsze obracanie ekranu. */
    if ('ResizeObserver' in window) {
      let lastWidth = 0;
      new ResizeObserver(() => {
        const width = Math.round(track.clientWidth);
        if (width === lastWidth) return;
        lastWidth = width;
        refresh();
      }).observe(track);
    } else {
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refresh, 200);
      });
    }

    refresh();
    /* po dociągnięciu fontów wysokość tekstu potrafi się zmienić */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkClamped);
  }

  function initReviews() {
    const track = document.getElementById('reviews-track');
    if (!track) return;
    loadGoogleReviews(track).then(hasReviews => {
      if (!hasReviews) return;
      /* karuzelę mierzymy dopiero po odsłonięciu sekcji – ukryta nie ma wymiarów */
      revealReviewsSection();
      initReviewsCarousel(track);
    });
  }

  /* ---------- galeria przed / po ----------
     Kafelek to jedna budowa, a nie pojedyncze zdjęcie: wszystkie ujęcia
     z danej realizacji siedzą w jego <template> i przełącza się je
     miniaturami w powiększeniu. Poniżej spłaszczamy je do jednej listy,
     żeby strzałki prowadziły przez całą galerię bez przerwy. */
  const galleryCards = Array.from(document.querySelectorAll('.gallery-card'));

  const galleryPairs = galleryCards.flatMap(card => {
    const template = card.querySelector('.gc-pairs');
    if (!template) return [];
    /* Opis stoi raz przy budowie; pojedyncze ujęcie może go nadpisać własnym.
       Szukamy po children, bo :scope nie działa na DocumentFragment. */
    const shared = Array.from(template.content.children).find(el => el.tagName === 'P');
    const figures = Array.from(template.content.querySelectorAll('figure'));

    return figures.map((figure, index) => ({
      card,
      before: figure.dataset.before,
      after: figure.dataset.after,
      desc: (figure.querySelector('p') || shared || {}).textContent || '',
      notes: Array.from(figure.querySelectorAll('li')),
      index,
      total: figures.length
    }));
  });

  /* Zdjęcie „przed" waży tyle samo co „po", a widać je dopiero po najechaniu –
     nie ma powodu ściągać dziewięciu dodatkowych fotografii na wejściu.
     Podmieniamy źródło przy pierwszym zbliżeniu kursora albo fokusie. */
  function initBeforePreviews() {
    galleryCards.forEach(card => {
      const before = card.querySelector('.gc-before');
      const trigger = card.querySelector('.gc-open');
      if (!before || !trigger || !before.dataset.src) return;

      /* Blokada musi być wspólna dla obu zdarzeń: po zamknięciu powiększenia
         fokus wraca na kafelek, więc drugi nasłuch odpalał się ponownie
         i podstawiał już usunięty adres, kasując wczytane zdjęcie. */
      let started = false;
      const load = () => {
        if (started) return;
        started = true;
        before.addEventListener('load', () => card.classList.add('has-before'), { once: true });
        before.src = before.dataset.src;
        delete before.dataset.src;
      };

      trigger.addEventListener('pointerenter', load);
      trigger.addEventListener('focus', load);
    });
  }

  /* ---------- podgląd przed / po ---------- */
  function initLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    if (!overlay || !galleryPairs.length) return;

    const beforeImg = document.getElementById('lightbox-before');
    const afterImg = document.getElementById('lightbox-after');
    const lbPlace = document.getElementById('lightbox-place');
    const lbTitle = document.getElementById('lightbox-title');
    const lbCounter = document.getElementById('lightbox-counter');
    const lbDesc = document.getElementById('lightbox-desc');
    const lbFacts = document.getElementById('lightbox-facts');
    const lbThumbs = document.getElementById('lightbox-thumbs');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const frames = {
      before: document.getElementById('lightbox-frame-before'),
      after: document.getElementById('lightbox-frame-after')
    };

    let currentIndex = 0;
    let lastFocused = null;

    /* dymek przy pinezce z brzegu zdjęcia wyjechałby poza ekran – przesuwamy go do środka */
    function clampPinLabel(pin) {
      const label = pin.querySelector('.lb-pin-label');
      if (!label) return;
      label.style.left = '50%';
      label.style.setProperty('--shift', '0px');
      const box = label.getBoundingClientRect();
      const margin = 12;
      let shift = 0;
      if (box.left < margin) shift = margin - box.left;
      else if (box.right > window.innerWidth - margin) shift = window.innerWidth - margin - box.right;
      shift = Math.round(shift);
      if (!shift) return;
      label.style.left = `calc(50% + ${shift}px)`;
      /* dziobek zostaje nad kropką */
      label.style.setProperty('--shift', `${shift}px`);
    }

    function buildPins(notes) {
      Object.values(frames).forEach(frame => {
        frame.querySelectorAll('.lb-pin').forEach(pin => pin.remove());
      });
      if (!notes.length) return;

      notes.forEach((note, i) => {
        const number = i + 1;
        const text = note.textContent.trim();
        const frame = frames[note.dataset.side === 'before' ? 'before' : 'after'];

        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'lb-pin';
        pin.style.left = `${note.dataset.x || 50}%`;
        pin.style.top = `${note.dataset.y || 50}%`;
        pin.setAttribute('aria-label', t.pinLabel(number, text));

        const dot = document.createElement('span');
        dot.className = 'lb-pin-dot';
        dot.textContent = number;

        const label = document.createElement('span');
        label.className = 'lb-pin-label';
        label.textContent = text;

        /* na dotyku nie ma najechania, więc kliknięcie przypina dymek */
        pin.addEventListener('click', e => {
          e.stopPropagation();
          const open = pin.classList.contains('is-open');
          overlay.querySelectorAll('.lb-pin.is-open').forEach(p => p.classList.remove('is-open'));
          pin.classList.toggle('is-open', !open);
          if (!open) clampPinLabel(pin);
        });
        pin.addEventListener('mouseenter', () => clampPinLabel(pin));
        pin.addEventListener('focus', () => clampPinLabel(pin));

        pin.append(dot, label);
        frame.appendChild(pin);
      });
    }

    /* sąsiednie ujęcia wczytujemy w tle, żeby strzałki działały od razu */
    function prefetchNeighbours(index) {
      [-1, 1].forEach(step => {
        const pair = galleryPairs[(index + step + galleryPairs.length) % galleryPairs.length];
        [pair.before, pair.after].forEach(src => { if (src) new Image().src = src; });
      });
    }

    /* pasek miniatur prowadzi po ujęciach z tej samej budowy;
       przy jednym ujęciu nie ma czego przełączać, więc znika */
    function buildThumbs(index) {
      const current = galleryPairs[index];
      if (current.total < 2) {
        lbThumbs.hidden = true;
        lbThumbs.replaceChildren();
        return;
      }

      const first = index - current.index;
      const scope = current.card.dataset.scope || '';

      lbThumbs.replaceChildren(...Array.from({ length: current.total }, (unused, i) => {
        const pair = galleryPairs[first + i];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lb-thumb';
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', String(i === current.index));
        button.setAttribute('aria-label', t.lightboxThumb(scope, i + 1, current.total));

        const img = document.createElement('img');
        img.src = pair.after;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';

        const num = document.createElement('span');
        num.className = 'lb-thumb-num';
        num.textContent = i + 1;

        button.append(img, num);
        button.addEventListener('click', () => show(first + i));
        return button;
      }));
      lbThumbs.hidden = false;
    }

    /* Ramka musi dokładnie pokrywać się z kadrem: inaczej po bokach zostaje
       puste tło, a pinezki rozjeżdżają się względem zdjęcia. Sam CSS tego nie
       policzy – aspect-ratio przycina tylko jedną oś naraz – więc wpisujemy
       rozmiar wprost, dopasowany do miejsca, jakie zostało w scenie. */
    function fitFrame(img, frame) {
      if (!img.naturalWidth) return;
      const figure = frame.parentElement;
      const box = figure.getBoundingClientRect();
      if (!box.width || !box.height) return;

      const ratio = img.naturalWidth / img.naturalHeight;
      const heightBound = box.width / box.height > ratio;
      const width = heightBound ? box.height * ratio : box.width;
      const height = heightBound ? box.height : box.width / ratio;

      frame.style.setProperty('--lb-ar', `${img.naturalWidth} / ${img.naturalHeight}`);
      frame.style.width = `${Math.floor(width)}px`;
      frame.style.height = `${Math.floor(height)}px`;
    }

    function fitFrames() {
      fitFrame(beforeImg, frames.before);
      fitFrame(afterImg, frames.after);
    }

    /* rozmiar liczymy po wczytaniu zdjęcia i przy każdej zmianie sceny */
    [[beforeImg, frames.before], [afterImg, frames.after]].forEach(([img, frame]) => {
      img.addEventListener('load', () => fitFrame(img, frame));
    });
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { if (!overlay.hidden) fitFrames(); })
        .observe(document.querySelector('.lb-stage'));
    }

    function show(index) {
      const pair = galleryPairs[index];
      const { place, scope, area, time } = pair.card.dataset;
      const label = scope || place || t.lightboxFallbackLabel;
      const shot = pair.total > 1 ? t.lightboxShot(pair.index + 1, pair.total) : '';

      beforeImg.src = pair.before;
      beforeImg.alt = t.lightboxBeforeAlt(`${label}${shot}`);
      afterImg.src = pair.after;
      afterImg.alt = t.lightboxAfterAlt(`${label}${shot}`);
      fitFrames();

      lbPlace.hidden = !place;
      if (place) lbPlace.querySelector('span').textContent = place;
      lbTitle.textContent = scope || place || t.lightboxTitle;
      lbCounter.textContent = `${index + 1} / ${galleryPairs.length}`;

      const desc = pair.desc.trim();
      lbDesc.textContent = desc;
      lbDesc.hidden = !desc;

      /* zakres prac jest już nagłówkiem, więc w parametrach zostają liczby */
      const facts = [['i-vector-square', area], ['i-clock-o', time]].filter(([, value]) => value);
      lbFacts.replaceChildren(...facts.map(([iconName, value]) => {
        const item = document.createElement('li');
        item.append(icon(iconName), document.createTextNode(value));
        return item;
      }));

      buildPins(pair.notes);
      buildThumbs(index);

      overlay.hidden = false;
      document.body.classList.add('noscroll');
      currentIndex = index;
      prefetchNeighbours(index);
    }

    function open(index, trigger) {
      lastFocused = trigger || document.activeElement;
      show(index);
      closeBtn.focus();
    }

    function close() {
      overlay.hidden = true;
      document.body.classList.remove('noscroll');
      if (lastFocused) lastFocused.focus();
    }

    /* fokus nie może uciec poza otwarte okno podglądu */
    function trapFocus(e) {
      const focusable = Array.from(
        overlay.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
      ).filter(el => el.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    /* kafelek jest zwykłym <button>, więc Enter, spacja i czytniki ekranu
       działają bez dorabiania obsługi klawiatury; otwieramy pierwsze
       ujęcie danej budowy */
    galleryCards.forEach(card => {
      const trigger = card.querySelector('.gc-open');
      const index = galleryPairs.findIndex(pair => pair.card === card);
      if (trigger && index !== -1) trigger.addEventListener('click', () => open(index, trigger));
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', e => {
      e.stopPropagation();
      show((currentIndex - 1 + galleryPairs.length) % galleryPairs.length);
    });
    nextBtn.addEventListener('click', e => {
      e.stopPropagation();
      show((currentIndex + 1) % galleryPairs.length);
    });

    overlay.addEventListener('click', e => {
      /* kliknięcie w tło zamyka, ale najpierw chowamy otwarty dymek pinezki */
      const openPin = overlay.querySelector('.lb-pin.is-open');
      if (openPin && !openPin.contains(e.target)) {
        openPin.classList.remove('is-open');
        return;
      }
      if (e.target === overlay || e.target.classList.contains('lb-shell') || e.target.classList.contains('lb-stage')) {
        close();
      }
    });

    document.addEventListener('keydown', e => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prevBtn.click();
      else if (e.key === 'ArrowRight') nextBtn.click();
      else if (e.key === 'Tab') trapFocus(e);
    });
  }

  /* sekcję chowamy klasą na <html>, a nie atrybutem hidden – li w menu
     ma display:flex, które by hidden nadpisało */
  function initProcessSection() {
    document.documentElement.classList.toggle('process-off', !SHOW_PROCESS);
  }

  /* ---------- mapa obszaru: przełączanie ujęć ----------
     Dwa ujęcia tej samej geometrii pogranicza. Przełącza je atrybut
     data-view na <figure>; całą animację robi CSS. Klikalna jest też
     pigułka z nazwą sąsiada leżąca na mapie. */
  function initAreaMap() {
    const map = document.querySelector('.area-map[data-view]');
    if (!map) return;

    const regions = map.querySelector('.map-regions');
    const buttons = Array.from(map.querySelectorAll('[data-view-btn]'));
    const countries = Array.from(map.querySelectorAll('.map-country'));

    const setView = view => {
      if (map.dataset.view === view) return;
      map.dataset.view = view;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)));
      delete map.dataset.preview;
      /* SVG nie zna z-index: o tym, co jest na wierzchu, decyduje kolejność
         w dokumencie. Kraj z aktualnego ujęcia przesuwamy na koniec grupy
         regionów, żeby wygaszony sąsiad nie przykrywał jego konturu.
         Pinezki siedzą w osobnej grupie za regionami, więc zostają na wierzchu
         niezależnie od tego przestawiania. */
      const front = countries.find(c => c.dataset.country === view);
      if (front && regions) regions.appendChild(front);
    };

    buttons.forEach(b => {
      b.addEventListener('click', () => setView(b.dataset.viewBtn));
      /* najechanie na przycisk drugiego kraju pokazuje go na mapie,
         zanim odwiedzający zdecyduje się kliknąć */
      const preview = on => {
        if (b.dataset.viewBtn === map.dataset.view) return;
        if (on) map.dataset.preview = b.dataset.viewBtn;
        else delete map.dataset.preview;
      };
      b.addEventListener('pointerenter', () => preview(true));
      b.addEventListener('pointerleave', () => preview(false));
      b.addEventListener('focus', () => preview(true));
      b.addEventListener('blur', () => preview(false));
    });

    /* kliknięcie w wygaszony kraj też przełącza ujęcie */
    countries.forEach(c => c.addEventListener('click', () => setView(c.dataset.country)));
  }

  /* ---------- start ---------- */
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  initReveal();
  initScrollState();
  initScrollSpy();
  initMobileMenu();
  initLangMenu();
  initAnchors();
  initCounters();
  initFaq();
  initContactForm();
  initReviews();
  initBeforePreviews();
  initLightbox();
  initAreaMap();
  initProcessSection();
})();
