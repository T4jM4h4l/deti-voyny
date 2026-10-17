/* registry.js — каталог записей (Занятие 6, Задания 5–7) */

$(function () {
  var DATA_URL = 'assets/data/records.json';
  var FIELDS = ['name', 'category', 'number', 'section', 'summary'];

  var $body = $('#registry-body');
  var $status = $('#registry-status');
  var $error = $('#registry-error');
  var $empty = $('#registry-empty');
  var $count = $('#registry-count');
  var $table = $('.registry-table').closest('.table-scroll');

  var $search = $('#registry-search');
  var $section = $('#registry-section');
  var $sort = $('#registry-sort');
  var $dir = $('#registry-dir');
  var $reset = $('#registry-reset');

  var $chart = $('#registry-stats-chart');
  var $statsStatus = $('#registry-stats-status');

  var records = [];
  var statsTimer = null;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function highlight(text, query) {
    text = String(text);
    if (!query) {
      return escapeHtml(text);
    }

    var lower = text.toLowerCase();
    var out = '';
    var pos = 0;
    var found;

    while ((found = lower.indexOf(query, pos)) !== -1) {
      out += escapeHtml(text.slice(pos, found));
      out += '<mark>' + escapeHtml(text.substr(found, query.length)) + '</mark>';
      pos = found + query.length;
    }

    return out + escapeHtml(text.slice(pos));
  }

  function formatDate(iso) {
    var parts = String(iso).split('-');
    return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] : iso;
  }

  function buildRow(record, query) {
    var $row = $('<tr>');
    $('<td>').html(highlight(record.name, query)).appendTo($row);
    $('<td>').html(highlight(record.category, query)).appendTo($row);
    $('<td>').html(highlight(record.number, query)).appendTo($row);
    $('<td>').text(formatDate(record.date)).appendTo($row);
    $('<td>').html(highlight(record.section, query)).appendTo($row);
    $('<td>').html(highlight(record.summary, query)).appendTo($row);
    return $row;
  }

  function sortRecords(list, sort) {
    var byDate = sort.indexOf('date') === 0;
    var desc = sort.indexOf('desc') !== -1;

    return list.slice().sort(function (a, b) {
      var cmp;

      if (byDate) {
        cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      } else {
        cmp = a.name.localeCompare(b.name, 'ru');
      }

      return desc ? -cmp : cmp;
    });
  }

  function updateDir(sort) {
    $dir.text(sort.indexOf('desc') !== -1 ? '↓' : '↑');
  }

  function matches(record, query) {
    if (!query) {
      return true;
    }

    for (var i = 0; i < FIELDS.length; i++) {
      if (String(record[FIELDS[i]]).toLowerCase().indexOf(query) !== -1) {
        return true;
      }
    }

    return false;
  }

  function render(list, query, filtered) {
    $body.empty();
    $.each(list, function (index, record) {
      var $row = buildRow(record, query);
      $body.append($row);

      if (!reduceMotion) {
        $row
          .css('opacity', 0)
          .delay(Math.min(index, 12) * 60)
          .animate({ opacity: 1 }, 250);
      }
    });

    if (records.length === 0) {
      $count.text('');
      $empty.text('В каталоге пока нет записей.');
    } else {
      $count.text('Найдено записей: ' + list.length + (filtered ? ' из ' + records.length : ''));
      $empty.text('Ничего не найдено. Измените условия поиска.');
    }

    $empty.prop('hidden', list.length !== 0);
  }

  function applyFilters() {
    var query = $.trim($search.val()).toLowerCase();
    var section = $section.val();

    var list = $.grep(records, function (record) {
      return (!section || record.section === section) && matches(record, query);
    });

    list = sortRecords(list, $sort.val());
    updateDir($sort.val());

    render(list, query, !!(query || section));
  }

  function countBy(list, key) {
    var result = {};

    $.each(list, function (_, record) {
      var name = record[key];
      result[name] = (result[name] || 0) + 1;
    });

    return result;
  }

  function buildHistogram(title, counts) {
    var names = Object.keys(counts).sort(function (a, b) {
      return a.localeCompare(b, 'ru');
    });

    var max = 0;
    $.each(counts, function (_, value) {
      if (value > max) {
        max = value;
      }
    });

    var $block = $('<div>', { class: 'hist-block' });
    $('<h3>', { class: 'hist-title' }).text(title).appendTo($block);

    var rows = $.map(names, function (name) {
      var count = counts[name];
      var $bar = $('<span>', { class: 'hist-bar' });

      var $row = $('<div>', { class: 'hist-row' })
        .append($('<span>', { class: 'hist-label' }).text(name))
        .append($('<span>', { class: 'hist-track' }).append($bar))
        .append($('<span>', { class: 'hist-value' }).text(count));

      $row.data('bar', $bar);
      $row.data('target', max ? Math.round((count * 100) / max) : 0);

      $block.append($row);
      return $row;
    });

    return { $block: $block, rows: rows };
  }

  function startStats(list) {
    clearInterval(statsTimer);
    $chart.empty();

    if (!list.length) {
      $statsStatus.text('Нет данных для расчёта статистики.');
      return;
    }

    $statsStatus.text('Идёт расчёт статистики…');

    var sections = buildHistogram('По разделам', countBy(list, 'section'));
    var categories = buildHistogram('По категориям', countBy(list, 'category'));
    $chart.append(sections.$block, categories.$block);

    var rows = sections.rows.concat(categories.rows);
    var index = 0;

    statsTimer = setInterval(function () {
      if (index >= rows.length) {
        clearInterval(statsTimer);
        $statsStatus.text('Расчёт завершён: обработано записей — ' + list.length + '.');
        return;
      }

      var $row = rows[index];
      $row.addClass('is-visible');
      $row.data('bar').css('width', $row.data('target') + '%');
      index++;
    }, 150);
  }

  function useData(data) {
    records = $.isArray(data) ? data : [];
    applyFilters();
    startStats(records);
  }

  function showError() {
    $table.prop('hidden', true);
    $count.text('');
    $empty.prop('hidden', true);
    $error.prop('hidden', false);
    $statsStatus.text('Статистика недоступна: данные каталога не загружены.');
  }

  $search.on('input', applyFilters);
  $section.on('change', applyFilters);
  $sort.on('change', applyFilters);

  $body
    .on('mouseenter', 'tr', function () {
      $(this).addClass('is-hover');
    })
    .on('mouseleave', 'tr', function () {
      $(this).removeClass('is-hover');
    });

  $reset.on('click', function () {
    $search.val('');
    $section.val('');
    applyFilters();
    $search.trigger('focus');
  });

  $status.prop('hidden', false);

  $.getJSON(DATA_URL)
    .done(function (data) {
      useData(data);
    })
    .fail(function () {
      if ($.isArray(window.RECORDS_DATA)) {
        useData(window.RECORDS_DATA);
      } else {
        showError();
      }
    })
    .always(function () {
      $status.prop('hidden', true);
    });
});
