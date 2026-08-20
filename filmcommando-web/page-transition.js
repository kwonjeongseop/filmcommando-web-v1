(function () {
  var ORDER = ["Home", "About", "Service", "Packages", "Cost", "Estimator", "Schedule", "Process",
    "Cases", "CaseDetail", "Materials", "Review", "Booking", "Quote", "Notice", "Faq", "Resources", "Partner"];
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement('style');
  style.textContent = `
    @keyframes slideOutLeft {
      from { transform:translateX(0); opacity:1; }
      to   { transform:translateX(-40px); opacity:0; }
    }
    @keyframes slideInRight {
      from { transform:translateX(40px); opacity:0; }
      to   { transform:translateX(0); opacity:1; }
    }
    .fc-slide-out {
      animation: slideOutLeft 0.28s cubic-bezier(0.4,0,0.2,1) forwards;
      pointer-events: none;
    }
    .fc-slide-in {
      animation: slideInRight 0.28s cubic-bezier(0.4,0,0.2,1) forwards;
    }
  `;
  document.head.appendChild(style);

  function nameOf(p) {
    var m = String(p || "").match(/([^\/]+)\.dc\.html/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  var current = nameOf(location.pathname);

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href");
    var target = nameOf(href);
    if (!target || ORDER.indexOf(target) < 0 || target === current) return;
    if (target === "Booking") {
      var loggedIn = false;
      try { loggedIn = !!localStorage.getItem("fc_user"); } catch (guardErr) {}
      if (!loggedIn) { e.preventDefault(); location.href = "./Login.dc.html"; return; }
    }
    e.preventDefault();
    if (reduced) { location.href = href; return; }
    document.body.classList.add('fc-slide-out');
    setTimeout(function () {
      window.location.href = href;
    }, 280);
  }, true);
})();
