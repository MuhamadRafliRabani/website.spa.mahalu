# SEO Master Document — Mahalu Spa, Nail Art & Eyelash

**Dokumen tunggal end-to-end. Ini yang dipegang Trae untuk eksekusi teknis + jadi acuan Lala untuk task manual (GBP, konten, dll).**

**Target: Depok | Bahasa: Indonesia | Tujuan utama: Booking via widget**
**Update terakhir: data bisnis terverifikasi Lala**

---

## 0. DATA BISNIS RESMI (SUDAH DIVERIFIKASI — pakai ini di semua tempat)

```
Nama bisnis: Mahalu Spa, Nail Art & Eyelash
Kategori GBP: Beauty salon [⚠️ perlu dicek ulang manual — lihat §1]
Alamat: Jl. Raya Abdul Gani No.48, RT.006/RW.001, Kalibaru,
        Kec. Cilodong, Kota Depok, Jawa Barat 16414, Indonesia
Telepon/WhatsApp: +62 896-0909-5700  ✅ (dikonfirmasi Lala — INI YANG BENAR)
Jam operasional: 10:00 - 22:00, setiap hari
Website resmi: https://spa.mahalu.group/
Instagram: https://www.instagram.com/mahaluspa/
TikTok: https://www.tiktok.com/@mahalu.spa
Rating Google: 5.0 dari 368 review (per data GBP terakhir dicek)
```

⚠️ **Nomor `+62896-0909-4700` yang sempat muncul di Google Business Profile itu SALAH.** Nomor yang benar `0896-0909-5700`. Ini prioritas #1 untuk diperbaiki manual (lihat §1).

---

## 1. ACTION MANUAL LALA — GBP & NAP Cleanup (lakukan SEBELUM/BARENGAN dengan kerjaan Trae)

Ini bukan kerjaan Trae — ini murni dashboard/akun yang cuma bisa kamu yang akses.

- [ ] **Login Google Business Profile Manager** (business.google.com), buka listing "Mahalu Spa, Nail Art & Eyelash"
- [ ] **Ganti Website** dari `mahalu.group` → `https://spa.mahalu.group/`
- [ ] **Ganti nomor telepon** dari `+62896-0909-4700` → `+62 896-0909-5700`
- [ ] **Cek ulang jam operasional** di GBP — pastikan tertulis 10:00–22:00 setiap hari (Senin–Minggu), termasuk cek apakah ada jam khusus hari libur nasional yang perlu di-set
- [ ] **Cek kategori bisnis** — saat ini "Beauty salon". Rekomendasi: tambahkan kategori sekunder yang lebih spesifik biar lebih match dengan search intent:
  - Kategori utama: **Day spa** (lebih akurat dari "Beauty salon" kalau fokus utama treatment spa/relaksasi)
  - Kategori sekunder: **Nail salon**, **Eyelash salon**, **Facial spa** (pilih yang tersedia di list Google — nama kategori resmi Google kadang beda dikit dari istilah umum)
  - Alasan: kategori GBP mempengaruhi keyword apa yang bikin bisnismu muncul di local pack Google Maps. "Beauty salon" saja terlalu umum & bersaing dengan salon rambut, dll.
- [ ] **Samakan nomor telepon & alamat** ini persis di: Instagram bio, TikTok bio, WhatsApp Business profile, dan website — semua harus identik karakter demi karakter (termasuk format spasi/strip)
- [ ] Setelah semua diperbaiki, cek lagi di Google Search "mahalu spa" untuk konfirmasi perubahan sudah tampil (biasanya butuh beberapa hari untuk update)

---

## 2. AUDIT TEKNIS WEBSITE (temuan dari crawl langsung)

| Item                                         | Status                                                | Catatan                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Title & meta description homepage            | ✅ Ada, cukup baik                                    | Bisa dioptimalkan sedikit (§4)                                                                                           |
| Meta keywords                                | ⚠️ Obsolete, boleh diabaikan                          | Google sudah tidak pakai tag ini sejak 2009                                                                              |
| **Canonical URL & og:url di `/about-us`**    | 🔴 **BUG — prioritas tertinggi Trae**                 | Mengarah ke `www.mahalu.group/about-us`, seharusnya `spa.mahalu.group/about-us`. Cek semua halaman lain untuk bug serupa |
| Open Graph & Twitter Card homepage           | ✅ Lengkap                                            | —                                                                                                                        |
| Schema markup (JSON-LD)                      | ❌ Tidak ada sama sekali                              | Prioritas tinggi — lihat §6                                                                                              |
| Sitemap.xml                                  | ❌ Belum ada                                          | Buat baru — §7                                                                                                           |
| Robots.txt                                   | ❓ Belum bisa diverifikasi, kemungkinan belum optimal | Buat/perbaiki — §7                                                                                                       |
| Heading H1 homepage                          | ⚠️ "Touch. Lite. Harmony" — abstrak, minim keyword    | Rekomendasi di §4                                                                                                        |
| Halaman per layanan (nail art, eyelash, dll) | ❌ Belum ada, masih section di homepage               | Prioritas tinggi — §3                                                                                                    |
| NAP di website                               | ⚠️ Belum lengkap ditampilkan sebagai teks HTML        | Tambahkan di halaman kontak/lokasi                                                                                       |
| Nama file gambar                             | ⚠️ Generik (`gambar (2).png`)                         | Rename deskriptif untuk SEO gambar                                                                                       |

---

## 3. STRUKTUR HALAMAN (Site Architecture)

```
spa.mahalu.group/
├── / (Home)
├── /about-us
├── /layanan (Services — hub page)
│   ├── /layanan/spa-massage
│   ├── /layanan/nail-art
│   ├── /layanan/eyelash-extension
│   ├── /layanan/waxing
│   └── /layanan/facial-treatment
├── /promo (Bundle promo: Glow Ritual, Bloom Ritual, Couple Serenity, dll)
├── /lokasi (NAP lengkap + Maps embed + jam operasional)
├── /testimoni
├── /blog (opsional tapi disarankan — lihat §9)
└── /kontak
```

**Alasan halaman per layanan wajib dibuat terpisah:** tiap layanan (nail art, eyelash, waxing) punya keyword & search intent sendiri. Kompetitor terkuat (Martha Tilaar Spa Depok) menang salah satunya karena setiap treatment punya halaman detail sendiri dengan URL keyword-rich.

---

## 4. ON-PAGE SEO — Title, Meta, Heading per Halaman

### Homepage (`/`)

- **Title**: `Mahalu Spa Depok — Spa, Nail Art & Eyelash Premium | Booking Online`
- **Meta description**: `Mahalu Spa, Nail Art & Eyelash menghadirkan perawatan premium: spa, nail art, eyelash, waxing di Depok. Booking online mudah, rasakan relaksasi terbaik hari ini.`
- **H1**: ganti dari "Touch. Lite. Harmony" jadi mengandung keyword, contoh: `Mahalu Spa Depok — Ruang Ketenangan untuk Tubuh & Pikiran` (tagline lama bisa jadi eyebrow/kicker text di atas H1, branding tetap terjaga)
- **H2** section berikutnya: satu per layanan utama (Spa & Massage, Nail Art, Eyelash, Waxing), masing-masing link ke halaman detailnya
- Tambahkan section rating eksplisit: **"⭐ 5.0 — 368 Google Reviews"** di dekat hero/CTA (kompetitor Martha Tilaar melakukan ini dan efektif untuk trust)

### /about-us

- Fix canonical/og:url dulu (§2)
- Title: `Tentang Mahalu Spa Depok — Filosofi & Cerita Kami`
- Tambahkan info tahun berdiri, jumlah customer, atau sertifikasi terapis kalau ada (trust signal / E-E-A-T)

### /layanan/[nama-layanan] — contoh nail-art

- Title: `Nail Art Depok — Harga & Booking Online | Mahalu Spa`
- H1: `Nail Art Depok`
- Wajib ada: deskripsi 300+ kata natural, daftar sub-treatment + harga (kalau boleh ditampilkan), durasi, foto asli hasil kerja, FAQ 3-5 pertanyaan, CTA booking langsung di halaman, internal link ke layanan terkait

### /promo (Bundle Promo)

- Title: `Promo Bundle Spa Depok — Glow Ritual, Bloom Ritual & Couple Serenity | Mahalu Spa`
- Tampilkan harga asli vs harga coret (sudah ada di booking widget, replikasikan di halaman ini juga sebagai teks HTML biar ke-crawl Google, bukan cuma di widget booking eksternal)

### /lokasi atau /kontak

- Tampilkan NAP versi final (§0) sebagai teks HTML biasa, bukan gambar
- Embed Google Maps
- Sebutkan landmark terdekat lokasi (Kalibaru, Cilodong — cek landmark spesifik apa yang dikenal warga sekitar, misal dekat pasar/sekolah/jalan besar apa)

---

## 5. KEYWORD STRATEGY (Depok-focused)

### Head Terms

spa depok, spa terdekat depok, nail art depok, eyelash extension depok, wellness spa depok

### Money Keywords (prioritas booking)

spa depok terbaik, massage depok, pijat relaksasi depok, nail art depok terdekat, eyelash extension depok harga, waxing depok, facial treatment depok, spa cilodong, spa dekat kalibaru depok

### Long-tail / Informational (untuk blog)

manfaat spa untuk tubuh dan pikiran, perbedaan nail art dan nail extension, eyelash extension aman atau tidak, waxing vs shaving mana yang lebih baik, cara memilih spa yang bagus dan aman

### Branded

mahalu spa, mahalu spa depok, mahalu spa nail art eyelash, mahalu spa review, mahalu spa harga

### Peluang vs Kompetitor (dari gap analysis)

- Martha Tilaar Spa Depok kuat di massage/facial/prenatal/prewedding — **belum fokus** ke nail art & eyelash → ini celah besar buat Mahalu Spa
- Bambu Spa Depok SEO-nya lemah (meta kosong, price list PDF) → gampang dikalahkan untuk keyword umum "pijat depok", "perawatan wajah depok"
- **Positioning yang disarankan**: "spa modern all-in-one" (spa + nail art + eyelash + waxing dalam 1 tempat) — angle ini belum diambil kompetitor manapun

---

## 6. SCHEMA MARKUP — Kode Siap Pakai (data sudah final)

### A. LocalBusiness Schema — pasang di root layout (semua halaman)

`components/seo/LocalBusinessSchema.tsx`

```tsx
export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: "Mahalu Spa, Nail Art & Eyelash",
    image: "https://spa.mahalu.group/assets/logo/og-image.webp",
    url: "https://spa.mahalu.group/",
    telephone: "+62896-0909-5700",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Raya Abdul Gani No.48, RT.006/RW.001, Kalibaru",
      addressLocality: "Kecamatan Cilodong, Kota Depok",
      addressRegion: "Jawa Barat",
      postalCode: "16414",
      addressCountry: "ID",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "10:00",
        closes: "22:00",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "368",
    },
    sameAs: [
      "https://www.instagram.com/mahaluspa/",
      "https://www.tiktok.com/@mahalu.spa",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

Import & render sekali di `app/layout.tsx` (root layout).

### B. Service Schema — pasang di tiap halaman /layanan/[nama]

`components/seo/ServiceSchema.tsx`

```tsx
export default function ServiceSchema({
  serviceName,
  serviceUrl,
}: {
  serviceName: string;
  serviceUrl: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: serviceName,
    provider: {
      "@type": "HealthAndBeautyBusiness",
      name: "Mahalu Spa, Nail Art & Eyelash",
      telephone: "+62896-0909-5700",
    },
    areaServed: "Kota Depok",
    url: serviceUrl,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

Pemakaian: `<ServiceSchema serviceName="Nail Art" serviceUrl="https://spa.mahalu.group/layanan/nail-art" />`

### C. Promo/Offer Schema — untuk halaman /promo

`components/seo/PromoOfferSchema.tsx`

```tsx
interface PromoItem {
  name: string;
  price: number;
  description: string;
}

export default function PromoOfferSchema({ promos }: { promos: PromoItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Bundle Promo Mahalu Spa",
    itemListElement: promos.map((promo) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: promo.name,
        description: promo.description,
      },
      priceCurrency: "IDR",
      price: promo.price,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

Contoh pemakaian (data dari booking widget saat ini):

```tsx
<PromoOfferSchema
  promos={[
    {
      name: "Glow Ritual",
      price: 450000,
      description: "Bundle 2 layanan, durasi 1 jam 45 menit",
    },
    {
      name: "Bloom Ritual",
      price: 899000,
      description: "Bundle 4 layanan, durasi 3 jam 30 menit",
    },
    {
      name: "Couple Serenity",
      price: 500000,
      description: "Bundle 2 layanan untuk pasangan, durasi 3 jam",
    },
  ]}
/>
```

### D. FAQ Schema — untuk halaman yang punya section FAQ

`components/seo/FaqSchema.tsx`

```tsx
interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSchema({ items }: { items: FaqItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

Draft pertanyaan FAQ (sesuaikan jawaban dengan kondisi asli Mahalu Spa):

1. Apakah saya harus reservasi terlebih dahulu?
2. Berapa lama sebelum jadwal saya harus datang?
3. Apa saja treatment yang tersedia di Mahalu Spa?
4. Apakah tersedia paket couple/berdua?
5. Bagaimana cara booking di Mahalu Spa?
6. Berapa kisaran harga treatment di Mahalu Spa?

### E. BreadcrumbList Schema — untuk halaman layanan

`components/seo/BreadcrumbSchema.tsx`

```tsx
interface Crumb {
  name: string;
  url: string;
}

export default function BreadcrumbSchema({ items }: { items: Crumb[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## 7. FILE TEKNIS — robots.txt, sitemap.ts, fix canonical

### `public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://spa.mahalu.group/sitemap.xml
```

### `app/sitemap.ts` (Next.js App Router)

```typescript
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://spa.mahalu.group";

  const routes = [
    "",
    "/about-us",
    "/layanan",
    "/layanan/spa-massage",
    "/layanan/nail-art",
    "/layanan/eyelash-extension",
    "/layanan/waxing",
    "/layanan/facial-treatment",
    "/promo",
    "/lokasi",
    "/testimoni",
    "/kontak",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));
}
```

_(Trae: comment dulu baris route yang halamannya belum ada, supaya sitemap tidak mengarah ke 404. Update lagi begitu halaman baru selesai dibuat.)_

### Fix canonical bug (semua halaman)

Cari di codebase semua metadata yang canonical/og:url-nya mengarah ke `www.mahalu.group` atau `mahalu.group`. Ganti ke pattern ini per halaman:

```typescript
export const metadata: Metadata = {
  alternates: { canonical: "https://spa.mahalu.group/[path-halaman-ini]" },
  openGraph: { url: "https://spa.mahalu.group/[path-halaman-ini]" },
};
```

### Technical checklist tambahan

- [ ] Cek `next.config.js` — pastikan tidak ada redirect/rewrite yang tidak sengaja mengarah ke `mahalu.group`
- [ ] Rename file gambar generik (`gambar (2).png` dst) jadi deskriptif, misal `mahalu-spa-ruang-treatment-depok.jpg`, + isi `alt` text di semua `<img>`
- [ ] Cek Core Web Vitals (PageSpeed Insights) — booking widget Zenwel sering berat di mobile, prioritaskan performa di HP karena mayoritas customer booking dari HP
- [ ] Pastikan semua link internal konsisten pakai `spa.mahalu.group` (bukan campur dengan/tanpa `www`)
- [ ] Lazy load gambar di bawah fold

---

## 8. GOOGLE SEARCH CONSOLE & GA4 (belum ada — setup dulu)

1. Setup **Google Search Console**, verifikasi domain `spa.mahalu.group`
2. Setup **GA4**, pasang tracking + event khusus untuk **klik tombol booking widget** dan **klik WhatsApp** (goal conversion utama)
3. Hubungkan GSC ke GA4
4. Submit sitemap yang baru dibuat Trae (§7) ke GSC

---

## 9. KONTEN & BLOG (opsional tapi disarankan, 2 artikel/bulan)

Topik awal:

1. Manfaat spa rutin untuk kesehatan mental & fisik
2. Panduan memilih nail art sesuai bentuk kuku
3. Eyelash extension: aman atau tidak? Ini faktanya
4. Waxing vs shaving: mana yang lebih tahan lama
5. 5 tanda kamu butuh me-time ke spa
6. Rekomendasi treatment spa untuk pertama kali coba

Setiap artikel wajib internal link ke halaman layanan terkait + CTA booking di akhir.

---

## 10. PRIORITY ACTION PLAN — Ringkasan Eksekusi

**Manual Lala (paralel, tidak perlu nunggu Trae)**

1. GBP cleanup penuh — §1 (website URL, telepon, jam, kategori, NAP consistency)

**Minggu 1 — Trae: Fix & Foundation** 2. Fix bug canonical/og:url di semua halaman (§2, §7) 3. Buat `robots.txt` + `sitemap.ts` (§7) 4. Pasang LocalBusiness schema di root layout (§6A) 5. Setup GSC + GA4, submit sitemap (§8)

**Minggu 2 — Trae: On-page** 6. Update title/meta/H1 semua halaman existing (§4) 7. Rapikan nama file gambar + alt text 8. Buat halaman `/promo` dengan Offer schema (§4, §6C)

**Minggu 3–4 — Trae: Struktur baru** 9. Buat halaman `/layanan/[masing-masing]` dengan konten unik + Service schema + FAQ schema (§4, §6B, §6D) 10. Buat/optimalkan halaman `/lokasi` dengan NAP final + Breadcrumb schema

**Bulan 2 — Lala: Local & Content** 11. Kumpulkan review aktif dari customer (follow-up WA pasca-treatment) 12. Mulai publish 2 artikel blog/bulan (§9)

**Ongoing** 13. Monitor GSC untuk keyword baru, sesuaikan konten 14. Pantau kompetitor (Bambu Spa, Martha Tilaar Spa Depok) tiap bulan
