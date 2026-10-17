/* checklist.js — интерактивный чек-лист (Занятие 6, jQuery) */

$(function () {
  var checklist = [
    'Наличие цели и краткого описания проекта, сведений о составителе.',
    'Указаны ли источники (архивы, книги, официальные сайты) для каждого раздела.',
    'Корректность и актуальность ссылок на источники, доступность страниц по ссылкам.',
    'Полнота раскрытия раздела «Судьбы детей войны».',
    'Полнота раскрытия раздела «Трудовой фронт».',
    'Полнота раскрытия раздела «Партизанское движение».',
    'Полнота раскрытия раздела «Память» (мероприятия, музеи, мемориалы).',
    'Достоверность дат, имён и географических названий.',
    'Наличие подписей и описаний к фотографиям и документам (атрибут alt).',
    'Читаемость текста: размер шрифта, контраст, отсутствие перегрузки.',
    'Доступность элементов интерфейса (навигация и ссылки работают с клавиатуры).',
    'Корректное отображение страниц на мобильных, планшетных и десктопных экранах.',
    'Отсутствие ошибок HTML-разметки и корректная работа всех страниц проекта.'
  ];

  var answers = [
    { value: 'yes', label: 'Соответствует' },
    { value: 'no', label: 'Не соответствует' },
    { value: 'na', label: 'Не применимо' }
  ];

  var STORAGE_KEY = 'checklistResults';

  var $container = $('#checklist-list');
  var $calcBtn = $('#calc-btn');
  var $saveBtn = $('#save-btn');
  var $clearBtn = $('#clear-btn');
  var $resultBox = $('#result-box');
  var $percent = $('#percent');
  var $grade = $('#grade');
  var $onlyBad = $('#only-bad');
  var toastEl = document.getElementById('checklist-toast');

  var items = [];

  function showToast(message) {
    $('#checklist-toast-body').text(message);
    if (window.bootstrap && toastEl) {
      bootstrap.Toast.getOrCreateInstance(toastEl).show();
    }
  }

  function applyOnlyBad() {
    var only = $onlyBad.prop('checked');
    $.each(items, function (_, it) {
      it.$item.toggle(!only || it.$item.hasClass('is-bad'));
    });
  }

  function createItem(index, text) {
    var name = 'checklist-' + index;

    var $item = $('<div>', { class: 'checklist-item' });
    $('<p>', { class: 'checklist-question', text: (index + 1) + '. ' + text }).appendTo($item);

    var $group = $('<div>', { class: 'checklist-answers' });

    $.each(answers, function (_, a) {
      var id = name + '-' + a.value;
      var $check = $('<div>', { class: 'form-check' });
      $('<input>', { class: 'form-check-input', type: 'radio', name: name, id: id, value: a.value }).appendTo($check);
      $('<label>', { class: 'form-check-label', for: id, text: a.label }).appendTo($check);
      $group.append($check);
    });

    $item.append($group);

    var $comment = $('<textarea>', {
      class: 'form-control checklist-comment',
      rows: 2,
      placeholder: 'Комментарий к несоответствию...'
    }).prop('hidden', true);

    $item.append($comment);

    $group.on('change', function () {
      var value = $(this).find('input:checked').val();
      $item.toggleClass('is-bad', value === 'no');
      $comment.prop('hidden', value !== 'no');
      applyOnlyBad();
    });

    return { $item: $item, radioName: name, $comment: $comment };
  }

  function getValue(radioName) {
    return $('input[name="' + radioName + '"]:checked').val() || '';
  }

  function getResults() {
    return $.map(items, function (it) {
      return { value: getValue(it.radioName), comment: it.$comment.val() };
    });
  }

  function setResults(data) {
    if (!Array.isArray(data) || data.length !== items.length) {
      return;
    }

    $.each(items, function (i, it) {
      var saved = data[i] || {};

      if (saved.value) {
        $('input[name="' + it.radioName + '"]')
          .filter('[value="' + saved.value + '"]')
          .prop('checked', true)
          .trigger('change');
      }

      if (saved.comment) {
        it.$comment.val(saved.comment);
      }
    });
  }

  function calculate() {
    var total = items.length;
    var yes = 0;

    $.each(items, function (_, it) {
      if (getValue(it.radioName) === 'yes') {
        yes++;
      }
    });

    var percent = total === 0 ? 0 : Math.round((yes * 100) / total);

    $percent.text(percent + '%');

    if (percent >= 90) {
      $grade.text('Высокий уровень соответствия');
    } else if (percent >= 70) {
      $grade.text('Удовлетворительный уровень соответствия');
    } else {
      $grade.text('Есть несоответствия, требуется доработка');
    }

    $resultBox
      .prop('hidden', false)
      .removeClass('good ok bad')
      .addClass(percent >= 90 ? 'good' : percent >= 70 ? 'ok' : 'bad');
  }

  if ($container.length) {
    $.each(checklist, function (i, text) {
      var it = createItem(i, text);
      items.push(it);
      $container.append(it.$item);
    });
  }

  $calcBtn.on('click', calculate);

  $onlyBad.on('change', applyOnlyBad);

  $saveBtn.on('click', function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getResults()));
      showToast('Результаты сохранены.');
    } catch (e) {
      showToast('Не удалось сохранить результаты.');
    }
  });

  $clearBtn.on('click', function () {
    if (!confirm('Очистить все ответы чек-листа?')) {
      return;
    }

    $.each(items, function (_, it) {
      $('input[name="' + it.radioName + '"]').prop('checked', false);
      it.$comment.val('').prop('hidden', true);
      it.$item.removeClass('is-bad');
    });

    $resultBox.prop('hidden', true);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    applyOnlyBad();
  });

  try {
    var savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      setResults(JSON.parse(savedData));
    }
  } catch (e) {}

  applyOnlyBad();
});
