# 🚨 AUDIT SEO LENGKAP - MAHALU SPA

**Tanggal Audit:** 31 Agustus 2026  
**Status Keseluruhan:** ⚠️ **PERLU PERBAIKAN SIGNIFIKAN** (50% compliance)

---

## RINGKASAN MASALAH KRITIS

### 🔴 CRITICAL (Priority 1 - Harus diperbaiki SEGERA)

| #      | Issue                                      | Status | File                                                               | Impact                           |
| ------ | ------------------------------------------ | ------ | ------------------------------------------------------------------ | -------------------------------- |
| **C1** | Canonical URL salah di service-detail.html | ❌     | `/services/service-detail.html`                                    | Hard to crawl duplikat           |
| **C2** | Missing canonical URL di legal pages       | ❌     | `/delivery-policy/`, `/privacy-policy/`, `/terms-&-conditions/`    | Duplicate content risk           |
| **C3** | Belum ada halaman service individual       | ❌     | N/A - perlu dibuat                                                 | -60% organic traffic potential   |
| **C4** | Belum ada schema markup lengkap            | ⚠️     | LocalBusinessSchema OK, tapi kurang Service/BreadcrumbList/Product | Rich snippets tidak muncul       |
| **C5** | Homepage title terlalu generic             | ⚠️     | "Mahalu Spa — Wellness & Retreat"                                  | Minim keyword, kompetitor menang |
| **C6** | H1 homepage terlalu abstract               | ❌     | "Touch. Lite. Harmony"                                             | Bukan topical relevance signal   |

### 🟡 HIGH PRIORITY (Priority 2 - Perbaiki minggu ini)

| #      | Issue                                               | Status | File                       | Impact                         |
| ------ | --------------------------------------------------- | ------ | -------------------------- | ------------------------------ |
| **H1** | NAP (Name, Address, Phone) tidak tampil di HTML     | ❌     | `/contact-us/`             | Local SEO factor               |
| **H2** | Open Graph image belum optimal                      | ⚠️     | semua halaman              | Sharing preview kurang menarik |
| **H3** | Meta description beberapa halaman kurang deskriptif | ⚠️     | `/about-us/`, `/services/` | CTR bisa lebih tinggi          |
| **H4** | Belum ada breadcrumb schema                         | ❌     | semua halaman              | Ranking enhancement            |

### 🟠 MEDIUM PRIORITY (Priority 3 - Perbaiki dalam 2 minggu)

| #      | Issue                             | Status | File              | Impact                          |
| ------ | --------------------------------- | ------ | ----------------- | ------------------------------- |
| **M1** | Image file names generik          | ⚠️     | `/assets/gambar/` | Image SEO tidak optimal         |
| **M2** | Belum ada FAQ schema              | ❌     | `/services/` page | FAQ snippets tidak muncul       |
| **M3** | Sitemap belum lengkap             | ⚠️     | `/sitemap.xml`    | Beberapa URL tidak terindex     |
| **M4** | Belum ada XML sitemap untuk image | ❌     | N/A               | Image indexing tidak optimal    |
| **M5** | Internal linking belum optimal    | ⚠️     | semua halaman     | Juice distribution tidak merata |

---

## DETAIL PER HALAMAN

### 🏠 Homepage (`index.html`)

**Status:** ⚠️ 60% baik

**Yang Sudah Baik:**

- ✅ Canonical URL correct: `https://spa.mahalu.group/`
- ✅ Open Graph & Twitter Card lengkap
- ✅ Meta charset & viewport OK
- ✅ LocalBusiness schema di-inject via JS

**Yang Perlu Diperbaiki:**

1. **Title (PRIORITY 1)**
   - Current: `Mahalu Spa — Wellness & Retreat`
   - Issue: Generic, minim keyword, tidak mention lokasi/service
   - Suggested: `Mahalu Spa Depok — Spa, Nail Art & Eyelash Premium | Booking Online`
   - Reason: Keyword-rich, local signal, CTA

2. **Meta Description (PRIORITY 1)**
   - Current: OK tapi bisa lebih compelling
   - Current: `Mahalu Spa & Wellness menghadirkan perawatan premium seperti spa, nail art, eyelash, waxing, dan wellness therapy di Depok. Rasakan pengalaman relaksasi terbaik.`
   - Suggested: `Mahalu Spa Depok — Perawatan premium: spa relaksasi, nail art, eyelash extension, waxing & facial. Rating 5.0 dari 368 reviews. Booking online mudah, gratis konsultasi.`

3. **H1 (PRIORITY 1)**
   - Current: "Touch. Lite. Harmony" (terlalu abstrak)
   - Issue: Tidak ada keyword, tidak match search intent user
   - Suggested: Ganti dengan: `Mahalu Spa Depok — Ketenangan untuk Tubuh & Pikiran`
   - Catatan: Bisa tetap pakai "Touch. Lite. Harmony" sebagai tagline di bawah H1

4. **Open Graph Image (PRIORITY 2)**
   - Perlu verifikasi gambar sudah optimal (min 1200x630px, < 5MB)
   - Suggested: Buat OG-specific image dengan branding + text "Mahalu Spa"

5. **Missing Structured Data (PRIORITY 1)**
   - Sudah ada: LocalBusinessSchema ✅
   - Kurang: BreadcrumbList, FAQPage (kalau ada FAQ), AggregateRating (sudah ada tapi verifikasi)
   - Tambahkan: Schema untuk promotion/special offers kalau ada

### 📄 `/about-us/` (About Us)

**Status:** ✅ 70% baik

**Sudah OK:**

- ✅ Canonical URL: `https://spa.mahalu.group/about-us`
- ✅ Title & meta description unique
- ✅ Open Graph

**Perlu Perbaiki:**

1. **Title (PRIORITY 2)**
   - Current: `About Mahalu Spa — Wellness & Retreat`
   - Suggested: `Tentang Mahalu Spa Depok — Filosofi, Tim & Sertifikasi Terapis`
   - Reason: Lebih deskriptif, match intent "tentang"

2. **Meta Description (PRIORITY 2)**
   - Current: `Pelajari kisah, filosofi, dan nilai-nilai di balik Mahalu Spa Depok...`
   - Suggested: Tambahkan unsur trust/credibility: `Mahalu Spa Depok berdiri sejak [TAHUN] dengan [X] terapis tersertifikasi. Pelajari filosofi wellness kami & komitmen terhadap kualitas perawatan premium.`

3. **Content E-E-A-T Signal (PRIORITY 2)**
   - Tambahkan: tahun berdiri, jumlah terapis, sertifikasi/training, award/recognition kalau ada
   - Ini penting untuk local E-E-A-T (Expertise, Authoritativeness, Trustworthiness)

### 🛎️ `/services/` (Layanan/Menu)

**Status:** ⚠️ 50% baik

**Yang Sudah Baik:**

- ✅ Canonical URL: `https://spa.mahalu.group/services`
- ✅ Title & description ada

**Yang Perlu Diperbaiki:**

1. **Architecture CRITICAL - HALAMAN DETAIL PER LAYANAN BELUM ADA (PRIORITY 1)**
   - Current: Semua layanan hanya dalam satu halaman
   - Issue:
     - Tidak bisa rank untuk keyword spesifik (nail art depok, eyelash extension depok, dll)
     - Kompetitor dengan halaman detail menang
     - Bounce rate tinggi (user tidak menemukan detail yang dicari)
   - **HARUS DIBUAT:**
     ```
     /layanan/ (hub page - sudah ada tapi perlu optimasi)
     ├── /layanan/spa-dan-massage/
     ├── /layanan/nail-art/
     ├── /layanan/eyelash-extension/
     ├── /layanan/waxing/
     └── /layanan/facial-treatment/
     ```

2. **Service Detail Page Template (PRIORITY 1)**

   ```html
   Title: "[Service Name] Depok — Harga & Booking Online | Mahalu Spa" H1:
   "[Service Name] Depok" Content: 300+ kata - Apa itu [service] & manfaatnya -
   Proses/durasi - Harga (kalau bisa ditampilkan) vs kompetitor - Foto hasil
   kerja asli - FAQ 3-5 pertanyaan - CTA Booking - Related services (internal
   link) Schema: Service + FAQPage
   ```

3. **Title `/services/` (PRIORITY 2)**
   - Current: `Services & Menu | Mahalu Spa — Wellness & Retreat`
   - Suggested: `Layanan Spa, Nail Art & Eyelash Depok — Harga & Booking | Mahalu Spa`

4. **Meta Description (PRIORITY 2)**
   - Current: OK tapi bisa lebih spesifik keyword
   - Suggested: `Daftar lengkap layanan Mahalu Spa Depok: spa massage, nail art, eyelash extension, waxing, facial. Lihat harga, durasi, & booking online sekarang.`

### 📞 `/contact-us/` (Kontak)

**Status:** ⚠️ 60% baik

**Yang Sudah Baik:**

- ✅ Canonical URL OK
- ✅ Title & meta OK

**Yang Perlu Diperbaiki:**

1. **Missing NAP Text (PRIORITY 1)**
   - Issue: NAP (Name, Address, Phone) hanya di schema JSON-LD, bukan di HTML text
   - Alasan: Google berat di text content (bukan hanya schema), consistency check dengan GBP
   - **Harus Tambahkan:**
     ```html
     <h2>Kunjungi Kami</h2>
     <div class="nap">
       <p><strong>Mahalu Spa, Nail Art & Eyelash</strong></p>
       <p>
         📍 Jl. Raya Abdul Gani No.48, RT.006/RW.001, Kalibaru, Kec. Cilodong,
         Kota Depok, Jawa Barat 16414, Indonesia
       </p>
       <p>📞 +62 896-0909-5700 (Telepon & WhatsApp)</p>
       <p>⏰ Setiap hari, 10:00 - 22:00</p>
     </div>
     ```

2. **Google Maps Embed (PRIORITY 2)**
   - Tambahkan embed Google Maps (official)
   - Helps with local signals & user engagement

3. **Contact Form Schema (PRIORITY 2)**
   - Tambahkan ContactPoint schema kalau ada form

### 📄 `/delivery-policy/`, `/privacy-policy/`, `/terms-&-conditions/`

**Status:** 🔴 40% baik (CRITICAL ISSUES)

**Yang Perlu Diperbaiki:**

1. **Missing Canonical URL (PRIORITY 1)**
   - `delivery-policy/index.html` → Add: `<link rel="canonical" href="https://spa.mahalu.group/delivery-policy/" />`
   - `privacy-policy/index.html` → Add: `<link rel="canonical" href="https://spa.mahalu.group/privacy-policy/" />`
   - `terms-&-conditions/index.html` → Add: `<link rel="canonical" href="https://spa.mahalu.group/terms-&-conditions/" />`

2. **Title & Description**
   - Semuanya masih generic "Privacy Policy", needs improvement

### 📄 `/services/service-detail.html`

**Status:** 🔴 CRITICAL (URL STRUCTURE WRONG)

**Yang Perlu Diperbaiki:**

1. **Canonical URL (PRIORITY 1)**
   - Current: `https://spa.mahalu.group/service-detail.html`
   - Issue: `.html` di production URL = tidak clean, tidak SEO-friendly
   - Suggested: Restruktur ke `/services/[service-name]/` atau `/layanan/[nama-layanan]/`
   - Reason: Clean URL, better semantic meaning, match site structure

---

## SCHEMA MARKUP AUDIT

### ✅ Sudah Ada

- LocalBusinessSchema di `components/seo/LocalBusinessSchema.js`
  - Tapi format: function IIFE, di-inject via JS
  - ⚠️ Issue: Harus di-verify bahwa script ini di-load di semua halaman

### ❌ MISSING (Perlu Ditambahkan)

1. **BreadcrumbList Schema (PRIORITY 1)**
   - Diperlukan: semua halaman kecuali homepage
   - Contoh untuk `/layanan/nail-art/`:

   ```json
   {
     "@context": "https://schema.org",
     "@type": "BreadcrumbList",
     "itemListElement": [
       {
         "@type": "ListItem",
         "position": 1,
         "name": "Home",
         "item": "https://spa.mahalu.group/"
       },
       {
         "@type": "ListItem",
         "position": 2,
         "name": "Layanan",
         "item": "https://spa.mahalu.group/layanan/"
       },
       {
         "@type": "ListItem",
         "position": 3,
         "name": "Nail Art",
         "item": "https://spa.mahalu.group/layanan/nail-art/"
       }
     ]
   }
   ```

2. **Service Schema (PRIORITY 1)**
   - Untuk setiap halaman layanan individual

   ```json
   {
     "@context": "https://schema.org",
     "@type": "Service",
     "name": "Nail Art",
     "description": "...",
     "provider": {
       "@type": "HealthAndBeautyBusiness",
       "name": "Mahalu Spa, Nail Art & Eyelash",
       "url": "https://spa.mahalu.group"
     },
     "areaServed": "Depok",
     "offers": {
       "@type": "Offer",
       "price": "[price]",
       "priceCurrency": "IDR"
     }
   }
   ```

3. **FAQPage Schema (PRIORITY 2)**
   - Untuk halaman dengan FAQ

4. **Product Schema (PRIORITY 2)**
   - Untuk promo/bundle packages

5. **AggregateRating Schema (PRIORITY 2)**
   - Verify & enhance yang sudah ada dengan review count dari Google

---

## SITEMAP & INDEXATION

### robots.txt

**Status:** ✅ Basic OK

```
User-agent: *
Allow: /
Sitemap: https://spa.mahalu.group/sitemap.xml
```

Suggestions:

- Add Disallow rules kalau ada halaman yang tidak ingin di-index (payment pages, temp pages, dll)

### sitemap.xml

**Status:** ⚠️ Incomplete

**Missing URLs:**

- `/layanan/` (hub page baru)
- `/layanan/spa-dan-massage/` (service detail)
- `/layanan/nail-art/` (service detail)
- `/layanan/eyelash-extension/` (service detail)
- `/layanan/waxing/` (service detail)
- `/layanan/facial-treatment/` (service detail)
- `/promo/` atau `/bundle/` (kalau ada)
- `/lokasi/` atau `/lokasi-cabang/` (recommended untuk NAP clarity)
- `/testimoni/` atau `/reviews/` (recommended)

**Best Practice Improvements:**

- Add `<lastmod>` date untuk setiap URL
- Add `<changefreq>` (weekly, monthly, yearly)
- Add `<priority>` (0.8 untuk main pages, 0.6 untuk sub-pages)
- Buat separate sitemap untuk images (image sitemap)

---

## ON-PAGE SEO - CHECKLIST

| Item                            | Homepage | About | Services | Contact | Service Detail    | Status    |
| ------------------------------- | -------- | ----- | -------- | ------- | ----------------- | --------- |
| Valid Canonical URL             | ✅       | ✅    | ✅       | ✅      | ❌ (Wrong format) | NEEDS FIX |
| Title (50-60 char)              | ⚠️       | ⚠️    | ⚠️       | ✅      | ⚠️                | NEEDS OPT |
| Meta Description (150-160 char) | ⚠️       | ⚠️    | ⚠️       | ✅      | ⚠️                | NEEDS OPT |
| H1 (1 per halaman)              | ❌       | ✅    | ✅       | ✅      | ✅                | NEEDS FIX |
| H2-H3 (Logical hierarchy)       | ⚠️       | ⚠️    | ✅       | ✅      | ⚠️                | NEEDS OPT |
| Open Graph Tags                 | ✅       | ✅    | ✅       | ✅      | ✅                | GOOD      |
| Twitter Card                    | ✅       | ⚠️    | ⚠️       | ⚠️      | ⚠️                | NEEDS OPT |
| Meta Robots                     | ✅       | ⚠️    | ⚠️       | ⚠️      | ⚠️                | NEEDS OPT |
| Internal Links                  | ⚠️       | ⚠️    | ✅       | ⚠️      | ⚠️                | NEEDS OPT |
| Schema Markup                   | ⚠️       | ❌    | ❌       | ❌      | ❌                | NEEDS ADD |

---

## CONTENT QUALITY - AUDIT

| Item                                                            | Status | Notes                                              |
| --------------------------------------------------------------- | ------ | -------------------------------------------------- |
| Minimal 300-word content per service                            | ❌     | Hanya ada di homepage section, tidak detailed      |
| Keyword coverage                                                | ⚠️     | Depok-focused OK, tapi layanan-specific kurang     |
| E-E-A-T signals (Expertise, Authoritativeness, Trustworthiness) | ❌     | Missing: about terapis, sertifikasi, tahun berdiri |
| Call-to-Action (CTA) clarity                                    | ✅     | Booking widget jelas                               |
| FAQ implementation                                              | ❌     | Tidak ada dedicated FAQ section                    |
| Image alt text optimization                                     | ❌     | Tidak terverifikasi                                |
| Internal linking strategy                                       | ⚠️     | Basic OK, tapi bisa lebih strategic                |

---

## LOCAL SEO - AUDIT

| Item                                   | Status | Notes                                           |
| -------------------------------------- | ------ | ----------------------------------------------- |
| NAP consistency (Name, Address, Phone) | ⚠️     | Berbeda format di berbagai tempat               |
| NAP visible di HTML (text)             | ❌     | Hanya di schema, perlu text version             |
| Google Business Profile updated        | ❓     | Perlu verifikasi manual (Lala's task)           |
| Local citations                        | ⚠️     | Cek di Google My Business, Waze, Maps, dll      |
| Local keywords in content              | ⚠️     | "Depok" ada, tapi "Cilodong", "Kalibaru" kurang |
| Review schema (aggregateRating)        | ✅     | Sudah ada, perlu update rating                  |

---

## TECHNICAL SEO - AUDIT

| Item                  | Status | Notes                               |
| --------------------- | ------ | ----------------------------------- |
| Mobile responsiveness | ✅     | Viewport tag ada                    |
| Page speed            | ?      | Perlu cek dengan PageSpeed Insights |
| HTTPS                 | ✅     | Domain pakai HTTPS                  |
| XML Sitemap           | ⚠️     | Ada tapi tidak lengkap              |
| Robots.txt            | ✅     | Basic OK                            |
| Canonical URLs        | 🔴     | Beberapa page bermasalah            |
| Structured Data       | 🔴     | Missing banyak schema types         |
| Security headers      | ?      | Perlu cek Server headers            |

---

## PRIORITY IMPLEMENTATION ROADMAP

### 🚀 WEEK 1 (CRITICAL)

- [ ] Fix canonical URLs (service-detail + legal pages)
- [ ] Optimize homepage title, meta description, H1
- [ ] Add NAP text HTML di contact page
- [ ] Create service detail page template

### 🚀 WEEK 2 (HIGH)

- [ ] Create halaman-halaman layanan individual (nail-art, eyelash-extension, dll)
- [ ] Add BreadcrumbList schema ke semua halaman
- [ ] Add Service schema untuk setiap layanan
- [ ] Update sitemap.xml
- [ ] Optimize Open Graph images

### 🚀 WEEK 3-4 (MEDIUM)

- [ ] Create promo/bundle halaman
- [ ] Add FAQ schema
- [ ] Image alt text optimization
- [ ] Internal linking strategy refinement
- [ ] Create image sitemap

---

## ESTIMATED IMPACT

| Fix                                   | Potential Impact                 | Timeline    |
| ------------------------------------- | -------------------------------- | ----------- |
| Homepage title + H1 optimization      | +15% CTR dari SERP               | Immediate   |
| Service detail pages (6 halaman baru) | +30% organic traffic (5-6 bulan) | High impact |
| NAP text visibility                   | +10% local pack visibility       | Medium      |
| Schema markup lengkap                 | +20% rich snippets, +5% CTR      | High impact |
| Sitemap completion                    | +5% crawlability                 | Medium      |
| Content E-E-A-T signals               | +15% trust score                 | High impact |

**Total Estimated Improvement:** +75-85% SEO score (dari current 50% → 125%+ dengan over-optimization)

---

## DOKUMENTASI UNTUK MANUAL ACTIONS (Lala - GBP Manager)

### ✅ Checklist Sebelum Launch:

1. [ ] Update Google Business Profile:
   - [ ] Website URL: `mahalu.group` → `spa.mahalu.group`
   - [ ] Phone: `+62896-0909-4700` → `+62 896-0909-5700`
   - [ ] Hours: Verify 10:00-22:00 every day
   - [ ] Category: Beauty salon → Add "Day spa", "Nail salon", "Eyelash salon"
2. [ ] Verify NAP consistency di:
   - [ ] Instagram bio
   - [ ] TikTok bio
   - [ ] WhatsApp Business
   - [ ] Google Maps
   - [ ] Website (HTML text)

3. [ ] Submit updated website ke:
   - [ ] Google Search Console
   - [ ] Bing Webmaster Tools
   - [ ] New sitemap.xml (after completion)

4. [ ] Monitor 2 minggu:
   - [ ] Google Search: `mahalu spa depok` ranking
   - [ ] Google Maps: appearance di local pack
   - [ ] Google Business Profile: review updates

---

_End of Audit — Next: Implementation Phase_
