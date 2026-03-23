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
    const getOpenTriggers = () =>
      Array.from(
        document.querySelectorAll('[data-mobile-nav-action="open"]'),
      );
    const getCloseTriggers = () =>
      Array.from(
        document.querySelectorAll('[data-mobile-nav-action="close"]'),
      );

    const setOpenState = (isOpen) => {
      const mobilePanel = getMobilePanel();
      if (!mobilePanel) return;

      mobilePanel.classList.toggle("sidebar-visible", isOpen);
      mobilePanel.setAttribute("aria-hidden", String(!isOpen));
      body.classList.toggle("mobile-menu-active", isOpen);
      getOpenTriggers().forEach((trigger) => {
        trigger.setAttribute("aria-expanded", String(isOpen));
      });
      getCloseTriggers().forEach((trigger) => {
        trigger.setAttribute("aria-expanded", String(isOpen));
      });

      if (isOpen) {
        window.scrollTo(0, 0);
      } else if (lastOpenTrigger && typeof lastOpenTrigger.focus === "function") {
        lastOpenTrigger.focus();
      }
    };

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;

      const openTrigger = event.target.closest('[data-mobile-nav-action="open"]');
      if (openTrigger) {
        event.preventDefault();
        lastOpenTrigger = openTrigger;
        setOpenState(true);
        return;
      }

      const closeTrigger = event.target.closest(
        '[data-mobile-nav-action="close"]',
      );
      if (closeTrigger) {
        event.preventDefault();
        setOpenState(false);
        return;
      }

      if (event.target.closest(".body-overlay-1")) {
        setOpenState(false);
        return;
      }

      if (event.target.closest(".mobile-menu a")) {
        setOpenState(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpenState(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1200) {
        setOpenState(false);
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
