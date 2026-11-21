/* Instituut Neuville · interactie */
(function () {
  "use strict";

  /* ---------- Header schaduw bij scrollen + sticky knop gsm ---------- */
  var header = document.querySelector(".site-header");
  var mobileCta = document.querySelector(".mobile-cta");
  var booking = document.getElementById("afspraak");

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 10);

    if (mobileCta && booking) {
      var b = booking.getBoundingClientRect();
      var inBooking = b.top < window.innerHeight && b.bottom > 0;
      mobileCta.classList.toggle("visible", y > 500 && !inBooking);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobiel menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("main-nav");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
  }
  toggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("open"));
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Actieve link in menu ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".main-nav ul a"));
  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) {
            l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (l) {
      var s = document.querySelector(l.getAttribute("href"));
      if (s) sectionObserver.observe(s);
    });
  }

  /* ---------- Scroll-animatie ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Prijslijst tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".price-tabs [role=tab]"));

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  // Klik op een behandeling opent meteen de juiste prijzen
  document.querySelectorAll(".treatment-card[data-tab]").forEach(function (card) {
    card.addEventListener("click", function () {
      var tab = document.getElementById("tab-" + card.dataset.tab);
      if (tab) selectTab(tab);
    });
  });

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbImg = lightbox.querySelector("img");
  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var current = 0;
  var lastFocus = null;

  function show(i) {
    current = (i + items.length) % items.length;
    var src = items[current].dataset.full;
    var alt = items[current].querySelector("img").alt;
    lbImg.src = src;
    lbImg.alt = alt;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".lightbox-close").focus();
  }
  function closeLb() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  items.forEach(function (item, i) {
    item.addEventListener("click", function () { openLb(i); });
  });
  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLb);
  lightbox.querySelector(".prev").addEventListener("click", function () { show(current - 1); });
  lightbox.querySelector(".next").addEventListener("click", function () { show(current + 1); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
  });
  // Vegen op gsm
  var touchX = null;
  lightbox.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Afspraakformulier ---------- */
  var form = document.getElementById("booking-form");
  var status = form.querySelector(".form-status");
  var dateInput = document.getElementById("datum");
  dateInput.min = new Date().toISOString().split("T")[0];

  var BOOKING_EMAIL = "info@neuville.com";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (el) {
      var valid = el.value.trim() !== "";
      el.closest(".field").classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    var email = document.getElementById("email");
    if (email.value && !email.checkValidity()) {
      email.closest(".field").classList.add("invalid");
      ok = false;
    }
    if (!ok) {
      status.className = "form-status error";
      status.textContent = "Vul de aangeduide velden nog in.";
      var first = form.querySelector(".invalid input, .invalid select");
      if (first) first.focus();
      return;
    }

    var d = new FormData(form);
    var body = [
      "Naam: " + d.get("naam"),
      "Telefoon: " + d.get("telefoon"),
      "E-mail: " + (d.get("email") || "-"),
      "Behandeling: " + d.get("behandeling"),
      "Voorkeursdatum: " + (d.get("datum") || "geen voorkeur"),
      "Voorkeursmoment: " + d.get("moment"),
      "",
      d.get("bericht") || ""
    ].join("\n");

    window.location.href = "mailto:" + BOOKING_EMAIL +
      "?subject=" + encodeURIComponent("Afspraakaanvraag – " + d.get("behandeling")) +
      "&body=" + encodeURIComponent(body);

    status.className = "form-status ok";
    status.textContent = "Bedankt! Je e-mailprogramma opent met je aanvraag. Verstuur die mail en we nemen snel contact op.";
  });

  form.addEventListener("input", function (e) {
    var f = e.target.closest(".field");
    if (f) f.classList.remove("invalid");
  });

  /* ---------- Jaartal ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
