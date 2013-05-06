/*
---
name: Scoreboard.js
description: Easy Scoreboards with notifications.

license: MIT-style

authors:
  - Tobias Bleckert

requires:
  - Core/1.4.5

provides: [Scoreboard]
...
*/

(function (global) {

	'use strict';
	
	global.Scoreboard = new Class({
	
		Implements: [Options, Events],
		
		options: {
			element:         'scoreboard',
			position:        'topCenter',     // Position of the scoreboard to it's relative parent
			autoStart:       false,           // Auto start time or not
			homeTeamLogo:    null,            // logo image src
			awayTeamLogo:    null,            // logo image src
			homeTeamName:    'Home',          // home team full name
			awayTeamName:    'Away',          // away team full name
			homeTeamShort:   null,            // three letter name. If null three first letters of the name will be used
			awayTeamShort:   null,            // three letter name. If null three first letters of the name will be used
			homeTeamGoals:   0,               // home team goals
			awayTeamGoals:   0,               // away team goals
			secondLength:    1000,            // second length in ms
			timeDirection:   'up',            // countdown or normal
			time:            '00:00',         // used when sport is ice hockey or soccer
			animationSpeed:  300,
			duration:        3000
		},
		
		initialize: function (options) {
			// Set options
			this.setOptions(options);
			
			// Create message element
			this.message = new Element('article', {
				'class': 'scoreboard-message',
				'id':    'scoreboard-message',
				styles: {
					opacity: 0
				}
			});
			
			// Filter array
			this.filters = [];
			
			// Add message to body
			this.message.inject($(document.body));
			
			// Create morph for the message
			this.messageMorph = new Fx.Morph(this.message, {
				duration: this.options.animationSpeed,
				'link': 'chain'
			});
			
			// Create empty message queue
			this.messageQueue = [];
			
			// Set short names
			if (this.options.homeTeamShort === null) {
				this.options.homeTeamShort = String.shortName(this.options.homeTeamName);
			}
			
			if (this.options.awayTeamShort === null) {
				this.options.awayTeamShort = String.shortName(this.options.awayTeamName);
			}
			
			// Set main element
			this.element = document.id(this.options.element);
	
			this.setPosition().build().attach();
		},
		
		attach: function () {
			this.addEvent('change', function (what, value) {
				this.getScoreboardElement(what).set('html', value);
			});
		
			return this;
		},
		
		detach: function () {
			return this;
		},
		
		build: function () {
			var self = this;
			
			Object.each(this.options, function (value, key) {
				self.getScoreboardElement(key).set('html', value);
			});
			
			if (this.options.autoStart) {
				this.startTime();
			}
			
			return this;
		},
		
		setPosition: function () {
			if (this.options.position === 'topCenter') {
				this.element.setStyles({
					position: 'absolute',
					top: '20px',
					left: '50%',
					marginLeft: - (this.element.getWidth() / 2)
				});
			} else if (this.options.position === 'topLeft') {
				this.element.setStyles({
					position: 'absolute',
					top: '20px',
					left: '20px'
				});
			} else if (this.options.position === 'topRight') {
				this.element.setStyles({
					position: 'absolute',
					top: '20px',
					right: '20px'
				});
			} else if (this.options.position === 'bottomLeft') {
				this.element.setStyles({
					position: 'absolute',
					bottom: '20px',
					left: '20px'
				});
			} else if (this.options.position === 'bottomRight') {
				this.element.setStyles({
					position: 'absolute',
					bottom: '20px',
					right: '20px'
				});
			} else if (this.options.position === 'bottomCenter') {
				this.element.setStyles({
					position: 'absolute',
					bottom: '20px',
					left: '50%',
					marginLeft: - (this.element.getWidth() / 2)
				});
			} else if (this.options.position === 'center') {
				this.element.setStyles({
					position: 'absolute',
					bottom: '50%',
					left: '50%',
					marginLeft: - (this.element.getWidth() / 2),
					marginTop: - (this.element.getHeight() / 2)
				});
			}
			
			return this;
		},
		
		get: function (what) {
			return this.options[what];
		},
		
		set: function (what, value) {
			this.options[what] = value;
			
			this.fireEvent('change', [what, value]);
			return this;
		},
		
		setName: function (team, name, short) {
			short = short || String.shortName(name);
			
			if (team === 'home') {
				this.set('homeTeamName', name);
				this.set('homeTeamShort', short.toUpperCase());
			} else {
				this.set('awayTeamName', name);
				this.set('awayTeamShort', short.toUpperCase());
			}
			
			return this;
		},
		
		addGoal: function (team) {
			var goals;
			
			if (team === 'home') {
				goals = this.get('homeTeamGoals');
				goals += 1;
				
				// Apply filter
				goals = this.filter('addHomeTeamGoal', goals);
				
				this.set('homeTeamGoals', goals);
			} else if (team === 'away') {
				goals = this.get('awayTeamGoals');
				goals += 1;
				
				// Apply filter
				goals = this.filter('addAwayTeamGoal', goals);
				
				this.set('awayTeamGoals', goals);
			}
		
			this.fireEvent('onScored', team);
			return this;
		},
		
		removeGoal: function (team) {
			var goals;
			
			if (team === 'home') {
				goals = this.get('homeTeamGoals');
				goals -= 1;
				
				// Apply filter
				goals = this.filter('removeHomeTeamGoal', goals);
				
				if (goals >= 0) {
					this.set('homeTeamGoals', goals);
				}
			} else if (team === 'away') {
				goals = this.get('awayTeamGoals');
				goals -= 1;
				
				// Apply filter
				goals = this.filter('removeAwayTeamGoal', goals);
				
				if (goals >= 0) {
					this.set('awayTeamGoals', goals);
				}
			}
			
			this.fireEvent('onGoalRemoved', team);
			return this;
		},
		
		resetGoals: function (team) {
			if (team === 'home') {
				this.set('homeTeamGoals', 0);
			} else if (team === 'away') {
				this.set('awayTeamGoals', 0);
			}
			
			this.fireEvent('onGoalsReset', team);
			return this;
		},
		
		startTime: function () {
			var self = this;
			
			clearInterval(this.timer);
		
			this.timer = setInterval(function () {
				self.increaseTime();
			}, 1 * this.options.secondLength);
			
			this.fireEvent('onStartTime');
			return this;
		},
		
		stopTime: function () {
			clearInterval(this.timer);
		
			this.fireEvent('onStopTime');
			return this;
		},
		
		increaseTime: function () {
			var time = this.options.time,
					seconds = Number.from(time.split(':')[1]),
					minutes = Number.from(time.split(':')[0]);
					
			if (this.options.timeDirection === 'down') {
				seconds -= 1;
				
				if (seconds < 0 && minutes > 0) {
					seconds  = 59;
					minutes -= 1; 
				} else if (seconds > 0 && minutes === 0) {
					seconds -= 1;
				}
				
				if (seconds < 0) {
					seconds = 0;
				}
			} else {
				seconds += 1;
			
				if (seconds >= 60) {
					seconds = 0;
					minutes += 1;
				}
			}
			
			seconds = (seconds < 10) ? '0' + String.from(seconds) : String.from(seconds);
			minutes = (minutes < 10) ? '0' + String.from(minutes) : String.from(minutes);
			
			time = minutes + ':' + seconds;
			
			// Apply filter
			time = this.filter('increaseTime', time);
			
			this.set('time', time);
		
			this.fireEvent('onTimeIncreased');
			return this;
		},
		
		decreaseTime: function () {
			var time = this.options.time,
					seconds = Number.from(time.split(':')[1]),
					minutes = Number.from(time.split(':')[0]);
					
			if (seconds > 0 || minutes > 0) {
				seconds -= 1;
			}
			
			if (seconds < 0 && minutes > 0) {
				seconds = 59;
				minutes -= 1;
			}
			
			seconds = (seconds < 10) ? '0' + String.from(seconds) : String.from(seconds);
			minutes = (minutes < 10) ? '0' + String.from(minutes) : String.from(minutes);
			
			time = minutes + ':' + seconds;
			
			// Apply filter
			time = this.filter('decreaseTime', time);
			
			this.set('time', time);
			
			this.fireEvent('onTimeDecreased');
			return this;
		},
		
		resetTime: function () {
			this.set('time', '00:00');
			this.fireEvent('onTimeReset');
			
			return this;
		},
		
		getScoreboardElement: function (what) {
			return this.element.getElements('[data-scoreboard-bind="' + what + '"]');
		},
		
		showMessage: function (id, data, position) {
			position = position || 'bottomCenter';
			
			data.scoreboard = this.options;
			
			var template = document.id(id).get('html'),
					self     = this;
					
			if (this.message.hasClass('isShowing')) {
				this.messageQueue.push([id, data, position]);
			} else {
				this.message.set('styles', {
					bottom: '-20px',
					left: '50%',
					marginLeft: -(this.message.getWidth() / 2)
				}).set('html', this.tim(template, data)).addClass('isShowing');
				
				this.messageMorph.start({
					'opacity': [0, 1],
					'bottom':  [-20, 20]
				});
				
				setTimeout(function () {
					self.hideMessage();
				}, this.options.duration);
			}
		},
		
		hideMessage: function () {
			var self  = this,
					nextMessage,
					morph = new Fx.Morph(this.message, {
						duration: this.options.animationSpeed,
						onComplete: function () {
							self.message.removeClass('isShowing');
							if (self.messageQueue.length > 0) {
								nextMessage = self.messageQueue[0];
								self.showMessage(nextMessage[0], nextMessage[1], nextMessage[2]);
								
								self.messageQueue.shift();
							}
						}
					});
			
			morph.start({
				'opacity': [1, 0],
				'bottom':  [20, -20]
			});
		},
		
		applyFilter: function (hook, func) {
			this.filters[hook] = func;
		},
		
		filter: function (filter, val) {
			if (this.filters.hasOwnProperty(filter) && typeof(this.filters[filter]) === 'function') {
				return this.filters[filter](val);
			} else {
				return val;
			}
		},
		
		toJSON: function () {
			return JSON.stringify(this.options);
		},
		
		// https://github.com/premasagar/tim
		tim: function () {
			var e = /{{\s*([a-z0-9_][\\.a-z0-9_]*)\s*}}/gi;
			return function (f, g) {
				return f.replace(e, function (h, i) {
					for (var c = i.split("."), d = c.length, b = g, a = 0; a < d; a++) {
						b = b[c[a]];
						if (b === void 0) throw "tim: '" + c[a] + "' not found in " + h;
						if (a === d - 1) return b
					}
				})
			}
		}()
	
	});
	
	String.extend('shortName', function (name) {
		return name.slice(0, 3).toUpperCase();
	});
	
}(window));