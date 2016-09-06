;(function($, window, document, undefined){
'use strict';



function Tab( opts ){
  this.$el = $(opts.el);
  this.$contents = this.$el.find('.demo-tab-1__contents');
  this.$contents.not(':first').css('display','none');
  
  this.current = 0;
  
  this.$open = this.$el.find('.demo-tab-1__open');
  this.$open.click( $.proxy(this.open, this) );
}

Tab.prototype = {
  
  open: function(e){
    e.preventDefault();
    var target = $(e.currentTarget).attr('href');
    this.$contents.css('display','none');
    $(target).css('display','block');
  }
  
}



$(function(){
  new Tab({
    el: '#tab-1'
  });
});

})(jQuery, this, this.document);