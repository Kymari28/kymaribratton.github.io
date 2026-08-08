/* Kymari Bratton portfolio behaviour.
   Three small enhancements, all optional: the site is fully readable and
   navigable with JavaScript disabled or failed. */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Current year in the footer ---- */
  var yearNodes = document.querySelectorAll("[data-year]");
  var year = String(new Date().getFullYear());
  for (var i = 0; i < yearNodes.length; i++) {
    yearNodes[i].textContent = year;
  }

  /* ---- Sticky header gets a border + shadow once you scroll ---- */
  var topbar = document.querySelector("[data-topbar]");
  if (topbar) {
    var setStuck = function () {
      topbar.classList.toggle("is-stuck", window.scrollY > 8);
    };
    setStuck();
    window.addEventListener("scroll", setStuck, { passive: true });
  }

  /* ---- Reveal on scroll ----
     The hiding styles live behind .reveal-ready, which is only added here.
     If this script never runs, nothing is ever hidden. */
  var revealNodes = document.querySelectorAll("[data-reveal]");

  if (revealNodes.length && !prefersReducedMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-ready");

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealNodes.forEach(function (node) {
      observer.observe(node);
    });

    /* Safety net: if anything is still hidden after 2s (an observer that
       never fired, a very tall viewport), show everything. */
    window.setTimeout(function () {
      revealNodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
    }, 2000);
  }

  /* ---- Motion WIP: rotating role pill (ported from the original site) ----
     Static and fully readable if this never runs; only swaps text when
     motion is allowed. */
  var roleNode = document.querySelector("[data-role-rotator]");

  if (roleNode && !prefersReducedMotion) {
    var roles = (roleNode.dataset.roles || "")
      .split("|")
      .map(function (role) {
        return role.trim();
      })
      .filter(Boolean);

    if (roles.length > 1) {
      var roleIndex = 0;

      window.setInterval(function () {
        roleNode.classList.add("is-swapping");

        window.setTimeout(function () {
          roleIndex = (roleIndex + 1) % roles.length;
          roleNode.textContent = roles[roleIndex];
          roleNode.classList.remove("is-swapping");
        }, 220);
      }, 2600);
    }
  }
})();
