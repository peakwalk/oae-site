(function () {
  var logoUrl = new URL('../images/brand/logo.png', import.meta.url).toString();

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
            <img alt="Operator Asset Exchange" src="${logoUrl}"/>
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
      <div class="header-right header-right-next">
        <button
          type="button"
          class="burger-icon burger-icon-white burger-next d-xl-none"
          aria-label="Open navigation"
          aria-controls="mobile-navigation"
          aria-expanded="false"
          data-mobile-nav-action="toggle"
        >
          <span class="burger-icon-top"></span>
          <span class="burger-icon-mid"></span>
          <span class="burger-icon-bottom"></span>
        </button>
      </div>
    </div>
  </div>
</header>
<div class="mobile-header-wrapper-style" id="mobile-navigation" aria-hidden="true">
  <div class="mobile-header-wrapper-inner">
    <div class="mobile-header-content-area">
      <div class="mobile-menu-wrap" role="presentation">
        <nav aria-label="Mobile navigation">
          <ul class="mobile-menu">
            <li><a href="${homePrefix}#home">Home</a></li>
            <li><a href="${homePrefix}#features">Features</a></li>
            <li><a href="${homePrefix}#how-it-works">How It Works</a></li>
            <li><a href="${homePrefix}#cases">Use Cases</a></li>
            <li><a href="${homePrefix}#faq">FAQ</a></li>
            <li><a href="${homePrefix}#pricing">Pricing</a></li>
            <li><a href="${homePrefix}#contact">Contact</a></li>
          </ul>
        </nav>
      </div>
      <div class="mobile-menu-footer">
        <div class="mobile-menu-footer-inner">
          <div class="site-copyright">Operator Asset Exchange 2026. All rights reserved.</div>
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
