(function () {
  "use strict";

  /* ── 설정 ── */
  var ORDER = [
    "Home","About","Service","Packages","Cost",
    "Schedule","Cases","CaseDetail","Materials",
    "Review","Booking","Quote","Estimator","Process",
    "Notice","Faq","Resources","Partner",
    "Login","Admin"
  ];
  var DUR     = 500;
  var EASE    = "cubic-bezier(.22,.61,.36,1)";
  var DIR_KEY = "pt-dir";
  var reduced = window.matchMedia &&
    window.matchMedia(
      "(prefers-reduced-motion:reduce)").matches;

  /* ── 페이지 이름 추출 ── */
  function nameOf(path) {
    return path.split("/").pop()
      .replace(".dc.html","").replace(".html","");
  }

  /* ── 이동 방향 계산 ── */
  function dirOf(from, to) {
    var fi = ORDER.indexOf(from);
    var ti = ORDER.indexOf(to);
    if (fi < 0 || ti < 0) return "forward";
    return ti >= fi ? "forward" : "back";
  }

  var current = nameOf(location.pathname);

  /* ── 들어오는 애니메이션 ── */
  (function () {
    var dir = null;
    try {
      dir = sessionStorage.getItem(DIR_KEY);
      sessionStorage.removeItem(DIR_KEY);
    } catch (e) {}

    /* dc-runtime slideInRight 무력화 */
    (function() {
      var s = document.getElementById('pt-slide-kill');
      if (!s) {
        s = document.createElement('style');
        s.id = 'pt-slide-kill';
        s.textContent =
          '.fc-slide-in{' +
            'animation:none!important;' +
            'opacity:1!important;' +
          '}';
        document.head.appendChild(s);
      }
    })();

    if (dir && !reduced) {
      var b = document.body;
      var startX = dir === "forward"
        ? "translateX(60%)" : "translateX(-60%)";
      b.style.willChange = "transform";
      b.style.opacity    = "0";
      b.style.transform  = startX;
      requestAnimationFrame(function () {
        b.style.transition =
          "transform " + DUR + "ms " + EASE +
          ", opacity " + Math.round(DUR * 0.8) +
          "ms " + EASE;
        b.style.transform = "translateX(0)";
        b.style.opacity   = "1";
        setTimeout(function () {
          b.style.transition = "";
          b.style.transform  = "";
          b.style.opacity    = "";
          b.style.willChange = "";
        }, DUR + 200);
      });
    }
  })();

  /* ── 링크 클릭 핸들러 ── */
  if (reduced) return;

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.href;
    if (!href) return;

    /* modifier 키 가드 */
    if (e.metaKey || e.ctrlKey ||
        e.shiftKey || e.button !== 0) return;

    try {
      var u = new URL(href);
      if (u.origin !== location.origin) return;
      var to = nameOf(u.pathname);
      if (ORDER.indexOf(to) < 0) return;
      /* 현재 페이지 링크 — 기본 동작 차단 */
      if (u.pathname === location.pathname) {
        e.preventDefault();
        return;
      }
    } catch (_) { return; }

    /* Booking 로그인 가드 */
    var toName = nameOf(new URL(href).pathname);
    if (toName === "Booking") {
      var user = null;
      try {
        user = localStorage.getItem("fc_user");
      } catch (_) {}
      if (!user) {
        e.preventDefault();
        location.href = "./Login.dc.html";
        return;
      }
    }

    e.preventDefault();

    var direction = dirOf(
      current, nameOf(new URL(href).pathname));

    /* sessionStorage에 방향 저장 후 즉시 이동 */
    try {
      sessionStorage.setItem(DIR_KEY, direction);
    } catch (_) {}
    location.href = href;

  }, true);

})();
