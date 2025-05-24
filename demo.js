/**
 * Main script for website interactivity.
 * Manages mobile menu, navigation scroll, service modal, counter animations, video debugging, Lucide icons, and contact form.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Configuration object for selectors, classes, and settings
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
      aboutSection: '#about',
      cards: '.card',
      slideUpElements: '.animate-slide-up',
      contactForm: '#contact-form',
      submitBtn: '#submit-btn',
      btnText: '#btn-text',
      btnSpinner: '#btn-spinner',
      formInputs: {
        name: '#name',
        email: '#email',
        phone: '#phone',
        company: '#company',
        message: '#message'
      }
    },
    classes: {
      hidden: 'hidden',
      noScroll: 'no-scroll'
    },
    scroll: {
      threshold: 100,
      debounce: 50
    },
    form: {
      rateLimitInterval: 30000, // 30 seconds in milliseconds
      maxLengths: {
        name: 100,
        email: 100,
        phone: 20,
        company: 100,
        message: 1000
      }
    }
  };

  // Cache DOM elements for performance
  const elements = Object.fromEntries(
    Object.entries(CONFIG.selectors).map(([key, selector]) => [
      key,
      key === 'exploreLinks' || key === 'counters' || key === 'cards' || key === 'slideUpElements'
        ? document.querySelectorAll(selector)
        : key === 'formInputs'
        ? Object.fromEntries(
            Object.entries(selector).map(([inputKey, inputSelector]) => [
              inputKey,
              document.querySelector(inputSelector)
            ])
          )
        : document.querySelector(selector)
    ])
  );

  // Utility: Trap focus within an element for accessibility
  function trapFocus(element) {
    if (!element) return () => {};
    const focusable = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return () => {};

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeydown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        (e.shiftKey && document.activeElement === first ? last : first).focus();
      }
    };

    element.addEventListener('keydown', handleKeydown);
    return () => element.removeEventListener('keydown', handleKeydown);
  }

  // Utility: Sanitize input to prevent XSS
  function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML.replace(/[<>]/g, '');
  }

  // Feature: Mobile Menu Toggle
  function initMobileMenu() {
    if (!elements.mobileMenu || !elements.mobileMenuBtn || !elements.closeMenuBtn) {
      console.error('Mobile menu elements missing');
      return;
    }

    let trapCleanup = null;

    const toggleMenu = (open) => {
      elements.mobileMenu.classList.toggle(CONFIG.classes.hidden, !open);
      elements.mobileMenu.setAttribute('aria-hidden', !open);
      elements.mobileMenuBtn.setAttribute('aria-expanded', open);
      elements.body.classList.toggle(CONFIG.classes.noScroll, open);

      const focusElement = open ? elements.closeMenuBtn : elements.mobileMenuBtn;
      trapCleanup?.();
      if (open) trapCleanup = trapFocus(elements.mobileMenu);
      setTimeout(() => focusElement.focus(), 50);
    };

    elements.mobileMenuBtn.addEventListener('click', () => toggleMenu(true));
    elements.closeMenuBtn.addEventListener('click', () => toggleMenu(false));
    document.querySelectorAll('.mobile-menu .nav-link').forEach(link =>
      link.addEventListener('click', () => toggleMenu(false))
    );

    document.addEventListener('click', (e) => {
      if (
        !elements.mobileMenu.classList.contains(CONFIG.classes.hidden) &&
        !e.target.closest('[data-menu-content]') &&
        !e.target.closest(CONFIG.selectors.mobileMenuBtn)
      ) {
        toggleMenu(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !elements.mobileMenu.classList.contains(CONFIG.classes.hidden)) {
        toggleMenu(false);
      }
    });
  }

  // Feature: Hide Navigation on Scroll Down
  function initNavScroll() {
    if (!elements.nav) return;

    let lastScroll = 0;
    let debounceTimeout;

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll < CONFIG.scroll.threshold) {
        elements.nav.classList.remove(CONFIG.classes.hidden);
        lastScroll = currentScroll;
        return;
      }

      if (Math.abs(currentScroll - lastScroll) > CONFIG.scroll.threshold) {
        elements.nav.classList.toggle(CONFIG.classes.hidden, currentScroll > lastScroll);
        lastScroll = currentScroll;
      }
    };

    window.addEventListener('scroll', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(handleScroll, CONFIG.scroll.debounce);
    }, { passive: true });
  }

  // Feature: Service Modal
  function initServiceModal() {
    if (
      !elements.modal ||
      !elements.modalTitle ||
      !elements.modalDescription ||
      !elements.closeModal ||
      !elements.exploreLinks.length
    ) return;

    let trapCleanup = null;
    let lastFocusedElement = null;

    const openModal = (title, description) => {
      elements.modalTitle.textContent = title || 'Service';
      elements.modalDescription.textContent = description || 'Contact us to learn more!';
      elements.modal.classList.remove(CONFIG.classes.hidden);
      elements.modal.setAttribute('aria-hidden', 'false');
      elements.body.classList.add(CONFIG.classes.noScroll);

      if (!elements.modal.querySelector('.btn-primary')) {
        const contactBtn = Object.assign(document.createElement('a'), {
          href: '#contact',
          className: 'btn-primary',
          textContent: 'Contact Us'
        });
        elements.modalDescription.insertAdjacentElement('afterend', contactBtn);
      }

      trapCleanup = trapFocus(elements.modal);
      setTimeout(() => elements.closeModal.focus(), 50);
    };

    const closeModal = () => {
      elements.modal.classList.add(CONFIG.classes.hidden);
      elements.modal.setAttribute('aria-hidden', 'true');
      elements.body.classList.remove(CONFIG.classes.noScroll);
      trapCleanup?.();
      lastFocusedElement?.focus();
      trapCleanup = lastFocusedElement = null;
    };

    elements.exploreLinks.forEach(link =>
      link.addEventListener('click', (e) => {
        e.preventDefault();
        lastFocusedElement = e.target;
        openModal(link.dataset.service, link.dataset.description);
      })
    );

    elements.closeModal.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !elements.modal.classList.contains(CONFIG.classes.hidden)) {
        closeModal();
      }
    });
  }

  // Feature: Counter Animation
  function animateCounter(element, target, suffix, duration) {
    let start = 0;
    const startTime = performance.now();
    const update = (currentTime) => {
      const elapsed = (currentTime - startTime) / duration;
      const progress = Math.min(elapsed, 1);
      start = progress * target;
      element.textContent = Math.floor(start) + (suffix || '');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // Initialize counters and card animations
  function initCounters() {
    if (!elements.counters.length || !elements.aboutSection) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries, observer) => {
          if (entries[0].isIntersecting) {
            elements.counters.forEach(counter =>
              animateCounter(
                counter,
                parseInt(counter.dataset.target),
                counter.dataset.suffix,
                1500
              )
            );
            elements.cards.forEach((card, index) => {
              setTimeout(() => card.classList.add('visible'), index * 200);
            });
            observer.unobserve(elements.aboutSection);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(elements.aboutSection);
    } else {
      elements.counters.forEach(counter =>
        animateCounter(
          counter,
          parseInt(counter.dataset.target),
          counter.dataset.suffix,
          1500
        )
      );
      elements.cards.forEach(card => card.classList.add('visible'));
    }
  }

  // Feature: Video Debug
  function initVideoDebug() {
    if (!elements.heroVideo) return;
    elements.heroVideo.addEventListener('error', () =>
      console.error('Video failed to load: hero1.webm')
    );
    elements.heroVideo.addEventListener('loadeddata', () =>
      console.log('Video loaded successfully')
    );
  }

  // Feature: Scroll-triggered Animations
  function initScrollAnimations() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      elements.slideUpElements.forEach(el => observer.observe(el));
    } else {
      elements.slideUpElements.forEach(el => el.classList.add('visible'));
    }
  }

  // Feature: Contact Form with EmailJS
  function initContactForm() {
    if (
      !elements.contactForm ||
      !elements.submitBtn ||
      !elements.btnText ||
      !elements.btnSpinner ||
      !elements.formInputs.email
    ) {
      console.error('Contact form elements missing');
      return;
    }

    // Initialize EmailJS (ideally, this should be handled server-side)
    emailjs.init('JQ8fQ2l-QXWp78b7U'); // Replace with your EmailJS User ID

    let lastSubmitTime = 0;

    elements.contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Rate limiting check
      const currentTime = Date.now();
      if (currentTime - lastSubmitTime < CONFIG.form.rateLimitInterval) {
        alert('Please wait before submitting again.');
        return;
      }

      // Validate and sanitize inputs
      const inputs = {
        name: elements.formInputs.name?.value?.trim() || '',
        email: elements.formInputs.email?.value?.trim() || '',
        phone: elements.formInputs.phone?.value?.trim() || '',
        company: elements.formInputs.company?.value?.trim() || '',
        message: elements.formInputs.message?.value?.trim() || ''
      };

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputs.email)) {
        alert('Please enter a valid email address.');
        return;
      }

      // Length validation
      if (
        inputs.name.length > CONFIG.form.maxLengths.name ||
        inputs.email.length > CONFIG.form.maxLengths.email ||
        inputs.phone.length > CONFIG.form.maxLengths.phone ||
        inputs.company.length > CONFIG.form.maxLengths.company ||
        inputs.message.length > CONFIG.form.maxLengths.message
      ) {
        alert('Input exceeds maximum length.');
        return;
      }

      // Sanitize inputs
      const formData = {
        name: sanitizeInput(inputs.name) || 'Not provided',
        email: sanitizeInput(inputs.email),
        phone: sanitizeInput(inputs.phone) || 'Not provided',
        company: sanitizeInput(inputs.company) || 'Not provided',
        message: sanitizeInput(inputs.message) || 'Not provided'
      };

      // Show loading state
      elements.submitBtn.disabled = true;
      elements.btnText.textContent = 'Sending...';
      elements.btnSpinner.classList.remove(CONFIG.classes.hidden);

      try {
        const response = await emailjs.send('service_p4dfeu6', 'template_nh9ws5m', formData);
        console.log('Email sent successfully!', response.status);
        alert('Your message has been sent successfully!');
        elements.contactForm.reset();
        lastSubmitTime = Date.now();
        // Redirect to thank-you page
        window.location.href = '/thanku.html';
      } catch (error) {
        console.error('Failed to send email:', error.message);
        alert('Failed to send your message. Please try again later.');
      } finally {
        elements.submitBtn.disabled = false;
        elements.btnText.textContent = 'Send Message';
        elements.btnSpinner.classList.add(CONFIG.classes.hidden);
      }
    });
  }

  // Feature: Newsletter Subscription
  function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletter-email');
    const message = document.getElementById('newsletter-message');
    if (!emailInput || !message) return;

    const email = emailInput.value.trim();

    if (!email) {
      message.textContent = 'Please enter a valid email address.';
      message.classList.remove('hidden', 'text-green-400');
      message.classList.add('text-red-400');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      message.textContent = 'Please enter a valid email address.';
      message.classList.remove('hidden', 'text-green-400');
      message.classList.add('text-red-400');
      return;
    }

    message.textContent = 'Thank you for subscribing!';
    message.classList.remove('hidden', 'text-red-400');
    message.classList.add('text-green-400');
    emailInput.value = '';
  }

  // Feature: Initialize Lucide Icons
  function initLucideIcons() {
    if (typeof lucide === 'undefined') {
      console.error('Lucide library not loaded');
      return;
    }
    lucide.createIcons();
  }

  // Initialize all features
  function initialize() {
    try {
      initLucideIcons();
      initVideoDebug();
      initMobileMenu();
      initNavScroll();
      initServiceModal();
      initCounters();
      initScrollAnimations();
      initContactForm();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  initialize();
});
