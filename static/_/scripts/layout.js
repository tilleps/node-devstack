$(function () {
  $('[data-control]').on('click', function (e) {
    var selector = $(this).data('control');
    $(selector).toggleClass('collapsed');
  });
});