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

            var step = function (timestamp) {
              if (start === null) {
                start = timestamp;
              }

              var progress = Math.min((timestamp - start) / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              var value = target * eased;

              node.textContent = prefix + value.toFixed(decimals) + suffix;

              if (progress < 1) {
                window.requestAnimationFrame(step);
              } else {
                node.textContent = prefix + target.toFixed(decimals) + suffix;
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
