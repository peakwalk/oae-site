(() => {
  const launchDateToken = '{{LAUNCH_DATE}}';
  const launchDateIso = document.body?.dataset.launchDateIso || '';
  const launchDate = launchDateIso ? new Date(launchDateIso) : null;
  const hasValidLaunchDate = Boolean(launchDate) && !Number.isNaN(launchDate.getTime());
  const launchDateText = hasValidLaunchDate
    ? launchDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  function initLaunchDateContent() {
    if (!hasValidLaunchDate) return;

    document.querySelectorAll('[data-launch-date]').forEach((element) => {
      element.textContent = launchDateText;

      if (element.tagName === 'TIME') {
        element.setAttribute('datetime', launchDateIso);
      }
    });

    document
      .querySelectorAll('[data-launch-date-attr]')
      .forEach((element) => {
        const attributeName = element.getAttribute('data-launch-date-attr');
        if (!attributeName) return;

        const template = element.getAttribute(attributeName);
        if (!template) return;

        element.setAttribute(
          attributeName,
          template.replaceAll(launchDateToken, launchDateText),
        );
      });
  }

  function initCountdown() {
    if (!hasValidLaunchDate) return;

    const units = {
      days: document.querySelector('[data-unit="days"]'),
      hours: document.querySelector('[data-unit="hours"]'),
      minutes: document.querySelector('[data-unit="minutes"]'),
      seconds: document.querySelector('[data-unit="seconds"]'),
    };

    if (!units.days || !units.hours || !units.minutes || !units.seconds) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();

      if (diff <= 0) {
        units.days.textContent = '0';
        units.hours.textContent = '0';
        units.minutes.textContent = '0';
        units.seconds.textContent = '0';
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      units.days.textContent = String(days);
      units.hours.textContent = String(hours).padStart(2, '0');
      units.minutes.textContent = String(minutes).padStart(2, '0');
      units.seconds.textContent = String(seconds).padStart(2, '0');
    };

    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  }

  function initNotifyForm() {
    const form = document.getElementById('notify-form');
    const email = document.getElementById('notify-email');
    const emailError = document.getElementById('notify-email-error');
    const formStatus = document.getElementById('notify-form-status');
    const honeypot = document.getElementById('notify-website');

    if (!form || !email || !emailError || !formStatus || !honeypot) {
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const defaultSubmitLabel = submitButton
      ? submitButton.textContent
      : 'Request Early Access';
    const apiEndpoint =
      form.getAttribute('data-api-endpoint') ||
      '/api/public/early-access-requests';

    const showEmailError = (message) => {
      email.classList.add('is-invalid');
      email.setAttribute('aria-invalid', 'true');
      emailError.textContent = message;
      emailError.style.display = 'block';
    };

    const clearEmailError = () => {
      email.classList.remove('is-invalid');
      email.removeAttribute('aria-invalid');
      emailError.textContent = '';
      emailError.style.display = 'none';
    };

    const showFormStatus = (message, status) => {
      formStatus.className = `form-status is-${status}`;
      formStatus.textContent = message;
    };

    const clearFormStatus = () => {
      formStatus.className = 'form-status';
      formStatus.textContent = '';
    };

    const setSubmitting = (isSubmitting) => {
      email.disabled = isSubmitting;
      email.setAttribute('aria-disabled', isSubmitting ? 'true' : 'false');

      if (!submitButton) return;

      submitButton.disabled = isSubmitting;
      submitButton.setAttribute('aria-disabled', isSubmitting ? 'true' : 'false');
      submitButton.classList.toggle('is-loading', isSubmitting);
      submitButton.textContent = isSubmitting
        ? 'Sending...'
        : defaultSubmitLabel;
      form.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
    };

    const submitEarlyAccessRequest = (emailValue) => {
      if (!apiEndpoint) {
        showFormStatus(
          'Request received. We will contact you when verified operator onboarding opens.',
          'success',
        );
        form.reset();
        return Promise.resolve();
      }

      return fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: emailValue,
          source: 'coming-soon-page',
          requestType: 'early-access',
          website: honeypot.value,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          showFormStatus(
            'Request received. We will contact you when verified operator onboarding opens.',
            'success',
          );
          form.reset();
        })
        .catch(() => {
          showFormStatus(
            'We could not submit your request right now. Please try again shortly.',
            'error',
          );
        });
    };

    const validateEmail = () => {
      const emailValue = email.value.trim();
      email.value = emailValue;

      if (!emailValue) {
        showEmailError('Enter your work email.');
        return null;
      }

      if (email.validity.typeMismatch) {
        showEmailError('Enter a valid work email address.');
        return null;
      }

      clearEmailError();
      return emailValue;
    };

    email.addEventListener('input', () => {
      if (emailError.textContent) {
        validateEmail();
      }

      if (formStatus.textContent) {
        clearFormStatus();
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const emailValue = validateEmail();
      if (!emailValue) {
        email.focus();
        return;
      }

      clearFormStatus();
      showFormStatus('Submitting your request...', 'info');
      setSubmitting(true);
      submitEarlyAccessRequest(emailValue).finally(() => {
        setSubmitting(false);
      });
    });
  }

  function initComingSoonPage() {
    initLaunchDateContent();
    initCountdown();
    initNotifyForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComingSoonPage);
  } else {
    initComingSoonPage();
  }
})();
