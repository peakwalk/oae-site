(() => {
  "use strict";

  function hidePreloader() {
    const preloader = document.getElementById("preloader-active");
    if (!preloader) return;

    preloader.style.transition = "opacity 0.3s ease";
    preloader.style.opacity = "0";

    window.setTimeout(() => {
      preloader.style.display = "none";
    }, 300);
  }

  function initStickyHeader() {
    const header = document.querySelector(".sticky-bar");
    if (!header) return;

    const syncStickyState = () => {
      header.classList.toggle("stick", window.scrollY >= 200);
    };

    syncStickyState();
    window.addEventListener("scroll", syncStickyState, { passive: true });
  }

  function initWow() {
    if (typeof window.WOW !== "function") return;
    new window.WOW().init();
  }

  function initBackToTop() {
    const button = document.getElementById("scrollUp");
    if (!button) return;

    const syncVisibility = () => {
      button.classList.toggle("is-visible", window.scrollY >= 300);
    };

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    syncVisibility();
    window.addEventListener("scroll", syncVisibility, { passive: true });
  }

  function initMobileMenu() {
    const body = document.body;
    let lastOpenTrigger = null;

    const getMobilePanel = () =>
      document.querySelector(".mobile-header-wrapper-style");
    const getMobileScrollContainer = () =>
      document.querySelector(".mobile-header-wrapper-inner");
    const getToggleTriggers = () =>
      Array.from(
        document.querySelectorAll('[data-mobile-nav-action="toggle"]'),
      );
    const getHeader = () => document.querySelector(".header-nextlevel");

    const syncMobileOffset = () => {
      const header = getHeader();
      const offset = header
        ? Math.round(header.offsetHeight || header.getBoundingClientRect().height)
        : 0;
      document.documentElement.style.setProperty(
        "--mobile-nav-offset",
        `${offset}px`,
      );
    };

    const setOpenState = (isOpen, options = {}) => {
      const { restoreFocus = true } = options;
      const mobilePanel = getMobilePanel();
      if (!mobilePanel) return;

      syncMobileOffset();
      mobilePanel.classList.toggle("sidebar-visible", isOpen);
      mobilePanel.setAttribute("aria-hidden", String(!isOpen));
      body.classList.toggle("mobile-menu-active", isOpen);

      if (isOpen) {
        const scrollContainer = getMobileScrollContainer();
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }

      getToggleTriggers().forEach((trigger) => {
        trigger.classList.toggle("burger-close", isOpen);
        trigger.setAttribute("aria-expanded", String(isOpen));
        trigger.setAttribute(
          "aria-label",
          isOpen ? "Close navigation" : "Open navigation",
        );
      });

      if (
        !isOpen &&
        restoreFocus &&
        lastOpenTrigger &&
        typeof lastOpenTrigger.focus === "function"
      ) {
        lastOpenTrigger.focus();
      }
    };

    syncMobileOffset();

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;

      const toggleTrigger = event.target.closest(
        '[data-mobile-nav-action="toggle"]',
      );
      if (toggleTrigger) {
        event.preventDefault();
        lastOpenTrigger = toggleTrigger;
        const mobilePanel = getMobilePanel();
        const isOpen = mobilePanel?.classList.contains("sidebar-visible");
        setOpenState(!isOpen);
        return;
      }

      if (event.target.closest(".body-overlay-1")) {
        setOpenState(false);
        return;
      }

      if (event.target.closest(".mobile-menu a")) {
        setOpenState(false, { restoreFocus: false });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpenState(false);
      }
    });

    window.addEventListener("scroll", syncMobileOffset, { passive: true });
    window.addEventListener("resize", () => {
      syncMobileOffset();
      if (window.innerWidth >= 1200) {
        setOpenState(false, { restoreFocus: false });
      }
    });
  }

  function initSiteChrome() {
    initWow();
    initStickyHeader();
    initBackToTop();
    initMobileMenu();
  }

  window.addEventListener("load", hidePreloader);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteChrome);
  } else {
    initSiteChrome();
  }
})();
