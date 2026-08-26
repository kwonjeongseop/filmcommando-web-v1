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
  var DUR     = 600;
  var EASE    = "cubic-bezier(.22,.61,.36,1)";
  var DIR_KEY = "pt-dir";
  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion:reduce)").matches;

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

  /* ── iframe 오버레이 관리 (단일 인스턴스) ── */
  var preloadFrame     = null;
  var preloadHref      = null;
  var isTransitioning  = false;

  function ensureOverlayStyle() {
    if (document.getElementById("pt-style")) return;
    var s = document.createElement("style");
    s.id = "pt-style";
    s.textContent = [
      "#pt-overlay{",
        "position:fixed;top:0;left:0;",
        "width:100%;height:100%;",
        "border:none;z-index:9999;",
        "pointer-events:none;",
        "will-change:transform;",
        "transform:translateX(100%);",
        "background:#F4F1EA;",
      "}",
      "#pt-overlay.back{transform:translateX(-100%);}",
    ].join("");
    document.head.appendChild(s);
  }

  function getOrCreateIframe(href) {
    if (isTransitioning) return preloadFrame;
    if (preloadFrame && preloadHref === href) return preloadFrame;
    if (preloadFrame && preloadFrame.parentNode) {
      preloadFrame.parentNode.removeChild(preloadFrame);
    }
    ensureOverlayStyle();
    var f = document.createElement("iframe");
    f.id  = "pt-overlay";
    f.src = href;
    f.style.cssText = [
      "position:fixed;top:0;left:0;",
      "width:100%;height:100%;",
      "border:none;z-index:9999;",
      "pointer-events:none;",
      "will-change:transform;",
      "transform:translateX(100%);",
      "background:#F4F1EA;",
    ].join("");
    f.addEventListener("load", function() {
      f.dataset.loaded = "1";
    });
    document.body.appendChild(f);
    preloadFrame = f;
    preloadHref  = href;
    return f;
  }

  /* ── hover → 프리로드 ── */
  function onLinkEnter(e) {
    var a = e.currentTarget;
    var href = a.href;
    if (!href || href === location.href) return;
    var to = nameOf(new URL(href).pathname);
    if (ORDER.indexOf(to) < 0) return;
    getOrCreateIframe(href);
  }

  /* ── 전환 실행 ── */
  function runTransition(href, direction) {
    isTransitioning = true;
    var frame = getOrCreateIframe(href);

    var startX = direction === "forward"
      ? "translateX(100%)" : "translateX(-100%)";
    frame.style.transition = "none";
    frame.style.transform  = startX;
    if (direction === "back") {
      frame.classList.add("back");
    } else {
      frame.classList.remove("back");
    }
    frame.style.pointerEvents = "none";

    document.body.style.transition = "none";
    document.body.style.willChange = "transform";

    requestAnimationFrame(function () {
      var trans = "transform " + DUR + "ms " + EASE +
        ", opacity " + Math.round(DUR*0.8) + "ms " + EASE;

      frame.style.transition = trans;
      frame.style.transform  = "translateX(0)";
      frame.style.opacity    = "1";

      document.body.style.transition = trans;
      document.body.style.transform  = direction === "forward"
        ? "translateX(-30%)" : "translateX(30%)";
      document.body.style.opacity    = "0.4";

      setTimeout(function () {
        try {
          sessionStorage.setItem(DIR_KEY, direction);
        } catch (e) {}
        location.href = href;
      }, DUR + 250);
    });
  }

  /* ── 들어오는 애니메이션 ── */
  (function () {
    var dir = null;
    try {
      dir = sessionStorage.getItem(DIR_KEY);
      sessionStorage.removeItem(DIR_KEY);
    } catch (e) {}

    if (dir && !reduced) {
      var b = document.body;
      var startX = dir === "forward"
        ? "translateX(30%)" : "translateX(-30%)";
      b.style.willChange = "transform";
      b.style.opacity    = "0";
      b.style.transform  = startX;
      requestAnimationFrame(function () {
        b.style.opacity  = "0.4";
        b.style.transition =
          "transform " + DUR + "ms " + EASE +
          ", opacity " + Math.round(DUR*0.8) + "ms " + EASE;
        b.style.transform = "translateX(0)";
        b.style.opacity   = "1";
        setTimeout(function () {
          b.style.transition = "";
          b.style.transform  = "";
          b.style.opacity    = "";
          b.style.willChange = "";
        }, DUR + 300);
      });
    }
  })();

  /* ── 링크 이벤트 등록 ── */
  if (reduced) return;

  document.addEventListener("click", function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.href;
    if (!href) return;
    try {
      var u = new URL(href);
      if (u.origin !== location.origin) return;
      var to = nameOf(u.pathname);
      if (ORDER.indexOf(to) < 0) return;
      if (u.pathname === location.pathname) {
        e.preventDefault();
        return;
      }
    } catch (_) { return; }

    var direction = dirOf(current, to);

    if (to === "Booking") {
      var user = null;
      try { user = localStorage.getItem("fc_user"); } catch(_) {}
      if (!user) {
        e.preventDefault();
        location.href = "./Login.dc.html";
        return;
      }
    }

    e.preventDefault();
    if (reduced) {
      location.href = href;
      return;
    }
    var frame = getOrCreateIframe(href);
    if (frame && !frame.dataset.loaded) {
      frame.addEventListener("load", function onLoad() {
        frame.removeEventListener("load", onLoad);
        frame.dataset.loaded = "1";
        runTransition(href, direction);
      });
    } else {
      runTransition(href, direction);
    }
  }, true);

  document.addEventListener("mouseover", function (e) {
    if (isTransitioning) return;
    var a = e.target.closest("a[href]");
    if (!a) return;
    onLinkEnter({ currentTarget: a });
  });

})();
