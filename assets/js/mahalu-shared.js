/**
 * Mahalu Spa — shared utilities untuk services.html & service-detail.html
 * Satu sumber kebenaran untuk: config API, format harga, escaping HTML,
 * dan urutan tampilan kategori/service.
 *
 * Load file ini SEBELUM script khusus tiap halaman.
 */

// ============================================================
// KONFIGURASI API PRODUKSI
// ============================================================
const API_BASE = "https://ads.langitlangit.id/backend/api";
const CATALOG_ENDPOINT = `${API_BASE}/public/products`;
const VARIANT_ENDPOINT = (variantName) =>
  `${API_BASE}/public/products/${encodeURIComponent(variantName)}`;

const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
    .format(Number(number || 0))
    .replace("Rp", "Rp ");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// URUTAN TAMPILAN SERVICE
// ------------------------------------------------------------
// Atur urutan di sini, BUKAN di database/API — karena urutan tampilan
// adalah keputusan desain frontend, bukan struktur data.
//
// Aturan:
// 1. Key kategori & nama service di bawah harus lowercase (dicocokkan
//    dengan .trim().toLowerCase() saat runtime, jadi tidak case-sensitive
//    di sisi pemakaian).
// 2. Service yang TIDAK terdaftar di array tetap tampil — urutan aslinya
//    dari API dipertahankan (stable sort), diletakkan setelah service
//    yang terdaftar dan sebelum "Add On".
// 3. Service dengan nama mengandung "add on" SELALU dilempar ke posisi
//    paling akhir, di kategori manapun, terdaftar atau tidak.
// ============================================================
const SERVICE_ORDER = {
  "spa & wellness": ["massage", "bath & wellness", "body treatment"],
  beauty: ["basic nail care", "eyelash care", "brow care"],
};

function sortServices(categoryName, services) {
  const order =
    SERVICE_ORDER[
      String(categoryName || "")
        .trim()
        .toLowerCase()
    ] || [];

  return [...(services || [])]
    .map((service, originalIndex) => ({ service, originalIndex }))
    .sort((a, b) => {
      const an = String(a.service.name || "")
        .trim()
        .toLowerCase();
      const bn = String(b.service.name || "")
        .trim()
        .toLowerCase();
      const aIsAddOn = an.includes("add on");
      const bIsAddOn = bn.includes("add on");
      if (aIsAddOn !== bIsAddOn) return aIsAddOn ? 1 : -1;

      const ai = order.indexOf(an);
      const bi = order.indexOf(bn);
      if (ai === -1 && bi === -1) return a.originalIndex - b.originalIndex;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map((wrapped) => wrapped.service);
}

// ============================================================
// Cari konteks (kategori + service induk + variant sebelah) sebuah
// variant di dalam katalog penuh. Dipakai di service-detail.html untuk
// breadcrumb fallback & section "Layanan Terkait" — karena endpoint
// detail variant kemungkinan tidak mengembalikan nama kategori/service
// induknya secara langsung.
// ============================================================
function findVariantContext(catalog, variantName) {
  const target = String(variantName || "")
    .trim()
    .toLowerCase();
  for (const category of catalog || []) {
    for (const service of category.services || []) {
      const variants = service.variants || [];
      const index = variants.findIndex(
        (v) =>
          String(v.name || "")
            .trim()
            .toLowerCase() === target,
      );
      if (index !== -1) {
        return {
          category,
          service,
          variant: variants[index],
          siblings: variants.filter((_, i) => i !== index),
        };
      }
    }
  }
  return null;
}
