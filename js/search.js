/* search.js — поиск и фильтрация по тексту (Занятие 5, Задание 8) */

(function () {
  var input = document.getElementById('news-search');
  var countEl = document.getElementById('news-search-count');
  var list = document.querySelector('#news .news-list');

  if (!input || !list) {
    return;
  }

  var items = list.querySelectorAll('.news-item');
  var total = items.length;

  function clearHighlights(root) {
    var marks = root.querySelectorAll('mark');
    for (var i = 0; i < marks.length; i++) {
      var mark = marks[i];
      mark.parentNode.replaceChild(document.createTextNode(mark.textContent), mark);
    }
  }

  function highlight(root, query) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    var node;

    while ((node = walker.nextNode())) {
      nodes.push(node);
    }

    var lower = query.toLowerCase();

    for (var i = 0; i < nodes.length; i++) {
      var textNode = nodes[i];
      var text = textNode.nodeValue;
      var index = text.toLowerCase().indexOf(lower);

      if (index === -1) {
        continue;
      }

      var frag = document.createDocumentFragment();
      var pos = 0;

      while (index !== -1) {
        if (index > pos) {
          frag.appendChild(document.createTextNode(text.slice(pos, index)));
        }

        var mark = document.createElement('mark');
        mark.textContent = text.slice(index, index + query.length);
        frag.appendChild(mark);

        pos = index + query.length;
        index = text.toLowerCase().indexOf(lower, pos);
      }

      if (pos < text.length) {
        frag.appendChild(document.createTextNode(text.slice(pos)));
      }

      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  function updateCount(shown, query) {
    if (!countEl) {
      return;
    }

    if (query === '') {
      countEl.textContent = 'Показано ' + total + ' из ' + total;
    } else {
      countEl.textContent = 'Найдено ' + shown + ' из ' + total;
    }
  }

  function applyFilter() {
    var query = input.value.trim();
    var lower = query.toLowerCase();
    var shown = 0;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      clearHighlights(item);

      var matches = lower === '' || item.textContent.toLowerCase().indexOf(lower) !== -1;

      if (matches) {
        item.hidden = false;
        if (lower !== '') {
          highlight(item, query);
        }
        shown++;
      } else {
        item.hidden = true;
      }
    }

    updateCount(shown, query);
  }

  input.addEventListener('input', applyFilter);

  updateCount(total, '');
})();
