import 'bootstrap-dateRangepicker/dateRangepicker';

// Patch detect when weeks are shown

const fndateRangepicker = $.fn.dateRangepicker;

$.fn.dateRangepicker = function (options, callback) {
  fndateRangepicker.call(this, options, callback);

  if (options && (options.showWeekNumbers || options.showISOWeekNumbers)) {
    this.each(function () {
      const instance = $(this).data('dateRangepicker');
      if (instance && instance.container) instance.container.addClass('with-week-numbers');
    });
  }

  return this;
};
