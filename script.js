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

  /* ---- Pre-hide the GRC/Mindfulness GSAP hero entrance ----
     case-immersion.js drives this entrance, but it waits on two external
     GSAP CDN scripts to download before it can even run. Without this,
     the browser paints the hero fully visible first (default CSS), then
     case-immersion.js finally loads and snaps everything to invisible
     before tweening it back in, an out-of-order flash where the photo can
     look "done" while the title is still catching up. Adding this class
     here (a small local script, not a CDN fetch) hides the same elements
     immediately so GSAP's tween starts from a state that's already
     correct, and the fallback below guarantees they still show up if GSAP
     never loads at all. */
  var gsapHeroNodes = document.querySelectorAll("[data-gsap-hero]");
  if (gsapHeroNodes.length && !prefersReducedMotion) {
    document.documentElement.classList.add("gsap-hero-ready");
    window.setTimeout(function () {
      document.documentElement.classList.remove("gsap-hero-ready");
    }, 2500);
  }

  /* ---- Mindfulness with Desiree: Timeline + Challenge photo parallax ----
     Approved motion spec's one "static section allowed to use parallax":
     the real photo drifts a few px slower than the copy beside it while the
     section is in view. Plain scroll + rAF, no dependency, fully skipped
     under prefers-reduced-motion (the CSS also hard-disables the transition
     as a second safety net). Round 8: briefly removed on a hypothesis that
     this was making the photo look "edited"/grainy - Kymari asked for it
     back (the grain report turned out to be about the photo itself, not
     this), so it's restored here unchanged. */
  var challengeImg = document.querySelector(".mindfulness-challenge-media img");
  if (challengeImg && !prefersReducedMotion) {
    var challengeSection = challengeImg.closest(".mindfulness-challenge");
    var challengeTicking = false;
    var updateChallengeParallax = function () {
      challengeTicking = false;
      var rect = challengeSection.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom < 0 || rect.top > vh) {
        return;
      }
      var progress = (vh - rect.top) / (vh + rect.height);
      var drift = (progress - 0.5) * 26;
      challengeImg.style.transform = "translateY(" + drift.toFixed(1) + "px)";
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!challengeTicking) {
          challengeTicking = true;
          window.requestAnimationFrame(updateChallengeParallax);
        }
      },
      { passive: true }
    );
    updateChallengeParallax();
  }

  /* ---- Work with me: hero glow drift on scroll ----
     Same plain scroll + rAF approach as the Mindfulness parallax above,
     fully skipped under prefers-reduced-motion. The selector only exists
     on the work-with-me page, so this safely no-ops everywhere else. */
  var heroGlow = document.querySelector(".contact-hero--glow");
  if (heroGlow && !prefersReducedMotion) {
    var glowTicking = false;
    var updateGlow = function () {
      glowTicking = false;
      var rect = heroGlow.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom < 0 || rect.top > vh) {
        return;
      }
      var progress = (vh - rect.top) / (vh + rect.height);
      var shift = (progress - 0.5) * 40;
      heroGlow.style.setProperty("--glow-shift-a", shift.toFixed(1) + "px");
      heroGlow.style.setProperty("--glow-shift-b", (-shift * 0.7).toFixed(1) + "px");
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!glowTicking) {
          glowTicking = true;
          window.requestAnimationFrame(updateGlow);
        }
      },
      { passive: true }
    );
    updateGlow();
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

  /* ---- Project entry transition: Match & Move Entry System ----
     One configurable controller, two families (motion/responsive handoff
     §3.1/§4.1) instead of bespoke per-project transitions:

       interface-led (Gateway Regional Council): the real screenshot is the
       only thing that moves. It is never cropped and never fills the
       viewport — it settles into the real framed rect inside the
       destination hero. That rect can only be measured on the destination
       page itself (the two case studies don't share a layout engine across
       navigations), so the departure side plays a modest, non-full-bleed
       push and the arrival side does the precise part: it measures the
       real `.subpage-frame` the instant the destination page has laid out,
       and eases the veil down onto that exact rect before dissolving.

       media-led (Mindfulness with Desiree, default for every other
       project): the real photo crops open toward full-bleed, exactly as
       this system worked before this rewrite.

     A future project's entry is added by giving it a family and an accent
     pair below, not by writing new transition code — see
     PROJECT_ENTRY_FAMILY / PROJECT_ENTRY_ACCENTS.

     Entirely additive: without JS, with sessionStorage blocked, or with
     prefers-reduced-motion, every project link behaves like a normal link
     for navigation purposes. prefers-reduced-motion still gets a same-
     composition crossfade (no transform) at the tokened reduced duration,
     never nothing at all, never a lingering dissolve. */
  var PROJECT_ENTRY_ACCENTS = {
    gateway: ["#4c6329", "#d68033"],
    mindfulness: ["#354a36", "#ead6a4"],
    "24seven": ["#2b1a1d", "#f2c66f"],
    brightside: ["#123238", "#a9eee6"],
    "immigrants-rising": ["#0b2b49", "#ffd1a3"],
    triptag: ["#2c4f3f", "#f0ae63"],
    "we-are-one": ["#4d1f2b", "#ffd48b"],
  };
  var PROJECT_ENTRY_FAMILY = {
    gateway: "interface-led",
    mindfulness: "media-led",
  };
  var PROJECT_ENTRY_KEY = "kb-enter-transition";
  var PROJECT_WASH_EASE = "cubic-bezier(0.6, 0, 0.9, 0.2)"; /* back-loaded: color arrives in the final stretch, not evenly */

  /* Design tokens from styles.css §4.7, mirrored here since inline-style
     transitions need numeric ms/easing strings, not custom properties. */
  var ENTRY_TOKENS = {
    "interface-led": {
      desktop: 760,
      tablet: 650,
      mobile: 450,
      ease: "cubic-bezier(0.65, 0, 0.35, 1)",
      reduced: 130,
    },
    "media-led": {
      desktop: 840,
      tablet: 720,
      mobile: 520,
      ease: "cubic-bezier(0.22, 1, 0.36, 1)", // PROJECT_ZOOM_EASE
      reduced: 150,
    },
  };

  var getEntryBreakpoint = function () {
    if (window.matchMedia("(max-width: 640px), (pointer: coarse)").matches) return "mobile";
    if (window.matchMedia("(max-width: 1024px)").matches) return "tablet";
    return "desktop";
  };

  var getProjectEntryVeil = function () {
    var veil = document.getElementById("page-transition-veil");
    if (!veil) {
      veil = document.createElement("div");
      veil.id = "page-transition-veil";
      veil.setAttribute("aria-hidden", "true");

      var wash = document.createElement("div");
      wash.id = "page-transition-wash";

      var image = document.createElement("div");
      image.id = "page-transition-image";

      veil.appendChild(wash);
      veil.appendChild(image);
      document.body.appendChild(veil);
    }
    return veil;
  };

  var projectEntryLinks = document.querySelectorAll(".project-stage-link");

  projectEntryLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var card = link.closest(".project-card");
      var slug = card ? card.getAttribute("data-project") : null;
      var colors = slug ? PROJECT_ENTRY_ACCENTS[slug] : null;
      var thumb = card && (card.querySelector(".project-media--primary img") || card.querySelector(".project-stage img"));
      if (!colors || !thumb) return;

      event.preventDefault();
      var href = link.href;
      var family = (slug && PROJECT_ENTRY_FAMILY[slug]) || "media-led";
      var tokens = ENTRY_TOKENS[family];
      var breakpoint = getEntryBreakpoint();

      try {
        sessionStorage.setItem(
          PROJECT_ENTRY_KEY,
          JSON.stringify({
            src: thumb.currentSrc || thumb.src,
            c1: colors[0],
            c2: colors[1],
            t: Date.now(),
            family: family,
            breakpoint: breakpoint,
          })
        );
      } catch (e) {}

      if (prefersReducedMotion) {
        /* Same-composition crossfade, no transform: a brief color+image
           flash rather than a plain instant jump, then navigate. */
        var reducedVeil = getProjectEntryVeil();
        var reducedWash = document.getElementById("page-transition-wash");
        reducedVeil.style.transition = "none";
        reducedVeil.style.display = "block";
        reducedVeil.style.opacity = "0";
        reducedWash.style.transition = "none";
        reducedWash.style.background = "linear-gradient(135deg, " + colors[0] + ", " + colors[1] + ")";
        reducedWash.style.opacity = "1";
        document.getElementById("page-transition-image").style.opacity = "0";
        reducedVeil.getBoundingClientRect();
        window.requestAnimationFrame(function () {
          reducedVeil.style.transition = "opacity " + tokens.reduced + "ms ease";
          reducedVeil.style.opacity = "1";
        });
        window.setTimeout(function () {
          window.location.href = href;
        }, tokens.reduced);
        return;
      }

      var rect = thumb.getBoundingClientRect();
      var durationMs = tokens[breakpoint];
      var washMs = Math.round(durationMs * (family === "interface-led" ? 0.6 : 0.65));
      var navDelay = Math.round(durationMs * (family === "interface-led" ? 0.35 : 0.3));

      var veil = getProjectEntryVeil();
      var wash = document.getElementById("page-transition-wash");
      var image = document.getElementById("page-transition-image");

      veil.style.display = "block";
      veil.style.opacity = "1";
      wash.style.transition = "none";
      wash.style.background = "linear-gradient(135deg, " + colors[0] + ", " + colors[1] + ")";
      wash.style.opacity = "0";
      image.style.transition = "none";
      image.style.backgroundImage = "url('" + (thumb.currentSrc || thumb.src) + "')";
      image.style.top = rect.top + "px";
      image.style.left = rect.left + "px";
      image.style.width = rect.width + "px";
      image.style.height = rect.height + "px";
      image.style.transformOrigin = "center center";
      image.style.transform = "translate(0px, 0px) scale(1)";
      image.style.opacity = "1";

      veil.getBoundingClientRect();

      var boxCenterX = rect.left + rect.width / 2;
      var boxCenterY = rect.top + rect.height / 2;

      window.requestAnimationFrame(function () {
        image.style.transition = "transform " + durationMs + "ms " + tokens.ease;
        wash.style.transition = "opacity " + washMs + "ms " + PROJECT_WASH_EASE;
        wash.style.opacity = "0.5";

        if (family === "media-led") {
          /* Uniform scale only (never non-uniform X/Y), so the photo crops
             to fill the viewport like a lens pushing in rather than
             stretching. */
          var scale = Math.max(window.innerWidth / rect.width, window.innerHeight / rect.height) * 1.02;
          var dx = window.innerWidth / 2 - boxCenterX;
          var dy = window.innerHeight / 2 - boxCenterY;
          image.style.transform = "translate(" + dx + "px, " + dy + "px) scale(" + scale + ")";
        } else {
          /* interface-led departure: a modest, deliberately non-full-bleed
             push toward the upper-right of the viewport (roughly where the
             framed hero panel will sit) — the precise "stays framed" match
             happens on arrival, once the real rect exists to measure. */
          var modestScale = breakpoint === "mobile" ? 1.08 : 1.32;
          var targetCenterX = breakpoint === "mobile" ? window.innerWidth / 2 : window.innerWidth * 0.62;
          var targetCenterY = window.innerHeight * (breakpoint === "mobile" ? 0.38 : 0.46);
          var idx = targetCenterX - boxCenterX;
          var idy = targetCenterY - boxCenterY;
          image.style.transform = "translate(" + idx + "px, " + idy + "px) scale(" + modestScale + ")";
        }
      });

      /* Navigate before the push finishes (real page-load latency overlaps
         with the tail of the motion) rather than waiting the full duration
         out, so click-to-next-page time is the nav delay, not the full
         decorative animation. */
      window.setTimeout(function () {
        window.location.href = href;
      }, navDelay);
    });
  });

  var rawEntryTransition;
  try {
    rawEntryTransition = sessionStorage.getItem(PROJECT_ENTRY_KEY);
  } catch (e) {}

  if (rawEntryTransition) {
    try {
      sessionStorage.removeItem(PROJECT_ENTRY_KEY);
    } catch (e) {}

    var entryData = null;
    try {
      entryData = JSON.parse(rawEntryTransition);
    } catch (e) {}

    if (entryData && Date.now() - entryData.t < 4000) {
      var entryFamily = entryData.family === "interface-led" ? "interface-led" : "media-led";
      var entryTokens = ENTRY_TOKENS[entryFamily];
      var entryBreakpoint = entryData.breakpoint || getEntryBreakpoint();

      var entrySeam = document.getElementById("page-transition-seam");

      if (prefersReducedMotion) {
        /* The seam script itself already bails out under reduced motion
           (see the inline <head> snippet), so there is nothing painted to
           dissolve — just make sure no seam/veil is left behind. */
        if (entrySeam && entrySeam.parentNode) entrySeam.parentNode.removeChild(entrySeam);
      } else {
        var arrivalVeil = getProjectEntryVeil();
        var arrivalWash = document.getElementById("page-transition-wash");
        var arrivalImage = document.getElementById("page-transition-image");
        var arrivalDuration = entryTokens[entryBreakpoint];
        var holdMs = entryBreakpoint === "mobile" ? 40 : 90;
        var dissolveMs = entryBreakpoint === "mobile" ? 220 : 340;

        arrivalVeil.style.transition = "none";
        arrivalVeil.style.display = "block";
        arrivalVeil.style.opacity = "1";
        arrivalWash.style.transition = "none";
        arrivalWash.style.background = "linear-gradient(135deg, " + entryData.c1 + ", " + entryData.c2 + ")";
        arrivalWash.style.opacity = "0.5";
        arrivalImage.style.transition = "none";
        arrivalImage.style.transformOrigin = "center center";
        arrivalImage.style.opacity = "1";

        var cleanupArrivalVeil = function () {
          arrivalVeil.style.display = "none";
          arrivalImage.style.backgroundImage = "";
        };

        if (entryFamily === "media-led") {
          /* Already mid-push, filling the screen: matches where the seam
             (painted synchronously in <head>, before this script could
             even run) left off, so there is no visible restart. */
          arrivalImage.style.backgroundImage = "url('" + entryData.src + "')";
          arrivalImage.style.backgroundSize = "cover";
          arrivalImage.style.top = "0px";
          arrivalImage.style.left = "0px";
          arrivalImage.style.width = window.innerWidth + "px";
          arrivalImage.style.height = window.innerHeight + "px";
          arrivalImage.style.transform = "scale(1)";

          if (entrySeam && entrySeam.parentNode) entrySeam.parentNode.removeChild(entrySeam);

          var revealMediaLed = function () {
            arrivalWash.style.transition = "opacity " + dissolveMs + "ms ease";
            arrivalImage.style.transition =
              "opacity " + dissolveMs + "ms ease, transform " + (dissolveMs + 120) + "ms " + entryTokens.ease;
            arrivalImage.style.transform = "scale(1.035)";
            arrivalImage.style.opacity = "0";
            arrivalWash.style.opacity = "0";
            window.setTimeout(cleanupArrivalVeil, dissolveMs + 140);
          };

          arrivalVeil.getBoundingClientRect();
          window.setTimeout(revealMediaLed, holdMs);
        } else {
          /* interface-led arrival: the seam painted a plain color wash
             (no image — see the family-aware <head> snippet), so start the
             veil's image element at a large centered box that already
             matches the real screenshot's aspect ratio (no crop, ever),
             then transform it down onto the real, live-measured hero frame
             rect before dissolving to reveal the actual DOM underneath. */
          var img = new Image();
          img.onload = function () {
            var naturalAspect = img.naturalWidth / img.naturalHeight || 1.6;
            var startHeight = window.innerHeight * (entryBreakpoint === "mobile" ? 0.62 : 0.86);
            var startWidth = startHeight * naturalAspect;
            var startTop = window.innerHeight * (entryBreakpoint === "mobile" ? 0.16 : 0.07);
            var startLeft = (window.innerWidth - startWidth) / 2;

            arrivalImage.style.backgroundImage = "url('" + entryData.src + "')";
            arrivalImage.style.backgroundSize = "contain";
            arrivalImage.style.backgroundRepeat = "no-repeat";
            arrivalImage.style.top = startTop + "px";
            arrivalImage.style.left = startLeft + "px";
            arrivalImage.style.width = startWidth + "px";
            arrivalImage.style.height = startHeight + "px";
            arrivalImage.style.transform = "scale(1)";

            var frameEl = document.querySelector("[data-gsap-hero-visual] .subpage-frame");
            var frameRect = frameEl ? frameEl.getBoundingClientRect() : null;

            arrivalVeil.getBoundingClientRect();

            var settleAndReveal = function () {
              if (frameRect && frameRect.width > 0) {
                var startCenterX = startLeft + startWidth / 2;
                var startCenterY = startTop + startHeight / 2;
                var frameCenterX = frameRect.left + frameRect.width / 2;
                var frameCenterY = frameRect.top + frameRect.height / 2;
                var frameScale = frameRect.width / startWidth;
                var fdx = frameCenterX - startCenterX;
                var fdy = frameCenterY - startCenterY;

                arrivalImage.style.transition = "transform " + arrivalDuration + "ms " + entryTokens.ease;
                arrivalWash.style.transition = "opacity " + Math.round(arrivalDuration * 0.6) + "ms " + PROJECT_WASH_EASE;
                arrivalImage.style.transform =
                  "translate(" + fdx + "px, " + fdy + "px) scale(" + frameScale + ")";
                arrivalWash.style.opacity = "0.32";
              }

              window.setTimeout(function () {
                arrivalWash.style.transition = "opacity " + dissolveMs + "ms ease";
                arrivalImage.style.transition = "opacity " + dissolveMs + "ms ease";
                arrivalImage.style.opacity = "0";
                arrivalWash.style.opacity = "0";
                window.setTimeout(cleanupArrivalVeil, dissolveMs + 140);
              }, arrivalDuration + holdMs);
            };

            window.setTimeout(settleAndReveal, 20);
          };
          img.onerror = function () {
            arrivalVeil.style.transition = "opacity 200ms ease";
            arrivalVeil.style.opacity = "0";
            window.setTimeout(cleanupArrivalVeil, 220);
          };
          img.src = entryData.src;

          if (entrySeam && entrySeam.parentNode) entrySeam.parentNode.removeChild(entrySeam);
        }
      }
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

  /* ---- Count-up on scroll: a single stat animates from 0 to its real
     value once, then stops. Reduced motion (or no IntersectionObserver)
     jumps straight to the final text, which is what the element already
     shows in the markup, so nothing is ever missing. ---- */
  var countNodes = document.querySelectorAll("[data-count-to]");

  if (countNodes.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      /* Final value is already the element's textContent in the HTML;
         no-op. */
    } else {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              return;
            }

            countObserver.unobserve(entry.target);

            var node = entry.target;
            var target = parseFloat(node.dataset.countTo);
            var prefix = node.dataset.countPrefix || "";
            var suffix = node.dataset.countSuffix || "";
            var decimals = node.dataset.countDecimals
              ? parseInt(node.dataset.countDecimals, 10)
              : 0;

            if (!Number.isFinite(target)) {
              return;
            }

            var duration = 900;
            var start = null;
            var format = function (value) {
              return value.toLocaleString("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              });
            };

            var step = function (timestamp) {
              if (start === null) {
                start = timestamp;
              }

              var progress = Math.min((timestamp - start) / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              var value = target * eased;

              node.textContent = prefix + format(value) + suffix;

              if (progress < 1) {
                window.requestAnimationFrame(step);
              } else {
                node.textContent = prefix + format(target) + suffix;
              }
            };

            window.requestAnimationFrame(step);
          });
        },
        { threshold: 0.4 }
      );

      countNodes.forEach(function (node) {
        countObserver.observe(node);
      });
    }
  }

  /* ---- GRC Impact chart (case-study/gateway-regional-council only) ----
     A restyled port of the real interactive chart from GRC's live Impact
     page, six categories deep. The Wix embed's Google Sheets sync and
     parent postMessage code is intentionally not carried over: this is a
     static recreation using the product's own real fallback data, not a
     live connection to it. */
  var gatewayImpactSvg = document.getElementById("gatewayImpactSvg");

  if (gatewayImpactSvg) {
    var gatewayImpactMobile = document.getElementById("gatewayImpactMobile");
    var gatewayImpactTotal = document.getElementById("gatewayImpactTotal");
    var gatewayImpactTotalLabel = document.getElementById(
      "gatewayImpactTotalLabel"
    );
    var gatewayImpactChartTitle = document.getElementById(
      "gatewayImpactChartTitle"
    );
    var gatewayImpactCaption = document.getElementById("gatewayImpactCaption");
    var gatewayImpactTabs = Array.prototype.slice.call(
      document.querySelectorAll(".gateway-impact-tab")
    );

    var GATEWAY_IMPACT_VIEWS = {
      funding: {
        total: "$3.815M",
        totalLabel: "Funding secured for clients",
        title: "Funding Secured for Clients, 2020–2025",
        axisLabel: "Funding secured",
        format: "currency",
        maxValue: 2000000,
        steps: 4,
        mutedColor: "rgba(85, 147, 187, 0.25)",
        highlightColor: "#5593bb",
        highlightYear: "2022",
        highlightLabel: "Highest year",
        caption:
          "GRC secured $3.815 million for clients over six years, with funding in every reporting year. 2022 was the highest year at $1.5 million.",
        data: [
          { year: "2020", value: 150000 },
          { year: "2021", value: 450000 },
          { year: "2022", value: 1500000 },
          { year: "2023", value: 875000 },
          { year: "2024", value: 350000 },
          { year: "2025", value: 490000 },
        ],
      },
      residents: {
        total: "10,200",
        totalLabel: "Residents engaged",
        title: "Residents Engaged, 2020–2025",
        axisLabel: "Residents engaged",
        format: "number",
        maxValue: 4000,
        steps: 4,
        mutedColor: "rgba(116, 140, 41, 0.25)",
        highlightColor: "#748c29",
        highlightYear: "2025",
        highlightLabel: "Highest year",
        caption:
          "Annual resident engagement increased from 350 in 2020 to 3,500 in 2025.",
        data: [
          { year: "2020", value: 350 },
          { year: "2021", value: 700 },
          { year: "2022", value: 1200 },
          { year: "2023", value: 1850 },
          { year: "2024", value: 2600 },
          { year: "2025", value: 3500 },
        ],
      },
      assistance: {
        total: "5,680",
        totalLabel: "Technical assistance hours",
        title: "Technical Assistance Hours, 2020–2025",
        axisLabel: "Technical assistance hours",
        format: "number",
        maxValue: 2000,
        steps: 4,
        mutedColor: "rgba(201, 154, 30, 0.25)",
        highlightColor: "#c99a1e",
        highlightYear: "2025",
        highlightLabel: "Highest year",
        caption:
          "Technical assistance increased from 250 hours in 2020 to 1,800 hours in 2025.",
        data: [
          { year: "2020", value: 250 },
          { year: "2021", value: 480 },
          { year: "2022", value: 725 },
          { year: "2023", value: 1050 },
          { year: "2024", value: 1375 },
          { year: "2025", value: 1800 },
        ],
      },
      partnerships: {
        total: "196",
        totalLabel: "Partnerships established",
        title: "Partnerships Established, 2020–2025",
        axisLabel: "Partnerships established",
        format: "number",
        maxValue: 80,
        steps: 4,
        mutedColor: "rgba(107, 102, 173, 0.25)",
        highlightColor: "#6b66ad",
        highlightYear: "2025",
        highlightLabel: "Highest year",
        caption:
          "Annual partnership activity increased from 10 partnerships in 2020 to 60 in 2025.",
        data: [
          { year: "2020", value: 10 },
          { year: "2021", value: 18 },
          { year: "2022", value: 25 },
          { year: "2023", value: 35 },
          { year: "2024", value: 48 },
          { year: "2025", value: 60 },
        ],
      },
      coaching: {
        total: "145",
        totalLabel: "Executive coaching sessions",
        title: "Executive Coaching Sessions, 2020–2025",
        axisLabel: "Executive coaching sessions",
        format: "number",
        maxValue: 40,
        steps: 4,
        mutedColor: "rgba(214, 128, 51, 0.25)",
        highlightColor: "#d68033",
        highlightYear: "2025",
        highlightLabel: "Highest year",
        caption:
          "GRC delivered 145 executive coaching sessions over six years, including 31 in 2025, the highest annual total in the reporting period.",
        data: [
          { year: "2020", value: 25 },
          { year: "2021", value: 14 },
          { year: "2022", value: 22 },
          { year: "2023", value: 25 },
          { year: "2024", value: 28 },
          { year: "2025", value: 31 },
        ],
      },
      organizations: {
        total: "131",
        totalLabel: "Organizations served",
        title: "Organizations Served, 2020–2025",
        axisLabel: "Organizations served",
        format: "number",
        maxValue: 40,
        steps: 4,
        mutedColor: "rgba(85, 147, 187, 0.25)",
        highlightColor: "#5593bb",
        highlightYear: "2025",
        highlightLabel: "Highest year",
        caption:
          "Annual organizations served increased from 8 in 2020 to 38 in 2025.",
        data: [
          { year: "2020", value: 8 },
          { year: "2021", value: 12 },
          { year: "2022", value: 18 },
          { year: "2023", value: 24 },
          { year: "2024", value: 31 },
          { year: "2025", value: 38 },
        ],
      },
    };

    var formatGatewayFull = function (value, format) {
      if (format === "currency") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(value);
      }
      return new Intl.NumberFormat("en-US").format(value);
    };

    var formatGatewayCompact = function (value, format) {
      if (format === "currency") {
        if (value === 0) return "$0";
        if (value >= 1000000) {
          var millions = value / 1000000;
          return (
            "$" + millions.toFixed(Number.isInteger(millions) ? 0 : 1) + "M"
          );
        }
        if (value >= 1000) return "$" + Math.round(value / 1000) + "K";
        return "$" + value;
      }
      return new Intl.NumberFormat("en-US").format(value);
    };

    var gatewayImpactDescription = function (view) {
      return view.data
        .map(function (item) {
          return item.year + ": " + formatGatewayFull(item.value, view.format);
        })
        .join(", ");
    };

    var gatewayImpactYPos = function (value, maxValue, top, chartHeight) {
      return top + chartHeight - (value / maxValue) * chartHeight;
    };

    var renderGatewayDesktopChart = function (view) {
      var width = 820;
      var height = 440;
      var marginTop = 50;
      var marginRight = 18;
      var marginBottom = 56;
      var marginLeft = 90;
      var chartWidth = width - marginLeft - marginRight;
      var chartHeight = height - marginTop - marginBottom;
      var barGap = 15;
      var barWidth = chartWidth / view.data.length - barGap;
      var description = gatewayImpactDescription(view);

      var html =
        '<text class="gateway-impact-axis-unit" x="' +
        marginLeft +
        '" y="19">' +
        view.axisLabel +
        "</text>";

      for (var step = 0; step <= view.steps; step++) {
        var stepValue = (view.maxValue / view.steps) * step;
        var y = gatewayImpactYPos(stepValue, view.maxValue, marginTop, chartHeight);

        html +=
          '<line class="' +
          (stepValue === 0
            ? "gateway-impact-baseline"
            : "gateway-impact-grid-line") +
          '" x1="' +
          marginLeft +
          '" y1="' +
          y +
          '" x2="' +
          (width - marginRight) +
          '" y2="' +
          y +
          '"></line>' +
          '<text class="gateway-impact-axis-label" x="' +
          (marginLeft - 12) +
          '" y="' +
          (y + 4) +
          '" text-anchor="end">' +
          formatGatewayCompact(stepValue, view.format) +
          "</text>";
      }

      view.data.forEach(function (item, index) {
        var x = marginLeft + index * (barWidth + barGap);
        var barY = gatewayImpactYPos(item.value, view.maxValue, marginTop, chartHeight);
        var barHeight = marginTop + chartHeight - barY;
        var isHighlight = item.year === view.highlightYear;
        var barColor = isHighlight ? view.highlightColor : view.mutedColor;

        if (isHighlight) {
          html +=
            '<text class="gateway-impact-highlight-label" x="' +
            (x + barWidth / 2) +
            '" y="' +
            Math.max(17, barY - 29) +
            '">' +
            view.highlightLabel +
            "</text>";
        }

        html +=
          '<rect class="gateway-impact-bar" x="' +
          x +
          '" y="' +
          barY +
          '" width="' +
          barWidth +
          '" height="' +
          barHeight +
          '" rx="7" ry="7" fill="' +
          barColor +
          '" style="animation-delay: ' +
          index * 45 +
          'ms"><title>' +
          item.year +
          ": " +
          formatGatewayFull(item.value, view.format) +
          "</title></rect>" +
          '<text class="gateway-impact-value-label' +
          (isHighlight ? " is-highlight" : "") +
          '" x="' +
          (x + barWidth / 2) +
          '" y="' +
          Math.max(marginTop + 13, barY - 9) +
          '">' +
          formatGatewayFull(item.value, view.format) +
          "</text>" +
          '<text class="gateway-impact-year-label' +
          (isHighlight ? " is-highlight" : "") +
          '" x="' +
          (x + barWidth / 2) +
          '" y="' +
          (marginTop + chartHeight + 30) +
          '">' +
          item.year +
          "</text>";
      });

      gatewayImpactSvg.innerHTML = html;
      gatewayImpactSvg.setAttribute(
        "aria-label",
        view.title + ". " + description
      );
    };

    var renderGatewayMobileChart = function (view) {
      var highest = Math.max.apply(
        null,
        view.data.map(function (item) {
          return item.value;
        })
      );
      var description = gatewayImpactDescription(view);

      var rows = view.data
        .map(function (item) {
          var percentage = (item.value / highest) * 100;
          var visualPercentage = Math.max(percentage, 4);
          var isHighlight = item.year === view.highlightYear;
          var barColor = isHighlight ? view.highlightColor : view.mutedColor;

          return (
            '<div class="gateway-impact-mobile-row' +
            (isHighlight ? " is-highlight" : "") +
            '" aria-label="' +
            item.year +
            ": " +
            formatGatewayFull(item.value, view.format) +
            '">' +
            '<div class="gateway-impact-mobile-heading">' +
            '<span class="gateway-impact-mobile-year">' +
            item.year +
            "</span>" +
            '<span class="gateway-impact-mobile-value">' +
            formatGatewayCompact(item.value, view.format) +
            "</span>" +
            "</div>" +
            '<div class="gateway-impact-mobile-track" aria-hidden="true">' +
            '<div class="gateway-impact-mobile-bar" style="width: ' +
            visualPercentage +
            "%; background: " +
            barColor +
            ';"></div>' +
            "</div>" +
            (isHighlight
              ? '<div class="gateway-impact-mobile-note">' +
                view.highlightLabel +
                "</div>"
              : "") +
            "</div>"
          );
        })
        .join("");

      gatewayImpactMobile.innerHTML =
        '<div class="gateway-impact-mobile-list">' + rows + "</div>";
      gatewayImpactMobile.setAttribute(
        "aria-label",
        view.title + ". " + description
      );
    };

    var selectGatewayImpactView = function (key) {
      var view = GATEWAY_IMPACT_VIEWS[key];
      if (!view) return;

      gatewayImpactTotal.textContent = view.total;
      gatewayImpactTotalLabel.textContent = view.totalLabel;
      gatewayImpactChartTitle.textContent = view.title;
      gatewayImpactCaption.textContent = view.caption;

      gatewayImpactTabs.forEach(function (tab) {
        var isActive = tab.dataset.impactKey === key;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });

      renderGatewayDesktopChart(view);
      renderGatewayMobileChart(view);
    };

    gatewayImpactTabs.forEach(function (tab, tabIndex) {
      tab.addEventListener("click", function () {
        selectGatewayImpactView(tab.dataset.impactKey);
      });

      tab.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();

        var direction = event.key === "ArrowRight" ? 1 : -1;
        var nextIndex =
          (tabIndex + direction + gatewayImpactTabs.length) %
          gatewayImpactTabs.length;

        gatewayImpactTabs[nextIndex].focus();
        selectGatewayImpactView(gatewayImpactTabs[nextIndex].dataset.impactKey);
      });
    });

    /* No initial render call: the HTML already contains the Funding view
       fully rendered (chart, tabs, total, caption) so the section is
       correct and visible even if this script never runs. Tab clicks and
       arrow-key navigation, wired above, are what JS adds on top. */
  }
})();
