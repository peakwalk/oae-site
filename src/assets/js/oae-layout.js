(function () {
  function buildHeader(page) {
    var isMain = page === 'main';
    var homeFile = 'index.html';
    var registerFile = 'coming-soon.html';
    var homePrefix = isMain ? '' : homeFile;

    return `
<header class="header sticky-bar header-nextlevel">
  <div class="container">
    <div class="main-header header-shell">
      <div class="header-left header-left-next">
        <div class="header-logo header-logo-next">
          <a class="d-flex" href="${homeFile}">
            <img alt="Operator Asset Exchange" src="assets/imgs/template/logo.png"/>
          </a>
        </div>
      </div>
      <div class="header-center header-center-next">
        <nav aria-label="Primary" class="nav-main-menu nav-main-next d-none d-xl-block">
          <ul class="main-menu main-menu-next">
            <li><a href="${homePrefix}#home">Home</a></li>
            <li><a href="${homePrefix}#features">Features</a></li>
            <li><a href="${homePrefix}#how-it-works">How It Works</a></li>
            <li><a href="${homePrefix}#cases">Use Cases</a></li>
            <li><a href="${homePrefix}#faq">FAQ</a></li>
            <li><a href="${homePrefix}#pricing">Pricing</a></li>
            <li><a href="${homePrefix}#contact">Contact</a></li>
            <li class="nav-cta"><a class="btn-nav-primary" href="${registerFile}">Create an Account</a></li>
          </ul>
        </nav>
      </div>
      <div class="header-right-next">
        <div class="burger-icon burger-icon-white burger-next d-xl-none">
          <span class="burger-icon-top"></span>
          <span class="burger-icon-mid"></span>
          <span class="burger-icon-bottom"></span>
        </div>
      </div>
    </div>
  </div>
</header>
<div class="mobile-header-wrapper-style">
  <div class="mobile-header-wrapper-inner">
    <div class="mobile-header-content-area">
      <div class="mobile-nav-top">
        <div class="mobile-nav-brand">
          <div class="brand-left">
            <img alt="Operator Asset Exchange" src="assets/imgs/template/logo.png"/>
            <div class="mobile-brand-copy">
              <div class="eyebrow">Operator-only platform</div>
              <div class="title">Operator Asset Exchange</div>
            </div>
          </div>
          <div class="burger-icon burger-close burger-icon-white mobile-nav-close">
            <span class="burger-icon-top"></span>
            <span class="burger-icon-mid"></span>
            <span class="burger-icon-bottom"></span>
          </div>
        </div>
        <div class="mobile-nav-summary">
          <p>Search equipment, post urgent requests, and connect directly with verified operators.</p>
        </div>
      </div>
      <div class="mobile-nav-body">
        <div class="mobile-menu-wrap mobile-header-border">
          <nav>
            <ul class="mobile-menu">
              <li><a href="${homePrefix}#home">Home</a></li>
              <li><a href="${homePrefix}#features">Features</a></li>
              <li><a href="${homePrefix}#how-it-works">How It Works</a></li>
              <li><a href="${homePrefix}#cases">Use Cases</a></li>
              <li><a href="${homePrefix}#faq">FAQ</a></li>
              <li><a href="${homePrefix}#contact">Contact</a></li>
              <li><a href="${homePrefix}#pricing">Pricing</a></li>
            </ul>
          </nav>
        </div>
        <div class="mobile-nav-footer">
          <a class="btn btn-brand-1 hover-up btn-cta btn-nav-primary-mobile" href="${registerFile}">Create an Account</a>
          <div class="mobile-nav-meta">Verified operator access. No brokers. No commission.</div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="body-overlay-1"></div>`;
  }

  function buildFooter() {
    return `
<footer class="footer footer-clean">
  <div class="footer-1">
    <div class="footer-2">
      <div class="container">
        <div class="footer-top-clean">
          <div class="row align-items-center gy-3">
            <div class="col-lg-6 text-center text-lg-start">
              <div class="footer-brand-clean">Operator Asset Exchange</div>
              <p class="footer-meta-clean mb-0">Direct operator-to-operator equipment sourcing.</p>
            </div>
            <div class="col-lg-6 text-center text-lg-end">
              <nav aria-label="Footer" class="footer-nav-clean">
                <a href="privacy-policy.html">Privacy policy</a>
                <a href="cookie-policy.html">Cookies</a>
                <a href="terms-of-use.html">Terms of service</a>
              </nav>
            </div>
          </div>
        </div>
        <div class="footer-bottom-clean">
          <div class="row align-items-center">
            <div class="col-12 text-center text-lg-end">
              <span>Operator Asset Exchange 2026. All rights reserved.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>
<button aria-label="Back to top" id="scrollUp" type="button">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>`;
  }

  function mountLayout() {
    var body = document.body;
    if (!body) return;
    var page = body.getAttribute('data-layout-page') || 'main';
    var headerMount = document.getElementById('site-header');
    if (headerMount) headerMount.outerHTML = buildHeader(page);
    var footerMount = document.getElementById('site-footer');
    if (footerMount) footerMount.outerHTML = buildFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLayout);
  } else {
    mountLayout();
  }
})();
