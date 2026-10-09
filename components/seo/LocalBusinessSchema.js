(function () {
  "use strict";

  const schema = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: "Mahalu Spa, Nail Art & Eyelash",
    image: "https://spa.mahalu.group/assets/logo/og-image.webp",
    url: "https://spa.mahalu.group/",
    potentialAction: {
      "@type": "ReserveAction",
      name: "Booking perawatan online",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://spa.mahalu.group/booking/",
        inLanguage: "id",
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
    },
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

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
})();
