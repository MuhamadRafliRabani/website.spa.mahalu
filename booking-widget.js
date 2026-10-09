/* ==========================================================================
   MAHALU SPA — BOOKING WIDGET
   Single-file, dependency-free, embedded directly via <script> tag.
   Structure:
     1. Config              6. Cart actions        11. Confirm step
     2. Format/DOM helpers  7. Voucher              12. T&C accordion
     3. Icons                8. Staff auto-assign   13. Right panel
     4. Bundle pricing       9. Submit / book        14. Mobile bar
     5. State + selectors   10. Styles + shell       15. Open/close/init
   ========================================================================== */
(function (W, D) {
  "use strict";

  /* ── 1. CONFIG ── */
  const CFG = W.MAHALU_BOOKING_CONFIG || {};
  const API = (CFG.apiBase || "https://bms-api.mahalu.group/api").replace(
    /\/$/,
    "",
  );
  const SUCCESS_PATH = CFG.successPath || "/payment-success.html";
  const CANCEL_PATH = CFG.cancelPath || "/payment-cancel.html";

  function buildRedirectUrl(path, bookingCode) {
    const base = W.location.origin + path;
    const sep = path.indexOf("?") === -1 ? "?" : "&";
    return base + sep + "payment_ref=" + encodeURIComponent(bookingCode);
  }

  /* ── 2. FORMAT / DOM HELPERS ── */
  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function idr(n) {
    return "Rp\u00A0" + Number(n || 0).toLocaleString("id-ID");
  }
  function dur(minutes) {
    if (!minutes) return "\u2014";
    if (minutes < 60) return minutes + " menit";
    const h = Math.floor(minutes / 60);
    const r = minutes % 60;
    return r ? h + " jam " + r + " mnt" : h + " jam";
  }
  function todayISO() {
    const d = new Date();
    return (
      d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate())
    );
  }
  function monthStr(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1);
  }
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function $(id) {
    return D.getElementById(id);
  }
  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      const args = arguments;
      const ctx = this;
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms);
    };
  }
  function parseTimeToMinutes(time) {
    const parts = String(time || "").split(":");
    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    return Number.isFinite(hour) && Number.isFinite(minute)
      ? hour * 60 + minute
      : -1;
  }
  function addMin(time, mins) {
    const t0 = parseTimeToMinutes(time);
    if (t0 < 0) return time;
    const t1 = t0 + mins;
    const h = Math.floor(t1 / 60);
    const m = t1 % 60;
    return pad2(h) + ":" + pad2(m);
  }
  function isTimeRangeOverlap(startA, durationA, startB, durationB) {
    const a0 = parseTimeToMinutes(startA);
    const b0 = parseTimeToMinutes(startB);
    if (a0 < 0 || b0 < 0 || durationA <= 0 || durationB <= 0) return false;
    const a1 = a0 + durationA;
    const b1 = b0 + durationB;
    return a0 < b1 && b0 < a1;
  }
  function uuid4() {
    if (typeof crypto !== "undefined" && crypto.randomUUID)
      return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      },
    );
  }

  function getQueryParam(name) {
    const urlParams = new URLSearchParams(W.location.search);
    return urlParams.get(name);
  }

  /* ── 3. ICONS (shared inline SVG snippets, kept small on purpose) ── */
  const ICON_CHECK_9 =
    '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const ICON_CHECK_10 =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const ICON_CLOCK_10 =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bk-mu)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

  function checkBadgeHTML() {
    return (
      '<span style="position:absolute;top:8px;right:8px;width:18px;height:18px;border-radius:50%;background:var(--bk-ac);display:flex;align-items:center;justify-content:center;">' +
      ICON_CHECK_9 +
      "</span>"
    );
  }

  /* ── 4. BUNDLE PRICING ── */
  function calcPricing(bundle) {
    const items = bundle.bundle_items || [];
    let subtotal = 0;
    let totalDuration = 0;
    let itemCount = 0;
    items.forEach(function (item) {
      const qty = item.quantity || 1;
      const price = Number(
        item.price ||
          (item.service_variant && item.service_variant.retail_price) ||
          0,
      );
      const durationMinutes =
        item.duration_minutes ||
        (item.service_variant && item.service_variant.duration_minutes) ||
        0;
      subtotal += price * qty;
      totalDuration += durationMinutes * qty;
      itemCount += qty;
    });
    const discountAmount =
      bundle.bundle_type === "percentage"
        ? (subtotal * Number(bundle.discount_value)) / 100
        : Number(bundle.discount_value || 0);
    return {
      subtotal: subtotal,
      discountAmount: discountAmount,
      finalPrice: Math.max(0, subtotal - discountAmount),
      totalDuration: totalDuration,
      itemCount: itemCount,
    };
  }
  function discLabel(type, val) {
    return type === "percentage" ? "Diskon " + val + "%" : "Hemat " + idr(val);
  }

  /* ── 5. STATE ── */
  const S = {
    step: "customer",
    form: { name: "", phone: "" },
    cartLines: [],
    browseMode: "services",
    activeCat: "",
    search: "",
    viewingMonth: monthStr(),
    selectedDate: "",
    selectedSlot: "",
    staffAssignments: [],
    resourceAssignments: [],
    variants: [],
    categories: [],
    bundles: [],
    membershipEligibility: null,
    membershipPackages: [],
    membershipPackagesLoading: false,
    membershipPurchaseView: false,
    membershipBuying: false,
    membershipPaymentUrl: "",
    membershipPurchaseMessage: "",
    _membershipPollTimer: null,
    membershipQtyByVariant: {},
    _membershipFetchSeq: 0,
    _membershipQueryKey: "",
    membershipErr: "",
    membershipBookingPaid: false,
    availDates: [],
    availSlots: null,
    custCount: null,
    createdBooking: null,
    submitting: false,
    tncAccepted: false,
    _tncOpen: false,
    voucherCode: "",
    voucherApplied: null,
    bogoEligible: [],
    bonusScheduleMode: "same_date",
    bonusSelectedDate: "",
    bonusSelectedSlot: "",
    bonusStaffAssignments: [],
    bonusResourceAssignments: [],
    bonusAvailSlots: null,
    bonusSlotsLoading: false,
    _bonusFetchSeq: 0,
    _focusBogo: false,
    applyingVoucher: false,
    promoType: "",
    promoEligibleFreeServices: [],
    promoBundle: null,
    isParallel: false,
    err: "",
  };

  /* ── derived / selectors ── */
  function round2(n) {
    return Math.round(Number(n || 0) * 100) / 100;
  }
  function normalizedVoucherCode() {
    return String(S.voucherCode || "")
      .trim()
      .toUpperCase();
  }
  function getCartLineQty(id) {
    const line = S.cartLines.find(function (l) {
      return l.kind === "service" && !l.isFree && l.variant.id === id;
    });
    return line ? line.qty || 1 : 0;
  }
  function subtotalAmt() {
    return S.cartLines.reduce(function (sum, line) {
      const qty = Number(line.qty || 1);
      if (line.kind === "bundle") {
        return sum + Number(line.pricing.finalPrice || 0) * qty;
      }
      const price = Number(line.variant ? line.variant.price : 0);
      const membershipQty = Math.min(
        qty,
        Number(S.membershipQtyByVariant[line.variant.id] || 0),
      );
      return sum + (line.isFree ? 0 : price * (qty - membershipQty));
    }, 0);
  }
  function grossAmt() {
    return S.cartLines.reduce(function (sum, line) {
      const qty = Number(line.qty || 1);
      if (line.kind === "bundle") {
        return sum + Number(line.pricing.subtotal || 0) * qty;
      }
      const price = Number(line.variant ? line.variant.price : 0);
      const membershipQty = Math.min(
        qty,
        Number(S.membershipQtyByVariant[line.variant.id] || 0),
      );
      return sum + price * (line.isFree ? 0 : qty - membershipQty);
    }, 0);
  }
  function maxPaidServicePrice() {
    return S.cartLines.reduce(function (max, line) {
      if (line.kind !== "service" || line.isFree) return max;
      const price = Number(
        line.variant && line.variant.price ? line.variant.price : 0,
      );
      return price > max ? price : max;
    }, 0);
  }
  function canUseAppliedVoucher() {
    const code = normalizedVoucherCode();
    if (!code || !S.voucherApplied) return false;
    if (S.voucherApplied.code !== code) return false;
    if (!S.selectedDate || !S.selectedSlot) return false;
    if (!S.cartLines.length) return false;

    // BOGO vouchers skip the subtotal-match check: eligibility was already
    // confirmed server-side when the free bonus service was picked.
    const snap = S.voucherApplied.applied_voucher;
    const isBogo = !!(snap && snap.promo_type === "bogo");
    if (isBogo) return true;

    // Use a slightly larger tolerance (5.0) for rounding differences between FE and BE
    // Compare against grossAmt if it's a percentage voucher, or subtotalAmt otherwise?
    // Actually, FE uses grossAmt for display, let's stick to subtotalAmt for validation
    // but the backend might have switched to gross_amount in its response.
    const diff = Math.abs(
      round2(S.voucherApplied.subtotal_amount) - round2(subtotalAmt()),
    );
    return diff < 5.0;
  }
  function totalAmt() {
    if (canUseAppliedVoucher())
      return round2(Number(S.voucherApplied.total_amount || 0));
    return round2(subtotalAmt());
  }
  function voucherDiscountAmt() {
    if (canUseAppliedVoucher())
      return round2(Number(S.voucherApplied.discount_amount || 0));
    return 0;
  }
  function totalDur() {
    const sequential = S.cartLines.reduce(function (sum, line) {
      if (line.kind === "service" && line.isFree) return sum;
      const qty = line.qty || 1;
      return (
        sum +
        (line.kind === "bundle"
          ? line.pricing.totalDuration * qty
          : line.variant.duration * qty)
      );
    }, 0);

    if (S.isParallel) {
      const paxTotals = new Map();
      S.cartLines.forEach(function (line) {
        if (line.kind === "service" && line.isFree) return;
        const qty = line.qty || 1;
        if (line.kind === "bundle") {
          (line.bundle.bundle_items || []).forEach(function (item) {
            const itemQty = Math.max(1, Number(item.quantity || 1));
            const dur = item.duration_minutes || 0;
            for (let i = 1; i <= itemQty * qty; i++) {
              paxTotals.set(i, (paxTotals.get(i) || 0) + dur);
            }
          });
        } else {
          const dur = line.variant.duration || 0;
          for (let i = 1; i <= qty; i++) {
            paxTotals.set(i, (paxTotals.get(i) || 0) + dur);
          }
        }
      });

      let maxDur = 0;
      paxTotals.forEach(function (val) {
        if (val > maxDur) maxDur = val;
      });
      return maxDur;
    }

    return sequential;
  }
  function selectedFreeVariant() {
    const line = S.cartLines.find(function (l) {
      return l.kind === "service" && !!l.isFree;
    });
    return line ? line.variant : null;
  }
  function mainBookingDuration() {
    return totalDur();
  }
  function syncBonusSelectedDate() {
    if (S.bonusScheduleMode === "same_date" && S.selectedDate) {
      S.bonusSelectedDate = S.selectedDate;
    }
  }
  function bonusSlotConflictsWithPaidBooking(slot) {
    if (
      !S.selectedDate ||
      !S.selectedSlot ||
      !S.bonusSelectedDate ||
      S.bonusSelectedDate !== S.selectedDate
    ) {
      return false;
    }
    const bonusVar = selectedFreeVariant();
    if (!bonusVar) return false;

    // User wants bonus to be sequential (after main booking) if on same date
    const mainStart = parseTimeToMinutes(S.selectedSlot);
    const mainDuration = totalDur();
    const mainEnd = mainStart + mainDuration;

    const bonusStart = parseTimeToMinutes(slot.slot_time);

    // Conflict if bonus starts before main booking ends
    return bonusStart < mainEnd;
  }
  function isSlotDisabled(slot) {
    if (!slot.is_available) return true;

    // Check if past time
    const now = new Date();
    const todayStr = todayISO();

    if (S.selectedDate === todayStr) {
      const parts = slot.slot_time.split(":");
      const slotH = parseInt(parts[0], 10);
      const slotM = parseInt(parts[1], 10);
      const nowH = now.getHours();
      const nowM = now.getMinutes();

      // Nonaktifkan jika jam slot sudah lewat dari jam sekarang
      if (slotH < nowH || (slotH === nowH && slotM <= nowM)) {
        return true;
      }
    }
    return false;
  }
  function isBonusSlotDisabled(slot) {
    if (!slot.is_available || bonusSlotConflictsWithPaidBooking(slot))
      return true;

    // Check if past time
    const now = new Date();
    const todayStr = todayISO();

    if (S.bonusSelectedDate === todayStr) {
      const parts = slot.slot_time.split(":");
      const slotH = parseInt(parts[0], 10);
      const slotM = parseInt(parts[1], 10);
      const nowH = now.getHours();
      const nowM = now.getMinutes();

      // Nonaktifkan jika jam slot sudah lewat dari jam sekarang
      if (slotH < nowH || (slotH === nowH && slotM <= nowM)) {
        return true;
      }
    }
    return false;
  }
  function ensureBonusSlotsLoaded() {
    if (!selectedFreeVariant()) return;
    syncBonusSelectedDate();
    if (!S.bonusSelectedDate || S.bonusSlotsLoading) return;
    if (S.bonusAvailSlots !== null) return;
    fetchBonusSlots();
  }
  function getBundleItemVariantId(item) {
    const raw =
      (item && item.bms_ms_service_variant_id) ||
      (item && item.service_variant_id) ||
      (item && item.service_variant && item.service_variant.id) ||
      null;
    const n = Number(raw);
    return n ? n : null;
  }
  function selectedVarIds() {
    const ids = [];
    S.cartLines.forEach(function (line) {
      const qty = line.qty || 1;
      if (line.kind === "service") {
        if (line.isFree) return;
        for (let i = 0; i < qty; i++) ids.push(line.variant.id);
      } else {
        (line.bundle.bundle_items || []).forEach(function (item) {
          const id = getBundleItemVariantId(item);
          if (!id) return;
          const itemQty = Math.max(1, Number(item.quantity || 1));
          const totalQty = itemQty * qty;
          for (let i = 0; i < totalQty; i++) ids.push(id);
        });
      }
    });
    return ids;
  }
  function selectedVarGroups() {
    const groups = [];
    S.cartLines.forEach(function (line, lineIdx) {
      const groupId = line.groupId || generateUniqueGroupId();
      if (line.kind === "service") {
        if (line.isFree) return;
        groups.push({
          variant_id: line.variant.id,
          qty: line.qty || 1,
          group_id: groupId,
        });
      } else {
        (line.bundle.bundle_items || []).forEach(function (item) {
          const id = getBundleItemVariantId(item);
          if (!id) return;
          groups.push({
            variant_id: id,
            qty: Math.max(1, Number(item.quantity || 1)) * (line.qty || 1),
            group_id: groupId,
          });
        });
      }
    });
    return groups;
  }
  function selectedVarUnits() {
    const units = [];
    S.cartLines.forEach(function (line, lineIdx) {
      const qty = line.qty || 1;
      const groupId = line.groupId || generateUniqueGroupId();

      if (line.kind === "service") {
        if (line.isFree) return;
        for (let i = 0; i < qty; i++) {
          units.push({
            key: groupId + ":" + line.variant.id + ":" + (i + 1),
            variantId: line.variant.id,
            unitIndex: i + 1,
            groupId: groupId,
          });
        }
      } else {
        (line.bundle.bundle_items || []).forEach(function (item) {
          const id = getBundleItemVariantId(item);
          if (!id) return;
          const itemQty = Math.max(1, Number(item.quantity || 1));
          const totalQty = itemQty * qty;
          for (let i = 0; i < totalQty; i++) {
            units.push({
              key: groupId + ":" + id + ":" + (i + 1),
              variantId: id,
              unitIndex: i + 1,
              groupId: groupId,
            });
          }
        });
      }
    });
    return units;
  }
  function inCart(id) {
    return S.cartLines.some(function (l) {
      return l.kind === "service" && !l.isFree && l.variant.id === id;
    });
  }
  function inFreeCart(id) {
    return S.cartLines.some(function (l) {
      return l.kind === "service" && !!l.isFree && l.variant.id === id;
    });
  }
  function isBogoActive() {
    if (S.promoType === "p1" || S.promoType === "p2") return true;
    return !!(
      S.voucherApplied &&
      S.voucherApplied.applied_voucher &&
      S.voucherApplied.applied_voucher.promo_type === "bogo"
    );
  }
  function isBogoEligibleId(id) {
    return (S.bogoEligible || []).some(function (raw) {
      return Number(raw && raw.id) === Number(id);
    });
  }

  // These 4 service-variant IDs are the "Balinese massage" family. They
  // share one rule: once ANY of them is a paid line in the cart, none of
  // them can also be picked as the free BOGO bonus (same-family bonuses
  // aren't allowed). The original code expressed this as 4 near-identical
  // functions with 4 reordered-but-equal arrays — collapsed here into one
  // symmetric group, same net behavior.
  const BALINESE_BOGO_GROUP = [1, 2, 6, 7];
  function isBonusBlockedByPaidSelection(id) {
    if (BALINESE_BOGO_GROUP.indexOf(id) === -1) return false;
    return S.cartLines.some(function (l) {
      return (
        l.kind === "service" &&
        !l.isFree &&
        BALINESE_BOGO_GROUP.indexOf(Number(l.variant.id)) !== -1
      );
    });
  }

  function selectedBundleId() {
    const line = S.cartLines.find(function (l) {
      return l.kind === "bundle";
    });
    return line ? line.bundle.id : null;
  }
  function membershipEligibilityForVariant(id) {
    return (
      (S.membershipEligibility &&
        S.membershipEligibility.variants &&
        S.membershipEligibility.variants[String(id)]) ||
      null
    );
  }
  function membershipQtyForVariant(id) {
    return Number(S.membershipQtyByVariant[id] || 0);
  }
  function membershipUsedForBenefit(benefitId, exceptVariantId) {
    return S.cartLines.reduce(function (sum, line) {
      if (
        line.kind !== "service" ||
        line.isFree ||
        line.variant.id === exceptVariantId
      ) {
        return sum;
      }
      const eligibility = membershipEligibilityForVariant(line.variant.id);
      return eligibility && eligibility.benefit_id === benefitId
        ? sum + membershipQtyForVariant(line.variant.id)
        : sum;
    }, 0);
  }
  function membershipRemainingForVariant(id) {
    const eligibility = membershipEligibilityForVariant(id);
    if (!eligibility || !eligibility.eligible || !eligibility.benefit_id)
      return 0;
    const otherUsed = membershipUsedForBenefit(eligibility.benefit_id, null);
    return Math.max(0, Number(eligibility.remaining || 0) - otherUsed);
  }
  function membershipMaxQtyForVariant(id) {
    const line = S.cartLines.find(function (item) {
      return item.kind === "service" && !item.isFree && item.variant.id === id;
    });
    const eligibility = membershipEligibilityForVariant(id);
    if (
      !line ||
      !eligibility ||
      !eligibility.eligible ||
      !eligibility.benefit_id
    )
      return 0;
    const otherUsed = membershipUsedForBenefit(eligibility.benefit_id, id);
    return Math.min(
      Number(line.qty || 1),
      Math.max(0, Number(eligibility.remaining || 0) - otherUsed),
    );
  }
  function updateMembershipQty(id, nextQty) {
    S.membershipQtyByVariant[id] = Math.max(
      0,
      Math.min(Number(nextQty || 0), membershipMaxQtyForVariant(id)),
    );
    refreshServicesUI();
  }
  function fetchMembershipEligibility() {
    const phone = String(S.form.phone || "").trim();
    const ids = Array.from(
      new Set(
        S.variants
          .filter(function (variant) {
            return variant.catKey === S.activeCat;
          })
          .map(function (variant) {
            return variant.id;
          })
          .concat(
            S.cartLines
              .filter(function (line) {
                return line.kind === "service" && !line.isFree;
              })
              .map(function (line) {
                return line.variant.id;
              }),
          ),
      ),
    );
    if (phone.length < 8 || !ids.length) {
      S._membershipFetchSeq += 1;
      S._membershipQueryKey = "";
      S.membershipEligibility = null;
      S.membershipQtyByVariant = {};
      return Promise.resolve();
    }

    const queryKey = phone + ":" + ids.join(",");
    if (S._membershipQueryKey === queryKey) return Promise.resolve();
    S._membershipQueryKey = queryKey;
    const fetchSeq = ++S._membershipFetchSeq;
    const params = new URLSearchParams({ phone: phone });
    ids.forEach(function (id) {
      params.append("variant_ids[]", String(id));
    });

    return apiFetch(
      "/public/customer-memberships/booking-eligibility?" + params.toString(),
    )
      .then(function (res) {
        if (fetchSeq !== S._membershipFetchSeq) return;
        S.membershipEligibility = res.data || null;
        if (!S.membershipEligibility || !S.membershipEligibility.membership) {
          S.membershipQtyByVariant = {};
        }
        refreshServicesUI();
      })
      .catch(function () {
        if (fetchSeq !== S._membershipFetchSeq) return;
        S.membershipEligibility = null;
        S.membershipQtyByVariant = {};
        refreshServicesUI();
      });
  }
  function fetchMembershipPackages() {
    if (S.membershipPackagesLoading || S.membershipPackages.length) return;
    S.membershipPackagesLoading = true;
    S.membershipErr = "";
    renderLeft();
    apiFetch("/public/membership-packages")
      .then(function (res) {
        S.membershipPackages = (res.data || []).filter(function (pkg) {
          return !!pkg.is_active;
        });
        S.membershipPackagesLoading = false;
        renderLeft();
      })
      .catch(function () {
        S.membershipPackagesLoading = false;
        S.membershipErr = "Paket membership gagal dimuat. Coba lagi.";
        renderLeft();
      });
  }
  function membershipBenefitLabel(benefit) {
    const scope = benefit.service_category_id
      ? "category"
      : benefit.service_id
        ? "service"
        : benefit.service_variant_id
          ? "variant"
          : benefit.scope;
    const target =
      (benefit.service_variant && benefit.service_variant.name) ||
      (benefit.service && benefit.service.name) ||
      (benefit.service_category && benefit.service_category.name) ||
      (benefit.serviceCategory && benefit.serviceCategory.name) ||
      "Layanan";
    const quota = Number(benefit.quota || 0);
    if (scope === "category") return quota + "x layanan kategori " + target;
    if (scope === "service") return quota + "x service " + target;
    return quota + "x " + target;
  }
  function purchaseMembershipPackage(packageId) {
    if (S.membershipBuying) return;
    if (!S.form.name.trim() || !String(S.form.phone || "").trim()) {
      S.membershipErr =
        "Isi nama dan nomor WhatsApp sebelum membeli membership.";
      renderLeft();
      return;
    }
    S.membershipBuying = true;
    S.membershipErr = "Membuat pesanan membership…";
    S.membershipPaymentUrl = "";
    S.membershipPurchaseMessage = "";
    renderLeft();

    apiFetch("/public/customer-memberships", {
      method: "POST",
      body: JSON.stringify({
        name: S.form.name.trim(),
        phone: String(S.form.phone).trim(),
        membership_package_id: packageId,
      }),
    })
      .then(function (res) {
        const membership = res.data || {};
        if (!membership.id)
          throw new Error("Membership tidak berhasil dibuat.");
        return apiFetch(
          "/public/customer-memberships/" + membership.id + "/payment",
          {
            method: "POST",
            body: JSON.stringify({
              phone: String(S.form.phone).trim(),
              return_url:
                W.location.origin +
                "/membership-payment-success.html?payment_ref={referenceId}",
              cancel_url:
                W.location.origin +
                "/membership-payment-cancel.html?payment_ref={referenceId}",
            }),
          },
        ).then(function (paymentRes) {
          return { membership: membership, payment: paymentRes.data || {} };
        });
      })
      .then(function (result) {
        S.membershipBuying = false;
        S.membershipPaymentUrl = result.payment.payment_url || "";
        S.membershipPurchaseMessage = result.payment.payment_url
          ? "Pesanan dibuat. Selesaikan pembayaran di tab baru; membership aktif setelah pembayaran diterima."
          : "Pesanan dibuat, tetapi link pembayaran belum tersedia.";
        S.membershipErr = "";
        if (result.payment.payment_url) {
          pollMembershipPayment(result.membership.id);
        }
        renderLeft();
      })
      .catch(function (error) {
        S.membershipBuying = false;
        S.membershipErr =
          (error && error.message) || "Pembelian membership gagal. Coba lagi.";
        renderLeft();
      });
  }
  function pollMembershipPayment(membershipId) {
    clearTimeout(S._membershipPollTimer);
    let attempts = 0;
    const checkStatus = function () {
      attempts += 1;
      apiFetch(
        "/public/customer-memberships/" +
          membershipId +
          "/payment-status?phone=" +
          encodeURIComponent(String(S.form.phone || "").trim()),
      )
        .then(function (res) {
          const payment = res.data || {};
          if (payment.paid) {
            S.membershipPurchaseMessage =
              "Pembayaran diterima. Membership siap digunakan.";
            S.membershipPaymentUrl = "";
            S._membershipQueryKey = "";
            refreshServicesUI();
            return;
          }
          if (payment.status === "failed" || payment.status === "cancelled") {
            S.membershipPurchaseMessage =
              "Pembayaran belum berhasil. Anda dapat mencoba link pembayaran lagi.";
            renderLeft();
            return;
          }
          if (attempts < 60) {
            S._membershipPollTimer = setTimeout(checkStatus, 5000);
          }
        })
        .catch(function () {
          if (attempts < 60) {
            S._membershipPollTimer = setTimeout(checkStatus, 5000);
          }
        });
    };
    S._membershipPollTimer = setTimeout(checkStatus, 5000);
  }
  function filteredVariants() {
    const q = S.search.toLowerCase();
    return S.variants.filter(function (v) {
      return (
        v.catKey === S.activeCat &&
        (!q ||
          v.name.toLowerCase().indexOf(q) !== -1 ||
          v.subCat.toLowerCase().indexOf(q) !== -1)
      );
    });
  }
  function filteredBundles() {
    if (!S.search.trim()) return S.bundles;
    const q = S.search.toLowerCase();
    return S.bundles.filter(function (b) {
      return (
        b.name.toLowerCase().indexOf(q) !== -1 ||
        (b.description || "").toLowerCase().indexOf(q) !== -1
      );
    });
  }
  function grouped() {
    const g = {};
    filteredVariants().forEach(function (v) {
      if (!g[v.subCat]) g[v.subCat] = [];
      g[v.subCat].push(v);
    });

    // Sort categories: "Massage" first, "Spa" second, "Bath" third, others alphabetical, "ADD ON" last
    const sortedKeys = Object.keys(g).sort(function (a, b) {
      const nameA = a.toUpperCase();
      const nameB = b.toUpperCase();

      const isMassageA = nameA.indexOf("MASSAGE") !== -1;
      const isMassageB = nameB.indexOf("MASSAGE") !== -1;
      const isSpaA = nameA.indexOf("SPA") !== -1;
      const isSpaB = nameB.indexOf("SPA") !== -1;
      const isAddOnA =
        nameA === "ADD ON" ||
        nameA.indexOf("ADD_ON") !== -1 ||
        nameA.indexOf("ADDON") !== -1;
      const isAddOnB =
        nameB === "ADD ON" ||
        nameB.indexOf("ADD_ON") !== -1 ||
        nameB.indexOf("ADDON") !== -1;
      const isBathA = nameA.indexOf("BATH") !== -1;
      const isBathB = nameB.indexOf("BATH") !== -1;

      // Priority: Massage (-4) > Spa (-3) > Bath (-2) > Others (0) > ADD ON (1)
      const getPriority = function (isM, isS, isB, isA) {
        if (isM) return -4;
        if (isS) return -3;
        if (isB) return -2;
        if (isA) return 1;
        return 0;
      };

      const prioA = getPriority(isMassageA, isSpaA, isBathA, isAddOnA);
      const prioB = getPriority(isMassageB, isSpaB, isBathB, isAddOnB);

      if (prioA !== prioB) return prioA - prioB;
      return a.localeCompare(b);
    });

    const sortedG = {};
    sortedKeys.forEach(function (k) {
      // Sort items within each sub-category
      const items = g[k];
      items.sort(function (a, b) {
        const nA = a.name.toUpperCase();
        const nB = b.name.toUpperCase();

        const isBalineseA = nA.indexOf("BALINESE") !== -1;
        const isBalineseB = nB.indexOf("BALINESE") !== -1;
        const isThaiA = nA.indexOf("THAI") !== -1;
        const isThaiB = nB.indexOf("THAI") !== -1;

        const getItemPriority = function (isB, isT) {
          if (isB) return -2;
          if (isT) return -1;
          return 0;
        };

        const pA = getItemPriority(isBalineseA, isThaiA);
        const pB = getItemPriority(isBalineseB, isThaiB);

        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name);
      });
      sortedG[k] = items;
    });
    return sortedG;
  }

  /* ── API ── */
  function apiFetch(path, opts) {
    return fetch(
      API + path,
      Object.assign(
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
          },
        },
        opts || {},
      ),
    ).then(function (r) {
      if (!r.ok)
        return r.json().then(function (e) {
          throw e;
        });
      return r.json();
    });
  }

  // Shared query-string builder for the two endpoints that both take
  // variant_groups[] + an optional bundle_promo_id (available-dates,
  // available-slots). `baseParams` supplies the endpoint-specific leading
  // param (month or date) so param order stays identical to before.
  function buildVariantQuery(baseParams, variantGroups, bundlePromoId) {
    const p = new URLSearchParams(baseParams);
    if (bundlePromoId) p.set("bundle_promo_id", String(bundlePromoId));
    if (S.isParallel) p.set("is_parallel", "1");
    variantGroups.forEach(function (g, idx) {
      p.append("variant_groups[" + idx + "][variant_id]", String(g.variant_id));
      p.append("variant_groups[" + idx + "][qty]", String(g.qty));
      p.append("variant_groups[" + idx + "][group_id]", g.group_id);
    });
    return p;
  }

  // Shared slot-fetching call used by both the main schedule (fetchSlots)
  // and the bonus schedule (fetchBonusSlots). Just resolves the slot list;
  // callers own their own loading/selection state.
  function fetchAvailableSlots(date, variantGroups, bundlePromoId) {
    const params = buildVariantQuery(
      { date: date },
      variantGroups,
      bundlePromoId,
    );
    return apiFetch("/bookings/available-slots?" + params.toString()).then(
      function (res) {
        return (res.data && res.data.slots) || [];
      },
    );
  }

  function fetchVariants() {
    const promo = getQueryParam("promo");
    const endpoint = promo ? "/service-client?promo=" + promo : "/variants";

    apiFetch(endpoint)
      .then(function (res) {
        const map = new Map();
        S.variants = (res.data || []).map(function (v) {
          const catKey =
            (v.category && v.category.slug) ||
            ((v.service && v.service.name) || "other")
              .toLowerCase()
              .replace(/\s+/g, "_");
          const catLabel = (v.category && v.category.name) || catKey;
          const subCat = (v.service && v.service.name) || catLabel;
          if (!map.has(catKey)) map.set(catKey, catLabel);
          return {
            id: v.id,
            catKey: catKey,
            subCat: subCat,
            name: v.name,
            duration: v.duration_minutes || v.duration || 0,
            price: Number(v.final_price || v.retail_price || 0),
            categoryId:
              (v.category && v.category.id) ||
              (v.service && v.service.bms_ms_service_category_id) ||
              0,
          };
        });

        if (res.promo_type) {
          S.promoType = res.promo_type;
          // Clear any applied voucher if promo link is used
          S.voucherApplied = null;
          S.voucherCode = "";
        }
        if (res.eligible_free_services) {
          S.promoEligibleFreeServices = res.eligible_free_services;
          // Set bogoEligible immediately for promo query links so it's not hidden
          if (S.promoType) S.bogoEligible = res.eligible_free_services;
        }

        if (res.bundle_promo) {
          S.promoBundle = res.bundle_promo;
          // If we have a direct bundle promo from p3, we skip services and show bundles
          S.browseMode = "bundles";
          S.bundles = [res.bundle_promo];
        }

        S.categories = [];
        map.forEach(function (label, key) {
          S.categories.push({ key: key, label: label });
        });

        // Sort: Massage first, Spa second, Bath third, others alphabetical, Add On last
        S.categories.sort(function (a, b) {
          const nameA = a.key.toUpperCase();
          const nameB = b.key.toUpperCase();

          const isMassageA = nameA.indexOf("MASSAGE") !== -1;
          const isMassageB = nameB.indexOf("MASSAGE") !== -1;
          const isSpaA = nameA.indexOf("SPA") !== -1;
          const isSpaB = nameB.indexOf("SPA") !== -1;
          const isAddOnA =
            nameA.indexOf("ADD_ON") !== -1 || nameA.indexOf("ADDON") !== -1;
          const isAddOnB =
            nameB.indexOf("ADD_ON") !== -1 || nameB.indexOf("ADDON") !== -1;
          const isBathA = nameA.indexOf("BATH") !== -1;
          const isBathB = nameB.indexOf("BATH") !== -1;

          // Priority: Massage (-4) > Spa (-3) > Bath (-2) > Others (0) > Add On (1)
          const getPriority = function (isM, isS, isB, isA) {
            if (isM) return -4;
            if (isS) return -3;
            if (isB) return -2;
            if (isA) return 1;
            return 0;
          };

          const prioA = getPriority(isMassageA, isSpaA, isBathA, isAddOnA);
          const prioB = getPriority(isMassageB, isSpaB, isBathB, isAddOnB);

          if (prioA !== prioB) return prioA - prioB;
          return a.label.localeCompare(b.label);
        });
        if (!S.activeCat && S.categories.length)
          S.activeCat = S.categories[0].key;
        render();
      })
      .catch(function (e) {
        console.error("[Mahalu] variants", e);
      });
  }
  function fetchBundles() {
    if (S.promoBundle) return; // p3 case: bundle already loaded
    apiFetch("/bundle-promo/active")
      .then(function (res) {
        S.bundles = res.data || [];
        render();
      })
      .catch(function (e) {
        console.error("[Mahalu] bundles", e);
      });
  }
  function fetchDates() {
    const groups = selectedVarGroups();
    if (!groups.length) {
      S.availDates = [];
      renderCalendar();
      return;
    }
    const params = buildVariantQuery(
      { month: S.viewingMonth },
      groups,
      selectedBundleId(),
    );
    apiFetch("/bookings/available-dates?" + params.toString())
      .then(function (res) {
        S.availDates = (res.data && res.data.available_dates) || [];
        renderCalendar();
      })
      .catch(function () {
        S.availDates = [];
        renderCalendar();
      });
  }
  function fetchSlots(prevSlot, autoReapplyVoucher) {
    const groups = selectedVarGroups();
    if (!groups.length || !S.selectedDate) {
      S.availSlots = [];
      render();
      return Promise.resolve();
    }
    S.availSlots = null;
    S.staffAssignments = [];
    S.resourceAssignments = [];
    render();
    return fetchAvailableSlots(S.selectedDate, groups, selectedBundleId())
      .then(function (slots) {
        S.availSlots = slots;
        let slotChanged = false;
        if (prevSlot) {
          const ok = slots.find(function (s) {
            return s && s.slot_time === prevSlot && s.is_available;
          });
          slotChanged = !ok || S.selectedSlot !== prevSlot;
          S.selectedSlot = ok ? prevSlot : "";
        } else {
          slotChanged = true;
        }
        // Only reset voucher applied if slot changed or no prevSlot
        if (slotChanged) {
          S.voucherApplied = null;
        }

        if (autoReapplyVoucher && S.selectedSlot && normalizedVoucherCode()) {
          applyVoucher();
          return;
        }
        render();
      })
      .catch(function () {
        S.availSlots = [];
        S.selectedSlot = "";
        S.voucherApplied = null;
        render();
      });
  }
  function applyBonusScheduleMode(mode, opts) {
    opts = opts || {};
    const nextMode = mode === "custom_date" ? "custom_date" : "same_date";
    S.bonusScheduleMode = nextMode;
    if (nextMode === "same_date") {
      S.bonusSelectedDate = S.selectedDate || S.bonusSelectedDate || "";
      // Auto-select same slot as main booking if available
      if (S.selectedSlot) {
        S.bonusSelectedSlot = S.selectedSlot;
      }
    } else if (!opts.keepDate) {
      S.bonusSelectedDate = S.bonusSelectedDate || "";
      S.bonusSelectedSlot = "";
    } else {
      S.bonusSelectedSlot = "";
    }
    S.bonusStaffAssignments = [];
    S.bonusResourceAssignments = [];
    S.bonusAvailSlots = null;
    if (opts.load !== false && S.bonusSelectedDate) {
      fetchBonusSlots();
    } else {
      S.bonusSlotsLoading = false;
      render();
    }
  }
  function fetchBonusSlots() {
    syncBonusSelectedDate();
    const bonus = selectedFreeVariant();
    if (!bonus || !S.bonusSelectedDate) {
      S.bonusAvailSlots = [];
      S.bonusSlotsLoading = false;
      render();
      return;
    }
    const fetchSeq = ++S._bonusFetchSeq;
    const fetchDate = S.bonusSelectedDate;
    S.bonusAvailSlots = null;
    S.bonusSlotsLoading = true;
    S.bonusSelectedSlot = "";
    S.bonusStaffAssignments = [];
    S.bonusResourceAssignments = [];
    render();

    const groups = [{ variant_id: bonus.id, qty: 1, group_id: "group_bonus" }];

    fetchAvailableSlots(fetchDate, groups, null)
      .then(function (slots) {
        if (fetchSeq !== S._bonusFetchSeq) return;
        S.bonusAvailSlots = slots;
        S.bonusSlotsLoading = false;
        render();
      })
      .catch(function () {
        if (fetchSeq !== S._bonusFetchSeq) return;
        S.bonusAvailSlots = [];
        S.bonusSlotsLoading = false;
        render();
      });
  }
  const fetchCustomer = debounce(function (phone) {
    if (!phone || phone.length < 8) {
      S.custCount = null;
      renderCustCount();
      return;
    }
    apiFetch("/lookup?phone=" + encodeURIComponent(phone))
      .then(function (res) {
        S.custCount =
          res.data && res.data.total_bookings != null
            ? res.data.total_bookings
            : null;
        renderCustCount();
      })
      .catch(function () {
        S.custCount = null;
        renderCustCount();
      });
  }, 600);
  function renderCustCount() {
    const el = $("bk-cust-hint");
    if (!el) return;
    el.innerHTML =
      S.custCount !== null && S.form.phone.length >= 8
        ? 'Sudah <strong style="color:var(--bk-ac)">' +
          S.custCount +
          "</strong> kali berkunjung ke Mahalu"
        : "";
  }

  /* ── 6. CART ACTIONS ── */
  function toggleService(v) {
    const freeLines = S.cartLines.filter(function (l) {
      return l.kind === "service" && !!l.isFree;
    });
    const existingLineIndex = S.cartLines.findIndex(function (l) {
      return l.kind === "service" && !l.isFree && l.variant.id === v.id;
    });

    if (existingLineIndex !== -1) {
      // Jika sudah ada, HAPUS (unselect) sesuai permintaan user
      S.cartLines = S.cartLines.filter(function (l, i) {
        return i !== existingLineIndex;
      });
    } else {
      // Tambah baru dengan qty 1
      const newGroupId =
        "group_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      S.cartLines = S.cartLines.concat([
        { kind: "service", variant: v, qty: 1, groupId: newGroupId },
      ]);
    }

    resetSchedule({
      keepSelectedDate: true, // Biarkan tanggal terpilih agar UX lebih enak
      keepBonusDate: true,
      keepFreeLines: true,
    });

    // Re-populate BOGO eligibility if promoType is active, even if no base service selected yet
    if (S.promoType) {
      S.bogoEligible = S.promoEligibleFreeServices;
      const hasBase = S.cartLines.some(function (l) {
        return l.kind === "service" && !l.isFree;
      });
      if (hasBase) {
        const paidLinesCount = S.cartLines.filter(function (l) {
          return l.kind === "service" && !l.isFree;
        }).length;
        if (paidLinesCount === 1 && !freeLines.length) S._focusBogo = true;
      }
    }

    refreshServicesUI();
  }

  function incrementService(v) {
    const lineIndex = S.cartLines.findIndex(function (l) {
      return l.kind === "service" && !l.isFree && l.variant.id === v.id;
    });
    if (lineIndex !== -1) {
      S.cartLines[lineIndex].qty = (S.cartLines[lineIndex].qty || 1) + 1;
    } else {
      const newGroupId =
        "group_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      S.cartLines.push({
        kind: "service",
        variant: v,
        qty: 1,
        groupId: newGroupId,
      });
    }
    resetSchedule({
      keepSelectedDate: true,
      keepBonusDate: true,
      keepFreeLines: true,
    });
    refreshServicesUI();
  }

  function decrementService(v) {
    const lineIndex = S.cartLines.findIndex(function (l) {
      return l.kind === "service" && !l.isFree && l.variant.id === v.id;
    });
    if (lineIndex !== -1) {
      const currentQty = S.cartLines[lineIndex].qty || 1;
      if (currentQty > 1) {
        S.cartLines[lineIndex].qty = currentQty - 1;
      } else {
        // Hapus jika qty 1 dan dikurangi
        S.cartLines = S.cartLines.filter(function (_, i) {
          return i !== lineIndex;
        });
      }
      resetSchedule({
        keepSelectedDate: true,
        keepBonusDate: true,
        keepFreeLines: true,
      });
      refreshServicesUI();
    }
  }
  function toggleFreeService(raw) {
    const hasPaidSvc = S.cartLines.some(function (l) {
      return l.kind === "service" && !l.isFree;
    });
    if (!hasPaidSvc) {
      S.err = "Pilih minimal 1 layanan berbayar dulu sebelum memilih bonus.";
      render();
      return;
    }
    const isPromoP = !!(
      S.promoType &&
      (S.promoType === "p1" || S.promoType === "p2")
    );
    if (!normalizedVoucherCode() && !isPromoP) {
      S.err = "Masukkan kode voucher promo dulu sebelum memilih bonus.";
      render();
      return;
    }
    const elig =
      S.bogoEligible && S.bogoEligible.length
        ? S.bogoEligible
        : (S.voucherApplied && S.voucherApplied.eligible_free_services) ||
          S.promoEligibleFreeServices ||
          [];
    if (!elig.length) {
      S.err = "Terapkan voucher promo dulu supaya bonus muncul.";
      render();
      return;
    }

    const id = Number(raw && raw.id);
    if (!id) return;

    let cap = Number(
      (S.voucherApplied && S.voucherApplied.bogo_cap_amount) || 0,
    );
    if (!cap) cap = maxPaidServicePrice();
    if (Number(raw.retail_price || 0) > cap) {
      S.err =
        "Bonus tidak boleh lebih mahal dari layanan yang dibeli. Pilih bonus dengan harga sama atau di bawahnya.";
      render();
      return;
    }

    if (inFreeCart(id)) {
      S.cartLines = S.cartLines.filter(function (l) {
        return !(l.kind === "service" && !!l.isFree && l.variant.id === id);
      });
      S.bonusSelectedDate = "";
      S.bonusSelectedSlot = "";
      S.bonusStaffAssignments = [];
      S.bonusResourceAssignments = [];
      S.bonusAvailSlots = null;
      const prevSlotA = S.selectedSlot;
      resetSchedule({
        keepSelectedDate: true,
        keepSelectedSlot: true,
        keepEligibility: true,
        keepFreeLines: true,
        keepVoucherApplied: true,
      });
      if (S.selectedDate) fetchSlots(prevSlotA, true);
      render();
      return;
    }

    S.cartLines = S.cartLines.filter(function (l) {
      return !(l.kind === "service" && !!l.isFree);
    });

    const base = S.variants.find(function (v) {
      return v.id === id;
    });

    const v = base
      ? Object.assign({}, base, { price: 0 })
      : {
          id: id,
          catKey: "promo",
          subCat: "Promo",
          name: String(raw.name || "Promo"),
          duration: Number(raw.duration_minutes || 0),
          price: 0,
          categoryId: 0,
        };

    const newGroupId =
      "group_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    S.cartLines = S.cartLines.concat([
      { kind: "service", variant: v, isFree: true, groupId: newGroupId },
    ]);
    const prevSlotB = S.selectedSlot;
    resetSchedule({
      keepSelectedDate: true,
      keepSelectedSlot: true,
      keepEligibility: true,
      keepFreeLines: true,
      keepVoucherApplied: true,
    });
    if (S.selectedDate) fetchSlots(prevSlotB, true);
    applyBonusScheduleMode("same_date", { load: true });
    // After selecting bonus: if main schedule not yet selected, go to datetime step; else go to confirm step
    if (!S.selectedDate || !S.selectedSlot) {
      S.step = "datetime";
      render();
    } else {
      S.step = "confirm";
      render();
      scrollToScheduleSection();
    }
  }
  function toggleBundle(bundle) {
    const pricing = calcPricing(bundle);
    const isAlreadySelected = S.cartLines.some(function (l) {
      return l.kind === "bundle" && l.bundle.id === bundle.id;
    });

    // Preserve services, only toggle the bundle
    const withoutBundles = S.cartLines.filter(function (l) {
      return l.kind !== "bundle";
    });

    if (isAlreadySelected) {
      S.cartLines = withoutBundles;
      S.isParallel = false; // Reset to default when bundle removed
    } else {
      const newGroupId =
        "group_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      S.cartLines = withoutBundles.concat([
        {
          kind: "bundle",
          bundle: bundle,
          pricing: pricing,
          groupId: newGroupId,
        },
      ]);
      S.isParallel = !!bundle.is_parallel;
    }

    resetSchedule({
      keepSelectedDate: true,
      keepBonusDate: true,
      keepFreeLines: true,
      keepVoucherApplied: true,
    });
    refreshServicesUI();
  }
  function removeLine(idx) {
    const removedLine = S.cartLines[idx];
    S.cartLines = S.cartLines.filter(function (_, i) {
      return i !== idx;
    });

    // If we removed a bundle, reset isParallel to false
    if (removedLine && removedLine.kind === "bundle") {
      S.isParallel = false;
    }

    resetSchedule();
    if (S.step === "services") {
      refreshServicesUI();
    } else {
      render();
    }
  }
  function resetSchedule(opts) {
    opts = opts || {};
    if (!opts.keepSelectedDate) S.selectedDate = "";
    if (!opts.keepSelectedSlot) S.selectedSlot = "";
    S.staffAssignments = [];
    S.resourceAssignments = [];
    S.availSlots = null;
    if (!opts.keepVoucherApplied) S.voucherApplied = null;
    if (!opts.keepEligibility) {
      S.bogoEligible = S.promoType ? S.promoEligibleFreeServices : [];
    }
    S.applyingVoucher = false;
    S.err = "";
    if (!opts.keepFreeLines) {
      S.cartLines = (S.cartLines || []).filter(function (l) {
        return !(l.kind === "service" && !!l.isFree);
      });
    }
    S.bonusSelectedSlot = "";
    S.bonusStaffAssignments = [];
    S.bonusResourceAssignments = [];
    S.bonusAvailSlots = null;
    if (!opts.keepBonusDate) {
      S.bonusSelectedDate = "";
    }
  }
  function refreshServicesUI() {
    fetchMembershipEligibility();
    if (S.step === "services" && S.membershipPurchaseView) {
      renderLeft();
      renderHeader();
      renderRight();
      renderMobileBar();
      return;
    }
    const list = $("bk-list");
    if (list) {
      list.innerHTML =
        S.browseMode === "bundles"
          ? renderBundlesHTML(filteredBundles())
          : renderSvcsHTML(grouped()) + renderBogoBonusHTML();
      attachSvcListeners();
    }
    renderHeader();
    renderRight();
    renderMobileBar();
  }

  function generateUniqueGroupId() {
    return (
      "group_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5)
    );
  }
  function buildLineItemsPayload() {
    return (S.cartLines || []).reduce(function (items, l, idx) {
      const groupId = l.groupId || generateUniqueGroupId();
      if (l.kind === "bundle") {
        items.push({
          type: "bundle_promo",
          bundle_promo_id: l.bundle.id,
          group_id: groupId,
        });
        return items;
      }
      const qty = Number(l.qty || 1);
      const membershipQty = l.isFree
        ? 0
        : Math.min(qty, membershipQtyForVariant(l.variant.id));
      const normalQty = qty - membershipQty;
      if (normalQty > 0) {
        items.push({
          type: "service_variant",
          service_variant_id: l.variant.id,
          is_free: !!l.isFree,
          quantity: normalQty,
          group_id: groupId,
        });
      }
      if (
        membershipQty > 0 &&
        S.membershipEligibility &&
        S.membershipEligibility.membership
      ) {
        items.push({
          type: "service_variant",
          service_variant_id: l.variant.id,
          is_free: false,
          quantity: membershipQty,
          payment_source: "membership",
          customer_membership_id: S.membershipEligibility.membership.id,
          group_id: groupId,
        });
      }
      return items;
    }, []);
  }
  function buildParentLineItemsPayload() {
    return buildLineItemsPayload().filter(function (l) {
      return !(l.type === "service_variant" && !!l.is_free);
    });
  }

  /* ── 7. VOUCHER ── */
  function applyVoucher() {
    const code = normalizedVoucherCode();
    if (!code) {
      S.voucherApplied = null;
      S.bogoEligible = S.promoType ? S.promoEligibleFreeServices : [];
      if (!S.promoType) {
        S.cartLines = (S.cartLines || []).filter(function (l) {
          return !(l.kind === "service" && !!l.isFree);
        });
      }
      S.err = "";
      render();
      return;
    }
    if (!S.selectedDate || !S.selectedSlot) {
      S.err = "Pilih jadwal dulu sebelum pakai voucher.";
      render();
      return;
    }
    if (!S.cartLines.length) {
      S.err = "Pilih layanan dulu sebelum pakai voucher.";
      render();
      return;
    }
    /*
    const hasBundle = S.cartLines.some(function (l) {
      return l.kind === "bundle";
    });
    if (hasBundle) {
      S.err = "Voucher tidak dapat digunakan bersamaan dengan bundle promo.";
      render();
      return;
    }
    */
    if (S.promoType) {
      S.err = "Voucher tidak dapat digunakan bersamaan dengan promo link.";
      render();
      return;
    }

    S.applyingVoucher = true;
    S.err = "";
    render();

    apiFetch("/vouchers/preview-booking", {
      method: "POST",
      body: JSON.stringify({
        voucher_code: code,
        schedule_date: S.selectedDate,
        slot_time: S.selectedSlot,
        line_items: buildLineItemsPayload(),
      }),
    })
      .then(function (res) {
        const data = res.data || {};
        S.voucherApplied = {
          code: code,
          subtotal_amount: data.subtotal_amount,
          discount_amount: data.discount_amount,
          total_amount: data.total_amount,
          applied_voucher: data.applied_voucher,
          eligible_free_services: data.eligible_free_services || [],
          bogo_cap_amount: data.bogo_cap_amount,
        };
        S.bogoEligible = S.voucherApplied.eligible_free_services;
        S.applyingVoucher = false;
        S.err = "";
        const snap = S.voucherApplied.applied_voucher;
        const isBogo = !!(snap && snap.promo_type === "bogo");
        const hasFreeLine = S.cartLines.some(function (l) {
          return l.kind === "service" && !!l.isFree;
        });
        if (isBogo && !hasFreeLine) {
          S.browseMode = "services";
          S.search = "";
          S.step = "services";
          S._focusBogo = true;
        }
        render();
      })
      .catch(function (e) {
        S.voucherApplied = null;
        S.bogoEligible = [];
        S.cartLines = (S.cartLines || []).filter(function (l) {
          return !(l.kind === "service" && !!l.isFree);
        });
        S.applyingVoucher = false;
        let msg = "Voucher tidak valid.";
        if (e && e.message) {
          msg = e.message;
        } else if (e && e.errors) {
          const k = Object.keys(e.errors);
          if (k.length) msg = e.errors[k[0]][0];
        }
        S.err = msg;
        render();
      });
  }

  /* ── 8. STAFF AUTO-ASSIGN ── */
  function eligibleTherapistIdsForCategory(slot, categoryId) {
    if (!slot) return [];

    const byCategory =
      categoryId && categoryId > 0 && slot.available_therapists_by_category
        ? slot.available_therapists_by_category[categoryId]
        : null;

    if (Array.isArray(byCategory) && byCategory.length) {
      return byCategory
        .map(function (id) {
          return Number(id || 0);
        })
        .filter(function (id) {
          return id > 0;
        });
    }

    if (
      Array.isArray(slot.available_therapists) &&
      slot.available_therapists.length
    ) {
      return slot.available_therapists
        .map(function (t) {
          return t && t.id ? Number(t.id) : 0;
        })
        .filter(function (id) {
          return id > 0;
        });
    }

    return [];
  }

  function autoAssign(slot) {
    if (slot.suggested_assignments && slot.suggested_assignments.length > 0) {
      return {
        staffAssignments: slot.suggested_assignments,
        resourceAssignments: slot.suggested_resource_assignments || [],
      };
    }

    const units = selectedVarUnits();
    const assignments = [];
    const resourceAssignments = [];
    const localLastAssigned = {};
    const usedResourceIds = new Set();

    (slot.available_therapists || []).forEach(function (t) {
      localLastAssigned[t.id] = t.last_assigned_at || "2000-01-01 00:00:00";
    });

    const isParallel = !!S.isParallel;

    // Group units by pax (unitIndex)
    const paxUnits = {};
    units.forEach(function (u) {
      if (!paxUnits[u.unitIndex]) paxUnits[u.unitIndex] = [];
      paxUnits[u.unitIndex].push(u);
    });

    const paxIds = Object.keys(paxUnits).sort(function (a, b) {
      return a - b;
    });
    let currentGlobalTime = S.selectedSlot;

    paxIds.forEach(function (paxIndex) {
      const items = paxUnits[paxIndex];
      let paxStartTime = isParallel ? S.selectedSlot : currentGlobalTime;
      let paxCurrentTime = paxStartTime;

      // Pick the most available therapist for this pax
      let eligible = (slot.available_therapists || []).map(function (t) {
        return t.id;
      });
      eligible.sort(function (a, b) {
        const tA = localLastAssigned[a] || "";
        const tB = localLastAssigned[b] || "";
        return tA.localeCompare(tB);
      });

      const pickedStaffId = eligible[0];
      if (!pickedStaffId) return;

      // Mark therapist as "busy" for other paxes if parallel
      if (isParallel) {
        localLastAssigned[pickedStaffId] = "2099-12-31 23:59:59";
      }

      items.forEach(function (unit) {
        const v = S.variants.find(function (variant) {
          return variant.id === unit.variantId;
        });
        if (!v) return;

        const startTime = paxCurrentTime;
        const endTime = addMin(startTime, v.duration);
        paxCurrentTime = endTime;

        assignments.push({
          service_variant_id: unit.variantId,
          staff_id: pickedStaffId,
          client_key: unit.key,
          start_time: startTime,
          end_time: endTime,
        });

        // Resource assignment
        const eligibleRes =
          (slot.available_resources_by_variant &&
            slot.available_resources_by_variant[unit.variantId]) ||
          [];
        let pickedResId = null;

        for (let j = 0; j < eligibleRes.length; j++) {
          if (!usedResourceIds.has(eligibleRes[j])) {
            pickedResId = eligibleRes[j];
            break;
          }
        }
        if (!pickedResId && eligibleRes.length > 0) {
          pickedResId = eligibleRes[0];
        }

        if (pickedResId && pickedResId !== -1) {
          usedResourceIds.add(pickedResId);
          resourceAssignments.push({
            service_variant_id: unit.variantId,
            resource_id: pickedResId,
            client_key: unit.key,
            start_time: startTime,
            end_time: endTime,
          });
        }
      });

      if (!isParallel) {
        currentGlobalTime = paxCurrentTime;
        // In sequential, therapist becomes available for next pax
        localLastAssigned[pickedStaffId] = new Date().toISOString();
      }
    });

    return assignments.length === units.length
      ? {
          staffAssignments: assignments,
          resourceAssignments: resourceAssignments,
        }
      : { staffAssignments: [], resourceAssignments: [] };
  }

  function bonusTherapistsForSelectedSlot() {
    const slot =
      (S.bonusAvailSlots || []).find(function (row) {
        return row.slot_time === S.bonusSelectedSlot;
      }) || null;
    return (slot && slot.available_therapists) || [];
  }

  function selectedBonusTherapistName() {
    const staffId =
      S.bonusStaffAssignments && S.bonusStaffAssignments[0]
        ? Number(S.bonusStaffAssignments[0].staff_id || 0)
        : 0;
    if (!staffId) return "";
    const therapist = bonusTherapistsForSelectedSlot().find(function (row) {
      return Number(row.id) === staffId;
    });
    return therapist ? therapist.name || "" : "";
  }

  /* ── 9. SUBMIT / BOOK ── */
  function handleBook() {
    if (S.submitting) return;
    S.submitting = true;
    S.err = "";
    render();

    if (!S.staffAssignments.length) {
      const cur =
        S.availSlots &&
        S.availSlots.find(function (s) {
          return s.slot_time === S.selectedSlot;
        });
      if (cur && cur.is_available) {
        const auto = autoAssign(cur);
        S.staffAssignments = auto.staffAssignments;
        S.resourceAssignments = auto.resourceAssignments;
      }
    }
    if (!S.staffAssignments.length) {
      S.submitting = false;
      S.err = "Therapist tidak tersedia untuk jam ini. Silakan pilih jam lain.";
      render();
      return;
    }

    const vcode = normalizedVoucherCode();
    if (vcode && !canUseAppliedVoucher()) {
      S.submitting = false;
      S.err = "Klik Terapkan voucher dulu supaya total booking akurat.";
      render();
      return;
    }

    const bonus = selectedFreeVariant();
    if (bonus) {
      if (!S.bonusSelectedDate || !S.bonusSelectedSlot) {
        S.submitting = false;
        S.err = "Tentukan jadwal bonus gratis sebelum melanjutkan.";
        render();
        return;
      }
      if (!S.bonusStaffAssignments.length) {
        S.submitting = false;
        S.err = "Therapist bonus gratis belum tersedia. Pilih slot bonus lain.";
        render();
        return;
      }
    }

    const lineItems = buildParentLineItemsPayload();
    const svcVars = S.staffAssignments.map(function (a) {
      return {
        variant_id: Number(a.service_variant_id),
        staff_id: a.staff_id,
        client_key: a.client_key,
        start_time: a.start_time,
        end_time: a.end_time,
      };
    });

    apiFetch("/bookings", {
      method: "POST",
      body: JSON.stringify({
        customer_name: S.form.name,
        customer_phone: S.form.phone || undefined,
        schedule_date: S.selectedDate,
        slot_time: S.selectedSlot,
        voucher_code: vcode || undefined,
        promo_type: S.promoType || undefined,
        origin_source: "ads",
        is_parallel: !!S.isParallel,
        service_variants: svcVars,
        resource_assignments: S.resourceAssignments,
        line_items: lineItems,
        bonus_booking: bonus
          ? {
              service_variant_id: bonus.id,
              schedule_date: S.bonusSelectedDate,
              slot_time: S.bonusSelectedSlot,
              is_parallel: !!S.isParallel,
              staff_assignments: S.bonusStaffAssignments,
              resource_assignments: S.bonusResourceAssignments,
            }
          : undefined,
      }),
    })
      .then(function (res) {
        S.createdBooking = res.data;
        const bookingCode = res.data.booking_code || res.data.bookingCode;
        const hasMembershipLine = lineItems.some(function (line) {
          return line.payment_source === "membership";
        });
        const hasChargeableLine = lineItems.some(function (line) {
          return (
            line.type === "bundle_promo" ||
            (line.type === "service_variant" &&
              line.payment_source !== "membership" &&
              !line.is_free)
          );
        });
        if (hasMembershipLine && !hasChargeableLine) {
          return apiFetch(
            "/public/bookings/" +
              encodeURIComponent(bookingCode) +
              "/pay-membership",
            {
              method: "POST",
              body: JSON.stringify({
                phone: String(S.form.phone || "").trim(),
              }),
            },
          ).then(function (paymentRes) {
            return {
              data: Object.assign({}, paymentRes.data || {}, {
                membership_paid: true,
              }),
            };
          });
        }
        return apiFetch("/bookings/" + res.data.id + "/payment", {
          method: "POST",
          body: JSON.stringify({
            bookingId: res.data.id,
            idempotency_key: uuid4(),
            return_url: bookingCode
              ? buildRedirectUrl(SUCCESS_PATH, bookingCode)
              : undefined,
            cancel_url: bookingCode
              ? buildRedirectUrl(CANCEL_PATH, bookingCode)
              : undefined,
          }),
        });
      })
      .then(function (res) {
        if (res.data && res.data.membership_paid) {
          S.membershipBookingPaid = true;
          S.submitting = false;
          S.step = "success";
          render();
          const message = $("bk-body").querySelector("p");
          if (message) {
            message.textContent =
              "Booking dikonfirmasi menggunakan quota membership.";
          }
        } else if (res.data && res.data.payment_url) {
          W.location.href = res.data.payment_url;
        } else {
          S.err =
            "Payment URL tidak tersedia. Silakan coba lagi atau hubungi admin.";
          S.step = "success";
          S.submitting = false;
          render();
        }
      })
      .catch(function (e) {
        console.error("[Mahalu] booking error", e);
        S.submitting = false;
        let msg = "Maaf, terjadi kesalahan. Silakan coba lagi.";
        if (e && e.message) {
          msg = e.message;
        } else if (e && e.errors) {
          const k = Object.keys(e.errors);
          if (k.length) msg = e.errors[k[0]][0];
        }
        S.err = msg;
        render();
      });
  }

  /* ── 10. STYLES + MODAL SHELL ── */
  function injectStyles() {
    if ($("bk-styles")) return;
    const s = D.createElement("style");
    s.id = "bk-styles";
    s.textContent = [
      "#bk-ov{display:none;position:fixed;inset:0;z-index:2147483647;background:rgba(43,28,20,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:16px;}",
      "#bk-ov.open{display:flex;}",
      '#bk-modal{--bk-ac:#b26632;--bk-dk:#893e1e;--bk-mu:#907e70;--bk-tx:#3b2a23;--bk-bg:#fff8f2;--bk-hd:"Playfair Display",Georgia,serif;--bk-bd:"Inter",system-ui,sans-serif;background:var(--bk-bg);border-radius:24px;width:100%;max-width:980px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 40px 100px rgba(43,28,20,.28),0 0 0 1px rgba(178,102,50,.12);animation:bk-rise .42s cubic-bezier(.16,1,.3,1) both;}',
      "@keyframes bk-rise{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}",
      "#bk-body{display:flex;flex:1;min-height:0;overflow:hidden;}",
      ".bk-left{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid rgba(178,102,50,.12);}",
      ".bk-right{width:300px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;background:rgba(255,248,242,.6);}",
      ".bk-scroll{overflow-y:auto;flex:1;min-height:0;}",
      ".bk-scroll::-webkit-scrollbar{width:3px;}",
      ".bk-scroll::-webkit-scrollbar-thumb{background:rgba(178,102,50,.25);border-radius:99px;}",
      ".bk-nos::-webkit-scrollbar{display:none;}.bk-nos{-ms-overflow-style:none;scrollbar-width:none;}",
      ".bk-lbl{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(144,126,112,.55);font-family:var(--bk-bd);}",
      ".bk-pill{padding:5px 14px;border-radius:99px;border:1.5px solid transparent;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:var(--bk-bd);line-height:1.5;}",
      ".bk-pill.on{background:var(--bk-ac);color:#fff;border-color:var(--bk-ac);}",
      ".bk-pill:not(.on){background:transparent;color:var(--bk-mu);border-color:rgba(178,102,50,.2);}",
      ".bk-pill:not(.on):hover{border-color:var(--bk-ac);color:var(--bk-ac);}",
      ".bk-inp{width:100%;padding:10px 13px;border-radius:10px;border:1.5px solid rgba(178,102,50,.2);font-size:13px;color:var(--bk-tx);background:#fff;outline:none;transition:border-color .15s,box-shadow .15s;font-family:var(--bk-bd);box-sizing:border-box;}",
      ".bk-inp:focus{border-color:var(--bk-ac);box-shadow:0 0 0 3px rgba(178,102,50,.1);}",
      ".bk-inp::placeholder{color:rgba(144,126,112,.5);}",
      ".bk-card{border:1.5px solid rgba(178,102,50,.15);border-radius:14px;padding:13px;cursor:pointer;transition:all .15s;background:#fff;text-align:left;width:100%;position:relative;font-family:var(--bk-bd);}",
      ".bk-card:hover{border-color:rgba(178,102,50,.4);box-shadow:0 4px 16px rgba(178,102,50,.08);}",
      ".bk-card.sel{border-color:var(--bk-ac);background:rgba(178,102,50,.04);}",
      ".bk-slot{width:100%;text-align:left;border-radius:12px;border:1.5px solid rgba(178,102,50,.15);padding:11px 14px;cursor:pointer;transition:all .15s;background:#fff;font-family:var(--bk-bd);}",
      ".bk-slot:not(:disabled):hover{border-color:rgba(178,102,50,.4);box-shadow:0 2px 8px rgba(178,102,50,.08);}",
      ".bk-slot.sel{border-color:var(--bk-ac);background:rgba(178,102,50,.04);}",
      ".bk-slot:disabled{opacity:.35;cursor:not-allowed;background:rgba(144,126,112,.05);}",
      ".bk-slots-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;}",
      ".bk-day{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .15s;border:none;background:transparent;font-family:var(--bk-bd);cursor:default;}",
      ".bk-day.av{cursor:pointer;color:var(--bk-tx);}",
      ".bk-day.av:not(.sl):hover{background:rgba(178,102,50,.12);color:var(--bk-ac);}",
      ".bk-day.td{border:1.5px solid var(--bk-ac);color:var(--bk-ac);font-weight:600;cursor:pointer;}",
      ".bk-day.sl{background:var(--bk-ac);color:#fff;font-weight:600;}",
      ".bk-day.off{color:rgba(144,126,112,.28);}",
      ".bk-btn-p{background:var(--bk-ac);color:#fff;border:none;border-radius:99px;padding:11px 20px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:var(--bk-bd);letter-spacing:.02em;width:100%;box-shadow:0 4px 16px rgba(178,102,50,.3);}",
      ".bk-btn-p:hover:not(:disabled){background:var(--bk-dk);box-shadow:0 6px 20px rgba(137,62,30,.35);transform:translateY(-1px);}",
      ".bk-btn-p:disabled{background:rgba(144,126,112,.22);color:rgba(144,126,112,.6);cursor:not-allowed;box-shadow:none;transform:none;}",
      ".bk-btn-g{background:transparent;color:var(--bk-mu);border:1.5px solid rgba(178,102,50,.2);border-radius:99px;padding:11px 20px;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;font-family:var(--bk-bd);}",
      ".bk-btn-g:hover{border-color:var(--bk-ac);color:var(--bk-ac);}",
      ".bk-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;transition:all .3s;flex-shrink:0;}",
      ".bk-dot.dn{background:var(--bk-ac);color:#fff;}",
      ".bk-dot.nw{background:var(--bk-ac);color:#fff;box-shadow:0 0 0 4px rgba(178,102,50,.18);}",
      ".bk-dot.wt{background:rgba(144,126,112,.14);color:var(--bk-mu);}",
      ".bk-sl{flex:1;height:1px;background:rgba(178,102,50,.14);max-width:28px;}",
      ".bk-sec{background:#fff;border-radius:14px;border:1.5px solid rgba(178,102,50,.12);padding:14px;margin-bottom:10px;}",
      ".bk-cl2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
      "@keyframes bk-bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}",
      "@keyframes bk-spin{to{transform:rotate(360deg)}}",
      /* ── accordion (T&C) ── */
      ".bk-acc{border:1px solid rgba(178,102,50,.14);border-radius:12px;overflow:hidden;background:#fff;}",
      ".bk-acc-h{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;background:transparent;border:none;cursor:pointer;text-align:left;font-family:var(--bk-bd);}",
      ".bk-acc-h:hover{background:rgba(178,102,50,.04);}",
      ".bk-acc-t{font-size:12.5px;font-weight:600;color:var(--bk-tx);}",
      ".bk-acc-ic{flex-shrink:0;transition:transform .25s ease;color:var(--bk-mu);}",
      ".bk-acc.open .bk-acc-ic{transform:rotate(180deg);color:var(--bk-ac);}",
      /* accordion body scrollable, max-height large enough for content */
      ".bk-acc-body{max-height:0;overflow:hidden;transition:max-height .3s ease;}",
      ".bk-acc.open .bk-acc-body{max-height:320px;overflow-y:auto;}",
      ".bk-acc-body::-webkit-scrollbar{width:2px;}",
      ".bk-acc-body::-webkit-scrollbar-thumb{background:rgba(178,102,50,.2);border-radius:99px;}",
      ".bk-acc-body-in{padding:0 13px 13px;font-size:12px;color:var(--bk-mu);line-height:1.7;}",
      ".bk-mob{display:none;}",
      ".bk-show-mob{display:none!important;}",
      "@keyframes bk-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}",
      /* mobile confirm bar — scrollable container for T&C + fixed buttons at bottom */
      "@media(max-width:640px){" +
        "#bk-ov{padding:0;align-items:flex-end;background:rgba(43,28,20,.45);}" +
        "#bk-modal{max-height:92dvh;height:92dvh;border-radius:20px 20px 0 0;animation:bk-slide-up .38s cubic-bezier(.16,1,.3,1) both;box-shadow:0 -8px 40px rgba(43,28,20,.2);}" +
        "#bk-hdr{padding:8px 18px 10px!important;}" +
        ".bk-right{display:none!important;}" +
        ".bk-left{border-right:none!important;}" +
        ".bk-show-mob{display:flex!important;}" +
        /* normal steps: horizontal flex bar */
        ".bk-mob{display:flex!important;align-items:center;gap:12px;padding:12px 16px;padding-bottom:calc(12px + env(safe-area-inset-bottom));border-top:1px solid rgba(178,102,50,.12);background:#fff;flex-shrink:0;}" +
        /* confirm step overrides: column layout with scrollable T&C area */
        ".bk-mob.bk-mob-confirm{flex-direction:column;align-items:stretch;gap:0;padding:0;}" +
        ".bk-mob-tnc-scroll{overflow-y:auto;padding:12px 16px 8px;flex:1;min-height:0;max-height:180px;}" +
        ".bk-mob-tnc-scroll::-webkit-scrollbar{width:2px;}" +
        ".bk-mob-tnc-scroll::-webkit-scrollbar-thumb{background:rgba(178,102,50,.2);border-radius:99px;}" +
        ".bk-mob-actions{flex-shrink:0;padding:10px 16px;padding-bottom:calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(178,102,50,.1);background:#fff;}" +
        "#bk-body{flex:1;min-height:0;}" +
        "}",
    ].join("");
    D.head.appendChild(s);
  }

  function injectModal() {
    injectStyles();
    if ($("bk-ov")) return;
    const ov = D.createElement("div");
    ov.id = "bk-ov";
    ov.innerHTML =
      '<div id="bk-modal"><div id="bk-hdr"></div><div id="bk-body"></div><div id="bk-mob" class="bk-mob"></div></div>';
    D.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      if (e.target === ov) closeModal();
    });
  }

  /* ── header ── */
  function renderHeader() {
    const h = $("bk-hdr");
    if (!h) return;
    if (S.step === "success") {
      h.innerHTML = "";
      return;
    }
    const STEPS = ["Kontak", "Layanan", "Jadwal", "Konfirmasi"];
    const KEYS = ["customer", "services", "datetime", "confirm"];
    const si = KEYS.indexOf(S.step);
    const dots = STEPS.map(function (label, i) {
      const cls = i < si ? "dn" : i === si ? "nw" : "wt";
      const icon = i < si ? ICON_CHECK_10 : i + 1;
      return `${i > 0 ? '<div class="bk-sl"></div>' : ""}<div style="display:flex;align-items:center;gap:5px;"><div class="bk-dot ${cls}">${icon}</div><span class="bk-lbl bk-slbl" style="color:${
        i <= si ? "var(--bk-ac)" : "var(--bk-mu)"
      };white-space:nowrap;">${label}</span></div>`;
    }).join("");
    const badge = S.cartLines.length
      ? `<div style="padding:4px 12px;background:rgba(178,102,50,.08);border-radius:99px;border:1px solid rgba(178,102,50,.2);"><span style="font-size:13px;font-weight:700;color:var(--bk-ac);">${idr(
          totalAmt(),
        )}</span></div>`
      : "";
    const isMob = W.innerWidth <= 640;
    h.style.cssText =
      "display:flex;flex-direction:column;flex-shrink:0;background:rgba(255,248,242,.92);backdrop-filter:blur(8px);border-bottom:1px solid rgba(178,102,50,.1);";
    h.innerHTML = `
      <div style="display:flex;justify-content:center;padding:10px 0 2px;"><div style="width:36px;height:4px;border-radius:99px;background:rgba(144,126,112,.25);"></div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:${
        isMob ? "8px 18px 12px" : "12px 22px 14px"
      };">
        <div style="display:flex;align-items:center;gap:4px;">${dots}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          ${badge}
          <button id="bk-x" style="width:32px;height:32px;border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--bk-mu);transition:background .15s;" onmouseover="this.style.background='rgba(178,102,50,.1)'" onmouseout="this.style.background='transparent'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>`;
    $("bk-x").addEventListener("click", closeModal);
    if (isMob) {
      h.querySelectorAll(".bk-slbl").forEach(function (el) {
        el.style.display = "none";
      });
    }
  }

  /* ── body / step router ── */
  function renderBody() {
    const body = $("bk-body");
    if (!body) return;
    if (S.step === "success") {
      body.style.cssText =
        "display:flex;flex:1;align-items:center;justify-content:center;padding:48px 24px;";
      body.innerHTML = `
        <div style="text-align:center;max-width:420px;width:100%;">
          <div style="width:68px;height:68px;border-radius:50%;background:rgba(178,102,50,.1);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--bk-ac)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style="font-family:var(--bk-hd);font-size:1.6rem;color:var(--bk-tx);margin:0 0 8px;">Booking Berhasil!</h2>
          <p style="color:var(--bk-mu);font-size:14px;margin:0 0 20px;">Mengarahkan ke halaman pembayaran\u2026</p>
          <div style="display:flex;gap:6px;justify-content:center;">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--bk-ac);animation:bk-bounce 1.2s 0s infinite both"></div>
            <div style="width:8px;height:8px;border-radius:50%;background:var(--bk-ac);animation:bk-bounce 1.2s .15s infinite both"></div>
            <div style="width:8px;height:8px;border-radius:50%;background:var(--bk-ac);animation:bk-bounce 1.2s .3s infinite both"></div>
          </div>
        </div>`;
      return;
    }
    body.style.cssText = "display:flex;flex:1;min-height:0;overflow:hidden;";
    body.innerHTML =
      '<div class="bk-left" id="bk-left"></div><div class="bk-right" id="bk-right"></div>';
    renderLeft();
    renderRight();
  }

  function renderLeft() {
    const p = $("bk-left");
    if (!p) return;
    if (S.step === "customer") renderCustomer(p);
    else if (S.step === "services" && S.membershipPurchaseView)
      renderMembershipPurchase(p);
    else if (S.step === "services") renderServices(p);
    else if (S.step === "datetime") renderDatetime(p);
    else if (S.step === "confirm") renderConfirm(p);
  }

  function renderMembershipPurchase(p) {
    const packagesHTML = S.membershipPackagesLoading
      ? '<p style="font-size:13px;color:var(--bk-mu);">Memuat paket membership…</p>'
      : !S.membershipPackages.length
        ? '<p style="font-size:13px;color:var(--bk-mu);">Belum ada paket membership aktif.</p>'
        : S.membershipPackages
            .map(function (pkg) {
              const benefits =
                pkg.benefits && pkg.benefits.length
                  ? pkg.benefits
                  : (pkg.variants || []).map(function (variant) {
                      return {
                        quota: variant.quota,
                        service_variant: variant.service_variant,
                      };
                    });
              return `
                <div style="border:1px solid rgba(178,102,50,.16);border-radius:12px;background:#fff;padding:14px;margin-bottom:10px;">
                  <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
                    <div style="min-width:0;">
                      <p style="font-size:14px;font-weight:700;color:var(--bk-tx);margin:0;">${esc(pkg.name)}</p>
                      <p style="font-size:11px;color:var(--bk-mu);margin:4px 0 0;">Berlaku ${Number(pkg.duration_days || 0)} hari</p>
                    </div>
                    <strong style="font-size:14px;color:var(--bk-ac);white-space:nowrap;">${idr(pkg.price)}</strong>
                  </div>
                  ${pkg.description ? `<p style="font-size:12px;color:var(--bk-mu);margin:8px 0;line-height:1.5;">${esc(pkg.description)}</p>` : ""}
                  <div style="margin:10px 0 12px;padding-top:8px;border-top:1px solid rgba(178,102,50,.08);">
                    <p class="bk-lbl" style="margin:0 0 5px;">Benefit paket</p>
                    ${benefits
                      .map(function (benefit) {
                        return `<p style="font-size:12px;color:var(--bk-tx);margin:3px 0;">${esc(membershipBenefitLabel(benefit))}</p>`;
                      })
                      .join("")}
                  </div>
                  <button type="button" data-membership-buy="${Number(pkg.id)}" class="bk-btn-p" style="padding:9px 14px;"${S.membershipBuying ? " disabled" : ""}>${S.membershipBuying ? "Memproses…" : "Beli membership"}</button>
                </div>`;
            })
            .join("");

    p.innerHTML = `
      <div class="bk-scroll" style="padding:22px 20px;">
        <button type="button" data-membership-back class="bk-btn-g" style="padding:7px 12px;margin-bottom:16px;">← Kembali ke layanan</button>
        <div style="width:36px;height:3px;background:var(--bk-ac);border-radius:2px;margin-bottom:14px;"></div>
        <h3 style="font-family:var(--bk-hd);font-size:1.4rem;color:var(--bk-tx);font-weight:500;margin:0 0 5px;">Pilih Membership</h3>
        <p style="font-size:12px;color:var(--bk-mu);margin:0 0 16px;">${esc(S.form.name || "Customer")} · ${esc(S.form.phone || "Nomor WhatsApp belum diisi")}</p>
        ${S.membershipPurchaseMessage ? `<div style="padding:10px 12px;margin-bottom:12px;border-radius:10px;background:rgba(47,158,68,.08);color:#27733a;font-size:12px;">${esc(S.membershipPurchaseMessage)}</div>` : ""}
        ${S.membershipPaymentUrl ? `<a href="${esc(S.membershipPaymentUrl)}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;text-decoration:none;margin-bottom:12px;padding:11px 14px;border-radius:10px;background:#2F9E44;color:#fff;font-size:13px;font-weight:700;">Lanjutkan pembayaran ↗</a>` : ""}
        ${S.membershipErr ? `<p style="font-size:12px;color:#c83232;margin:0 0 12px;">${esc(S.membershipErr)}</p>` : ""}
        ${packagesHTML}
      </div>`;

    const back = p.querySelector("[data-membership-back]");
    if (back)
      back.addEventListener("click", function () {
        S.membershipPurchaseView = false;
        S.membershipErr = "";
        renderLeft();
      });
    p.querySelectorAll("[data-membership-buy]").forEach(function (button) {
      button.addEventListener("click", function () {
        purchaseMembershipPackage(
          Number(button.getAttribute("data-membership-buy")),
        );
      });
    });
  }

  /* ── customer step ── */
  function renderCustomer(p) {
    const isMob = W.innerWidth <= 640;
    p.innerHTML = `
      <div class="bk-scroll" style="padding:32px 28px${isMob ? " 24px" : ""};">
        <div style="width:36px;height:3px;background:var(--bk-ac);border-radius:2px;margin-bottom:16px;"></div>
        <h3 style="font-family:var(--bk-hd);font-size:1.5rem;color:var(--bk-tx);font-weight:500;margin:0 0 4px;">Selamat Datang</h3>
        <p style="font-size:13px;color:var(--bk-mu);margin:0 0 20px;">Isi nama dan nomor WhatsApp untuk memulai booking</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <input id="bk-name" class="bk-inp" placeholder="Nama lengkap *" value="${esc(S.form.name)}" />
          <input id="bk-phone" class="bk-inp" placeholder="Nomor WhatsApp" value="${esc(
            S.form.phone,
          )}" inputmode="numeric" />
          <p id="bk-cust-hint" style="font-size:12px;color:var(--bk-mu);min-height:16px;margin:0;"></p>
        </div>
        <div style="margin-top:20px;padding:12px 14px;border-radius:12px;background:rgba(178,102,50,.05);border:1px solid rgba(178,102,50,.12);">
          <p style="font-size:12px;color:var(--bk-mu);margin:0;line-height:1.7;">
            \u2726 Booking bisa dibatalkan minimal 2 jam sebelum jadwal.<br>
            \u2726 Konfirmasi akan dikirim via WhatsApp setelah pembayaran.
          </p>
        </div>
        ${
          isMob
            ? `<button id="bk-next" class="bk-btn-p" style="margin-top:20px;"${
                !S.form.name.trim() ? " disabled" : ""
              }>Pilih Layanan \u2192</button>`
            : ""
        }
      </div>`;
    $("bk-name").addEventListener("input", function (e) {
      S.form.name = e.target.value;
      const btn = $("bk-next");
      if (btn) btn.disabled = !S.form.name.trim();
    });
    $("bk-phone").addEventListener("input", function (e) {
      S.form.phone = e.target.value;
      S._membershipQueryKey = "";
      S.membershipEligibility = null;
      S.membershipQtyByVariant = {};
      fetchCustomer(e.target.value);
    });
    const mobNext = $("bk-next");
    if (mobNext) {
      mobNext.addEventListener("click", function () {
        if (!S.form.name.trim()) return;
        if (!S.variants.length) fetchVariants();
        if (!S.bundles.length) fetchBundles();
        S.step = "services";
        render();
      });
    }
    renderCustCount();
  }

  /* ── services step ── */
  function renderServices(p) {
    fetchMembershipEligibility();
    const catChips = S.categories
      .map(function (c) {
        return `<button class="bk-pill${S.activeCat === c.key ? " on" : ""}" data-cat="${esc(
          c.key,
        )}">${esc(c.label)}</button>`;
      })
      .join("");
    p.innerHTML = `
      <div style="flex-shrink:0;padding:12px 18px;border-bottom:1px solid rgba(178,102,50,.1);background:rgba(255,248,242,.6);display:flex;flex-direction:column;gap:9px;">
        <div style="display:flex;gap:6px;overflow-x:auto;" class="bk-nos">
          <button class="bk-pill${S.browseMode === "services" ? " on" : ""}" id="bk-msvc">Layanan</button>
          <button class="bk-pill${S.browseMode === "bundles" ? " on" : ""}" id="bk-mbnd">\u2726 Bundle Promo</button>
          <button class="bk-pill" id="bk-buy-membership">Membership</button>
        </div>
        ${
          S.browseMode === "services" && S.categories.length
            ? `<div style="display:flex;gap:6px;overflow-x:auto;" class="bk-nos">${catChips}</div>`
            : ""
        }
        <div style="position:relative;">
          <svg style="position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bk-mu)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="bk-search" class="bk-inp" style="padding-left:34px;" placeholder="Cari ${
            S.browseMode === "bundles" ? "bundle promo" : "layanan"
          }\u2026" value="${esc(S.search)}" />
        </div>
      </div>
      <div class="bk-scroll" style="padding:16px 18px;" id="bk-list">${
        S.browseMode === "bundles"
          ? renderBundlesHTML(filteredBundles())
          : renderSvcsHTML(grouped()) + renderBogoBonusHTML()
      }</div>`;
    $("bk-msvc").addEventListener("click", function () {
      S.browseMode = "services";
      S.search = "";
      renderLeft();
    });
    $("bk-mbnd").addEventListener("click", function () {
      S.browseMode = "bundles";
      S.search = "";
      renderLeft();
    });
    $("bk-buy-membership").addEventListener("click", function () {
      S.membershipPurchaseView = true;
      S.membershipPurchaseMessage = "";
      S.membershipErr = "";
      renderLeft();
      fetchMembershipPackages();
    });
    $("bk-search").addEventListener("input", function (e) {
      S.search = e.target.value;
      const list = $("bk-list");
      if (list)
        list.innerHTML =
          S.browseMode === "bundles"
            ? renderBundlesHTML(filteredBundles())
            : renderSvcsHTML(grouped()) + renderBogoBonusHTML();
      attachSvcListeners();
    });
    p.querySelectorAll("[data-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        S.activeCat = btn.getAttribute("data-cat");
        S.search = "";
        renderLeft();
      });
    });
    attachSvcListeners();

    if (S._focusBogo) {
      S._focusBogo = false;
      setTimeout(function () {
        const el = $("bk-bogo-bonus");
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }

  function renderSvcsHTML(grp) {
    if (!Object.keys(grp).length) {
      return `<div style="padding:56px 0;text-align:center;color:var(--bk-mu);">${
        S.variants.length === 0
          ? '<div style="width:32px;height:32px;border:2px solid var(--bk-ac);border-top-color:transparent;border-radius:50%;animation:bk-spin .7s linear infinite;margin:0 auto 12px;"></div><p style="font-size:13px;margin:0;">Memuat layanan\u2026</p>'
          : '<p style="font-size:13px;margin:0;">Layanan tidak ditemukan</p>'
      }</div>`;
    }
    const bogoMode = isBogoActive();
    const hasPaidSvc = S.cartLines.some(function (l) {
      return l.kind === "service" && !l.isFree;
    });
    return Object.keys(grp)
      .map(function (sub) {
        const cards = grp[sub]
          .map(function (v) {
            const qty = getCartLineQty(v.id);
            const sel = qty > 0;
            const sc = sel ? "var(--bk-ac)" : "var(--bk-tx)";
            const memberEligibility = membershipEligibilityForVariant(v.id);
            const memberEligible = !!(
              memberEligibility && memberEligibility.eligible
            );
            const memberMaxQty = membershipMaxQtyForVariant(v.id);
            const memberRemaining = membershipRemainingForVariant(v.id);
            const memberQty = Math.min(qty, membershipQtyForVariant(v.id));
            const disableByBogo = bogoMode && hasPaidSvc && !sel;
            const isEligible = isBogoEligibleId(v.id);
            const disabledLabel = !disableByBogo
              ? ""
              : isEligible
                ? "Pilih dari Bonus Voucher"
                : "Tidak termasuk bonus";
            return `
              <div class="bk-card${sel ? " sel" : ""}" 
                   data-svc="${v.id}"
                   style="${disableByBogo ? "opacity:.45;cursor:not-allowed;" : "cursor:pointer;"} position:relative; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
                ${sel ? checkBadgeHTML() : ""}
                
                <div style="flex:1;">
                  <p style="font-size:13px;font-weight:600;color:${sc};margin:0 0 6px;line-height:1.3;padding-right:${
                    sel ? "22px" : "0"
                  }">${esc(v.name)}</p>
                  <div style="display:flex;align-items:center;gap:3px;margin-bottom:6px;">
                    ${ICON_CLOCK_10}
                    <span style="font-size:11px;color:var(--bk-mu);">${dur(v.duration)}</span>
                  </div>
                  <p style="font-size:13px;font-weight:700;color:${sc};margin:0 0 8px;">${idr(
                    v.price * (sel ? qty - memberQty : 1),
                  )}</p>
                  ${
                    memberEligible
                      ? `<div style="margin:8px 0;padding:8px;border-radius:9px;background:rgba(47,158,68,.06);border:1px solid rgba(47,158,68,.12);"${sel ? ' data-membership-controls="1"' : ""}>
                          <p style="font-size:11px;color:#287a3b;font-weight:600;margin:0 0 5px;">Membership · ${memberRemaining} kuota tersisa</p>
                          ${
                            sel
                              ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                                  <span style="font-size:11px;color:var(--bk-tx);">Pakai membership</span>
                                  <div style="display:flex;align-items:center;gap:7px;">
                                    <button type="button" data-membership-qty="${v.id}" data-membership-delta="-1"${memberQty <= 0 ? " disabled" : ""} style="width:24px;height:24px;border:1px solid #2F9E44;border-radius:50%;background:#fff;color:#287a3b;">−</button>
                                    <strong style="font-size:12px;min-width:14px;text-align:center;color:#287a3b;">${memberQty}</strong>
                                    <button type="button" data-membership-qty="${v.id}" data-membership-delta="1"${memberQty >= memberMaxQty || memberQty >= qty ? " disabled" : ""} style="width:24px;height:24px;border:1px solid #2F9E44;border-radius:50%;background:#2F9E44;color:#fff;">+</button>
                                  </div>
                                </div>`
                              : ""
                          }
                        </div>`
                      : ""
                  }
                  ${disabledLabel ? `<p style="font-size:11px;color:var(--bk-mu);margin:0 0 8px;">${disabledLabel}</p>` : ""}
                </div>

                ${
                  sel
                    ? `
                    <div style="display:flex;align-items:center;justify-content:center; gap:12px; margin-top:8px; padding-top:8px; border-top:1px solid rgba(178,102,50,.08);">
                    <button class="bk-qty-btn bk-qty-decrement" 
                            data-svc-decrement="${v.id}" 
                            style="width:28px;height:28px;border-radius:50%;border:1px solid var(--bk-ac);background:#fff;color:var(--bk-ac);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;">−</button>
                    <span style="font-size:14px;font-weight:700;color:var(--bk-tx); min-width:20px; text-align:center;">${qty}</span>
                    <button class="bk-qty-btn bk-qty-increment" 
                            data-svc-increment="${v.id}" 
                            style="width:28px;height:28px;border-radius:50%;border:1px solid var(--bk-ac);background:var(--bk-ac);color:#fff;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;">+</button>
                  </div>
                `
                    : ""
                }
              </div>`;
          })
          .join("");
        return `
          <div style="margin-bottom:22px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:11px;">
              <span class="bk-lbl">${esc(sub)}</span>
              <div style="flex:1;height:1px;background:rgba(178,102,50,.1);"></div>
            </div>
            ${
              bogoMode && hasPaidSvc
                ? '<p style="font-size:11px;color:var(--bk-mu);margin:0 0 8px;">Layanan utama dipilih. Pilih bonus gratis di bagian bawah atau klik lagi untuk batal.</p>'
                : bogoMode
                  ? '<p style="font-size:11px;color:var(--bk-ac);font-weight:600;margin:0 0 8px;">Silakan pilih layanan utama promo di bawah ini.</p>'
                  : ""
            }
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">${cards}</div>
          </div>`;
      })
      .join("");
  }

  function renderBogoBonusHTML() {
    if (S.browseMode !== "services") return "";
    if (!normalizedVoucherCode() && !S.promoType) return "";
    if (!(S.bogoEligible && S.bogoEligible.length)) return "";

    let cap = Number(
      (S.voucherApplied && S.voucherApplied.bogo_cap_amount) || 0,
    );
    const hasPaidSvc = S.cartLines.some(function (l) {
      return l.kind === "service" && !l.isFree;
    });

    if (!cap) cap = maxPaidServicePrice();

    const cards = (S.bogoEligible || [])
      .map(function (raw) {
        const id = Number(raw && raw.id);
        if (!id) return "";
        const sel = inFreeCart(id);
        const sc = sel ? "var(--bk-ac)" : "var(--bk-tx)";
        const durMin = Number(raw.duration_minutes || 0);
        const price = Number(raw.retail_price || 0);
        const blocked = !sel && isBonusBlockedByPaidSelection(id);
        const disabled = !sel && (!hasPaidSvc || price > cap || blocked);
        return `
          <div class="bk-card${sel ? " sel" : ""}" 
               data-bogo-svc="${id}"${disabled ? ' data-bogo-disabled="1"' : ""} 
               style="${disabled ? "opacity:.45;cursor:not-allowed;" : "cursor:pointer;"} position:relative; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
            ${sel ? checkBadgeHTML() : ""}
            
            <div style="flex:1;">
              <p style="font-size:13px;font-weight:600;color:${sc};margin:0 0 6px;line-height:1.3;padding-right:${
                sel ? "22px" : "0"
              }">${esc(String(raw.name || ""))}</p>
              <div style="display:flex;align-items:center;gap:3px;margin-bottom:6px;">
                ${ICON_CLOCK_10}
                <span style="font-size:11px;color:var(--bk-mu);">${dur(durMin)}</span>
              </div>
              <p style="font-size:13px;font-weight:700;color:${sc};margin:0;">${idr(0)}</p>
              ${
                disabled
                  ? `<p style="font-size:11px;color:var(--bk-mu);margin:6px 0 0;">${
                      !hasPaidSvc
                        ? "Pilih layanan utama dulu"
                        : price > cap
                          ? "Harga item: " + idr(price)
                          : "Tidak dapat dipilih karena sudah membeli layanan utama terkait"
                    }</p>`
                  : ""
              }
            </div>
          </div>`;
      })
      .join("");

    return `
      <div style="margin-top:28px;padding-top:22px;border-top:1px dashed rgba(178,102,50,.2);margin-bottom:22px;" id="bk-bogo-bonus">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span class="bk-lbl">Bonus Voucher (Gratis)</span>
          <div style="flex:1;height:1px;background:rgba(178,102,50,.1);"></div>
        </div>
        ${
          !hasPaidSvc
            ? '<div style="font-size:11px;color:var(--bk-ac);font-weight:600;margin:0 0 11px;">Pilih layanan utama di atas untuk mengaktifkan bonus.</div>'
            : `<div style="font-size:11px;color:var(--bk-mu);margin:0 0 11px;">Maks bonus: <span style="color:var(--bk-ac);font-weight:600;">${idr(
                cap,
              )}</span></div>`
        }
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;">${cards}</div>
      </div>`;
  }

  function renderBundlesHTML(bundles) {
    if (!bundles.length) {
      return `<div style="padding:56px 0;text-align:center;color:var(--bk-mu);">${
        S.bundles.length === 0
          ? '<p style="font-size:13px;margin:0;">Memuat bundle promo\u2026</p>'
          : '<p style="font-size:13px;margin:0;">Tidak ada bundle promo aktif saat ini</p>'
      }</div>`;
    }
    const cards = bundles
      .map(function (b) {
        const pr = calcPricing(b);
        const sel = selectedBundleId() === b.id;
        const includedVariants = (b.bundle_items || [])
          .map(function (item) {
            const name =
              (item.service_variant && item.service_variant.name) ||
              item.service_variant_name ||
              item.name;
            if (!name) return "";
            const qty = Math.max(1, Number(item.quantity || 1));
            return `<li style="margin:2px 0;">${qty > 1 ? qty + "× " : ""}${esc(name)}</li>`;
          })
          .filter(Boolean)
          .join("");
        return `
          <button class="bk-card${sel ? " sel" : ""}" data-bnd="${b.id}">
            ${
              sel
                ? '<span style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:var(--bk-ac);display:flex;align-items:center;justify-content:center;">' +
                  ICON_CHECK_9 +
                  "</span>"
                : ""
            }
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
              <div style="flex:1;min-width:0;">
                <span style="display:inline-block;background:rgba(178,102,50,.1);color:var(--bk-ac);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:2px 7px;border-radius:5px;margin-bottom:6px;">Bundle Promo</span>
                <p style="font-size:14px;font-weight:600;color:var(--bk-tx);margin:0 0 3px;">${esc(b.name)}</p>
                ${
                  b.description
                    ? `<p style="font-size:12px;color:var(--bk-mu);margin:0 0 6px;" class="bk-cl2">${esc(
                        b.description,
                      )}</p>`
                    : ""
                }
                <p style="font-size:12px;color:var(--bk-ac);font-weight:500;margin:0;">${discLabel(
                  b.bundle_type,
                  b.discount_value,
                )} \u00b7 Hemat ${idr(pr.discountAmount)}</p>
                <p style="font-size:11px;color:var(--bk-mu);margin:2px 0 0;">${dur(pr.totalDuration)} \u00b7 ${
                  pr.itemCount
                } layanan</p>
                ${
                  includedVariants
                    ? `<div style="margin-top:8px;padding-top:7px;border-top:1px solid rgba(178,102,50,.08);"><p style="font-size:10px;font-weight:600;color:var(--bk-mu);margin:0 0 3px;">Isi bundle:</p><ul style="font-size:11px;color:var(--bk-tx);margin:0;padding-left:16px;">${includedVariants}</ul></div>`
                    : ""
                }
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <p style="font-size:11px;color:rgba(144,126,112,.5);text-decoration:line-through;margin:0;">${idr(
                  pr.subtotal,
                )}</p>
                <p style="font-size:15px;font-weight:700;color:var(--bk-ac);margin:0;">${idr(pr.finalPrice)}</p>
              </div>
            </div>
          </button>`;
      })
      .join("");
    return `<div style="display:flex;flex-direction:column;gap:10px;">${cards}</div>`;
  }

  function attachSvcListeners() {
    const list = $("bk-list");
    if (!list || list._delegated) return;
    list._delegated = true;
    list.addEventListener("click", function (e) {
      const membershipQtyBtn = e.target.closest("[data-membership-qty]");
      if (membershipQtyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = Number(membershipQtyBtn.getAttribute("data-membership-qty"));
        const delta = Number(
          membershipQtyBtn.getAttribute("data-membership-delta"),
        );
        updateMembershipQty(id, membershipQtyForVariant(id) + delta);
        return;
      }
      const bogo = e.target.closest("[data-bogo-svc]");
      if (bogo) {
        if (bogo.getAttribute("data-bogo-disabled") === "1") {
          S.err =
            "Bonus tidak bisa dipilih karena harganya lebih tinggi dari layanan yang dibeli.";
          render();
          return;
        }
        const bid = Number(bogo.getAttribute("data-bogo-svc"));
        const raw = (S.bogoEligible || []).find(function (x) {
          return Number(x && x.id) === bid;
        });
        if (raw) toggleFreeService(raw);
        return;
      }
      const incBtn = e.target.closest("[data-svc-increment]");
      if (incBtn) {
        const id = Number(incBtn.getAttribute("data-svc-increment"));
        const v = S.variants.find(function (v) {
          return v.id === id;
        });
        if (v) incrementService(v);
        return;
      }
      const decBtn = e.target.closest("[data-svc-decrement]");
      if (decBtn) {
        const id = Number(decBtn.getAttribute("data-svc-decrement"));
        const v = S.variants.find(function (v) {
          return v.id === id;
        });
        if (v) decrementService(v);
        return;
      }
      const btn = e.target.closest("[data-svc]");
      if (btn) {
        if (btn.getAttribute("data-svc-disabled") === "1") {
          S.err =
            "Item ini tidak bisa dipilih saat promo BOGO aktif. Pilih bonus gratis di bagian atas.";
          render();
          return;
        }
        const id = Number(btn.getAttribute("data-svc"));
        const v = S.variants.find(function (v) {
          return v.id === id;
        });
        if (v) toggleService(v);
        return;
      }
      const bnd = e.target.closest("[data-bnd]");
      if (bnd) {
        const id2 = Number(bnd.getAttribute("data-bnd"));
        const b = S.bundles.find(function (b) {
          return b.id === id2;
        });
        if (b) toggleBundle(b);
      }
    });
  }

  /* ── datetime step ── */
  function renderDatetime(p) {
    let slotsHTML = "";
    if (S.selectedDate) {
      if (S.availSlots === null) {
        slotsHTML =
          '<p style="color:var(--bk-mu);font-size:13px;padding:6px 0;">Memuat waktu tersedia\u2026</p>';
      } else if (!S.availSlots.length) {
        slotsHTML = `
          <div style="padding:32px 16px;text-align:center;background:#fff;border:1px solid rgba(178,102,50,0.1);border-radius:16px;">
            <p style="font-size:14px;font-weight:700;color:var(--bk-tx);margin:0 0 6px;">Hari Ini Tidak Tersedia</p>
            <p style="font-size:12px;color:var(--bk-mu);margin:0 0 16px;line-height:1.5;">Maaf, sepertinya tanggal ini sedang tutup atau tidak menerima reservasi online.</p>
            <a href="https://wa.me/6289609094700" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#25D366;color:#fff;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              Tanya Admin Via WhatsApp
            </a>
          </div>`;
      } else {
        const allClosed = S.availSlots.every((s) => !s.is_available);
        const alertHTML = allClosed
          ? `<div style="margin-bottom:20px;padding:16px;background:#fffaf0;border:1px solid #feebc8;border-radius:16px;box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="width:20px;height:20px;background:#ed8936;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:bold;">!</div>
                <p style="font-size:12px;font-weight:700;color:#7b341e;margin:0;text-transform:uppercase;letter-spacing:0.5px;">Jadwal Penuh / Tidak Cocok</p>
              </div>
              <p style="font-size:13px;color:#9c4221;margin:0 0 12px;line-height:1.5;">Maaf, kami tidak menemukan jadwal yang tersedia untuk kombinasi layanan Anda (Durasi: ${dur(totalDur())}). Ini biasanya karena durasi terlalu panjang atau terapis kami sudah terisi.</p>
              <div style="padding:12px;background:rgba(255,255,255,0.5);border-radius:12px;border:1px solid rgba(254,235,200,0.5);">
                <p style="font-size:12px;font-weight:600;color:#7b341e;margin:0 0 8px;">Apa yang bisa Anda lakukan?</p>
                <ul style="font-size:12px;color:#9c4221;margin:0 0 12px;padding-left:18px;line-height:1.6;">
                  <li>Kurangi jumlah item layanan</li>
                  <li>Pecah menjadi 2 pesanan berbeda</li>
                  <li>Pilih tanggal lain yang lebih luang</li>
                </ul>
                <div style="padding-top:10px;border-top:1px solid rgba(254,235,200,0.8);display:flex;align-items:center;justify-content:space-between;">
                  <span style="font-size:12px;color:#7b341e;font-weight:500;">Butuh bantuan?</span>
                  <a href="https://wa.me/6289609094700" target="_blank" style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#25D366;color:#fff;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    Hubungi Admin (WA)
                  </a>
                </div>
              </div>
            </div>`
          : "";

        const rows = S.availSlots
          .map(function (slot) {
            const sel = S.selectedSlot === slot.slot_time;
            const isDisabled = isSlotDisabled(slot);
            const isPast = (() => {
              const now = new Date();
              const todayStr =
                now.getFullYear() +
                "-" +
                String(now.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(now.getDate()).padStart(2, "0");
              if (S.selectedDate === todayStr) {
                const parts = slot.slot_time.split(":");
                const slotH = parseInt(parts[0], 10);
                const slotM = parseInt(parts[1], 10);
                const nowH = now.getHours();
                const nowM = now.getMinutes();
                return slotH < nowH || (slotH === nowH && slotM <= nowM);
              }
              return false;
            })();

            const effectiveAvailable = !isDisabled;
            const failReason = isDisabled
              ? isPast
                ? "Sudah Lewat"
                : slot.fail_reason === "resource_full"
                  ? "Ruangan Penuh"
                  : slot.fail_reason === "no_eligible_therapist"
                    ? "Terapis Penuh"
                    : slot.fail_reason === "past_closing_time"
                      ? "Sudah Tutup"
                      : "Penuh"
              : "";

            const statusLabel = effectiveAvailable
              ? '<span style="font-size:10px;color:var(--bk-ac);font-weight:600;">Tersedia</span>'
              : `<span style="font-size:10px;color:rgba(144,126,112,.5);">${failReason}</span>`;

            return `
              <button class="bk-slot${sel ? " sel" : ""}"${!effectiveAvailable ? " disabled" : ""} data-slot="${
                slot.slot_time
              }" title="${failReason}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 4px;gap:4px;text-align:center;">
                <span style="font-size:13px;font-weight:700;color:var(--bk-tx);">${slot.slot_time}</span>
                ${statusLabel}
              </button>`;
          })
          .join("");
        slotsHTML = `${alertHTML}<div class="bk-slots-grid">${rows}</div>`;
      }
    }
    p.innerHTML = `
      <div class="bk-scroll" style="padding:26px 24px;">
        <div style="width:36px;height:3px;background:var(--bk-ac);border-radius:2px;margin-bottom:16px;"></div>
        <h3 style="font-family:var(--bk-hd);font-size:1.5rem;color:var(--bk-tx);font-weight:500;margin:0 0 4px;">Pilih Jadwal</h3>
        <p style="font-size:13px;color:var(--bk-mu);margin:0 0 20px;">Pilih tanggal lalu jam yang tersedia</p>
        
        <div class="bk-show-mob" style="align-items:center; justify-content:space-between; margin-bottom:20px; background:#fff; padding:12px 14px; border-radius:14px; border:1px solid rgba(178,102,50,0.12);">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <span style="font-size:13px; font-weight:600; color:var(--bk-tx);">Layanan dilakukan bersamaan?</span>
            <span style="font-size:11px; color:var(--bk-mu);">Aktifkan jika Anda datang berdua atau lebih agar layanan selesai lebih cepat.</span>
          </div>
          <input type="checkbox" id="bk-is-parallel" style="width:18px; height:18px; accent-color:var(--bk-ac); cursor:pointer;" ${
            S.isParallel ? "checked" : ""
          } />
        </div>

        <div id="bk-cal" style="margin-bottom:28px;"></div>
        ${
          S.selectedDate
            ? `<div id="bk-time-section"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span class="bk-lbl">Pilih Waktu</span><div style="flex:1;height:1px;background:rgba(178,102,50,.1);"></div></div>${slotsHTML}</div>`
            : '<div style="padding:28px;text-align:center;border-radius:14px;background:rgba(178,102,50,.04);border:1px dashed rgba(178,102,50,.2);"><p style="color:var(--bk-mu);font-size:13px;margin:0;">\u2190 Pilih tanggal di kalender untuk melihat waktu tersedia</p></div>'
        }
      </div>`;
    renderCalendar();
    attachSlotListeners();
  }

  function attachSlotListeners() {
    const left = $("bk-left");
    if (!left || left._slotDelegated) return;
    left._slotDelegated = true;

    left.addEventListener("change", function (e) {
      if (e.target && e.target.id === "bk-is-parallel") {
        S.isParallel = !!e.target.checked;
        fetchDates();
        if (S.selectedDate) {
          fetchSlots(S.selectedSlot, false);
        }
      }
    });

    left.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-slot]");
      if (!btn || btn.disabled) return;
      const t = btn.getAttribute("data-slot");
      const slot =
        S.availSlots &&
        S.availSlots.find(function (s) {
          return s.slot_time === t;
        });
      if (!slot || !slot.is_available) return;
      S.err = "";
      const slotChanged = S.selectedSlot !== t;
      S.selectedSlot = t;
      if (slotChanged) {
        S.voucherApplied = null;
      }
      S.applyingVoucher = false;
      const auto = autoAssign(slot);
      if (!auto.staffAssignments.length) {
        S.staffAssignments = [];
        S.resourceAssignments = [];
        S.err =
          "Therapist tidak tersedia untuk jam ini. Silakan pilih jam lain.";
        render();
        return;
      }
      S.staffAssignments = auto.staffAssignments;
      S.resourceAssignments = auto.resourceAssignments;
      S.step = "confirm";
      ensureBonusSlotsLoaded();
      render();
      scrollToScheduleSection();
    });
  }

  /* ── calendar ── */
  function renderCalendar() {
    const wrap = $("bk-cal");
    if (!wrap) return;
    const parts = S.viewingMonth.split("-");
    const yr = parseInt(parts[0], 10);
    const mo = parseInt(parts[1], 10);
    const td = todayISO();
    const dim = new Date(yr, mo, 0).getDate();
    const fd = new Date(yr, mo - 1, 1).getDay();
    const MONTHS = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    let cells = "";
    for (let i = 0; i < fd; i++) cells += "<div></div>";
    for (let d = 1; d <= dim; d++) {
      const ds = yr + "-" + pad2(mo) + "-" + pad2(d);
      const off =
        ds < td || (S.availDates.length > 0 && S.availDates.indexOf(ds) === -1);
      let cls = "bk-day ";
      if (off) cls += "off";
      else if (ds === S.selectedDate) cls += "sl av";
      else if (ds === td) cls += "td av";
      else cls += "av";
      cells += `<div class="${cls}"${off ? "" : ` data-bkday="${ds}"`}>${d}</div>`;
    }
    wrap.innerHTML = `
      <div style="user-select:none;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <button id="bk-pmo" style="width:32px;height:32px;border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--bk-mu);transition:background .15s;" onmouseover="this.style.background='rgba(178,102,50,.1)'" onmouseout="this.style.background='transparent'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span style="font-family:var(--bk-hd);font-weight:500;font-size:14px;color:var(--bk-tx);">${MONTHS[mo - 1]} ${yr}</span>
          <button id="bk-nmo" style="width:32px;height:32px;border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--bk-mu);transition:background .15s;" onmouseover="this.style.background='rgba(178,102,50,.1)'" onmouseout="this.style.background='transparent'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px;">${DAYS.map(
          (d) =>
            `<div style="text-align:center;font-size:10px;font-weight:600;color:rgba(144,126,112,.55);">${d}</div>`,
        ).join("")}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;justify-items:center;">${cells}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:12px;">
          <div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:50%;background:var(--bk-ac);"></div><span style="font-size:10px;color:var(--bk-mu);">Tersedia</span></div>
          <div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:50%;background:rgba(144,126,112,.2);"></div><span style="font-size:10px;color:var(--bk-mu);">Tidak tersedia</span></div>
        </div>
      </div>`;
    $("bk-pmo").addEventListener("click", function () {
      S.viewingMonth = monthStr(new Date(yr, mo - 2, 1));
      fetchDates();
    });
    $("bk-nmo").addEventListener("click", function () {
      S.viewingMonth = monthStr(new Date(yr, mo, 1));
      fetchDates();
    });
    wrap.querySelectorAll("[data-bkday]").forEach(function (el) {
      el.addEventListener("click", function () {
        const dateChanged = S.selectedDate !== el.getAttribute("data-bkday");
        S.selectedDate = el.getAttribute("data-bkday");
        S.selectedSlot = "";
        S.staffAssignments = [];
        S.resourceAssignments = [];
        S.availSlots = null;
        if (S.bonusScheduleMode === "same_date" && selectedFreeVariant()) {
          S.bonusSelectedDate = S.selectedDate;
          S.bonusSelectedSlot = "";
          S.bonusStaffAssignments = [];
          S.bonusResourceAssignments = [];
          S.bonusAvailSlots = null;
        }
        if (dateChanged) {
          S.voucherApplied = null;
        }
        S.applyingVoucher = false;

        function scrollToTimeSection(smooth) {
          requestAnimationFrame(function () {
            const timeSection = $("bk-time-section");
            if (timeSection && timeSection.scrollIntoView) {
              timeSection.scrollIntoView({
                behavior: smooth ? "smooth" : "auto",
                block: "start",
              });
            }
          });
        }

        const slotsPromise = fetchSlots();

        // Scroll LANGSUNG ke placeholder loading — biar user dapet feedback
        // instan, nggak nunggu network dulu.
        scrollToTimeSection(true);

        // Begitu data beneran nyampe, panel dibangun ulang (lihat catatan
        // sebelumnya) jadi posisi scroll ke-reset. Snap balik TANPA animasi
        // (instan) biar nggak berasa "lompat" — kerasanya nyambung mulus.
        slotsPromise.then(function () {
          scrollToTimeSection(false);
        });

        if (S.bonusScheduleMode === "same_date" && selectedFreeVariant()) {
          fetchBonusSlots();
        }
      });
    });
  }

  function scrollToScheduleSection() {
    requestAnimationFrame(function () {
      const el = $("bk-schedule-section");
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* ── 11. CONFIRM STEP ── */
  function renderConfirm(p) {
    const dateFmt = S.selectedDate
      ? new Date(S.selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "\u2014";
    const linesHTML = S.cartLines
      .map(function (l) {
        if (l.kind === "bundle") {
          return `
            <div style="padding:10px 0;border-bottom:1px solid rgba(178,102,50,.08);">
              <span style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--bk-ac);background:rgba(178,102,50,.08);padding:2px 7px;border-radius:5px;">Bundle</span>
              <p style="font-size:13px;font-weight:600;color:var(--bk-tx);margin:6px 0 3px;">${esc(l.bundle.name)}</p>
              <div style="display:flex;justify-content:space-between;">
                <span style="font-size:11px;color:var(--bk-mu);">${dur(l.pricing.totalDuration)}</span>
                <span style="font-size:13px;color:var(--bk-ac);font-weight:600;">${idr(l.pricing.finalPrice)}</span>
              </div>
            </div>`;
        }
        const qty = l.qty || 1;
        const membershipQty = l.isFree
          ? 0
          : Math.min(qty, membershipQtyForVariant(l.variant.id));
        const lineTotal =
          l.variant.price * (l.isFree ? 0 : qty - membershipQty);
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(178,102,50,.08);">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;font-weight:700;color:var(--bk-ac);background:rgba(178,102,50,.08);padding:1px 6px;border-radius:4px;flex-shrink:0;">${qty}x</span>
                <p style="font-size:13px;font-weight:600;color:var(--bk-tx);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(
                  l.variant.name,
                )}</p>
              </div>
              <div style="display:flex;align-items:center;gap:6px;margin:2px 0 0;">
                <p style="font-size:11px;color:var(--bk-mu);margin:0;">${dur(l.variant.duration)}</p>
                ${membershipQty ? `<p style="font-size:11px;color:#2F9E44;margin:0;">· ${membershipQty} quota membership</p>` : ""}
                ${qty > 1 ? `<p style="font-size:11px;color:var(--bk-mu);margin:0;">\u00b7 ${idr(l.variant.price)}/unit</p>` : ""}
              </div>
            </div>
            <span style="font-size:13px;font-weight:700;color:var(--bk-tx);margin-left:8px;flex-shrink:0;">${idr(
              lineTotal,
            )}</span>
          </div>`;
      })
      .join("");
    let therapistHTML = "";
    if (S.staffAssignments.length && S.availSlots) {
      const slot = S.availSlots.find(function (s) {
        return s.slot_time === S.selectedSlot;
      });

      const assignmentLines = S.staffAssignments
        .map(function (a) {
          const v = S.variants.find(function (v) {
            return v.id === a.service_variant_id;
          });
          const t =
            slot &&
            slot.available_therapists &&
            slot.available_therapists.find(function (th) {
              return th.id === a.staff_id;
            });
          const tName = t
            ? (t.name ||
                t.first_name ||
                (t.staff && t.staff.first_name) ||
                "Therapist") +
              (t.last_name
                ? " " + t.last_name
                : t.staff && t.staff.last_name
                  ? " " + t.staff.last_name
                  : "")
            : "Therapist";

          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed rgba(178,102,50,.1);last:border-0;">
              <div style="width:42px;text-align:center;flex-shrink:0;">
                <p style="font-size:10px;font-weight:700;color:var(--bk-ac);margin:0;">${a.start_time}</p>
                <div style="width:1px;height:10px;background:rgba(178,102,50,.15);margin:2px auto;"></div>
                <p style="font-size:10px;color:var(--bk-mu);margin:0;">${a.end_time}</p>
              </div>
              <div style="flex:1;min-width:0;">
                <p style="font-size:12px;font-weight:600;color:var(--bk-tx);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(
                  v ? v.name : "Layanan",
                )}</p>
                <p style="font-size:11px;color:var(--bk-mu);margin:1px 0 0;">${esc(
                  tName,
                )}</p>
              </div>
            </div>`;
        })
        .join("");

      therapistHTML = `
        <div class="bk-sec">
          <p class="bk-lbl" style="margin-bottom:10px;">Rincian Penugasan</p>
          <div style="display:flex;flex-direction:column;">
            ${assignmentLines}
          </div>
        </div>`;
    }
    const bonus = selectedFreeVariant();
    if (bonus) ensureBonusSlotsLoaded();
    const isMob = W.innerWidth <= 640;
    const discAmt = voucherDiscountAmt();
    const bonusDateFmt = S.bonusSelectedDate
      ? new Date(S.bonusSelectedDate + "T00:00:00").toLocaleDateString(
          "id-ID",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        )
      : "\u2014";
    const bonusTherapists = bonusTherapistsForSelectedSlot();
    const bonusTherapistName = selectedBonusTherapistName();
    let bonusScheduleHTML = "";
    if (bonus) {
      const bonusSlotsBody = !S.bonusSelectedDate
        ? '<span style="font-size:12px;color:var(--bk-mu);">Pilih tanggal bonus terlebih dahulu.</span>'
        : S.bonusSlotsLoading
          ? '<span style="display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--bk-ac);font-weight:600;"><span style="width:12px;height:12px;border:2px solid rgba(178,102,50,.25);border-top-color:var(--bk-ac);border-radius:50%;display:inline-block;animation:bk-spin .8s linear infinite;"></span>Memuat slot bonus…</span>'
          : S.bonusAvailSlots === null
            ? '<span style="font-size:12px;color:var(--bk-mu);">Memuat slot bonus…</span>'
            : !(S.bonusAvailSlots || []).length
              ? '<span style="font-size:12px;color:var(--bk-mu);">Tidak ada slot bonus yang tersedia.</span>'
              : (S.bonusAvailSlots || [])
                  .map(function (slot) {
                    const active = S.bonusSelectedSlot === slot.slot_time;
                    const disabled = isBonusSlotDisabled(slot);
                    const conflicting = bonusSlotConflictsWithPaidBooking(slot);

                    let title = "";
                    if (conflicting) {
                      title = "Slot bonus bertabrakan dengan jadwal utama";
                    } else if (!slot.is_available) {
                      title = "Slot tidak tersedia";
                    } else {
                      // Check if past
                      const now = new Date();
                      const todayStr =
                        now.getFullYear() +
                        "-" +
                        String(now.getMonth() + 1).padStart(2, "0") +
                        "-" +
                        String(now.getDate()).padStart(2, "0");
                      if (S.bonusSelectedDate === todayStr) {
                        const parts = slot.slot_time.split(":");
                        const slotH = parseInt(parts[0], 10);
                        const slotM = parseInt(parts[1], 10);
                        if (
                          slotH < now.getHours() ||
                          (slotH === now.getHours() &&
                            slotM <= now.getMinutes())
                        ) {
                          title = "Sudah Lewat";
                        }
                      }
                    }

                    return `<button type="button" data-bonus-slot="${esc(slot.slot_time)}" style="border:1px solid ${
                      disabled
                        ? "rgba(178,102,50,.08)"
                        : active
                          ? "rgba(178,102,50,.35)"
                          : "rgba(178,102,50,.12)"
                    };border-radius:999px;padding:8px 12px;font-size:12px;font-weight:600;touch-action:manipulation;${
                      disabled
                        ? "background:#f6f1ec;color:#b6aea7;cursor:not-allowed;"
                        : active
                          ? "background:rgba(178,102,50,.12);color:var(--bk-ac);cursor:pointer;"
                          : "background:#fff;color:var(--bk-tx);cursor:pointer;"
                    }"${disabled ? " disabled" : ""}${title ? ` title="${esc(title)}"` : ""}>${esc(slot.slot_time)}${
                      slot.available_therapists &&
                      slot.available_therapists.length
                        ? ` (${String(slot.available_therapists.length)} therapist)`
                        : ""
                    }</button>`;
                  })
                  .join("");

      bonusScheduleHTML = `
        <div style="margin-top:16px;padding:14px 14px 12px;border:1px solid rgba(178,102,50,.16);border-radius:14px;background:linear-gradient(135deg,rgba(255,248,242,.95),rgba(255,255,255,.85));box-shadow:0 6px 18px rgba(178,102,50,.06);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">
            <p class="bk-lbl" style="margin:0;">Jadwal bonus gratis</p>
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--bk-ac);background:rgba(178,102,50,.08);padding:4px 8px;border-radius:999px;">Langkah berikutnya</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
            <button type="button" data-bonus-mode="same_date" style="border:none;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:600;${
              S.bonusScheduleMode === "same_date"
                ? "background:#b26632;color:#fff;"
                : "background:rgba(178,102,50,.08);color:var(--bk-mu);"
            }">Ikut tanggal utama</button>
            <button type="button" data-bonus-mode="custom_date" style="border:none;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:600;${
              S.bonusScheduleMode === "custom_date"
                ? "background:#b26632;color:#fff;"
                : "background:rgba(178,102,50,.08);color:var(--bk-mu);"
            }">Pilih tanggal sendiri</button>
          </div>
          <div style="display:grid;gap:10px;">
            <div style="font-size:13px;font-weight:700;color:var(--bk-tx);padding:8px 10px;border-radius:10px;background:rgba(178,102,50,.06);">${esc(
              bonus.name,
            )}</div>
            <input id="bk-bonus-date" type="date" class="bk-inp" value="${esc(S.bonusSelectedDate || "")}"${
              S.bonusScheduleMode === "same_date" || S.bonusSlotsLoading
                ? " disabled"
                : ""
            }/>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">${bonusSlotsBody}</div>
            <p style="font-size:12px;color:var(--bk-mu);margin:0;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.78);">
              <span style="font-weight:700;color:var(--bk-tx);">Tanggal bonus:</span> ${bonusDateFmt}${
                S.bonusSelectedSlot ? " · " + esc(S.bonusSelectedSlot) : ""
              }
            </p>
            ${
              S.bonusSelectedSlot
                ? `<div style="margin-top:8px;padding:10px 12px;border:1px solid rgba(178,102,50,.12);border-radius:12px;background:rgba(178,102,50,.04);">
                     <p style="margin:0;font-size:12px;font-weight:600;color:var(--bk-tx);">Therapist bonus terpilih</p>
                     <p style="margin:4px 0 0;font-size:12px;color:var(--bk-mu);">${esc(
                       bonusTherapistName ||
                         "Therapist akan mengikuti availability slot bonus yang dipilih.",
                     )}</p>
                     ${
                       bonusTherapists.length
                         ? `<p style="margin:4px 0 0;font-size:11px;color:var(--bk-mu);">Tersedia: ${esc(
                             bonusTherapists
                               .map((row) => row.name || "")
                               .filter(Boolean)
                               .join(", "),
                           )}</p>`
                         : ""
                     }
                   </div>`
                : ""
            }
          </div>
        </div>`;
    }
    const appliedVoucher =
      S.voucherApplied && canUseAppliedVoucher() ? S.voucherApplied : null;
    const voucherHTML =
      !isMob && !S.promoType
        ? `
        <div class="bk-sec"><p class="bk-lbl" style="margin-bottom:8px;">Voucher</p>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="bk-voucher" class="bk-inp" style="flex:1;${appliedVoucher ? "border-color:#2F9E44;background:rgba(47,158,68,0.04);" : ""}" placeholder="Kode voucher" value="${esc(
              S.voucherCode || "",
            )}"/>
            <button id="bk-apply-voucher" class="bk-btn-g" style="width:auto;padding:10px 14px;border-radius:10px;${appliedVoucher ? "background:#2F9E44;color:#fff;border-color:#2F9E44;" : ""}"${
              S.applyingVoucher ? " disabled" : ""
            }>${S.applyingVoucher ? "Memeriksa\u2026" : appliedVoucher ? "Tersedia" : "Terapkan"}</button>
          </div>
          ${
            appliedVoucher
              ? `<p style="font-size:12px;color:#2F9E44;margin:8px 0 0;font-weight:600;display:flex;align-items:center;gap:4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Voucher "${esc(appliedVoucher.code)}" berhasil diterapkan! Hemat ${idr(discAmt)}
                 </p>`
              : ""
          }
        </div>`
        : "";
    const discountHTML =
      !isMob && appliedVoucher
        ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;">
            <span style="font-size:12px;color:var(--bk-mu);">Subtotal</span>
            <span style="font-size:12px;color:var(--bk-mu);text-decoration:line-through;">${idr(
              subtotalAmt(),
            )}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;">
            <span style="font-size:12px;color:#2F9E44;font-weight:600;">Diskon Voucher</span>
            <span style="font-size:12px;color:#2F9E44;font-weight:600;">-${idr(discAmt)}</span>
          </div>`
        : "";
    p.innerHTML = `
      <div class="bk-scroll" style="padding:26px 24px;">
        <div style="width:36px;height:3px;background:var(--bk-ac);border-radius:2px;margin-bottom:16px;"></div>
        <h3 style="font-family:var(--bk-hd);font-size:1.5rem;color:var(--bk-tx);font-weight:500;margin:0 0 4px;">Konfirmasi Booking</h3>
        <p style="font-size:13px;color:var(--bk-mu);margin:0 0 20px;">Periksa detail sebelum melanjutkan pembayaran</p>
        <div class="bk-sec"><p class="bk-lbl" style="margin-bottom:6px;">Pelanggan</p>
          <p style="font-size:14px;font-weight:600;color:var(--bk-tx);margin:0;">${esc(S.form.name)}</p>
          ${
            S.form.phone
              ? `<p style="font-size:13px;color:var(--bk-mu);margin:2px 0 0;">${esc(S.form.phone)}</p>`
              : ""
          }
        </div>
        <div class="bk-sec" id="bk-schedule-section"><p class="bk-lbl" style="margin-bottom:6px;">Jadwal</p>
          <p style="font-size:14px;font-weight:600;color:var(--bk-tx);margin:0;">${dateFmt}</p>
          <p style="font-size:13px;color:var(--bk-ac);font-weight:500;margin:3px 0 0;">${S.selectedSlot} \u00b7 ${dur(
            totalDur(),
          )}</p>
        </div>
        ${therapistHTML}
        ${bonusScheduleHTML}
        <div class="bk-sec"><p class="bk-lbl" style="margin-bottom:4px;">Layanan</p>
          ${linesHTML}
          ${voucherHTML}
          ${discountHTML}
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;">
            <span style="font-size:14px;font-weight:600;color:var(--bk-tx);">Total</span>
            <span style="font-family:var(--bk-hd);font-size:16px;font-weight:600;color:var(--bk-ac);">${idr(
              totalAmt(),
            )}</span>
          </div>
        </div>
        <div id="bk-error" style="display:none;padding:10px 14px;background:rgba(200,50,50,.07);border:1px solid rgba(200,50,50,.2);border-radius:10px;color:#c83232;font-size:12px;margin-top:4px;"></div>
      </div>`;
    const errEl = $("bk-error");
    if (errEl) {
      if (S.err) {
        errEl.innerHTML = esc(S.err);
        errEl.style.display = "block";
      } else {
        errEl.innerHTML = "";
        errEl.style.display = "none";
      }
    }

    if (p && !p._confirmListenersBound) {
      p._confirmListenersBound = true;
      p.addEventListener("input", function (e) {
        const t = e && e.target;
        if (!t) return;
        if (t.id === "bk-bonus-date") {
          S.bonusSelectedDate = String(t.value || "");
          S.bonusSelectedSlot = "";
          S.bonusStaffAssignments = [];
          S.bonusResourceAssignments = [];
          fetchBonusSlots();
          return;
        }
        if (t.id !== "bk-voucher") return;
        const next = String(t.value || "").toUpperCase();
        if (S.voucherCode !== next) {
          S.voucherCode = next;
          if (
            S.voucherApplied &&
            S.voucherApplied.code !== normalizedVoucherCode()
          ) {
            S.voucherApplied = null;
          }
          renderHeader();
          renderRight();
          renderMobileBar();
        }
      });
      p.addEventListener("change", function (e) {
        const t = e && e.target;
        if (!t || t.id !== "bk-bonus-date") return;
        S.bonusSelectedDate = String(t.value || "");
        S.bonusSelectedSlot = "";
        S.bonusStaffAssignments = [];
        S.bonusResourceAssignments = [];
        fetchBonusSlots();
      });
      p.addEventListener("click", function (e) {
        const btn =
          e &&
          e.target &&
          e.target.closest &&
          e.target.closest("#bk-apply-voucher");
        if (!btn) return;
        applyVoucher();
      });
      p.addEventListener("click", function (e) {
        const modeBtn =
          e &&
          e.target &&
          e.target.closest &&
          e.target.closest("[data-bonus-mode]");
        if (modeBtn) {
          applyBonusScheduleMode(modeBtn.getAttribute("data-bonus-mode"), {
            load: true,
          });
          return;
        }
        const slotBtn =
          e &&
          e.target &&
          e.target.closest &&
          e.target.closest("[data-bonus-slot]");
        if (!slotBtn) return;
        const wanted = slotBtn.getAttribute("data-bonus-slot");
        const slot = (S.bonusAvailSlots || []).find(function (row) {
          return row.slot_time === wanted && !isBonusSlotDisabled(row);
        });
        const bonusVar = selectedFreeVariant();
        if (!slot || !bonusVar) return;
        const elig = eligibleTherapistIdsForCategory(slot, bonusVar.categoryId);
        const staffId =
          elig[0] ||
          (slot.available_therapists && slot.available_therapists[0]
            ? slot.available_therapists[0].id
            : 0);
        S.bonusSelectedSlot = slot.slot_time;
        S.bonusStaffAssignments = staffId
          ? [
              {
                service_variant_id: bonusVar.id,
                staff_id: staffId,
                client_key: bonusVar.id + ":1",
                start_time: slot.slot_time,
                end_time: addMin(slot.slot_time, bonusVar.duration),
              },
            ]
          : [];

        S.bonusResourceAssignments = [];
        if (
          staffId &&
          slot.available_resources_by_variant &&
          slot.available_resources_by_variant[bonusVar.id] &&
          slot.available_resources_by_variant[bonusVar.id].length > 0
        ) {
          S.bonusResourceAssignments = [
            {
              service_variant_id: bonusVar.id,
              resource_id: slot.available_resources_by_variant[bonusVar.id][0],
              client_key: bonusVar.id + ":1",
              start_time: slot.slot_time,
              end_time: addMin(slot.slot_time, bonusVar.duration),
            },
          ];
        }
        render();
      });
    }
  }

  /* ── 12. T&C ACCORDION (shared: desktop confirm step + mobile confirm bar) ── */
  const TNC_SECTIONS = [
    {
      t: "1. Konfirmasi Booking",
      b: "Booking dianggap sah setelah pembayaran berhasil dikonfirmasi. Kami akan mengirimkan notifikasi konfirmasi melalui WhatsApp ke nomor yang terdaftar.",
    },
    {
      t: "2. Pembatalan &amp; Reschedule",
      b: 'Pembatalan dapat dilakukan <strong style="color:var(--bk-tx)">minimal 2 jam sebelum jadwal</strong> tanpa dikenakan biaya. Pembatalan kurang dari 2 jam sebelum jadwal tidak dapat diproses dan biaya booking dianggap hangus. Untuk reschedule, silakan hubungi kami via WhatsApp setidaknya 2 jam sebelum jadwal.',
    },
    {
      t: "3. Keterlambatan",
      b: "Keterlambatan lebih dari 15 menit dapat mengakibatkan pengurangan durasi treatment sesuai sisa waktu yang tersedia, tanpa pengurangan biaya.",
    },
    {
      t: "4. Pembayaran",
      b: "Semua transaksi diproses melalui gateway pembayaran yang aman. Mahalu Spa tidak menyimpan informasi kartu pembayaran Anda. Bukti pembayaran akan dikirimkan via WhatsApp.",
    },
    {
      t: "5. Kesehatan &amp; Keselamatan",
      b: "Mohon informasikan kondisi kesehatan khusus (kehamilan, alergi, cedera) sebelum treatment. Mahalu Spa berhak menolak atau memodifikasi treatment demi keselamatan pelanggan.",
    },
    {
      t: "6. Privasi",
      b: "Data pribadi Anda (nama, nomor telepon) hanya digunakan untuk keperluan reservasi dan konfirmasi booking. Kami tidak membagikan data Anda kepada pihak ketiga tanpa persetujuan.",
    },
  ];

  function renderTncAccordionHTML(prefix) {
    const open = !!S._tncOpen;
    const chevron =
      '<svg class="bk-acc-ic" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    const sections = TNC_SECTIONS.map(
      (sec) =>
        `<p style="margin:0 0 3px;font-weight:700;color:var(--bk-tx);font-size:11px;">${sec.t}</p><p style="margin:0 0 10px;">${sec.b}</p>`,
    ).join("");
    return `
      <div class="bk-acc${open ? " open" : ""}" id="${prefix}-acc">
        <div class="bk-acc-h" id="${prefix}-acc-h" role="button" aria-expanded="${open ? "true" : "false"}">
          <label style="display:flex;align-items:center;gap:9px;cursor:pointer;flex:1;min-width:0;" id="${prefix}-lbl">
            <span style="position:relative;flex-shrink:0;">
              <input type="checkbox" id="${prefix}" style="position:absolute;opacity:0;width:18px;height:18px;cursor:pointer;margin:0;"${
                S.tncAccepted ? " checked" : ""
              }/>
              <span style="width:18px;height:18px;border-radius:5px;border:1.5px solid ${
                S.tncAccepted ? "var(--bk-ac)" : "rgba(144,126,112,.4)"
              };background:${S.tncAccepted ? "var(--bk-ac)" : "#fff"};display:flex;align-items:center;justify-content:center;transition:all .15s;">${
                S.tncAccepted ? ICON_CHECK_10 : ""
              }</span>
            </span>
            <span class="bk-acc-t">Saya menyetujui Syarat &amp; Ketentuan</span>
          </label>
          ${chevron}
        </div>
        <div class="bk-acc-body" id="${prefix}-acc-body">
          <div class="bk-acc-body-in">${sections}</div>
        </div>
      </div>`;
  }

  function attachTncAccordionListeners(prefix, onCheckChange) {
    const head = $(prefix + "-acc-h");
    const chk = $(prefix);
    const body = $(prefix + "-acc-body");
    const accEl = $(prefix + "-acc");
    if (head && body && accEl) {
      head.addEventListener("click", function (e) {
        if (e.target === chk || (chk && chk.contains(e.target))) return;
        S._tncOpen = !S._tncOpen;
        accEl.classList.toggle("open", S._tncOpen);
        head.setAttribute("aria-expanded", S._tncOpen ? "true" : "false");
      });
    }
    if (chk) {
      chk.addEventListener("change", function () {
        S.tncAccepted = chk.checked;
        if (onCheckChange) onCheckChange();
      });
    }
  }

  /* Mobile voucher block: same fields as the desktop confirm-step voucher
     section, duplicated here because the mobile confirm bar (#bk-mob) is a
     separate pinned element from the desktop right panel — same pattern as
     the bk-tnc / bk-mob-tnc accordion duplication above. */
  function renderMobileVoucherHTML() {
    if (S.promoType) return "";
    const discAmt = voucherDiscountAmt();
    const appliedVoucher =
      S.voucherApplied && canUseAppliedVoucher() ? S.voucherApplied : null;
    return `
      <div class="bk-sec" style="margin-bottom:10px;"><p class="bk-lbl" style="margin-bottom:8px;">Voucher</p>
        <div style="display:flex;gap:8px;align-items:center;">
          <input id="bk-mob-voucher" class="bk-inp" style="flex:1;${appliedVoucher ? "border-color:#2F9E44;background:rgba(47,158,68,0.04);" : ""}" placeholder="Kode voucher" value="${esc(
            S.voucherCode || "",
          )}"/>
          <button id="bk-mob-apply-voucher" class="bk-btn-g" style="width:auto;padding:10px 14px;border-radius:10px;${appliedVoucher ? "background:#2F9E44;color:#fff;border-color:#2F9E44;" : ""}"${
            S.applyingVoucher ? " disabled" : ""
          }>${S.applyingVoucher ? "Memeriksa\u2026" : appliedVoucher ? "Tersedia" : "Terapkan"}</button>
        </div>
        ${
          appliedVoucher
            ? `<p style="font-size:12px;color:#2F9E44;margin:8px 0 0;font-weight:600;display:flex;align-items:center;gap:4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                Voucher "${esc(appliedVoucher.code)}" diterapkan! Hemat ${idr(discAmt)}
               </p>`
            : ""
        }
        ${S.err ? `<p style="font-size:12px;color:#c83232;margin:8px 0 0;">${esc(S.err)}</p>` : ""}
      </div>`;
  }

  function attachMobileVoucherListeners() {
    const inp = $("bk-mob-voucher");
    const btn = $("bk-mob-apply-voucher");
    if (inp) {
      inp.addEventListener("input", function (e) {
        const next = String(e.target.value || "").toUpperCase();
        if (S.voucherCode !== next) {
          S.voucherCode = next;
          if (
            S.voucherApplied &&
            S.voucherApplied.code !== normalizedVoucherCode()
          ) {
            S.voucherApplied = null;
          }
          // Only refresh the header badge here — never re-render bk-mob itself
          // while the user is typing inside it, or the input loses focus/cursor.
          renderHeader();
        }
      });
    }
    if (btn) {
      btn.addEventListener("click", function () {
        applyVoucher();
      });
    }
  }

  /* ── 13. RIGHT PANEL (desktop cart summary + step CTA) ── */
  function renderRight() {
    const p = $("bk-right");
    if (!p) return;
    const cartHTML =
      S.cartLines.length === 0
        ? '<div style="padding:32px 0;text-align:center;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(144,126,112,.3)" stroke-width="1.5" style="margin:0 auto 10px;display:block;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p style="font-size:12px;color:rgba(144,126,112,.5);margin:0;">Belum ada layanan dipilih</p></div>'
        : S.cartLines
            .map(function (l, i) {
              const rmBtn = `<button class="bk-rm" data-idx="${i}" style="width:22px;height:22px;border:none;background:transparent;cursor:pointer;color:rgba(144,126,112,.5);font-size:18px;line-height:1;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;" onmouseover="this.style.color='#c83232'" onmouseout="this.style.color='rgba(144,126,112,.5)'">×</button>`;
              if (l.kind === "bundle") {
                return `
                  <div style="padding:10px 0;border-bottom:1px solid rgba(178,102,50,.08);">
                    <div style="display:flex;align-items:flex-start;gap:6px;">
                      <div style="flex:1;min-width:0;">
                        <span style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--bk-ac);background:rgba(178,102,50,.08);padding:1px 6px;border-radius:4px;">Bundle</span>
                        <p style="font-size:12px;font-weight:600;color:var(--bk-tx);margin:4px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(
                          l.bundle.name,
                        )}</p>
                        <p style="font-size:12px;font-weight:700;color:var(--bk-ac);margin:0;">${idr(l.pricing.finalPrice)}</p>
                      </div>
                      ${rmBtn}
                    </div>
                  </div>`;
              }
              const qty = l.qty || 1;
              const membershipQty = l.isFree
                ? 0
                : Math.min(qty, membershipQtyForVariant(l.variant.id));
              const lineTotal =
                l.variant.price * (l.isFree ? 0 : qty - membershipQty);
              return `
                <div style="display:flex;align-items:center;gap:6px;padding:10px 0;border-bottom:1px solid rgba(178,102,50,.08);">
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:5px;">
                      <span style="font-size:11px;font-weight:700;color:var(--bk-ac);background:rgba(178,102,50,.08);padding:1px 5px;border-radius:4px;flex-shrink:0;">${qty}x</span>
                      <p style="font-size:12px;font-weight:600;color:var(--bk-tx);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(
                        l.variant.name,
                      )}</p>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;margin:1px 0 0;">
                      <p style="font-size:11px;color:var(--bk-mu);margin:0;">${dur(l.variant.duration)}</p>
                      ${membershipQty ? `<p style="font-size:11px;color:#2F9E44;margin:0;">· ${membershipQty} quota membership</p>` : ""}
                      ${qty > 1 ? `<p style="font-size:11px;color:var(--bk-mu);margin:0;">\u00b7 ${idr(l.variant.price)}/unit</p>` : ""}
                    </div>
                  </div>
                  <div style="text-align:right;flex-shrink:0;">
                    <span style="font-size:12px;font-weight:600;color:var(--bk-tx);">${idr(lineTotal)}</span>
                  </div>
                  ${rmBtn}
                </div>`;
            })
            .join("");
    const discAmt = voucherDiscountAmt();
    const appliedVoucher =
      S.voucherApplied && canUseAppliedVoucher() ? S.voucherApplied : null;

    const totalRow = S.cartLines.length
      ? `
        <div style="padding:10px 0 0;border-top:1px solid rgba(178,102,50,.1);">
          ${
            appliedVoucher
              ? `<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;">
                  <span style="font-size:12px;color:rgba(144,126,112,.7);">Subtotal</span>
                  <span style="font-size:12px;color:rgba(144,126,112,.7);text-decoration:line-through;">${idr(
                    subtotalAmt(),
                  )}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;">
                  <span style="font-size:12px;color:#2F9E44;font-weight:600;display:flex;align-items:center;gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Voucher: ${esc(appliedVoucher.code)}
                  </span>
                  <span style="font-size:12px;color:#2F9E44;font-weight:600;">-${idr(discAmt)}</span>
                </div>`
              : ""
          }
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:14px;font-weight:600;color:var(--bk-tx);">Total</span>
            <span style="font-family:var(--bk-hd);font-size:15px;font-weight:600;color:var(--bk-ac);">${idr(
              totalAmt(),
            )}</span>
          </div>
        </div>`
      : "";
    const bonusVar = selectedFreeVariant();
    let schedBadge =
      S.selectedDate && S.selectedSlot
        ? `
        <div style="margin-bottom:12px;padding:11px 13px;background:rgba(178,102,50,.06);border-radius:12px;border:1px solid rgba(178,102,50,.16);">
          <p class="bk-lbl" style="margin-bottom:4px;">Jadwal dipilih</p>
          <p style="font-size:12px;font-weight:600;color:var(--bk-tx);margin:0;">${new Date(
            S.selectedDate + "T00:00:00",
          ).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}</p>
          <p style="font-size:12px;color:var(--bk-ac);font-weight:500;margin:2px 0 0;">${S.selectedSlot} \u00b7 ${dur(
            totalDur(),
          )}</p>
        </div>`
        : "";

    const parallelToggleHTML =
      S.step !== "customer" && S.step !== "success"
        ? `
      <div style="margin-bottom:12px; background:#fff; padding:12px 14px; border-radius:14px; border:1px solid rgba(178,102,50,0.12); display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span style="font-size:12px; font-weight:600; color:var(--bk-tx);">Layanan dilakukan bersamaan?</span>
          <span style="font-size:10px; color:var(--bk-mu);">Aktifkan jika Anda datang berdua atau lebih agar layanan selesai lebih cepat.</span>
        </div>
        <input type="checkbox" id="bk-is-parallel" style="width:18px; height:18px; accent-color:var(--bk-ac); cursor:pointer;" ${
          S.isParallel ? "checked" : ""
        } />
      </div>`
        : "";

    if (bonusVar) {
      if (S.bonusSelectedDate && S.bonusSelectedSlot) {
        schedBadge += `
        <div style="margin-bottom:12px;padding:11px 13px;background:rgba(47,158,68,.06);border-radius:12px;border:1px solid rgba(47,158,68,.16);">
          <p class="bk-lbl" style="margin-bottom:4px;color:#2F9E44;">Jadwal Bonus Gratis</p>
          <p style="font-size:12px;font-weight:600;color:var(--bk-tx);margin:0;">${new Date(
            S.bonusSelectedDate + "T00:00:00",
          ).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}</p>
          <p style="font-size:12px;color:#2F9E44;font-weight:500;margin:2px 0 0;">${S.bonusSelectedSlot} \u00b7 ${dur(
            bonusVar.duration || bonusVar.duration_minutes || 0,
          )}</p>
        </div>`;
      } else {
        schedBadge += `
        <div style="margin-bottom:12px;padding:11px 13px;background:rgba(200,50,50,.06);border-radius:12px;border:1px solid rgba(200,50,50,.16);">
          <p class="bk-lbl" style="margin-bottom:4px;color:#c83232;">Jadwal Bonus Gratis</p>
          <p style="font-size:12px;font-weight:600;color:#c83232;margin:0;">Belum dipilih</p>
          <p style="font-size:11px;color:#c83232;margin:2px 0 0;">Wajib pilih jam bonus di tab Jadwal.</p>
        </div>`;
      }
    }
    let ctaHTML = "";
    if (S.step === "customer") {
      ctaHTML = `<button id="bk-next" class="bk-btn-p"${!S.form.name.trim() ? " disabled" : ""}>Pilih Layanan \u2192</button>`;
    } else if (S.step === "services") {
      ctaHTML = `
        <div style="display:flex;gap:8px;">
          <button id="bk-back" class="bk-btn-g">\u2190 Kembali</button>
          ${S.cartLines.length ? '<button id="bk-next" class="bk-btn-p" style="flex:1;">Pilih Jadwal \u2192</button>' : ""}
        </div>`;
    } else if (S.step === "datetime") {
      ctaHTML =
        '<button id="bk-back" class="bk-btn-g" style="width:100%;">\u2190 Kembali</button>';
    } else if (S.step === "confirm") {
      const hasBonus = !!selectedFreeVariant();
      const canBook = !!(
        S.form.name.trim() &&
        S.cartLines.length &&
        S.selectedDate &&
        S.selectedSlot &&
        S.tncAccepted &&
        (!hasBonus || (S.bonusSelectedDate && S.bonusSelectedSlot))
      );
      ctaHTML = `
        ${renderTncAccordionHTML("bk-tnc")}
        ${
          S.err
            ? `<div style="padding:10px 12px;background:rgba(200,50,50,.07);border:1px solid rgba(200,50,50,.2);border-radius:10px;color:#c83232;font-size:12px;margin-top:10px;">${esc(
                S.err,
              )}</div>`
            : ""
        }
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button id="bk-back" class="bk-btn-g">\u2190 Kembali</button>
          <button id="bk-book" class="bk-btn-p" style="flex:1;"${!canBook || S.submitting ? " disabled" : ""}>${
            S.submitting ? "Memproses\u2026" : "Booking &amp; Bayar \u2192"
          }</button>
        </div>`;
    }
    p.innerHTML = `
      <div style="flex-shrink:0;padding:16px 18px;border-bottom:1px solid rgba(178,102,50,.1);">
        <p class="bk-lbl" style="margin-bottom:10px;">Pesananmu</p>
        ${cartHTML}
        ${totalRow}
      </div>
      <div class="bk-scroll" style="padding:14px 18px;flex:1;">
        ${parallelToggleHTML}
        ${schedBadge}
        <p style="font-family:var(--bk-hd);font-size:12px;font-style:italic;color:rgba(144,126,112,.4);text-align:center;margin-top:16px;">A moment of calm, crafted for you.</p>
      </div>
      <div style="flex-shrink:0;padding:14px 18px;border-top:1px solid rgba(178,102,50,.1);">
        ${ctaHTML}
      </div>`;

    p.querySelectorAll(".bk-rm").forEach(function (btn) {
      btn.addEventListener("click", function () {
        removeLine(Number(btn.getAttribute("data-idx")));
      });
    });

    const parallelInput = p.querySelector("#bk-is-parallel");
    if (parallelInput) {
      parallelInput.addEventListener("change", function (e) {
        S.isParallel = !!e.target.checked;
        // Refetch dates and slots because parallel mode affects availability
        fetchDates();
        if (S.selectedDate) {
          fetchSlots(S.selectedSlot, false);
        }
      });
    }

    const nextBtn = $("bk-next");
    const backBtn = $("bk-back");
    const bookBtn = $("bk-book");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (S.step === "customer" && S.form.name.trim()) {
          if (!S.variants.length) fetchVariants();
          if (!S.bundles.length) fetchBundles();
          S.step = "services";
          render();
        } else if (S.step === "services" && S.cartLines.length) {
          if (S.selectedDate && S.selectedSlot) {
            // If already have date and slot, go to confirm step
            // Make sure to fetch slots to get staff assignments
            fetchSlots(S.selectedSlot, false).then(() => {
              // Auto assign staff if we have a slot
              if (S.availSlots && S.selectedSlot) {
                const slot = S.availSlots.find(
                  (s) => s.slot_time === S.selectedSlot,
                );
                if (slot && slot.is_available) {
                  const auto = autoAssign(slot);
                  if (auto.staffAssignments.length > 0) {
                    S.staffAssignments = auto.staffAssignments;
                    S.resourceAssignments = auto.resourceAssignments;
                  }
                }
              }
              S.step = "confirm";
              render();
              scrollToScheduleSection();
            });
          } else {
            // Otherwise, go to datetime step to pick date/slot
            S.viewingMonth = monthStr();
            fetchDates();
            S.step = "datetime";
            render();
          }
        }
      });
    }
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        const map = {
          services: "customer",
          datetime: "services",
          confirm: "datetime",
        };
        S.step = map[S.step] || "customer";
        render();
      });
    }
    if (bookBtn) {
      bookBtn.addEventListener("click", function () {
        if (!S.submitting) handleBook();
      });
    }
    if (S.step === "confirm")
      attachTncAccordionListeners("bk-tnc", renderRight);
  }

  /* ── 14. MOBILE BOTTOM BAR ── */
  function renderMobileBar() {
    const bar = $("bk-mob");
    if (!bar) return;
    const isMob = W.innerWidth <= 640;
    if (!isMob || S.step === "customer") {
      bar.style.display = "none";
      bar.innerHTML = "";
      return;
    }
    if (S.step === "services") {
      if (S.cartLines.length === 0) {
        bar.style.display = "none";
        bar.innerHTML = "";
        return;
      }
      const discAmt = voucherDiscountAmt();
      const appliedVoucher =
        S.voucherApplied && canUseAppliedVoucher() ? S.voucherApplied : null;
      bar.className = "bk-mob";
      bar.style.cssText = "";
      bar.innerHTML = `
        <div style="flex:1;min-width:0;">
          <p style="font-size:13px;font-weight:600;color:var(--bk-tx);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${S.cartLines.length} item dipilih</p>
          <div style="display:flex;align-items:center;gap:6px;">
            ${appliedVoucher ? `<span style="font-size:12px;color:var(--bk-mu);text-decoration:line-through;">${idr(subtotalAmt())}</span>` : ""}
            <p style="font-size:13px;font-weight:700;color:var(--bk-ac);margin:0;">${idr(totalAmt())}</p>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button id="bk-mob-back" class="bk-btn-g" style="padding:10px 14px;">\u2190</button>
          <button id="bk-mobnext" class="bk-btn-p" style="width:auto;padding:10px 18px;">Pilih Jadwal \u2192</button>
        </div>`;
      const mb = $("bk-mob-back");
      if (mb)
        mb.addEventListener("click", function () {
          S.step = "customer";
          render();
        });
      const mn = $("bk-mobnext");
      if (mn)
        mn.addEventListener("click", function () {
          S.viewingMonth = monthStr();
          fetchDates();
          S.step = "datetime";
          render();
        });
      return;
    }
    if (S.step === "datetime") {
      bar.className = "bk-mob";
      bar.style.cssText = "";
      bar.innerHTML =
        '<button id="bk-mob-back" class="bk-btn-g" style="width:100%;">\u2190 Kembali ke Layanan</button>';
      const mb2 = $("bk-mob-back");
      if (mb2)
        mb2.addEventListener("click", function () {
          S.step = "services";
          render();
        });
      return;
    }
    if (S.step === "confirm") {
      const hasBonus = !!selectedFreeVariant();
      const canBook = !!(
        S.form.name.trim() &&
        S.cartLines.length &&
        S.selectedDate &&
        S.selectedSlot &&
        S.tncAccepted &&
        (!hasBonus || (S.bonusSelectedDate && S.bonusSelectedSlot))
      );
      const discAmt = voucherDiscountAmt();
      const appliedVoucher =
        S.voucherApplied && canUseAppliedVoucher() ? S.voucherApplied : null;

      // Confirm bar uses a special layout: T&C in a scrollable area, buttons pinned to the bottom.
      // Confirm bar: ringkasan/voucher di area scroll (opsional discroll),
      // T&C + tombol selalu pinned di bawah (bk-mob-actions) biar checkbox
      // T&C-nya nggak pernah ketutup / perlu discroll dulu buat ketemu.
      bar.className = "bk-mob bk-mob-confirm";
      bar.style.cssText = "";
      bar.innerHTML = `
        <div class="bk-mob-tnc-scroll">
          ${renderMobileVoucherHTML()}
          <div style="padding:15px; background:rgba(178,102,50,0.04); border-radius:12px; border:1px solid rgba(178,102,50,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:13px; color:var(--bk-mu);">Total Bayar</span>
              <div style="text-align:right;">
                ${appliedVoucher ? `<div style="font-size:12px; color:var(--bk-mu); text-decoration:line-through;">${idr(subtotalAmt())}</div>` : ""}
                <div style="font-size:18px; font-weight:800; color:var(--bk-ac); font-family:var(--bk-hd);">${idr(totalAmt())}</div>
              </div>
            </div>
            ${
              appliedVoucher
                ? `<div style="font-size:12px; color:#2F9E44; font-weight:600; text-align:right;">Hemat ${idr(
                    discAmt,
                  )}</div>`
                : ""
            }
          </div>
        </div>
        <div class="bk-mob-actions">
          ${renderTncAccordionHTML("bk-mob-tnc")}
          ${
            !S.tncAccepted
              ? '<p style="font-size:11px;color:var(--bk-ac);margin:6px 2px 0;">Silakan setujui Syarat &amp; Ketentuan untuk melanjutkan pembayaran.</p>'
              : ""
          }
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button id="bk-mob-back" class="bk-btn-g">\u2190</button>
            <button id="bk-mob-book" class="bk-btn-p" style="flex:1;"${!canBook || S.submitting ? " disabled" : ""}>${
              S.submitting ? "Memproses\u2026" : "Booking &amp; Bayar \u2192"
            }</button>
          </div>
        </div>`;
      const mb3 = $("bk-mob-back");
      if (mb3)
        mb3.addEventListener("click", function () {
          S.step = "datetime";
          render();
        });
      const mbk = $("bk-mob-book");
      if (mbk)
        mbk.addEventListener("click", function () {
          if (!S.submitting) handleBook();
        });
      attachTncAccordionListeners("bk-mob-tnc", renderMobileBar);
      attachMobileVoucherListeners();
      return;
    }
    bar.style.display = "none";
    bar.innerHTML = "";
  }

  /* ── render root ── */
  function render() {
    renderHeader();
    renderBody();
    renderMobileBar();
  }

  /* ── 15. OPEN / CLOSE / SWIPE / INIT ── */
  function openModal() {
    injectModal();
    clearTimeout(S._membershipPollTimer);
    S.step = "customer";
    S.cartLines = [];
    S.form = { name: "", phone: "" };
    S.browseMode = "services";
    S.activeCat = S.categories.length ? S.categories[0].key : "";
    S.search = "";
    S.viewingMonth = monthStr();
    S.selectedDate = "";
    S.selectedSlot = "";
    S.staffAssignments = [];
    S.resourceAssignments = [];
    S.availDates = [];
    S.availSlots = null;
    S.custCount = null;
    S.createdBooking = null;
    S.submitting = false;
    S.tncAccepted = false;
    S._tncOpen = false;
    S.voucherCode = "";
    S.voucherApplied = null;
    S.applyingVoucher = false;
    S.bonusScheduleMode = "same_date";
    S.bonusSelectedDate = "";
    S.bonusSelectedSlot = "";
    S.bonusStaffAssignments = [];
    S.bonusResourceAssignments = [];
    S.bonusAvailSlots = null;
    S.bonusSlotsLoading = false;
    S._bonusFetchSeq = 0;
    S.bogoEligible = [];
    S.membershipEligibility = null;
    S.membershipPackages = [];
    S.membershipPackagesLoading = false;
    S.membershipPurchaseView = false;
    S.membershipBuying = false;
    S.membershipPaymentUrl = "";
    S.membershipPurchaseMessage = "";
    S.membershipQtyByVariant = {};
    S._membershipQueryKey = "";
    S._membershipFetchSeq += 1;
    S.membershipErr = "";
    S.membershipBookingPaid = false;
    S.err = "";
    $("bk-ov").classList.add("open");
    D.body.style.overflow = "hidden";
    render();
    if (W.innerWidth <= 640) attachSwipe();
  }

  function attachSwipe() {
    const modal = $("bk-modal");
    if (!modal || modal._swipeAttached) return;
    modal._swipeAttached = true;
    let startY = 0;
    let curY = 0;
    let dragging = false;

    function onTouchStart(e) {
      const touch = e.touches[0];
      const rect = modal.getBoundingClientRect();
      if (touch.clientY - rect.top > 44) return;
      startY = touch.clientY;
      dragging = true;
      modal.style.transition = "none";
    }
    function onTouchMove(e) {
      if (!dragging) return;
      curY = e.touches[0].clientY;
      const dy = Math.max(0, curY - startY);
      modal.style.transform = "translateY(" + dy + "px)";
      const ov = $("bk-ov");
      if (ov)
        ov.style.background =
          "rgba(43,28,20," + Math.max(0, 0.45 - dy / 400) + ")";
    }
    function onTouchEnd() {
      if (!dragging) return;
      dragging = false;
      modal.style.transition = "";
      const dy = curY - startY;
      if (dy > 100) {
        modal.style.transform = "translateY(100%)";
        setTimeout(closeModal, 220);
      } else {
        modal.style.transform = "";
        const ov = $("bk-ov");
        if (ov) ov.style.background = "";
      }
    }
    modal.addEventListener("touchstart", onTouchStart, { passive: true });
    modal.addEventListener("touchmove", onTouchMove, { passive: true });
    modal.addEventListener("touchend", onTouchEnd);
  }

  function closeModal() {
    clearTimeout(S._membershipPollTimer);
    const modal = $("bk-modal");
    if (modal) {
      modal.style.transform = "";
      modal.style.transition = "";
      modal._swipeAttached = false;
    }
    const ov = $("bk-ov");
    if (ov) {
      ov.classList.remove("open");
      ov.style.background = "";
    }
    D.body.style.overflow = "";
  }

  W.MahaluBooking = { open: openModal, close: closeModal };

  function init() {
    injectModal();
    D.querySelectorAll("[data-mahalu-booking]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openModal();
      });
    });
  }

  if (D.readyState === "loading") {
    D.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
