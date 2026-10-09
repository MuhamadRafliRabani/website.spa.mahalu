/**
 * Mahalu Spa - Footer Component Injector
 */

function injectFooter() {
  const footerContainer = document.getElementById("footer-container");
  if (!footerContainer) return;

  const currentYear = new Date().getFullYear();

  const footerHTML = `
    <footer class="bg-text text-bg border-t-[6px] border-accent pt-16 pb-8">
      <div class="max-w-[1400px] mx-auto px-6 md:px-12">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          <div class="md:col-span-4 flex flex-col">
            <img
              class="h-16 w-auto object-contain object-left mb-6 filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
              src="/assets/logo/Logo2.png"
              alt="Mahalu Spa"
              loading="lazy"
            />
            <p class="font-body font-light text-bg/80 leading-relaxed max-w-sm">
              Rasakan ketenangan sejati dan kemewahan perawatan tradisional di
              jantung kota Depok.
            </p>
          </div>

          <div class="md:col-span-2 flex flex-col">
            <h3 class="font-head text-xl tracking-wider text-accent mb-6">Explore</h3>
            <ul class="flex flex-col gap-4 font-body font-light text-bg/80">
              <li><a href="/" class="hover:text-accent transition-colors">Home</a></li>
              <li><a href="/about-us" class="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="/services" class="hover:text-accent transition-colors">Services</a></li>
              <li><a href="/gallery" class="hover:text-accent transition-colors">Gallery</a></li>
              <li><a href="/contact-us" class="hover:text-accent transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div class="md:col-span-3 flex flex-col">
            <h3 class="font-head text-xl tracking-wider text-accent mb-6">Legal</h3>
            <ul class="flex flex-col gap-4 font-body font-light text-bg/80">
              <li><a href="/privacy-policy" class="hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-&-conditions" class="hover:text-accent transition-colors">Terms & Conditions</a></li>
              <li><a href="/return-&-refund-policy" class="hover:text-accent transition-colors">Return & Refund Policy</a></li>
              <li><a href="/delivery-policy" class="hover:text-accent transition-colors">Delivery Policy</a></li>
            </ul>
          </div>

          <div class="md:col-span-3 flex flex-col">
            <h3 class="font-head text-xl tracking-wider text-accent mb-6">Contact Us</h3>
            <address class="not-italic flex flex-col gap-4 font-body font-light text-bg/80">
              <p class="leading-relaxed">
                Jl. Raya Abdul Gani No.48, RT.006/RW.001, Kalibaru, Kec. Cilodong, Kota Depok, Jawa Barat 16414, Indonesia
              </p>
              <a href="tel:+6289609095700" class="hover:text-accent transition-colors">+62 896-0909-5700</a>
              <a href="mailto:info@mahalu.group" class="hover:text-accent transition-colors">info@mahalu.group</a>
            </address>
          </div>
        </div>

        <div class="w-full h-[1px] bg-bg/10 mb-8"></div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          <p class="text-sm tracking-widest font-light text-bg/50 uppercase text-center md:text-left">
            © ${currentYear} Mahalu Spa. All Rights Reserved.
          </p>

          <div class="flex items-center gap-6">
            <a href="https://www.instagram.com/mahaluspa" target="_blank" class="text-bg/60 hover:text-accent hover:-translate-y-1 transition-all duration-300" aria-label="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://www.facebook.com/mahaluspa" target="_blank" class="text-bg/60 hover:text-accent hover:-translate-y-1 transition-all duration-300" aria-label="Facebook">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `;

  footerContainer.innerHTML = footerHTML;
}

// Jalankan saat DOM siap
document.addEventListener("DOMContentLoaded", injectFooter);
