/* presentation.js — навигация по слайдам (Занятие 12, Задание 8) */

(function () {
  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var fill = document.getElementById('deck-progress-fill');

  if (!deck || !slides.length) {
    return;
  }

  var index = 0;

  function render() {
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === index);
    });

    if (fill) {
      fill.style.width = ((index + 1) * 100 / slides.length) + '%';
    }

    history.replaceState(null, '', '#slide-' + (index + 1));
  }

  function go(delta) {
    var next = index + delta;
    if (next < 0 || next >= slides.length) {
      return;
    }
    index = next;
    render();
  }

  function fromHash() {
    var match = /^#slide-(\d+)$/.exec(location.hash);
    if (match) {
      var n = parseInt(match[1], 10) - 1;
      if (n >= 0 && n < slides.length) {
        index = n;
      }
    }
    render();
  }

  deck.addEventListener('click', function (event) {
    if (event.button === 0) {
      go(1);
    }
  });

  deck.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    go(-1);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'Home') {
      index = 0;
      render();
    } else if (event.key === 'End') {
      index = slides.length - 1;
      render();
    }
  });

  window.addEventListener('hashchange', fromHash);

  fromHash();
})();
