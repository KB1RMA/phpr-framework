/**
 * PHPR Post
 * 
 * This object is used for communicating with AJAX handlers in PHPR.
 * 
 * Usage:
 * 
 * $.phpr.post('user:on_login', { data: {username:'', password:''}  });
 * 
 * $.phpr.post('user:on_login').send({ data: {username:'', password:''}  });
 * 
 * $.phpr.post('user:on_login').data({username:'', password:''}).send();
 * 
 * 
 * Usage with form:
 * 
 * $('#myform').phpr().post('user:on_login', { data: {username:'', password:''}  });
 * 
 * $.phpr.post('user:on_login').form('#myform').data({username:'', password:''}).send();
 * 
 * 
 * Usage with PHPR.validate:
 * 
 * $('#myform').phpr().form()
 *   .defineFields(function(){ 
 *     this.defineField('username').required('What is your username?');
 *     this.defineField('password').required('You must enter a password!');
 *   })
 *   .validate()
 *   .post('user:on_signup', { success: function(){ alert('You are now logged in!'); }  }); 
 * 
 */

(function($) {

	PHPR.postDefaults = {
		action: 'core:on_null',
		data: {},
		update: {},
		done: null, // On Success
		fail: null, // On Failure
		always: null, // On Complete
		afterUpdate: null, // On After Update
		prepare: null,
		selectorMode: true,
		lock: true,
		alert: null,
		confirm: null,
		evalScripts: true,
		execScriptsOnFail: true,
		loadingIndicator: { show: true },
		animation: function(element, html) { element.html(html); }
	};

	PHPR.post = function(handler, options) {

		var o = {},
			_deferred = $.Deferred(),
			_handler = handler,
			_options = options || {},
			_data = {},
			_update = {},
			_form = null;

		o.requestObj = null;
		o.indicatorObj = null;

		//
		// Services
		// 

		o.form = function(element) {
			o.setFormElement(element);
			return this;
		}

		o.success = function(func) {
			_deferred.done(func);
			return this;
		}

		o.error = function(func) {
			_deferred.fail(func);
			return this;
		}

		o.complete = function(func) {
			_deferred.always(func);
			return this;
		}

		o.afterUpdate = function(func) {
			_options.afterUpdate = func;
			return this;
		}

		o.handler = o.action = function(value) {
			_handler = handler;
			return this;
		}

		o.confirm = function(value) {
			_options.confirm = value;
			return this;
		}

		o.alert = function(value) {
			_options.alert = value;
			return this;
		}

		o.prepare = function(value) {
			_options.prepare = value;
			return this;
		}

		o.update = function(element, partial) {
			if (partial)
				_update[element] = partial;
			else
				_update = element;
			return this;
		}

		o.data = function(field, value) {
			if (typeof field == "object")
				_data = field;
			else if (typeof value != "undefined")
				_data[field] = value;
			return this;
		}

		o.queue = function(value) {
			_options.lock = !value;
			return this;
		}

		o.loadingIndicator = function(data) {
			if (typeof data == "boolean")
				_options.loadingIndicator = { show: data };
			else
				_options.loadingIndicator = $.extend(true, _options.loadingIndicator, data);
			return this;
		}

		//
		// Options
		// 

		o.setDefaultOptions = function(defaultOptions) {
			PHPR.postDefaults = $.extend(true, PHPR.postDefaults, defaultOptions);
		}

		o.setOption = function(option, value) {
			_options[option] = value;
			return this;
		}

		o.getOption = function(option) {
			return _options[option];
		}

		o.buildOptions = function(options) {
			options = $.extend(true, PHPR.postDefaults, _options, options);
			
			if (_handler)
				options.action = _handler;

			// Build post back data
			options.data = $.extend(true, options.data, _data);

			if (_form)
				options.data = $.extend(true, options.data, _serialize_params(_form));

			// Build partials to update
			options.update = $.extend(true, options.update, _update);

			return _options = options;
		}

		//
		// Form Element
		// 

		o.setFormElement = function(form) {
			form = (!form) ? jQuery('<form></form>') : form;
			form = (form instanceof jQuery) ? form : jQuery(form);
			form = (form.is('form')) ? form : form.closest('form');
			form = (form.attr('id')) ? jQuery('form#'+form.attr('id')) : form.attr('id', 'form_element');
			_form = form;
			return this;
		}

		o.getFormElement = function() {
			return _form;
		}

		o.getFormUrl = function() {
			return (_form) ? _form.attr('action') : window.location.href;
		}

		//
		// Send request
		// 

		o.send = function(options) {
			options = o.buildOptions(options);

			options.prepare && options.prepare();

			if (options.alert)
				alert(options.alert);
			
			if (options.confirm && !confirm(options.confirm))
				return;

			// Show loading indicator
			if (PHPR.indicator && options.loadingIndicator.show) {
				o.indicatorObj = PHPR.indicator();
				o.indicatorObj.showIndicator(options.loadingIndicator);
			}
			
			// Prepare the request
			o.requestObj = new PHPR.request(o.getFormUrl(), _handler, options);
			o.requestObj.postObj = o;

			// On Complete
			o.requestObj.always(o.onComplete);

			// On Success
			o.requestObj.done(o.onSuccess);

			// On Failure
			o.requestObj.fail(o.onFailure);

			// Execute the request
			o.requestObj.send();
			return false;
		}

		o.onComplete = function(requestObj) {
			// Hide loading indicator
			if (PHPR.indicator && _options.loadingIndicator.show && o.indicatorObj)
				o.indicatorObj.hideIndicator();

			_options.always && _options.always(requestObj);

			$(PHPR).trigger('complete.post', [requestObj]);
		}

		o.onSuccess = function(requestObj) {
			o.updatePartials();

			_options.done && _options.done(requestObj);

			$(PHPR).trigger('success.post', [requestObj]);
		}

		o.onFailure = function(requestObj) {
			if (_options.fail && !_options.fail(requestObj))
				return;

			if (requestObj.errorMessage)
				o.popupError(requestObj);

			$(PHPR).trigger('error.post', [requestObj]);
		}

		//
		// Error Popup
		// 

		o.popupError = function(requestObj) {
			alert(requestObj.errorMessage);
		}

		//
		// Update partials
		// 

		o.updatePartials = function() {
			if (/window.location=/.test(o.requestObj.javascript))
				return;

			if ($.isArray(_options.update) || _options.update == 'multi')
				o.updatePartialsMulti();
			else
				o.updatePartialsSingle();
		}

		o.updatePartialsSingle = function() {
			var element = null;
			if (_options.update instanceof jQuery)
				element = _options.update;
			else
				element = $(_options.update);

			if (element && element.length) {
				element.html(o.requestObj.html);
				$(window).trigger('onAfterAjaxUpdate', element);				
			}
		}
		
		o.updatePartialsMulti = function() {
			var oHtml = o.requestObj.html,
				pattern = />>[^<>]*<</g,
				patches = oHtml.match(pattern) || [],
				updateElements = [];

			for (var i = 0, l = patches.length; i < l; ++i) {
				var index = oHtml.indexOf(patches[i]) + patches[i].length;

				var html = (i < patches.length-1) 
					? oHtml.slice(index, oHtml.indexOf(patches[i+1])) 
					: oHtml.slice(index);

				var id = patches[i].slice(2, patches[i].length-2);

				if (id) {
					var element;
				
					if (_options.selectorMode)
						element = $(id);
					else
						element = $('#' + id);
						
					if (!_options.animation(element, html))
						element.html(html);
						
					updateElements.push(element);
				}
			}

			$.each(updateElements, function(k, v) {
				$(window).trigger('onAfterAjaxUpdate', v);
			});

			_options.afterUpdate && _options.afterUpdate();
		}

		//
		// Internals
		// 

		var _serialize_params = function(element) {
			var params = {};

			$.each(element.serializeArray(), function(index, value) {
				if (value.name.substr(value.name.length - 2, 2) === '[]') {
					var name = value.name.substr(0, value.name.length - 2);
					
					if (!params[name]) {
						params[name] = [];
					}
					
					params[name].push(value.value);
				} 
				else {
					params[value.name] = value.value;
				}
			});

			return params;
		}

		// Extend the post object with DOM
		o = $.extend(true, o, PHPR.post);

		// (This creates too much unpredictability)
		// If the second parameter is present, then automatically fire the request
		// if (options)
		// 	return o.send();

		// Promote the post object with a promise
		return _deferred.promise(o);
	}

})(jQuery);
