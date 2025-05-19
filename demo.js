document.addEventListener('DOMContentLoaded', () => {
  // Configuration
  const CONFIG = {
    selectors: {
      mobileMenu: '#mobileMenu',
      mobileMenuBtn: '#mobileMenuBtn',
      closeMenuBtn: '#closeMenuBtn',
      nav: 'nav',
      body: 'body',
      heroVideo: 'section[aria-labelledby="hero-heading"] video',
      modal: '#service-modal',
      modalTitle: '#modal-title',
      modalDescription: '#modal-description',
      closeModal: '#close-modal',
      exploreLinks: '[data-service]',
      counters: '.counter',
      aboutSection: '#about'
    },
    classes: {
      hidden: 'hidden',
      navHidden: 'nav-hidden',
      noScroll: 'no-scroll'
    },
    scroll: {
      threshold: 100,
      debounce: 50
    }
  };

  // DOM Elements
  const elements = Object.fromEntries(
    Object.entries(CONFIG.selectors).map(([key, selector]) => [
      key,
      key === 'exploreLinks' || key === 'counters'
        ? document.querySelectorAll(selector)
        : document.querySelector(selector)
    ])
  );

  // Utility: Focus Trap
  const trapFocus = (element) => {
    const focusable = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return () => {};

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeydown = (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      (e.shiftKey && document.activeElement === first ? last : first).focus();
    };

    element.addEventListener('keydown', handleKeydown);
    return () => element.removeEventListener('keydown', handleKeydown);
  };

  // Feature: Mobile Menu
  const mobileMenu = (() => {
    let trapCleanup = null;

    const toggle = (open) => {
      elements.mobileMenu.classList.toggle(CONFIG.classes.hidden, !open);
      elements.mobileMenu.setAttribute('aria-hidden', !open);
      elements.mobileMenuBtn.setAttribute('aria-expanded', open);
      elements.body.classList.toggle(CONFIG.classes.noScroll, open);

      const focusElement = open ? elements.closeMenuBtn : elements.mobileMenuBtn;
      trapCleanup = open ? trapFocus(elements.mobileMenu) : trapCleanup?.();
      setTimeout(() => focusElement.focus(), 50);
    };

    const init = () => {
      if (!elements.mobileMenu || !elements.mobileMenuBtn || !elements.closeMenuBtn) return;

      elements.mobileMenuBtn.addEventListener('click', () => toggle(true));
      elements.closeMenuBtn.addEventListener('click', () => toggle(false));
      document.querySelectorAll('.mobile-menu .nav-link').forEach(link =>
        link.addEventListener('click', () => toggle(false))
      );

      document.addEventListener('click', (e) => {
        if (!elements.mobileMenu.classList.contains(CONFIG.classes.hidden) &&
            !e.target.closest('[data-menu-content]') &&
            !e.target.closest(CONFIG.selectors.mobileMenuBtn)) {
          toggle(false);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.mobileMenu.classList.contains(CONFIG.classes.hidden)) {
          toggle(false);
        }
      });
    };

    return { init };
  })();

  // Feature: Navigation Scroll
  const navScroll = (() => {
    let lastScroll = 0;
    let debounceTimeout;

    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      const scrollDelta = currentScroll - lastScroll;

      if (Math.abs(scrollDelta) > CONFIG.scroll.threshold) {
        elements.nav.classList.toggle(CONFIG.classes.navHidden, scrollDelta > 0 && currentScroll > 100);
        lastScroll = currentScroll;
      }

      if (currentScroll < 100) {
        elements.nav.classList.remove(CONFIG.classes.navHidden);
      }
    };

    const init = () => {
      if (!elements.nav) return;
      window.addEventListener('scroll', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(handleScroll, CONFIG.scroll.debounce);
      }, { passive: true });
    };

    return { init };
  })();

  // Feature: Service Modal
  const serviceModal = (() => {
    let trapCleanup = null;
    let lastFocusedElement = null;

    const open = (title, description) => {
      elements.modalTitle.textContent = title;
      elements.modalDescription.textContent = description;
      elements.modal.classList.remove(CONFIG.classes.hidden);
      elements.modal.setAttribute('aria-hidden', 'false');
      elements.body.classList.add(CONFIG.classes.noScroll);

      if (!elements.modal.querySelector('.btn-primary')) {
        const contactBtn = Object.assign(document.createElement('a'), {
          href: '#contact',
          className: 'btn-primary inline-block px-6 py-3 rounded-lg font-medium text-white hover:shadow-md transition-all mt-4',
          textContent: 'Contact Us'
        });
        elements.modalDescription.insertAdjacentElement('afterend', contactBtn);
      }

      trapCleanup = trapFocus(elements.modal);
      setTimeout(() => elements.closeModal.focus(), 50);
    };

    const close = () => {
      elements.modal.classList.add(CONFIG.classes.hidden);
      elements.modal.setAttribute('aria-hidden', 'true');
      elements.body.classList.remove(CONFIG.classes.noScroll);
      trapCleanup?.();
      lastFocusedElement?.focus();
      trapCleanup = lastFocusedElement = null;
    };

    const init = () => {
      if (!elements.modal || !elements.modalTitle || !elements.modalDescription ||
          !elements.closeModal || !elements.exploreLinks.length) return;

      elements.exploreLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          lastFocusedElement = e.target;
          open(
            link.dataset.service || 'Service',
            link.dataset.description || 'Learn more about our services by contacting us!'
          );
        });
      });

      elements.closeModal.addEventListener('click', close);
      elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.modal.classList.contains(CONFIG.classes.hidden)) {
          close();
        }
      });
    };

    return { init };
  })();

  // Feature: Counter Animation
  const counters = (() => {
    const animate = (element, target, suffix, duration) => {
      let start = 0;
      const increment = target / (duration / 16);
      const startTime = performance.now();

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        start = (elapsed / duration) * target;
        element.textContent = Math.floor(start) + suffix;
        if (elapsed < duration) requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
    };

    const init = () => {
      if (!elements.counters.length) return;

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              elements.counters.forEach((counter) => {
                animate(
                  counter,
                  parseInt(counter.getAttribute('data-target')),
                  counter.getAttribute('data-suffix') || '',
                  1500
                );
              });
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });

        if (elements.aboutSection) observer.observe(elements.aboutSection);
      } else {
        elements.counters.forEach((counter) => {
          animate(
            counter,
            parseInt(counter.getAttribute('data-target')),
            counter.getAttribute('data-suffix') || '',
            1500
          );
        });
      }
    };

    return { init };
  })();

  // Feature: Video Debug
  const videoDebug = (() => {
    const init = () => {
      if (!elements.heroVideo) return;
      elements.heroVideo.addEventListener('error', () =>
        console.error('Video failed to load. Check source file: hero-video.mp4')
      );
      elements.heroVideo.addEventListener('loadeddata', () =>
        console.log('Video loaded successfully')
      );
    };

    return { init };
  })();

  // Feature: Lucide Icons
  const lucideIcons = (() => {
    const init = () => {
      if (typeof lucide === 'undefined') {
        console.error('Lucide library not loaded');
        return;
      }
      lucide.createIcons();
    };

    return { init };
  })();

  // Initialize all features
  const init = () => {
    try {
      lucideIcons.init();
      videoDebug.init();
      mobileMenu.init();
      navScroll.init();
      serviceModal.init();
      counters.init();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  init();
});