/* Kymari Bratton portfolio behaviour.
   Small progressive enhancements, all optional: the site is fully readable and
   navigable with JavaScript disabled or failed. */

(function () {
  "use strict";

  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReducedMotion = reducedMotionQuery.matches;

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

  /* ---- Project-stage pointer depth ----
     The approved card hover transforms stay on the picture wrappers. Pointer
     response lives only on the inner device images, so the card, copy, and
     existing project-specific choreography remain stable. */
  var projectStages = document.querySelectorAll(".project-stage");
  var finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (projectStages.length) {
    var depthResetters = [];
    var supportsPointerEvents = "PointerEvent" in window;
    var depthEnterEvent = supportsPointerEvents ? "pointerenter" : "mouseenter";
    var depthMoveEvent = supportsPointerEvents ? "pointermove" : "mousemove";
    var depthLeaveEvent = supportsPointerEvents ? "pointerleave" : "mouseleave";
    var depthEnabled = function () {
      return finePointerQuery.matches && !reducedMotionQuery.matches;
    };

    projectStages.forEach(function (stage) {
      var card = stage.closest(".project-card");
      var cardStyle = window.getComputedStyle(card);
      var readStrength = function (name, fallback) {
        var value = parseFloat(cardStyle.getPropertyValue(name));
        return Number.isFinite(value) ? value : fallback;
      };
      var strength = {
        primaryShift: readStrength("--depth-primary-shift", 1.75),
        secondaryShift: readStrength("--depth-secondary-shift", 3.25),
        primaryTilt: readStrength("--depth-primary-tilt", 1),
        secondaryTilt: readStrength("--depth-secondary-tilt", 1.5),
      };
      var bounds = null;
      var targetX = 0;
      var targetY = 0;
      var currentX = 0;
      var currentY = 0;
      var frameId = 0;

      var setDepth = function (x, y) {
        stage.style.setProperty("--depth-primary-x", (x * strength.primaryShift).toFixed(3) + "px");
        stage.style.setProperty("--depth-primary-y", (y * strength.primaryShift * 0.65).toFixed(3) + "px");
        stage.style.setProperty("--depth-primary-rx", (-y * strength.primaryTilt).toFixed(3) + "deg");
        stage.style.setProperty("--depth-primary-ry", (x * strength.primaryTilt).toFixed(3) + "deg");
        stage.style.setProperty("--depth-secondary-x", (x * strength.secondaryShift).toFixed(3) + "px");
        stage.style.setProperty("--depth-secondary-y", (y * strength.secondaryShift * 0.8).toFixed(3) + "px");
        stage.style.setProperty("--depth-secondary-rx", (-y * strength.secondaryTilt).toFixed(3) + "deg");
        stage.style.setProperty("--depth-secondary-ry", (x * strength.secondaryTilt).toFixed(3) + "deg");
      };

      var renderDepth = function () {
        if (!depthEnabled()) {
          frameId = 0;
          return;
        }

        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;

        var settled = Math.max(Math.abs(targetX - currentX), Math.abs(targetY - currentY)) < 0.002;
        if (settled) {
          currentX = targetX;
          currentY = targetY;
        }

        setDepth(currentX, currentY);

        if (settled) {
          frameId = 0;
          if (targetX === 0 && targetY === 0) {
            stage.classList.remove("is-depth-active");
          }
          return;
        }

        frameId = window.requestAnimationFrame(renderDepth);
      };

      var queueDepthFrame = function () {
        if (!frameId) {
          frameId = window.requestAnimationFrame(renderDepth);
        }
      };

      var resetDepth = function () {
        targetX = 0;
        targetY = 0;
        bounds = null;

        if (depthEnabled()) {
          queueDepthFrame();
          return;
        }

        if (frameId) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        }
        currentX = 0;
        currentY = 0;
        setDepth(0, 0);
        stage.classList.remove("is-depth-active");
      };

      stage.addEventListener(
        depthEnterEvent,
        function (event) {
          if (!depthEnabled() || event.pointerType === "touch") return;
          bounds = stage.getBoundingClientRect();
          stage.classList.add("is-depth-active");
        },
        { passive: true }
      );

      stage.addEventListener(
        depthMoveEvent,
        function (event) {
          if (!depthEnabled() || event.pointerType === "touch") return;
          if (!bounds) bounds = stage.getBoundingClientRect();

          targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
          targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
          stage.classList.add("is-depth-active");
          queueDepthFrame();
        },
        { passive: true }
      );

      stage.addEventListener(depthLeaveEvent, resetDepth, { passive: true });
      if (supportsPointerEvents) {
        stage.addEventListener("pointercancel", resetDepth, { passive: true });
      }
      depthResetters.push(resetDepth);
    });

    var resetAllProjectDepth = function () {
      depthResetters.forEach(function (resetDepth) {
        resetDepth();
      });
    };

    if ("addEventListener" in finePointerQuery) {
      finePointerQuery.addEventListener("change", resetAllProjectDepth);
      reducedMotionQuery.addEventListener("change", resetAllProjectDepth);
    } else {
      finePointerQuery.addListener(resetAllProjectDepth);
      reducedMotionQuery.addListener(resetAllProjectDepth);
    }
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
      }, 4200);
    }
  }
})();
