var BattleAbilities = require('./data/abilities.js').BattleAbilities;
var BattleAliases = require('./data/aliases.js').BattleAliases;
var BattlePokedex = require('./data/pokedex.js').BattlePokedex;
var BattleFormatsData = require('./data/formats-data.js').BattleFormatsData;
var BattleLearnsets = require('./data/learnsets.js').BattleLearnsets;
var BattleItems = require('./data/items.js').BattleItems;
var BattleMovedex = require('./data/moves.js').BattleMovedex;
var $ = require('jquery');

var BattleStatuses = null;
var BattleFormats = null;

// a few library functions
function sanitize(str, jsEscapeToo) {
	str = (str?''+str:'');
	str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	if (jsEscapeToo) str = str.replace(/'/g, '\\\'');
	return str;
}
module.exports.sanitize = sanitize;

function jsEscape(str) {
	str = (str?''+str:'');
	str = str.replace(/'/g, '\\\'');
	return str;
}

function messageSanitize(str) {
	return sanitize(str).replace(/\`\`([^< ]([^<`]*?[^< ])?)\`\`/g, '<code>$1</code>').replace(/\~\~([^< ]([^<]*?[^< ])?)\~\~/g, '<s>$1</s>').replace(/(https?\:\/\/[a-z0-9-.]+(\/([^\s]*[^\s?.,])?)?|[a-z0-9]([a-z0-9-\.]*[a-z0-9])?\.(com|org|net|edu|tk)((\/([^\s]*[^\s?.,])?)?|\b))/ig, '<a href="$1" target="_blank">$1</a>').replace(/<a href="([a-z]*[^a-z:])/g, '<a href="http://$1').replace(/(\bgoogle ?\[([^\]<]+)\])/ig, '<a href="http://www.google.com/search?ie=UTF-8&q=$2" target="_blank">$1</a>').replace(/(\bgl ?\[([^\]<]+)\])/ig, '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=$2" target="_blank">$1</a>').replace(/(\bwiki ?\[([^\]<]+)\])/ig, '<a href="http://en.wikipedia.org/w/index.php?title=Special:Search&search=$2" target="_blank">$1</a>').replace(/\[\[([^< ]([^<`]*?[^< ])?)\]\]/ig, '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=$1" target="_blank">$1</a>').replace(/\_\_([^< ]([^<]*?[^< ])?)\_\_/g, '<i>$1</i>').replace(/\*\*([^< ]([^<]*?[^< ])?)\*\*/g, '<b>$1</b>');
}

function toId(text) {
	text = text || '';
	if (typeof text === 'number') text = ''+text;
	if (typeof text !== 'string') return toId(text && text.id);
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
module.exports.toId = toId;

var Tools = {

	htmlSanitize: (function() {
		var uriRewriter = function(uri) {
			// For now, allow all URIs.
			// Later we may filter out most URIs, except those on a whitelist.
			return uri;
		};
		var tagPolicy = function(tagName, attribs) {
			if (html4.ELEMENTS[tagName] & html4.eflags['UNSAFE']) {
				return undefined;
			}
			// In addition to the normal whitelist, allow target='_blank'.
			// html.sanitizeAttribs is not very customisable, so this a bit ugly.
			var blankIdx = undefined;
			var extra = [];
			if (tagName === 'a') {
				for (var i = 0; i < attribs.length - 1; i += 2) {
					switch (attribs[i]) {
						case 'target':
							if (attribs[i + 1] === '_blank') {
								blankIdx = i + 1;
							}
							break;
						case 'room':
							// Special custom attribute for linking to a room.
							// This attribute will be stripped by `sanitizeAttribs`
							// below, and is only used to signal to add an `onclick`
							// handler here.
							if (!(/^[a-z0-9\-]*$/.test(attribs[i + 1]))) {
								// Bogus roomid - could be used to inject JavaScript.
								break;
							}
							extra.push('onclick');
							extra.push('return selectTab(\'' + attribs[i + 1] + '\');');
							break;
					}
				}
			}
			attribs = html.sanitizeAttribs(tagName, attribs, uriRewriter);
			if (blankIdx !== undefined) {
				attribs[blankIdx] = '_blank';
			}
			if (extra.length > 0) {
				attribs = attribs.concat(extra);
			}
			return {attribs: attribs};
		};
		return function(input) {
			return input;
		};
	})(),

	safeJson: function(f) {
		return function(data) {
			if (data.length < 1) return;
			if (data[0] == ']') data = data.substr(1);
			return f.call(this, $.parseJSON(data));
		};
	},

	prefs: (function() {
		var localStorageEntry = 'showdown_prefs';
		var data = {};
		var self = {
			get: function(prop) {
				return data[prop];
			},
			/**
			 * Set a preference value.
			 * If save is true-ish, then also save to localStorage immediately.
			 */
			set: function(prop, value, save) {
				data[prop] = value;
				if (save) self.save();
			},
			save: function() {
				return;
			}
		};
		return self;
	})(),

	getEffect: function(effect) {
		if (!effect || typeof effect === 'string') {
			var name = $.trim(effect||'');
			if (name.substr(0,5) === 'item:') {
				return Tools.getItem(name.substr(5));
			} else if (name.substr(0,8) === 'ability:') {
				return Tools.getAbility(name.substr(8));
			} else if (name.substr(0,5) === 'move:') {
				return Tools.getMove(name.substr(5));
			}
			var id = toId(name);
			effect = {};
			if (id && BattleStatuses && BattleStatuses[id]) {
				effect = BattleStatuses[id];
				effect.exists = true;
			} else if (id && BattleMovedex && BattleMovedex[id] && BattleMovedex[id].effect) {
				effect = BattleMovedex[id].effect;
				effect.exists = true;
			} else if (id && BattleAbilities && BattleAbilities[id] && BattleAbilities[id].effect) {
				effect = BattleAbilities[id].effect;
				effect.exists = true;
			} else if (id && BattleItems && BattleItems[id] && BattleItems[id].effect) {
				effect = BattleItems[id].effect;
				effect.exists = true;
			} else if (id && BattleFormats && BattleFormats[id]) {
				effect = BattleFormats[id];
				effect.exists = true;
				if (!effect.effectType) effect.effectType = 'Format';
			} else if (id === 'recoil') {
				effect = {
					effectType: 'Recoil'
				};
				effect.exists = true;
			} else if (id === 'drain') {
				effect = {
					effectType: 'Drain'
				};
				effect.exists = true;
			}
			if (!effect.id) effect.id = id;
			if (!effect.name) effect.name = name;
			if (!effect.category) effect.category = 'Effect';
			if (!effect.effectType) effect.effectType = 'Effect';
		}
		return effect;
	},

	getMove: function(move) {
		if (!move || typeof move === 'string') {
			var name = $.trim(move||'');
			var id = toId(name);
			move = (BattleMovedex && BattleMovedex[id]) || {};
			if (move.name) move.exists = true;

			if (!move.exists && id.substr(0,11) === 'hiddenpower' && id.length > 11) {
				var matches = /([a-z]*)([0-9]*)/.exec(id);
				move = $.extend({}, BattleMovedex[matches[1]]);
				move.basePower = matches[2];
			}

			if (!move.id) move.id = id;
			if (!move.name) move.name = name;

			if (!move.critRatio) move.critRatio = 1;
			if (!move.baseType) move.baseType = move.type;
			if (!move.effectType) move.effectType = 'Move';
			if (!move.secondaries && move.secondary) move.secondaries = [move.secondary];
		}
		return move;
	},

	getItem: function(item) {
		if (!item || typeof item === 'string') {
			var name = $.trim(item||'');
			var id = toId(name);
			item = (BattleItems && BattleItems[id]) || {};
			if (item.name) item.exists = true;
			if (!item.id) item.id = id;
			if (!item.name) item.name = name;
			if (!item.category) item.category = 'Effect';
			if (!item.effectType) item.effectType = 'Item';
		}
		return item;
	},

	getAbility: function(ability) {
		if (!ability || typeof ability === 'string') {
			var name = $.trim(ability||'');
			var id = toId(name);
			ability = (BattleAbilities && BattleAbilities[id]) || {};
			if (ability.name) ability.exists = true;
			if (!ability.id) ability.id = id;
			if (!ability.name) ability.name = name;
			if (!ability.category) ability.category = 'Effect';
			if (!ability.effectType) ability.effectType = 'Ability';
		}
		return ability;
	},

	getTemplate: function(template) {
		if (!template || typeof template === 'string') {
			var name = template;
			var id = toId(name);
			if (BattleAliases && BattleAliases[id]) {
				name = BattleAliases[id];
				id = toId(name);
			}
			if (!BattlePokedex) BattlePokedex = {};
			if (!BattlePokedex[id]) {
				template = BattlePokedex[id] = {};
				for (var k in basespecieschart) {
					if (id.length > k.length && id.substr(0, k.length) === k) {
						template.basespecies = k;
						template.forme = id.substr(k.length);
					}
				}
				template.exists = false;
			}
			template = BattlePokedex[id];
			if (template.exists === undefined) template.exists = true;
			if (BattleFormatsData && BattleFormatsData[id]) {
				template.tier = BattleFormatsData[id].tier;
				template.isNonstandard = BattleFormatsData[id].isNonstandard;
			}
			if (BattleLearnsets && BattleLearnsets[id]) {
				template.learnset = BattleLearnsets[id].learnset;
			}
			if (!template.id) template.id = id;
			if (!template.name) template.name = name;
			if (!template.speciesid) template.speciesid = id;
			if (!template.species) template.species = name;
			if (!template.basespecies) template.basespecies = name;
			if (!template.forme) template.forme = '';
			if (!template.formeletter) template.formeletter = '';
			if (!template.spriteid) template.spriteid = toId(template.basespecies)+(template.basespecies!==name?'-'+toId(template.forme):'');
		}
		return template;
	},

	getLearnset: function(template) {
		template = Tools.getTemplate(template);
		var alreadyChecked = {};
		var learnset = {};
		do {
			alreadyChecked[template.speciesid] = true;
			if (template.learnset) {
				for (var l in template.learnset) {
					learnset[l] = template.learnset[l];
				}
			}
			if (template.speciesid === 'shaymin') {
				template = Tools.getTemplate('shayminsky');
			} else if (template.basespecies !== template.species) {
				template = Tools.getTemplate(template.basespecies);
			} else {
				template = Tools.getTemplate(template.prevo);
			}
		} while (template && template.species && !alreadyChecked[template.speciesid]);
		return learnset;
	},

	getTeambuilderSprite: function(pokemon) {
		if (!pokemon) return '';
		var id = toId(pokemon);
		if (pokemon.spriteid) id = pokemon.spriteid;
		if (pokemon.species && !id) {
			var template = Tools.getTemplate(pokemon.species);
			if (template.spriteid) {
				id = template.spriteid;
			} else {
				id = toId(pokemon.species);
			}
		}
		var shiny = (pokemon.shiny?'-shiny':'');
		if (BattlePokemonSprites && BattlePokemonSprites[id] && BattlePokemonSprites[id].front && BattlePokemonSprites[id].front.anif && pokemon.gender === 'F') {
			id+='-f';
		}
		return 'background-image:url(/sprites/bw'+shiny+'/'+id+'.png)';
	},

	getItemIcon: function(item) {
		var num = 0;
		if (typeof item === 'string' && exports.BattleItems) item = exports.BattleItems[toId(item)];
		if (item && item.spritenum) num = item.spritenum;

		var top = Math.floor(num / 16) * 24;
		var left = (num % 16) * 24;
		return 'background:transparent url(/sprites/itemicons-sheet.png) no-repeat scroll -' + left + 'px -' + top + 'px';
	},

	getTypeIcon: function(type, b) { // b is just for utilichart.js
		sanitizedType = type.replace(/\?/g,'%3f');
		return '<img src="/sprites/types/'+sanitizedType+'.png" alt="'+type+'" height="14" width="32"'+(b?' class="b"':'')+' />';
	}
};
module.exports.Tools = Tools;