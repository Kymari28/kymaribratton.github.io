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

  /* ---- Phones and tablets: the menus step aside while you read ----
     Scrolling down slides the top bar up and the tab bar down to a slim
     handle; scrolling up, reaching the end, tapping the handle or tabbing
     into either menu brings them back. */
  const navQuery = window.matchMedia("(max-width: 899px)");
  const tabbar = document.querySelector(".tabbar");
  let navHidden = false;
  let navLastY = window.scrollY;
  let navTicking = false;
  const setNavHidden = (hide) => {
    if (hide === navHidden) return;
    navHidden = hide;
    document.documentElement.classList.toggle("nav-hidden", hide);
  };
  const paintNav = () => {
    navTicking = false;
    const y = window.scrollY;
    const dy = y - navLastY;
    const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 8;
    if (!navQuery.matches || y < 90 || atEnd) {
      setNavHidden(false);
      navLastY = y;
    } else if (Math.abs(dy) > 10) {
      setNavHidden(dy > 0);
      navLastY = y;
    }
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!navTicking) {
        navTicking = true;
        requestAnimationFrame(paintNav);
      }
    },
    { passive: true }
  );
  if (tabbar) {
    // While tucked away, a tap on the handle only brings the bar back.
    tabbar.addEventListener(
      "click",
      (event) => {
        if (!navHidden) return;
        event.preventDefault();
        event.stopPropagation();
        setNavHidden(false);
      },
      true
    );
  }
  document.addEventListener("focusin", (event) => {
    if (navHidden && event.target.closest(".topbar, .tabbar")) setNavHidden(false);
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

  /* ==== Motion picks (Nov 2026) ====
     All optional: each piece checks for its elements and for reduced
     motion, and the page is complete without any of it. */

  /* ---- Hero: --bloom follows how far the hero has scrolled away ---- */
  var bloomHero = document.querySelector(".hero");
  if (bloomHero && document.querySelector(".portrait-stage") && !prefersReducedMotion) {
    var bloomTicking = false;
    var lastBloom = -1;
    var paintBloom = function () {
      bloomTicking = false;
      var span = bloomHero.offsetHeight * 0.85 || 1;
      var b = Math.min(1, Math.max(0, window.scrollY / span));
      b = Math.round(b * 1000) / 1000;
      if (b !== lastBloom) {
        lastBloom = b;
        bloomHero.style.setProperty("--bloom", b);
      }
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!bloomTicking && window.scrollY < bloomHero.offsetHeight * 1.2 + 200) {
          bloomTicking = true;
          requestAnimationFrame(paintBloom);
        } else if (lastBloom < 1 && window.scrollY >= bloomHero.offsetHeight) {
          bloomHero.style.setProperty("--bloom", 1);
          lastBloom = 1;
        }
      },
      { passive: true }
    );
    paintBloom();
  }

  /* ---- Selected Work: the featured three, one in focus ----
     Builds a short "living thumbnail" inside each featured card, then:
     desktop holds the row for a short scroll while the focus walks across
     it (the cards rise to meet you first); phones play whichever card
     reaches the middle of the screen. Only the focused card plays. */
  var featured = document.querySelector("[data-featured]");
  if (featured && !prefersReducedMotion) {
    var fCards = Array.prototype.slice.call(featured.querySelectorAll(".project-grid--featured > .project-card"));
    var svgNS = "http://www.w3.org/2000/svg";
    var counters = [];
    var players = [];

    /* Brightside: the real graph, same crop as before. One cluster is
       rebuilt as vector over the screenshot (the cluster itself is erased
       from brightside-graph-base.webp) so a cursor can drag its centre
       node and switch its relationships off and back on. Coordinates are
       in the screenshot's own pixels (724 x 363). */
    var buildGraph = function (card, live) {
      var el = function (name, attrs, parent) {
        var n = document.createElementNS(svgNS, name);
        for (var a in attrs) n.setAttribute(a, attrs[a]);
        if (parent) parent.appendChild(n);
        return n;
      };
      var H0 = [405.5, 85.8], H1 = [422.5, 104.8], G = [4, 5], R = 14;
      // spoke: [x, y, stroke, opacity, width, arrow]
      var spokes = [
        [362.2, 24.8, "#d9749c", 0.8, 1.1, 1],
        [422.8, 25.5, "#a3abab", 0.75, 0.8, 0],
        [467.4, 58.8, "#d9749c", 0.7, 1.1, 1],
        [470.4, 119.2, "#d0658f", 0.95, 1.2, 1],
        [411.8, 147.4, "#c95a7c", 0.95, 1.2, 1],
        [344.8, 85.0, "#d9749c", 0.5, 0.9, 0]
      ];
      var svg = el("svg", { viewBox: "4.5 6.3 558.5 349", preserveAspectRatio: "xMinYMid slice" });
      el("image", { href: "/assets/brightside-graph-base.webp", width: 724, height: 363 }, svg);
      // a touch of softness so the vector cluster matches the screenshot
      var soft = el("filter", { id: "bs-soft", x: "-5%", y: "-5%", width: "110%", height: "110%" }, el("defs", {}, svg));
      el("feGaussianBlur", { stdDeviation: 0.75 }, soft);
      var layer = el("g", { filter: "url(#bs-soft)" }, svg);
      var edges = spokes.map(function (s, k) {
        var g = el("g", {}, layer);
        var line = el("line", { stroke: s[2], "stroke-width": s[4], "stroke-opacity": s[3], "stroke-linecap": "round" }, g);
        var arrow = s[5] ? el("path", { d: "M0 0L-5.2 -2.3L-5.2 2.3Z", fill: s[2], "fill-opacity": s[3] }, g) : null;
        var label = el("g", {}, g);
        var clip = el("svg", { x: -16, y: -6, width: 32, height: 12, viewBox: "0 " + k * 12 + " 32 12" }, label);
        el("image", { href: "/assets/brightside-graph-labels.webp", width: 32, height: 72 }, clip);
        return { s: s, line: line, arrow: arrow, label: label };
      });
      spokes.forEach(function (s) { el("circle", { cx: s[0], cy: s[1], r: R, fill: "#bce6e5" }, layer); });
      var ring = el("circle", { r: 17.2, fill: "none", stroke: "#8fd0ce", "stroke-width": 2.2, opacity: 0 }, layer);
      var hub = el("circle", { r: R, fill: "#bce6e5" }, layer);
      var cursor = el("g", { opacity: 0 }, svg);
      el("path", { d: "M0 0V15.5L4.1 11.8L6.9 18L9.3 16.9L6.6 10.9H11.6Z", fill: "#2a2a2a", stroke: "#fff", "stroke-width": 1.3, "stroke-linejoin": "round" }, cursor);
      svg.setAttribute("class", "bs-wide");
      live.appendChild(svg);

      // The close-up: two real frames from the walkthrough (same layout,
      // relationships on and filtered off) so the depression nodes read.
      var close = document.createElement("div");
      close.className = "bs-close";
      close.innerHTML =
        '<div class="bs-close-inner">' +
        '<img src="/assets/brightside-graph-close-on.webp" alt="" width="520" height="325" decoding="async" />' +
        '<img class="bs-off" src="/assets/brightside-graph-close-off.webp" alt="" width="520" height="325" decoding="async" />' +
        "</div>" +
        '<p class="bs-chip"><span>Relationships</span><i></i></p>';
      live.appendChild(close);
      var closeInner = close.firstChild;
      var offImg = close.querySelector(".bs-off");
      var chip = close.querySelector(".bs-chip");

      var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
      var seg = function (t, a, b) { return clamp((t - a) / (b - a)); };
      var inOut = function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
      var mix = function (a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
      var lerp = function (a, b, k) { return a + (b - a) * k; };
      // 0 to 1 while a press is held between a and b, eased at both ends
      var held = function (t, a, b) { return seg(t, a, a + 150) * (1 - seg(t, b, b + 150)); };
      var P = 10000;

      var draw = function (t) {
        // 1. Drag a node in the overview.
        var h = t < 4000 ? mix(H0, H1, inOut(seg(t, 1150, 2500))) : H0;
        var grab = [h[0] + G[0], h[1] + G[1]];
        var cur = t < 1000
          ? mix([470, 168], grab, inOut(seg(t, 300, 1000)))
          : mix(grab, [grab[0] + 22, grab[1] + 20], inOut(seg(t, 2600, 3000)));
        var cOp = seg(t, 300, 650) * (1 - seg(t, 2650, 3000));
        var press = held(t, 1000, 2500);
        cursor.setAttribute("transform", "translate(" + cur[0].toFixed(2) + " " + cur[1].toFixed(2) + ") scale(" + (1 - press * 0.14).toFixed(3) + ")");
        cursor.setAttribute("opacity", cOp.toFixed(3));
        hub.setAttribute("cx", h[0].toFixed(2));
        hub.setAttribute("cy", h[1].toFixed(2));
        ring.setAttribute("cx", h[0].toFixed(2));
        ring.setAttribute("cy", h[1].toFixed(2));
        ring.setAttribute("opacity", (press * 0.7).toFixed(3));
        edges.forEach(function (e) {
          var dx = e.s[0] - h[0], dy = e.s[1] - h[1];
          var L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
          var end = L - R - (e.arrow ? 1.5 : 0);
          var ang = (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2);
          e.line.setAttribute("x1", h[0].toFixed(2));
          e.line.setAttribute("y1", h[1].toFixed(2));
          e.line.setAttribute("x2", (h[0] + ux * end).toFixed(2));
          e.line.setAttribute("y2", (h[1] + uy * end).toFixed(2));
          if (e.arrow) e.arrow.setAttribute("transform", "translate(" + (h[0] + ux * end).toFixed(2) + " " + (h[1] + uy * end).toFixed(2) + ") rotate(" + ang + ")");
          e.label.setAttribute("transform", "translate(" + (h[0] + ux * L / 2).toFixed(2) + " " + (h[1] + uy * L / 2).toFixed(2) + ") rotate(" + ang + ")");
        });

        // 2. Zoom into the labelled depression nodes, and back out.
        var zin = inOut(seg(t, 3000, 4000));
        var zout = inOut(seg(t, 8200, 9200));
        var z = zin * (1 - zout);
        svg.style.transform = "scale(" + lerp(1, 2.4, z).toFixed(4) + ")";
        svg.style.opacity = (1 - clamp(seg(t, 3300, 4000) - seg(t, 8200, 8900))).toFixed(3);
        close.style.transform = "scale(" + lerp(0.5, 1, z).toFixed(4) + ")";
        close.style.opacity = clamp(seg(t, 3000, 3700) - seg(t, 8500, 9200)).toFixed(3);
        closeInner.style.transform = "scale(" + (1 + 0.07 * inOut(seg(t, 3600, 8600))).toFixed(4) + ")";

        // 3. Relationships switch off, then back on.
        var off = inOut(seg(t, 5300, 5800)) * (1 - inOut(seg(t, 6900, 7400)));
        offImg.style.opacity = off.toFixed(3);
        chip.style.setProperty("--on", (1 - off).toFixed(3));
        chip.style.opacity = clamp(seg(t, 4100, 4500) - seg(t, 8100, 8400)).toFixed(3);
      };
      draw(0);

      var raf = 0, t0 = 0, stopAt = 0;
      var tick = function (now) {
        if (stopAt && now > stopAt) {
          raf = 0;
          stopAt = 0;
          draw(0);
          return;
        }
        draw((now - t0) % P);
        raf = requestAnimationFrame(tick);
      };
      return {
        card: card,
        start: function () {
          stopAt = 0;
          if (raf) return;
          t0 = performance.now();
          raf = requestAnimationFrame(tick);
        },
        // keep moving while the layer fades out, then rest at frame 0
        stop: function () {
          if (raf && !stopAt) stopAt = performance.now() + 650;
        }
      };
    };

    var buildLive = function (card) {
      var stage = card.querySelector(".project-stage");
      if (!stage) return;
      var kind = card.dataset.project;
      var live = document.createElement("div");
      live.className = "live";
      live.setAttribute("aria-hidden", "true");
      if (kind === "immigrants-rising") {
        live.classList.add("live--ir");
        var steps = ["Instructions", "Info", "Eligibility", "Review", "Results"];
        live.innerHTML =
          '<p class="live-chip">15% higher completion</p><div class="live-steps">' +
          steps.map(function (s, k) { return '<span style="--k:' + k + '"><i></i>' + s + "</span>"; }).join("") +
          "</div>";
      } else if (kind === "brightside") {
        live.classList.add("live--bs");
        players.push(buildGraph(card, live));
      } else if (kind === "gateway") {
        live.classList.add("live--panel", "live--gw");
        var data = [150000, 450000, 1500000, 875000, 350000, 490000];
        var years = ["2020", "2021", "2022", "2023", "2024", "2025"];
        live.innerHTML =
          '<div class="gw-live-total"><strong>$0M</strong><span>Funding secured for clients, 2020 to 2025</span></div>' +
          '<div class="gw-live-chart"><div class="gw-live-bars">' +
          data.map(function (v, k) { return '<i class="' + (k === 2 ? "hi" : "") + '" style="--k:' + k + ";--h:" + (v / 1500000 * 100).toFixed(1) + '%"></i>'; }).join("") +
          '</div><div class="gw-live-years">' + years.map(function (y) { return "<span>" + y.slice(2) + "</span>"; }).join("") + "</div></div>";
        counters.push({ card: card, el: live.querySelector("strong") });
      } else {
        return;
      }
      stage.appendChild(live);
    };
    fCards.forEach(buildLive);

    var countUp = function (el) {
      var t0 = performance.now() + 300;
      var tick = function (now) {
        var k = Math.min(1, Math.max(0, (now - t0) / 1600));
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = "$" + (3.815 * e).toFixed(3) + "M";
        if (k < 1) requestAnimationFrame(tick);
      };
      el.textContent = "$0.000M";
      requestAnimationFrame(tick);
    };

    var playing = -1;
    var setPlaying = function (i, withFocus) {
      featured.classList.toggle("has-focus", !!withFocus && i >= 0);
      if (i === playing) return;
      playing = i;
      fCards.forEach(function (c, k) {
        c.classList.toggle("is-focus", k === i);
        c.classList.toggle("is-playing", k === i);
      });
      counters.forEach(function (c) { if (c.card === fCards[i]) countUp(c.el); });
      players.forEach(function (p) { if (p.card === fCards[i]) p.start(); else p.stop(); });
    };

    var desktopQuery = window.matchMedia("(min-width: 900px)");
    var headerEl = document.querySelector(".topbar");
    var pinned = false;
    var cardObserver = null;

    var layoutFeatured = function () {
      featured.classList.remove("is-pinned");
      featured.style.removeProperty("--featured-h");
      pinned = false;
      if (desktopQuery.matches) {
        var headerH = headerEl ? headerEl.offsetHeight : 76;
        var room = window.innerHeight - headerH;
        var sticky = featured.querySelector(".featured-sticky");
        if (sticky && sticky.offsetHeight + 24 <= room) {
          // Short hold: about a third of a screen of scrolling per card.
          featured.style.setProperty("--featured-h", Math.round(room + window.innerHeight * 0.95) + "px");
          featured.classList.add("is-pinned");
          pinned = true;
        }
      }
      if (cardObserver) { cardObserver.disconnect(); cardObserver = null; }
      if (!pinned && "IntersectionObserver" in window) {
        cardObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setPlaying(fCards.indexOf(entry.target), false);
          });
        }, { rootMargin: "-42% 0px -42% 0px" });
        fCards.forEach(function (c) { cardObserver.observe(c); });
        fCards.forEach(function (c) { c.style.removeProperty("--rise"); });
      }
      paintFeatured();
    };

    var featuredTicking = false;
    var paintFeatured = function () {
      featuredTicking = false;
      if (!pinned) return;
      var headerH = headerEl ? headerEl.offsetHeight : 76;
      var rect = featured.getBoundingClientRect();
      var vh = window.innerHeight;
      // Rise to meet you as the section arrives.
      var arrive = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.75)));
      fCards.forEach(function (c, k) {
        var r = Math.min(1, Math.max(0, arrive * 1.35 - k * 0.17));
        c.style.setProperty("--rise", (r * r * (3 - 2 * r)).toFixed(3));
      });
      // Focus walks across once the row is held.
      var run = featured.offsetHeight - (vh - headerH);
      var p = (headerH - rect.top) / Math.max(1, run);
      if (rect.top > headerH + 2 || p > 1.02) {
        setPlaying(p > 1.02 ? fCards.length - 1 : -1, p <= 1.02 ? false : true);
        if (p > 1.02) featured.classList.remove("has-focus");
        return;
      }
      // A little hysteresis so the focus never flickers at a hand-off.
      var raw = Math.max(0, p) * fCards.length;
      var next = Math.min(fCards.length - 1, Math.floor(raw * 0.999));
      if (playing >= 0 && next !== playing && Math.abs(raw - Math.max(next, playing)) < 0.08) next = playing;
      setPlaying(next, true);
    };

    window.addEventListener("scroll", function () {
      if (!featuredTicking) {
        featuredTicking = true;
        requestAnimationFrame(paintFeatured);
      }
    }, { passive: true });
    window.addEventListener("resize", layoutFeatured);
    window.addEventListener("load", layoutFeatured);
    layoutFeatured();
  }

  /* ---- Headlines rise from behind a mask (case studies) ----
     Wraps each line in a clipped span, plays the rise, then restores the
     heading exactly as it was, so later resizes reflow normally and hover
     effects inside the title keep working. */
  var riseHeading = function (el, delay) {
    if (el.classList.contains("mask-run") || el.classList.contains("mask-done")) return;
    el.classList.add("mask-run");
    var restore;
    var inners = [];
    if (!el.children.length) {
      var original = el.textContent;
      var words = original.trim().split(/\s+/);
      el.textContent = "";
      var spans = words.map(function (w, i) {
        var s = document.createElement("span");
        s.textContent = w + (i < words.length - 1 ? " " : "");
        el.appendChild(s);
        return s;
      });
      var lines = [];
      var lastTop = null;
      spans.forEach(function (s) {
        var top = s.offsetTop;
        if (lastTop === null || Math.abs(top - lastTop) > 4) {
          lines.push([]);
          lastTop = top;
        }
        lines[lines.length - 1].push(s.textContent);
      });
      el.textContent = "";
      lines.forEach(function (words) {
        var outer = document.createElement("span");
        var inner = document.createElement("span");
        outer.className = "mline";
        inner.className = "mline-in";
        inner.textContent = words.join("");
        outer.appendChild(inner);
        el.appendChild(outer);
        inners.push(inner);
      });
      restore = function () {
        el.textContent = original;
      };
    } else {
      var outerBox = document.createElement("span");
      var innerBox = document.createElement("span");
      outerBox.className = "mline";
      innerBox.className = "mline-in";
      while (el.firstChild) innerBox.appendChild(el.firstChild);
      outerBox.appendChild(innerBox);
      el.appendChild(outerBox);
      inners.push(innerBox);
      restore = function () {
        while (innerBox.firstChild) el.insertBefore(innerBox.firstChild, outerBox);
        outerBox.remove();
      };
    }
    var runs = inners.map(function (inner, i) {
      return inner.animate(
        [{ transform: "translateY(108%)" }, { transform: "translateY(0)" }],
        { duration: 950, delay: delay + i * 110, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" }
      ).finished;
    });
    Promise.all(runs)
      .catch(function () {})
      .then(function () {
        restore();
        el.classList.remove("mask-run");
        el.classList.add("mask-done");
      });
  };

  var caseMain = document.querySelector("main[data-case]");
  if (caseMain) {
    var heroTitle = caseMain.querySelector(".subpage-title");
    if (heroTitle) {
      if (prefersReducedMotion || performance.now() > 1600 || !heroTitle.animate) {
        heroTitle.classList.add("mask-done");
      } else {
        /* Arriving from a project card, wait for the image glide so the
           title rises as the image lands. */
        var cameFromSite = false;
        try {
          cameFromSite = !!document.referrer && new URL(document.referrer).origin === window.location.origin;
        } catch (e) {}
        riseHeading(heroTitle, cameFromSite && "onpagereveal" in window ? 420 : 120);
      }
    }

    var sectionTitles = caseMain.querySelectorAll(".section-title");
    if (sectionTitles.length && !prefersReducedMotion && "IntersectionObserver" in window && document.body.animate) {
      var titleObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            titleObserver.unobserve(entry.target);
            var holder = entry.target.closest("[data-reveal]");
            if (holder && holder.classList.contains("is-instant")) return;
            riseHeading(entry.target, 60);
          });
        },
        { threshold: 0, rootMargin: "0px 0px -8% 0px" }
      );
      sectionTitles.forEach(function (t) {
        var r = t.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0 && performance.now() > 900) return;
        titleObserver.observe(t);
      });
    }

    /* ---- Screens uncover as you reach them ---- */
    var screens = caseMain.querySelectorAll(".case-screen-media, .immigrants-review-closeup");
    if (screens.length) {
      if (!document.documentElement.classList.contains("reveal-ready") || !("IntersectionObserver" in window)) {
        screens.forEach(function (s) { s.classList.add("is-uncovered"); });
      } else {
        var screenObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              screenObserver.unobserve(entry.target);
              entry.target.classList.add("is-uncovered");
            });
          },
          { threshold: 0, rootMargin: "0px 0px -12% 0px" }
        );
        screens.forEach(function (s) {
          var r = s.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0 && performance.now() > 900) {
            s.classList.add("is-uncovered", "is-instant");
          } else {
            screenObserver.observe(s);
          }
        });
      }
    }

    /* ---- Reading line ---- */
    var readLine = document.createElement("div");
    readLine.className = "read-line";
    readLine.setAttribute("aria-hidden", "true");
    document.body.appendChild(readLine);
    if (!(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()"))) {
      var readTicking = false;
      var paintRead = function () {
        readTicking = false;
        var max = document.documentElement.scrollHeight - window.innerHeight || 1;
        readLine.style.setProperty("--read", Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4));
      };
      window.addEventListener("scroll", function () {
        if (!readTicking) {
          readTicking = true;
          requestAnimationFrame(paintRead);
        }
      }, { passive: true });
      paintRead();
    }
  }

  /* ---- Selected Work, second row: the same living thumbnails ----
     Mindfulness maps one discovery page into three clear paths to booking;
     24Seven steps through its separate traveller journeys. One card plays at
     a time: the one in the middle of the screen, or the one under the
     pointer. */
  var moreCards = Array.prototype.slice.call(document.querySelectorAll(".project-grid--more > .project-card"));
  if (moreCards.length && !prefersReducedMotion && "IntersectionObserver" in window) {
    var builtMore = moreCards.filter(function (card) {
      var stage = card.querySelector(".project-stage");
      var kind = card.dataset.project;
      if (!stage) return false;
      var live = document.createElement("div");
      live.className = "live";
      live.setAttribute("aria-hidden", "true");
      if (kind === "mindfulness") {
        live.classList.add("live--mfd");
        var paths = ["1:1 sessions", "Group program", "Corporate"];
        live.innerHTML =
          '<div class="mfd-map">' +
          '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
          [18, 50, 82].map(function (y, k) {
            return '<path style="--k:' + k + '" pathLength="1" d="M22 50C29 50 29 ' + y + ' 35 ' + y + '"/>' +
              '<path class="out" style="--k:' + k + '" pathLength="1" d="M65 ' + y + 'C71 ' + y + ' 71 50 78 50"/>';
          }).join("") +
          "</svg>" +
          '<span class="mfd-start">Discover</span>' +
          paths.map(function (p, k) { return '<span class="mfd-path" style="--k:' + k + ";--y:" + [18, 50, 82][k] + '%">' + p + "</span>"; }).join("") +
          '<span class="mfd-end">Book</span>' +
          "</div>";
      } else if (kind === "24seven") {
        live.classList.add("live--t24");
        var trips = ["Solo", "Group", "First-time"];
        live.innerHTML =
          '<p class="live-chip live-chip--t24">A journey for each</p>' +
          '<div class="t24-pick"><span class="t24-label">Planning for</span><div class="t24-seg"><i></i>' +
          trips.map(function (t, k) { return '<span style="--k:' + k + '">' + t + "</span>"; }).join("") +
          "</div></div>";
      } else {
        return false;
      }
      stage.appendChild(live);
      return true;
    }).length;

    if (builtMore) {
      var inView = [];
      var hovered = null;
      var morePlaying = null;
      var pickMore = function () {
        var next = hovered || inView[0] || null;
        if (next === morePlaying) return;
        moreCards.forEach(function (c) { c.classList.toggle("is-playing", c === next); });
        morePlaying = next;
      };
      var moreObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var at = inView.indexOf(entry.target);
          if (entry.isIntersecting && at < 0) inView.push(entry.target);
          if (!entry.isIntersecting && at >= 0) inView.splice(at, 1);
        });
        inView.sort(function (a, b) { return moreCards.indexOf(a) - moreCards.indexOf(b); });
        pickMore();
      }, { rootMargin: "-35% 0px -35% 0px" });
      moreCards.forEach(function (card) {
        moreObserver.observe(card);
        card.addEventListener("pointerenter", function (e) {
          if (e.pointerType === "mouse") { hovered = card; pickMore(); }
        });
        card.addEventListener("pointerleave", function () {
          if (hovered === card) { hovered = null; pickMore(); }
        });
        card.addEventListener("focusin", function () { hovered = card; pickMore(); });
        card.addEventListener("focusout", function () { if (hovered === card) { hovered = null; pickMore(); } });
      });
    }
  }
})();
