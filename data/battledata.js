/*

License: MIT License
  <https://github.com/Zarel/Pokemon-Showdown/blob/master/LICENSE>

*/

window = {}
//if (!window.exports) window.exports = window;

// todo: http://www.youtube.com/watch?v=eEwAPnIev38
// 32.930 - 1:13.032
// 32930 to 73032
// subway
// 1:33.120 - 3:08.614
/* 

// PO importer

text = $('textarea')[1].value
text = text.split("\n");

for (var i=0; i<text.length; i++)
{
	var line = text[i].split(' ');
	if (!text[i].length) continue;
	if (!exports.BattleLearnsets[POPokemon[line[0]].replace(/ /g,'')])
	{
		exports.BattleLearnsets[POPokemon[line[0]].replace(/ /g,'')] = {};
	}
	var poke = exports.BattleLearnsets[POPokemon[line[0]].replace(/ /g,'')];
	for (var j=1; j<line.length; j++)
	{
		if (!poke.learnset) poke.learnset = {};
		var move = POMoves[line[j]].replace(/ /g,'');
		poke.learnset[move] = '4M';
	}
}

*/

// ES5 indexOf
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
		"use strict";
		if (this == null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 1) {
			n = Number(arguments[1]);
			if (n != n) { // shortcut for verifying if it's NaN
				n = 0;
			} else if (n != 0 && n != Infinity && n != -Infinity) {
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	}
}

// MD5 minified
window.MD5=function(f){function i(b,c){var d,e,f,g,h;f=b&2147483648;g=c&2147483648;d=b&1073741824;e=c&1073741824;h=(b&1073741823)+(c&1073741823);return d&e?h^2147483648^f^g:d|e?h&1073741824?h^3221225472^f^g:h^1073741824^f^g:h^f^g}function j(b,c,d,e,f,g,h){b=i(b,i(i(c&d|~c&e,f),h));return i(b<<g|b>>>32-g,c)}function k(b,c,d,e,f,g,h){b=i(b,i(i(c&e|d&~e,f),h));return i(b<<g|b>>>32-g,c)}function l(b,c,e,d,f,g,h){b=i(b,i(i(c^e^d,f),h));return i(b<<g|b>>>32-g,c)}function m(b,c,e,d,f,g,h){b=i(b,i(i(e^(c|~d),
f),h));return i(b<<g|b>>>32-g,c)}function n(b){var c="",e="",d;for(d=0;d<=3;d++)e=b>>>d*8&255,e="0"+e.toString(16),c+=e.substr(e.length-2,2);return c}var g=[],o,p,q,r,b,c,d,e,f=function(b){for(var b=b.replace(/\r\n/g,"\n"),c="",e=0;e<b.length;e++){var d=b.charCodeAt(e);d<128?c+=String.fromCharCode(d):(d>127&&d<2048?c+=String.fromCharCode(d>>6|192):(c+=String.fromCharCode(d>>12|224),c+=String.fromCharCode(d>>6&63|128)),c+=String.fromCharCode(d&63|128))}return c}(f),g=function(b){var c,d=b.length;c=
d+8;for(var e=((c-c%64)/64+1)*16,f=Array(e-1),g=0,h=0;h<d;)c=(h-h%4)/4,g=h%4*8,f[c]|=b.charCodeAt(h)<<g,h++;f[(h-h%4)/4]|=128<<h%4*8;f[e-2]=d<<3;f[e-1]=d>>>29;return f}(f);b=1732584193;c=4023233417;d=2562383102;e=271733878;for(f=0;f<g.length;f+=16)o=b,p=c,q=d,r=e,b=j(b,c,d,e,g[f+0],7,3614090360),e=j(e,b,c,d,g[f+1],12,3905402710),d=j(d,e,b,c,g[f+2],17,606105819),c=j(c,d,e,b,g[f+3],22,3250441966),b=j(b,c,d,e,g[f+4],7,4118548399),e=j(e,b,c,d,g[f+5],12,1200080426),d=j(d,e,b,c,g[f+6],17,2821735955),c=
j(c,d,e,b,g[f+7],22,4249261313),b=j(b,c,d,e,g[f+8],7,1770035416),e=j(e,b,c,d,g[f+9],12,2336552879),d=j(d,e,b,c,g[f+10],17,4294925233),c=j(c,d,e,b,g[f+11],22,2304563134),b=j(b,c,d,e,g[f+12],7,1804603682),e=j(e,b,c,d,g[f+13],12,4254626195),d=j(d,e,b,c,g[f+14],17,2792965006),c=j(c,d,e,b,g[f+15],22,1236535329),b=k(b,c,d,e,g[f+1],5,4129170786),e=k(e,b,c,d,g[f+6],9,3225465664),d=k(d,e,b,c,g[f+11],14,643717713),c=k(c,d,e,b,g[f+0],20,3921069994),b=k(b,c,d,e,g[f+5],5,3593408605),e=k(e,b,c,d,g[f+10],9,38016083),
d=k(d,e,b,c,g[f+15],14,3634488961),c=k(c,d,e,b,g[f+4],20,3889429448),b=k(b,c,d,e,g[f+9],5,568446438),e=k(e,b,c,d,g[f+14],9,3275163606),d=k(d,e,b,c,g[f+3],14,4107603335),c=k(c,d,e,b,g[f+8],20,1163531501),b=k(b,c,d,e,g[f+13],5,2850285829),e=k(e,b,c,d,g[f+2],9,4243563512),d=k(d,e,b,c,g[f+7],14,1735328473),c=k(c,d,e,b,g[f+12],20,2368359562),b=l(b,c,d,e,g[f+5],4,4294588738),e=l(e,b,c,d,g[f+8],11,2272392833),d=l(d,e,b,c,g[f+11],16,1839030562),c=l(c,d,e,b,g[f+14],23,4259657740),b=l(b,c,d,e,g[f+1],4,2763975236),
e=l(e,b,c,d,g[f+4],11,1272893353),d=l(d,e,b,c,g[f+7],16,4139469664),c=l(c,d,e,b,g[f+10],23,3200236656),b=l(b,c,d,e,g[f+13],4,681279174),e=l(e,b,c,d,g[f+0],11,3936430074),d=l(d,e,b,c,g[f+3],16,3572445317),c=l(c,d,e,b,g[f+6],23,76029189),b=l(b,c,d,e,g[f+9],4,3654602809),e=l(e,b,c,d,g[f+12],11,3873151461),d=l(d,e,b,c,g[f+15],16,530742520),c=l(c,d,e,b,g[f+2],23,3299628645),b=m(b,c,d,e,g[f+0],6,4096336452),e=m(e,b,c,d,g[f+7],10,1126891415),d=m(d,e,b,c,g[f+14],15,2878612391),c=m(c,d,e,b,g[f+5],21,4237533241),
b=m(b,c,d,e,g[f+12],6,1700485571),e=m(e,b,c,d,g[f+3],10,2399980690),d=m(d,e,b,c,g[f+10],15,4293915773),c=m(c,d,e,b,g[f+1],21,2240044497),b=m(b,c,d,e,g[f+8],6,1873313359),e=m(e,b,c,d,g[f+15],10,4264355552),d=m(d,e,b,c,g[f+6],15,2734768916),c=m(c,d,e,b,g[f+13],21,1309151649),b=m(b,c,d,e,g[f+4],6,4149444226),e=m(e,b,c,d,g[f+11],10,3174756917),d=m(d,e,b,c,g[f+2],15,718787259),c=m(c,d,e,b,g[f+9],21,3951481745),b=i(b,o),c=i(c,p),d=i(d,q),e=i(e,r);return(n(b)+n(c)+n(d)+n(e)).toLowerCase()};

var colorCache = {};

function hashColor(name) {
	if (colorCache[name]) return colorCache[name];
	
	var hash = MD5(name);
	// and now, we are handling username color requests
	if (name === 'drielmei') hash = MD5('drielme');
	if (name === 'theimmortal') hash = MD5('taco');
	if (name === 'bmelts') hash = MD5('testmelts');
	if (name === 'zarel') hash = MD5('aeo');
	if (name === 'zarell') hash = MD5('aeo');
	if (name === 'greatsage') hash = MD5('test454');
	if (name === 'snowflakes') hash = MD5('snowflake');
	if (name === 'jumpluff') hash = MD5('zacchaeus');
	if (name === 'zacchaeus') hash = MD5('jumpluff');
	if (name === 'kraw') hash = MD5('kraw1');
	if (name === 'growlithe') hash = MD5('steamroll');
	if (name === 'snowflakes') hash = MD5('endedinariot');
	if (name === 'doomvendingmachine') hash = MD5('theimmortal');
	if (name === 'mikel') hash = MD5('mikkel');
	if (name === 'arcticblast') hash = MD5('rsem');
	if (name === 'mjb') hash = MD5('thefourthchaser');
	if (name === 'thefourthchaser') hash = MD5('mjb');
	if (name === 'mikedecishere') hash = MD5('aoswmike');
	if (name === 'heartsonfire') hash = MD5('haatsuonfaiyaa');
	if (name === 'limi') hash = MD5('azure2');
	if (name === 'cathy') return colorCache[name] = 'color:#ff5cb6;';
	var H = parseInt(hash.substr(4, 4), 16) % 360;
	var S = parseInt(hash.substr(0, 4), 16) % 50 + 50;
	var L = parseInt(hash.substr(8, 4), 16) % 20 + 25;
	colorCache[name] = "color:hsl(" + H + "," + S + "%," + L + "%);";
	return colorCache[name];
}

// a few library functions
function sanitize(str, jsEscapeToo) {
	str = (str?''+str:'');
	str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	if (jsEscapeToo) str = str.replace(/'/g, '\\\'');
	return str;
}
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

function toUserid(text) {
	text = text || '';
	if (typeof text === 'number') text = ''+text;
	if (typeof text !== 'string') return ''; //???
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// miscellaneous things too minor to deserve their own resource file
module.exports.BattleNatures = {
	Adamant: {
		plus: 'atk',
		minus: 'spa'
	},
	Bashful: {},
	Bold: {
		plus: 'def',
		minus: 'atk'
	},
	Brave: {
		plus: 'atk',
		minus: 'spe'
	},
	Calm: {
		plus: 'spd',
		minus: 'atk'
	},
	Careful: {
		plus: 'spd',
		minus: 'spa'
	},
	Docile: {},
	Gentle: {
		plus: 'spd',
		minus: 'def'
	},
	Hardy: {},
	Hasty: {
		plus: 'spe',
		minus: 'def'
	},
	Impish: {
		plus: 'def',
		minus: 'spa'
	},
	Jolly: {
		plus: 'spe',
		minus: 'spa'
	},
	Lax: {
		plus: 'def',
		minus: 'spd'
	},
	Lonely: {
		plus: 'atk',
		minus: 'def'
	},
	Mild: {
		plus: 'spa',
		minus: 'def'
	},
	Modest: {
		plus: 'spa',
		minus: 'atk'
	},
	Naive: {
		plus: 'spe',
		minus: 'spd'
	},
	Naughty: {
		plus: 'atk',
		minus: 'spd'
	},
	Quiet: {
		plus: 'spa',
		minus: 'spe'
	},
	Quirky: {},
	Rash: {
		plus: 'spa',
		minus: 'spd'
	},
	Relaxed: {
		plus: 'def',
		minus: 'spe'
	},
	Sassy: {
		plus: 'spd',
		minus: 'spe'
	},
	Serious: {},
	Timid: {
		plus: 'spe',
		minus: 'atk'
	}
};
module.exports.StatIDs = {
	HP: 'hp',
	hp: 'hp',
	Atk: 'atk',
	atk: 'atk',
	Def: 'def',
	def: 'def',
	SpA: 'spa',
	SAtk: 'spa',
	SpAtk: 'spa',
	spa: 'spa',
	SpD: 'spd',
	SDef: 'spd',
	SpDef: 'spd',
	spd: 'spd',
	Spe: 'spe',
	Spd: 'spe',
	spe: 'spe'
};
module.exports.POStatNames = { // PO style
	hp: 'HP',
	atk: 'Atk',
	def: 'Def',
	spa: 'SAtk',
	spd: 'SDef',
	spe: 'Spd'
};
module.exports.StatNames = { // proper style
	hp: 'HP',
	atk: 'Atk',
	def: 'Def',
	spa: 'SpA',
	spd: 'SpD',
	spe: 'Spe'
};

module.exports.basespecieschart = {
	'unown': 1,
	'castform': 1,
	'deoxys': 1,
	'burmy': 1,
	'wormadam': 1,
	'cherrim': 1,
	'shellos': 1,
	'gastrodon': 1,
	'rotom': 1,
	'giratina': 1,
	'arceus': 1,
	'shaymin': 1,
	'basculin': 1,
	'darmanitan': 1,
	'deerling': 1,
	'sawsbuck': 1,
	'meloetta': 1,
	'genesect': 1,
	'tornadus': 1,
	'thundurus': 1,
	'landorus': 1,
	'kyurem': 1,
	'keldeo': 1
};

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
			return html.sanitizeWithPolicy(input, tagPolicy);
		};
	})(),

	safeJson: function(f) {
		return function(data) {
			if (data.length < 1) return;
			if (data[0] == ']') data = data.substr(1);
			return f.call(this, JSON.parse(data));
		};
	},

	prefs: (function() {
		var localStorageEntry = 'showdown_prefs';
		var data = (window.localStorage &&
				$.parseJSON(localStorage.getItem(localStorageEntry))) || {};
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
				if (!window.localStorage) return;
				localStorage.setItem(localStorageEntry, $.toJSON(data));
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
			if (id && window.BattleStatuses && BattleStatuses[id]) {
				effect = BattleStatuses[id];
				effect.exists = true;
			} else if (id && window.BattleMovedex && BattleMovedex[id] && BattleMovedex[id].effect) {
				effect = BattleMovedex[id].effect;
				effect.exists = true;
			} else if (id && window.BattleAbilities && BattleAbilities[id] && BattleAbilities[id].effect) {
				effect = BattleAbilities[id].effect;
				effect.exists = true;
			} else if (id && window.BattleItems && BattleItems[id] && BattleItems[id].effect) {
				effect = BattleItems[id].effect;
				effect.exists = true;
			} else if (id && window.BattleFormats && BattleFormats[id]) {
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
			move = (window.BattleMovedex && window.BattleMovedex[id]) || {};
			if (move.name) move.exists = true;

			if (!move.exists && id.substr(0,11) === 'hiddenpower' && id.length > 11) {
				var matches = /([a-z]*)([0-9]*)/.exec(id);
				move = $.extend({}, window.BattleMovedex[matches[1]]);
				move.basePower = matches[2];
			}

			if (!move.id) move.id = id;
			if (!move.name) move.name = name;

			if (!move.critRatio) move.critRatio = 1;
			if (!move.baseType) move.baseType = move.type;
			if (!move.effectType) move.effectType = 'Move';
			if (!move.secondaries && move.secondary) move.secondaries = [move.secondary];

			if (!move.anim) move.anim = BattleOtherAnims.attack.anim;
			$.extend(move, BattleMoveAnims[move.id]);
		}
		return move;
	},

	getItem: function(item) {
		if (!item || typeof item === 'string') {
			var name = $.trim(item||'');
			var id = toId(name);
			item = (window.BattleItems && window.BattleItems[id]) || {};
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
			ability = (window.BattleAbilities && window.BattleAbilities[id]) || {};
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
			if (window.BattleAliases && BattleAliases[id]) {
				name = BattleAliases[id];
				id = toId(name);
			}
			if (!window.BattlePokedex) window.BattlePokedex = {};
			if (!window.BattlePokedex[id]) {
				template = window.BattlePokedex[id] = {};
				for (var k in basespecieschart) {
					if (id.length > k.length && id.substr(0, k.length) === k) {
						template.basespecies = k;
						template.forme = id.substr(k.length);
					}
				}
				template.exists = false;
			}
			template = window.BattlePokedex[id];
			if (template.exists === undefined) template.exists = true;
			if (window.BattleFormatsData && window.BattleFormatsData[id]) {
				template.tier = window.BattleFormatsData[id].tier;
				template.isNonstandard = window.BattleFormatsData[id].isNonstandard;
			}
			if (window.BattleLearnsets && window.BattleLearnsets[id]) {
				template.learnset = window.BattleLearnsets[id].learnset;
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
	
	getSpriteData: function(pokemon, siden) {
		pokemon = Tools.getTemplate(pokemon);
		var isBack = !siden;
		var back = (siden?'':'-back');
		var facing = (siden?'front':'back');
		var cryurl = '';
		var spriteid = pokemon.spriteid;
		if (window.BattlePokemonSprites && BattlePokemonSprites[pokemon.speciesid]) {
			var num = '' + BattlePokemonSprites[pokemon.speciesid].num;
			if (num.length < 3) num = '0' + num;
			if (num.length < 3) num = '0' + num;
			cryurl = '/audio/cries/' + num + '.wav';
		}
		if (pokemon.shiny) back += '-shiny';
		if (window.BattlePokemonSprites && BattlePokemonSprites[pokemon.speciesid] && BattlePokemonSprites[pokemon.speciesid][facing]) {
			var url = '/sprites/bwani'+back;
			url += '/'+spriteid;
			var spriteType = 'ani';
			if (BattlePokemonSprites[pokemon.speciesid][facing]['anif'] && pokemon.gender === 'F') {
				url += '-f';
				spriteType = 'anif';
			}
			url += '.gif';
			return {
				w: BattlePokemonSprites[pokemon.speciesid][facing][spriteType].w,
				h: BattlePokemonSprites[pokemon.speciesid][facing][spriteType].h,
				url: url,
				cryurl: cryurl,
				isBackSprite: isBack,
				shiny: pokemon.shiny
			};
		}
		return {
			w: 96,
			h: 96,
			url: '/sprites/bw'+back+'/' + spriteid + '.png',
			cryurl: cryurl,
			isBackSprite: isBack
		};
	},

	getIcon: function(pokemon) {
		var num = 0;
		if (pokemon === 'pokeball') {
			return 'background:transparent url(/sprites/bwicons-pokeball-sheet.png) no-repeat scroll -0px -8px';
		} else if (pokemon === 'pokeball-statused') {
			return 'background:transparent url(/sprites/bwicons-pokeball-sheet.png) no-repeat scroll -32px -8px';
		} else if (pokemon === 'pokeball-none') {
			return 'background:transparent url(/sprites/bwicons-pokeball-sheet.png) no-repeat scroll -64px -8px';
		}
		var id = toId(pokemon);
		if (pokemon && pokemon.species) id = toId(pokemon.species);
		if (pokemon && pokemon.volatiles && pokemon.volatiles.formechange && !pokemon.volatiles.transform) id = toId(pokemon.volatiles.formechange[2]);
		if (pokemon && pokemon.num) num = pokemon.num;
		else if (BattlePokemonSprites[id] && BattlePokemonSprites[id].num) num = BattlePokemonSprites[id].num;
		else if (exports.BattlePokedex[id] && exports.BattlePokedex[id].num) num = exports.BattlePokedex[id].num;
		if (num < 0) num = 0;
		var altNums = {
			"rotomfan": 699,
			"rotomfrost": 700,
			"rotomheat": 701,
			"rotommow": 702,
			"rotomwash": 703,
			"giratinaorigin": 705,
			"shayminsky": 707,
			"basculinbluestriped": 709,
			"darmanitanzen": 712,
			"deoxysattack": 683,
			"deoxysdefense": 684,
			"deoxysspeed": 686,
			"wormadamsandy": 691,
			"wormadamtrash": 692,
			"cherrimsunshine": 694,
			"castformrainy": 680,
			"castformsnowy": 681,
			"castformsunny": 682,
			"meloettapirouette": 724,
			"tornadustherian": 736,
			"thundurustherian": 737,
			"landorustherian": 738,
			"kyuremblack": 739,
			"kyuremwhite": 740,
			"keldeoresolute": 741,
			"syclant": 752+0,
			"revenankh": 752+1,
			"pyroak": 752+2,
			"fidgit": 752+3,
			"stratagem": 752+4,
			"arghonaut": 752+5,
			"kitsunoh": 752+6,
			"cyclohm": 752+7,
			"colossoil": 752+8,
			"krilowatt": 752+9,
			"voodoom": 752+10,
			"tomohawk": 752+11,
			"necturna": 752+12,
			"mollux": 752+13,
			"aurumoth": 752+14
		};
		if (altNums[id]) {
			num = altNums[id];
		}
		if (pokemon && pokemon.gender === 'F') {
			if (id === 'unfezant') num = 708;
			else if (id === 'frillish') num = 721;
			else if (id === 'jellicent') num = 722;
		}

		var top = 8 + Math.floor(num / 16) * 32;
		var left = (num % 16) * 32;
		var fainted = (pokemon && pokemon.fainted?';opacity:.4':'');
		return 'background:transparent url(/sprites/bwicons-sheet.png?v0.7.18) no-repeat scroll -' + left + 'px -' + top + 'px' + fainted;
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

