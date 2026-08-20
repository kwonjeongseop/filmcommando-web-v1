(function () {
  var ORDER = ["Home", "About", "Service", "Packages", "Cost", "Estimator", "Schedule", "Process",
    "Cases", "CaseDetail", "Materials", "Review", "Booking", "Quote", "Notice", "Faq", "Resources", "Partner"];
  var DUR = 520;
  var SHIFT = 44; // px — 전체 화면이 아니라 살짝 밀리는 정도
  var EASE = "cubic-bezier(.32,.72,0,1)";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function nameOf(p) {
    var m = String(p || "").match(/([^\/]+)\.dc\.html/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function whenBody(fn) {
    if (document.body) return fn();
    requestAnimationFrame(function () { whenBody(fn); });
  }

  var current = nameOf(location.pathname);

  // 들어오는 애니메이션: 오른쪽 페이지로 이동한 경우 왼쪽에서 오른쪽으로 밀려 들어옵니다.
  var dir = null;
  try { dir = sessionStorage.getItem("pt-dir"); sessionStorage.removeItem("pt-dir"); } catch (e) {}
  if (dir && !reduced) {
    whenBody(function () {
      var b = document.body;
      document.documentElement.style.overflowX = "hidden";
      b.style.willChange = "transform";
      b.style.transform = "translateX(" + (dir === "forward" ? -SHIFT : SHIFT) + "px)";
      b.style.opacity = "0";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          b.style.transition = "transform " + DUR + "ms " + EASE + ", opacity " + Math.round(DUR * 0.5) + "ms ease-out";
          b.style.transform = "translateX(0)";
          b.style.opacity = "1";
          setTimeout(function () {
            b.style.transition = "";
            b.style.transform = "";
            b.style.willChange = "";
            document.documentElement.style.overflowX = "";
          }, DUR + 60);
        });
      });
    });
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href");
    var target = nameOf(href);
    if (!target || ORDER.indexOf(target) < 0 || target === current) return;
    e.preventDefault();
    var forward = ORDER.indexOf(target) > ORDER.indexOf(current);
    try { sessionStorage.setItem("pt-dir", forward ? "forward" : "back"); } catch (err) {}
    if (reduced) { location.href = href; return; }
    var b = document.body;
    document.documentElement.style.overflowX = "hidden";
    b.style.willChange = "transform";
    b.style.transition = "transform 260ms " + EASE + ", opacity 200ms ease-in";
    b.style.transform = "translateX(" + (forward ? SHIFT : -SHIFT) + "px)";
    b.style.opacity = "0";
    setTimeout(function () { location.href = href; }, 210);
  }, true);
})();
