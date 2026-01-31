$(function(){
  var $nav = $('.main-nav');
  var $toggle = $('.nav-toggle');

  function setNav(open){
    $toggle.attr('aria-expanded', open ? 'true' : 'false');
    $nav.toggleClass('open', open);
  }

  $toggle.on('click', function(){
    var isOpen = $toggle.attr('aria-expanded') === 'true';
    setNav(!isOpen);
  });

  // Close nav with Escape
  $(document).on('keydown', function(e){
    if(e.key === 'Escape') setNav(false);
  });

  // Smooth scroll (respect reduced motion)
  function prefersReducedMotion(){
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  $('a[href^="#"]').on('click',function(e){
    var href = this.getAttribute('href');
    var target = $(href);
    if(target.length){
      e.preventDefault();
      setNav(false);
      if(prefersReducedMotion()){
        window.scrollTo(0, target.offset().top - 70);
        target.focus();
      } else {
        $('html,body').animate({scrollTop:target.offset().top-70},400,function(){
          target.attr('tabindex','-1').focus();
        });
      }
    }
  });

  // Reveal animations (simple)
  window.requestAnimationFrame(function(){
    $('.animate-fade, .animate-card').each(function(i,el){
      setTimeout(function(){ $(el).css('opacity',1); }, i*80);
    });
  });

  console.log('Docs site loaded — jQuery is active');
});