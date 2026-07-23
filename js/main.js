(() => {
  'use strict';

  /* ---------- Mobile section-menu dropdown ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('main-nav');

  const closeMobileNav = () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        closeMobileNav();
        navToggle.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (
        mainNav.classList.contains('is-open') &&
        !mainNav.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeMobileNav();
      }
    });
  }

  /* ---------- Back to top ---------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggleVisibility = () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
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
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Registration drawer ---------- */
  const regDrawer = document.getElementById('regDrawer');
  const regBackdrop = document.getElementById('regBackdrop');
  const regDrawerClose = document.getElementById('regDrawerClose');
  let lastFocusedEl = null;

  const openDrawer = () => {
    lastFocusedEl = document.activeElement;
    regDrawer.classList.add('is-open');
    regBackdrop.classList.add('is-open');
    regDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstField = regDrawer.querySelector('.reg-drawer-body input');
    if (firstField) firstField.focus();
  };

  const closeDrawer = () => {
    regDrawer.classList.remove('is-open');
    regBackdrop.classList.remove('is-open');
    regDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();
  };

  document.querySelectorAll('.js-open-register').forEach((btn) => {
    btn.addEventListener('click', openDrawer);
  });

  if (regDrawerClose) regDrawerClose.addEventListener('click', closeDrawer);
  if (regBackdrop) regBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && regDrawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  /* ---------- Shared registration form logic ---------- */
  // Both the inline "register" section and the drawer submit into the same
  // conceptual registration; a successful submit from either shows the
  // success state in both places at once.
  const validators = {
    fullName: (v) => (v.trim().length >= 2 ? '' : 'Enter your full name.'),
    workEmail: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid work email address.',
    company: (v) => (v.trim().length >= 2 ? '' : 'Enter your company name.'),
    jobTitle: (v) => (v.trim().length >= 2 ? '' : 'Enter your job title.'),
  };

  const setupForm = (form, { alertId, optInErrorId, onSuccess }) => {
    if (!form) return;
    const alertBox = document.getElementById(alertId);

    const validateField = (input) => {
      const rule = validators[input.name];
      if (!rule) return true;
      const message = rule(input.value);
      const errorEl = document.getElementById(`err-${input.id}`);
      if (message) {
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) errorEl.textContent = message;
        return false;
      }
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
      if (errorEl) errorEl.textContent = '';
      return true;
    };

    const validateOptIn = () => {
      const checkbox = form.querySelector('input[name="optIn"]');
      const errorEl = document.getElementById(optInErrorId);
      if (!checkbox.checked) {
        if (errorEl) errorEl.textContent = 'Please confirm to continue.';
        return false;
      }
      if (errorEl) errorEl.textContent = '';
      return true;
    };

    Object.keys(validators).forEach((name) => {
      const input = form.elements[name];
      if (input) {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
          if (input.classList.contains('invalid')) validateField(input);
        });
      }
    });

    const optInCheckbox = form.querySelector('input[name="optIn"]');
    if (optInCheckbox) {
      optInCheckbox.addEventListener('change', () => {
        const errorEl = document.getElementById(optInErrorId);
        if (optInCheckbox.checked && errorEl) errorEl.textContent = '';
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      Object.keys(validators).forEach((name) => {
        const input = form.elements[name];
        if (input && !validateField(input)) isValid = false;
      });
      if (!validateOptIn()) isValid = false;

      if (!isValid) {
        if (alertBox) alertBox.hidden = false;
        const firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) {
          firstInvalid.focus();
        } else {
          const optInEl = document.getElementById(optInErrorId);
          if (optInEl && optInEl.textContent) optInEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      if (alertBox) alertBox.hidden = true;
      form.classList.add('is-loading');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      // Simulated submission — this is a design preview with no backend.
      setTimeout(() => {
        form.classList.remove('is-loading');
        onSuccess();
      }, 900);
    });
  };

  const showSuccessEverywhere = () => {
    // Inline section
    const inlineFields = document.getElementById('formFields');
    const inlineSuccess = document.getElementById('formSuccess');
    if (inlineFields) inlineFields.hidden = true;
    if (inlineSuccess) inlineSuccess.hidden = false;

    // Drawer
    const drawerForm = document.getElementById('drawerForm');
    const drawerSuccess = document.getElementById('drawerSuccess');
    if (drawerForm) drawerForm.hidden = true;
    if (drawerSuccess) {
      drawerSuccess.hidden = false;
      drawerSuccess.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  setupForm(document.getElementById('registerForm'), {
    alertId: 'formAlert',
    optInErrorId: 'err-optIn',
    onSuccess: showSuccessEverywhere,
  });

  setupForm(document.getElementById('drawerForm'), {
    alertId: 'drawerAlert',
    optInErrorId: 'err-d-optIn',
    onSuccess: showSuccessEverywhere,
  });

  const drawerSuccessClose = document.getElementById('drawerSuccessClose');
  if (drawerSuccessClose) drawerSuccessClose.addEventListener('click', closeDrawer);
})();
