/* Signature scroll storytelling for the two immersive-benchmark case
   studies: Gateway Regional Council and Mindfulness with Desiree.

   Loaded only on those two pages. Every element this script touches is
   fully visible and correct in plain CSS with this script absent (CDN
   blocked, JS disabled, GSAP failed to load) or when the visitor prefers
   reduced motion: this file simply never runs in either case, and nothing
   it would have animated is ever hidden by CSS alone. */
(function () {
  "use strict";

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    return;
  }

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     GATEWAY REGIONAL COUNCIL
     Colorful, quicker, information-organizing.

     Motion budget: 5 real moments total — Entry, Hero, Impact, Events,
     Grant Writers. Impact and Events are the two largest sequences; Grant
     Writers stays intentionally calmer (progressive disclosure, no scroll
     choreography of its own). Do not add a 6th moment without revisiting
     this budget.

     3 environmental whimsy details, each tied to a real fact/color, none
     on Grant Writers (it stays the calm one): a real-fact chip sliding in
     on the process section, a static off-grid accent on the real code
     block, a one-time label above the real Events demo. Do not add more
     without revisiting — discovery, not decoration.
     ============================================================ */

  var gatewayHero = document.querySelector('[data-gsap-hero="gateway"]');

  if (gatewayHero) {
    var gCopy = gatewayHero.querySelector("[data-gsap-hero-copy]");
    var gVisual = gatewayHero.querySelector("[data-gsap-hero-visual]");
    var gShapes = gsap.utils.toArray(gatewayHero.querySelectorAll("[data-gsap-entry-shape]"));

    if (gCopy && gVisual) {
      var gCopyKids = gsap.utils.toArray(gCopy.children);
      var gPrimary = gVisual.querySelector(".case-device--primary");
      var gSecondary = gVisual.querySelector(".case-device--secondary");

      /* Threshold moment: the world arrives in visible depth order before
         copy resolves. Bar (nearest) leads, dots (farthest) trail in, both
         noticeably offset from where they land. */
      var gBar = gatewayHero.querySelector(".gateway-entry-shape--bar");
      var gDots = gatewayHero.querySelector(".gateway-entry-shape--dots");

      gsap.set(gCopyKids, { opacity: 0, y: 16 });
      gsap.set(gVisual, { opacity: 0 });
      if (gPrimary) gsap.set(gPrimary, { opacity: 0, y: 20, scale: 0.97 });
      if (gSecondary) gsap.set(gSecondary, { opacity: 0, y: 28, scale: 0.95 });
      if (gBar) gsap.set(gBar, { opacity: 0, y: 70, scaleY: 0.4 });
      if (gDots) gsap.set(gDots, { opacity: 0, x: 40 });

      var gHeroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (gBar) gHeroTl.to(gBar, { opacity: 0.5, y: 0, scaleY: 1, duration: 0.7 }, 0);
      if (gDots) gHeroTl.to(gDots, { opacity: 0.55, x: 0, duration: 0.6 }, 0.16);
      gHeroTl
        .to(gCopyKids, { opacity: 1, y: 0, duration: 0.6, stagger: 0.065 }, 0.18)
        .to(gVisual, { opacity: 1, duration: 0.35 }, 0.32)
        .to(gPrimary, { opacity: 1, y: 0, scale: 1, duration: 0.75 }, 0.36)
        .to(gSecondary, { opacity: 1, y: 0, scale: 1, duration: 0.75 }, 0.46);

      /* Parallax: three visible planes as the hero scrolls past. Entry
         shapes (background) move slowest, the secondary device (foreground)
         moves most. Typography never moves. */
      if (gShapes.length) {
        gsap.to(gShapes, {
          y: -34,
          ease: "none",
          scrollTrigger: { trigger: gatewayHero, start: "top top", end: "bottom top", scrub: 0.6 },
        });
      }
      if (gPrimary) {
        gsap.to(gPrimary, {
          y: -18,
          ease: "none",
          scrollTrigger: { trigger: gatewayHero, start: "top top", end: "bottom top", scrub: 0.6 },
        });
      }
      if (gSecondary) {
        gsap.to(gSecondary, {
          y: -46,
          ease: "none",
          scrollTrigger: { trigger: gatewayHero, start: "top top", end: "bottom top", scrub: 0.6 },
        });
      }
    }
  }

  /* Impact — "complexity becomes clarity" (motion/responsive handoff §3.2),
     the entrance beat that plays just above the real tabbed chart panel
     below it. Six real totals start scattered and rotated, then settle
     into one row as the section scrolls, continuously tied to scroll
     position (scrub) rather than a fixed-duration tween. Desktop/tablet
     share this scrub mechanism (CSS handles the tablet 2-column layout and
     reduced travel distance via --scatter-scale); mobile gets a distinct,
     simpler discrete per-item arrival (locked §3.6: alternating screen
     edges, not scattering along paths). Reuses the site's "plays once,
     never replays on scroll-back" pattern (like the real bar-grow below
     it) by killing the ScrollTrigger the first time it fully resolves. */
  var gatewayConverge = document.querySelector("[data-gsap-impact-converge]");

  if (gatewayConverge) {
    var convergeScatter = gatewayConverge.querySelector(".gateway-impact-scatter");
    var convergeStats = gsap.utils.toArray(gatewayConverge.querySelectorAll(".gateway-impact-stat"));
    var convergeIsMobile = window.matchMedia("(max-width: 640px)");

    if (convergeIsMobile.matches) {
      gsap.set(convergeStats, { "--gp": 1 });

      convergeStats.forEach(function (stat, i) {
        ScrollTrigger.create({
          trigger: stat,
          start: "top 90%",
          once: true,
          onEnter: function () {
            /* Snap to the exact resolved value in onComplete -- if this
               tween gets interrupted or the tab throttles rAF mid-flight
               (backgrounded tab, fast momentum scroll), the stat should
               never be left stranded at a slightly-faded, never-quite-
               settled opacity. */
            gsap.to(stat, {
              "--gp": 0,
              duration: 0.55,
              ease: "power2.out",
              delay: i * 0.035,
              overwrite: "auto",
              onComplete: function () {
                gsap.set(stat, { "--gp": 0 });
              },
            });
          },
        });
      });
    } else if (convergeScatter) {
      gsap.set(convergeScatter, { "--gp": 1 });

      gsap.to(convergeScatter, {
        "--gp": 0,
        ease: "none",
        scrollTrigger: {
          trigger: gatewayConverge,
          start: "top 82%",
          end: "top 32%",
          scrub: 0.5,
          onLeave: function (self) {
            /* Force the scrub tween to its exact end value before killing
               it -- scrub adds a smoothing lag, so a fast scroll can cross
               "end" before the eased value has actually caught up,
               otherwise permanently freezing the row a few percent short
               of fully resolved. */
            if (self.animation) self.animation.progress(1);
            self.kill();
          },
        },
      });

      /* Movement lives on hover only (see .gateway-impact-stat-inner:hover
         in styles.css) — no scroll-tied wobble. Scrolling settles the
         layout; hovering is what moves it. */
    }
  }

  /* Impact: the signature story. A lot of information organizing into
     understanding. Metrics establish first, then the real bars grow once,
     in sequence, the moment the section is actually in view. No scrub, no
     pin: a single "play once" entrance so native scroll stays untouched. */
  var gatewayImpact = document.querySelector("[data-gsap-impact]");

  if (gatewayImpact) {
    var gTotal = gatewayImpact.querySelector(".gateway-chart-total");
    var gTabs = gsap.utils.toArray(gatewayImpact.querySelectorAll(".gateway-impact-tab"));
    var gBars = gsap.utils.toArray(gatewayImpact.querySelectorAll(".gateway-impact-bar"));
    var gCaption = gatewayImpact.parentElement
      ? gatewayImpact.parentElement.querySelector(".gateway-chart-caption, .gateway-impact-source")
      : null;

    if (gTotal) gsap.set(gTotal, { opacity: 0, y: 10 });
    if (gTabs.length) gsap.set(gTabs, { opacity: 0, y: 8 });
    if (gBars.length) gsap.set(gBars, { scaleY: 0 });

    var gImpactTl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: gatewayImpact,
        start: "top 78%",
        toggleActions: "play none none none",
        once: true,
      },
    });

    if (gTotal) gImpactTl.to(gTotal, { opacity: 1, y: 0, duration: 0.55 });
    if (gTabs.length) gImpactTl.to(gTabs, { opacity: 1, y: 0, duration: 0.4, stagger: 0.045 }, "-=0.25");
    if (gBars.length) {
      gImpactTl.to(
        gBars,
        { scaleY: 1, duration: 0.6, ease: "power3.out", stagger: 0.07 },
        "-=0.1"
      );
    }

    /* Re-grow the bars (briefly) on every tab switch too, so later category
       choices still feel like organizing information rather than a static
       swap. Short and restrained: this is feedback, not a repeat of the
       entrance story. */
    gTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        window.requestAnimationFrame(function () {
          var freshBars = gatewayImpact.querySelectorAll(".gateway-impact-bar");
          if (!freshBars.length) return;
          gsap.fromTo(
            freshBars,
            { scaleY: 0.86 },
            { scaleY: 1, duration: 0.4, ease: "power2.out", stagger: 0.025 }
          );
        });
      });
    });
  }

  /* Events — "the problem, then the fix." One continuous scrub: dense,
     scattered event fragments settle as the real search/filter tools grow
     prominent, most fragments recede, and the two matching the active
     filter stay dominant, resolving right where the real, fully functional
     demo begins below. Decorative only (the component itself is
     aria-hidden); once the real demo appears this animation has already
     finished and never touches it. Mobile gets the same mechanism with a
     much shorter scroll distance and near-zero scatter (handled by CSS
     --scatter-scale) rather than a separate system. */
  var gatewayEventsConverge = document.querySelector("[data-gsap-events-converge]");

  if (gatewayEventsConverge) {
    var eventsIsMobile = window.matchMedia("(max-width: 640px)");
    var eventsEnd = eventsIsMobile.matches ? "bottom 65%" : "bottom 25%";

    gsap.fromTo(
      gatewayEventsConverge,
      { "--gp": 0 },
      {
        "--gp": 1,
        ease: "none",
        scrollTrigger: {
          trigger: gatewayEventsConverge,
          start: "top 85%",
          end: eventsEnd,
          scrub: 0.5,
          onLeave: function (self) {
            /* Force the scrub tween to its exact end value before killing
               it -- scrub adds a smoothing lag, so a fast scroll can cross
               "end" before the eased value has actually caught up,
               otherwise permanently freezing the row a few percent short
               of fully resolved. */
            if (self.animation) self.animation.progress(1);
            self.kill();
          },
        },
      }
    );
  }

  /* Whimsy: a real-fact chip sliding a few px in from the right, once, as
     the process section scrolls into view. */
  var gatewayProcessChip = document.querySelector("[data-gsap-process-chip]");

  if (gatewayProcessChip) {
    gsap.set(gatewayProcessChip, { opacity: 0, x: 12 });
    gsap.to(gatewayProcessChip, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: { trigger: gatewayProcessChip, start: "top 88%", once: true },
    });
  }

  /* Whimsy: a small label settling in once above the real Events demo,
     never repeating, never covering the controls beneath it. */
  var gatewayDemoAnnotation = document.querySelector("[data-gsap-demo-annotation]");

  if (gatewayDemoAnnotation) {
    gsap.set(gatewayDemoAnnotation, { opacity: 0, y: 8 });
    gsap.to(gatewayDemoAnnotation, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: { trigger: gatewayDemoAnnotation, start: "top 90%", once: true },
    });
  }

  /* ============================================================
     MINDFULNESS WITH DESIREE
     Warm, slower, space opening rather than density resolving.

     Motion budget: 7 real touchpoints total — entry transition, hero
     settle, Calm Before Complexity, Multiple Users One Brand, Same Brand
     Different Decision-Maker, vertical media + cinematic pause,
     booking/CTA. Only ~3 (hero, Calm Before Complexity, vertical media)
     are actual scroll choreography below; the rest lean on the shared
     reveal-on-scroll system instead of their own GSAP sequence. Do not add
     more scroll choreography without revisiting this budget. Stillness is
     part of the design — do not animate everything between the real
     moments.
     ============================================================ */

  var mindfulHero = document.querySelector('[data-gsap-hero="mindfulness"]');

  if (mindfulHero) {
    var mCopy = mindfulHero.querySelector("[data-gsap-hero-copy]");
    var mVisual = mindfulHero.querySelector("[data-gsap-hero-visual]");

    if (mCopy && mVisual) {
      var mCopyKids = gsap.utils.toArray(mCopy.children);
      var mPrimary = mVisual.querySelector(".case-device--primary");
      var mSecondary = mVisual.querySelector(".case-device--secondary");

      gsap.set(mCopyKids, { opacity: 0, y: 12 });
      gsap.set(mVisual, { opacity: 0 });
      if (mPrimary) gsap.set(mPrimary, { opacity: 0, y: 16, scale: 0.985, filter: "blur(7px)" });
      if (mSecondary) gsap.set(mSecondary, { opacity: 0, y: 22, scale: 0.97, filter: "blur(7px)" });

      /* Slower than GRC throughout, no overshoot: settling rather than
         arriving. The screenshots start later and take longer than the
         copy (and ease from a soft blur, the same resonance-reveal quality
         as the editorial photo below) so the title is always clearly
         first, not a race the image can win. */
      var mHeroTl = gsap.timeline({ defaults: { ease: "power2.out" } });
      mHeroTl
        .to(mCopyKids, { opacity: 1, y: 0, duration: 1.05, stagger: 0.12 }, 0.15)
        .to(mVisual, { opacity: 1, duration: 0.75 }, 0.4)
        .to(mPrimary, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.4 }, 0.5)
        .to(mSecondary, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.4 }, 0.68);

      /* Parallax: slower cadence than GRC (larger scrub lag) but slightly
         further travel on the foreground device, so the depth reads even
         though the motion feels unhurried. */
      if (mPrimary) {
        gsap.to(mPrimary, {
          y: -24,
          ease: "none",
          scrollTrigger: { trigger: mindfulHero, start: "top top", end: "bottom top", scrub: 1.1 },
        });
      }
      if (mSecondary) {
        gsap.to(mSecondary, {
          y: -52,
          ease: "none",
          scrollTrigger: { trigger: mindfulHero, start: "top top", end: "bottom top", scrub: 1.1 },
        });
      }
    }
  }

  /* Calm Before Complexity — deliberately simple. The real photo sits in
     its own column and just breathes tighter/cooler -> open/warmer once as
     the section scrolls past; the audit copy beside it never moves. One
     continuous curve, not a sequence of stages to count. */
  var mindfulCalm = document.querySelector("[data-gsap-calm]");

  if (mindfulCalm) {
    var calmPhoto = mindfulCalm.querySelector("[data-gsap-calm-photo]");

    if (calmPhoto) {
      gsap.fromTo(
        calmPhoto,
        { scale: 1.1, filter: "saturate(0.82)" },
        {
          scale: 1,
          filter: "saturate(1.04)",
          ease: "none",
          scrollTrigger: { trigger: mindfulCalm, start: "top 85%", end: "bottom 55%", scrub: 0.6 },
        }
      );
    }

    /* Whimsy detail 3 (approved handoff §3.4): on first entrance only, the
       same real close-up grows a few % and its shadow settles in, then
       stays still — notice, then settle, never repeating. This targets the
       wrapper figure, not the img inside (which already has the continuous
       breathing tween just above), so the two never fight over transform. */
    var calmMedia = mindfulCalm.querySelector(".mindfulness-calm-media");

    if (calmMedia) {
      gsap.fromTo(
        calmMedia,
        { scale: 0.97, boxShadow: "0 6px 14px rgba(37, 31, 26, 0.08)" },
        {
          scale: 1,
          boxShadow: "0 14px 30px rgba(37, 31, 26, 0.14)",
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: calmMedia, start: "top 85%", once: true },
        }
      );
    }
  }

  /* Whimsy detail 1 (approved handoff §3.4) — the one static Mindfulness
     section approved for parallax: the real photo drifts a few px slower
     than the text beside it. A small baseline scale keeps the crop's
     edges from ever showing through the drift. Text never moves. Skipped
     on mobile entirely (stacked layout, static crop only) rather than
     forcing desktop motion onto a phone. */
  var mindfulChallenge = document.querySelector(".mindfulness-challenge");
  var challengePhoto = document.querySelector("[data-gsap-challenge-photo]");
  var challengeIsMobile = window.matchMedia("(max-width: 720px)");

  if (mindfulChallenge && challengePhoto && !challengeIsMobile.matches) {
    gsap.set(challengePhoto, { scale: 1.08 });
    gsap.fromTo(
      challengePhoto,
      { yPercent: -4 },
      {
        yPercent: 4,
        ease: "none",
        scrollTrigger: { trigger: mindfulChallenge, start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
  }

  /* Whimsy detail 2 (approved handoff §3.4): the cream background shifts a
     few percent warmer while each of these two sections is actually in
     view, easing back to standard cream before and after — one shared,
     restrained mechanism, run independently per section so neither this
     nor the sections between them (which this pass does not touch) are
     affected. */
  var warmthSections = gsap.utils.toArray(document.querySelectorAll("[data-gsap-warmth]"));

  warmthSections.forEach(function (section) {
    var overlay = section.querySelector(".mindfulness-warmth-overlay");
    if (!overlay) return;

    gsap.timeline({
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 },
    })
      .fromTo(overlay, { "--warmth": 0 }, { "--warmth": 1, ease: "none", duration: 0.5 })
      .to(overlay, { "--warmth": 0, ease: "none", duration: 0.5 });
  });

  /* Signature story: density easing into space. The photo starts slightly
     blurred, dim, and enlarged (pressure) and eases into sharp, lit, and
     settled (release) continuously as the section moves through view, tied
     directly to scroll position rather than a single on/off trigger. No
     ripples, no literal breathing loop: the quality of a slow exhale, once,
     never repeating. */
  var mindfulEditorial = document.querySelector("[data-gsap-editorial]");

  if (mindfulEditorial) {
    var mPhoto = mindfulEditorial.querySelector(".mindfulness-editorial-photo");

    if (mPhoto) {
      gsap.fromTo(
        mPhoto,
        { filter: "blur(15px)", opacity: 0.68, scale: 1.055 },
        {
          filter: "blur(0px)",
          opacity: 1,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: mindfulEditorial,
            start: "top 85%",
            end: "top 30%",
            scrub: 0.6,
          },
        }
      );
    }
  }

  /* Vertical media story: the media itself responds very gently across the
     whole section (a small scale change reading as depth, not a slideshow).
     Text never moves with it. */
  var mindfulStoryMedia = document.querySelector("[data-gsap-story-media]");

  if (mindfulStoryMedia) {
    var storyImg = mindfulStoryMedia.querySelector("img, video");
    if (storyImg) {
      gsap.fromTo(
        storyImg,
        { scale: 1.02 },
        {
          scale: 1.09,
          ease: "none",
          scrollTrigger: {
            trigger: mindfulStoryMedia.closest(".mindfulness-story"),
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        }
      );
    }
  }

  /* Generic atmospheric-video handler: plays a muted looping clip only
     while it is meaningfully visible, pauses it offscreen so nothing decodes
     video far below the viewport. No-ops today since no [data-atmo-video]
     element exists yet; activates automatically once one is added (see the
     TODO comment beside the vertical media story image). */
  var atmoVideos = document.querySelectorAll("[data-atmo-video]");

  if (atmoVideos.length && "IntersectionObserver" in window) {
    var atmoObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.35 }
    );

    atmoVideos.forEach(function (video) {
      atmoObserver.observe(video);
    });
  }
})();
