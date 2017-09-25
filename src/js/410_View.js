//
$.fn.nCarousel = function( opts ){
  var self = this;
  return this.each(function( i, el ){
    var _opts = $.extend({
      i: i,
      el: el
    }, opts);
    new nCarousel(_opts);
  });
}


/*
## functions
*/

function Position(e){
  var x = (e.pageX)?e.pageX:e.originalEvent.touches[0].pageX;
  var y = (e.pageY)?e.pageY:e.originalEvent.touches[0].pageY;
  x = Math.floor(x);
  y = Math.floor(y);
  return {'x':x , 'y':y};
}



/*
## nCarousel
*/

function nCarousel( opts ) {
  var self = this;
  this.opts = $.extend({
    duration: 400,
    easing: "swing",
    thumbnail: false,
    surplus: 1,
    interval: 0,
    swipe: true,
    draggable: true,
    pointers: true,
    touchThresholdMagnification: 10,
    pauseWithMouseenter: true,
    resetItemWidth: "auto"
  }, opts);
  
  /*
  pauseWithMouseenter：マウスエンターで一時停止
  */
  
  this.backup = {};
  this.lock = false;
  this.activeResponsive = false;
  
  this.mouseenter = false;
  this.swiping = false;
  this.touchStartX = -1;
  this.touchMoveX = -1;
  this.touchStartItemsMarginLeft = -1;
  this.touchThreshold = 0;
  
  this.$window = $(window);
  this.$el = $(opts.el);
  this.$parent = this.$el.parent();
  
  this.$el
    .on('click', '.nCarousel__prev', function(){
      self.animation( self.current - 1 );
      return false;
    })
    .on('click', '.nCarousel__next', function(){
      self.animation( self.current + 1 );
      return false;
    })
    .on({
      'mouseenter': function(){ self.mouseenter = true },
      'mouseleave': function(){ self.mouseenter = false }
    });
  
  this.maxWidth = parseInt( this.$el.css('max-width') );
  
  this.init();
  
  //resize
  this.windowResize();
  this.resizeTimer = false;
  this.$window.resize(function(){
    if( self.resizeTimer !== false ){
      clearTimeout(self.resizeTimer);
    }
    self.resizeTimer = setTimeout($.proxy(self.windowResize, self), 0);
  });
  
  //autoplay
  if( 0 < this.opts.interval ){
    this.autoplay();
  }
}


nCarousel.prototype.setTouchThreshold = function(){
  if( !this.opts.swipe && !this.opts.draggable ) return false;
  this.touchThreshold = this.$item.outerWidth(false) * (this.opts.touchThresholdMagnification / 100);
}



/*
## autoplay
*/

nCarousel.prototype.autoplay = function(){
  var self = this;
  this.ticker = setInterval(function(){
    if( (!self.opts.pauseWithMouseenter || !self.mouseenter) && !self.swiping ){
      self.animation( self.current + 1 );
    }
  }, this.opts.interval);
}



/*
### window resize
*/

nCarousel.prototype.windowResize = function(){
  this.windowWidth = this.$window.width();
  if( this.maxWidth < this.windowWidth ){
    if( this.activeResponsive ) {
      this.activeResponsive = false;
      this.resetItemWidth( this.opts.resetItemWidth );
    }
    return;
  }
  var self = this;
  this.activeResponsive = true;
  this.resetItemWidth( this.$viewport.width() );
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
      marginLeft: (this.opts.surplus * -1 * this.itemWidth * this.current) + this.marginCorrect
    });
  
  this.setTouchThreshold();
}



/*
### init
*/

nCarousel.prototype.init = function(){
  var self = this;
  this.$el.addClass('nCarousel');
  
  if( 1 > this.$el.find('.nCarousel__viewport').length ){
    this.backup.html = this.$el.html();
    this.$el.empty();
    this.$el.html(
      '<div class="nCarousel__viewport">'
      + this.backup.html
      + '</div>'
    );
  }
  
  this.$viewport = this.$el.children('.nCarousel__viewport');
  this.$items = this.$viewport.children();
  this.$items.addClass('nCarousel__items');
  this.$item = this.$items.children();
  this.$item.addClass('nCarousel__item');
  
  this.itemWidth = this.$item.outerWidth(true);
  this.itemsWidth = this.itemWidth * this.$item.length;
  
  this.marginCorrect = parseInt( this.$item.css('margin-left') ) * -1;
  
  this.$items
    .css({
      marginLeft: (this.opts.surplus * -1 * this.itemsWidth) + this.marginCorrect
    });
  
  for( var i=0; i < this.opts.surplus * 2; i++ ){
    this.$items.append( this.$item.clone() );
  }
  this.$_item = this.$items.children();
  
  this.current = this.$item.length * this.opts.surplus;
  this.$el.addClass("is-current-" + (this.current - this.$item.length * this.opts.surplus));
  
  //arrows
  this.$viewport.append(
    '<div class="nCarousel__arrow nCarousel__prev"></div>' + 
    '<div class="nCarousel__arrow nCarousel__next"></div>'
  );
  this.$prev = this.$viewport.children('.nCarousel__prev');
  this.$next = this.$viewport.children('.nCarousel__next');
  this.arrowVisibilities();
  
  //add pointers
  if(this.opts.pointers){
    var pointersHTML = '<div class="nCarousel__pointers">';
    for( var i=1; i<=this.$item.length; i++ ){
      pointersHTML += '<div class="nCarousel__pointer">'+ i +'</div>';
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
  
  this.setTouchThreshold();
  this.setSwipeEvent();
}



/*
### animation
*/

nCarousel.prototype.animation = function( next ){
  if( this.lock ) return false;
  
  var self = this,
      result = true,
      duration = this.opts.duration,
      easing = this.opts.easing;
  
  this.lock = true;
  
  if( 0 === this.opts.surplus ) {
    if( next < 0 || this.$item.length - 1 < next ) result = false;
  }
  
  this.$el.removeClass("is-current-" + (this.current - this.$item.length * this.opts.surplus));
  
  if( result ) {
    
    this.current = next;
    if( self.current < self.$item.length * self.opts.surplus ) {
      self.current += self.$item.length;
    } else if( self.current >= self.$item.length * (self.opts.surplus + 1) ) {
      self.current -= self.$item.length;
    }
    
  } else {
    
    if( next < 0 ) {
      next = 0;
    } else if( this.$item.length - 1 < next ) {
      next = this.$item.length - 1;
    }
    easing = 'linear';
    
  }
  
  if(this.opts.pointers){
    self.pointerActive();
  }
  
  this.$items.stop(true,false).animate({
    'marginLeft': self.itemWidth * next * -1 + this.marginCorrect
  }, duration, easing, function(){
    self.$items.css('marginLeft', self.itemWidth * self.current * -1 + self.marginCorrect);
    self.lock = false;
  });
  
  this.arrowVisibilities();
  
  return result;
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



/*
### swipe
*/

/*
#### set swipe event
*/

nCarousel.prototype.setSwipeEvent = function(){
  
  this.$items.find("a").click(function(){return false});
  
  //swipe
  if( this.opts.swipe ) {
    this.$items.on('touchstart.ncarousel', $.proxy(this.swipeStart, this));
  }
  
  //draggable
  if( this.opts.draggable ) {
    this.$items.on('mousedown.ncarousel', $.proxy(this.swipeStart, this));
  }
}

/*
#### swipe start
*/

nCarousel.prototype.swipeStart = function(event){
  event.preventDefault();
  if( this.lock ) return false;
  this.swiping = true;
  
  var pos = Position(event);
  this.touchStartX = pos.x;
  this.touchMoveX = pos.x;
  this.touchStartItemsMarginLeft = parseInt( this.$items.css('marginLeft') );
  
  //on move & end
  if( this.opts.swipe ) {
    this.$items.on('touchmove.ncarousel', $.proxy(this.swipeMove, this));
    this.$items.on('touchend.ncarousel', $.proxy(this.swipeEnd, this));
    this.$items.on('touchcancel.ncarousel', $.proxy(this.swipeEnd, this));
  }
  if( this.opts.draggable ) {
    this.$items.on('mousemove.ncarousel', $.proxy(this.swipeMove, this));
    this.$items.on('mouseup.ncarousel', $.proxy(this.swipeEnd, this));
    this.$items.on('mouseleave.ncarousel', $.proxy(this.swipeEnd, this));
  }
}

/*
#### swipe move
*/

nCarousel.prototype.swipeMove = function(event){
  event.preventDefault();
  var pos = Position(event);
  this.touchMoveX = pos.x;
  var diffX = this.touchMoveX - this.touchStartX;
  this.$items.css('marginLeft', this.touchStartItemsMarginLeft + diffX);
}

/*
#### swipe end
*/

nCarousel.prototype.swipeEnd = function(event){
  this.swiping = false;
  
  //off move & end
  if( this.opts.swipe ) {
    this.$items.off('touchmove.ncarousel');
    this.$items.off('touchend.ncarousel');
    this.$items.off('touchcancel.ncarousel');
  }
  if( this.opts.draggable ) {
    this.$items.off('mousemove.ncarousel');
    this.$items.off('mouseup.ncarousel');
    this.$items.off('mouseleave.ncarousel');
  }
  
  var result = this.current;
  if( this.touchMoveX - this.touchThreshold > this.touchStartX ) {
    result = this.current - 1;
  } else if( this.touchMoveX + this.touchThreshold < this.touchStartX ) {
    result = this.current + 1;
  } else {
    var href = $(event.target).closest("a").attr("href");
    if(href != undefined) {
      window.location.href = href;
    }
  }
  this.animation( result );
  
  //reset
  this.touchStartX = -1;
  this.touchMoveX = -1;
  this.touchStartItemsMarginLeft = -1;
}
