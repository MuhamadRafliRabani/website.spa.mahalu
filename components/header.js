/**
 * Mahalu Spa - Header Component Injector
 * Mengatur Navigasi Desktop, Mobile Nav, dan Logika Scroll
 */

function injectHeader() {
  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) return;

  const currentPath = window.location.pathname.split("/")[1] || "/";

  const headerHTML = `
<header id="main-header" class="fixed top-0 w-full z-[100] transition-all duration-500">
  
  <!-- overlay -->
  <div id="header-overlay" class="absolute inset-0 pointer-events-none transition-all duration-500"></div>

  <div id="nav-inner" class="container max-w-[1400px] mx-auto px-6 md:px-12 py-3 flex justify-between items-center transition-all duration-500">
        
    <!-- Logo -->
    <a href="/">
      <img
        src="/assets/logo/Logo2.png"
        class="h-16 md:h-20 transition-all duration-500"
        id="site-logo-img"
      />
    </a>

    <!-- Desktop Nav -->
    <nav class="hidden md:block">
      <ul class="flex gap-10 text-sm tracking-widest uppercase font-medium">
        ${navItem("/", "Home", "/" + currentPath)}
        ${navItem("/about-us", "About Us", "/" + currentPath)}
        ${navItem("/services", "Services", "/" + currentPath)}
        ${navItem("/gallery", "Gallery", "/" + currentPath)}
        ${navItem("/contact-us", "Contact Us", "/" + currentPath)}
      </ul>
    </nav>

    <!-- Actions -->
    <div class="flex items-center gap-6">
      <a 
  data-mahalu-booking
      
      class="hidden md:inline-flex bg-accent text-bg px-8 py-3 rounded-full text-xs font-bold tracking-widest hover:bg-bg hover:text-accent hover:-translate-y-1 transition-all duration-300"
        href="/booking/">
        BOOK NOW
      </a>

      <button id="hamburger" class="flex flex-col gap-1 md:hidden">
        <span class="w-6 h-0.5 bg-white"></span>
        <span class="w-6 h-0.5 bg-white"></span>
        <span class="w-6 h-0.5 bg-white"></span>
      </button>
    </div>
  </div>
</header>

<!-- MOBILE -->
<nav id="mobileNav" class="fixed inset-0 bg-accent/70 backdrop-blur-md z-[90] flex flex-col items-center justify-center gap-8 opacity-0 pointer-events-none transition-all duration-500">
  <ul class="flex flex-col gap-8 text-white text-3xl text-center">
        ${navItem("/", "Home", "/" + currentPath)}
        ${navItem("/about-us", "About Us", "/" + currentPath)}
        ${navItem("/services", "Services", "/" + currentPath)}
        ${navItem("/gallery", "Gallery", "/" + currentPath)}
        ${navItem("/contact-us", "Contact Us", "/" + currentPath)}
    <li><a
  href="/booking/"
  data-mahalu-booking
  class="inline-flex items-center justify-center bg-accent text-bg px-10 py-4 rounded-full font-semibold tracking-widest text-sm hover:bg-bg hover:text-accent hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(178,102,50,0.4)] transition-all duration-300"
>
  BOOK NOW
</a></li>
  </ul>
</nav>
`;

  headerContainer.innerHTML = headerHTML;
  initHeaderLogic();
}

function navItem(link, label, currentPath) {
  const active =
    currentPath === link ? "text-accent border-b border-accent" : "";
  return `<li>
    <a href="${link}" class="nav-link-modern ${active}">${label}</a>
  </li>`;
}

function initHeaderLogic() {
  const header = document.getElementById("main-header");
  const overlay = document.getElementById("header-overlay");
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobileNav");

  // SCROLL
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("bg-accent/70", "backdrop-blur-md", "shadow-lg");
      overlay.classList.add("bg-[#3b2a23]/20");
    } else {
      header.classList.remove("bg-accent/70", "backdrop-blur-md", "shadow-lg");
      overlay.classList.remove("bg-[#3b2a23]/20");
    }
  });

  // MOBILE
  hamburger.addEventListener("click", () => {
    mobileNav.classList.toggle("opacity-0");
    mobileNav.classList.toggle("pointer-events-none");
    document.body.style.overflow = mobileNav.classList.contains("opacity-0")
      ? ""
      : "hidden";
  });
}

// Jalankan saat DOM siap
document.addEventListener("DOMContentLoaded", injectHeader);
