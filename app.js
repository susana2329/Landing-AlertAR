(function () {
  var B = document.body,
    L = document.getElementById("loc"),
    rm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var sl = [].slice.call(document.querySelectorAll(".stage .slide")),
    dots = [].slice.call(document.querySelectorAll("#dots button")),
    cap = document.getElementById("capt"),
    names = ["Alertas activas", "Mapa interactivo", "Reportes ciudadanos", "Mochila de prevención"],
    cur = 0,
    tm;
  function go(n) {
    cur = n;
    sl.forEach(function (s, k) {
      s.classList.toggle("on", k == n);
    });
    dots.forEach(function (x, k) {
      x.classList.toggle("on", k == n);
    });
    cap.textContent = names[n];
  }
  function auto() {
    clearInterval(tm);
    if (!rm)
      tm = setInterval(function () {
        go((cur + 1) % sl.length);
      }, 3600);
  }
  dots.forEach(function (x, k) {
    x.onclick = function () {
      go(k);
      auto();
    };
  });
  auto();
  var sh = document.getElementById("show");
  [
    ["map", 1, 18],
    ["alert", 0, -18],
    ["bag", -1, 18],
  ].forEach(function (o) {
    var s = document.querySelector('.stage .slide[data-k="' + o[0] + '"]').cloneNode(true);
    s.className = "slide on";
    var c = document.createElement("div");
    c.className = "sc";
    c.appendChild(s);
    var p = document.createElement("div");
    p.className = "ph";
    p.style.setProperty("--d", o[1]);
    p.style.setProperty("--y", o[2]);
    p.appendChild(c);
    sh.appendChild(p);
  });
  var cv = document.getElementById("sky");
  if (rm) {
    sh.style.setProperty("--t", 0);
    L.remove();
    B.classList.remove("lock");
    return;
  }
  var t = document.getElementById("tilt"),
    hero = document.getElementById("inicio");
  hero.addEventListener("mousemove", function (e) {
    var x = e.clientX / innerWidth - 0.5,
      y = e.clientY / innerHeight - 0.5;
    t.style.transform = "rotateY(" + x * -12 + "deg) rotateX(" + y * 8 + "deg)";
  });
  hero.addEventListener("mouseleave", function () {
    t.style.transform = "";
  });
  function sc() {
    var r = sh.getBoundingClientRect(),
      p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.75)));
    sh.style.setProperty("--t", ((1 - p) * 40).toFixed(1));
  }
  addEventListener("scroll", sc, { passive: true });
  sc();
  /* ---- cielo: lluvia + rayos ---- */
  var g = cv.getContext("2d"),
    W,
    H,
    dr = [],
    bolt = null,
    lf = 0,
    nextL = Infinity;
  function mk(r) {
    var z = Math.random();
    return {
      x: Math.random() * (W + 200) - 40,
      y: r ? Math.random() * H : -50,
      l: 12 + z * 26,
      v: 11 + z * 17,
      a: 0.1 + z * 0.3,
    };
  }
  function sz() {
    W = cv.width = innerWidth;
    H = cv.height = innerHeight;
    dr = [];
    for (var i = 0, n = Math.min(260, ((W * H) / 6000) | 0); i < n; i++) dr.push(mk(true));
  }
  function mkBolt() {
    var x = W * (0.1 + Math.random() * 0.8),
      y = 0,
      p = [[x, 0]],
      br = [];
    while (y < H * (0.45 + Math.random() * 0.25)) {
      y += 14 + Math.random() * 26;
      x += (Math.random() - 0.5) * 56;
      p.push([x, y]);
      if (Math.random() < 0.14) {
        var bx = x,
          by = y,
          q = [[bx, by]];
        for (var k = 0; k < 5; k++) {
          by += 12 + Math.random() * 18;
          bx += (Math.random() - 0.2) * 40;
          q.push([bx, by]);
        }
        br.push(q);
      }
    }
    bolt = { p: p, br: br };
  }
  function strike() {
    mkBolt();
    lf = 1;
    if (Math.random() < 0.45)
      setTimeout(
        function () {
          lf = 0.85;
        },
        150 + Math.random() * 80,
      );
  }
  function line(p) {
    g.beginPath();
    p.forEach(function (q, k) {
      k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
    });
    g.stroke();
  }
  function sky(now) {
    g.clearRect(0, 0, W, H);
    g.lineCap = "round";
    g.lineJoin = "round";
    for (var i = 0; i < dr.length; i++) {
      var q = dr[i];
      g.strokeStyle = "rgba(170,200,220," + q.a + ")";
      g.lineWidth = 0.7 + q.a * 2;
      g.beginPath();
      g.moveTo(q.x, q.y);
      g.lineTo(q.x + q.l * 0.15, q.y - q.l);
      g.stroke();
      q.y += q.v;
      q.x -= q.v * 0.15;
      if (q.y - q.l > H) dr[i] = mk(false);
    }
    if (lf > 0.03) {
      if (bolt) {
        g.strokeStyle = "rgba(228,242,255," + Math.min(1, lf * 1.2) + ")";
        g.lineWidth = 2.2;
        line(bolt.p);
        g.strokeStyle = "rgba(228,242,255," + lf * 0.6 + ")";
        g.lineWidth = 1.2;
        bolt.br.forEach(line);
      }
      g.fillStyle = "rgba(160,198,230," + lf * 0.1 + ")";
      g.fillRect(0, 0, W, H);
    }
    lf *= 0.92;
    if (now > nextL) {
      strike();
      nextL = now + 7000 + Math.random() * 6000;
    }
    requestAnimationFrame(sky);
  }
  sz();
  addEventListener("resize", sz);
  requestAnimationFrame(sky);
  /* ---- intro: ubicación (lento, lento… y acelera al final) ---- */
  var ld = document.getElementById("ld"),
    lm = L.querySelector(".lm"),
    rg = document.getElementById("ringx"),
    uc = L.querySelector(".ld u"),
    dt = L.querySelector(".ld b"),
    fl = document.getElementById("fl"),
    X,
    Y,
    maxR,
    t0 = performance.now(),
    dur = 1700,
    unl = false,
    hit = false;
  var ivs = [1150, 1150, 1150, 1150, 880, 640, 470, 340, 250, 185, 150],
    pt = [],
    tt = 500,
    np = 0,
    last = 0,
    lastIv = 1150;
  ivs.forEach(function (v) {
    pt.push(tt);
    tt += v;
  });
  var exp = tt;
  function setup() {
    var s = document.querySelector(".stage").getBoundingClientRect();
    X = s.left + s.width * 0.596;
    Y = s.top + s.height * 0.485;
    if (X < 60 || X > innerWidth - 60 || Y < 60 || Y > innerHeight - 60) {
      X = innerWidth * (innerWidth < 900 ? 0.5 : 0.69);
      Y = innerHeight * (innerWidth < 900 ? 0.52 : 0.58);
    }
    ld.style.left = X + "px";
    ld.style.top = Y + "px";
    maxR = Math.hypot(Math.max(X, innerWidth - X), Math.max(Y, innerHeight - Y)) + 60;
  }
  function ease(k) {
    return Math.pow(k, 2.4);
  }
  function ring(v) {
    var e = document.createElement("i");
    ld.appendChild(e);
    var a = e.animate(
      [
        { transform: "scale(.2)", opacity: 0.9 },
        { transform: "scale(2.8)", opacity: 0 },
      ],
      { duration: Math.max(600, v * 2.4), easing: "ease-out" },
    );
    a.onfinish = function () {
      e.remove();
    };
  }
  function step(now) {
    var el = now - t0,
      k = (el - exp) / dur;
    if (k <= 0) {
      while (np < pt.length && el >= pt[np]) {
        last = pt[np];
        lastIv = (np + 1 < pt.length ? pt[np + 1] : exp) - pt[np];
        ring(lastIv);
        np++;
      }
      var I = np ? Math.max(0, 1 - (el - last) / lastIv) : 0;
      I *= I;
      uc.style.opacity = (0.3 + 0.7 * I).toFixed(2);
      uc.style.transform = "scale(" + (0.9 + 0.14 * I).toFixed(3) + ")";
      dt.style.transform = "scale(" + (1 + 0.4 * I).toFixed(3) + ")";
      fl.style.opacity = (0.07 * (1 - I)).toFixed(3);
    }
    if (k > 0) {
      k = Math.min(1, k);
      var r = maxR * ease(k);
      if (!unl) {
        unl = true;
        fl.style.opacity = 0;
        B.classList.remove("lock");
      }
      if (k > 0.72 && !hit) {
        hit = true;
        strike();
        nextL = now + 8000 + Math.random() * 4000;
      }
      lm.style.webkitMaskImage = lm.style.maskImage =
        "radial-gradient(circle at " + X + "px " + Y + "px,transparent " + r + "px,#000 " + (r + 1) + "px)";
      rg.style.cssText =
        "opacity:" +
        (k < 0.92 ? 1 : 0) +
        ";left:" +
        (X - r) +
        "px;top:" +
        (Y - r) +
        "px;width:" +
        2 * r +
        "px;height:" +
        2 * r +
        "px";
      if (k >= 1) {
        L.remove();
        return;
      }
    }
    requestAnimationFrame(step);
  }
  setup();
  addEventListener("resize", setup);
  addEventListener("load", setup);
  document.getElementById("skip").onclick = function () {
    exp = Math.min(exp, performance.now() - t0);
  };
  requestAnimationFrame(step);
})();
