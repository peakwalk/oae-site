(() => {
  function initFaqAccordion() {
    const faqButtons = document.querySelectorAll('.faq-question');
    if (!faqButtons.length) return;

    faqButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        if (!item) return;

        const isOpen = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach((faqItem) => {
          faqItem.classList.remove('active');
          const faqButton = faqItem.querySelector('.faq-question');
          if (faqButton) {
            faqButton.setAttribute('aria-expanded', 'false');
          }
        });

        if (!isOpen) {
          item.classList.add('active');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaqAccordion);
  } else {
    initFaqAccordion();
  }
})();
