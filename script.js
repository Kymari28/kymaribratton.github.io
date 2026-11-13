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

  /* ---- About: slow travel-photo loop with an explicit motion control ---- */
  var travelMarquee = document.querySelector("[data-travel-marquee]");
  var travelMotionToggle = document.querySelector("[data-travel-motion-toggle]");
  if (travelMarquee && travelMotionToggle) {
    travelMotionToggle.addEventListener("click", function () {
      var isPaused = travelMarquee.classList.toggle("is-paused");
      travelMotionToggle.setAttribute("aria-pressed", String(isPaused));
      travelMotionToggle.textContent = isPaused ? "Play photos" : "Pause photos";
    });
  }

  /* ---- Reveal on scroll ----
     The hiding styles live behind .reveal-ready, which is only added here.
     If this script never runs, nothing is ever hidden.

     Load-aware: anything already on screen when this script runs is only
     animated if the page arrived quickly and no browser page transition is
     handling the entrance. On a slow connection the visitor has already been
     reading that content, so it stays put instead of vanishing and fading
     back in. Content further down still reveals as it scrolls into view. */
  var revealNodes = document.querySelectorAll("[data-reveal]");

  if (revealNodes.length && !prefersReducedMotion && "IntersectionObserver" in window) {
    var arrivedFromSite = false;
    try {
      arrivedFromSite = !!document.referrer && new URL(document.referrer).origin === window.location.origin;
    } catch (e) {}
    var nativeTransitionLikely = arrivedFromSite && "onpagereveal" in window;
    var loadedSlowly = window.performance && performance.now() > 900;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    if (nativeTransitionLikely || loadedSlowly) {
      revealNodes.forEach(function (node) {
        var rect = node.getBoundingClientRect();
        if (rect.top < viewportHeight && rect.bottom > 0) {
          node.classList.add("is-visible", "is-instant");
        }
      });
    }

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
      /* threshold 0 + a bottom margin, rather than a percentage, so very
         tall blocks still reveal as soon as their top edge is in view. */
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );

    revealNodes.forEach(function (node) {
      /* A wrapper flattened with display: contents (phone hero reordering)
         has no box to observe, so it is shown straight away. */
      if (getComputedStyle(node).display === "contents") {
        node.classList.add("is-visible");
        return;
      }
      if (!node.classList.contains("is-visible")) {
        observer.observe(node);
      }
    });

    /* Back/forward cache: a restored page is already fully revealed, so
       there is nothing to replay and nothing should be re-hidden. */
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        revealNodes.forEach(function (node) {
          node.classList.add("is-visible", "is-instant");
        });
      }
    });
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

  /* ---- Project entry transition ----
     Uses the browser's own cross-document View Transitions (opted into in
     styles.css). On click, the project's image is tagged so it can glide
     into the case-study hero. Navigation happens immediately, exactly like
     a normal link: nothing is covered, nothing waits on images or
     timers, and browsers without support simply load the next page. */
  var projectEntryLinks = document.querySelectorAll(".project-stage-link");

  projectEntryLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      projectEntryLinks.forEach(function (other) {
        var otherStage = other.querySelector(".project-stage");
        if (otherStage) otherStage.style.viewTransitionName = "";
      });
      var stage = link.querySelector(".project-stage");
      if (stage) stage.style.viewTransitionName = "project-hero";
    });
  });

  /* If the browser skips a transition (for example the next page is still
     loading on a slow connection), the page just loads normally. Mark that
     as handled so it doesn't show up as a console error. */
  var quietTransition = function (event) {
    var transition = event.viewTransition;
    if (!transition) return;
    transition.ready.catch(function () {});
    transition.finished.catch(function () {});
    if (transition.updateCallbackDone) transition.updateCallbackDone.catch(function () {});
  };
  window.addEventListener("pageswap", quietTransition);
  window.addEventListener("pagereveal", quietTransition);

  /* Coming back to the homepage, clear the tag so a later click starts
     fresh (the restored page can come from the back/forward cache). */
  window.addEventListener("pageshow", function () {
    projectEntryLinks.forEach(function (link) {
      var stage = link.querySelector(".project-stage");
      if (stage) stage.style.viewTransitionName = "";
    });
  });

  /* ---- "Currently wearing the hat of": rotating role pill ----
     Every role is already in the markup; only the first is visible, so the
     pill reads correctly if this never runs. Timing matches the original
     Figma site: a new role every 2.8s, a short soft crossfade. */
  var rotator = document.querySelector("[data-role-rotator]");

  if (rotator && !prefersReducedMotion) {
    var hats = rotator.querySelectorAll(".hero-pill-word");

    if (hats.length > 1) {
      var hatIndex = 0;

      window.setTimeout(function () {
        window.setInterval(function () {
          var leaving = hats[hatIndex];
          hatIndex = (hatIndex + 1) % hats.length;
          var arriving = hats[hatIndex];

          leaving.classList.remove("is-active");
          leaving.classList.add("is-leaving");
          arriving.classList.remove("is-leaving");
          arriving.classList.add("is-active");

          window.setTimeout(function () {
            leaving.classList.remove("is-leaving");
          }, 400);
        }, 2800);
      }, 1200);
    }
  }

  /* ---- Spiral back-to-top ---- */
  document.querySelectorAll("[data-back-to-top]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      const target = document.querySelector("main") || document.body;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  /* ---- Phone tab bar: the tapped tab pops up at once, before the next
     page arrives, so the tap always feels answered. ---- */
  const tabLinks = document.querySelectorAll(".tabbar-link");
  tabLinks.forEach((link) => {
    link.addEventListener("click", () => {
      tabLinks.forEach((other) => {
        if (other !== link) other.removeAttribute("aria-current");
      });
      if (!link.hasAttribute("aria-current")) link.setAttribute("aria-current", "location");
    });
  });

  /* ---- Phone tab bar: on the homepage, "Work" lights up over the projects ---- */
  const homeTab = document.querySelector('.tabbar-link[data-tab="home"][aria-current]');
  const workTab = document.querySelector('.tabbar-link[data-tab="work"]');
  const projectsSection = document.getElementById("projects");
  if (homeTab && workTab && projectsSection && "IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        const onWork = entry.isIntersecting;
        if (onWork) {
          homeTab.removeAttribute("aria-current");
          workTab.setAttribute("aria-current", "location");
        } else {
          workTab.removeAttribute("aria-current");
          homeTab.setAttribute("aria-current", "page");
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    ).observe(projectsSection);
  }

  /* ---- "I've worked across ...": each field underlines and darkens in
     order as the section scrolls up. Scroll-linked, so it never makes anyone wait. */
  const lineup = document.querySelector("[data-lineup]");
  if (lineup && !prefersReducedMotion) {
    const tabs = [...lineup.querySelectorAll(".work-term")];
    let ticking = false;
    const paint = () => {
      ticking = false;
      const vh = window.innerHeight;
      const clamp = (v) => Math.min(1, Math.max(0, v));
      // 0 when the line enters at 92% of the screen, 1 at 55%, handed
      // along left to right.
      const progress = clamp((vh * 0.92 - lineup.getBoundingClientRect().top) / (vh * 0.37));
      tabs.forEach((tab, i) => {
        const t = clamp(progress * tabs.length - i);
        tab.style.setProperty("--t", (t * t * (3 - 2 * t)).toFixed(3));
      });
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(paint);
      }
    };
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) window.addEventListener("scroll", onScroll, { passive: true });
      else window.removeEventListener("scroll", onScroll);
      paint();
    }, { rootMargin: "20% 0px 20% 0px" }).observe(lineup);
    paint();
  }

  /* ---- Words that arrive gently ----
     [data-words] statements are split into words that fade up one after
     another when they come into view. If this script arrives late (slow
     connection) the text is left exactly as it is: the CSS fallback has
     already shown it, and re-hiding readable text would be worse. */
  var wordNodes = document.querySelectorAll("[data-words]");
  var wordsTooLate = window.performance && performance.now() > 2300;

  if (wordNodes.length && !prefersReducedMotion && !wordsTooLate && "IntersectionObserver" in window) {
    var splitWords = function (node) {
      var index = 0;
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var fragment = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              fragment.appendChild(document.createTextNode(" "));
            } else {
              var word = document.createElement("span");
              word.className = "word";
              word.style.setProperty("--i", index++);
              word.textContent = part;
              fragment.appendChild(word);
            }
          });
          node.replaceChild(fragment, child);
        } else if (child.nodeType === 1) {
          child.classList.add("word");
          child.style.setProperty("--i", index++);
        }
      });
      return index;
    };

    var wordObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var node = entry.target;
          node.classList.add("words-play");
          wordObserver.unobserve(node);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );

    wordNodes.forEach(function (node) {
      var count = splitWords(node);
      // Long statements keep the whole reveal under about two seconds.
      if (count > 18) node.style.setProperty("--stagger", Math.round(1700 / count) + "ms");
      if (node.dataset.wordsDelay) node.style.setProperty("--words-delay", node.dataset.wordsDelay + "s");
      node.classList.add("words-split");
      wordObserver.observe(node);
    });
  } else {
    wordNodes.forEach(function (node) {
      node.classList.add("words-done");
    });
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
