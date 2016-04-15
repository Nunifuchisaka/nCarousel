//
$.fn.nCarousel = function( opts ){
  var self = this;
  
  return this.each(function( i, el ){
    opts = $.extend({
      i: i,
      el: el
    }, opts);
    new nCarousel(opts);
  });
}



/*
## nCarousel
*/

function nCarousel( opts ) {
  var self = this;
  this.opts = $.extend({
    duration: 400,
    easing: 'swing',
    surplus: 1,
    interval: 0
  }, opts);
  
  this.backup = {};
  this.lock = false;
  this.activeResponsive = false;
  
  this.$window = $(window);
  this.$el = $(opts.el);
  this.backup.html = this.$el.html();
  this.$el.empty();
  
  this.$parent = this.$el.parent();
  
  this.$el
    .on('click', '.nCarousel__prev', function(){
      self.animation( self.current - 1 );
      return false;
    })
    .on('click', '.nCarousel__next', function(){
      self.animation( self.current + 1 );
      return false;
    });
  
  this.maxWidth = parseInt( this.$el.css('max-width') );
  //console.log('maxWidth', this.maxWidth);
  
  this.init();
  
  //resize
  this.windowResize();
  this.resizeTimer = false;
  this.$window.resize(function(){
    if( self.resizeTimer !== false ) {
      clearTimeout(self.resizeTimer);
    }
    self.resizeTimer = setTimeout($.proxy(self.windowResize, self), 100);
  });
  
  //autoplay
  if( 0 < this.opts.interval ) {
    this.ticker = setInterval(function(){
      self.animation( self.current + 1 );
    }, this.opts.interval);
  }
}



/*
### window resize
*/

nCarousel.prototype.windowResize = function(){
  this.windowWidth = this.$window.width();
  if( this.maxWidth < this.$window.width() ){
    if( this.activeResponsive ) {
      console.log('レスポンシブを解除');
      this.activeResponsive = false;
      this.resetItemWidth('auto');
    }
    return;
  }
  var self = this;
  this.activeResponsive = true;
  console.log('レスポンシブを適用');
  this.resetItemWidth( this.$parent.width() );
}



/*
### resetItemWidth
*/

nCarousel.prototype.resetItemWidth = function( width ){
  this.$_item.width(width);
  this.itemWidth = this.$item.outerWidth(true);
  this.itemsWidth = this.itemWidth * this.$item.length;
  
  this.$items
    .css({
      marginLeft: (this.opts.surplus * -1 * this.itemWidth * this.current) + this.marginCorrect,
      width: (this.opts.surplus * 2 + 1) * this.itemsWidth
    });
}



/*
### init
*/

nCarousel.prototype.init = function(){
  var self = this;
  this.$el.addClass('nCarousel');
  this.$el.html(
    '<div class="nCarousel__viewport">'
    + '<div class="nCarousel__items">'
    + this.backup.html
    + '</div>'
    + '</div>'
  );
  
  this.$viewport = this.$el.children('.nCarousel__viewport');
  this.$items = this.$viewport.children('.nCarousel__items');
  this.$item = this.$items.children();
  this.$item.addClass('nCarousel__item');
  
  this.itemWidth = this.$item.outerWidth(true);
  this.itemsWidth = this.itemWidth * this.$item.length;
  
  this.marginCorrect = parseInt( this.$item.css('margin-left') ) * -1;
  
  this.$items
    .css({
      marginLeft: (this.opts.surplus * -1 * this.itemsWidth) + this.marginCorrect,
      width: (this.opts.surplus * 2 + 1) * this.itemsWidth
    });
  
  for( var i=0; i < this.opts.surplus * 2; i++ ){
    this.$items.append( this.$item.clone() );
  }
  this.$_item = this.$items.children();
  
  this.current = this.$item.length * this.opts.surplus;
  
  //arrows
  this.$viewport.append(
    '<div class="nCarousel__arrow nCarousel__prev"></div>' + 
    '<div class="nCarousel__arrow nCarousel__next"></div>'
  );
  this.$prev = this.$viewport.children('.nCarousel__prev');
  this.$next = this.$viewport.children('.nCarousel__next');
  this.arrowVisibilities();
  
  //add pointers
  var pointersHTML = '<div class="nCarousel__pointers">';
  for( var i=0; i<this.$item.length; i++ ){
    pointersHTML += '<div class="nCarousel__pointer"></div>'
  }
  pointersHTML += '</div>';
  
  this.$el.append(pointersHTML);
  this.$pointer = this.$el.find('.nCarousel__pointer');
  this.$pointer.eq(0).addClass('is-active');
  this.$el.on('click', '.nCarousel__pointer', function(e){
    var index = self.$pointer.index(this),
        next  = index + self.$item.length * self.opts.surplus;
    self.animation( next );
    return false;
  });
}



/*
### animation
*/

nCarousel.prototype.animation = function( next ){
  var self = this;
  if( this.lock ) return false;
  if( 0 === this.opts.surplus ) {
    if( next < 0 || this.$item.length - 1 < next ) return false;
  }
  
  this.lock = true;
  this.current = next;
  if( self.current < self.$item.length * self.opts.surplus ) {
    self.current += self.$item.length;
  } else if( self.current >= self.$item.length * (self.opts.surplus + 1) ) {
    self.current -= self.$item.length;
  }
  
  self.pointerActive();
  
  this.$items.stop(true,false).animate({
    'marginLeft': self.itemWidth * next * -1 + this.marginCorrect
  }, this.opts.duration, this.opts.easing, function(){
    self.$items.css('marginLeft', self.itemWidth * self.current * -1 + self.marginCorrect);
    self.lock = false;
  });
  
  this.arrowVisibilities();
}



/*
### arrow visibilities
*/

nCarousel.prototype.arrowVisibilities = function(){
  if( 0 === this.opts.surplus ) {
    if( 0 == this.current ) {
      this.$prev.css('display','none');
    } else {
      this.$prev.css('display','block');
    }
    if( this.current == this.$item.length - 1 ) {
      this.$next.css('display','none');
    } else {
      this.$next.css('display','block');
    }
  }
}



/*
### pointer active
*/

nCarousel.prototype.pointerActive = function(){
  this.$pointer.filter('.is-active').removeClass('is-active');
  this.$pointer.eq(this.current - this.$item.length * this.opts.surplus).addClass('is-active');
}
