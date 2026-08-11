// 내비게이션 동작 — 솔루션 드롭다운과 좁은 화면 메뉴만 맡는다(테마·인증은 site.js).
(function () {
  'use strict';

  var links = document.getElementById('navLinks');
  var burger = document.getElementById('burger');
  var drop = document.getElementById('navDrop');
  var solBtn = document.getElementById('solBtn');
  var wide = window.matchMedia('(min-width: 881px)');

  function setDrop(open) {
    if (!drop || !solBtn) return;
    drop.classList.toggle('open', open);
    solBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function setMenu(open) {
    if (!links || !burger) return;
    links.classList.toggle('open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    if (!open) setDrop(false);
  }

  if (burger && links) {
    burger.addEventListener('click', function () {
      setMenu(!links.classList.contains('open'));
    });
  }

  if (drop && solBtn) {
    var timer = null;
    drop.addEventListener('mouseenter', function () {
      if (!wide.matches) return;
      clearTimeout(timer);
      setDrop(true);
    });
    drop.addEventListener('mouseleave', function () {
      if (!wide.matches) return;
      timer = setTimeout(function () { setDrop(false); }, 140);
    });

    // 데스크톱에서는 호버가 이미 패널을 열어 둔다. 여기서 토글하면 열자마자 닫힌다.
    // 그래서 넓은 화면의 클릭은 목록 페이지로 보내고, 토글은 좁은 화면에서만 한다.
    solBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (wide.matches) {
        var href = solBtn.getAttribute('data-href');
        if (href) window.location.href = href;
        return;
      }
      setDrop(solBtn.getAttribute('aria-expanded') !== 'true');
    });

    // 탭으로 훑고 지나갈 때 열린 채 남지 않게 한다.
    drop.addEventListener('focusout', function (e) {
      if (!wide.matches) return;
      if (!drop.contains(e.relatedTarget)) setDrop(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drop && drop.classList.contains('open')) {
      setDrop(false);
      if (solBtn) solBtn.focus();
      return;
    }
    if (links && links.classList.contains('open')) {
      setMenu(false);
      if (burger) burger.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (drop && !drop.contains(e.target)) setDrop(false);
    if (links && burger && links.classList.contains('open') &&
        !links.contains(e.target) && !burger.contains(e.target)) setMenu(false);
  });
})();
