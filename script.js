AOS.init({
  duration: 800,
  once: true,
  easing: 'ease-in-out'
});

// Scroll do góry po kliknięciu logo
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelector('.nav-links')?.classList.remove('open');
  document.querySelector('.hamburger')?.classList.remove('open');
}

// Przewijanie do sekcji z offsetem
function scrollToSectionWithOffset(id) {
  const target = document.querySelector(id);
  if (!target) return;

  const navbarHeight = document.querySelector('.navbar').offsetHeight;
  document.querySelectorAll('[data-aos]').forEach(el => {
    el.setAttribute('data-aos-disabled', el.getAttribute('data-aos'));
    el.removeAttribute('data-aos');
  });

  const offsetTop = target.getBoundingClientRect().top + window.scrollY - navbarHeight + 10;

  window.scrollTo({ top: offsetTop, behavior: 'smooth' });

  setTimeout(() => {
    document.querySelectorAll('[data-aos-disabled]').forEach(el => {
      el.setAttribute('data-aos', el.getAttribute('data-aos-disabled'));
      el.removeAttribute('data-aos-disabled');
    });
  }, 600);
}

// Menu kliknięcia
document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    scrollToSectionWithOffset(this.getAttribute('href'));
    document.querySelector('.nav-links')?.classList.remove('open');
    document.querySelector('.hamburger')?.classList.remove('open');
  });
});

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
});

// Przycisk do góry
const scrollToTopBtn = document.getElementById("scrollToTopBtn");
window.addEventListener("scroll", () => {
  scrollToTopBtn.classList.toggle("show", window.scrollY > 200);
});
scrollToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
});

// Aktywna sekcja
const sections = document.querySelectorAll('section[id]');
const navLinksList = document.querySelectorAll('.nav-links a');
function setActiveNav() {
  const scrollY = window.scrollY;
  const viewportCenter = scrollY + window.innerHeight / 2;
  let closestSection = null;
  let closestDistance = Infinity;

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    const sectionTop = scrollY + rect.top;
    const sectionCenter = sectionTop + section.offsetHeight / 2;
    const distance = Math.abs(viewportCenter - sectionCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSection = section;
    }
  });

  if (scrollY < 450) {
    navLinksList.forEach(link => link.classList.remove('active'));
    return;
  }

  if (closestSection) {
    const id = closestSection.getAttribute('id');
    navLinksList.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }
}
window.addEventListener('scroll', setActiveNav);
window.addEventListener('load', setActiveNav);

// Zamknij menu po kliknięciu poza
document.addEventListener('click', function(event) {
  const isClickInsideMenu = navLinks.contains(event.target);
  const isClickOnHamburger = hamburger.contains(event.target);
  if (!isClickInsideMenu && !isClickOnHamburger) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  }
});

// Formularz kontaktowy – dynamiczne komunikaty zależne od języka
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(contactForm);

    const isSK = document.documentElement.lang === 'sk';
    const sendingText = isSK ? 'Odosielanie...' : 'Wysyłanie...';
    const successText = isSK ? 'Ďakujeme! Vaša správa bola odoslaná.' : 'Dziękujemy! Twoja wiadomość została wysłana.';
    const errorText = isSK ? 'Pri odosielaní správy sa vyskytol problém. Skúste znova.' : 'Wystąpił problem podczas wysyłania wiadomości. Spróbuj ponownie.';

    formMessage.textContent = sendingText;
    formMessage.className = 'form-message';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });

      if (response.ok) {
        contactForm.reset();
        formMessage.textContent = successText;
        formMessage.classList.add('success');
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      formMessage.textContent = errorText;
      formMessage.classList.add('error');
    }
  });
}

//gallery
const galleryPairs = document.querySelectorAll('.gallery-pair');
const overlay = document.getElementById('lightbox-overlay');
const beforeImg = document.getElementById('lightbox-before');
const afterImg = document.getElementById('lightbox-after');
let currentIndex = 0;

function disableScroll() {
  document.body.classList.add('noscroll');
  document.documentElement.classList.add('noscroll');
}

function enableScroll() {
  document.body.classList.remove('noscroll');
  document.documentElement.classList.remove('noscroll');
}

function showPair(index) {
  const pair = galleryPairs[index];
  beforeImg.src = pair.children[0].src;
  afterImg.src = pair.children[1].src;
  overlay.style.display = 'flex';
  disableScroll();
  currentIndex = index;
}

function closeOverlay() {
  overlay.style.display = 'none';
  enableScroll();
}

galleryPairs.forEach((pair, index) => {
  pair.addEventListener('click', () => showPair(index));
});

document.getElementById('lightbox-close').onclick = closeOverlay;

document.getElementById('lightbox-prev').onclick = () => {
  currentIndex = (currentIndex - 1 + galleryPairs.length) % galleryPairs.length;
  showPair(currentIndex);
};

document.getElementById('lightbox-next').onclick = () => {
  currentIndex = (currentIndex + 1) % galleryPairs.length;
  showPair(currentIndex);
};

function overlayBackgroundClick(e) {
  const clickedImage = e.target.closest('.lightbox-content img');
  const clickedPrev  = e.target.closest('#lightbox-prev');
  const clickedNext  = e.target.closest('#lightbox-next');
  const clickedClose = e.target.closest('#lightbox-close');

  // Nie zamykaj, jeśli kliknięto zdjęcie lub kontrolki
  if (clickedImage || clickedPrev || clickedNext || clickedClose) return;

  // Kliknięto tło / puste miejsce -> zamknij
  closeOverlay();
}

overlay.addEventListener('click', overlayBackgroundClick);
// na niektórych mobilnych przeglądarkach lepiej też:
overlay.addEventListener('touchstart', overlayBackgroundClick, { passive: true });
