/* =====================================================
   1. DIGITAL CLOCKS
   — Updates every second.
   — Nepal timezone: Asia/Kathmandu (UTC+5:45)
   — Local timezone: user's system timezone
===================================================== */

function formatTime(date, timezone) {
  // Returns a string like "02:34:15 PM"
  return date.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function updateClocks() {
  const now = new Date();

  // Nepal clock
  const nepalEl = document.getElementById("clock-nepal");
  if (nepalEl) nepalEl.textContent = formatTime(now, "Asia/Kathmandu");

  // User's local clock (browser detects timezone automatically)
  const localEl = document.getElementById("clock-local");
  if (localEl) {
    const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    localEl.textContent = formatTime(now, localTZ);
  }
}

// Run immediately, then repeat every 1 second
updateClocks();
setInterval(updateClocks, 1000);


/* =====================================================
   2. AUTO DARK / LIGHT MODE
   — Reads Nepal time (Kathmandu)
   — 06:00–17:59  →  Light mode
   — 18:00–05:59  →  Dark mode
   — Checks every minute in the background
===================================================== */

function getAutoTheme() {
  // Get the current hour in Nepal time (0–23 format)
  const ktmHourStr = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kathmandu",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(ktmHourStr, 10);
  // Light during daytime (6am – 5:59pm), dark otherwise
  return (hour >= 6 && hour < 18) ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("paru-theme", theme);
}

// On page load: check if user previously chose a theme, else use auto
function initTheme() {
  const saved = localStorage.getItem("paru-theme");
  applyTheme(saved || getAutoTheme());
}

initTheme();

// Re-check auto theme every minute (only if user hasn't manually toggled)
let userPickedTheme = !!localStorage.getItem("paru-theme");
setInterval(function () {
  if (!userPickedTheme) applyTheme(getAutoTheme());
}, 60 * 1000);


/* =====================================================
   3. MANUAL THEME TOGGLE BUTTON
===================================================== */

const themeBtn = document.getElementById("theme-toggle");

if (themeBtn) {
  themeBtn.addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme");
    const next = (current === "light") ? "dark" : "light";
    applyTheme(next);
    userPickedTheme = true; // stop auto-switching after manual choice
  });
}


/* =====================================================
   4. NAVBAR — add shadow on scroll
===================================================== */

const navbar = document.getElementById("navbar");

window.addEventListener("scroll", function () {
  if (window.scrollY > 20) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
}, { passive: true });


/* =====================================================
   5. ACTIVE NAV LINK
   — Highlights the nav link for the section
     currently visible in the viewport.
===================================================== */

const sections  = document.querySelectorAll("section[id]");
const navAnchors = document.querySelectorAll(".nav-links a");

function setActiveLink() {
  const navH    = navbar.offsetHeight;
  const clockH  = document.querySelector(".clocks-bar")?.offsetHeight || 38;
  const offset  = navH + clockH + 40; // a little breathing room

  let currentId = "";

  sections.forEach(function (section) {
    const top = section.getBoundingClientRect().top;
    if (top <= offset) {
      currentId = section.getAttribute("id");
    }
  });

  navAnchors.forEach(function (link) {
    link.classList.remove("active");
    // Each link href is like "#about" — compare to "about"
    if (link.getAttribute("href") === "#" + currentId) {
      link.classList.add("active");
    }
  });
}

window.addEventListener("scroll", setActiveLink, { passive: true });
// Run once on load in case the page is already scrolled
setActiveLink();


/* =====================================================
   6. HAMBURGER / MOBILE MENU
===================================================== */

const hamburger  = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");

if (hamburger) {
  hamburger.addEventListener("click", function () {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", isOpen);
  });
}

// Close menu when any mobile link is clicked
document.querySelectorAll(".mob-link").forEach(function (link) {
  link.addEventListener("click", function () {
    mobileMenu.classList.remove("open");
    hamburger.setAttribute("aria-expanded", false);
  });
});


/* =====================================================
   7. SCROLL REVEAL ANIMATION
   — Watches .reveal elements and adds .visible
     when they enter the viewport.
===================================================== */

const revealElements = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // only animate once
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach(function (el) {
  observer.observe(el);
});


/* =====================================================
   8. CONTACT FORM — AJAX submission via Formspree
   — Prevents page reload.
   — Shows success or error message below the form.
===================================================== */

const contactForm = document.getElementById("contact-form");
const formStatus  = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // stop normal form submission

    const submitBtn = contactForm.querySelector(".form-submit");
    submitBtn.textContent = "Sending…";
    submitBtn.disabled = true;

    try {
      const formData = new FormData(contactForm);
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        formStatus.textContent = "✓ Message sent! I'll get back to you soon.";
        formStatus.style.color = "var(--accent)";
        contactForm.reset();
      } else {
        formStatus.textContent = "Something went wrong. Please try again.";
        formStatus.style.color = "#c0392b";
      }
    } catch (err) {
      formStatus.textContent = "Network error. Please check your connection.";
      formStatus.style.color = "#c0392b";
    } finally {
      submitBtn.textContent = "Send Message ✈";
      submitBtn.disabled = false;
    }
  });
}


/* =====================================================
   9. FOOTER — auto-fill current year
===================================================== */

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* =====================================================
   10. SMOOTH SCROLL WITH OFFSET
   — Accounts for the fixed navbar + clock bar height
     so sections aren't hidden behind them when clicked.
===================================================== */

document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    const navH   = document.getElementById("navbar")?.offsetHeight || 64;
    const clockH = document.querySelector(".clocks-bar")?.offsetHeight || 38;
    const offset = navH + clockH + 16;

    const scrollTo = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: scrollTo, behavior: "smooth" });
  });
});
