// 정적 배포용 공용 스크립트 — 서버가 없으므로 테마 전환만 하고 인증 영역은 감춘다.
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* 저장소 차단 환경은 시스템 테마를 따른다 */ }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#tg');
    if (!b) return;
    var cur = document.documentElement.getAttribute('data-theme');
    if (!cur) cur = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e2) { /* noop */ }
  });

  function paint() {
    document.querySelectorAll('[data-auth-slot]').forEach(function (s) { s.remove(); });
    document.querySelectorAll('[data-when-in]').forEach(function (el) { el.remove(); });
    document.querySelectorAll('[data-when-out]').forEach(function (el) { el.style.display = ''; });
  }
  if (document.readyState !== 'loading') paint();
  else document.addEventListener('DOMContentLoaded', paint);
})();
