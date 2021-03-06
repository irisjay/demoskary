riot.tag2('body', '', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var tag_label =	function (page_name) {
								return 'page-' + replace_all ('/', '-') (trim_trailing_slash (page_name));
							};
								var trim_trailing_slash =	function (path) {
																if (path [path .length - 1] === '/')
																	return path .slice (0, -1);
																else
																	return path;
															};
			var page_name = function (path) {
								if (path === '' || path === '#')
									path = home_path
								return path .slice (path .indexOf ('#') + 1, path .indexOf ('/#') === -1 ? undefined : path .indexOf ('/#'))
							}
			var page_params =	function (path) {
									return (path .indexOf ('/#') !== -1 ? path .slice (path .indexOf ('/#') + 2) .split ('/') : []);
								};
			var page_label = 	function (path) {
									return page_name (path) + '/#' + page_params (path) .join ('/')
								}
			var tag_exists =	function (tag) {
									return riot .util .tags .selectTags () .split (',') .indexOf (tag) !== -1
								};
			var page_exists =	function (page_name) {
									return tag_exists (tag_label (page_name))
								};

			var exception =	from (function (errors) {
								riot .util .tmpl .errorHandler = 	function (err) {
																		errors ({
																			source: 'riot-tmpl',
																			data: err
																		});
																	}
								window .addEventListener ('unhandledrejection', function (e) {
								    errors ({
								    	source: 'promise',
								    	data: e .detail
								    });
								});
								window .onerror = 	function (message, source, lineno, colno, error) {
														errors ({
															source: 'window',
															data: arguments
														});
													};

							}) .thru (tap, known_as ('exception'))

			var	page_cache = stream ({}) .thru (tap, known_as ('page cache'))
			var page_cycle = R .memoize (function (id) {
				return stream () .thru (tap, known_as ('page cycle ' + id));
			})

			var page =	from (function (nav) {
							window .addEventListener ('hashchange', function () {
								nav (window .location .hash)
							});
							if (page_exists (page_name (window .location .hash))) {
								nav (window .location .hash)
							}
							else {
								window .location .hash = home_path;
							}
						})
							.thru (map, function (path) {
								return {
									name: page_name (path),
									params: page_params (path),
									id: page_label (path)
								};
							})
							.thru (dropRepeatsWith, json_equal)
							.thru (filter, function (page) {
								return page_exists (page .name)
							})
							.thru (map, function (new_page) {
								return Promise .resolve (page && page ())
									.then (function (prev) {
										var time = new Date ()

										if (page_cache () [new_page .id]) {
											var curr = page_cache () [new_page .id];
										}
										else {
											var _tag_label = tag_label (new_page .name);
											var root = document .createElement (_tag_label);
											var curr = 	retaining (new_page) (
															riot .mount (root, _tag_label, having (R .map (function (x) { return decodeURIComponent (x) }, new_page .params)) ({
																parent: self,
																cycle__from: page_cycle (new_page .id)
															})) [0]);

											if (self .isMounted) {
												self .renders .push ('now');
												self .update ();
												self .renders .pop ();
											}
										}

										page_cycle (curr .id) (stream ());
										if (curr .id === page_label (window .location .hash)) {
											if (prev !== curr) {
												var _time = new Date ()

												self .root .insertBefore (curr .root, self .root .firstElementChild);
												if (prev) {
													self .root .removeChild (prev .root);
												}

												log ('mounted page time ' + (new Date () - _time) + 'ms', curr);
											}
											var last_loaded = curr;
										}
										else {
											var last_loaded = prev;
										}
										if (prev) {
											page_cycle (prev .id) .end (true);
										}

										log ('process page time ' + (new Date () - time) + 'ms', curr);
										return last_loaded;
									})
									.catch (
										R .pipe (
											exception,
											noop
										)
									)
							}) .thru (tap, known_as ('page'));

			page
				.thru (function (pages) {
					return from (function (loadings) {
						pages .thru (tap, function (page) {
							page .then (loadings)
						})
					});
				})
				.thru (filter, id)
				.thru (dropRepeats)
				.thru (tap, function (page) {
					if (! page_cache () [page .id] && ! page .temp)
						page_cache (
							with_ (page .id, page) (page_cache ()))
				})

			from (function (widths) {
				widths (window .innerWidth);
				window .addEventListener ('resize', function () {
					widths (window .innerWidth);
				});
			})
				.thru (dropRepeats)
				.thru (map, function (width) {
					return { width: width, height: window .innerHeight };
				})
				.thru (tap, function (size) {
					self .root .style .setProperty ('width', size .width + 'px', 'important');
					self .root .style .setProperty ('height', size .height + 'px', 'important');
				});

	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-action', '{ enter yield }<yield></yield>{ exit yield }', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-add-fab', '<floating> <action> <svg viewbox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg> <component-wavify></component-wavify> </action> </floating>', '', '', function(opts) {
});
riot.tag2('component-back-button', '<icon-holder nav-button><icon>&#xf104;</icon></icon-holder>', '', '', function(opts) {
});
riot.tag2('component-cached', '<render ref="{ref prefix}render"> { enter yield }<yield></yield>{ exit yield } </render>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var key = args .key;

			(window .cache_access || (window .cache_access = from (function (self) {
				document .addEventListener ('animationstart', self, false);
			})))
				.thru (map, function (event) {
					return event .target
				})
				.thru (filter, function (root) {
					return root === self .root
				})
				.thru (tap, logged_with ('attached ' + key))
				.thru (tap, function () {
					if (! window .component_cache) window .component_cache = {};
					if (! window .component_cache [key]) {
						var mother = self .root;

						var put_back;
						var main_cache = ref ('render') ();
						window .component_cache [key] =	function (put){
															if (put_back)
																main_cache .parentNode .insertBefore (put_back, main_cache);
															if (put === main_cache) {
																mother .insertBefore (main_cache, null);
																put_back = undefined;
															}
															else {
																put .parentNode .insertBefore (main_cache, put);
																put .parentNode .removeChild (put);
																put_back = put;
															}
														}
					}
					else {
						window .component_cache [key] (ref ('render') ());
					}
				})

	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-cancel-button', '<span>取消</span>', '', '', function(opts) {
});
riot.tag2('component-checkbox', '', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    self .root .addEventListener ('click', function () {
		        if (self .root .getAttribute ('checked')) {
		            self .root .removeAttribute ('checked');
		            args .check__to (false)
		        }
		        else {
		            self .root .setAttribute ('checked', true);
		            args .check__to (true)
		        }
		    });

	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-create-button', '<span>建立</span>', '', '', function(opts) {
});
riot.tag2('component-date-bar', '<span>{expression:component-date-bar:1}{expression:component-date-bar:2}</span>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var year = mechanism (function () {
		        if (args .date__from ()) {
		            var date = fecha .parse (args .date__from (), 'YYYYMM');
		            if (fecha .format (new Date (), 'YYYY') !== fecha .format (date, 'YYYY'))
		                return fecha .format (date, 'YYYY年');
		        }
		    }, [args .date__from])
		    var month = mechanism (function () {
		        if (args .date__from ()) {
		            var date = fecha .parse (args .date__from (), 'YYYYMM');
		            return fecha .format (date, 'M月');
		        }
		    }, [args .date__from])

	self .expressions = {};

	self .expressions [0] = function (_item) { return  year ()  };
	self .expressions [1] = function (_item) { return  month ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-date-picker', '<input ref="{ref prefix}input">', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var input = ref ('input');

			self
				.on ('mount', function () {
					var picker =	new Flatpickr (input (), {
										inline: true,
										minDate: (function () {
											var today = new Date();
											today .setDate (today .getDate () + 1);
											return today;
										}) (),
										dateFormat: 'Y年n月j日'
									})
					picker .currentYearElement .setAttribute ('readonly', true);
				})

			input .thru (tap, function (input) {
				input .addEventListener ('change', function () {
					args .date__to (input .value);
				});
			})

	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-day-of-week-picker', '<table> <tr> <th>一</th> <th>二</th> <th>三</th> <th>四</th> <th>五</th> <th>六</th> <th>日</th> </tr> <tr> <td><component-checkbox check__to="{expression:component-day-of-week-picker:1}"></component-checkbox></td> <td><component-checkbox check__to="{expression:component-day-of-week-picker:2}"></component-checkbox></td> <td><component-checkbox check__to="{expression:component-day-of-week-picker:3}"></component-checkbox></td> <td><component-checkbox check__to="{expression:component-day-of-week-picker:4}"></component-checkbox></td> <td><component-checkbox check__to="{expression:component-day-of-week-picker:5}"></component-checkbox></td> <td><component-checkbox check__to="{expression:component-day-of-week-picker:6}"></component-checkbox></td> <td><component-checkbox check__to="{expression:component-day-of-week-picker:7}"></component-checkbox></td> </tr> </table>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var mon = stream ();
			var tue = stream ();
			var wed = stream ();
			var thu = stream ();
			var fri = stream ();
			var sat = stream ();
			var sun = stream ();

			mechanism (function () {
				return 	(mon () ? ['mon'] : []) .concat
						(tue () ? ['tue'] : []) .concat
						(wed () ? ['wed'] : []) .concat
						(thu () ? ['thu'] : []) .concat
						(fri () ? ['fri'] : []) .concat
						(sat () ? ['sat'] : []) .concat
						(sun () ? ['sun'] : [])
			}, [ mergeAll ([mon, tue, wed, thu, fri, sat, sun]) ])
			.thru (tap, known_as ('days'))
			.thru (tap, function (days) {
				args .days__to (days);
			})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  mon  };
	self .expressions [1] = function (_item) { return  tue  };
	self .expressions [2] = function (_item) { return  wed  };
	self .expressions [3] = function (_item) { return  thu  };
	self .expressions [4] = function (_item) { return  fri  };
	self .expressions [5] = function (_item) { return  sat  };
	self .expressions [6] = function (_item) { return  sun  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-dynamic-load-all', '<component-dynamic-load-item each="{wrap, i in expression:component-dynamic-load-all:5}" nth="{expression:component-dynamic-load-all:1}" item="{expression:component-dynamic-load-all:2}" garbage="{expression:component-dynamic-load-all:3}" no-reorder="{expression:component-dynamic-load-all:4}"> { enter yield }<yield></yield>{ exit yield } </component-dynamic-load-item>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			self .update_strategy = 'pull';

			var item_source = args .items__from;

			var nths = {};
			var wrap_nth =	function (nth) {
								if (! nths [nth])
									nths [nth] = { nth: nth };
								return nths [nth];
							};

			var loaded_items = item_source;
			var loaded_range = mechanism (function () {
				return rangify (loaded_items ());
			}, [loaded_items])
			var loaded_item = function (nth) {
				return loaded_items () [nth];
			}
			var target_items = mechanism (function () {
				return arrayify (loaded_range ()) .map (wrap_nth);
			}, [ loaded_range ])

			loaded_items
				.thru (tap, function () {
					var date = new Date ();
					self .render ()
						.then (function () {
							log ('dynamic-load-all ' + (new Date () - date) + 'ms');
						});
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  _item .wrap .nth  };
	self .expressions [1] = function (_item) { return  loaded_item (_item .wrap .nth)  };
	self .expressions [2] = function (_item) { return  _item .wrap .nth < loaded_range () .from || loaded_range () .to < _item .wrap .nth  };
	self .expressions [3] = function (_item) { return  args .no_reorder  };
	self .expressions [4] = function (_item) { return target_items ()  };
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-dynamic-load-item', '{ enter yield }<yield></yield>{ exit yield }', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var nth = stream (+ args .nth);
			var item = stream (args .item);

			self .nth__from = nth .thru (tap, known_as ('nth'));
			self .item__from = item .thru (tap, known_as ('item'));

			self .on ('updated', function () {
				if (! args .garbage) {
					nth (+ args .nth);
					item (args .item);
				}
			})

	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-dynamic-load', '<component-dynamic-load-item each="{wrap, i in expression:component-dynamic-load:6}" nth="{expression:component-dynamic-load:1}" item="{expression:component-dynamic-load:2}" garbage="{expression:component-dynamic-load:3}" riot-style="transform: translateY({expression:component-dynamic-load:4}px);"> { enter yield }<yield></yield>{ exit yield } </component-dynamic-load-item> <stretcher riot-style="height: {expression:component-dynamic-load:5}px;"></stretcher>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			self .update_strategy = 'pull';

			var list = closest_parent (self .root, 'main-content');
			var dynamic_load = self .root;

			var items_to_load = + args .items_to_load;
			var loading_interval = + args .interval_for_loading;

			var item_source = args .items__from;
			var item_height = args .item_height;

			var nths = {};
			var wrap_nth =	function (nth) {
								if (! nths [nth])
									nths [nth] = { nth: nth };
								return nths [nth];
							};

			var loaded_items = item_source;
			var loaded_range = mechanism (function () {
				return rangify (loaded_items ());
			}, [loaded_items]) .thru (begins_with, null_range)
			var loaded_item = function (nth) {
				return loaded_items () [nth];
			}
			var height_up_to = function (nth) {
				return 	arrayify ({
							from: 0,
							to: nth - 1
						})
						.map (loaded_item)
						.reduce (function (total, item) {
							return total + item_height (item)
						}, 0);
			}

			var scroll_range = function () {
				return	{
							from: positive_or_zero (list .scrollTop - dynamic_load .offsetTop),
							to: positive_or_zero (list .scrollTop - dynamic_load .offsetTop + list .clientHeight)
						};
			};
			var target_range = mechanism (function () {
				var _scroll_range = scroll_range ();
				var _loaded_range = loaded_range ();

				var start =	(function () {
					var middle = (_scroll_range .from + _scroll_range .to) / 2;
					var min;

					var total = 0;
					var least_asymmetry = middle;

					for (var nth = 0; nth <= _loaded_range .to; nth ++) {
						if (total <= _scroll_range .from) min = nth;
						var new_total = total + item_height (loaded_item (nth));
						var new_asymmetry = Math .abs (new_total - middle);
						if (new_asymmetry < least_asymmetry) {
							total = new_total;
							least_asymmetry = new_asymmetry;
						}
						else {
							return Math .min (min, nth);
						}
					}
					return min || 0;
				}) ();
				var curr = intersection (target_range, _loaded_range);
				var next =	intersection ({
								from: start,
								to: start + items_to_load - 1
							}, _loaded_range);
				return curr && included_in (curr, next) ? curr : next
			}, [ mergeAll ([
					(window .dynamic_load_rendering || (window .dynamic_load_rendering = from (function (self) {
						document .addEventListener ('animationstart', self, false);
					})))
						.thru (map, R .prop ('target'))
						.thru (filter, R .equals (self .root))
						.thru (tap, logged_with ('attached')),
					from (function (when) { list .addEventListener ('scroll', function (x) { when (x); }); }) .thru (afterSilence, 5)
				]), loaded_range ]) .thru (tap, known_as ('target range'))
			var target_items = mechanism (function () {
				return arrayify (target_range ()) .map (wrap_nth);
			}, [target_range])

			loaded_items
				.thru (dropRepeats)
				.thru (map, function () {
					return 	target_items
								.thru (dropRepeatsWith, json_equal)
				})
				.thru (switchLatest)
				.thru (afterSilence, loading_interval)
				.thru (tap, function () {
					var date = new Date ();
					self .render ()
						.then (function () {
							log ('dynamic-load ' + (new Date () - date) + 'ms', self);
						});
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  _item .wrap .nth  };
	self .expressions [1] = function (_item) { return  loaded_item (_item .wrap .nth)  };
	self .expressions [2] = function (_item) { return  _item .wrap .nth < loaded_range () .from || loaded_range () .to < _item .wrap .nth  };
	self .expressions [3] = function (_item) { return  height_up_to (_item .wrap .nth)  };
	self .expressions [4] = function (_item) { return  height_up_to (loaded_range () .to + 1)  };
	self .expressions [5] = function (_item) { return target_items ()  };
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-field-control', '<placeholder empty="{expression:component-field-control:1}">{expression:component-field-control:2}</placeholder> <input ref="{ref prefix}input" type="{expression:component-field-control:3}" maxlength="{expression:component-field-control:4}"> <hr> <hr focused="{expression:component-field-control:5}">', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var focused = stream ()
		    var empty = stream ()

		    var vals = from (function (_vals) {
		        _vals (args .val);
		        self .on ('updated', function () {
		            _vals (args .val);
		        })
		    })

		    ref ('input') .thru (tap, function (ref) {

		        vals .thru (dropRepeats) .thru (tap, function (val) {
		            if (val) {
		                ref .value = val;
		                empty (false)
		            }
		            else {
		                ref .value = '';
		                empty (true)
		            }
		        })

		        if (args .change__to)
		            ref .addEventListener ('change', function () {
		                args .change__to (ref .value)
		            })
		        if (args .input__to)
		            ref .addEventListener ('input', function () {
		                args .input__to (ref .value)
		            })

		        ref .addEventListener ('input', function () {
		            empty (! ref .value)
		        })
		        ref .addEventListener ('focus', function () {
		            focused (true)
		        })
		        ref .addEventListener ('blur', function () {
		            focused (false)
		        })
		    })

		    focused .thru (map, noop) .thru (map, noop) .thru (tap, self .render)
		    empty .thru (dropRepeats) .thru (map, noop) .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  empty ()  };
	self .expressions [1] = function (_item) { return  args .placeholder  };
	self .expressions [2] = function (_item) { return  args .type  };
	self .expressions [3] = function (_item) { return  args .maxlength  };
	self .expressions [4] = function (_item) { return  focused ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-filter-button', '<span>篩選</span>', '', '', function(opts) {
});
riot.tag2('component-input-control', '<input ref="{ref prefix}input" type="{expression:component-input-control:1}" placeholder="{expression:component-input-control:2}" maxlength="{expression:component-input-control:3}">', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var input = ref ('input')

		    input .thru (tap, function (ref) {
		        if (args .change__to)
		            ref .addEventListener ('change', function () {
		                args .change__to (ref .value)
		            })
		        if (args .input__to)
		            ref .addEventListener ('input', function () {
		                args .input__to (ref .value)
		            })
		    })

	self .expressions = {};

	self .expressions [0] = function (_item) { return  args .type  };
	self .expressions [1] = function (_item) { return  args .placeholder  };
	self .expressions [2] = function (_item) { return  args .maxlength  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-item', '{ enter yield }<yield></yield>{ exit yield }', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-jersey-control-item', '<component-field-control type="text" placeholder="{expression:component-jersey-control-item:1}" val="{expression:component-jersey-control-item:2}" input__to="{expression:component-jersey-control-item:3}" change__to="{expression:component-jersey-control-item:4}"></component-field-control>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var item = 	args .item__from
		                	.thru (dropRepeatsWith, json_equal)
		    var jersey = item;

		    var modifications =	stream ()
								    .thru (tap, function (mod) {
										args .modify__to (mod)
								    })

		    var input = stream ()
			input
				.thru (map, function (val) {
					if (val)
						return 	stream (val)
									.thru (delay (500))
									.thru (filter, function () {
										return ! jersey () .value
									})
									.thru (map, function () {
										return {
											action: 'assume',
											nth: args .nth__from ()
										}
									})
					else
						return 	stream ({
									action: 'delete',
									nth: args .nth__from ()
								})
				})
				.thru (switchLatest)
				.thru (tap, function (mod) {
					args .modify__to (mod)
				})

			var change = stream ()
			change
				.thru (filter, id)
				.thru (tap, function (value) {
					args .modify__to ({
						action: 'set',
						nth: args .nth__from (),
						value: value
					})
				})

			args .nth__from
				.thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  jersey () .placeholder  };
	self .expressions [1] = function (_item) { return  jersey () .value  };
	self .expressions [2] = function (_item) { return  input  };
	self .expressions [3] = function (_item) { return  change  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-jersey-control', '<component-dynamic-load-all items__from="{expression:component-jersey-control:1}"> <component-jersey-control-item nth__from="{expression:component-jersey-control:2}" item__from="{expression:component-jersey-control:3}" modify__to="{expression:component-jersey-control:4}"></component-jersey-control-item> </component-dynamic-load-all>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var none_more = [];
			var one_more = [undefined];
			var more =	function (n) {
							return n <= 0 ? none_more : one_more .concat (more (n - 1))
						};

			var limit = 2;

			var jerseys_to = stream ();
			jerseys_to
				.thru (map, function (_jerseys) {
					return _jerseys .slice (0, limit)
				})
				.thru (dropRepeatsWith, json_equal)
				.thru (tap, function (_jerseys) {
					args .jerseys__to (_jerseys)
				})

			var items = mechanism (function () {
				return	args .jerseys__from () .concat (one_more) .slice (0, limit) .map (function (jersey, nth) {
							return	{
										placeholder: '第' + (nth + 1) + '隻球衣' + (nth < 2 ? '(例：黑白間、藍色)' : ''),
										value: jersey
									};
						})
			}, [ args .jerseys__from ]) .thru (tap, known_as ('items'))

			var modify = stream () .thru (tap, known_as ('modification'));
			modify
				.thru (tap, function (modification) {
					if (modification .action === 'delete')
						jerseys_to (
							args .jerseys__from () .slice (0, modification .nth)
								.concat (
									args .jerseys__from () .slice (modification .nth + 1)))
					else if (modification .action === 'assume') {
						if (modification .nth >= args .jerseys__from () .length)
							jerseys_to (
								args .jerseys__from () .concat (
									more (modification .nth - args .jerseys__from () .length + 1)))
					}
					else if (modification .action === 'set')
						jerseys_to (
							args .jerseys__from () .slice (0, modification .nth)
								.concat ([ modification .value ])
								.concat (
									args .jerseys__from () .slice (modification .nth + 1)))
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  items  };
	self .expressions [1] = function (_item) { return  _item .nth__from  };
	self .expressions [2] = function (_item) { return  _item .item__from  };
	self .expressions [3] = function (_item) { return  modify  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-jersey-picker', '<modal> <jersey ref="{ref prefix}first" if="{expression:component-jersey-picker:1}"> <label>{expression:component-jersey-picker:2}</label> </jersey> <jersey ref="{ref prefix}second" if="{expression:component-jersey-picker:3}"> <label>{expression:component-jersey-picker:4}</label> </jersey> <jersey ref="{ref prefix}free"> <component-field-control placeholder="其他球衣" input__to="{expression:component-jersey-picker:5}"></component-field-control> </jersey> </modal>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var jersey = stream ([ '曼聯衫', '球衣二' ])
		    var free_jersey = stream ()

		    jersey
		        .thru (dropRepeatsWith, json_equal)
		        .thru (map, noop) .thru (tap, self .render)

		    var first = ref ('first')
		    var second = ref ('second')
		    var free = ref ('free')

		    first
		        .thru (tap, function (_ref) {
		            _ref .addEventListener ('click', function () {
		                if (args .jersey__to)
		                    args .jersey__to (jersey () [0])
		            })
		        })
		    second
		        .thru (tap, function (_ref) {
		            _ref .addEventListener ('click', function () {
		                if (args .jersey__to)
		                    args .jersey__to (jersey () [1])
		            })
		        })
		    free
		        .thru (tap, function (_ref) {
		            _ref .addEventListener ('click', function () {
		                if (args .jersey__to)
		                    args .jersey__to (free_jersey ())
		            })
		        })
		    free_jersey
		        .thru (tap, function () {
		            if (args .jersey__to)
		                args .jersey__to (free_jersey ())
		        })

	self .expressions = {};

	self .expressions [0] = function (_item) { return  jersey () [0]  };
	self .expressions [1] = function (_item) { return  jersey () [0]  };
	self .expressions [2] = function (_item) { return  jersey () [1]  };
	self .expressions [3] = function (_item) { return  jersey () [1]  };
	self .expressions [4] = function (_item) { return  free_jersey  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-list-bar', '{ enter yield }<yield></yield>{ exit yield }', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-loader', '<component-modal-holder> <component-loading-item></component-loading-item> { enter yield }<yield></yield>{ exit yield } </component-modal-holder>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-loading-item', '<div> <spinner></spinner> </div>', '', '', function(opts) {
});
riot.tag2('component-main-content', '<main-content-holder> <main-content> { enter yield }<yield></yield>{ exit yield } </main-content> </main-content-holder>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-match-catalog-item', '<component-date-bar date__from="{expression:component-match-catalog-item:1}" if="{expression:component-match-catalog-item:2}"></component-date-bar> <a href="#match/catalog/preview/#{expression:component-match-catalog-item:3}" if="{expression:component-match-catalog-item:4}"> <match> <match-graphic> <image-holder size="96x96"> <highlight-holder> <component-timeslot-highlight timeslot__from="{expression:component-match-catalog-item:5}"></component-timeslot-highlight> </highlight-holder> </image-holder> </match-graphic> <match-info> <info-holder> <match-location> <icon-holder><icon class="fa-map-marker"></icon></icon-holder> {expression:component-match-catalog-item:6} </match-location> <match-type>{expression:component-match-catalog-item:7}人{expression:component-match-catalog-item:8}</match-type> <br> <match-opponent> <svg width="12" height="12" viewbox="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"> <title>home team</title> <desc>Created using Figma</desc> <g id="Canvas" transform="translate(904 -135)" figma:type="canvas"> <g id="home team" style="mix-blend-mode:normal;" figma:type="frame"> <g id="Ellipse" style="mix-blend-mode:normal;" figma:type="ellipse"> <use xlink:href="#8b683baf-6a70-4b4e-9644-1df0db18ce07" transform="translate(-904 135)" fill="#FFFFFF" style="mix-blend-mode:normal;"></use> <mask id="mask0_outline_ins"> <use xlink:href="#8b683baf-6a70-4b4e-9644-1df0db18ce07" fill="white" transform="translate(-904 135)"></use> </mask> <g mask="url(#mask0_outline_ins)"> <use xlink:href="#a998b656-5177-4dbc-ab8b-cfd938771cee" transform="translate(-904 135)" style="mix-blend-mode:normal;"></use> </g> </g> <g id="&#228;&#184;&#187;" style="mix-blend-mode:normal;" figma:type="text"> <use xlink:href="#9e67a4c0-1545-4fa1-8048-fa2f855c342f" transform="translate(-902 137)" style="mix-blend-mode:normal;"></use> </g> </g> </g> <defs> <path id="8b683baf-6a70-4b4e-9644-1df0db18ce07" d="M 12 6C 12 9.31371 9.31371 12 6 12C 2.68629 12 0 9.31371 0 6C 0 2.68629 2.68629 0 6 0C 9.31371 0 12 2.68629 12 6Z"></path> <path id="a998b656-5177-4dbc-ab8b-cfd938771cee" d="M 11 6C 11 8.76142 8.76142 11 6 11L 6 13C 9.86599 13 13 9.86599 13 6L 11 6ZM 6 11C 3.23858 11 1 8.76142 1 6L -1 6C -1 9.86599 2.13401 13 6 13L 6 11ZM 1 6C 1 3.23858 3.23858 1 6 1L 6 -1C 2.13401 -1 -1 2.13401 -1 6L 1 6ZM 6 1C 8.76142 1 11 3.23858 11 6L 13 6C 13 2.13401 9.86599 -1 6 -1L 6 1Z"></path> <path id="9e67a4c0-1545-4fa1-8048-fa2f855c342f" d="M 0.392 6.64L 0.392 7.352L 7.592 7.352L 7.592 6.64L 4.352 6.64L 4.352 4.664L 7.152 4.664L 7.152 3.96L 4.352 3.96L 4.352 2.2L 7.312 2.2L 7.312 1.488L 4.208 1.488L 4.456 1.288C 4.136 0.84 3.832 0.48 3.544 0.224L 3 0.704C 3.208 0.888 3.44 1.152 3.696 1.488L 0.648 1.488L 0.648 2.2L 3.648 2.2L 3.648 3.96L 0.832 3.96L 0.832 4.664L 3.648 4.664L 3.648 6.64L 0.392 6.64Z"></path> </defs> </svg> {expression:component-match-catalog-item:9} </match-opponent> </info-holder> </match-info> <match-substatus>{expression:component-match-catalog-item:10}隊報名</match-substatus> </match> </a>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var item =	args .item__from
		                	.thru (dropRepeatsWith, json_equal)

		    var date = mechanism (function () {
		        return item () .date;
		    }, [ item ])
		    var match = mechanism (function () {
		        return item () .match;
		    }, [ item ])

			var region = mechanism (function () {
				return region_from_api (match () .location);
			}, [ match ])
			var location = mechanism (function () {
				return location_from_api (match () .location);
			}, [ match ])
			var num_of_players = mechanism (function () {
				return num_of_players_to_num (match () .match_type);
			}, [ match ])
			var team_name = mechanism (function () {
				return match () .home_team .long_name;
			}, [ match ])
			var field_type = mechanism (function () {
				return field_type_to_chi (match () .pitch_type);
			}, [ match ])
			var apply_numbers = mechanism (function () {
				return match () .applied_team_count;
			}, [ match ])

			var timeslot = mechanism (function () {
				return new Date (match () .start_at);
			}, [ match ])

			var id = mechanism (function () {
				return match () .id;
			}, [ match ])

		    item .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  date  };
	self .expressions [1] = function (_item) { return  date ()  };
	self .expressions [2] = function (_item) { return  id ()  };
	self .expressions [3] = function (_item) { return  match ()  };
	self .expressions [4] = function (_item) { return  timeslot  };
	self .expressions [5] = function (_item) { return  location ()  };
	self .expressions [6] = function (_item) { return  num_of_players ()  };
	self .expressions [7] = function (_item) { return  field_type ()  };
	self .expressions [8] = function (_item) { return  team_name ()  };
	self .expressions [9] = function (_item) { return  apply_numbers ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-match-tabs', '<tabs> <tab active="{expression:component-match-tabs:1}"> <a href="#match/catalog"> 所有球賽 <component-wavify></component-wavify> </a> </tab> <tab active="{expression:component-match-tabs:2}"> <a href="#match/private/catalog"> 友隊球賽 <component-wavify></component-wavify> </a> </tab> <highlight riot-style="left: {expression:component-match-tabs:3}%;"></highlight> </tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var tabs = ['all', 'private']
			var highlight_position = function () {
				return 100 * tabs .indexOf (args .tab) / tabs .length
			}

	self .expressions = {};

	self .expressions [0] = function (_item) { return  args .tab === 'all'  };
	self .expressions [1] = function (_item) { return  args .tab === 'private'  };
	self .expressions [2] = function (_item) { return  highlight_position ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-modal-holder', '<item> { enter yield }<yield></yield>{ exit yield } </item>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    if (args .action__from)
		        args .action__from
		            .thru (tap, function (ref) {
		                ref .addEventListener ('click', function () {
		                    args .action__to (args .value__by ())
		                })
		            })

	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-page-tabs', '<tabs> <tab active="{expression:component-page-tabs:1}"> <a href="#match/catalog"> <svg width="295" height="372" viewbox="0 0 295 372" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"> <title>football (3)</title> <desc>Created using Figma</desc> <g id="Canvas" transform="translate(640 2125)" figma:type="canvas"> <g id="football (3)" style="mix-blend-mode:normal;" figma:type="frame"> <g id="XMLID 409" style="mix-blend-mode:normal;" figma:type="frame"> <g id="XMLID 410" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#16dd6d04-3d9e-4b5a-a1ac-e51e5dc4f9c3" transform="translate(-504.923 -2030.81)" style="mix-blend-mode:normal;"></use> </g> <g id="XMLID 411" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#e158eb76-877c-47e2-845b-cf134fc3c98a" transform="translate(-562.068 -2063.87)" style="mix-blend-mode:normal;"></use> </g> <g id="XMLID 412" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#69dddb27-d2d1-4f91-bfe4-80ebb0feda5a" transform="translate(-488.65 -2124.09)" style="mix-blend-mode:normal;"></use> </g> </g> <mask id="mask0_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask0_alpha)" figma:type="frame"> </g> <mask id="mask1_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask1_alpha)" figma:type="frame"> </g> <mask id="mask2_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask2_alpha)" figma:type="frame"> </g> <mask id="mask3_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask3_alpha)" figma:type="frame"> </g> <mask id="mask4_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask4_alpha)" figma:type="frame"> </g> <mask id="mask5_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask5_alpha)" figma:type="frame"> </g> <mask id="mask6_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask6_alpha)" figma:type="frame"> </g> <mask id="mask7_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask7_alpha)" figma:type="frame"> </g> <mask id="mask8_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask8_alpha)" figma:type="frame"> </g> <mask id="mask9_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask9_alpha)" figma:type="frame"> </g> <mask id="mask10_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask10_alpha)" figma:type="frame"> </g> <mask id="mask11_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask11_alpha)" figma:type="frame"> </g> <mask id="mask12_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask12_alpha)" figma:type="frame"> </g> <mask id="mask13_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask13_alpha)" figma:type="frame"> </g> <mask id="mask14_alpha" mask-type="alpha"> <path d="M -639.304 -2124.09L -564.389 -2124.09L -564.389 -2049.22L -639.304 -2049.22L -639.304 -2124.09Z" fill="#FFFFFF"></path> </mask> <g id="Group" style="mix-blend-mode:normal;" mask="url(#mask14_alpha)" figma:type="frame"> </g> </g> </g> <defs> <path id="16dd6d04-3d9e-4b5a-a1ac-e51e5dc4f9c3" d="M 31.0551 63.016C 34.012 62.8206 36.9973 62.3519 39.925 61.2775C 56.3096 55.2545 64.7405 37.1007 58.7151 20.7004C 52.6875 4.3247 34.5214 -4.07314 18.1106 1.94991C 9.59356 5.07636 3.297 11.5232 4.48098e-06 19.2569L 5.95646 41.723L 31.0551 63.016Z"></path> <path id="e158eb76-877c-47e2-845b-cf134fc3c98a" d="M 213.128 277.041C 207.158 268.062 181.124 229.038 175.339 219.934C 175.339 219.934 145.034 144.516 141.851 135.833L 163.539 132.597C 168.688 131.833 173.26 128.892 176.074 124.523L 208.418 74.4857C 213.849 66.0856 211.429 54.8743 203.041 49.4577C 194.637 44.0433 183.431 46.4473 178 54.8316L 150.098 97.9985L 89.6715 111.558L 53.4802 80.8472L 35.6101 13.4459C 33.051 3.78878 23.1323 -1.92282 13.4683 0.593458C 3.80655 3.15241 -1.95139 13.0506 0.607698 22.7212L 19.9199 95.608C 20.8699 99.1709 22.8753 102.38 25.7078 104.769L 75.5927 147.103C 87.6053 179.749 82.5958 166.162 104.441 225.589L 86.6726 255.269L 57.9646 231.288C 48.7546 223.598 35.0452 224.854 27.3477 234.031C 19.6525 243.235 20.8826 256.935 30.0941 264.626L 78.3249 304.91C 83.3472 309.094 89.8692 310.694 95.8961 309.647C 102.163 308.585 107.652 304.838 110.907 299.38L 145.019 242.386L 166.551 234.61L 129.527 296.496L 190.237 310.238C 198.696 312.191 207.792 308.811 212.928 301.389C 217.967 294.078 218.051 284.436 213.128 277.041Z"></path> <path id="69dddb27-d2d1-4f91-bfe4-80ebb0feda5a" d="M 42.528 61.2775C 58.9104 55.2529 67.3443 37.0992 61.3144 20.6988C 55.2883 4.32538 37.1222 -4.07321 20.7099 1.94985C 4.32983 7.9729 -4.07559 26.1282 1.95054 42.5008C 7.94896 58.9027 26.142 67.3013 42.528 61.2775Z"></path> </defs> </svg> 球賽 </a> <component-wavify></component-wavify> </tab> <tab active="{expression:component-page-tabs:2}"> <a href="#schedule/upcoming"> <svg width="332" height="199" viewbox="0 0 332 199" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"> <title>Vector</title> <desc>Created using Figma</desc> <g id="Canvas" transform="translate(87 2002)" figma:type="canvas"> <g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#e13ee5fe-cc7a-495d-a4bc-babdadd12fd5" transform="translate(-86.1018 -2001.95)" style="mix-blend-mode:normal;"></use> </g> </g> <defs> <path id="e13ee5fe-cc7a-495d-a4bc-babdadd12fd5" d="M 325.934 -1.48616e-06L 5.06633 -1.48616e-06C 2.26836 -1.48616e-06 0 2.27123 0 5.07274L 0 192.928C 0 194.904 1.14702 196.701 2.93847 197.531C 4.73161 198.361 6.84123 198.073 8.34559 196.794L 38.3045 171.322L 292.696 171.322L 322.654 196.794C 323.588 197.588 324.755 198 325.935 198C 326.656 198 327.382 197.846 328.062 197.531C 329.854 196.7 331 194.904 331 192.927L 331 5.07274C 331 2.27157 328.732 -1.48616e-06 325.934 -1.48616e-06ZM 289.505 161.178L 277.58 161.178L 271.507 155.098L 284.254 142.334L 289.687 147.774C 289.592 152.168 289.53 156.636 289.505 161.178ZM 72.5856 10.1455L 78.7503 16.318L 66.0031 29.0814L 53.2559 16.318L 59.4206 10.1455L 72.5856 10.1455ZM 112.409 10.1455L 118.574 16.318L 105.827 29.0814L 93.0796 16.318L 99.2443 10.1455L 112.409 10.1455ZM 152.233 10.1455L 158.398 16.318L 145.651 29.0814L 132.903 16.318L 139.068 10.1455L 152.233 10.1455ZM 192.057 10.1455L 198.221 16.318L 185.474 29.0814L 172.727 16.318L 178.892 10.1455L 192.057 10.1455ZM 231.881 10.1455L 238.045 16.318L 225.298 29.0814L 212.551 16.318L 218.716 10.1455L 231.881 10.1455ZM 271.704 10.1455L 277.869 16.318L 265.122 29.0814L 252.375 16.318L 258.539 10.1455L 271.704 10.1455ZM 29.9268 47.1816L 38.9263 56.1925L 33.2223 61.9037C 32.2131 56.7457 31.1126 51.8374 29.9268 47.1816ZM 294.885 79.0296L 285.034 88.8934L 272.287 76.13L 285.034 63.3667L 295.648 73.9944C 295.386 75.6522 295.131 77.3286 294.885 79.0296ZM 36.0942 78.8835C 35.8605 77.2697 35.6176 75.6779 35.369 74.102L 46.0911 63.3663L 58.8383 76.1297L 46.0911 88.8931L 36.0942 78.8835ZM 66.0031 83.3032L 78.7503 96.0666L 66.0031 108.83L 53.2559 96.0666L 66.0031 83.3032ZM 73.1679 76.13L 85.9151 63.3667L 98.6623 76.13L 85.9151 88.8934L 73.1679 76.13ZM 105.827 83.3032L 118.574 96.0666L 105.827 108.83L 93.0796 96.0666L 105.827 83.3032ZM 112.992 76.1297L 125.739 63.3663L 138.486 76.1297L 125.739 88.8931L 112.992 76.1297ZM 145.65 83.3032L 158.397 96.0666L 145.65 108.83L 132.903 96.0666L 145.65 83.3032ZM 152.815 76.1297L 165.562 63.3663L 178.309 76.1297L 165.562 88.8931L 152.815 76.1297ZM 185.474 83.3032L 198.222 96.0666L 185.474 108.83L 172.728 96.0666L 185.474 83.3032ZM 192.639 76.1297L 205.387 63.3663L 218.134 76.1297L 205.387 88.8931L 192.639 76.1297ZM 225.298 83.3032L 238.045 96.0666L 225.298 108.83L 212.551 96.0666L 225.298 83.3032ZM 232.463 76.1297L 245.21 63.3663L 257.957 76.1297L 245.21 88.8931L 232.463 76.1297ZM 265.122 83.3032L 277.869 96.0666L 265.122 108.83L 252.375 96.0666L 265.122 83.3032ZM 265.122 68.9562L 252.375 56.1928L 265.122 43.4294L 277.869 56.1928L 265.122 68.9562ZM 245.21 49.0189L 232.463 36.2556L 245.21 23.4922L 257.957 36.2556L 245.21 49.0189ZM 238.045 56.1925L 225.298 68.9558L 212.551 56.1925L 225.298 43.4291L 238.045 56.1925ZM 205.386 49.0189L 192.639 36.2556L 205.386 23.4922L 218.133 36.2556L 205.386 49.0189ZM 198.221 56.1925L 185.474 68.9558L 172.727 56.1925L 185.474 43.4291L 198.221 56.1925ZM 165.562 49.0189L 152.816 36.2556L 165.562 23.4922L 178.31 36.2556L 165.562 49.0189ZM 158.398 56.1925L 145.651 68.9558L 132.904 56.1925L 145.651 43.4291L 158.398 56.1925ZM 125.739 49.0189L 112.992 36.2556L 125.739 23.4922L 138.486 36.2556L 125.739 49.0189ZM 118.574 56.1925L 105.827 68.9558L 93.0796 56.1925L 105.827 43.4291L 118.574 56.1925ZM 85.9151 49.0189L 73.1679 36.2556L 85.9151 23.4922L 98.6623 36.2556L 85.9151 49.0189ZM 78.7503 56.1925L 66.0031 68.9558L 53.2559 56.1925L 66.0031 43.4291L 78.7503 56.1925ZM 46.0911 49.0189L 33.3439 36.2556L 46.0911 23.4922L 58.8383 36.2556L 46.0911 49.0189ZM 40.2665 121.374C 40.0361 117.462 39.7737 113.624 39.4795 109.861L 46.0911 103.241L 58.8383 116.004L 46.8706 127.987L 40.2665 121.374ZM 66.0031 123.178L 78.7503 135.941L 66.7826 147.924L 54.0354 135.161L 66.0031 123.178ZM 73.1679 116.004L 85.9151 103.241L 98.6623 116.004L 85.9151 128.767L 73.1679 116.004ZM 105.827 123.178L 118.574 135.941L 105.827 148.704L 93.0796 135.941L 105.827 123.178ZM 112.992 116.004L 125.739 103.241L 138.486 116.004L 125.739 128.767L 112.992 116.004ZM 145.65 123.178L 158.397 135.941L 145.65 148.704L 132.903 135.941L 145.65 123.178ZM 152.815 116.004L 165.562 103.241L 178.309 116.004L 165.562 128.767L 152.815 116.004ZM 185.474 123.178L 198.222 135.941L 185.474 148.704L 172.728 135.941L 185.474 123.178ZM 192.639 116.004L 205.387 103.241L 218.134 116.004L 205.387 128.767L 192.639 116.004ZM 225.298 123.178L 238.045 135.941L 225.298 148.704L 212.551 135.941L 225.298 123.178ZM 232.463 116.004L 245.21 103.241L 257.957 116.004L 245.21 128.767L 232.463 116.004ZM 265.122 123.178L 277.09 135.161L 264.342 147.924L 252.375 135.941L 265.122 123.178ZM 272.287 116.004L 285.034 103.241L 291.529 109.744C 291.228 113.587 290.959 117.508 290.725 121.507L 284.254 127.987L 272.287 116.004ZM 292.199 56.1925L 301.03 47.3493C 299.869 51.9239 298.789 56.7403 297.798 61.7989L 292.199 56.1925ZM 285.034 49.0189L 272.287 36.2556L 285.034 23.4922L 297.781 36.2556L 285.034 49.0189ZM 38.9263 16.318L 26.1791 29.0814L 23.348 26.2464C 20.5963 19.1682 17.8916 13.9453 15.5374 10.1455L 32.7619 10.1455L 38.9263 16.318ZM 41.3152 147.897L 46.8706 142.334L 59.6178 155.098L 53.5453 161.178L 41.4952 161.178C 41.4699 156.678 41.4095 152.251 41.3152 147.897ZM 73.9474 155.097L 85.9151 143.115L 98.6623 155.878L 93.3694 161.178L 80.0199 161.178L 73.9474 155.097ZM 112.992 155.878L 125.739 143.115L 138.486 155.878L 133.193 161.178L 118.284 161.178L 112.992 155.878ZM 152.815 155.878L 165.562 143.115L 178.309 155.878L 173.016 161.178L 158.108 161.178L 152.815 155.878ZM 192.639 155.878L 205.387 143.115L 218.134 155.878L 212.841 161.178L 197.932 161.178L 192.639 155.878ZM 232.463 155.878L 245.21 143.115L 257.178 155.098L 251.105 161.178L 237.756 161.178L 232.463 155.878ZM 307.573 26.451L 304.946 29.0817L 292.199 16.318L 298.363 10.1455L 314.961 10.1455L 315.463 10.1455C 314.575 11.5787 313.637 13.2142 312.666 15.0755C 311.037 18.1966 309.314 21.9521 307.573 26.451ZM 10.1327 181.966L 10.1327 21.319C 12.1703 25.4266 14.415 30.7743 16.654 37.6631C 28.5751 74.3434 31.269 126.095 31.3737 163.906L 10.1327 181.966ZM 320.867 181.966L 299.626 163.906C 299.731 126.095 302.425 74.3438 314.346 37.6634C 316.585 30.7746 318.829 25.427 320.867 21.3194L 320.867 181.966Z"></path> </defs> </svg> 日程 </a> <component-wavify></component-wavify> </tab> <tab active="{expression:component-page-tabs:3}"> <a href="#team/profile"> <svg width="488" height="317" viewbox="0 0 488 317" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"> <title>XMLID 277</title> <desc>Created using Figma</desc> <g id="Canvas" transform="translate(-399 2070)" figma:type="canvas"> <g id="XMLID 277" style="mix-blend-mode:normal;" figma:type="frame"> <g id="XMLID 282" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#5a24b380-6132-4103-8fa4-3d879de4a3f1" transform="translate(399.518 -1996.27)" style="mix-blend-mode:normal;"></use> </g> <g id="XMLID 281" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#288ac5dc-70e1-48c3-aaab-a3f3abc2a536" transform="translate(433.629 -2067.08)" style="mix-blend-mode:normal;"></use> </g> <g id="XMLID 280" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#76ece709-e5c4-4a86-ac04-70160e15bbc2" transform="translate(761.299 -1998.76)" style="mix-blend-mode:normal;"></use> </g> <g id="XMLID 279" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#00df6ba7-348e-491e-a6ec-fcd4d3481414" transform="translate(787.917 -2069.57)" style="mix-blend-mode:normal;"></use> </g> <g id="XMLID 278" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#1b3f03ed-fc83-46d7-9f16-f5e428c59764" transform="translate(688.462 -1833.35)" style="mix-blend-mode:normal;"></use> </g> </g> </g> <defs> <path id="5a24b380-6132-4103-8fa4-3d879de4a3f1" d="M 83.461 94.686L 83.461 72.273L 97.256 68.377C 106.378 65.795 111.674 56.307 109.092 47.188C 106.529 38.052 96.94 32.788 87.904 35.335L 83.462 36.593L 83.462 25.748C 83.462 11.523 71.929 1.09863e-06 57.715 1.09863e-06C 48.326 1.09863e-06 40.179 5.08599 35.688 12.596C 32.922 16.093 5.07899 60.213 2.68199 63.975C -1.14101 69.985 -0.856014 77.73 3.40299 83.437C 7.57599 89.069 14.853 91.659 21.843 89.706L 31.967 86.839L 32.214 101.441C 32.295 106.205 33.089 110.927 34.571 115.455C 38.691 128.037 47.195 153.977 48.646 158.158L 37.952 223.223C 36.409 232.587 42.746 241.412 52.1 242.955C 61.621 244.488 70.303 238.009 71.814 228.806L 76.122 202.606C 77.446 208.339 81.42 213.334 87.454 215.213C 96.605 218.086 106.161 212.899 108.96 203.964L 126.645 147.464C 128.641 141.094 126.764 134.137 121.835 129.645L 83.461 94.686ZM 79.12 184.386L 83.225 159.432C 83.697 156.6 83.444 153.707 82.508 151.001L 77.041 135.294L 90.619 147.657L 79.12 184.386Z"></path> <path id="288ac5dc-70e1-48c3-aaab-a3f3abc2a536" d="M 32.184 64.371C 49.971 64.371 64.37 49.962 64.37 32.185C 64.37 14.408 49.972 1.89209e-06 32.184 1.89209e-06C 14.4 1.89209e-06 -4.88281e-07 14.408 -4.88281e-07 32.185C 0.000999512 49.962 14.4 64.371 32.184 64.371Z"></path> <path id="76ece709-e5c4-4a86-ac04-70160e15bbc2" d="M 122.419 63.977C 120.021 60.212 92.1785 16.092 89.4125 12.598C 84.9205 5.079 76.7715 -4.39453e-06 67.3855 -4.39453e-06C 53.1685 -4.39453e-06 41.6395 11.525 41.6395 25.748L 41.6395 69.853L 34.3795 71.412C 25.1085 73.398 19.2075 82.526 21.2025 91.787C 22.7275 98.878 28.4785 103.757 35.2165 104.879L 12.9725 134.014C 11.2465 136.277 10.1065 138.933 9.67052 141.749L 0.216506 201.443C -1.27649 210.805 5.11052 219.597 14.4815 221.081C 23.8185 222.548 32.6355 216.187 34.1125 206.808L 42.8935 151.405L 57.5455 132.213L 56.6725 150.073C 56.6215 151.163 56.6725 152.261 56.8225 153.335L 66.4795 221.232C 67.7705 230.317 76.1195 237.115 85.8925 235.815C 95.2795 234.475 101.799 225.784 100.475 216.404L 91.0545 150.122L 93.1325 93.915L 111.539 89.967C 117.02 88.795 121.598 85.006 123.758 79.817C 125.938 74.639 125.436 68.721 122.419 63.977Z"></path> <path id="00df6ba7-348e-491e-a6ec-fcd4d3481414" d="M 32.185 64.37C 49.97 64.37 64.371 49.963 64.371 32.185C 64.371 14.408 49.971 -3.60107e-06 32.185 -3.60107e-06C 14.398 -3.60107e-06 -6.10352e-06 14.408 -6.10352e-06 32.185C -6.10352e-06 49.963 14.398 64.37 32.185 64.37Z"></path> <path id="1b3f03ed-fc83-46d7-9f16-f5e428c59764" d="M 29.67 6.34766e-06C 13.292 6.34766e-06 7.32422e-06 13.293 7.32422e-06 29.679C 7.32422e-06 46.072 13.292 59.366 29.67 59.366C 46.065 59.366 59.373 46.072 59.373 29.679C 59.373 13.293 46.064 6.34766e-06 29.67 6.34766e-06Z"></path> </defs> </svg> 球隊 </a> <component-wavify></component-wavify> </tab> </tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var tabs = ['match', 'schedule', 'team']

	self .expressions = {};

	self .expressions [0] = function (_item) { return  args .tab === 'match'  };
	self .expressions [1] = function (_item) { return  args .tab === 'schedule'  };
	self .expressions [2] = function (_item) { return  args .tab === 'team'  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-page-title', '<span>{ enter yield }<yield></yield>{ exit yield }</span>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-pitch-picker', '<selected-location> <input type="text" placeholder="請選擇球場" riot-value="{expression:component-pitch-picker:1}" disabled readonly><a disabled="{expression:component-pitch-picker:2}" ref="{ref prefix}done"><icon class="fa-check"></icon></a> </selected-location> <football-field-map ref="{ref prefix}map"></football-field-map>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var location = stream () .thru (tap, known_as ('location'))
		    location
		         .thru (map, noop) .thru (tap, self .render)

		    ref ('done')
		        .thru (tap, [function (ref) {
		            ref .addEventListener ('click', function () {
		                if (location ()) {
		                    args .location__to (location ());
		                }
		            });
		        }])

		    ref ('map')
		        .thru (tap, [function (ref) {
		        }])

		    wait (500)
		        .then (function () {
		            location ('pitch here');
		        })

	self .expressions = {};

	self .expressions [0] = function (_item) { return  location ()  };
	self .expressions [1] = function (_item) { return  ! location ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-schedule-match-applicant-item', '<a> <team> <team-graphic> <image-holder size="64x64"> <team-picture> <img src="http://placehold.it/128x128"> </team-picture> </image-holder> </team-graphic> <team-info> <info-holder> <team-name>碧含足球隊</team-name> <br> <team-divison>Division 1</team-divison><component-spacing-inline width="20px"></component-spacing-inline><team-rating>4.8/5</team-rating> </info-holder> </team-info> <team-action><svg width="8" height="13" viewbox="0 0 8 13" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>enter</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(722 -173)" figma:type="canvas"><g id="enter" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#c1d1a5d7-a395-472e-aae3-af5c1e4f26c7" transform="translate(-721.611 173.37)" fill="#7F8C8D" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#902c7c0c-156c-499c-aa70-5ef7d2058777" transform="translate(-722 173)" fill="#7F8C8D" style="mix-blend-mode:normal;"></use></g></g></g><defs><path id="c1d1a5d7-a395-472e-aae3-af5c1e4f26c7" d="M 0.778233 12.2596L -6.08861e-08 11.5193L 5.66475 6.12981L -6.08861e-08 0.740374L 0.778233 8.98823e-09L 7.22149 6.12981L 0.778233 12.2596Z"></path><path id="902c7c0c-156c-499c-aa70-5ef7d2058777" d="M 1.16735 13L 6.08861e-08 11.8894L 5.66475 6.5L 6.08861e-08 1.11056L 1.16735 0L 8 6.5L 1.16735 13ZM 0.778233 11.8894L 1.16735 12.2596L 7.22149 6.5L 1.16735 0.740374L 0.778233 1.11056L 6.44299 6.5L 0.778233 11.8894Z"></path></defs></svg ></team-action> </team> </a>', '', '', function(opts) {
});
riot.tag2('component-schedule-pending-match-item--applying', '<a> <match> <match-graphic> <image-holder size="96x96"> <highlight-holder> <component-timeslot-highlight timeslot__from="{expression:component-schedule-pending-match-item--applying:1}"></component-timeslot-highlight> </highlight-holder> </image-holder> </match-graphic> <match-info> <info-holder> <match-location> <icon-holder><icon class="fa-map-marker"></icon></icon-holder> {expression:component-schedule-pending-match-item--applying:2} </match-location> <match-type>{expression:component-schedule-pending-match-item--applying:3}人{expression:component-schedule-pending-match-item--applying:4}</match-type> <br> <match-opponent> V.S. {expression:component-schedule-pending-match-item--applying:5} </match-opponent> </info-holder> </match-info> <match-status> <svg width="21" height="20" viewbox="0 0 21 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"> <title>away team</title> <desc>Created using Figma</desc> <g id="Canvas" transform="translate(682 -51)" figma:type="canvas"> <g id="away team" style="mix-blend-mode:normal;" figma:type="frame"> <g id="Ellipse" style="mix-blend-mode:normal;" figma:type="ellipse"> <use xlink:href="#dfecba4d-b57d-44fc-b1f4-34d90f38ebd7" transform="translate(-681.998 51)" fill="#FFFFFF" style="mix-blend-mode:normal;"></use> <mask id="84025861-4815-4040-8850-6ba3f848b57b"> <use xlink:href="#dfecba4d-b57d-44fc-b1f4-34d90f38ebd7" fill="white" transform="translate(-681.998 51)"></use> </mask> <g mask="url(#84025861-4815-4040-8850-6ba3f848b57b)"> <use xlink:href="#a4bbb46b-d679-4590-8b4f-4c15bfb4926b" transform="translate(-681.998 51)" style="mix-blend-mode:normal;"></use> </g> </g> <g id="&#229;&#174;&#162;" style="mix-blend-mode:normal;" figma:type="text"> <use xlink:href="#c05a7782-01d9-4652-af0e-0293724ff0b5" transform="translate(-676.998 56)" style="mix-blend-mode:normal;"></use> </g> </g> </g> <defs> <path id="dfecba4d-b57d-44fc-b1f4-34d90f38ebd7" d="M 20 10C 20 15.5228 15.5228 20 10 20C 4.47715 20 0 15.5228 0 10C 0 4.47715 4.47715 0 10 0C 15.5228 0 20 4.47715 20 10Z"></path> <path id="a4bbb46b-d679-4590-8b4f-4c15bfb4926b" d="M 19 10C 19 14.9706 14.9706 19 10 19L 10 21C 16.0751 21 21 16.0751 21 10L 19 10ZM 10 19C 5.02944 19 1 14.9706 1 10L -1 10C -1 16.0751 3.92487 21 10 21L 10 19ZM 1 10C 1 5.02944 5.02944 1 10 1L 10 -1C 3.92487 -1 -1 3.92487 -1 10L 1 10ZM 10 1C 14.9706 1 19 5.02944 19 10L 21 10C 21 3.92487 16.0751 -1 10 -1L 10 1Z"></path> <path id="c05a7782-01d9-4652-af0e-0293724ff0b5" d="M 0.63 1.21C 0.52 1.21 0.47 1.26 0.47 1.37L 0.47 3.31L 1.32 3.31L 1.32 2.1C 1.32 2.05 1.35 2.02 1.4 2.02L 8.59 2.02C 8.66 2.02 8.7 2.05 8.7 2.12C 8.7 2.26 8.63 2.6 8.4 3.34L 9.2 3.61C 9.47 2.82 9.62 2.15 9.66 1.58L 8.92 1.21L 5.39 1.21L 5.39 0.51L 4.54 0.51L 4.54 1.21L 0.63 1.21ZM 0.58 6.56C 2.28 6.43 3.82 6.05 5.21 5.44C 6.55 5.95 7.57 6.26 8.27 6.37L 9.5 6.53L 9.6 5.65C 8.19 5.53 7.02 5.29 6.11 4.97C 6.93 4.43 7.56 3.85 8 3.24L 7.41 2.66L 3.83 2.66L 3.96 2.44L 3.07 2.36C 2.76 2.96 1.97 3.54 0.71 4.06L 1.18 4.73C 1.69 4.48 2.16 4.22 2.58 3.93C 3.05 4.27 3.63 4.63 4.28 4.99C 3.1 5.4 1.78 5.64 0.35 5.69L 0.58 6.56ZM 3.47 3.54L 6.63 3.54C 6.25 3.95 5.75 4.24 5.18 4.58L 4.29 4.09L 3.47 3.54ZM 7.39 9.32L 7.39 9.78L 8.24 9.78L 8.24 6.69C 8.24 6.58 8.18 6.52 8.06 6.52L 1.98 6.52C 1.88 6.52 1.83 6.57 1.84 6.66L 1.84 9.78L 2.69 9.78L 2.69 9.32L 7.39 9.32ZM 2.69 7.45C 2.68 7.38 2.71 7.33 2.81 7.33L 7.26 7.33C 7.35 7.33 7.39 7.37 7.39 7.45L 7.39 8.51L 2.69 8.51L 2.69 7.45Z"></path> </defs> </svg> </match-status> </match> </a>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var location = mechanism (function () {
				return location_from_api (args .match__from () .location);
			}, [ args .match__from ])
			var num_of_players = mechanism (function () {
				return num_of_players_to_num (args .match__from () .match_type);
			}, [ args .match__from ])
			var team_name = mechanism (function () {
				return args .match__from () .home_team .long_name;
			}, [ args .match__from ])
			var field_type = mechanism (function () {
				return field_type_to_chi (args .match__from () .pitch .pitch_type);
			}, [ args .match__from ])

			var timeslot = mechanism (function () {
				return new Date (args .match__from () .start_at);
			}, [ args .match__from ])

			var id = mechanism (function () {
				return args .match__from () .id;
			}, [ args .match__from ])

			args .match__from .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  timeslot  };
	self .expressions [1] = function (_item) { return  location ()  };
	self .expressions [2] = function (_item) { return  num_of_players ()  };
	self .expressions [3] = function (_item) { return  field_type ()  };
	self .expressions [4] = function (_item) { return  team_name ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-schedule-pending-match-item--considering', '<a href="#schedule/match/choose/team" ref="{ref prefix}todo-button"> <match> <match-graphic> <image-holder size="96x96"> <highlight-holder> <component-timeslot-highlight timeslot__from="{expression:component-schedule-pending-match-item--considering:1}"></component-timeslot-highlight> </highlight-holder> </image-holder> </match-graphic> <match-info> <info-holder> <match-location> <icon-holder><icon class="fa-map-marker"></icon></icon-holder> {expression:component-schedule-pending-match-item--considering:2} </match-location> <match-type>{expression:component-schedule-pending-match-item--considering:3}人{expression:component-schedule-pending-match-item--considering:4}</match-type> <br> <match-opponent> {expression:component-schedule-pending-match-item--considering:5}隊已報名, 點擊以選擇對手! </match-opponent> </info-holder> </match-info> <match-status> <svg width="20" height="20" viewbox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"> <title>home team</title> <desc>Created using Figma</desc> <g id="Canvas" transform="translate(682 -260)" figma:type="canvas"> <g id="home team" style="mix-blend-mode:normal;" figma:type="frame"> <g id="Ellipse" style="mix-blend-mode:normal;" figma:type="ellipse"> <use xlink:href="#2b43512f-3f8c-4c7b-b29b-0a30a16d4252" transform="translate(-682 260)" fill="#FFFFFF" style="mix-blend-mode:normal;"></use> <mask id="a389a01e-7b4c-4052-bb5f-d98126129529"> <use xlink:href="#2b43512f-3f8c-4c7b-b29b-0a30a16d4252" fill="white" transform="translate(-682 260)"></use> </mask> <g mask="url(#a389a01e-7b4c-4052-bb5f-d98126129529)"> <use xlink:href="#17f11bf0-ea29-45fe-9996-f900c46e65f2" transform="translate(-682 260)" style="mix-blend-mode:normal;"></use> </g> </g> <g id="&#228;&#184;&#187;" style="mix-blend-mode:normal;" figma:type="text"> <use xlink:href="#3ae2f01c-9910-42da-80d4-844fef08cc7b" transform="translate(-677 264)" style="mix-blend-mode:normal;"></use> </g> </g> </g> <defs> <path id="2b43512f-3f8c-4c7b-b29b-0a30a16d4252" d="M 20 10C 20 15.5228 15.5228 20 10 20C 4.47715 20 0 15.5228 0 10C 0 4.47715 4.47715 0 10 0C 15.5228 0 20 4.47715 20 10Z"></path> <path id="17f11bf0-ea29-45fe-9996-f900c46e65f2" d="M 19 10C 19 14.9706 14.9706 19 10 19L 10 21C 16.0751 21 21 16.0751 21 10L 19 10ZM 10 19C 5.02944 19 1 14.9706 1 10L -1 10C -1 16.0751 3.92487 21 10 21L 10 19ZM 1 10C 1 5.02944 5.02944 1 10 1L 10 -1C 3.92487 -1 -1 3.92487 -1 10L 1 10ZM 10 1C 14.9706 1 19 5.02944 19 10L 21 10C 21 3.92487 16.0751 -1 10 -1L 10 1Z"></path> <path id="3ae2f01c-9910-42da-80d4-844fef08cc7b" d="M 0.49 8.55L 0.49 9.44L 9.49 9.44L 9.49 8.55L 5.44 8.55L 5.44 6.08L 8.94 6.08L 8.94 5.2L 5.44 5.2L 5.44 3L 9.14 3L 9.14 2.11L 5.26 2.11L 5.57 1.86C 5.17 1.3 4.79 0.85 4.43 0.53L 3.75 1.13C 4.01 1.36 4.3 1.69 4.62 2.11L 0.81 2.11L 0.81 3L 4.56 3L 4.56 5.2L 1.04 5.2L 1.04 6.08L 4.56 6.08L 4.56 8.55L 0.49 8.55Z"></path> </defs> </svg> </match-status> </match> </a>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var location = mechanism (function () {
				return location_from_api (args .match__from () .location);
			}, [args .match__from])
			var num_of_players = mechanism (function () {
				return num_of_players_to_num (args .match__from () .match_type);
			}, [args .match__from])
			var team_name = mechanism (function () {
				return args .match__from () .home_team .long_name;
			}, [args .match__from])
			var field_type = mechanism (function () {
				return field_type_to_chi (args .match__from () .pitch .pitch_type);
			}, [args .match__from])
			var apply_numbers = mechanism (function () {
				return args .match__from () .applied_opponent_count;
			}, [args .match__from])
			var timeslot = mechanism (function () {
				return new Date (args .match__from () .start_at);
			}, [args .match__from])
			var id = mechanism (function () {
				return args .match__from () .id;
			}, [args .match__from])

			args .match__from .thru (map, noop) .thru (tap, self .render)

			ref ('todo-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function (e) {
					e .preventDefault ();
					window .location .hash = ref .hash + '/#' + stringify (id ())
				})
			})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  timeslot  };
	self .expressions [1] = function (_item) { return  location ()  };
	self .expressions [2] = function (_item) { return num-of-players ()  };
	self .expressions [3] = function (_item) { return  field-type ()  };
	self .expressions [4] = function (_item) { return  apply-numbers ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-schedule-pending-match-item--waiting', '<a href="#schedule/match/choose/team" ref="{ref prefix}todo-button"> <match> <match-graphic> <image-holder size="96x96"> <highlight-holder> <component-timeslot-highlight timeslot__from="{expression:component-schedule-pending-match-item--waiting:1}"></component-timeslot-highlight> </highlight-holder> </image-holder> </match-graphic> <match-info> <info-holder> <match-location> <icon-holder><icon class="fa-map-marker"></icon></icon-holder> {expression:component-schedule-pending-match-item--waiting:2} </match-location> <match-type>{expression:component-schedule-pending-match-item--waiting:3}人{expression:component-schedule-pending-match-item--waiting:4}</match-type> <br> <match-opponent> 未有球隊報名 </match-opponent> </info-holder> </match-info> <match-status> <svg width="20" height="20" viewbox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"> <title>home team</title> <desc>Created using Figma</desc> <g id="Canvas" transform="translate(682 -260)" figma:type="canvas"> <g id="home team" style="mix-blend-mode:normal;" figma:type="frame"> <g id="Ellipse" style="mix-blend-mode:normal;" figma:type="ellipse"> <use xlink:href="#2b43512f-3f8c-4c7b-b29b-0a30a16d4252" transform="translate(-682 260)" fill="#FFFFFF" style="mix-blend-mode:normal;"></use> <mask id="bac63921-81b9-4f8c-be2f-a417b4a91fa7"> <use xlink:href="#2b43512f-3f8c-4c7b-b29b-0a30a16d4252" fill="white" transform="translate(-682 260)"></use> </mask> <g mask="url(#bac63921-81b9-4f8c-be2f-a417b4a91fa7)"> <use xlink:href="#17f11bf0-ea29-45fe-9996-f900c46e65f2" transform="translate(-682 260)" style="mix-blend-mode:normal;"></use> </g> </g> <g id="&#228;&#184;&#187;" style="mix-blend-mode:normal;" figma:type="text"> <use xlink:href="#3ae2f01c-9910-42da-80d4-844fef08cc7b" transform="translate(-677 264)" style="mix-blend-mode:normal;"></use> </g> </g> </g> <defs> <path id="2b43512f-3f8c-4c7b-b29b-0a30a16d4252" d="M 20 10C 20 15.5228 15.5228 20 10 20C 4.47715 20 0 15.5228 0 10C 0 4.47715 4.47715 0 10 0C 15.5228 0 20 4.47715 20 10Z"></path> <path id="17f11bf0-ea29-45fe-9996-f900c46e65f2" d="M 19 10C 19 14.9706 14.9706 19 10 19L 10 21C 16.0751 21 21 16.0751 21 10L 19 10ZM 10 19C 5.02944 19 1 14.9706 1 10L -1 10C -1 16.0751 3.92487 21 10 21L 10 19ZM 1 10C 1 5.02944 5.02944 1 10 1L 10 -1C 3.92487 -1 -1 3.92487 -1 10L 1 10ZM 10 1C 14.9706 1 19 5.02944 19 10L 21 10C 21 3.92487 16.0751 -1 10 -1L 10 1Z"></path> <path id="3ae2f01c-9910-42da-80d4-844fef08cc7b" d="M 0.49 8.55L 0.49 9.44L 9.49 9.44L 9.49 8.55L 5.44 8.55L 5.44 6.08L 8.94 6.08L 8.94 5.2L 5.44 5.2L 5.44 3L 9.14 3L 9.14 2.11L 5.26 2.11L 5.57 1.86C 5.17 1.3 4.79 0.85 4.43 0.53L 3.75 1.13C 4.01 1.36 4.3 1.69 4.62 2.11L 0.81 2.11L 0.81 3L 4.56 3L 4.56 5.2L 1.04 5.2L 1.04 6.08L 4.56 6.08L 4.56 8.55L 0.49 8.55Z"></path> </defs> </svg> </match-status> </match> </a>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var location = mechanism (function () {
				return location_from_api (args .match__from () .location);
			}, [ args .match__from ])

			var num_of_players = mechanism (function () {
				return num_of_players_to_num (args .match__from () .match_type);
			}, [ args .match__from ])

			var team_name = mechanism (function () {
				return args .match__from () .home_team .long_name;
			}, [ args .match__from ])

			var field_type = mechanism (function () {
				return field_type_to_chi (args .match__from () .pitch .pitch_type);
			}, [ args .match__from ])

			var timeslot = mechanism (function () {
				return new Date (args .match__from () .start_at);
			}, [ args .match__from ])

			var id = mechanism (function () {
				return args .match__from () .id;
			}, [ args .match__from ])

			args .match__from .thru (map, noop) .thru (tap, self .render)

			ref ('todo-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function (e) {
					e .preventDefault ();
					window .location .hash = ref .hash + '/#' + stringify (id ())
				})
			})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  timeslot  };
	self .expressions [1] = function (_item) { return  location ()  };
	self .expressions [2] = function (_item) { return num_of_players ()  };
	self .expressions [3] = function (_item) { return  field_type ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-schedule-pending-match-item', '<component-schedule-pending-match-item--applying match__from="{expression:component-schedule-pending-match-item:3}" if="{expression:component-schedule-pending-match-item:4}"></component-schedule-pending-match-item--applying> <component-schedule-pending-match-item--considering match__from="{expression:component-schedule-pending-match-item:5}" if="{expression:component-schedule-pending-match-item:6}"></component-schedule-pending-match-item--considering> <component-schedule-pending-match-item--waiting match__from="{expression:component-schedule-pending-match-item:7}" if="{expression:component-schedule-pending-match-item:8}"></component-schedule-pending-match-item--waiting>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var item = args .item__from .thru (dropRepeatsWith, json_equal)
		    var match = item

		    item .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  args .todo__from  };
	self .expressions [1] = function (_item) { return  args .todo__from () .status === 'STARTED'  };
	self .expressions [2] = function (_item) { return  match  };
	self .expressions [3] = function (_item) { return  match () && match () .status === 'PENDING_APPROVAL' && ! match () .away_team  };
	self .expressions [4] = function (_item) { return  match  };
	self .expressions [5] = function (_item) { return  match () && match () .status === 'PENDING_APPROVAL' && match () .away_team  };
	self .expressions [6] = function (_item) { return  match  };
	self .expressions [7] = function (_item) { return  match () && match () .status === 'VERIFIED'  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-schedule-tabs', '<tabs> <tab active="{expression:component-schedule-tabs:1}"> <a href="#schedule/upcoming"> 未來賽事 <component-wavify></component-wavify> </a> </tab> <tab active="{expression:component-schedule-tabs:2}"> <a href="#schedule/history"> 歷史 <component-wavify></component-wavify> </a> </tab> <highlight riot-style="left: {expression:component-schedule-tabs:3}%;"></highlight> </tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var tabs = stream (['upcoming', 'history'])

			var highlight_position = function () {
				return 100 * tabs () .indexOf (args .tab) / tabs () .length
			}

	self .expressions = {};

	self .expressions [0] = function (_item) { return  args .tab === 'upcoming'  };
	self .expressions [1] = function (_item) { return  args .tab === 'history'  };
	self .expressions [2] = function (_item) { return  highlight_position ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-select-control', '{ enter yield }<yield></yield>{ exit yield }', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var multiple = args .multiple !== undefined;

		    var last = self .root .querySelector ('a[active]');
		    self .root .addEventListener ('click', function (event) {
		        var selects = self .root .querySelectorAll ('a');
		        var index = [] .indexOf .call (selects, event .target);
		        if (index !== -1) {
		            if (! multiple && last)
		                last .removeAttribute ('active');
		            if (multiple && event .target .hasAttribute ('active')) {
		                event .target .removeAttribute ('active');
		            }
		            else {
		                event .target .setAttribute ('active', true);
		                last = event .target;
		            }

		            var values =    [] .filter .call (selects, function (select) {
		                                return select .hasAttribute ('active')
		                            }) .map (function (select) {
		                                return select .textContent
		                            })
		            if (args .select__to)
		                args .select__to (multiple ? values : values [0]);
		        }
		    })

	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-separator-inline', '<item> <span></span> </item>', '', '', function(opts) {
});
riot.tag2('component-separator', '<hr>', '', '', function(opts) {
});
riot.tag2('component-snackbar', '<snackbar> <item> { enter yield }<yield></yield>{ exit yield } </item> </snackbar>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-spacing-inline', '<stretcher riot-style="width: {expression:component-spacing-inline:1};"></stretcher>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self .expressions = {};

	self .expressions [0] = function (_item) { return  args .width  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-spacing', '<stretcher riot-style="width: 100%; height: {expression:component-spacing:1};"></stretcher>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self .expressions = {};

	self .expressions [0] = function (_item) { return  args .height  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-support-fab', '<floating> <action> <svg width="363" height="331" viewbox="0 0 363 331" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"> <title>Vector</title> <desc>Created using Figma</desc> <g id="Canvas" transform="translate(242 141)" figma:type="canvas"> <g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"> <use xlink:href="#1d5ff2f8-fc3e-4911-842c-1a1f665cd660" transform="translate(-242 -140.826)" style="mix-blend-mode:normal;"></use> </g> </g> <defs> <path id="1d5ff2f8-fc3e-4911-842c-1a1f665cd660" d="M 277.73 77.949C 277.73 88.946 269.724 95.634 263.878 100.542C 261.664 102.401 257.543 105.793 257.554 107.06C 257.594 112.03 253.598 115.999 248.627 115.999C 248.602 115.999 248.577 115.999 248.552 115.999C 243.616 115.999 239.594 112.152 239.554 107.207C 239.475 97.46 246.588 91.623 252.304 86.824C 256.789 83.058 259.73 80.408 259.73 77.983C 259.73 73.074 255.736 69.08 250.827 69.08C 245.916 69.08 241.921 73.074 241.921 77.983C 241.921 82.954 237.892 86.983 232.921 86.983C 227.95 86.983 223.921 82.954 223.921 77.983C 223.921 63.149 235.99 51.08 250.825 51.08C 265.661 51.079 277.73 63.114 277.73 77.949ZM 248.801 124.307C 243.83 124.307 240 128.336 240 133.307L 240 133.376C 240 138.347 243.831 142.342 248.801 142.342C 253.771 142.342 257.801 138.278 257.801 133.307C 257.801 128.336 253.772 124.307 248.801 124.307ZM 67.392 187C 62.421 187 58.392 191.029 58.392 196C 58.392 200.971 62.421 205 67.392 205L 68.142 205C 73.113 205 77.142 200.971 77.142 196C 77.142 191.029 73.113 187 68.142 187L 67.392 187ZM 98.671 187C 93.7 187 89.671 191.029 89.671 196C 89.671 200.971 93.7 205 98.671 205L 99.42 205C 104.391 205 108.42 200.971 108.42 196C 108.42 191.029 104.391 187 99.42 187L 98.671 187ZM 363 43.251L 363 144.552C 363 168.537 343.768 188 319.783 188L 203.066 188C 200.784 188 198.905 187.987 197.333 187.954C 195.686 187.92 193.832 187.907 193.109 187.987C 192.356 188.487 190.51 190.178 188.731 191.817C 188.026 192.466 187.228 193.18 186.367 193.966L 153.345 224.064C 150.711 226.467 146.814 227.089 143.552 225.651C 140.29 224.212 138 220.982 138 217.417L 138 122L 43.72 122C 29.658 122 18 133.523 18 147.583L 18 248.884C 18 262.945 29.659 274 43.72 274L 174.094 274C 176.339 274 178.439 275.031 180.097 276.545L 207 301.349L 207 215.81C 207 210.839 211.029 206.81 216 206.81C 220.971 206.81 225 210.839 225 215.81L 225 321.748C 225 325.313 222.96 328.495 219.697 329.934C 218.53 330.449 217.358 330.652 216.131 330.652C 213.927 330.652 211.753 329.747 210.062 328.203L 170.605 291.999L 43.72 291.999C 19.734 291.999 0 272.869 0 248.883L 0 147.583C 0 123.598 19.734 104 43.72 104L 138 104L 138 43.251C 138 19.265 157.885 -2.13623e-07 181.871 -2.13623e-07L 319.784 -2.13623e-07C 343.768 -2.13623e-07 363 19.265 363 43.251ZM 345 43.251C 345 29.19 333.843 18 319.783 18L 181.871 18C 167.81 18 156 29.19 156 43.251L 156 113.084L 156 197.018L 174.095 180.665C 174.933 179.9 175.872 179.2 176.557 178.568C 184.82 170.954 186.934 169.737 197.712 169.959C 199.182 169.99 200.933 170.001 203.066 170.001L 319.783 170.001C 333.843 170.001 345 158.613 345 144.553L 345 43.251Z"></path> </defs> </svg> <component-wavify></component-wavify> </action> </floating>', '', '', function(opts) {
});
riot.tag2('component-table-control', '<span ref="{ref prefix}span">{expression:component-table-control:1}</span><svg ref="{ref prefix}svg" width="9" height="16" viewbox="0 0 9 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>right-arrow</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(734 258)" figma:type="canvas"><g id="right-arrow" style="mix-blend-mode:normal;" figma:type="frame"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#0b39f1b4-0614-4a28-a406-f607ebc22df0" transform="translate(-733.297 -256.973)" fill="#CCD1D1" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#dd187232-741f-4707-87f3-4b5c131211ec" transform="translate(-733.721 -257.397)" fill="#CCD1D1" style="mix-blend-mode:normal;"></use></g></g></g></g><defs><path id="0b39f1b4-0614-4a28-a406-f607ebc22df0" d="M 0.8484 14.0484L -6.63757e-08 13.2L 6.1755 7.0242L -6.63757e-08 0.8484L 0.8484 1.02997e-08L 7.8726 7.0242L 0.8484 14.0484Z"></path><path id="dd187232-741f-4707-87f3-4b5c131211ec" d="M 1.2726 14.8968L 6.63757e-08 13.6242L 6.1755 7.4484L 6.63757e-08 1.2726L 1.2726 0L 8.7213 7.4484L 1.2726 14.8968ZM 0.8484 13.6242L 1.2726 14.0484L 7.8726 7.4484L 1.2726 0.8484L 0.8484 1.2726L 7.0239 7.4484L 0.8484 13.6242Z"></path></defs></svg> <fullscreen-holder active="{expression:component-table-control:2}"> { enter yield }<yield></yield>{ exit yield } </fullscreen-holder>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var span = ref ('span');
			var svg = ref ('svg')

			var picking = stream ();
				picking .thru (map, noop) .thru (tap, self .render);
				self .root .addEventListener ('click', function (e) {
					if (e .target === span () || e .target === svg ())
						picking (true);
				});

			var message = args .message__from;
			message
				.thru (delay, 150)
				.thru (tap, function () {
					picking (false);
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  message () || '未輸入'  };
	self .expressions [1] = function (_item) { return  picking ()  };
	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-tag-control-item', '<a ref="{ref prefix}ref"> <tag>{expression:component-tag-control-item:1}</tag> </a>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var item =	args .item__from
							.thru (dropRepeatsWith, json_equal)

			ref ('ref') .thru (tap, function (_ref) {
				_ref .addEventListener ('click', function () {
					args .select__to (
						item ())
				})
			})

			item .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  item ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-tag-control', '<placeholder empty="{expression:component-tag-control:1}">{expression:component-tag-control:2}</placeholder> <field> <component-dynamic-load-all items__from="{expression:component-tag-control:3}" no_reorder="true"> <component-tag-control-item item__from="{expression:component-tag-control:4}" select__to="{expression:component-tag-control:5}"></component-tag-control-item> </component-dynamic-load-all> <input ref="{ref prefix}input"> </field> <hr> <hr focused="{expression:component-tag-control:6}"> <tag-select-box focused="{expression:component-tag-control:7}"> <component-dynamic-load-all items__from="{expression:component-tag-control:8}" no_reorder="true"> <component-tag-control-item item__from="{expression:component-tag-control:9}" select__to="{expression:component-tag-control:10}"></component-tag-control-item> </component-dynamic-load-all> </tag-select-box>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var focused = stream ()
			var empty = stream (true)

			ref ('input') .thru (tap, function (ref) {
				ref .addEventListener ('input', function () {
					empty (! ref .value)
				})
				ref .addEventListener ('focus', function () {
					focused (true)
				})
				ref .addEventListener ('blur', function () {
					focused (false)
				})
			})

			var tags = stream (['asdf', 'asdfasdfasdf', 'sdfgdsfgdsjfgl;dsgf', 'sfgh', 'asdfa', 'qwrt'])
			var selected_tags =	stream ([])
									.thru (tap, function (_selected) {
										if (args .tags__to)
											args .tags__to (_selected)
										empty (_selected .length ? true : false)
									})

			var select =	stream ()
								.thru (tap, function (tag) {
									tags (tags () .filter (
										R. pipe (
											R. equals (tag), R .not)))
									selected_tags (selected_tags () .concat ([tag]))
								})
			var delete_ =	stream ()
								.thru (tap, function (tag) {
									tags (tags () .concat ([tag]));
									selected_tags (selected_tags () .filter (
										R. pipe (
											R. equals (tag), R .not)));
								})

			focused .thru (map, noop) .thru (map, noop) .thru (tap, self .render)
			empty .thru (dropRepeats) .thru (map, noop) .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  empty ()  };
	self .expressions [1] = function (_item) { return  args .placeholder  };
	self .expressions [2] = function (_item) { return  selected_tags  };
	self .expressions [3] = function (_item) { return  _item .item__from  };
	self .expressions [4] = function (_item) { return  delete_  };
	self .expressions [5] = function (_item) { return  focused ()  };
	self .expressions [6] = function (_item) { return  focused ()  };
	self .expressions [7] = function (_item) { return  tags  };
	self .expressions [8] = function (_item) { return  _item .item__from  };
	self .expressions [9] = function (_item) { return  select  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-timeslot-highlight', '<soon-highlight if="{expression:component-timeslot-highlight:1}"> {expression:component-timeslot-highlight:2} {expression:component-timeslot-highlight:3} {expression:component-timeslot-highlight:4} </soon-highlight> <month-highlight if="{expression:component-timeslot-highlight:5}"> {expression:component-timeslot-highlight:6} </month-highlight> <day-highlight if="{expression:component-timeslot-highlight:7}"> {expression:component-timeslot-highlight:8} </day-highlight> <day-of-week-highlight> {expression:component-timeslot-highlight:9} </day-of-week-highlight> <time-highlight> {expression:component-timeslot-highlight:10} </time-highlight>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var time = function () {
				var date_time = new Date (args .timeslot__from ());
				return (function (am_pm) {
					if (am_pm === 'AM') return '上午'
					if (am_pm === 'PM') return '下午'
				}) (fecha .format (date_time, 'A')) + ' ' + fecha .format (date_time, 'h:mm');
			}
		    var month = function () {

		        return fecha .format (new Date (args .timeslot__from ()), 'M月');
		    }
		    var day = function () {

		        return fecha .format (new Date (args .timeslot__from ()), 'D');
		    }
		    var day_of_week = function () {

		        return '週' + day_of_week_to_chi (new Date (args .timeslot__from ()));
		    }
		    var how_soon = function () {
				return day_difference (fecha .format (new Date (), 'YYYY-MM-DD'), fecha .format (args .timeslot__from (), 'YYYY-MM-DD'));
		    }
		    var soon = function () {
				return how_soon () < 3;
		    }

		    args .timeslot__from .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  soon ()  };
	self .expressions [1] = function (_item) { return  Math .floor (how_soon ()) === 2 && '後天' || ''  };
	self .expressions [2] = function (_item) { return  Math .floor (how_soon ()) === 1 && '明天' || ''  };
	self .expressions [3] = function (_item) { return  Math .floor (how_soon ()) === 0 && '今天' || ''  };
	self .expressions [4] = function (_item) { return  ! soon ()  };
	self .expressions [5] = function (_item) { return  month ()  };
	self .expressions [6] = function (_item) { return  ! soon ()  };
	self .expressions [7] = function (_item) { return  day ()  };
	self .expressions [8] = function (_item) { return  day_of_week ()  };
	self .expressions [9] = function (_item) { return  time ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-timeslot-picker', '<modal> <start> <hour> <input riot-value="{expression:component-timeslot-picker:1}" pattern="d*" step="1" min="1" max="12" readonly="true"> <label up ref="{ref prefix}start-hour-up"></label> <label down ref="{ref prefix}start-hour-down"></label> </hour> <separator>:</separator> <minutes> <input riot-value="{expression:component-timeslot-picker:2}" pattern="d*" step="1" min="1" max="12" readonly="true"> <label up ref="{ref prefix}start-minute-up"></label> <label down ref="{ref prefix}start-minute-down"></label> </minutes> <label ref="{ref prefix}start-ampm-toggle">{expression:component-timeslot-picker:3}</label> </start> <end> <hour> <input riot-value="{expression:component-timeslot-picker:4}" pattern="d*" step="1" min="1" max="12" readonly="true"> <label up ref="{ref prefix}end-hour-up"></label> <label down ref="{ref prefix}end-hour-down"></label> </hour> <separator>:</separator> <minutes> <input riot-value="{expression:component-timeslot-picker:5}" pattern="d*" step="1" min="1" max="12" readonly="true"> <label up ref="{ref prefix}end-minute-up"></label> <label down ref="{ref prefix}end-minute-down"></label> </minutes> <label ref="{ref prefix}end-ampm-toggle">{expression:component-timeslot-picker:6}</label> </end> </modal>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var start_hour = stream (7)
		    var start_minute = stream (30)
		    var start_ampm = stream ('PM')
		    var end_hour = stream (9)
		    var end_minute = stream (0)
		    var end_ampm = stream ('PM')

		    var start_hour_up = ref ('start-hour-up')
		    var start_hour_down = ref ('start-hour-down')
		    var start_minute_up = ref ('start-minute-up')
		    var start_minute_down = ref ('start-minute-down')
		    var start_ampm_toggle = ref ('start-ampm-toggle')
		    var end_hour_up = ref ('end-hour-up')
		    var end_hour_down = ref ('end-hour-down')
		    var end_minute_up = ref ('end-minute-up')
		    var end_minute_down = ref ('end-minute-down')
		    var end_ampm_toggle = ref ('end-ampm-toggle')

		    mergeAll ([
		        start_hour, start_minute, start_ampm,
		        end_hour, end_minute, end_ampm
		    ])
		    .thru (map, noop) .thru (tap, self .render)
		    .thru (tap, function () {
		        if (args .timeslot__to)
		            args .timeslot__to ({
		                start: ('0' + start_hour ()) .slice (-2) + ':' + ('0' + start_minute ()) .slice (-2) + ' ' + start_ampm (),
		                end: ('0' + end_hour ()) .slice (-2) + ':' + ('0' + end_minute ()) .slice (-2) + ' ' + end_ampm ()
		            })
		    })

		    start_hour_up .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            start_hour (
		                (start_hour () % 12) + 1)
		        })
		    })
		    start_hour_down .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            start_hour (
		                (start_hour () - 1) || 12)
		        })
		    })
		    start_minute_up .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            start_minute (
		                (start_minute () + 30) % 60)
		        })
		    })
		    start_minute_down .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            start_minute (
		                (start_minute () + 30) % 60)
		        })
		    })
		    start_ampm_toggle .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            start_ampm (
		                start_ampm () === 'AM' ? 'PM' : 'AM')
		        })
		    })
		    end_hour_up .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            end_hour (
		                (end_hour () % 12) + 1)
		        })
		    })
		    end_hour_down .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            end_hour (
		                (end_hour () - 1) || 12)
		        })
		    })
		    end_minute_up .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            end_minute (
		                (end_minute () + 30) % 60)
		        })
		    })
		    end_minute_down .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            end_minute (
		                (end_minute () + 30) % 60)
		        })
		    })
		    end_ampm_toggle .thru (tap, function (ref) {
		        ref .addEventListener ('click', function () {
		            end_ampm (
		                end_ampm () === 'AM' ? 'PM' : 'AM')
		        })
		    })

	self .expressions = {};

	self .expressions [0] = function (_item) { return  ('0' + start_hour ()) .slice (-2)  };
	self .expressions [1] = function (_item) { return  ('0' + start_minute ()) .slice (-2)  };
	self .expressions [2] = function (_item) { return  start_ampm ()  };
	self .expressions [3] = function (_item) { return  ('0' + end_hour ()) .slice (-2)  };
	self .expressions [4] = function (_item) { return  ('0' + end_minute ()) .slice (-2)  };
	self .expressions [5] = function (_item) { return  end_ampm ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-tree-control-item', '<item ref="{ref prefix}item"> <status> <svg if="{expression:component-tree-control-item:1}" viewbox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg> <svg if="{expression:component-tree-control-item:2}" viewbox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"></path></svg> <svg if="{expression:component-tree-control-item:3}" viewbox="0 0 24 24"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg> </status> <label>{expression:component-tree-control-item:4}</label> <branch-status if="{expression:component-tree-control-item:5}"> <button type="button"> <svg if="{expression:component-tree-control-item:6}" viewbox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path></svg> <svg if="{expression:component-tree-control-item:7}" viewbox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg> <component-wavify center></component-wavify> </button> </branch-status> <component-wavify></component-wavify> </item> <branch if="{expression:component-tree-control-item:8}"> <component-tree-control items__from="{expression:component-tree-control-item:9}" items__to="{expression:component-tree-control-item:10}"></component-tree-control> </branch>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var zeroed =	one_cache (function (tree) {
								if (typeof tree === 'boolean') {
									return ! tree;
								}
								else {
									var list = Object .keys (tree);
									for (var nth = 0; nth < list .length; nth ++) {
										var item = list [nth];
										if (! zeroed (tree [item]))
											return false;
									}
									return true;
								}
							});
			var filled = 	one_cache (function (tree) {
								if (typeof tree === 'boolean') {
									return tree;
								}
								else {
									var list = Object .keys (tree);
									for (var nth = 0; nth < list .length; nth ++) {
										var item = list [nth];
										if (! filled (tree [item]))
											return false;
									}
									return true;
								}
							});
			var tree = args .item__from  .thru (dropRepeatsWith, json_equal);
				tree .thru (map, noop) .thru (tap, self .render)

		    var name = mechanism (function () {
		        return tree () .name;
		    }, [tree])
		    var status = mechanism (function () {
		        return tree () .status;
		    }, [tree])

		    var empty = mechanism (function () {
		        return zeroed (status ());
		    }, [status])
		    var half = mechanism (function () {
		        return ! zeroed (status ()) && ! filled (status ());
		    }, [status])
		    var full = mechanism (function () {
		        return filled (status ());
		    }, [status])

		    var branched = mechanism (function () {
		        return typeof status () !== 'boolean';
		    }, [status])
		    var branch_open = mechanism (function () {
		        return typeof status () !== 'boolean' && ! zeroed (status ());
		    }, [status])

		    ref ('item')
				.thru (tap, function (ref) {
					ref .addEventListener ('click', function () {
						toggle ('click');
					}, true)
				});

			var zero =	function (inp) {
							if (typeof inp === 'boolean') {
								return false;
							}
							else {
								var list = Object .keys (inp);
								var tree = {};
								for (var nth = 0; nth < list .length; nth ++) {
									var item = list [nth];
									tree [item] = zero (inp [item]);
								}
								return tree;
							}
						};
			var fill =	function (inp) {
							if (typeof inp === 'boolean') {
								return true;
							}
							else {
								var list = Object .keys (inp);
								var tree = {};
								for (var nth = 0; nth < list .length; nth ++) {
									var item = list [nth];
									tree [item] = fill (inp [item]);
								}
								return tree;
							}
						};

			var toggle = stream () .thru (tap, known_as ('toggle'))
				.thru (tap, function () {
					var _name = name ();
					var _status = status ();
					args .substitute__to ({
						item: _name,
						sub: zeroed (_status) ? fill (_status) : zero (_status)
					})
				});

			var modifications =	stream () .thru (tap, known_as ('modify'))
				.thru (tap, function (sub) {
					args .substitute__to ({
						item: name (),
						sub: sub
					})
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  empty ()  };
	self .expressions [1] = function (_item) { return  half ()  };
	self .expressions [2] = function (_item) { return  full ()  };
	self .expressions [3] = function (_item) { return  name ()  };
	self .expressions [4] = function (_item) { return  branched ()  };
	self .expressions [5] = function (_item) { return  ! empty ()  };
	self .expressions [6] = function (_item) { return  empty ()  };
	self .expressions [7] = function (_item) { return  branch_open ()  };
	self .expressions [8] = function (_item) { return  status  };
	self .expressions [9] = function (_item) { return  modifications  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-tree-control', '<component-dynamic-load-all items__from="{expression:component-tree-control:1}"> <component-tree-control-item item__from="{expression:component-tree-control:2}" substitute__to="{expression:component-tree-control:3}"></component-tree-control-item> </component-dynamic-load-all>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var tree = 	args .items__from
							.thru (dropRepeatsWith, json_equal)
			var items = mechanism (function () {
					return 	Object .keys (tree ()) .map (function (name) {
								return 	{
											name: name,
											status: tree () [name]
										};
							});
				}, [tree])

			var substitute = 	stream ()
									.thru (tap, function (_sub) {
										if (! json_equal (tree () [_sub .item], _sub .sub))
											args .items__to (with_ (_sub .item, _sub .sub) (tree ()))
									})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  items  };
	self .expressions [1] = function (_item) { return  _item .item__from  };
	self .expressions [2] = function (_item) { return  substitute  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-wavify', '', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    var time = (args .time / 1000 || 2)
		    var background = args .background;

		    var parent = self .root .parentElement;
		    parent .addEventListener ('click', function (e) {

		        var rect = parent .getBoundingClientRect ();
		        var x_base = rect .width;
		        var y_base = rect .height;
		        var x = args .center !== undefined ? x_base / 2 : e .clientX - rect .left;
		        var y = args .center !== undefined ? y_base / 2 : e .clientY - rect .top;
		        var x_max = x > 0.5 * x_base ? x : x_base - x;
		        var y_max = y > 0.5 * y_base ? y : y_base - y;
		        var r = Math .sqrt (x_max * x_max + y_max * y_max)
		        var wave = document .createElement ('wave');
		        wave .style .width = 2 * r + 'px';
		        wave .style .height = 2 * r + 'px';
		        wave .style .top = (y - r) + 'px';
		        wave .style .left = (x - r) + 'px';
		        wave .style .transition = 'opacity ' + time + 's cubic-bezier(0.23, 1, 0.32, 1) 0s, transform ' + (time / 2) + 's cubic-bezier(0.23, 1, 0.32, 1) 0s';
		        if (background)
		            wave .style .backgroundColor = background;
		        self .root .insertBefore (wave, null);
		        wait (60) .then
		            (function () {
		                wave .setAttribute ('move', true);
		            })

		        waitdone = wait (time * 1000 + 1000) .then
		            (self .root .removeChild .bind (self .root, wave))

		        if (args .waves__to)
		            args .waves__to (from_promise (done))
		    }, true);

	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('component-x-button', '<icon-holder nav-button><svg width="13" height="13" viewbox="0 0 13 13" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>cancel</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(1022 334)" figma:type="canvas"><g id="cancel" style="mix-blend-mode:normal;" figma:type="frame"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#1c8fcd43-ce74-4b25-b1b4-2f698b0c61a8" transform="translate(-1022 -334)" fill="#5DADE2" style="mix-blend-mode:normal;"></use></g></g></g></g><defs><path id="1c8fcd43-ce74-4b25-b1b4-2f698b0c61a8" d="M 5.87831 6.50199L 0.123962 12.2965C -0.0359037 12.4575 -0.0359037 12.7183 0.123962 12.8793C 0.203793 12.9599 0.30861 13 0.413223 13C 0.51804 13 0.622653 12.9599 0.702484 12.8793L 6.5001 7.04119L 12.2977 12.8793C 12.3778 12.9599 12.4824 13 12.587 13C 12.6916 13 12.7964 12.9599 12.8762 12.8793C 13.0361 12.7183 13.0361 12.4575 12.8762 12.2965L 7.12209 6.50199L 12.8801 0.703352C 13.04 0.54237 13.04 0.281566 12.8801 0.120583C 12.7202 -0.0401945 12.4612 -0.0401945 12.3016 0.120583L 6.5003 5.96279L 0.698422 0.120788C 0.538556 -0.0399899 0.279765 -0.0399899 0.119899 0.120788C -0.0399664 0.28177 -0.0399664 0.542574 0.119899 0.703557L 5.87831 6.50199Z"></path></defs></svg></icon-holder>', '', '', function(opts) {
});
riot.tag2('invalidated-a', '{ enter yield }<yield></yield>{ exit yield }', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	self ._yield_levels = 0;
	self ._yield_level = 0;
	self ._yield_on = function () {   self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };
	self ._yield_off = function () {   self ._yielding = false; self ._yield_level--; return ""; };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	var yield_scope = self .parent;
	while (yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);
	if (yield_scope .yielded_diff) _refs .thru (map, yield_refs) .thru (diff_refs) .thru (tap, yield_scope .yielded_diff);
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

		    self .root .addEventListener ('click', function (e) {
		        if (! e .defaultPrevented) {
		            e .preventDefault ();
		            window .location .href = self .root .href;
		        }
		    })

		    self .addEventListener = self .root .addEventListener .bind (self .root);

	if (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-league-table', '<nav> <nav-bar> <nav-buttons> <a href="#team/profile"> <component-x-button></component-x-button> </a> </nav-buttons> <nav-title> <component-page-title>聯賽表</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <table> <tr> <th>Rank</th> <th>Name</th> <th></th> <th>Score</th> <th>勝率</th> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr active> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> <tr> <td>1</td> <td>Happy Footbro FC</td> <td><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon><icon class="fa-star"></icon></td> <td>1654</td> <td>92%</td> </tr> </table> <rest></rest> </component-main-content> <component-tabs tab="teams"></component-tabs>', '', '', function(opts) {
});
riot.tag2('page-match-catalog-preview', '<nav> <nav-bar> <nav-buttons> <a href="#match/catalog"> <component-back-button></component-back-button> </a> </nav-buttons> <nav-title> <component-page-title>加入球賽</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <match-preview> <info-area info="team"> <info-holder> <info-header> <home>主隊</home> <away>客隊(己隊)</away> </info-header> <component-spacing height="5px"></component-spacing> <team-name> <home>{expression:page-match-catalog-preview:1}</home> <label>VS</label> <away>{expression:page-match-catalog-preview:2}</away> </team-name> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-age-range> <home>{expression:page-match-catalog-preview:3}</home> <label>年齡</label> <away>{expression:page-match-catalog-preview:4}</away> </team-age-range> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-shirt-color> <home>橙</home> <label>球衣</label> <away><a>綠<svg ref="{ref prefix}svg" width="9" height="16" viewbox="0 0 9 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>right-arrow</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(734 258)" figma:type="canvas"><g id="right-arrow" style="mix-blend-mode:normal;" figma:type="frame"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#0b39f1b4-0614-4a28-a406-f607ebc22df0" transform="translate(-733.297 -256.973)" fill="#CCD1D1" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#dd187232-741f-4707-87f3-4b5c131211ec" transform="translate(-733.721 -257.397)" fill="#CCD1D1" style="mix-blend-mode:normal;"></use></g></g></g></g><defs><path id="0b39f1b4-0614-4a28-a406-f607ebc22df0" d="M 0.8484 14.0484L -6.63757e-08 13.2L 6.1755 7.0242L -6.63757e-08 0.8484L 0.8484 1.02997e-08L 7.8726 7.0242L 0.8484 14.0484Z"></path><path id="dd187232-741f-4707-87f3-4b5c131211ec" d="M 1.2726 14.8968L 6.63757e-08 13.6242L 6.1755 7.4484L 6.63757e-08 1.2726L 1.2726 0L 8.7213 7.4484L 1.2726 14.8968ZM 0.8484 13.6242L 1.2726 14.0484L 7.8726 7.4484L 1.2726 0.8484L 0.8484 1.2726L 7.0239 7.4484L 0.8484 13.6242Z"></path></defs></svg></a></away> </team-shirt-color> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-division> <home>Division Premier</home> <label>實力</label> <away>Division 1</away> </team-division> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-rating> <home>4.2/5</home> <label>球品</label> <away>5/5</away> </team-rating> <component-spacing height="5px"></component-spacing> </info-holder> </info-area> <info-area info="match"> <info-holder> <info-header>賽事資料</info-header> <match-details> <date>{expression:page-match-catalog-preview:5}</date> <time>{expression:page-match-catalog-preview:6}</time> </match-details> <match-location> <label>地點</label> <item> <icon-holder><icon class="fa-map-marker"></icon></icon-holder> {expression:page-match-catalog-preview:7} </item> </match-location> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <match-pitch> <label>場地</label> <item>{expression:page-match-catalog-preview:8}</item> </match-pitch> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <match-fee> <label>費用</label> <item>{expression:page-match-catalog-preview:9}</item> </match-fee> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="10px"></component-spacing> <match-tags> <tag>聯賽</tag> <tag>競爭性</tag> </match-tags> </info-holder> </info-area> <component-spacing height="20px"></component-spacing> <component-action> <a href="#schedule/upcoming" ref="{ref prefix}apply-button">確定</a> </component-action> </match-preview> </component-main-content> <component-page-tabs tab="match"></component-page-tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var match_item = stream ();
			var team_item = stream ();

			mergeAll ([
				match_item,
				team_item
			])
			.thru (map, noop) .thru (map, noop) .thru (tap, self .render);

			var home_name = mechanism (function () {
				return match_item () .home_team .long_name;
			}, [ match_item ])
			var home_shirt_color = mechanism (function () {
				return match_item () .home_team_jersey_color;
			}, [ match_item ])
			var home_age_range = mechanism (function () {
				return match_item () .home_team_average_age;
			}, [ match_item ])

			var away_name = mechanism (function () {
				return team_item () .long_name;
			}, [ team_item ])
			var away_age_range = mechanism (function () {
				return team_item () .average_age;
			}, [ team_item ])

			var match_date = mechanism (function () {

				var date_time = new Date (match_item () .start_at);
				return date_to_chi (date_time) + ' 星期' + day_of_week_to_chi (date_time);
			}, [ match_item ])
			var match_times = mechanism (function () {

				var start_date_time = new Date (match_item () .start_at)
				var end_date_time = new Date (match_item () .end_at);

				return times (start_date_time, end_date_time)
			}, [ match_item ])
			var match_location = mechanism (function () {

				return location_from_api (match_item () .location)
			}, [ match_item ])
			var match_pitch = mechanism (function () {

				return match_item () .match_type + ' - ' + match_item () .pitch .pitch_type;
			}, [ match_item ])
			var match_fee = mechanism (function () {

				return fee_to_chi (match_item () .fee_per_team);
			}, [ match_item ])

			ref ('apply-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function (e) {
					e .preventDefault ();

					applying (true);

					inquire (api () .match_open (team_item () .id, parse (args [0])))
						.then (function (data) {
							applying (false);
							if (data)
								window .location .hash = ref .hash;
						})
				})
			})
			var applying = stream ();
			applying .thru (map, noop) .thru (map, noop) .thru (tap, self .render)

			args .cycle__from
				.thru (tap, function (cycle) {
					if (api () .match_to_find_info) {
						inquire (api () .match_to_find_info (parse (args [0])))
							.then (function (match) {
								match_item (match)
							});
						inquire (api () .teams)
							.then (function (teams) {
								team_item (teams [0])
							});
					}
					else
						window .location .hash = '#login'
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  home_name ()  };
	self .expressions [1] = function (_item) { return  away_name ()  };
	self .expressions [2] = function (_item) { return  home_age_range ()  };
	self .expressions [3] = function (_item) { return  away_age_range ()  };
	self .expressions [4] = function (_item) { return  match_date ()  };
	self .expressions [5] = function (_item) { return  match_times ()  };
	self .expressions [6] = function (_item) { return  match_location ()  };
	self .expressions [7] = function (_item) { return  match_pitch ()  };
	self .expressions [8] = function (_item) { return  match_fee ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-match-catalog', '<nav> <nav-bar> <nav-buttons> <a> <component-filter-button></component-filter-button> </a> </nav-buttons> <nav-buttons> </nav-buttons> </nav-bar> <component-match-tabs tab="all"></component-match-tabs> </nav> <component-main-content> <match-catalog> <component-loading-item if="{expression:page-match-catalog:1}"></component-loading-item> <component-item if="{expression:page-match-catalog:2}">未有球賽</component-item> <component-dynamic-load items_to_load="13" interval_for_loading="50" item_height="{expression:page-match-catalog:3}" items__from="{expression:page-match-catalog:4}"> <component-match-catalog-item item__from="{expression:page-match-catalog:5}"></component-match-catalog-item> </component-dynamic-load> </match-catalog> </component-main-content> <component-page-tabs tab="match"></component-page-tabs> <a href="#match/open"> <component-add-fab></component-add-fab> </a>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var matches_items = stream ();

			var matches =	matches_items
								.thru (map, function (match_list) {
									var last_date;
									return 	match_list .map (function (match) {
												var curr = '' + fecha .format (new Date (match .start_at), 'YYYYMM');
												if (last_date === curr)
													return 	{ match: match };
												else {
													last_date = curr;
													return 	{ date: curr, match: match };
												}
											});
								})
			var item_height = function (item) {
				var height = 0;
				if (item .match)
					height += 96;
				if (item .date)
					height += 26;
				return height;
			}

			var status =	mechanism (function () {
								if (matches () .length)
									return 'loaded';
								else
									return 'no-items'
							}, [matches])
								.thru (begins_with, 'loading')
			status .thru (map, noop) .thru (tap, self .render)

			args .cycle__from
				.thru (tap, function (cycle) {
					if (api () .matches_to_find) {
						inquire (api () .matches_to_find)
							.then (function (matches) {
								matches_items (matches)
							})
					}
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  status () === 'loading'  };
	self .expressions [1] = function (_item) { return  status () === 'no-items'  };
	self .expressions [2] = function (_item) { return  item_height  };
	self .expressions [3] = function (_item) { return  matches  };
	self .expressions [4] = function (_item) { return  _item .item__from  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-match-open-tag-step', '<nav> <nav-bar> <nav-buttons> <a href="#match/open"> <component-back-button></component-back-button> </a> </nav-buttons> <nav-title> <component-page-title>建立球賽</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <open-match> <tags> <label>標籤提供更多球賽資料</label> <component-tag-control>請輸入tags</component-tag-control> </tags> <reserve-priorities> <is-private> </is-private> <days-to-reserve> </days-to-reserve> </reserve-priorities> <component-action> <a href="#schedule/upcoming" ref="{ref prefix}open-button" disabled="{expression:page-match-open-tag-step:1}">建立</a> </component-action> </open-match> </component-main-content> <component-page-tabs tab="match"></component-page-tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			self .temp = true;

			var opening = stream ();
			opening .thru (map, noop) .thru (tap, self .render)

			ref ('open-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function (e) {
					e .preventDefault ();

					opening (true);

					inquire_last (api () .teams) .then (function (teams) {
						return teams [0] .id
					}) .then (function (team_id) {
						inquire (api () .match_open (team_id), {
					        start_at: 	fecha .format
					        				(fecha .parse (parse (args [0]) + ' ' + parse (args [1]) .split (' - ') [0], 'YYYY年M月D日 h:mm A'),
					        				'YYYY-MM-DDTHH:mm:ss+08:00'),
					        end_at: 	fecha .format
					        				(fecha .parse (parse (args [0]) + ' ' + parse (args [1]) .split (' - ') [1], 'YYYY年M月D日 h:mm A'),
					        				'YYYY-MM-DDTHH:mm:ss+08:00'),
					        reserved_day_for_trusted_team: 0,
							home_team_average_age: 30,
					        home_team_jersey_color: parse (args [3]),
					        fee_per_team: + parse (args [4]) || +0,
					        match_type: parse (args [5]),
					        pitch_id: 1,
					        tag_list: ['lol']
						})
							.then (function (data) {
								opening (false);
								if (data)
									window .location .hash = ref .hash;
							})
					})
				})
			})

			var date = function () {

				var date = parse (args [0]);
				var date_time = date_from_chi (date)
				return date + ' ' + day_of_week_to_chi (date_time);
			}
			var times = function () {

				var date = parse (args [0]);
				var time = parse (args [1]);
				var duration = parse (args [2]);

				var start_date_time = fecha .parse (date + ' ' + time, 'YYYY年M月D日 h:mm A')
				var end_date_time = new Date (start_date_time .getTime () + duration * 60000);

				return times (start_date_time, end_date_time)
			}
			var location = function () {

				return parse (args [4])
			}
			var match_type = function () {

				return parse (args [6]) + ' - ' + parse (args [7]);
			}
			var fee = function () {

				var fee = parse (args [5]);
				return fee_to_chi (fee)
			}

	self .expressions = {};

	self .expressions [0] = function (_item) { return  opening ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-match-open', '<nav> <nav-bar> <nav-buttons> <a href="#match/catalog"> <component-cancel-button></component-cancel-button> </a> </nav-buttons> <nav-title> <component-page-title>建立球賽</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <open-match> <info-area info="match"> <info-holder> <info-header> 賽事資料 </info-header> <component-spacing height="10px"></component-spacing> <match-date> <label> <svg width="16" height="15" viewbox="0 0 16 15" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>Group</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(1157 296)" figma:type="canvas"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#84ad6479-2db8-4c8a-a2bf-a12046b20303" transform="translate(-1156.52 -296)" fill="#1A5276" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#96694655-9fe0-4957-9fa4-3de07b67134f" transform="translate(-1154.11 -290.25)" fill="#1A5276" style="mix-blend-mode:normal;"></use></g></g></g><defs><path id="84ad6479-2db8-4c8a-a2bf-a12046b20303" d="M 14.7321 1L 12.8571 1L 12.8571 0.25C 12.8571 0.11175 12.7374 0 12.5893 0L 10.7143 0C 10.5662 0 10.4464 0.11175 10.4464 0.25L 10.4464 1L 4.55357 1L 4.55357 0.25C 4.55357 0.11175 4.43384 0 4.28571 0L 2.41071 0C 2.26259 0 2.14286 0.11175 2.14286 0.25L 2.14286 1L 0.267857 1C 0.119732 1 0 1.11175 0 1.25L 0 4L 0 14.75C 0 14.8883 0.119732 15 0.267857 15L 14.7321 15C 14.8803 15 15 14.8883 15 14.75L 15 4L 15 1.25C 15 1.11175 14.8803 1 14.7321 1ZM 10.9821 0.5L 12.3214 0.5L 12.3214 1.25L 12.3214 2L 10.9821 2L 10.9821 1.25L 10.9821 0.5ZM 2.67857 0.5L 4.01786 0.5L 4.01786 1.25L 4.01786 2L 2.67857 2L 2.67857 1.25L 2.67857 0.5ZM 0.535714 1.5L 2.14286 1.5L 2.14286 2.25C 2.14286 2.38825 2.26259 2.5 2.41071 2.5L 4.28571 2.5C 4.43384 2.5 4.55357 2.38825 4.55357 2.25L 4.55357 1.5L 10.4464 1.5L 10.4464 2.25C 10.4464 2.38825 10.5662 2.5 10.7143 2.5L 12.5893 2.5C 12.7374 2.5 12.8571 2.38825 12.8571 2.25L 12.8571 1.5L 14.4643 1.5L 14.4643 3.75L 0.535714 3.75L 0.535714 1.5ZM 0.535714 14.5L 0.535714 4.25L 14.4643 4.25L 14.4643 14.5L 0.535714 14.5Z"></path><path id="96694655-9fe0-4957-9fa4-3de07b67134f" d="M 7.23214 0L 5.35714 0L 4.82143 0L 2.94643 0L 2.41071 0L 0 0L 0 2.25L 0 2.75L 0 4.5L 0 5L 0 7.25L 2.41071 7.25L 2.94643 7.25L 4.82143 7.25L 5.35714 7.25L 7.23214 7.25L 7.76786 7.25L 10.1786 7.25L 10.1786 5L 10.1786 4.5L 10.1786 2.75L 10.1786 2.25L 10.1786 0L 7.76786 0L 7.23214 0ZM 5.35714 0.5L 7.23214 0.5L 7.23214 2.25L 5.35714 2.25L 5.35714 0.5ZM 7.23214 4.5L 5.35714 4.5L 5.35714 2.75L 7.23214 2.75L 7.23214 4.5ZM 2.94643 2.75L 4.82143 2.75L 4.82143 4.5L 2.94643 4.5L 2.94643 2.75ZM 2.94643 0.5L 4.82143 0.5L 4.82143 2.25L 2.94643 2.25L 2.94643 0.5ZM 0.535714 0.5L 2.41071 0.5L 2.41071 2.25L 0.535714 2.25L 0.535714 0.5ZM 0.535714 2.75L 2.41071 2.75L 2.41071 4.5L 0.535714 4.5L 0.535714 2.75ZM 2.41071 6.75L 0.535714 6.75L 0.535714 5L 2.41071 5L 2.41071 6.75ZM 4.82143 6.75L 2.94643 6.75L 2.94643 5L 4.82143 5L 4.82143 6.75ZM 7.23214 6.75L 5.35714 6.75L 5.35714 5L 7.23214 5L 7.23214 6.75ZM 9.64286 6.75L 7.76786 6.75L 7.76786 5L 9.64286 5L 9.64286 6.75ZM 9.64286 4.5L 7.76786 4.5L 7.76786 2.75L 9.64286 2.75L 9.64286 4.5ZM 9.64286 0.5L 9.64286 2.25L 7.76786 2.25L 7.76786 0.5L 9.64286 0.5Z"></path></defs></svg> 日期 </label> <item> <control-holder> <component-table-control message__from="{expression:page-match-open:1}"> <component-modal-holder> <component-date-picker date__to="{expression:page-match-open:2}"></component-date-picker> </component-modal-holder> </component-table-control> </control-holder> </item> </match-date> <component-spacing height="10px"></component-spacing> <component-separator></component-separator> <component-spacing height="10px"></component-spacing> <match-time> <label> <svg width="15" height="15" viewbox="0 0 15 15" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>Group</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(1157 267)" figma:type="canvas"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#e182a5c5-d7f4-48a7-a83e-7f5e09a4b64c" transform="translate(-1157 -267)" fill="#8E44AD" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#2f493b0a-c7a8-4323-ae6f-91c03ef1cc52" transform="translate(-1153.88 -265.56)" fill="#8E44AD" style="mix-blend-mode:normal;"></use></g></g></g><defs><path id="e182a5c5-d7f4-48a7-a83e-7f5e09a4b64c" d="M 7.2 0C 3.22992 0 0 3.22992 0 7.2C 0 11.1701 3.22992 14.4 7.2 14.4C 11.1701 14.4 14.4 11.1701 14.4 7.2C 14.4 3.22992 11.1701 0 7.2 0ZM 7.2 13.92C 3.49464 13.92 0.48 10.9054 0.48 7.2C 0.48 3.49464 3.49464 0.48 7.2 0.48C 10.9054 0.48 13.92 3.49464 13.92 7.2C 13.92 10.9054 10.9054 13.92 7.2 13.92Z"></path><path id="2f493b0a-c7a8-4323-ae6f-91c03ef1cc52" d="M 4.08 0C 3.94752 0 3.84 0.10728 3.84 0.24L 3.84 5.76L 0.24 5.76C 0.10752 5.76 0 5.86728 0 6C 0 6.13272 0.10752 6.24 0.24 6.24L 4.08 6.24C 4.21248 6.24 4.32 6.13272 4.32 6L 4.32 0.24C 4.32 0.10728 4.21248 0 4.08 0Z"></path></defs></svg> 時間 </label> <item> <control-holder> <component-table-control message__from="{expression:page-match-open:3}"> <component-modal-holder> <component-timeslot-picker timeslot__to="{expression:page-match-open:4}"></component-timeslot-picker> <component-spacing height="25px"></component-spacing> <component-action> <a ref="{ref prefix}timeslot-button"> <icon class="fa-check"></icon> </a> </component-action> </component-modal-holder> </component-table-control> </control-holder> </item> </match-time> <component-spacing height="10px"></component-spacing> <component-separator></component-separator> <component-spacing height="10px"></component-spacing> <match-location> <label> <svg width="14" height="19" viewbox="0 0 14 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>placeholder</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(1156 240)" figma:type="canvas"><g id="placeholder" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#63932ca2-69f6-4206-8065-36e54db2dad2" transform="translate(-1155.88 -240)" fill="#EE3840" style="mix-blend-mode:normal;"></use></g></g></g><defs><path id="63932ca2-69f6-4206-8065-36e54db2dad2" d="M 11.238 1.94151C 8.66733 -0.647169 4.49916 -0.647169 1.92814 1.94151C -0.388274 4.27416 -0.649034 8.6663 1.31681 11.3057L 6.58307 18.9645L 11.8493 11.3057C 13.8152 8.6663 13.5544 4.27416 11.238 1.94151ZM 6.64717 8.75274C 5.44695 8.75274 4.47417 7.77314 4.47417 6.56451C 4.47417 5.35588 5.44695 4.37628 6.64717 4.37628C 7.84739 4.37628 8.82017 5.35588 8.82017 6.56451C 8.82017 7.77314 7.84739 8.75274 6.64717 8.75274Z"></path></defs></svg> 地點 </label> <item> <control-holder> <component-table-control message__from="{expression:page-match-open:5}"> <component-pitch-picker location__to="{expression:page-match-open:6}"></component-pitch-picker> </component-table-control> </control-holder> </item> </match-location> <component-spacing height="10px"></component-spacing> <component-separator></component-separator> <component-spacing height="10px"></component-spacing> <match-type-number-of-players> <label> <svg width="14" height="19" viewbox="0 0 14 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>people</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(1157 32)" figma:type="canvas"><g id="people" style="mix-blend-mode:normal;" figma:type="frame"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="XMLID 2038" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#56178ad8-59fa-4481-ab2a-cb6ddea229be" transform="translate(-1151.18 -28.1659)" fill="#A7A9AC" style="mix-blend-mode:normal;"></use></g><g id="XMLID 2039" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#48c1c4c1-e6a8-47cf-aca6-942ef11301e0" transform="translate(-1152.48 -23.7096)" fill="#A7A9AC" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#4d4b89ab-a4b0-4a8c-8a38-24289e2946ce" transform="translate(-1157 -23.2427)" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#54e17de2-2417-4e01-9cf7-39f13e91a977" transform="translate(-1155.78 -27.4191)" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#64733042-8ec3-4fac-b1ca-769ce78bcd18" transform="translate(-1147.51 -23.2456)" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#c29ea2c3-7373-466e-b0d2-87e5940fb610" transform="translate(-1147.05 -27.4191)" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#ca8b21ef-a843-4748-abd8-d25ccc471637" transform="translate(-1152.79 -24.0434)" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#00ad5f2a-5da3-4c05-a667-db4226456e87" transform="translate(-1151.49 -28.5)" style="mix-blend-mode:normal;"></use></g></g></g><mask id="mask0_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask0_alpha)" figma:type="frame"></g><mask id="mask1_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask1_alpha)" figma:type="frame"></g><mask id="mask2_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask2_alpha)" figma:type="frame"></g><mask id="mask3_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask3_alpha)" figma:type="frame"></g><mask id="mask4_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask4_alpha)" figma:type="frame"></g><mask id="mask5_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask5_alpha)" figma:type="frame"></g><mask id="mask6_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask6_alpha)" figma:type="frame"></g><mask id="mask7_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask7_alpha)" figma:type="frame"></g><mask id="mask8_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask8_alpha)" figma:type="frame"></g><mask id="mask9_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask9_alpha)" figma:type="frame"></g><mask id="mask10_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask10_alpha)" figma:type="frame"></g><mask id="mask11_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask11_alpha)" figma:type="frame"></g><mask id="mask12_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask12_alpha)" figma:type="frame"></g><mask id="mask13_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask13_alpha)" figma:type="frame"></g><mask id="mask14_alpha" mask-type="alpha"><path d="M -1157 -27L -1154.35 -27L -1154.35 -24.1405L -1157 -24.1405L -1157 -27Z" fill="#FFFFFF"></path></mask><g id="Group" style="mix-blend-mode:normal;" mask="url(#mask14_alpha)" figma:type="frame"></g></g></g><defs><path id="56178ad8-59fa-4481-ab2a-cb6ddea229be" d="M 1.18104 3.31295C 1.18441 3.31295 1.18777 3.31295 1.18777 3.31295C 2.54714 3.29825 2.34862 1.31295 2.34862 1.31295C 2.29478 -0.0142538 1.28199 -0.00322437 1.18104 0.000452105C 1.0801 -0.00322437 0.0673067 -0.0142538 0.0101057 1.30928C 0.0101057 1.30928 -0.188415 3.29457 1.17432 3.30928C 1.17432 3.31295 1.17768 3.31295 1.18104 3.31295Z"></path><path id="48c1c4c1-e6a8-47cf-aca6-942ef11301e0" d="M 2.47974 1.32353L 3.35795 1.12197e-07C 3.35795 1.12197e-07 3.97706 0.272059 4.48178 0.680147C 4.613 0.786765 4.67357 0.849265 4.79134 0.977941C 5.07061 1.28309 4.95284 3.05147 4.79134 3.69853C 4.62983 4.34559 4.15539 5.27574 4.15539 5.27574C 4.06118 5.51103 4.00062 5.76471 3.97706 6.01838L 3.3714 12.5074C 3.35122 12.7132 3.19307 12.8713 3.00464 12.8713L 2.47974 12.8713L 1.95484 12.8713C 1.76641 12.8713 1.6049 12.7132 1.58808 12.5074L 0.98242 6.01838C 0.958866 5.76103 0.898301 5.51103 0.804087 5.27574C 0.804087 5.27574 0.329655 4.34926 0.168146 3.69853C 0.00663766 3.05147 -0.111129 1.28309 0.168146 0.977941C 0.285913 0.849265 0.346479 0.786765 0.477705 0.680147C 0.98242 0.275735 1.60154 1.12197e-07 1.60154 1.12197e-07L 2.47974 1.32353Z"></path><path id="4d4b89ab-a4b0-4a8c-8a38-24289e2946ce" d="M 0.16683 3.88974C 0.318245 4.49268 0.722016 5.30518 0.782582 5.43018C 0.856607 5.61768 0.903714 5.81254 0.920538 6.01474L 1.48918 12.103C 1.52283 12.4669 1.80211 12.7427 2.13858 12.7427L 3.12109 12.7427C 3.45757 12.7427 3.73685 12.4669 3.77049 12.103L 4.33914 6.01474C 4.35933 5.80886 4.40644 5.60665 4.48383 5.41915C 4.55112 5.25004 4.48046 5.05518 4.32905 4.98165C 4.17427 4.90812 3.99593 4.98533 3.92864 5.15077C 3.8277 5.40445 3.7604 5.67283 3.73685 5.94856L 3.1682 12.0368C 3.16484 12.0589 3.14801 12.0772 3.12782 12.0772L 2.14531 12.0772C 2.12512 12.0772 2.10494 12.0589 2.10494 12.0368L 1.52956 5.94489C 1.50264 5.66915 1.43871 5.40077 1.33777 5.14709C 1.3344 5.13606 1.33104 5.12871 1.32431 5.11768C 1.32094 5.11033 0.896984 4.27577 0.755664 3.71327C 0.600885 3.08459 0.557143 1.71695 0.685004 1.4743C 0.785947 1.36401 0.829689 1.31989 0.933997 1.23533C 1.19981 1.02209 1.50601 0.8493 1.70453 0.746359L 2.38421 1.76842C 2.44141 1.85298 2.53226 1.90445 2.62984 1.90445C 2.72742 1.90445 2.81827 1.85298 2.87547 1.76842L 3.69983 0.529447C 3.79741 0.382388 3.76713 0.17283 3.63254 0.0625354C 3.49795 -0.0440822 3.30616 -0.010994 3.20521 0.136065L 2.62647 1.00371L 2.05446 0.139742C 1.97371 0.0147415 1.8223 -0.0293763 1.69443 0.0257707C 1.67088 0.0368001 1.07195 0.301506 0.573967 0.702242C 0.432647 0.816212 0.365351 0.886065 0.247584 1.01474C -0.183106 1.48533 0.0557928 3.44121 0.16683 3.88974Z"></path><path id="54e17de2-2417-4e01-9cf7-39f13e91a977" d="M 1.38579 3.76838C 1.39252 3.76838 1.39925 3.76838 1.40598 3.76838C 1.40935 3.76838 1.41607 3.76838 1.41944 3.76838C 1.42617 3.76838 1.4329 3.76838 1.44299 3.76838C 1.83331 3.75735 2.16305 3.60294 2.39859 3.3125C 2.89994 2.69485 2.82928 1.66544 2.81582 1.53676C 2.76535 0.400735 2.04192 -1.40246e-08 1.43963 -1.40246e-08C 1.42953 -1.40246e-08 1.41944 -1.40246e-08 1.41271 -1.40246e-08C 1.40598 -1.40246e-08 1.39589 -1.40246e-08 1.38579 -1.40246e-08C 0.783499 -1.40246e-08 0.0634386 0.404412 0.00960238 1.53676C -0.000491915 1.66544 -0.0745167 2.69485 0.426833 3.3125C 0.665732 3.60294 0.995479 3.76103 1.38579 3.76838ZM 0.618625 1.59559C 0.618625 1.58824 0.618625 1.58088 0.618625 1.57353C 0.652273 0.779412 1.11325 0.661765 1.38579 0.661765L 1.39925 0.661765C 1.40598 0.661765 1.41607 0.661765 1.4228 0.661765L 1.43626 0.661765C 1.70881 0.661765 2.16978 0.779412 2.20343 1.57353C 2.20343 1.58088 2.20343 1.58824 2.20343 1.59191C 2.22698 1.82721 2.22025 2.51471 1.93425 2.86765C 1.80975 3.02206 1.63815 3.09926 1.41271 3.09926C 1.40935 3.09926 1.40935 3.09926 1.40598 3.09926C 1.18054 3.09559 1.00894 3.02206 0.884442 2.86765C 0.601801 2.51838 0.598436 1.83088 0.618625 1.59559Z"></path><path id="64733042-8ec3-4fac-b1ca-769ce78bcd18" d="M 0.182246 4.98088C 0.0274668 5.05441 -0.0431935 5.25294 0.0274666 5.41838C 0.104856 5.60956 0.151964 5.80808 0.172152 6.01397L 0.740798 12.1022C 0.774445 12.4662 1.05372 12.7419 1.3902 12.7419L 2.37271 12.7419C 2.70919 12.7419 2.98846 12.4662 3.02211 12.1022L 3.59076 6.01397C 3.61094 5.81176 3.65469 5.61691 3.72871 5.42941C 3.78928 5.30809 4.19641 4.49558 4.34446 3.88897C 4.4555 3.44044 4.69776 1.48456 4.26707 1.01397C 4.14931 0.885291 4.08201 0.815438 3.94069 0.701467C 3.44271 0.300732 2.84714 0.036026 2.82022 0.0249966C 2.689 -0.0338269 2.54095 0.0139669 2.46019 0.138967L 1.88145 1.00661L 1.29935 0.142644C 1.20177 -0.00809172 1.00998 -0.0375035 0.872023 0.0691142C 0.737433 0.175732 0.70715 0.385291 0.804728 0.536026L 1.6291 1.775C 1.6863 1.85956 1.77715 1.91103 1.87472 1.91103C 1.9723 1.91103 2.06315 1.85956 2.12035 1.775L 2.80004 0.752937C 2.99856 0.855879 3.30475 1.02867 3.57057 1.24191C 3.67151 1.32279 3.71525 1.37058 3.81956 1.48088C 3.94742 1.72353 3.90368 3.09117 3.7489 3.71985C 3.60758 4.28235 3.18362 5.11691 3.18025 5.12426C 3.17689 5.13161 3.17016 5.14264 3.16679 5.15367C 3.06585 5.40735 2.99856 5.67573 2.975 5.95147L 2.40636 12.0397C 2.40299 12.0618 2.38617 12.0801 2.36598 12.0801L 1.38347 12.0801C 1.36328 12.0801 1.34309 12.0618 1.34309 12.0397L 0.774445 5.95147C 0.747527 5.67573 0.683596 5.40735 0.582653 5.15367C 0.515358 4.98088 0.337025 4.90735 0.182246 4.98088Z"></path><path id="c29ea2c3-7373-466e-b0d2-87e5940fb610" d="M 1.38243 3.76838C 1.38916 3.76838 1.39589 3.76838 1.40598 3.76838C 1.40935 3.76838 1.41607 3.76838 1.41944 3.76838C 1.42617 3.76838 1.4329 3.76838 1.43963 3.76838C 1.82994 3.76103 2.15969 3.60294 2.39859 3.3125C 2.89994 2.69485 2.82928 1.66544 2.81582 1.53676C 2.76535 0.400735 2.04529 -1.40246e-08 1.43963 -1.40246e-08C 1.42953 -1.40246e-08 1.41944 -1.40246e-08 1.41271 -1.40246e-08C 1.40598 -1.40246e-08 1.39589 -1.40246e-08 1.38579 -1.40246e-08C 0.783499 -1.40246e-08 0.0634389 0.404412 0.00960259 1.53676C -0.000491709 1.66544 -0.0745168 2.69485 0.426833 3.3125C 0.662367 3.60294 0.992114 3.75735 1.38243 3.76838ZM 0.615261 1.59559C 0.615261 1.58824 0.615261 1.58088 0.615261 1.57353C 0.648908 0.779412 1.10988 0.661765 1.38243 0.661765L 1.39589 0.661765C 1.40262 0.661765 1.41271 0.661765 1.41944 0.661765L 1.4329 0.661765C 1.70544 0.661765 2.16642 0.779412 2.20007 1.57353C 2.20007 1.58088 2.20007 1.58824 2.20007 1.59191C 2.22362 1.82721 2.21689 2.51471 1.93088 2.86765C 1.80639 3.02206 1.63478 3.09559 1.40935 3.09926C 1.40598 3.09926 1.40598 3.09926 1.40262 3.09926C 1.17718 3.09559 1.00557 3.02206 0.881077 2.86765C 0.598437 2.51838 0.595072 1.83088 0.615261 1.59559Z"></path><path id="ca8b21ef-a843-4748-abd8-d25ccc471637" d="M 0.259304 1.07647C -0.194939 1.57279 0.0607833 3.64264 0.181915 4.12059C 0.343424 4.76397 0.774114 5.63161 0.838044 5.75661C 0.918799 5.95882 0.96927 6.16838 0.989459 6.38529L 1.59512 12.8743C 1.62876 13.2529 1.91813 13.536 2.26807 13.536L 3.31451 13.536C 3.66108 13.536 3.95045 13.2493 3.98747 12.8743L 4.59312 6.38529C 4.61331 6.16838 4.66378 5.95514 4.74454 5.75661C 4.80847 5.62794 5.23916 4.76397 5.40067 4.12059C 5.51844 3.64264 5.77752 1.57279 5.32328 1.07647C 5.19878 0.940438 5.12812 0.866908 4.98007 0.745585C 4.4518 0.319114 3.81586 0.0397023 3.78894 0.0249965C 3.65772 -0.0338271 3.50967 0.013967 3.42891 0.138967L 2.78624 1.09117L 2.15367 0.138967C 2.07291 0.013967 1.9215 -0.0301506 1.79364 0.0249965C 1.76672 0.0360259 1.13414 0.319114 0.602511 0.745585C 0.454461 0.866908 0.380436 0.940438 0.259304 1.07647ZM 0.696724 1.5397C 0.807761 1.41838 0.854868 1.37059 0.965905 1.28235C 1.25528 1.04706 1.59175 0.859556 1.8071 0.749261L 2.54062 1.8522C 2.59782 1.93676 2.68867 1.98823 2.78624 1.98823C 2.88382 1.98823 2.97467 1.93676 3.03187 1.8522L 3.76539 0.749261C 3.97737 0.859556 4.31385 1.04706 4.60658 1.28235C 4.71762 1.37059 4.76473 1.41838 4.87576 1.5397C 5.01708 1.7897 4.97334 3.26397 4.80174 3.94411C 4.65032 4.54706 4.19945 5.43676 4.19272 5.44411C 4.18935 5.45147 4.18262 5.4625 4.17926 5.47353C 4.07158 5.74191 4.00092 6.025 3.97401 6.31912L 3.36835 12.8081C 3.36498 12.8449 3.33807 12.8706 3.30442 12.8706L 2.25798 12.8706C 2.22433 12.8706 2.19741 12.8449 2.19405 12.8081L 1.58839 6.31912C 1.56147 6.02867 1.49417 5.74191 1.38314 5.47353C 1.37977 5.4625 1.37641 5.45514 1.36968 5.44411C 1.36631 5.43676 0.912069 4.54338 0.760655 3.94044C 0.599146 3.26397 0.555404 1.7897 0.696724 1.5397Z"></path><path id="00ad5f2a-5da3-4c05-a667-db4226456e87" d="M 1.45705 3.97794C 1.46378 3.97794 1.47387 3.97794 1.4806 3.97794C 1.48397 3.97794 1.49406 3.97794 1.49743 3.97794C 1.50416 3.97794 1.51089 3.97794 1.51762 3.97794C 1.93485 3.97059 2.27132 3.80882 2.52368 3.49632C 3.05531 2.84559 2.97456 1.75 2.96447 1.61765C 2.91063 0.422794 2.15356 0 1.51762 0C 1.50752 0 1.49743 0 1.48733 0C 1.4806 0 1.47051 0 1.45705 0C 0.824475 0 0.0640378 0.422794 0.0102015 1.61765C 0.000107191 1.75 -0.0806475 2.84191 0.450986 3.49265C 0.703343 3.80515 1.04318 3.96691 1.45705 3.97794ZM 0.619224 1.68015C 0.619224 1.67279 0.619224 1.66544 0.619224 1.65809C 0.656236 0.761029 1.21815 0.665441 1.45705 0.665441L 1.47387 0.665441C 1.4806 0.665441 1.4907 0.665441 1.49743 0.665441L 1.51425 0.665441C 1.75315 0.665441 2.31507 0.761029 2.35208 1.65809C 2.35208 1.66544 2.35208 1.67279 2.35208 1.67647C 2.37563 1.93015 2.37227 2.67279 2.06271 3.05147C 1.92475 3.22059 1.73633 3.30515 1.4907 3.30515C 1.48733 3.30515 1.48397 3.30515 1.4806 3.30515C 1.23498 3.30147 1.04655 3.22059 0.908594 3.05147C 0.599036 2.67647 0.595671 1.93382 0.619224 1.68015Z"></path></defs></svg> 人數 </label> <item> <control-holder> <component-select-control select__to="{expression:page-match-open:7}"> <a>5v5</a> <a>7v7</a> <a>9v9</a> <a>11v11</a> </component-select-control> </control-holder> </item> </match-type-number-of-players> <component-spacing height="10px"></component-spacing> <component-separator></component-separator> <component-spacing height="10px"></component-spacing> <match-type-pitch> <label> <svg width="14" height="18" viewbox="0 0 14 18" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>soccer-field</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(1157 208)" figma:type="canvas"><g id="soccer-field" style="mix-blend-mode:normal;" figma:type="frame"><g id="Soccer-field 1" style="mix-blend-mode:normal;" figma:type="frame"><g id="Soccer-field" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#62b9d1df-7938-4819-a4b7-65740c8bf388" transform="translate(-1156.76 -208)" fill="#1D8348" style="mix-blend-mode:normal;"></use></g></g></g></g><defs><path id="62b9d1df-7938-4819-a4b7-65740c8bf388" d="M 13.16 0L 0.28 0C 0.12544 0 0 0.12096 0 0.27L 0 17.01C 0 17.159 0.12544 17.28 0.28 17.28L 13.16 17.28C 13.3148 17.28 13.44 17.159 13.44 17.01L 13.44 0.27C 13.44 0.12096 13.3148 0 13.16 0ZM 7.42 2.67759C 7.42 3.02481 7.10612 3.3075 6.72 3.3075C 6.33388 3.3075 6.02 3.02508 6.02 2.67759C 6.02 2.61657 6.0298 2.55582 6.04912 2.4975L 7.3906 2.4975C 7.4102 2.55582 7.42 2.61657 7.42 2.67759ZM 4.88292 1.8981L 4.88292 0.5481L 8.55708 0.5481L 8.55708 1.8981L 4.88292 1.8981ZM 4.32292 0.54L 4.32292 2.1681C 4.32292 2.31714 4.44808 2.4381 4.60292 2.4381L 5.4894 2.4381C 5.47176 2.51694 5.46 2.59686 5.46 2.67759C 5.46 3.32262 6.02504 3.8475 6.72 3.8475C 7.41468 3.8475 7.98 3.32289 7.98 2.67759C 7.98 2.59659 7.96824 2.51667 7.9506 2.4381L 8.83736 2.4381C 8.9922 2.4381 9.11736 2.31714 9.11736 2.1681L 9.11736 0.54L 12.88 0.54L 12.88 8.16588L 9.50572 8.16588C 9.36488 6.80346 8.16928 5.73588 6.72 5.73588C 5.27072 5.73588 4.07512 6.80346 3.93428 8.16588L 0.56 8.16588L 0.56 0.54L 4.32292 0.54ZM 4.49932 8.16588C 4.63792 7.10208 5.57984 6.27588 6.72 6.27588C 7.86016 6.27588 8.80208 7.10208 8.94068 8.16588L 4.49932 8.16588ZM 8.94068 8.70588C 8.80208 9.76968 7.86016 10.5959 6.72 10.5959C 5.57984 10.5959 4.63792 9.76968 4.49932 8.70588L 8.94068 8.70588ZM 6.02 14.5349C 6.02 14.1877 6.33388 13.905 6.72 13.905C 7.10612 13.905 7.42 14.1874 7.42 14.5349C 7.42 14.5959 7.4102 14.6567 7.39088 14.715L 6.0494 14.715C 6.0298 14.6567 6.02 14.5959 6.02 14.5349ZM 8.55736 15.3144L 8.55736 16.6644L 4.88292 16.6644L 4.88292 15.3144L 8.55736 15.3144ZM 9.11736 16.74L 9.11736 15.0444C 9.11736 14.8954 8.9922 14.7744 8.83736 14.7744L 7.9506 14.7744C 7.96824 14.6956 7.98 14.6159 7.98 14.5349C 7.98 13.8899 7.41468 13.365 6.72 13.365C 6.02504 13.365 5.46 13.8896 5.46 14.5349C 5.46 14.6159 5.47176 14.6958 5.4894 14.7744L 4.60292 14.7744C 4.44808 14.7744 4.32292 14.8954 4.32292 15.0444L 4.32292 16.74L 0.56 16.74L 0.56 8.70588L 3.93428 8.70588C 4.07512 10.0683 5.27072 11.1359 6.72 11.1359C 8.16928 11.1359 9.36488 10.0683 9.50572 8.70588L 12.88 8.70588L 12.88 16.74L 9.11736 16.74Z"></path></defs></svg> 場地 </label> <item> <control-holder> <component-select-control select__to="{expression:page-match-open:8}"> <a>硬地</a> <a>人造草</a> <a>仿真草</a> <a>真草</a> </component-select-control> </control-holder> </item> </match-type-pitch> <component-spacing height="10px"></component-spacing> <component-separator></component-separator> <component-spacing height="10px"></component-spacing> <team-jersey> <label> <svg width="19" height="16" viewbox="0 0 19 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>soccer-jersey</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(1160 61)" figma:type="canvas"><g id="soccer-jersey" style="mix-blend-mode:normal;" figma:type="frame"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#7502afb2-9d1b-4ce3-b036-3ee6ec531c22" transform="translate(-1159 -61)" fill="#0E6655" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#44438887-890f-424c-88e1-324366c0b033" transform="translate(-1152.1 -55.7636)" fill="#0E6655" style="mix-blend-mode:normal;"></use></g></g></g></g></g><defs><path id="7502afb2-9d1b-4ce3-b036-3ee6ec531c22" d="M 17.9543 6.24586L 14.9543 1.59133C 14.9231 1.54304 14.8778 1.50435 14.8241 1.48078L 12.5336 0.471041C 12.5333 0.471041 12.5333 0.47075 12.533 0.47075L 11.5241 0.0262427C 11.4401 -0.0109935 11.3435 -0.0083753 11.2616 0.0326427C 11.1803 0.0739517 11.1221 0.149006 11.1053 0.236569C 10.7333 2.13911 9.37255 2.44194 8.97326 2.48994C 8.96966 2.49023 8.96636 2.48849 8.96276 2.48907C 8.90216 2.49663 8.86076 2.49925 8.86106 2.49954C 8.85806 2.49954 8.85056 2.49896 8.84306 2.49838C 8.83976 2.49809 8.83766 2.49809 8.83346 2.4978C 8.82476 2.49722 8.81126 2.49547 8.79896 2.49402C 8.79086 2.49314 8.78396 2.49256 8.77436 2.49111C 8.76116 2.48936 8.74406 2.48616 8.72816 2.48354C 8.71526 2.48151 8.70386 2.47976 8.68946 2.47685C 8.67266 2.47336 8.65256 2.46842 8.63396 2.46405C 8.61716 2.45998 8.60156 2.45678 8.58326 2.45183C 8.56316 2.4466 8.54066 2.43874 8.51936 2.43234C 8.49926 2.42623 8.48006 2.42071 8.45846 2.41314C 8.43656 2.40558 8.41256 2.39511 8.38916 2.38609C 8.36576 2.37678 8.34296 2.36863 8.31866 2.35787C 8.29496 2.3474 8.26976 2.33372 8.24516 2.32151C 8.21966 2.30871 8.19446 2.29736 8.16806 2.28282C 8.14286 2.26885 8.11676 2.2514 8.09096 2.23569C 8.06396 2.21911 8.03726 2.20398 8.00966 2.18507C 7.98386 2.16733 7.95747 2.1458 7.93107 2.12602C 7.90317 2.10478 7.87527 2.08558 7.84707 2.06202C 7.82097 2.0402 7.79487 2.01373 7.76877 1.98958C 7.74057 1.9634 7.71237 1.93925 7.68417 1.91045C 7.65807 1.88369 7.63257 1.85169 7.60677 1.8226C 7.57917 1.79118 7.55127 1.76209 7.52427 1.72747C 7.49877 1.69518 7.47447 1.65707 7.44957 1.62216C 7.42317 1.58493 7.39647 1.55031 7.37097 1.51016C 7.34667 1.47147 7.32387 1.42667 7.30047 1.38507C 7.27617 1.34202 7.25097 1.30187 7.22787 1.25533C 7.20357 1.20675 7.18197 1.15147 7.15917 1.09911C 7.13907 1.05257 7.11747 1.00951 7.09857 0.960057C 7.07457 0.897803 7.05387 0.827403 7.03197 0.759913C 7.01697 0.713076 7.00017 0.670604 6.98607 0.621441C 6.95187 0.501005 6.92127 0.373005 6.89457 0.23686C 6.87747 0.149297 6.81957 0.0739516 6.73827 0.0329336C 6.65667 -0.00837532 6.55978 -0.0107025 6.47578 0.0265337L 5.46688 0.471041C 5.46658 0.471041 5.46658 0.471332 5.46628 0.471332L 3.1758 1.48078C 3.1221 1.50435 3.0768 1.54304 3.0456 1.59133L 0.0456211 6.24586C -0.0368783 6.37385 -0.00477849 6.54229 0.120021 6.63276L 2.52 8.37821C 2.6463 8.47043 2.8254 8.45123 2.9274 8.33487L 4.19999 6.89545L 4.19999 15.7091C 4.19999 15.87 4.33409 16 4.49999 16L 13.4999 16C 13.6658 16 13.7999 15.87 13.7999 15.7091L 13.7999 7.01676L 14.756 8.3145C 14.8499 8.44192 15.032 8.4745 15.1664 8.38752L 17.8664 6.64207C 18.0014 6.5548 18.0404 6.37938 17.9543 6.24586ZM 11.6123 0.704058L 11.9405 0.84864L 12.1682 0.949003L 12.7757 2.61794L 10.4024 2.61794C 10.8677 2.28252 11.3462 1.70333 11.6123 0.704058ZM 5.83138 0.949294L 6.38758 0.704058C 6.42388 0.840203 6.46468 0.967039 6.50818 1.08806C 6.52288 1.12878 6.53908 1.16573 6.55468 1.20471C 6.58528 1.28209 6.61617 1.35802 6.64917 1.429C 6.66897 1.47118 6.68937 1.51075 6.71007 1.5506C 6.74157 1.61227 6.77397 1.67249 6.80727 1.72922C 6.82977 1.76762 6.85257 1.80485 6.87597 1.84122C 6.90987 1.89387 6.94437 1.9442 6.97977 1.99249C 7.00377 2.02565 7.02777 2.05882 7.05237 2.08994C 7.08957 2.13678 7.12737 2.18013 7.16517 2.2226C 7.18887 2.24907 7.21197 2.27671 7.23567 2.30172C 7.28097 2.34885 7.32687 2.39132 7.37277 2.43292C 7.39377 2.45183 7.41417 2.47191 7.43517 2.48965C 7.48947 2.53591 7.54407 2.57896 7.59867 2.61823L 5.22388 2.61823L 5.83138 0.949294ZM 13.1999 15.4182L 4.79999 15.4182L 4.79999 14.5455L 13.1999 14.5455L 13.1999 15.4182ZM 13.1999 13.9636L 4.79999 13.9636L 4.79999 13.6727L 13.1999 13.6727L 13.1999 13.9636ZM 15.0752 7.74723L 13.7438 5.94011C 13.6682 5.83713 13.5326 5.79378 13.4081 5.83218C 13.2842 5.87087 13.1999 5.98287 13.1999 6.10913L 13.1999 13.0909L 4.79999 13.0909L 4.79999 6.10913C 4.79999 5.98724 4.72169 5.87844 4.60409 5.83626C 4.48589 5.79378 4.35389 5.82724 4.27259 5.91975L 2.655 7.74927L 0.700217 6.3276L 3.5064 1.97387L 5.07329 1.28326L 4.51679 2.81227C 4.48469 2.90158 4.49849 3.0002 4.55489 3.07699C 4.61129 3.15438 4.70279 3.20005 4.79999 3.20005L 8.99996 3.20005L 13.1999 3.20005C 13.2971 3.20005 13.3886 3.15438 13.4447 3.07699C 13.5011 2.9999 13.5149 2.90129 13.4828 2.81227L 12.9263 1.28326L 14.4932 1.97387L 17.291 6.3148L 15.0752 7.74723Z"></path><path id="44438887-890f-424c-88e1-324366c0b033" d="M 4.19997 1.59999C 4.19997 0.717961 3.45958 0 2.54998 0L 1.64999 0C 0.740395 0 0 0.717961 0 1.59999C 0 2.14108 0.279298 2.61934 0.704395 2.90908C 0.278998 3.19882 0 3.67708 0 4.21817C 0 5.1002 0.740395 5.81816 1.64999 5.81816L 2.54998 5.81816C 3.45958 5.81816 4.19997 5.1002 4.19997 4.21817C 4.19997 3.67708 3.92067 3.19882 3.49558 2.90908C 3.92067 2.61934 4.19997 2.14108 4.19997 1.59999ZM 3.59997 4.21817C 3.59997 4.77962 3.12898 5.23634 2.54998 5.23634L 1.64999 5.23634C 1.07099 5.23634 0.599996 4.77962 0.599996 4.21817C 0.599996 3.65671 1.07099 3.19999 1.64999 3.19999L 2.54998 3.19999C 3.12898 3.19999 3.59997 3.65671 3.59997 4.21817ZM 2.54998 2.61817L 1.64999 2.61817C 1.07099 2.61817 0.599996 2.16145 0.599996 1.59999C 0.599996 1.03854 1.07099 0.581816 1.64999 0.581816L 2.54998 0.581816C 3.12898 0.581816 3.59997 1.03854 3.59997 1.59999C 3.59997 2.16145 3.12898 2.61817 2.54998 2.61817Z"></path></defs></svg> 球衣 </label> <item> <control-holder> <component-table-control message__from="{expression:page-match-open:9}"> <component-modal-holder> <component-jersey-picker jersey__to="{expression:page-match-open:10}"></component-jersey-picker> <component-spacing height="25px"></component-spacing> <component-action> <a ref="{ref prefix}jersey-button"> <icon class="fa-check"></icon> </a> </component-action> </component-modal-holder> </component-table-control> </control-holder> </item> </team-jersey> <component-spacing height="10px"></component-spacing> <component-separator></component-separator> <component-spacing height="10px"></component-spacing> <match-fee> <label> <svg width="14" height="16" viewbox="0 0 8 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>$</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(1155 179)" figma:type="canvas"><g id="$" style="mix-blend-mode:normal;" figma:type="text"><use xlink:href="#55dbad54-3561-454e-9acb-ce7a9745b561" transform="translate(-1155.15 -179)" fill="#B7950B" style="mix-blend-mode:normal;"></use></g></g><defs><path id="55dbad54-3561-454e-9acb-ce7a9745b561" d="M 6.36719 11.2773C 6.36719 10.8086 6.20052 10.4102 5.86719 10.082C 5.53906 9.7487 4.99219 9.45182 4.22656 9.19141C 3.17448 8.8737 2.38021 8.44922 1.84375 7.91797C 1.30729 7.38672 1.03906 6.67839 1.03906 5.79297C 1.03906 4.93359 1.28646 4.23307 1.78125 3.69141C 2.27604 3.14974 2.95573 2.82422 3.82031 2.71484L 3.82031 0.988281L 5.05469 0.988281L 5.05469 2.72266C 5.92448 2.84766 6.59896 3.22266 7.07812 3.84766C 7.5625 4.46745 7.80469 5.30078 7.80469 6.34766L 6.27344 6.34766C 6.27344 5.63932 6.10938 5.06641 5.78125 4.62891C 5.45833 4.19141 5.00521 3.97266 4.42188 3.97266C 3.80729 3.97266 3.34635 4.13411 3.03906 4.45703C 2.73177 4.77474 2.57812 5.21224 2.57812 5.76953C 2.57812 6.27474 2.73698 6.68359 3.05469 6.99609C 3.3724 7.30859 3.94271 7.60547 4.76562 7.88672C 5.82812 8.23047 6.61719 8.66016 7.13281 9.17578C 7.64844 9.6862 7.90625 10.3815 7.90625 11.2617C 7.90625 12.1576 7.63802 12.8711 7.10156 13.4023C 6.5651 13.9336 5.82812 14.2487 4.89062 14.3477L 4.89062 15.8398L 3.67188 15.8398L 3.67188 14.3477C 2.77604 14.2539 2.04167 13.9284 1.46875 13.3711C 0.895833 12.8086 0.619792 11.9857 0.640625 10.9023L 0.65625 10.8633L 2.14062 10.8633C 2.14062 11.6654 2.34115 12.2383 2.74219 12.582C 3.14844 12.9206 3.64583 13.0898 4.23438 13.0898C 4.90625 13.0898 5.42969 12.931 5.80469 12.6133C 6.17969 12.2904 6.36719 11.8451 6.36719 11.2773Z"></path></defs></svg> 費用 <small>每隊</small> </label> <item> <control-holder> <component-input-control change__to="{expression:page-match-open:11}" placeholder="免費或輸入" type="number"></component-input-control> </control-holder> </item> </match-fee> <component-spacing height="10px"></component-spacing> <component-separator></component-separator> </info-holder> </info-area> <component-spacing height="35px"></component-spacing> <component-action> <a href="#match/open/tag-step" disabled="{expression:page-match-open:12}" ref="{ref prefix}open-button">確定</a> </component-action> </open-match> </component-main-content> <component-page-tabs tab="match"></component-page-tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			args .cycle__from
				.thru (tap, function () {
					if (! api () .user)
						window .location .hash = '#login'
				})

			var date = stream ()
			var timeslot = stream ()
			var jersey = stream ()
			var location = stream ()
			var fee = stream ()
			var number_of_players = stream ()
			var pitch_type = stream ()

			var temp_timeslot = stream ()
			var temp_jersey = stream ()

			ref ('timeslot-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function () {
					timeslot (temp_timeslot () .start + ' - ' + temp_timeslot () .end)
				})
			});
			ref ('jersey-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function () {
					jersey (temp_jersey ())
				})
			});

			var can_open = mechanism (function () {
				if (! date ())
					return false;
				if (! timeslot ())
					return false;
				if (! jersey ())
					return false;
				if (! location ())
					return false;
				if (! number_of_players ())
					return false;
				if (! pitch_type ())
					return false;

				return true;
			}, [
				mergeAll ([
					date, timeslot, jersey, location, number_of_players, pitch_type
				])
			]);

			can_open
				.thru (trans, R .dropRepeats)
				.thru (map, noop) .thru (tap, self .render)

			ref ('open-button') .thru (tap, function (ref) {
					ref .addEventListener ('click', function (e) {
						e .preventDefault ();
						window .location .hash = ref .hash + '/#' + [ date (), timeslot (), jersey (), location (), fee (), number_of_players (), pitch_type () ] .map (stringify) .join ('/')
					})
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  date  };
	self .expressions [1] = function (_item) { return  date  };
	self .expressions [2] = function (_item) { return  timeslot  };
	self .expressions [3] = function (_item) { return  temp_timeslot  };
	self .expressions [4] = function (_item) { return  location  };
	self .expressions [5] = function (_item) { return  location  };
	self .expressions [6] = function (_item) { return  number_of_players  };
	self .expressions [7] = function (_item) { return  pitch_type  };
	self .expressions [8] = function (_item) { return  jersey  };
	self .expressions [9] = function (_item) { return  temp_jersey  };
	self .expressions [10] = function (_item) { return  fee  };
	self .expressions [11] = function (_item) { return  ! can_open ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-match-private-catalog', '<nav> <nav-bar> <nav-buttons> <a> <component-filter-button></component-filter-button> </a> </nav-buttons> <nav-buttons> </nav-buttons> </nav-bar> <component-match-tabs tab="private"></component-match-tabs> </nav> <component-main-content> <match-private-catalog> <component-loading-item if="{expression:page-match-private-catalog:1}"></component-loading-item> <component-item if="{expression:page-match-private-catalog:2}">未有球賽</component-item> <component-dynamic-load items_to_load="13" interval_for_loading="50" item_height="{expression:page-match-private-catalog:3}" items__from="{expression:page-match-private-catalog:4}"> <component-match-catalog-item item__from="{expression:page-match-private-catalog:5}"></component-match-catalog-item> </component-dynamic-load> </match-private-catalog> </component-main-content> <component-page-tabs tab="match"></component-page-tabs> <a href="#match/open"> <component-add-fab></component-add-fab> </a>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var matches_items = stream ();

			var matches =	matches_items
								.thru (map, function (match_list) {
									var last_date;
									return 	match_list .map (function (match) {
												var curr = '' + fecha .format (new Date (match .start_at), 'YYYYMM');
												if (last_date === curr)
													return 	{ match: match };
												else {
													last_date = curr;
													return 	{ date: curr, match: match };
												}
											});
								})
			var item_height = function (item) {
				var height = 0;
				if (item .match)
					height += 96;
				if (item .date)
					height += 26;
				return height;
			}

			var status = mechanism (function () {
				if (matches () .length)
					return 'loaded';
				else
					return 'no-items'
			}, [matches]) ('loading')

			status .thru (map, noop) .thru (tap, self .render)

			args .cycle__from
				.thru (tap, function (cycle) {
					if (api () .matches_to_find) {
						inquire (api () .matches_to_find)
							.then (function (matches) {
								matches_items (matches)
							})
					}
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  status () === 'loading'  };
	self .expressions [1] = function (_item) { return  status () === 'no-items'  };
	self .expressions [2] = function (_item) { return  item_height  };
	self .expressions [3] = function (_item) { return  matches  };
	self .expressions [4] = function (_item) { return  _item .item__from  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-schedule-history', '<nav> <nav-bar> <nav-title> <component-page-title>球隊日程</component-page-title> </nav-title> </nav-bar> <component-schedule-tabs tab="history"></component-schedule-tabs> </nav> <component-main-content> <check-todos> <component-loading-item if="{expression:page-schedule-history:1}"></component-loading-item> <component-item if="{expression:page-schedule-history:2}">你未有賽事</component-item> <component-dynamic-load items_to_load="8" interval_for_loading="50" item_height="{expression:page-schedule-history:3}" items__from="{expression:page-schedule-history:4}"> <component-schedule-pending-match-item item__from="{expression:page-schedule-history:5}"></component-schedule-pending-match-item> </component-dynamic-load> </check-todos> </component-main-content> <component-page-tabs tab="schedule"></component-page-tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var history_info = 	args .cycle__from
									.thru (filter, function () {
										if (api () .teams)
											return true;
										else
											window .location .hash = '#login'
									})
									.thru (function (load) {
										return 	from (function (list) {
											inquire (api () .teams)
													.then (function (teams) {
														var team_id = teams [0] .id;

														return 	Promise .all ([
																	inquire (api () .matches (team_id)),
																	inquire (api () .matches_applied (team_id))
																]);
													})
													.then (function (mine_and_applied) {
														return mine_and_applied [0] .concat (mine_and_applied [1]);
													})
													.then (function (upcomings) {
														list (upcomings)
													})
										})
									})
									.thru (map, function (match_list) {

										var now = new Date ();

										return 	match_list
													.filter (function (match) {
														return now > new Date (match .start_at)
													})
													.sort (function (a, b) {
														return new Date (a .start_at) < new Date (b .start_at)
													});
									});
			var item_height = function (item) {
				return 96;
			};

			var status = history_info
							.thru (map, function (items) {
								if (items .length)
									return 'loaded';
								else
									return 'no-items'
							}) ('loading')

			status .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  status () === 'loading'  };
	self .expressions [1] = function (_item) { return  status () === 'no-items'  };
	self .expressions [2] = function (_item) { return  item_height  };
	self .expressions [3] = function (_item) { return  history_info  };
	self .expressions [4] = function (_item) { return  _item .item__from  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-schedule-match-choose-team', '<nav> <nav-bar> <nav-buttons> <a href="#schedule/upcoming"> <component-back-button></component-back-button> </a> </nav-buttons> <nav-title> <component-page-title>選擇對手</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <choose-match> <info-area info="choose-team" if="{expression:page-schedule-match-choose-team:1}"> <info-holder> <info-header> <home>主隊(己隊)</home> <away>客隊</away> </info-header> <away-team> <label> <label> 請點擊選擇對手 </label> <icon-holder> <icon class="fa fa-chevron-down"></icon> </icon-holder> </label> </away-team> <component-spacing height="5px"></component-spacing> <team-name> <home>{expression:page-schedule-match-choose-team:2}</home> <label>VS</label> </team-name> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-age-range> <home>{expression:page-schedule-match-choose-team:3}</home> <label>年齡</label> </team-age-range> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-shirt-color> <home>橙</home> <label>球衣</label> </team-shirt-color> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-division> <home>Division Premier</home> <label>實力</label> </team-division> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-rating> <home>4.2/5</home> <label>球品</label> </team-rating> <component-spacing height="5px"></component-spacing> </info-holder> </info-area> <info-area info="team" if="{expression:page-schedule-match-choose-team:4}"> <info-holder> <info-header> <home>主隊</home> <away>客隊(己隊)</away> </info-header> <component-spacing height="5px"></component-spacing> <team-name> <home>{expression:page-schedule-match-choose-team:5}</home> <label>VS</label> <away>{expression:page-schedule-match-choose-team:6}</away> </team-name> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-age-range> <home>{expression:page-schedule-match-choose-team:7}</home> <label>年齡</label> <away>{expression:page-schedule-match-choose-team:8}</away> </team-age-range> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-shirt-color> <home>橙</home> <label>球衣</label> <away><a>綠<svg ref="{ref prefix}svg" width="9" height="16" viewbox="0 0 9 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:figma="http://www.figma.com/figma/ns"><title>right-arrow</title><desc>Created using Figma</desc><g id="Canvas" transform="translate(734 258)" figma:type="canvas"><g id="right-arrow" style="mix-blend-mode:normal;" figma:type="frame"><g id="Group" style="mix-blend-mode:normal;" figma:type="frame"><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#0b39f1b4-0614-4a28-a406-f607ebc22df0" transform="translate(-733.297 -256.973)" fill="#CCD1D1" style="mix-blend-mode:normal;"></use></g><g id="Vector" style="mix-blend-mode:normal;" figma:type="vector"><use xlink:href="#dd187232-741f-4707-87f3-4b5c131211ec" transform="translate(-733.721 -257.397)" fill="#CCD1D1" style="mix-blend-mode:normal;"></use></g></g></g></g><defs><path id="0b39f1b4-0614-4a28-a406-f607ebc22df0" d="M 0.8484 14.0484L -6.63757e-08 13.2L 6.1755 7.0242L -6.63757e-08 0.8484L 0.8484 1.02997e-08L 7.8726 7.0242L 0.8484 14.0484Z"></path><path id="dd187232-741f-4707-87f3-4b5c131211ec" d="M 1.2726 14.8968L 6.63757e-08 13.6242L 6.1755 7.4484L 6.63757e-08 1.2726L 1.2726 0L 8.7213 7.4484L 1.2726 14.8968ZM 0.8484 13.6242L 1.2726 14.0484L 7.8726 7.4484L 1.2726 0.8484L 0.8484 1.2726L 7.0239 7.4484L 0.8484 13.6242Z"></path></defs></svg></a></away> </team-shirt-color> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-division> <home>Division Premier</home> <label>實力</label> <away>Division 1</away> </team-division> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-rating> <home>4.2/5</home> <label>球品</label> <away>5/5</away> </team-rating> <component-spacing height="5px"></component-spacing> </info-holder> </info-area> <info-area info="match"> <info-holder> <info-header>賽事資料</info-header> <match-details> <date>{expression:page-schedule-match-choose-team:9}</date> <time>{expression:page-schedule-match-choose-team:10}</time> </match-details> <match-location> <label>地點</label> <item> <icon-holder><icon class="fa-map-marker"></icon></icon-holder> {expression:page-schedule-match-choose-team:11} </item> </match-location> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <match-pitch> <label>場地</label> <item>{expression:page-schedule-match-choose-team:12}</item> </match-pitch> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <match-fee> <label>費用</label> <item>{expression:page-schedule-match-choose-team:13}</item> </match-fee> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="10px"></component-spacing> <match-tags> <tag>聯賽</tag> <tag>競爭性</tag> </match-tags> </info-holder> </info-area> <component-spacing height="20px"></component-spacing> <component-action> <a href="#schedule/upcoming" ref="{ref prefix}apply-button">確定</a> </component-action> <component-spacing height="20px"></component-spacing> <info-area info="choices"> <info-holder> <info-header> {expression:page-schedule-match-choose-team:14}隊報名 </info-header> <component-schedule-match-applicant-item></component-schedule-match-applicant-item> <component-schedule-match-applicant-item></component-schedule-match-applicant-item> <component-schedule-match-applicant-item></component-schedule-match-applicant-item> </info-holder> </info-area> </choose-match> </component-main-content> <component-page-tabs tab="schedule"></component-page-tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var match_info = stream ()
			var team_info = stream ()
			var opponent_info = stream ();
			var choices_info = stream ()

			mergeAll ([
				match_info,
				team_info,
				choices_info
			])
			.thru (map, noop) .thru (tap, self .render);

			var home_name = mechanism (function () {
				return team_info () .long_name;
			}, [ team_info ])
			var home_age_range = mechanism (function () {
				return team_info () .average_age;
			}, [ team_info ])

			var match_date = mechanism (function () {

				var date_time = new Date (match_info () .start_at);
				return date_to_chi (date_time) + ' 星期' + day_of_week_to_chi (date_time);
			}, [ match_info ])
			var match_time = mechanism (function () {

				var start_date_time = new Date (match_info () .start_at)
				var end_date_time = new Date (match_info () .end_at);

				return times (start_date_time, end_date_time)
			}, [ match_info ])
			var match_location = mechanism (function () {

				return location_from_api (match_info () .location)
			}, [ match_info ])
			var match_pitch = mechanism (function () {

				return match_info () .match_type + ' - ' + match_info () .pitch .pitch_type;
			}, [ match_info ])
			var match_fee = mechanism (function () {

				return fee_to_chi (match_info () .fee_per_team);
			}, [ match_info ])

			var apply_number = mechanism (function () {

				return choices_info () .length;
			}, [ choices_info ])

			args .cycle__from
				.thru (tap, function (cycle) {
					if (api () .match_to_find_info) {
						inquire (api () .match_to_find_info (parse (args [0])))

							.then (function (match) {
								match_info (match)
							});
						inquire (api () .teams)
							.then (function (teams) {
								team_info (teams [0])
							})
							.then (function () {
								inquire (api () .match_applications (team_info () .id, parse (args [0])))
									.then (function (choices) {
										choices_info (choices)
									});
							})
					}
					else
						window .location .hash = '#login'
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  ! opponent_info ()  };
	self .expressions [1] = function (_item) { return  home_name ()  };
	self .expressions [2] = function (_item) { return  home_age_range ()  };
	self .expressions [3] = function (_item) { return  opponent_info ()  };
	self .expressions [4] = function (_item) { return  home_team_name ()  };
	self .expressions [5] = function (_item) { return  away_team_name ()  };
	self .expressions [6] = function (_item) { return  home_age_range ()  };
	self .expressions [7] = function (_item) { return  away-age-range ()  };
	self .expressions [8] = function (_item) { return  match_date ()  };
	self .expressions [9] = function (_item) { return  match_time ()  };
	self .expressions [10] = function (_item) { return  match_location ()  };
	self .expressions [11] = function (_item) { return  match_pitch ()  };
	self .expressions [12] = function (_item) { return  match_fee ()  };
	self .expressions [13] = function (_item) { return  apply_number ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-schedule-upcoming', '<nav> <nav-bar> <nav-title> <component-page-title>球隊日程</component-page-title> </nav-title> </nav-bar> <component-schedule-tabs tab="upcoming"></component-schedule-tabs> </nav> <component-main-content> <check-upcoming-matches> <component-list-bar>約戰成功</component-list-bar> <component-loading-item if="{expression:page-schedule-upcoming:1}"></component-loading-item> <component-item if="{expression:page-schedule-upcoming:2}">你未有確認賽事</component-item> <component-dynamic-load items_to_load="8" interval_for_loading="50" item_height="{expression:page-schedule-upcoming:3}" items__from="{expression:page-schedule-upcoming:4}"> <component-schedule-confirmed-match-wrap item__from="{expression:page-schedule-upcoming:5}"></component-schedule-confirmed-match-wrap> </component-dynamic-load> <component-list-bar>約戰中</component-list-bar> <component-loading-item if="{expression:page-schedule-upcoming:6}"></component-loading-item> <component-item if="{expression:page-schedule-upcoming:7}">你未有賽事</component-item> <component-dynamic-load items_to_load="13" interval_for_loading="35" item_height="{expression:page-schedule-upcoming:8}" items__from="{expression:page-schedule-upcoming:9}"> <component-schedule-pending-match-item item__from="{expression:page-schedule-upcoming:10}"></component-schedule-pending-match-item> </component-dynamic-load> </check-upcoming-matches> </component-main-content> <component-page-tabs tab="schedule"></component-page-tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var upcoming_info =	args .cycle__from
									.thru (filter, function () {
										if (api () .teams)
											return true;
										else
											window .location .hash = '#login'
									})
									.thru (function (load) {
										return 	from (function (list) {
											inquire (api () .teams)
													.then (function (teams) {
														var team_id = teams [0] .id;

														return 	Promise .all ([
																	inquire (api () .matches (team_id)),
																	inquire (api () .matches_applied (team_id))
																]);
													})
													.then (function (mine_and_applied) {
														return mine_and_applied [0] .concat (mine_and_applied [1]);
													})
													.then (function (upcomings) {
														list (upcomings)
													})
										})
									})
									.thru (map, function (match_list) {
										var now = new Date ();

										return 	match_list
													.filter (function (match) {
														return now <= new Date (match .start_at)
													}) .sort (function (a, b) {
														return new Date (a .start_at) > new Date (b .start_at)
													})
									});

			upcoming_info .thru (map, noop) .thru (tap, self .render)

			var confirmed_matches = mechanism (function () {
				return 	upcoming_info ()
							.filter (function (match) {
								return match .status === 'STARTED'
							});
			}, [upcoming_info])
			var pending_matches = mechanism (function () {
				return 	upcoming_info ()
							.filter (function (match) {
								return match .status === 'PENDING_APPROVAL' || match .status === 'VERIFIED'
							});
			}, [upcoming_info])
			var item_height = function (item) {
				return 96;
			}

			var confirmed_matches_status =	confirmed_matches
												.thru (map, function (items) {
													if (items .length)
														return 'loaded';
													else
														return 'no-items'
												}) ('loading')
			var pending_matches_status = pending_matches
											.thru (map, function (items) {
												if (items .length)
													return 'loaded';
												else
													return 'no-items'
											}) ('loading')

	self .expressions = {};

	self .expressions [0] = function (_item) { return  confirmed_matches_status () === 'loading'  };
	self .expressions [1] = function (_item) { return  confirmed_matches_status () === 'no-items'  };
	self .expressions [2] = function (_item) { return  item_height  };
	self .expressions [3] = function (_item) { return  confirmed_matches  };
	self .expressions [4] = function (_item) { return  _item .item__from  };
	self .expressions [5] = function (_item) { return  pending_matches_status () === 'loading'  };
	self .expressions [6] = function (_item) { return  pending_matches_status () === 'no-items'  };
	self .expressions [7] = function (_item) { return  item_height  };
	self .expressions [8] = function (_item) { return  pending_matches  };
	self .expressions [9] = function (_item) { return  _item .item__from  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-team-connect', '<nav> <nav-bar> <nav-title> <component-page-title>建立球隊</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <connect-team> <label> 您好領隊! <br> 請先選擇建立新球隊或加入現有球隊以參與約戰 </label> <component-spacing height="35px"></component-spacing> <component-action> <a href="#team/open">建立球隊</a> </component-action> <component-spacing height="10px"></component-spacing> <component-action> <a disabled>現有球隊</a> <label> 加入現有球隊需要該隊領隊認證 </label> </component-action> </connect-team> </component-main-content>', '', '', function(opts) {
});
riot.tag2('page-team-open-preferences-step', '<nav> <nav-bar> <nav-buttons> <a href="#team/open"> <component-back-button></component-back-button> </a> </nav-buttons> <nav-title> <component-page-title>球隊偏好</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <team-preferences> <info-area info="field-type"> <info-holder> <info-header>場地種類</info-header> <component-spacing height="10px"></component-spacing> <number-of-players> <label>人數</label> <item> <component-select-control multiple select__to="{expression:page-team-open-preferences-step:1}"> <a>5v5</a> <a>7v7</a> <a>9v9</a> <a>11v11</a> </component-select-control> </item> </number-of-players> <component-spacing height="10px"></component-spacing> <material-of-field> <label>場地</label> <item> <component-select-control multiple select__to="{expression:page-team-open-preferences-step:2}"> <a>硬地</a> <a>人造草</a> <a>仿真草</a> <a>真草</a> </component-select-control> </item> </material-of-field> <component-spacing height="5px"></component-spacing> <label>可選多於一種球場類別</label> <component-spacing height="10px"></component-spacing> </info-holder> </info-area> <info-area info="days-of-week"> <info-holder> <info-header>活躍日子</info-header> <component-spacing height="10px"></component-spacing> <days-of-week> <label>日子</label> <item> <component-day-of-week-picker days__to="{expression:page-team-open-preferences-step:3}"></component-day-of-week-picker> </item> </days-of-week> <label>可選多於一天</label> <component-spacing height="10px"></component-spacing> </info-holder> </info-area> <info-area info="shirt-color"> <info-holder> <info-header>球衣顏色</info-header> <shirt-color> <item> <component-jersey-control jerseys__from="{expression:page-team-open-preferences-step:4}" jerseys__to="{expression:page-team-open-preferences-step:5}"></component-jersey-control> </item> </shirt-color> </info-holder> </info-area> <label>球隊偏好會幫助我們為您篩選適合的球賽</label> <component-spacing height="20px"></component-spacing> <component-action> <a href="#match/catalog" disabled="{expression:page-team-open-preferences-step:6}" ref="{ref prefix}next-button">建立球隊</a> </component-action> </team-preferences> </component-main-content>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var number_of_players = stream ()
			var material_of_field = stream ()
			var days_of_week = stream ()
			var shirt_color = stream ('顏色')
			var jerseys = stream ([])

			var can_next = mechanism (function () {
				if (! number_of_players () || ! number_of_players () .length)
					return false;
				if (! material_of_field () || ! material_of_field () .length)
					return false;
				if (! days_of_week () || ! days_of_week () .length)
					return false;
				if (! shirt_color ())
					return false;
				if (! jerseys () || ! jerseys () .length)
					return false;

				return true;
			}, [
				mergeAll ([
					number_of_players,
					material_of_field,
					days_of_week,
					shirt_color,
					jerseys
				])
			]);

			can_next
				.thru (dropRepeats)
				.thru (map, noop) .thru (tap, self .render)

			ref ('next-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function (e) {
					e .preventDefault ();
					inquire (api () .team_open, {
				        long_name: parse (args [0]),
				        average_age: parse (args [1]),
				        has_played_league: false,
				        home_jersey_color: 'XXX',
				        preferred_day_of_week_list:	days_of_week () .map (to_uppercase),
				        preferred_match_type_list: number_of_players (),
				        preferred_pitch_type_list: material_of_field (),
				        preferred_location_list: [
							{ country: 'HKG', district_group: '新界西' },
							{ country: 'HKG', district_group: '香港島', district: '灣仔區' },
							{ country: 'HKG', district_group: '香港島', district: '中西區' }
						]})
						.then (function () {
							window .location .hash = ref .hash
						})
				})
			})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  number_of_players  };
	self .expressions [1] = function (_item) { return  material_of_field  };
	self .expressions [2] = function (_item) { return  days_of_week  };
	self .expressions [3] = function (_item) { return  jerseys  };
	self .expressions [4] = function (_item) { return  jerseys  };
	self .expressions [5] = function (_item) { return  ! can_next ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-team-open', '<nav> <nav-bar> <nav-buttons> <a href="#team/connect"> <component-back-button></component-back-button> </a> </nav-buttons> <nav-title> <component-page-title>建立球隊</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <open-team> <label>基本資料</label> <component-spacing height="15px"></component-spacing> <image-holder size="128x128"> <img src="https://placeholdit.imgix.net/~text?txtsize=33&amp;txt=upload%20here&amp;w=128&amp;h=128"> </image-holder> <component-spacing height="5px"></component-spacing> <component-field-control type="text" placeholder="請輸入球隊名稱" change__to="{expression:page-team-open:1}"></component-field-control> <component-spacing height="5px"></component-spacing> <component-field-control placeholder="請輸入球隊平均年齡" change__to="{expression:page-team-open:2}" type="number"></component-field-control> <component-spacing height="5px"></component-spacing> <component-field-control type="text" placeholder="球隊簡介(可選擇不填)"></component-field-control> <component-spacing height="35px"></component-spacing> <component-action> <a href="#team/open/preferences-step" disabled="{expression:page-team-open:3}" ref="{ref prefix}next-button">下一步</a> </component-action> </open-team> </component-main-content>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var name = stream ();
			var average_age = stream ();

			var can_next = mechanism (function () {
				if (! name ())
					return false;
				if (! average_age ())
					return false;

				return true;
			}, [
				mergeAll ([
					name, average_age
				])
			]);

			can_next
				.thru (dropRepeats)
				.thru (map, noop) .thru (tap, self .render)

			ref ('next-button') .thru (tap, known_as ('next')) .thru (tap, function (ref) {
				ref .addEventListener ('click', function (e) {
					e .preventDefault ();
					window .location .hash = ref .hash  + '/#' + [name (), average_age ()] .map (stringify) .join ('/')
				})
			})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  name  };
	self .expressions [1] = function (_item) { return  average_age  };
	self .expressions [2] = function (_item) { return  ! can_next ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-team-profile', '<nav> <nav-bar> <nav-title> <component-page-title>球隊資料</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <team-profile> <component-spacing height="10px"></component-spacing> <info-graphic> <team-picture> <img src="http://placehold.it/128x128"> <label style=" display: block; font-size: 1.5em; font-weight: bold; text-align: center; color: black; ">{expression:page-team-profile:1}</label> </team-picture> </info-graphic> <component-spacing height="10px"></component-spacing> <info-area info="links" style=" display: flex; position: relative; font-size: 0.9em; "> <league style="flex-basis: 50%;flex-shrink: 1;padding: 5px;color: black;display: flex;justify-content: space-around;align-items: center;background: hsla(0,0%,95%,0.6);border-radius: 6px;box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px;"> <division style="font-weight: bold;font-size: 1.1em;width: min-content;text-align: center;">Division 10</division> <component-separator-inline></component-separator-inline> <rank style=" width: min-content; ">Rank:10</rank> </league> <component-spacing-inline width="5px"></component-spacing-inline> <friends style="flex-basis: 50%;flex-shrink: 1;display: flex;justify-content: center;align-items: center;/* color: black; */font-weight: bold;background: hsla(0,0%,95%,0.6);border-radius: 3px;box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px;">Add some friends!</friends> </info-area> <component-spacing height="15px"></component-spacing> <info-area info="general"> <info-holder> <team-active-region> <label>地區</label> <item>香港//九龍//新界</item> </team-active-region> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-age-range> <label>年齡</label> <item>{expression:page-team-profile:2}-{expression:page-team-profile:3}</item> </team-age-range> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-shirt-color> <label>球衣</label> <item>黑黑</item> </team-shirt-color> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <team-is-league-active> <label>聯賽</label> <item>{expression:page-team-profile:4}</item> </team-is-league-active> <component-spacing height="5px"></component-spacing> </info-holder> </info-area> <info-area info="preferences"> <info-holder> <info-header>偏好</info-header> <component-spacing height="5px"></component-spacing> <preferred-match-type> <label>人數</label> <item>{expression:page-team-profile:5}</item> </preferred-match-type> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <preferred-pitch-type> <label>球場</label> <item>真草//仿真草//人造草//石地</item> </preferred-pitch-type> <component-spacing height="5px"></component-spacing> <component-separator></component-separator> <component-spacing height="5px"></component-spacing> <preferred-day-of-week> <label>日期</label> <item>星期六//星期日</item> </preferred-day-of-week> </info-holder> </info-area> </team-profile> </component-main-content> <component-page-tabs tab="team"></component-page-tabs>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			args .cycle__from
				.thru (filter, function () {
					if (api () .teams)
						return true;
					else
						window .location .hash = '#login';
				})
				.thru (tap, function () {
					inquire (api () .teams)
						.then (function (team) {
							team_info (team)
						});
				})

			var team_info = stream ();
			var team =	team_info
							.thru (filter, function (res) {
								return res [0]
							})
			 				.thru (map, function (res) {
								return res [0]
							})
			 				.thru (map, function (team) {
								return 	{
											win_rate: 			win_rate (team .team_statistic .won, team .team_statistic .played_match) + '%',
											approve_number:			team .team_statistic .num_of_opponent_acceptance,
											opponent_number:		team .team_statistic .num_of_played_against_team,
											name: 					team .long_name,
											age_lower: 				team .age_group_lower,
											age_higher: 			team .age_group_upper,
											is_league: 			is_league (team .is_frequent_league_player),
											preferred_match_type: 	team .team_preference .match_type_list .join ('//')
										}
							});

			var win_rate = mechanism (function () {
				return team () .win_rate
			}, [ team ])
			var approve_number = mechanism (function () {
				return team () .approve_number
			}, [ team ])
			var opponent_number = mechanism (function () {
				return team () .opponent_number
			}, [ team ])
			var name = mechanism (function () {
				return team () .name
			}, [ team ])
			var age_lower = mechanism (function () {
				return team () .age_lower
			}, [ team ])
			var age_higher = mechanism (function () {
				return team () .age_higher
			}, [ team ])
			var league = mechanism (function () {
				return team () .is_league
			}, [ team ])
			var preferred_match_type = mechanism (function () {
				return team () .preferred_match_type
			}, [ team ])

			team .thru (map, noop) .thru (tap, self .render)

	self .expressions = {};

	self .expressions [0] = function (_item) { return  name ()  };
	self .expressions [1] = function (_item) { return  age_lower ()  };
	self .expressions [2] = function (_item) { return  age_higher ()  };
	self .expressions [3] = function (_item) { return  league ()  };
	self .expressions [4] = function (_item) { return  preferred_match_type ()  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-test-list', '<nav> <nav-bar> <nav-title> <component-page-title>建立球隊</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <test-list> 接受球賽通知 <br>當球賽即將開始時，你願意接受球賽通知？ <component-tree-control items__from="{expression:page-test-list:1}" items__to="{expression:page-test-list:2}"></component-tree-control> </test-list> </component-main-content>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var test = stream ({
			    香港:	{
					        中西區: false,
					        東區: false,
					        南區: false,
					        灣仔區: false
					    },
			    九龍: 	{
			    			深水埗區: false,
			    			九龍城區: false,
			    			觀塘區: false,
			    			黃大仙區: false,
			    			油尖旺區: false
					    },
			    新界: 	{
					        離島區: false,
					        葵青區: false,
					        北區: false,
					        西貢區: false,
					        沙田區: false,
					        大埔區: false,
					        荃灣區: false,
					        屯門區: false,
					        元朗區: false
					    }
			})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  test  };
	self .expressions [1] = function (_item) { return  test  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-user-verify-phone-step', '<nav> <nav-bar> <nav-title> <component-page-title>電話認證</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <phone-verification> <label> 請輸入手機號碼 </label> <component-field-control placeholder="999" input__to="{expression:page-user-verify-phone-step:1}" type="number"></component-field-control> <component-spacing height="35px"></component-spacing> <component-action> <a href="#user/verify/verify-step" ref="{ref prefix}phone-button" disabled="{expression:page-user-verify-phone-step:2}" maybe="{expression:page-user-verify-phone-step:3}">確定</a> </component-action> <disclaimer> 請輸入電話號碼及點擊繼續，FOFI將會透過SMS發送手機驗證碼給您。 </disclaimer> </phone-verification> </component-main-content>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var phone = stream ()
			phone
				.thru (tap, function () {
					phone_ok ('maybe')
				})
				.thru (map, function (phone_num) {
					if ((phone_num + '') .length === 8) {
						return 	from_promise (
									inquire (api () .contact, {
		        						country: 'HKG',
										phone_number: '+852' + phone_num
									})
										.then (R .curryN (2) (wait) (400))
								)
					}
					else
						return stream ({ error: 'invalid input' });
				})
				.thru (switchLatest)
				.thru (tap, function (res) {
					if (res .error)
						phone_ok ('not-ok')
					else
						phone_ok ('ok')
				})

			var phone_ok = stream ('not-ok')
			phone_ok .thru (map, noop) .thru (tap, self .render);

			ref ('phone-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function (e) {
					e .preventDefault ();
					window .location .hash = ref .hash  + '/#' + ([ '+852' + phone () ] .map (stringify)) .join ('/')
				})
			})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  phone  };
	self .expressions [1] = function (_item) { return  phone_ok () !== 'ok'  };
	self .expressions [2] = function (_item) { return  phone_ok () === 'maybe'  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-user-verify-verify-step', '<nav> <nav-bar> <nav-buttons> <a href="#user/verify/phone-step"> <component-back-button></component-back-button> </a> </nav-buttons> <nav-title> <component-page-title>電話認證</component-page-title> </nav-title> </nav-bar> </nav> <component-main-content> <phone-verification> <label> 請輸入手機驗證碼 </label> <component-field-control type="text" placeholder="689" maxlength="5" input__to="{expression:page-user-verify-verify-step:1}"></component-field-control> <component-spacing height="35px"></component-spacing> <component-action> <a href="#team/profile" ref="{ref prefix}verify-button" disabled="{expression:page-user-verify-verify-step:2}" maybe="{expression:page-user-verify-verify-step:3}">確認</a> </component-action> <component-spacing height="15px"></component-spacing> <resend> <a>重發驗證碼</a> </resend> <disclaimer> 在輸入手機驗證碼及點擊確定後，用戶也同時同意接受我們的<a>服務條例</a>及<a>私隱條例</a>。 </disclaimer> </phone-verification> </component-main-content> <unload-shield ref="{ref prefix}unload-shield"> <smoke ref="{ref prefix}smoke"></smoke> </unload-shield>', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var self_diff = stream ();
	var yielded_diff = stream ();
	self .yielded_diff = yielded_diff ;
	var diffs = mergeAll ([ self_diff, yielded_diff ]);
	var ref = function (name) { return ref_diff (name, diffs) };
	var ref_set = function (name) { return ref_set_diff (name, diffs) };
	var _refs = mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ]) .thru (map, consistentfy)  ;
	_refs .thru (map, self_refs) .thru (diff_refs) .thru (tap, self_diff);
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			var verification = stream ();
			verification
				.thru (tap, function () {
					verify_ok ('maybe')
				})
				.thru (map, function (verify_num) {
					if ((verify_num + '') .length === 5) {
						return	stream (true
									? { data: 'verified' }
									: { error: 'incorrect verification' })
									.thru (delay, 400)
					}
					else {
						return stream ({ error: 'invalid code' });
					}
				})
				.thru (switchLatest)
				.thru (tap, function (res) {
					if (res .error)
						verify_ok ('not-ok')
					else
						verify_ok ('ok')
				})

			var verify_ok = stream ('not-ok')
			verify_ok .thru (map, noop) .thru (tap, self .render);

			var modal = ref ('unload-shield');
			ref ('verify-button') .thru (tap, function (ref) {
				ref .addEventListener ('click', function (e) {
					e .preventDefault ();
					modal () .setAttribute ('active', true);
					inquire (api () .teams)
						.then (function (teams) {

								window .location .hash = '#team/connect';
						})
				})
			})

			args .cycle__from

				.thru (tap, function () {
					modal () .removeAttribute ('active');
				})

	self .expressions = {};

	self .expressions [0] = function (_item) { return  verification  };
	self .expressions [1] = function (_item) { return  verify_ok () !== 'ok'  };
	self .expressions [2] = function (_item) { return  verify_ok () === 'maybe'  };
	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
riot.tag2('page-user-verify', '', '', '', function(opts) {
	(function (self, args) {

	 self ._loaded = true;
	 self ._scope = function () {};
	var known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };
	self .on ("update", function () {args = self .opts});

			args .cycle__from
				.thru (tap, function () {
					window .location .hash = '#user/verify/phone-step'
				})

	if (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;
	}) (this, this .opts);
});
