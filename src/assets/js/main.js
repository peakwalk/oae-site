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
    const mobilePanel = document.querySelector(".mobile-header-wrapper-style");
    const overlay = document.querySelector(".body-overlay-1");
    const triggers = Array.from(document.querySelectorAll(".burger-icon"));
    const menuLinks = Array.from(document.querySelectorAll(".mobile-menu a"));

    if (!mobilePanel || triggers.length === 0) return;

    const setOpenState = (isOpen) => {
      mobilePanel.classList.toggle("sidebar-visible", isOpen);
      body.classList.toggle("mobile-menu-active", isOpen);
      triggers.forEach((trigger) => {
        trigger.classList.toggle("burger-close", isOpen);
      });

      if (isOpen) {
        window.scrollTo(0, 0);
      }
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const isOpen = mobilePanel.classList.contains("sidebar-visible");
        setOpenState(!isOpen);
      });
    });

    if (overlay) {
      overlay.addEventListener("click", () => {
        setOpenState(false);
      });
    }

    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        setOpenState(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
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
