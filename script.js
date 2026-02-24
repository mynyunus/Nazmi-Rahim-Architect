(function () {
  const nav = document.querySelector('.site-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu a');
  const backToTop = document.getElementById('back-to-top');
  const year = document.getElementById('year');
  const heroVideo = document.querySelector('.hero-video');

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

  if (heroVideo) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      heroVideo.pause();
      heroVideo.removeAttribute('autoplay');
    } else {
      const tryPlayVideo = () => {
        heroVideo.play().catch(() => {});
      };

      tryPlayVideo();
      heroVideo.addEventListener('loadeddata', tryPlayVideo, { once: true });
    }
  }

  const filterChips = Array.from(document.querySelectorAll('.filter-chip'));
  const portfolioItems = Array.from(document.querySelectorAll('.portfolio-item'));
  const portfolioGrid = document.querySelector('.portfolio-grid');
  const portfolioToggle = document.querySelector('.portfolio-toggle');
  const portfolioLightbox = document.querySelector('.portfolio-lightbox');
  const lightboxDialog = portfolioLightbox ? portfolioLightbox.querySelector('.portfolio-lightbox-dialog') : null;
  const lightboxImage = portfolioLightbox ? portfolioLightbox.querySelector('.portfolio-lightbox-image') : null;
  const lightboxCaption = portfolioLightbox ? portfolioLightbox.querySelector('.portfolio-lightbox-caption') : null;
  const lightboxClose = portfolioLightbox ? portfolioLightbox.querySelector('.portfolio-lightbox-close') : null;
  const lightboxPrev = portfolioLightbox ? portfolioLightbox.querySelector('.portfolio-lightbox-prev') : null;
  const lightboxNext = portfolioLightbox ? portfolioLightbox.querySelector('.portfolio-lightbox-next') : null;
  const lightboxReset = portfolioLightbox ? portfolioLightbox.querySelector('.portfolio-lightbox-reset') : null;
  const lightboxBackdrop = portfolioLightbox ? portfolioLightbox.querySelector('[data-lightbox-close]') : null;
  const lightboxStage = portfolioLightbox ? portfolioLightbox.querySelector('.portfolio-lightbox-stage') : null;
  const certificationSlidesForLightbox = Array.from(document.querySelectorAll('.certification-slide'));

  if (filterChips.length && portfolioItems.length && portfolioGrid) {
    let activeFilter = filterChips.find((chip) => chip.classList.contains('is-active'))?.dataset.filter || 'all';
    const defaultVisibleCount = 6;
    const expandedByFilter = new Map();
    let visiblePortfolioItems = [];
    let lightboxItems = [];
    let lightboxIndex = 0;
    let lastFocusedThumb = null;
    let zoomScale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let panStartX = 0;
    let panStartY = 0;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let lastTapTime = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const getMatchingItems = () =>
      portfolioItems.filter((item) => {
        const category = item.dataset.category || '';
        return activeFilter === 'all' || category === activeFilter;
      });

    const getPanBounds = () => {
      if (!lightboxStage || !lightboxImage) return { maxX: 0, maxY: 0 };
      const stageRect = lightboxStage.getBoundingClientRect();
      const imageWidth = lightboxImage.offsetWidth;
      const imageHeight = lightboxImage.offsetHeight;
      const maxX = Math.max(0, (imageWidth * zoomScale - stageRect.width) / 2);
      const maxY = Math.max(0, (imageHeight * zoomScale - stageRect.height) / 2);
      return { maxX, maxY };
    };

    const applyTransform = () => {
      if (!lightboxImage) return;
      const { maxX, maxY } = getPanBounds();
      panX = clamp(panX, -maxX, maxX);
      panY = clamp(panY, -maxY, maxY);
      lightboxImage.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoomScale})`;
      lightboxImage.classList.toggle('is-panning', isPanning);
      lightboxImage.style.cursor = zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in';
    };

    const resetZoom = () => {
      zoomScale = 1;
      panX = 0;
      panY = 0;
      isPanning = false;
      applyTransform();
    };

    const getImageSource = (imageElement) =>
      imageElement?.dataset?.fullSrc || imageElement?.getAttribute('data-full-src') || imageElement?.currentSrc || imageElement?.src || '';

    const setLightboxImage = () => {
      if (!lightboxImage || !lightboxItems.length) return;
      const activeItem = lightboxItems[lightboxIndex];
      const thumbImage = activeItem?.querySelector('img');
      if (!thumbImage) return;
      lightboxImage.src = getImageSource(thumbImage);
      lightboxImage.alt = thumbImage.alt;
      if (lightboxCaption) {
        lightboxCaption.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
      }
      resetZoom();
    };

    const isLightboxOpen = () => Boolean(portfolioLightbox?.classList.contains('is-open'));

    const closeLightbox = () => {
      if (!portfolioLightbox || !isLightboxOpen()) return;
      portfolioLightbox.classList.remove('is-open');
      portfolioLightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      if (lightboxImage) {
        lightboxImage.src = '';
      }
      if (lastFocusedThumb) {
        lastFocusedThumb.focus();
      }
      lastFocusedThumb = null;
      lightboxItems = [];
      resetZoom();
    };

    const openLightbox = (index, triggerElement, items) => {
      if (!portfolioLightbox || !lightboxDialog) return;
      lightboxItems = Array.isArray(items) ? items.slice() : visiblePortfolioItems.slice();
      if (!lightboxItems.length) return;
      lightboxIndex = clamp(index, 0, lightboxItems.length - 1);
      lastFocusedThumb = triggerElement instanceof HTMLElement ? triggerElement : null;
      portfolioLightbox.classList.add('is-open');
      portfolioLightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      setLightboxImage();
      if (lightboxClose) {
        lightboxClose.focus();
      } else {
        lightboxDialog.focus();
      }
    };

    const goToLightbox = (nextIndex) => {
      if (!lightboxItems.length) return;
      const total = lightboxItems.length;
      lightboxIndex = (nextIndex + total) % total;
      setLightboxImage();
    };

    const renderPortfolio = () => {
      const matching = getMatchingItems();
      const isExpanded = expandedByFilter.get(activeFilter) === true;
      const visibleCount = isExpanded ? matching.length : Math.min(defaultVisibleCount, matching.length);
      visiblePortfolioItems = matching.slice(0, visibleCount);
      const visibleSet = new Set(visiblePortfolioItems);

      portfolioItems.forEach((item) => {
        const inFilter = matching.includes(item);
        const isVisible = visibleSet.has(item);
        item.hidden = !isVisible;
        item.classList.toggle('is-limited', inFilter && !isVisible);
      });

      if (portfolioToggle) {
        if (matching.length <= defaultVisibleCount) {
          portfolioToggle.hidden = true;
          portfolioToggle.setAttribute('aria-expanded', 'false');
        } else {
          portfolioToggle.hidden = false;
          portfolioToggle.setAttribute('aria-expanded', String(isExpanded));
          portfolioToggle.textContent = isExpanded ? 'Show less' : 'Show all';
        }
      }
    };

    filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const nextFilter = chip.dataset.filter || 'all';
        activeFilter = nextFilter;
        if (!expandedByFilter.has(activeFilter)) {
          expandedByFilter.set(activeFilter, false);
        }

        filterChips.forEach((btn) => btn.classList.remove('is-active'));
        chip.classList.add('is-active');

        if (isLightboxOpen()) {
          closeLightbox();
        }
        renderPortfolio();
      });
    });

    if (portfolioToggle) {
      portfolioToggle.addEventListener('click', () => {
        const isExpanded = expandedByFilter.get(activeFilter) === true;
        expandedByFilter.set(activeFilter, !isExpanded);
        renderPortfolio();
      });
    }

      if (portfolioLightbox && lightboxImage) {
      portfolioGrid.addEventListener('click', (event) => {
        const item = event.target.closest('.portfolio-item');
        if (!item || item.hidden) return;
        const itemIndex = visiblePortfolioItems.indexOf(item);
        if (itemIndex === -1) return;
        const targetImage = item.querySelector('img');
        openLightbox(itemIndex, targetImage || item, visiblePortfolioItems);
      });

      if (certificationSlidesForLightbox.length) {
        const certificationItems = certificationSlidesForLightbox
          .slice()
          .sort(
            (a, b) =>
              Number(a.dataset.certIndex || 0) - Number(b.dataset.certIndex || 0)
          );

        certificationSlidesForLightbox.forEach((slide) => {
          const media = slide.querySelector('.certification-media');
          const image = slide.querySelector('.certification-image');
          if (!media || !image) return;

          media.addEventListener('click', () => {
            const itemIndex = certificationItems.indexOf(slide);
            if (itemIndex === -1) return;
            openLightbox(itemIndex, image, certificationItems);
          });
        });
      }

      if (lightboxBackdrop) {
        lightboxBackdrop.addEventListener('click', closeLightbox);
      }
      if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
      }
      if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => goToLightbox(lightboxIndex - 1));
      }
      if (lightboxNext) {
        lightboxNext.addEventListener('click', () => goToLightbox(lightboxIndex + 1));
      }
      if (lightboxReset) {
        lightboxReset.addEventListener('click', resetZoom);
      }

      lightboxImage.addEventListener('dblclick', () => {
        if (!isLightboxOpen()) return;
        if (zoomScale > 1) {
          resetZoom();
        } else {
          zoomScale = 2;
          panX = 0;
          panY = 0;
          applyTransform();
        }
      });

      if (lightboxStage) {
        lightboxStage.addEventListener(
          'touchstart',
          (event) => {
            if (!isLightboxOpen()) return;
            if (event.touches.length === 2) {
              pinchStartDistance = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
              );
              pinchStartScale = zoomScale;
              return;
            }
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            swipeStartX = touch.clientX;
            swipeStartY = touch.clientY;
            pointerStartX = touch.clientX;
            pointerStartY = touch.clientY;
            panStartX = panX;
            panStartY = panY;
          },
          { passive: true }
        );

        lightboxStage.addEventListener(
          'touchmove',
          (event) => {
            if (!isLightboxOpen()) return;
            if (event.touches.length === 2 && pinchStartDistance > 0) {
              event.preventDefault();
              const currentDistance = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
              );
              zoomScale = clamp((currentDistance / pinchStartDistance) * pinchStartScale, 1, 4);
              applyTransform();
              return;
            }

            if (event.touches.length !== 1 || zoomScale <= 1) return;
            event.preventDefault();
            const touch = event.touches[0];
            isPanning = true;
            panX = panStartX + (touch.clientX - pointerStartX);
            panY = panStartY + (touch.clientY - pointerStartY);
            applyTransform();
          },
          { passive: false }
        );

        lightboxStage.addEventListener(
          'touchend',
          (event) => {
            if (!isLightboxOpen()) return;
            isPanning = false;
            applyTransform();

            if (event.touches.length === 0) {
              pinchStartDistance = 0;
            }
            if (!event.changedTouches.length) return;

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - swipeStartX;
            const deltaY = touch.clientY - swipeStartY;

            if (zoomScale === 1 && Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY)) {
              if (deltaX < 0) {
                goToLightbox(lightboxIndex + 1);
              } else {
                goToLightbox(lightboxIndex - 1);
              }
              return;
            }

            const tapDistance = Math.hypot(deltaX, deltaY);
            const now = Date.now();
            if (tapDistance < 10) {
              if (now - lastTapTime < 280) {
                if (zoomScale > 1) {
                  resetZoom();
                } else {
                  zoomScale = 2;
                  applyTransform();
                }
                lastTapTime = 0;
              } else {
                lastTapTime = now;
              }
            }
          },
          { passive: true }
        );
      }

      document.addEventListener('keydown', (event) => {
        if (!isLightboxOpen() || !portfolioLightbox) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          closeLightbox();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          goToLightbox(lightboxIndex + 1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          goToLightbox(lightboxIndex - 1);
        } else if (event.key === 'Tab' && lightboxDialog) {
          const focusables = Array.from(
            lightboxDialog.querySelectorAll(
              'button:not([disabled]):not([hidden])'
            )
          );
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement;

          if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });
    }

    renderPortfolio();
  }

  const studioTeamGrid = document.querySelector('.studio-team-grid');
  const teamToggle = document.querySelector('.team-toggle');

  if (studioTeamGrid) {
    const studioTeamCards = Array.from(studioTeamGrid.querySelectorAll('.team-card--studio'));
    const defaultStudioVisible = 3;
    let isStudioExpanded = false;

    const renderStudioTeam = () => {
      const visibleCount = isStudioExpanded
        ? studioTeamCards.length
        : Math.min(defaultStudioVisible, studioTeamCards.length);

      studioTeamCards.forEach((card, index) => {
        card.hidden = index >= visibleCount;
      });

      if (!teamToggle) return;

      if (studioTeamCards.length <= defaultStudioVisible) {
        teamToggle.hidden = true;
        teamToggle.setAttribute('aria-expanded', 'false');
        return;
      }

      teamToggle.hidden = false;
      teamToggle.setAttribute('aria-expanded', String(isStudioExpanded));
      teamToggle.textContent = isStudioExpanded ? 'Show fewer team members' : 'Show full studio team';
    };

    if (teamToggle) {
      teamToggle.addEventListener('click', () => {
        isStudioExpanded = !isStudioExpanded;
        renderStudioTeam();
      });
    }

    renderStudioTeam();
  }

  const teamReadMoreButtons = document.querySelectorAll('.team-readmore');

  if (teamReadMoreButtons.length) {
    teamReadMoreButtons.forEach((button) => {
      const targetId = button.dataset.readmoreTarget;
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const nextExpanded = !isExpanded;

        button.setAttribute('aria-expanded', String(nextExpanded));
        button.textContent = nextExpanded ? 'Read less' : 'Read more';

        target.classList.toggle('is-expanded', nextExpanded);
        target.classList.toggle('is-collapsed', !nextExpanded);
      });
    });
  }

  const certCarousel = document.querySelector('[data-cert-carousel]');

  if (certCarousel) {
    const stage = certCarousel.querySelector('.certifications-stage');
    const track = certCarousel.querySelector('.certifications-track');
    const slides = Array.from(certCarousel.querySelectorAll('.certification-slide'));
    const thumbs = Array.from(certCarousel.querySelectorAll('.cert-thumb'));
    const certImages = Array.from(certCarousel.querySelectorAll('.certification-image'));
    const prevBtn = certCarousel.querySelector('.cert-btn-prev');
    const nextBtn = certCarousel.querySelector('.cert-btn-next');

    if (slides.length && track) {
      const total = slides.length;
      let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
      if (activeIndex < 0) activeIndex = 0;
      const isMobileStage = window.matchMedia('(max-width: 879px)');

      const syncStageHeight = () => {
        if (!stage) return;
        const activeSlide = slides[activeIndex];
        if (!activeSlide) return;
        const activeImage = activeSlide.querySelector('.certification-image');

        if (activeImage && activeImage.offsetHeight) {
          stage.style.setProperty('--cert-arrow-y', `${Math.round(activeImage.offsetHeight / 2)}px`);
        }

        if (!isMobileStage.matches) {
          stage.style.height = '';
          return;
        }
        stage.style.height = `${Math.ceil(activeSlide.offsetHeight)}px`;
      };

      certImages.forEach((image) => {
        const applyRatioClass = () => {
          if (!image.naturalWidth || !image.naturalHeight) return;
          const ratio = image.naturalWidth / image.naturalHeight;
          image.classList.toggle('is-landscape', ratio >= 1.25);
          syncStageHeight();
        };

        if (image.complete) {
          applyRatioClass();
        } else {
          image.addEventListener('load', applyRatioClass, { once: true });
        }
      });

      const setActive = (index) => {
        activeIndex = (index + total) % total;
        track.style.transform = `translateX(-${activeIndex * 100}%)`;

        slides.forEach((slide, slideIndex) => {
          const isActive = slideIndex === activeIndex;
          slide.classList.toggle('is-active', isActive);
          slide.setAttribute('aria-hidden', String(!isActive));
        });

        thumbs.forEach((thumb, thumbIndex) => {
          const isActive = thumbIndex === activeIndex;
          thumb.classList.toggle('is-active', isActive);
          thumb.setAttribute('aria-selected', String(isActive));

          if (isActive) {
            thumb.setAttribute('aria-current', 'true');
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            thumb.removeAttribute('aria-current');
          }
        });

        requestAnimationFrame(syncStageHeight);
      };

      const next = () => setActive(activeIndex + 1);
      const prev = () => setActive(activeIndex - 1);

      if (prevBtn) {
        prevBtn.addEventListener('click', prev);
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', next);
      }

      thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const index = Number(thumb.dataset.certIndex);
          if (!Number.isNaN(index)) {
            setActive(index);
          }
        });
      });

      if (stage) {
        stage.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            next();
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            prev();
          } else if (event.key === 'Home') {
            event.preventDefault();
            setActive(0);
          } else if (event.key === 'End') {
            event.preventDefault();
            setActive(total - 1);
          }
        });

        let startX = 0;
        let startY = 0;
        let touching = false;

        stage.addEventListener(
          'touchstart',
          (event) => {
            if (event.touches.length !== 1) return;
            touching = true;
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
          },
          { passive: true }
        );

        stage.addEventListener(
          'touchend',
          (event) => {
            if (!touching || !event.changedTouches.length) return;
            touching = false;
            const deltaX = event.changedTouches[0].clientX - startX;
            const deltaY = event.changedTouches[0].clientY - startY;

            if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
              if (deltaX < 0) {
                next();
              } else {
                prev();
              }
            }
          },
          { passive: true }
        );

        stage.addEventListener(
          'touchcancel',
          () => {
            touching = false;
          },
          { passive: true }
        );
      }

      window.addEventListener('resize', syncStageHeight, { passive: true });

      setActive(activeIndex);
    }
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
