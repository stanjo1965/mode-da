// 사이트 공용 스크립트 — 테마 전환, 로그인 상태 표시, 인증 API 호출.
(function () {
  var API = '/api';
  var PORT = 4300;

  // ── 테마 (file:// 여부와 무관하게 항상 동작) ──────────────────────
  try {
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  } catch (e0) { /* 저장소 차단 환경은 시스템 테마를 따른다 */ }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('#tg');
    if (!t) return;
    var cur = document.documentElement.getAttribute('data-theme');
    if (!cur) cur = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e1) { /* noop */ }
  });

  // ── file:// 로 직접 연 경우 ───────────────────────────────────────
  // 회원가입·로그인은 서버가 있어야 동작한다(file:// 에서는 /api 가 file:///C:/api 로 잡힌다).
  // 로컬 서버가 떠 있으면 같은 페이지의 http 주소로 넘기고, 아니면 실행 방법을 안내한다.
  if (location.protocol === 'file:') {
    var file = (location.pathname.split('/').pop() || 'landing.html');
    var target = 'http://localhost:' + PORT + '/' + file + location.search + location.hash;

    // 헤더·조건부 영역은 비로그인 상태로 그려 둔다(빈 화면 방지).
    function paintOut() {
      document.querySelectorAll('[data-auth-slot]').forEach(function (slot) {
        slot.innerHTML = '<a href="login.html" class="btn btn-line sm">로그인</a>' +
          '<a href="signup.html" class="btn btn-primary sm">회원가입</a>';
      });
      document.querySelectorAll('[data-when-in]').forEach(function (el) { el.style.display = 'none'; });
      document.querySelectorAll('[data-when-out]').forEach(function (el) { el.style.display = ''; });
    }
    if (document.readyState !== 'loading') paintOut();
    else document.addEventListener('DOMContentLoaded', paintOut);

    function banner(url) {
      function draw() {
        var b = document.createElement('div');
        b.setAttribute('role', 'alert');
        b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:16px 20px;' +
          'background:#141B29;color:#EAEEF5;font:14px/1.6 Pretendard,-apple-system,"Malgun Gothic",sans-serif;' +
          'border-top:2px solid #F5A524;box-shadow:0 -8px 30px rgba(0,0,0,.35)';
        b.innerHTML =
          '<b style="color:#F5A524">이 페이지는 서버를 통해 열어야 로그인·회원가입이 동작합니다.</b><br>' +
          '<span style="color:#B4BECE">터미널에서 아래를 실행한 뒤 </span>' +
          '<a href="' + url + '" style="color:#7FB2FF;font-weight:700">' + url + '</a>' +
          '<span style="color:#B4BECE"> 로 접속하세요.</span>' +
          '<pre style="margin:10px 0 0;padding:10px 12px;background:#0A0E17;border-radius:8px;' +
          'font:12.5px/1.5 Consolas,monospace;color:#9FB2CC;overflow-x:auto">' +
          'cd company/course/ax-consultant-course\nnpm install\nnpm start</pre>';
        document.body.appendChild(b);
      }
      if (document.body) draw();
      else document.addEventListener('DOMContentLoaded', draw);
    }

    var probe = document.createElement('script');
    probe.src = 'http://localhost:' + PORT + '/assets/ping.js';
    probe.onload = function () { location.replace(target); };
    probe.onerror = function () { banner(target); };
    document.head.appendChild(probe);

    // file:// 에서는 인증 호출을 시도하지 않는다(콘솔 CORS 오류만 남는다).
    window.SITE = {
      api: API,
      offline: true,
      me: function () { return Promise.resolve(null); },
      esc: function (s) { return String(s == null ? '' : s); },
      show: function (id, kind, text) {
        var m = document.getElementById(id);
        if (m) { m.className = 'msg on ' + kind; m.textContent = text; }
      },
      bad: function (id, cond) {
        var f = document.getElementById(id);
        if (f) f.classList.toggle('bad', !!cond);
        return !!cond;
      },
      post: function () {
        return Promise.resolve({
          ok: false, status: 0,
          data: { error: '서버를 통해 접속해야 합니다. npm start 후 http://localhost:' + PORT + ' 로 열어 주세요.' }
        });
      }
    };
    return;
  }

  // ── 인증 상태 ─────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  function paint(user) {
    document.querySelectorAll('[data-auth-slot]').forEach(function (slot) {
      if (user) {
        slot.innerHTML =
          '<span class="who">' + esc(user.name) + ' 님</span>' +
          '<a href="mypage.html" class="btn btn-line sm">마이페이지</a>' +
          '<button class="btn btn-line sm" data-logout>로그아웃</button>';
      } else {
        slot.innerHTML =
          '<a href="login.html" class="btn btn-line sm">로그인</a>' +
          '<a href="signup.html" class="btn btn-primary sm">회원가입</a>';
      }
    });
    document.querySelectorAll('[data-when-in]').forEach(function (el) {
      el.style.display = user ? '' : 'none';
    });
    document.querySelectorAll('[data-when-out]').forEach(function (el) {
      el.style.display = user ? 'none' : '';
    });
    window.CURRENT_USER = user || null;
    document.dispatchEvent(new CustomEvent('auth:ready', { detail: user || null }));
  }

  function me() {
    return fetch(API + '/auth/me', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { paint(d && d.user); return d && d.user; })
      .catch(function () { paint(null); return null; });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-logout]');
    if (!b) return;
    e.preventDefault();
    fetch(API + '/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .then(function () { location.href = 'landing.html'; })
      .catch(function () { location.reload(); });
  });

  // ── 폼 헬퍼 ───────────────────────────────────────────────────────
  window.SITE = {
    api: API,
    me: me,
    esc: esc,
    show: function (id, kind, text) {
      var m = document.getElementById(id);
      if (!m) return;
      m.className = 'msg on ' + kind;
      m.textContent = text;
    },
    bad: function (id, cond) {
      var f = document.getElementById(id);
      if (f) f.classList.toggle('bad', !!cond);
      return !!cond;
    },
    post: function (path, body) {
      return fetch(API + path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          return { ok: r.ok, status: r.status, data: d };
        });
      });
    }
  };

  if (document.readyState !== 'loading') me();
  else document.addEventListener('DOMContentLoaded', me);

  // ── 자체 집계 — 페이지뷰와 CTA 클릭만 보낸다. 개인 식별 정보는 담지 않는다. ──
  function track(event, label) {
    try {
      var page = (location.pathname.split('/').pop() || 'index.html');
      var body = JSON.stringify({ page: page, event: event, label: label || '' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API + '/track', new Blob([body], { type: 'application/json' }));
      } else {
        fetch(API + '/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
      }
    } catch (e) { /* 집계 실패는 사용자 경험에 영향을 주지 않는다 */ }
  }
  track('pageview');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.btn-primary, button.btn-primary');
    if (a) track('cta', (a.textContent || '').trim().slice(0, 40));
  });
})();
