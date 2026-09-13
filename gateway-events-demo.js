/* Gateway Regional Council: Events Grid/Calendar demo.

   This is a portfolio recreation of the Grid/Calendar interaction built for
   GRC's real Events page in Wix. It is standalone HTML/CSS/JS, not the
   production Wix code (which depends on $w, Wix Repeaters, and a Wix
   backend, none of which exist here). The event data below is placeholder
   sample data, not GRC's real calendar: see the note in the case study for
   how to get real event data swapped in.

   Fully functional UI, not decorative motion, so this file has no GSAP
   dependency and does not check prefers-reduced-motion: filtering, search,
   and calendar navigation should work identically for every visitor.

   Visual pass (Aug 2026): restyled to sit closer to the real Wix page's
   look — colored category icons, a dark "today" cell and a distinct
   "has events" cell, a labeled Date/Time/Location layout, and a compact
   pagination header on the detail panel. Structure and logic below are
   unchanged; only what render*() outputs as markup has grown. */
(function () {
  "use strict";

  var root = document.querySelector("[data-gateway-demo]");
  if (!root) return;

  /* Focus areas and colors match the real GRC site's own "Our Focus Areas"
     list and color-coding (confirmed from the project demo recording):
     Public Health, Housing, Equity & Economics, Social Justice, Art &
     Humanities, Research & Innovation. Each also gets a small line-icon,
     used as a stand-in for the real page's event image/logo slot — this
     recreation doesn't fabricate photos for placeholder events, so an
     icon keyed to the real category system fills that visual role instead. */
  var FOCUS_AREAS = {
    health: {
      label: "Public Health",
      color: "#586832",
      icon: '<path d="M10 3v14M3 10h14"/>',
    },
    housing: {
      label: "Housing",
      color: "#5593bb",
      icon: '<path d="M3.5 10.5 10 4l6.5 6.5M5.5 9v7h9V9"/>',
    },
    economic: {
      label: "Equity & Economics",
      color: "#c99a1e",
      icon: '<path d="M4.5 16V10.5M10 16V5.5M15.5 16V12"/>',
    },
    justice: {
      label: "Social Justice",
      color: "#5b586e",
      icon: '<path d="M10 3.5v13M4.5 5.5h11M4.5 5.5 2.5 10h4L4.5 5.5ZM15.5 5.5l-2 4.5h4l-2-4.5ZM7 16.5h6"/>',
    },
    arts: {
      label: "Art & Humanities",
      color: "#d68033",
      icon: '<circle cx="10" cy="10" r="6.5"/><circle cx="7.4" cy="8" r="0.9" fill="currentColor" stroke="none"/><circle cx="12.6" cy="8" r="0.9" fill="currentColor" stroke="none"/><circle cx="10" cy="13" r="0.9" fill="currentColor" stroke="none"/>',
    },
    research: {
      label: "Research & Innovation",
      color: "#3a3a35",
      icon: '<circle cx="8.5" cy="8.5" r="5"/><path d="m16 16-3.8-3.8"/>',
    },
  };

  /* Demo data for this recreation, not GRC's real calendar (the section
     copy above already says so once, clearly). Generic enough that nothing
     here reads as a real GRC program. */
  var EVENTS = [
    { id: 1, title: "Community Health Info Session", date: "2026-08-03", time: "10:00 AM", location: "Community Center", focus: "health", description: "A drop-in info session open to residents and families." },
    { id: 2, title: "First-Time Homebuyer Workshop", date: "2026-08-06", time: "5:30 PM", location: "Resource Hub", focus: "housing", description: "A workshop walking through the basics of the home-buying process." },
    { id: 3, title: "Small Business Grant Clinic", date: "2026-08-06", time: "1:00 PM", location: "Virtual", focus: "economic", description: "Drop-in sessions for local business owners exploring grant opportunities." },
    { id: 4, title: "Know Your Rights Session", date: "2026-08-12", time: "6:00 PM", location: "Community Center", focus: "justice", description: "A legal-education session covering resident rights and resources." },
    { id: 5, title: "Community Mural Day", date: "2026-08-15", time: "11:00 AM", location: "Neighborhood Plaza", focus: "arts", description: "A hands-on community art event open to all ages." },
    { id: 6, title: "Wellness Check-In Circle", date: "2026-08-19", time: "9:00 AM", location: "Community Center", focus: "health", description: "A recurring, low-pressure space for residents to check in on wellbeing." },
    { id: 7, title: "Tenant Support Office Hours", date: "2026-08-19", time: "2:00 PM", location: "Resource Hub", focus: "housing", description: "Drop-in office hours for tenant questions and support." },
    { id: 8, title: "Workforce Readiness Workshop", date: "2026-08-24", time: "4:00 PM", location: "Community Center", focus: "economic", description: "A skills-building workshop focused on job readiness." },
    { id: 9, title: "Youth Poetry Night", date: "2026-08-27", time: "6:30 PM", location: "Neighborhood Plaza", focus: "arts", description: "A community showcase spotlighting youth spoken-word performers." },
    { id: 10, title: "Community Data Findings Briefing", date: "2026-08-12", time: "12:00 PM", location: "Virtual", focus: "research", description: "A briefing sharing recent community research findings." },
  ];

  var TODAY = "2026-08-24";
  var WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  var state = {
    view: "calendar",
    filter: "all",
    search: "",
    year: 2026,
    month: 7,
    selectedDate: null,
    selectedEventIndex: 0,
  };

  var els = {
    views: Array.prototype.slice.call(root.querySelectorAll("[data-demo-view]")),
    filters: Array.prototype.slice.call(root.querySelectorAll("[data-demo-filter]")),
    search: root.querySelector("#gatewayDemoSearch"),
    calView: root.querySelector("[data-demo-calendar-view]"),
    gridView: root.querySelector("[data-demo-grid-view]"),
    calMonth: root.querySelector("[data-demo-cal-month]"),
    calGrid: root.querySelector("[data-demo-cal-grid]"),
    calPrev: root.querySelector("[data-demo-cal-prev]"),
    calNext: root.querySelector("[data-demo-cal-next]"),
    calToday: root.querySelector("[data-demo-cal-today]"),
    detail: root.querySelector("[data-demo-detail]"),
  };

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function isoDate(year, month, day) {
    return year + "-" + pad(month + 1) + "-" + pad(day);
  }

  function matchesFilters(event) {
    if (state.filter !== "all" && event.focus !== state.filter) return false;
    if (state.search) {
      var needle = state.search.toLowerCase();
      if (event.title.toLowerCase().indexOf(needle) === -1) return false;
    }
    return true;
  }

  function eventsOn(dateStr) {
    return EVENTS.filter(function (event) {
      return event.date === dateStr && matchesFilters(event);
    });
  }

  function iconMarkup(focusKey) {
    var area = FOCUS_AREAS[focusKey];
    return (
      '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewBox="0 0 20 20">' +
      area.icon +
      "</svg>"
    );
  }

  function setView(view) {
    state.view = view;
    els.views.forEach(function (button) {
      var active = button.dataset.demoView === view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.setAttribute("tabindex", active ? "0" : "-1");
    });
    els.calView.hidden = view !== "calendar";
    els.gridView.hidden = view !== "grid";
    if (view === "grid") renderGrid();
  }

  function setFilter(filter) {
    state.filter = filter;
    els.filters.forEach(function (button) {
      var active = button.dataset.demoFilter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderCalendar();
    if (state.view === "grid") renderGrid();
    if (state.selectedDate) renderDetail();
  }

  function monthLabel(year, month) {
    var names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return names[month] + " " + year;
  }

  function renderCalendar() {
    els.calMonth.textContent = monthLabel(state.year, state.month);

    var firstOfMonth = new Date(Date.UTC(state.year, state.month, 1));
    var firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // Monday-start
    var daysInMonth = new Date(Date.UTC(state.year, state.month + 1, 0)).getUTCDate();
    var daysInPrevMonth = new Date(Date.UTC(state.year, state.month, 0)).getUTCDate();

    var cells = [];
    for (var lead = firstWeekday - 1; lead >= 0; lead--) {
      cells.push({ day: daysInPrevMonth - lead, outside: true, date: null });
    }
    for (var day = 1; day <= daysInMonth; day++) {
      cells.push({ day: day, outside: false, date: isoDate(state.year, state.month, day) });
    }
    while (cells.length % 7 !== 0) {
      var trailDay = cells.length - (firstWeekday + daysInMonth) + 1;
      cells.push({ day: trailDay, outside: true, date: null });
    }

    var html = "";
    cells.forEach(function (cell) {
      if (cell.outside) {
        html += '<span class="gateway-demo-cal-cell gateway-demo-cal-cell--outside">' + cell.day + "</span>";
        return;
      }

      var dayEvents = eventsOn(cell.date);
      var isToday = cell.date === TODAY;
      var isSelected = cell.date === state.selectedDate;
      var classes = "gateway-demo-cal-cell";
      if (isToday) classes += " is-today";
      if (isSelected) classes += " is-selected";
      if (dayEvents.length) classes += " has-events";

      var dots = dayEvents
        .slice(0, 3)
        .map(function (event) {
          return '<i class="gateway-demo-cal-dot" style="background:' + FOCUS_AREAS[event.focus].color + '"></i>';
        })
        .join("");

      html +=
        '<button class="' +
        classes +
        '" data-demo-cal-date="' +
        cell.date +
        '" type="button" aria-pressed="' +
        isSelected +
        '" aria-label="' +
        cell.day +
        (dayEvents.length ? ", " + dayEvents.length + " event" + (dayEvents.length > 1 ? "s" : "") : ", no events") +
        '">' +
        '<span class="gateway-demo-cal-daynum">' +
        cell.day +
        (dayEvents.length > 1 ? '<span class="gateway-demo-cal-count">(' + dayEvents.length + ")</span>" : "") +
        "</span>" +
        (dots ? '<span class="gateway-demo-cal-dots">' + dots + "</span>" : "") +
        "</button>";
    });

    els.calGrid.innerHTML = html;

    Array.prototype.slice.call(els.calGrid.querySelectorAll("[data-demo-cal-date]")).forEach(function (button) {
      button.addEventListener("click", function () {
        selectDate(button.dataset.demoCalDate);
      });
    });
  }

  function fieldRow(label, value) {
    return (
      '<p class="gateway-demo-field"><span class="gateway-demo-field-label">' +
      label +
      "</span>" +
      value +
      "</p>"
    );
  }

  function renderGrid() {
    var filtered = EVENTS.filter(matchesFilters).sort(function (a, b) {
      return a.date < b.date ? -1 : 1;
    });

    if (!filtered.length) {
      els.gridView.innerHTML = '<p class="gateway-demo-empty">No events match that search and filter combination.</p>';
      return;
    }

    els.gridView.innerHTML = filtered
      .map(function (event) {
        var area = FOCUS_AREAS[event.focus];
        return (
          '<article class="gateway-demo-card">' +
          '<div class="gateway-demo-card-cover" style="background:' +
          area.color +
          '">' +
          '<span class="gateway-demo-card-badge">' +
          iconMarkup(event.focus) +
          "</span>" +
          "</div>" +
          '<div class="gateway-demo-card-body">' +
          '<span class="gateway-demo-card-focus" style="background:' +
          area.color +
          '">' +
          area.label +
          "</span>" +
          '<p class="gateway-demo-card-title">' +
          event.title +
          "</p>" +
          fieldRow("Date", formatDateLabel(event.date)) +
          fieldRow("Time", event.time) +
          fieldRow("Location", event.location) +
          '<span class="gateway-demo-card-cta" aria-hidden="true">Learn more &rarr;</span>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function formatDateLabel(dateStr) {
    var parts = dateStr.split("-").map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    var names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return names[d.getUTCMonth()] + " " + d.getUTCDate();
  }

  function selectDate(dateStr) {
    state.selectedDate = dateStr;
    state.selectedEventIndex = 0;
    renderCalendar();
    renderDetail();
  }

  function renderDetail() {
    if (!state.selectedDate) {
      els.detail.innerHTML = "";
      return;
    }

    var dayEvents = eventsOn(state.selectedDate);

    if (!dayEvents.length) {
      els.detail.innerHTML =
        '<div class="gateway-demo-detail-panel"><p class="gateway-demo-detail-date">' +
        formatDateLabel(state.selectedDate) +
        "</p>" +
        '<p class="gateway-demo-empty">No events on this date' +
        (state.filter !== "all" || state.search ? " matching the current search or filter." : ".") +
        "</p></div>";
      return;
    }

    if (state.selectedEventIndex >= dayEvents.length) state.selectedEventIndex = 0;
    var event = dayEvents[state.selectedEventIndex];
    var area = FOCUS_AREAS[event.focus];
    var hasMultiple = dayEvents.length > 1;

    els.detail.innerHTML =
      '<div class="gateway-demo-detail-panel">' +
      '<div class="gateway-demo-detail-head">' +
      '<p class="gateway-demo-detail-date">' +
      formatDateLabel(state.selectedDate) +
      "</p>" +
      (hasMultiple
        ? '<div class="gateway-demo-detail-pager"><button aria-label="Previous event" data-demo-cycle="prev" type="button">&lsaquo;</button><span>' +
          (state.selectedEventIndex + 1) +
          "/" +
          dayEvents.length +
          '</span><button aria-label="Next event" data-demo-cycle="next" type="button">&rsaquo;</button></div>'
        : "") +
      "</div>" +
      '<div class="gateway-demo-card-cover gateway-demo-detail-cover" style="background:' +
      area.color +
      '">' +
      '<span class="gateway-demo-card-icon">' +
      iconMarkup(event.focus) +
      "</span>" +
      "</div>" +
      '<span class="gateway-demo-card-focus" style="background:' +
      area.color +
      '">' +
      area.label +
      "</span>" +
      '<p class="gateway-demo-detail-title">' +
      event.title +
      "</p>" +
      fieldRow("Date", formatDateLabel(event.date)) +
      fieldRow("Time", event.time) +
      fieldRow("Location", event.location) +
      '<p class="gateway-demo-detail-desc">' +
      event.description +
      "</p>" +
      "</div>";

    if (hasMultiple) {
      els.detail.querySelector('[data-demo-cycle="prev"]').addEventListener("click", function () {
        state.selectedEventIndex = (state.selectedEventIndex - 1 + dayEvents.length) % dayEvents.length;
        renderDetail();
      });
      els.detail.querySelector('[data-demo-cycle="next"]').addEventListener("click", function () {
        state.selectedEventIndex = (state.selectedEventIndex + 1) % dayEvents.length;
        renderDetail();
      });
    }
  }

  els.views.forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.dataset.demoView);
    });

    button.addEventListener("keydown", function (event) {
      var currentIndex = els.views.indexOf(button);
      var nextIndex = currentIndex;

      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % els.views.length;
      else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + els.views.length) % els.views.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = els.views.length - 1;
      else return;

      event.preventDefault();
      setView(els.views[nextIndex].dataset.demoView);
      els.views[nextIndex].focus();
    });
  });

  els.filters.forEach(function (button) {
    button.addEventListener("click", function () {
      setFilter(button.dataset.demoFilter);
    });
  });

  if (els.search) {
    els.search.addEventListener("input", function () {
      state.search = els.search.value.trim();
      renderCalendar();
      if (state.view === "grid") renderGrid();
      if (state.selectedDate) renderDetail();
    });
  }

  els.calPrev.addEventListener("click", function () {
    state.month -= 1;
    if (state.month < 0) {
      state.month = 11;
      state.year -= 1;
    }
    renderCalendar();
  });

  els.calNext.addEventListener("click", function () {
    state.month += 1;
    if (state.month > 11) {
      state.month = 0;
      state.year += 1;
    }
    renderCalendar();
  });

  els.calToday.addEventListener("click", function () {
    var parts = TODAY.split("-").map(Number);
    state.year = parts[0];
    state.month = parts[1] - 1;
    renderCalendar();
    selectDate(TODAY);
  });

  renderCalendar();
  selectDate(TODAY);
})();
