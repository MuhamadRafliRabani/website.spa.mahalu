document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. IMPORT COMPONENTS (Header & Footer)
    const [headerRes, footerRes] = await Promise.all([
      fetch("components/header.html"),
      fetch("components/footer.html"),
    ]);

    if (headerRes.ok) {
      document.getElementById("header-container").innerHTML =
        await headerRes.text();
      initHeaderScript(); // Jalankan fungsi animasi header setelah HTML masuk
    }

    if (footerRes.ok) {
      document.getElementById("footer-container").innerHTML =
        await footerRes.text();
    }

    // 2. JALANKAN ANIMASI SCROLL REVEAL
    initScrollReveal();
  } catch (error) {
    console.error("Gagal memuat komponen:", error);
  }
});

// --- FUNGSI INISIALISASI HEADER ---
function initHeaderScript() {
  const header = document.getElementById("main-header");
  const navInner = document.getElementById("nav-inner");
  const logoImg = document.getElementById("site-logo-img");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("bg-accent/95", "backdrop-blur-sm", "shadow-lg");
      navInner.classList.replace("py-5", "py-3");
      if (logoImg) {
        logoImg.classList.replace("h-16", "h-12");
        logoImg.classList.replace("md:h-20", "md:h-16");
      }
    } else {
      header.classList.remove("bg-accent/95", "backdrop-blur-sm", "shadow-lg");
      navInner.classList.replace("py-3", "py-5");
      if (logoImg) {
        logoImg.classList.replace("h-12", "h-16");
        logoImg.classList.replace("md:h-16", "md:h-20");
      }
    }
  });

  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobileNav");
  const mobileNavLinks = mobileNav.querySelectorAll("a");

  const toggleMenu = () => {
    hamburger.classList.toggle("active");
    if (mobileNav.classList.contains("opacity-0")) {
      mobileNav.classList.remove("opacity-0", "pointer-events-none");
      mobileNav.classList.add("open");
      document.body.style.overflow = "hidden";
    } else {
      mobileNav.classList.add("opacity-0", "pointer-events-none");
      mobileNav.classList.remove("open");
      document.body.style.overflow = "";
    }
  };

  if (hamburger) hamburger.addEventListener("click", toggleMenu);

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (hamburger.classList.contains("active")) toggleMenu();
    });
  });
}

// --- FUNGSI SCROLL REVEAL ---
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  document
    .querySelectorAll(".reveal-fade")
    .forEach((el) => observer.observe(el));
}
