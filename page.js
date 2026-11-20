/* Inner pages: mobile menu only. Everything else is plain HTML. */
(function () {
  'use strict';
  var burger = document.querySelector('.burger');
  var links = document.getElementById('nav-links');
  if (!burger || !links) return;
  function close() { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
