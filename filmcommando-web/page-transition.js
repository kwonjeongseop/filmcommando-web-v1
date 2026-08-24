(function () {
  var ORDER = ["Home", "About", "Service", "Packages", "Cost",
    "Estimator", "Schedule", "Process", "Cases",
    "CaseDetail", "Materials", "Review", "Booking",
    "Quote", "Notice", "Faq", "Resources", "Partner",
    "Login", "Admin"];
  var DUR = 500;
  var EASE = "cubic-bezier(.22,.61,.36,1)";
  var DIR_KEY = "pt-dir";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function nameOf(p) {
    var m = String(p || "").match(/([^\/]+)\.dc\.html/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  var current = nameOf(location.pathname);

  // ── 들어오는 애니메이션 ──
  if (!reduced) {
    var dir = null;
    try {
      dir = sessionStorage.getItem(DIR_KEY);
      sessionStorage.removeItem(DIR_KEY);
    } catch (readErr) {}

    if (dir === "forward" || dir === "back") {
      var startX = dir === "forward" ? "30%" : "-30%";
      document.body.style.transition = "none";
      document.body.style.transform = "translateX(" + startX + ")";
      document.body.style.opacity = "0.6";

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.body.style.transition =
            "transform " + DUR + "ms " + EASE + ", opacity " + DUR + "ms " + EASE;
          document.body.style.transform = "translateX(0)";
          document.body.style.opacity = "1";
        });
      });

      setTimeout(function () {
        document.body.style.transition = "";
        document.body.style.transform = "";
        document.body.style.opacity = "";
      }, DUR + 60);
    }
  }

  // ── 나가는 애니메이션 ──
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

    var curIdx = ORDER.indexOf(current);
    var tgtIdx = ORDER.indexOf(target);
    var direction = (curIdx === -1 || tgtIdx > curIdx) ? "forward" : "back";

    try { sessionStorage.setItem(DIR_KEY, direction); } catch (writeErr) {}

    document.body.style.transition =
      "transform " + DUR + "ms " + EASE + ", opacity " + DUR + "ms " + EASE;
    document.body.style.transform = "translateX(" + (direction === "forward" ? "-30%" : "30%") + ")";
    document.body.style.opacity = "0.6";

    setTimeout(function () {
      window.location.href = href;
    }, DUR - 50);
  }, true);
})();
