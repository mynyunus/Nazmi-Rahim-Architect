(function () {
  const nav = document.querySelector('.site-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu a');
  const backToTop = document.getElementById('back-to-top');
  const year = document.getElementById('year');

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const closeMenu = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove('menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('menu-open', !isExpanded);
      navToggle.setAttribute('aria-expanded', String(!isExpanded));
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('menu-open')) return;
      if (!nav.contains(event.target)) {
        closeMenu();
      }
    });
  }

  const filterChips = document.querySelectorAll('.filter-chip');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  if (filterChips.length && portfolioItems.length) {
    filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;

        filterChips.forEach((btn) => btn.classList.remove('is-active'));
        chip.classList.add('is-active');

        portfolioItems.forEach((item) => {
          const category = item.dataset.category || '';
          const isVisible = filter === 'all' || category.split(' ').includes(filter);
          item.hidden = !isVisible;
        });
      });
    });
  }

  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;

    if (nav) {
      nav.classList.toggle('scrolled', y > 18);
    }

    if (backToTop) {
      backToTop.classList.toggle('is-visible', y > 480);
    }
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (navMenu && window.matchMedia('(min-width: 880px)').matches) {
    navMenu.removeAttribute('aria-hidden');
  }
})();
