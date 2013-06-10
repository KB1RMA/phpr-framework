(function($) {

	PHPR.indicator = function() {
		var o = {};

		o.indicatorElement = null;
		o.options = {
			show: true,
			hideOnSuccess: true,
			overlayClass: 'ajax_loading_indicator',
			posX: 'center',
			posY: 'center',
			src: null,
			injectInElement: false,
			noImage: false,
			zIndex: 9999,
			element: null,
			absolutePosition: false,
			injectPosition: 'bottom',
			overlayOpacity: 1,
			hideElement: false
		};

		/**
		 * Shows the loading indicator.
		 * @type Function
		 * @return none
		 */
		o.showIndicator = function() {
			var options = $.extend(true, {}, o.loadIndicator);
			
			var container = options.injectInElement && options.form ? options.form : $('body');
			var position = options.absolutePosition ? 'absolute' : 'fixed';
			var visibility = options.hideElement ? 'hidden' : 'visible';
			
			if (o.indicatorElement === null) {
				var element = options.element ? $('#' + options.element) : $('<p />');
				
				o.indicatorElement = element
					.css({
						visibility: visibility,
						position: position,
						opacity: options.overlayOpacity,
						zIndex: options.zIndex
					})
					.addClass(options.overlayClass)
					.html("<span>Loading...</span>")
					.prependTo(container);
			}
			
			o.indicatorElement.show();
		}
		
		/**
		 * Hides the loading indicator.
		 * @type Function
		 * @return none
		 */
		o.hideIndicator = function() {
			o.indicatorElement.hide();
		}

		return o;
	}

})(jQuery);
