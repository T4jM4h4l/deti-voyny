/* app.js — сценарии проекта «Дети войны» (Занятие 6, jQuery) */

$(function () {
  var STORAGE_KEY = 'theme';
  var $root = $('html');
  var $toggle = $('#theme-toggle');

  function setTheme(theme) {
    $root.toggleClass('theme-dark', theme === 'dark');
    $toggle
      .text(theme === 'dark' ? 'Светлая тема' : 'Тёмная тема')
      .attr('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function getTheme() {
    var t = null;
    try {
      t = sessionStorage.getItem(STORAGE_KEY);
      if (t === 'dark' || t === 'light') {
        return t;
      }
    } catch (e) {}

    try {
      t = localStorage.getItem(STORAGE_KEY);
      if (t === 'dark' || t === 'light') {
        try {
          sessionStorage.setItem(STORAGE_KEY, t);
        } catch (e) {}
        return t;
      }
    } catch (e) {}

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return $root.hasClass('theme-dark') ? 'dark' : 'light';
  }

  setTheme(getTheme());

  $toggle.on('click', function () {
    var next = $root.hasClass('theme-dark') ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    setTheme(next);
  });
});
