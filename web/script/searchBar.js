$(document).ready(function(e){
    $('.dropdown .dropdown-menu').find('a').click(function(e) {
          e.preventDefault();
          var source = $(this).text();
          $("#dropdownMenuButton").html(source);
    });
});

