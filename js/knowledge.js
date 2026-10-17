/* knowledge.js — страница проверки знаний (Занятие 7) */

$(function () {
  var monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var monthNamesShort = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  var dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда',
    'Четверг', 'Пятница', 'Суббота'];
  var dayNamesShort = ['Вск', 'Пнд', 'Втр', 'Срд', 'Чтв', 'Птн', 'Сбт'];
  var dayNamesMin = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  $('#check-date').datepicker({
    dateFormat: 'dd.mm.yy',
    firstDay: 1,
    changeMonth: true,
    changeYear: true,
    showButtonPanel: true,
    closeText: 'Закрыть',
    currentText: 'Сегодня',
    monthNames: monthNames,
    monthNamesShort: monthNamesShort,
    dayNames: dayNames,
    dayNamesShort: dayNamesShort,
    dayNamesMin: dayNamesMin
  });

  $('#level-slider').on('input change', function () {
    $('#level-value').text(this.value);
  });

  $('#check-number').on('keydown', function (event) {
    if (event.key && event.key.length === 1 && !/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  });

  $('#check-number').on('input', function () {
    var digits = this.value.replace(/[^0-9]/g, '');
    if (digits !== this.value) {
      this.value = digits;
    }
  });

  $('#check-number').on('change blur', function () {
    if (this.value === '') {
      return;
    }
    var number = parseInt(this.value, 10);
    if (number < 1) {
      number = 1;
    } else if (number > 999) {
      number = 999;
    }
    if (String(number) !== this.value) {
      $(this).val(number);
    }
  });

  $('#student-name').on('input', function () {
    var letters = this.value.replace(/[^A-Za-zА-Яа-яЁё\s]/g, '');
    if (letters !== this.value) {
      this.value = letters;
    }
  });

  var totalQuestions = $('#quiz-accordion .quiz-question').length;
  $('#quiz-progress-total').text(totalQuestions);
  $('#quiz-progressbar').attr('aria-valuemax', totalQuestions);

  function updateProgress() {
    var answered = {};
    $('#quiz-accordion input[type="radio"]:checked').each(function () {
      answered[this.name] = true;
    });
    var count = Object.keys(answered).length;
    var percent = totalQuestions ? Math.round(count * 100 / totalQuestions) : 0;
    $('#quiz-progress-fill').css('width', percent + '%');
    $('#quiz-progressbar').attr('aria-valuenow', count);
    $('#quiz-progress-count').text(count);
  }

  $('#quiz-accordion').on('change', 'input[type="radio"]', updateProgress);

  $('#sortable-steps').sortable({
    placeholder: 'sortable-placeholder',
    tolerance: 'pointer'
  });

  $('#check-order').on('click', function () {
    var order = $('#sortable-steps .sortable-item').map(function () {
      return parseInt($(this).attr('data-order'), 10);
    }).get();

    var correct = 0;
    for (var i = 0; i < order.length; i++) {
      if (order[i] === i + 1) {
        correct++;
      }
    }

    var result = $('#sortable-result');
    var all = correct === order.length;
    result.text(all
      ? 'Верно! Порядок восстановлен полностью (' + correct + ' из ' + order.length + ').'
      : 'Пока неверно: на своих местах ' + correct + ' из ' + order.length + ' шагов.');
    result.toggleClass('sortable-result--ok', all);
    result.toggleClass('sortable-result--error', !all);
  });

  var STORAGE_KEY = 'knowledgeResults';

  function saveResult(record) {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      saved.push(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      return true;
    } catch (error) {
      return false;
    }
  }

  function showResult() {
    var total = $('#quiz-accordion .quiz-question').length;
    var correct = 0;

    $('#quiz-accordion .quiz-question').each(function () {
      var $question = $(this);
      var answer = $question.find('input[type="radio"]:checked').val();
      if (answer === $question.attr('data-correct')) {
        correct++;
      }
    });

    var percent = total ? Math.round(correct * 100 / total) : 0;
    var level = 'низкий';
    if (percent >= 80) {
      level = 'высокий';
    } else if (percent >= 50) {
      level = 'удовлетворительный';
    }

    var saved = saveResult({
      name: $.trim($('#student-name').val()),
      group: $.trim($('#student-group').val()),
      date: $.trim($('#check-date').val()),
      email: $.trim($('#student-email').val()),
      number: $('#check-number').val(),
      correct: correct,
      total: total,
      percent: percent,
      level: level
    });

    $('#result-summary').text(
      'Правильных ответов: ' + correct + ' из ' + total + ' (' + percent + '%).');
    $('#result-level').text(level);
    $('#result-confirm').text(saved
      ? 'Результат сохранён.'
      : 'Не удалось сохранить результат.');

    var trigger = document.getElementById('submit-check');
    var modalEl = document.getElementById('result-modal');

    modalEl.addEventListener('hidden.bs.modal', function onHidden() {
      modalEl.removeEventListener('hidden.bs.modal', onHidden);
      if (trigger) {
        trigger.focus();
      }
    });

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  var emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  function fieldMessage(name, value) {
    var text = $.trim(value);
    var number;

    if (name === 'studentName') {
      if (!text) {
        return 'Укажите фамилию и имя обучающегося.';
      }
      if (/[0-9]/.test(text)) {
        return 'Фамилия и имя не должны содержать цифры.';
      }
      if (/[^A-Za-zА-Яа-яЁё\s]/.test(text)) {
        return 'Фамилия и имя не должны содержать символы.';
      }
      if (text.length < 5) {
        return 'Фамилия и имя должны содержать не менее 5 символов.';
      }
      if (text.split(/\s+/).length < 2) {
        return 'Запишите фамилию и имя через пробел.';
      }
    }

    if (name === 'studentGroup') {
      if (!text) {
        return 'Укажите учебную группу.';
      }
      if (text.length < 2) {
        return 'Название группы должно содержать не менее 2 символов.';
      }
    }

    if (name === 'checkDate' && !text) {
      return 'Укажите дату проверки.';
    }

    if (name === 'studentEmail') {
      if (!text) {
        return 'Укажите электронную почту для уведомления.';
      }
      if (/[а-яё]/i.test(text)) {
        return 'Адрес электронной почты не должен содержать кириллицу.';
      }
      if (!emailPattern.test(text)) {
        return 'Введите адрес в формате name@example.com.';
      }
    }

    if (name === 'checkNumber') {
      if (!text) {
        return 'Укажите номер проверки.';
      }
      if (!/^\d+$/.test(text)) {
        return 'Номер проверки должен содержать только цифры.';
      }
      number = parseInt(text, 10);
      if (number < 1 || number > 999) {
        return 'Номер проверки должен быть от 1 до 999.';
      }
    }

    return '';
  }

  function showFieldError($input, message) {
    var $field = $input.closest('.field');
    var errorId = $input.attr('id') + '-error';
    var $error = $field.find('.form-error');

    if (!$error.length) {
      $error = $('<p class="form-error" role="alert"></p>')
        .attr('id', errorId)
        .appendTo($field);
    }
    $error.text(message);

    $input.addClass('is-invalid').attr('aria-invalid', 'true');

    var ids = ($input.attr('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if ($.inArray(errorId, ids) === -1) {
      ids.push(errorId);
      $input.attr('aria-describedby', ids.join(' '));
    }
  }

  function clearFieldError($input) {
    var errorId = $input.attr('id') + '-error';

    $input.closest('.field').find('.form-error').remove();
    $input.removeClass('is-invalid').removeAttr('aria-invalid');

    var ids = ($input.attr('aria-describedby') || '').split(/\s+/).filter(Boolean);
    var index = $.inArray(errorId, ids);
    if (index !== -1) {
      ids.splice(index, 1);
    }
    if (ids.length) {
      $input.attr('aria-describedby', ids.join(' '));
    } else {
      $input.removeAttr('aria-describedby');
    }
  }

  function validateField($input) {
    var message = fieldMessage($input.attr('name'), $input.val());
    if (message) {
      showFieldError($input, message);
      return false;
    }
    clearFieldError($input);
    return true;
  }

  function validateForm() {
    var $firstInvalid = null;

    $('#knowledge-form input[required]').each(function () {
      if (!validateField($(this)) && !$firstInvalid) {
        $firstInvalid = $(this);
      }
    });

    if ($firstInvalid) {
      $firstInvalid.trigger('focus');
      return false;
    }
    return true;
  }

  function isFormValid() {
    var valid = true;

    $('#knowledge-form input[required]').each(function () {
      if (fieldMessage($(this).attr('name'), $(this).val())) {
        valid = false;
      }
    });

    return valid;
  }

  function updateSubmitState() {
    var valid = isFormValid();
    $('#submit-check').prop('disabled', !valid);
    $('#submit-hint').text(valid
      ? ''
      : 'Заполните все поля без ошибок, чтобы завершить проверку.');
  }

  updateSubmitState();

  $('#knowledge-form').on('blur change', 'input[required]', function () {
    validateField($(this));
    updateSubmitState();
  });

  $('#knowledge-form').on('input', 'input[required]', function () {
    if ($(this).hasClass('is-invalid')) {
      validateField($(this));
    }
    updateSubmitState();
  });

  function submitHandler(event) {
    event.preventDefault();
    if (validateForm()) {
      showResult();
    }
  }

  $('#knowledge-form').on('submit', submitHandler);
});
