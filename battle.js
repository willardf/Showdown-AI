
function logfunc(msg){
	console.log(msg);
}
/*

License: GPLv2
  <http://www.gnu.org/licenses/gpl-2.0.html>

*/

// par: -webkit-filter:  sepia(100%) hue-rotate(373deg) saturate(592%);
//      -webkit-filter:  sepia(100%) hue-rotate(22deg) saturate(820%) brightness(29%);
// psn: -webkit-filter:  sepia(100%) hue-rotate(618deg) saturate(285%);
// brn: -webkit-filter:  sepia(100%) hue-rotate(311deg) saturate(469%);
// slp: -webkit-filter:  grayscale(100%);
// frz: -webkit-filter:  sepia(100%) hue-rotate(154deg) saturate(759%) brightness(23%);

function Pokemon(species) {
	var selfP = this;

	this.atk = 0;
	this.def = 0;
	this.spa = 0;
	this.spd = 0;
	this.spe = 0;

	this.atkStat = 0;
	this.defStat = 0;
	this.spaStat = 0;
	this.spdStat = 0;
	this.speStat = 0;

	this.boosts = {};

	this.hp = 0;
	this.maxhp = 0;
	this.moves = [];
	this.ability = '';
	this.item = '';
	this.species = species;
	this.side = null;
	this.fainted = false;
	this.zerohp = false;

	this.status = '';
	this.statusStage = 0;
	this.volatiles = {};
	this.turnstatuses = {};
	this.movestatuses = {};
	this.lastmove = '';

	this.name = '';
	this.species = '';
	this.id = '';

	this.getStat = function (stat, evs){
		if (isNaN(evs)) evs = 252; // Assume highest
		statMod = 1;
		if (stat in selfP.boosts){
			if (selfP.boosts[stat] > 0) statMod = 2 / (2 + selfP.boosts[stat]);
			else statMod = (2 + selfP.boosts[stat]) / 2;
		}
		if (this.item == 'choiceband' && stat == 'atk') statMod *= 1.5;
		if (this.item == 'choicespecs' && stat == 'spa') statMod *= 1.5;
		if (this.item == 'choicescarf' && stat == 'spe') statMod *= 1.5;
		return 32 + (2 * selfP.baseStats[stat]) + (evs / 4) * (selfP.level / 100.0) + 5
			* statMod;
	}
	
	this.healthParse = function (hpstring) {
		if (!hpstring || !hpstring.length || hpstring.substr(hpstring.length-1) !== ')') return;
		var parenIndex = hpstring.lastIndexOf('(');
		if (parenIndex < 0) return;
		
		var hp = hpstring.substr(parenIndex+1, hpstring.length-parenIndex-2).split(' ');
		var status = hp[1];
		hp = hp[0];

		// status parse
		if (!status) {
			selfP.status = '';
		} else if (status === 'par' || status === 'brn' || status === 'slp' || status === 'frz' || status === 'tox') {
			selfP.status = status;
		} else if (status === 'psn' && selfP.status !== 'tox') {
			selfP.status = status;
		} else if (status === 'fnt') {
			selfP.hp = 0;
			selfP.zerohp = true;
			selfP.fainted = true;
		}

		// hp parse
		if (hp === '0' || hp === '0.0') {
			selfP.hp = 0;
			selfP.zerohp = true;
		} else if (hp.indexOf('/') > 0) {
			var hp = hp.split('/');
			if (isNaN(parseFloat(hp[0])) || isNaN(parseFloat(hp[1]))) return;
			selfP.hp = parseFloat(hp[0]);
			selfP.maxhp = parseFloat(hp[1]);
			if (!selfP.hp) {
				selfP.zerohp = true;
			}
		} else if (!isNaN(parseFloat(hp))) {
			selfP.hp = selfP.maxhp * parseFloat(hp) / 100;
		}
	};
	this.checkDetails = function(details, ident) {
		if (details === selfP.details) return true;
		if (selfP.details.indexOf('-*') >= 0) {
			selfP.needsReplace = true;
			details = details.replace(/-[A-Za-z0-9]+(, |$)/, '$1');
			return (details === selfP.details.replace(/-[A-Za-z0-9*]+(, |$)/, '$1'));
		}
		return false;
	};
	this.getIdent = function() {
		if (selfP.side.active.length === 1) return selfP.ident;
		var slots = ['a','b','c','d','e','f'];
		return selfP.ident.substr(0,2) + slots[selfP.slot] + selfP.ident.substr(2);
	};
	this.removeVolatile = function (volatile) {
		if (!selfP.hasVolatile(volatile)) return;
		if (selfP.volatiles[volatile][1]) selfP.volatiles[volatile][1].remove();
		delete selfP.volatiles[volatile];
	};
	this.addVolatile = function (volatile) {
		var self = selfP.side.battle;
		if (selfP.hasVolatile(volatile)) return;
		selfP.volatiles[volatile] = [volatile, null];
	};
	this.hasVolatile = function (volatile) {
		return !!selfP.volatiles[volatile];
	};
	this.removeTurnstatus = function (volatile) {
		if (!selfP.hasTurnstatus(volatile)) return;
		//if (selfP.turnstatuses[volatile][1]) selfP.turnstatuses[volatile][1].remove();
		delete selfP.turnstatuses[volatile];
	};
	this.addTurnstatus = function (volatile) {
		volatile = toId(volatile);
		var self = selfP.side.battle;
		if (selfP.hasTurnstatus(volatile)) {
			return;
		}
		selfP.turnstatuses[volatile] = [volatile, null];
	};
	this.hasTurnstatus = function (volatile) {
		return !!selfP.turnstatuses[volatile];
	};
	this.clearTurnstatuses = function () {
		for (i in selfP.turnstatuses) {
			selfP.removeTurnstatus(i);
		}
		selfP.turnstatuses = {};
	};
	this.removeMovestatus = function (volatile) {
		if (!selfP.hasMovestatus(volatile)) return;
		if (selfP.movestatuses[volatile][1]) selfP.movestatuses[volatile][1].remove();
		delete selfP.movestatuses[volatile];
	};
	this.addMovestatus = function (volatile) {
		volatile = toId(volatile);
		var self = selfP.side.battle;
		if (selfP.hasMovestatus(volatile)) {
			return;
		}
		selfP.movestatuses[volatile] = [volatile, null];
	};
	this.hasMovestatus = function (volatile) {
		return !!selfP.movestatuses[volatile];
	};
	this.clearMovestatuses = function () {
		for (i in selfP.movestatuses) {
			selfP.removeMovestatus(i);
		}
		selfP.movestatuses = {};
	};
	this.clearVolatiles = function () {
		for (i in selfP.volatiles) {
			selfP.removeVolatile(i);
		}
		selfP.volatiles = {};
		selfP.clearTurnstatuses();
		selfP.clearMovestatuses();
	};
	this.getName = function () {
		if (selfP.side.n === 0) {
			return sanitize(selfP.name);
		} else {
			return "The foe's " + sanitize(selfP.name);
		}
	};
	this.getLowerName = function () {
		if (selfP.side.n === 0) {
			return sanitize(selfP.name);
		} else {
			return "the foe's " + sanitize(selfP.name);
		}
	};
	this.getTitle = function () {
		titlestring = '(' + selfP.ability + ') ';

		for (var i = 0; i < selfP.moves.length; i++) {
			if (i != 0) titlestring += ' / ';
			titlestring += Tools.getMove(selfP.moves[i]).name;
		}
		return titlestring;
	};
	this.getFullName = function (plaintext) {
		var name = sanitize(selfP.name);
		if (selfP.name !== selfP.species) {
			if (plaintext) {
				name += ' (' + selfP.species + ')';
			} else name += ' <small>(' + selfP.species + ')</small>';
		}
		if (plaintext) {
			if (selfP === selfP.side.active[0]) {
				name += ' (active)';
			} else if (selfP.fainted) {
				name += ' (fainted)';
			} else {
				var statustext = '';
				if (selfP.hp !== selfP.maxhp) statustext = '' + parseInt(100 * selfP.hp / selfP.maxhp) + '%';
				if (selfP.status) {
					if (statustext) statustext += '|';
					statustext += selfP.status;
				}
				if (statustext) {
					name += ' (' + statustext + ')';
				}
			}
		}
		return name;
	}
	this.getBoost = function (boostStat) {
		var boostStatTable = {
			atk: 'Atk',
			def: 'Def',
			spa: 'SpA',
			spd: 'SpD',
			spe: 'Spe',
			accuracy: 'Accuracy',
			evasion: 'Evasion'
		};
		if (!selfP.boosts[boostStat]) {
			return '1&times;&nbsp;' + boostStatTable[boostStat];
		}
		if (selfP.boosts[boostStat] > 6) selfP.boosts[boostStat] = 6;
		if (selfP.boosts[boostStat] < -6) selfP.boosts[boostStat] = -6;
		if (boostStat === 'accuracy' || boostStat === 'evasion') {
			if (selfP.boosts[boostStat] > 0) {
				var goodBoostTable = ['1&times;', '1.33&times;', '1.67&times;', '2&times;', '2.33&times;', '2.67&times;', '3&times;'];
				//var goodBoostTable = ['Normal', '+1', '+2', '+3', '+4', '+5', '+6'];
				return '' + goodBoostTable[selfP.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
			}
			var badBoostTable = ['1&times;', '0.75&times;', '0.6&times;', '0.5&times;', '0.43&times;', '0.38&times;', '0.33&times;'];
			//var badBoostTable = ['Normal', '&minus;1', '&minus;2', '&minus;3', '&minus;4', '&minus;5', '&minus;6'];
			return '' + badBoostTable[-selfP.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
		}
		if (selfP.boosts[boostStat] > 0) {
			var goodBoostTable = ['1&times;', '1.5&times;', '2&times;', '2.5&times;', '3&times;', '3.5&times;', '4&times;'];
			//var goodBoostTable = ['Normal', '+1', '+2', '+3', '+4', '+5', '+6'];
			return '' + goodBoostTable[selfP.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
		}
		var badBoostTable = ['1&times;', '0.67&times;', '0.5&times;', '0.4&times;', '0.33&times;', '0.29&times;', '0.25&times;'];
		//var badBoostTable = ['Normal', '&minus;1', '&minus;2', '&minus;3', '&minus;4', '&minus;5', '&minus;6'];
		return '' + badBoostTable[-selfP.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
	}
	this.getBoostType = function (boostStat) {
		if (!selfP.boosts[boostStat]) {
			return 'neutral';
		} else if (selfP.boosts[boostStat] > 0) {
			return 'good';
		}
		return 'bad';
	}

	this.clearVolatile = function () {
		selfP.atk = selfP.atkStat;
		selfP.def = selfP.defStat;
		selfP.spa = selfP.spaStat;
		selfP.spd = selfP.spdStat;
		selfP.spe = selfP.speStat;
		selfP.boosts = {};
		selfP.clearVolatiles();
		//selfP.lastmove = '';
		selfP.statusStage = 0;
	};
	this.copyVolatileFrom = function (pokemon, copyAll) {
		selfP.boosts = pokemon.boosts;
		selfP.volatiles = pokemon.volatiles;
		//selfP.lastmove = pokemon.lastmove; // I think
		if (!copyAll) {
			selfP.removeVolatile('yawn');
			selfP.removeVolatile('confusion');
			selfP.removeVolatile('airballoon');
		}
		selfP.removeVolatile('transform');
		selfP.removeVolatile('formechange');

		pokemon.atk = pokemon.atkStat;
		pokemon.def = pokemon.defStat;
		pokemon.spa = pokemon.spaStat;
		pokemon.spd = pokemon.spdStat;
		pokemon.spe = pokemon.speStat;
		pokemon.boosts = {};
		pokemon.volatiles = {};
		pokemon.statusStage = 0;
	};
	this.reset = function () {
		selfP.clearVolatile();
		selfP.hp = selfP.maxhp;
		selfP.zerohp = false;
		selfP.fainted = false;
		selfP.status = '';
		if (!selfP.name) {
			selfP.name = selfP.species;
		}
	};
	this.hpWidth = function (maxWidth) {
		if (selfP.fainted || selfP.zerohp) {
			return 0;
		}
		var w = parseInt(maxWidth * selfP.hp / selfP.maxhp);
		if (w < 1) {
			return 1;
		}
		return w;
	}
};

function Battle(frame, logFrame, noPreload) {
	var self = this;

	this.turn = 0;
	this.done = 0;
	this.weather = '';
	this.pseudoWeather = [];
	this.weatherTimeLeft = 0;
	this.weatherMinTimeLeft = 0;
	this.mySide = null;
	this.yourSide = null;
	this.p1 = null;
	this.p2 = null;
	this.sides = [];
	this.lastMove = '';
	this.gen = 5;

	this.paused = true;
	this.playbackState = 0;

	// 0 = uninitialized
	// 1 = ready
	// 2 = playing
	// 3 = paused
	// 4 = finished
	// 5 = seeking
	this.removePseudoWeather = function (weather) {
		for (var i = 0; i < self.pseudoWeather.length; i++) {
			if (self.pseudoWeather[i][0] === weather) {
				self.pseudoWeather.splice(i, 1);
				self.updateWeather();
				return;
			}
		}
	};
	this.addPseudoWeather = function (weather, poke) {
		self.pseudoWeather.push([weather, 5]);
		self.updateWeather();
	};
	this.hasPseudoWeather = function (weather) {
		for (var i = 0; i < self.pseudoWeather.length; i++) {
			if (self.pseudoWeather[i][0] === weather) {
				return true;
			}
		}
		return false;
	};
	this.init = function () {
		self.reset();
		self.mySide = new self.Side(0);
		self.yourSide = new self.Side(1);
		self.mySide.foe = self.yourSide;
		self.yourSide.foe = self.mySide;
		self.sides = [self.mySide, self.yourSide];
		self.p1 = self.mySide;
		self.p2 = self.yourSide;
		self.gen = 5;
	};
	this.reset = function () {
		// battle state
		self.turn = 0;
		self.done = 0;
		self.weather = '';
		self.weatherTimeLeft = 0;
		self.weatherMinTimeLeft = 0;
		self.pseudoWeather = [];
		self.lastMove = '';

		if (self.mySide) self.mySide.reset();
		if (self.yourSide) self.yourSide.reset();

		// activity queue state
		self.animationDelay = 0;
		self.multiHitMove = null;
		self.activityStep = 0;
		self.activityDelay = 0;
		self.activityAnimations = $();
		self.activityQueueActive = false;
		self.fastForwardOff();
		$.fx.off = false;
		self.minorQueue = [];
		self.resultWaiting = false;
		self.paused = true;
		if (self.playbackState !== 5) {
			self.playbackState = (self.activityQueue.length ? 1 : 0);
		}
		
	};
	this.dealloc = function () {
		//self.soundStop();
	};

	this.log = function (html, preempt) {
		logfunc(html);
	};
	
	this.logConsole = function (text) {
		logfunc(text);
	};

	this.Side = function (n) {
		var selfS = this;
		this.battle = self;

		this.name = 'Player';
		this.id = 'Player';
		this.initialized = false;
		this.n = n;
		this.foe = null;
		this.totalPokemon = 6;

		this.sideConditions = {};
		this.wisher = null;

		this.active = [null];
		this.lastPokemon = null;
		this.pokemon = [];

		this.reset = function () {
			selfS.sideConditions = {};
			for (var i = 0; i < selfS.pokemon.length; i++) {
				selfS.pokemon[i].reset();
			}
		};
		
		this.setName = function (name, spriteid) {
			selfS.name = (name||'');
			selfS.id = toId(selfS.name);

			selfS.initialized = true;
			if (!name) {
				selfS.initialized = false;
			}
			selfS.updateSidebar();
			if (self.stagnateCallback) self.stagnateCallback(self);
		};
		this.getTeamName = function () {
			if (selfS === self.mySide) return "Your team";
			return "The foe's team";
		};
		this.getLowerTeamName = function () {
			if (selfS === self.mySide) return "your team";
			return "the foe's team";
		};
		this.updateSidebar = function () {
			var pokemonhtml = '';
			for (var i = 0; i < 6; i++) {
				poke = selfS.pokemon[i];
				if (i >= selfS.totalPokemon) {
					pokemonhtml += '<span class="pokemonicon" style="'+Tools.getIcon('pokeball-none')+'"></span>';
				} else if (!poke) {
					//pokemonhtml += '<img src="/fx/pokeball.png" title="Not revealed" />';
					// pokemonhtml += '<span class="pokemonicon" style="'+Tools.getIcon('pokeball')+'" title="Not revealed"></span>';
				//} else if (poke.fainted) {
					//pokemonhtml += '<img src="/fx/pokeball.png" style="opacity:0.3;filter:alpha(opacity=30)" title="' + poke.getFullName(true) + '" />';
				} else {
					//pokemonhtml += '<img src="/fx/pokeball.png" title="' + poke.getFullName(true) + '" />';
					// pokemonhtml += '<span class="pokemonicon" style="'+Tools.getIcon(poke)+'" title="' + poke.getFullName(true) + '"></span>';
				}
				if (i % 3 === 2) pokemonhtml += '</div><div class="teamicons">';
			}
			pokemonhtml = '<div class="teamicons">' + pokemonhtml + '</div>';
		};
		this.addSideCondition = function (condition) {
			condition = toId(condition);
			if (selfS.sideConditions[condition]) {
				if (condition === 'spikes' || condition === 'toxicspikes') {
					selfS.sideConditions[condition][2]++;
				}
				return;
			}
			switch (condition) {
			case 'reflect':
				selfS.sideConditions[condition] = [condition, null, 5];
				break;
			case 'safeguard':
				selfS.sideConditions[condition] = [condition, null, 5];
				break;
			case 'lightscreen':
				selfS.sideConditions[condition] = [condition, null, 5];
				break;
			case 'mist':
				selfS.sideConditions[condition] = [condition, null, 5];
				break;
			case 'tailwind':
				selfS.sideConditions[condition] = [condition, null, 5];
				break;
			case 'stealthrock':
				selfS.sideConditions[condition] = [condition, null, 1];
				break;
			case 'spikes':
				selfS.sideConditions[condition] = [condition, null, 1];
				break;
			case 'toxicspikes':
				selfS.sideConditions[condition] = [condition, null, 1];
				break;
			default:
				selfS.sideConditions[condition] = [condition, null, 1];
			}
		};
		this.removeSideCondition = function (condition) {
			condition = toId(condition);
			if (!selfS.sideConditions[condition]) return;
			if (selfS.sideConditions[condition][1]) selfS.sideConditions[condition][1].remove();
			delete selfS.sideConditions[condition];
		};
		this.newPokemon = function (species, replaceSlot) {
			var id;
			var pokeobj;
			if (species.species) {
				pokeobj = species;
				species = pokeobj.species;
				id = pokeobj.id;
			}
			var poke = Tools.getTemplate(species);
			poke = $.extend(new Pokemon(species), poke);
			poke.side = selfS;
			poke.atkStat = 10;
			poke.defStat = 10;
			poke.spaStat = 10;
			poke.spdStat = 10;
			poke.maxhp = 1000;
			if (self.gen === 5 && (species === 'Mienfoo' || species === 'Mienshao' || species === 'Tangrowth' || species === 'Slowking' || species === 'Slowbro')) {
				poke.ability = '??Regenerator';
			}
			if (self.gen > 2 && (species === 'Staryu' || species === 'Starmie' || species === 'Shaymin' || species === 'Blissey' || species === 'Chansey' || species === 'Celebi')) {
				poke.ability = '??NaturalCure';
			}
			if (pokeobj) poke = $.extend(poke, pokeobj);
			if ((!poke.ability || poke.ability.substr(0,2) === '??') && poke.baseAbility) poke.ability = poke.baseAbility;
			poke.id = id;
			poke.reset();

			if (typeof replaceSlot !== 'undefined') {
				selfS.pokemon[replaceSlot] = poke;
			} else {
				selfS.pokemon.push(poke);
			}
			if (selfS.pokemon.length == 7) {
				// something's wrong
				self.logConsole('corruption');

				// the other possibility is Illusion, which we'll assume
				var existingTable = {};
				for (var i=0; i<6; i++) {
					var poke1 = selfS.pokemon[i];
					if (existingTable[poke1.searchid]) {
						var j = existingTable[poke1.searchid];
						var poke2 = selfS.pokemon[j];
						if (selfS.active.indexOf(poke1) >= 0) {
							selfS.pokemon.splice(j,1);
						} else if (selfS.active.indexOf(poke2) >= 0) {
							selfS.pokemon.splice(i,1);
						} else if (poke1.fainted && !poke2.fainted) {
							selfS.pokemon.splice(j,1);
						} else {
							selfS.pokemon.splice(i,1);
						}
						break;
					}
					existingTable[poke1.searchid] = i;
				}
			}
			selfS.updateSidebar();

			return poke;
		};

		this.getStatbarHTML = function (pokemon) {
			var gender = '';
			if (pokemon.gender === 'F') gender = ' <small style="color:#C57575">&#9792;</small>';
			if (pokemon.gender === 'M') gender = ' <small style="color:#7575C0">&#9794;</small>';
			return '<div class="statbar' + (selfS.n ? ' lstatbar' : ' rstatbar') + '"><strong>' + sanitize(pokemon.name) + gender + (pokemon.level === 100 ? '' : ' <small>L' + pokemon.level + '</small>') + '</strong><div class="hpbar"><div class="hptext"></div><div class="hptextborder"></div><div class="prevhp"><div class="hp"></div></div><div class="status"></div></div>';
		};
		this.switchIn = function (pokemon, slot) {
			if (slot === undefined) slot = pokemon.slot;
			logfunc(slot);
			selfS.active[slot] = pokemon;
			pokemon.slot = slot;
			pokemon.clearVolatile();
			pokemon.lastmove = '';
			self.lastmove = 'switch-in';
			if (selfS.lastPokemon && selfS.lastPokemon.lastmove === 'batonpass') {
				pokemon.copyVolatileFrom(selfS.lastPokemon);
			}

			if (pokemon.side.n === 0) {
				self.message('Go! ' + pokemon.getFullName() + '!');
			} else {
				self.message('' + sanitize(pokemon.side.name) + ' sent out ' + pokemon.getFullName() + '!');
			}
			
			selfS.updateStatbar(pokemon, true);
			pokemon.side.updateSidebar();

			if (self.fastForward) {
				if (self.switchCallback) self.switchCallback(self, selfS);
				return;
			}

			if (self.switchCallback) self.switchCallback(self, selfS);
		};
		
		this.dragIn = function (pokemon, slot) {
			if (slot === undefined) slot = pokemon.slot;
			self.message('' + pokemon.getFullName() + ' was dragged out!');
			if (pokemon === selfS.active[slot]) return;
			var oldpokemon = selfS.active[slot];
			selfS.lastPokemon = oldpokemon;
			if (oldpokemon) oldpokemon.clearVolatile();
			pokemon.clearVolatile();
			pokemon.lastmove = '';
			self.lastmove = 'switch-in';
			selfS.active[slot] = pokemon;

			if (oldpokemon === pokemon) return;

			
			selfS.updateStatbar(pokemon, true);
			if (self.fastForward) {
			
				if (self.dragCallback) self.dragCallback(self, selfS);
				return;
			}
			if (self.dragCallback) self.dragCallback(self, selfS);
		};
		this.replace = function (pokemon, slot) {
			if (slot === undefined) slot = pokemon.slot;
			var oldpokemon = selfS.active[slot];
			if (pokemon === oldpokemon) return;
			selfS.lastPokemon = oldpokemon;
			pokemon.clearVolatile();
			if (oldpokemon) {
				pokemon.lastmove = oldpokemon.lastmove;
				pokemon.hp = oldpokemon.hp;
				pokemon.maxhp = oldpokemon.maxhp;
				pokemon.status = oldpokemon.status;
				pokemon.copyVolatileFrom(oldpokemon, true);
				if (!oldpokemon.hp) {
					oldpokemon.hp = 1;
					oldpokemon.zerohp = false;
					oldpokemon.fainted = false;
				}
			}
			selfS.active[slot] = pokemon;	

			
			selfS.updateStatbar(pokemon, true);
			// not sure if we want a different callback
			if (self.dragCallback) self.dragCallback(self, selfS);
		};
		this.switchOut = function (pokemon, slot) {
			if (slot === undefined) slot = pokemon.slot;
			if (pokemon.lastmove !== 'batonpass') {
				pokemon.clearVolatile();
			} else {
				pokemon.removeVolatile('transform');
				pokemon.removeVolatile('formechange');
			}
			if (pokemon.lastmove === 'uturn' || pokemon.lastmove === 'voltswitch') {
				self.message('' + pokemon.getName() + ' went back to ' + sanitize(pokemon.side.name) + '!');
			} else if (pokemon.lastmove !== 'batonpass') {
				if (pokemon.side.n === 0) {
					self.message('' + pokemon.getName() + ', come back!');
				} else {
					self.message('' + sanitize(pokemon.side.name) + ' withdrew ' + pokemon.getFullName() + '!');
				}
			}
			selfS.lastPokemon = pokemon;
			selfS.active[slot] = null;

			if ((pokemon.ability === 'Regenerator' || pokemon.ability === '??Regenerator') && pokemon.hp < pokemon.maxhp) {
				var damage = 100 / 3;
				pokemon.hp += pokemon.maxhp * damage / 100;
				if (pokemon.hp > pokemon.maxhp) {
					damage -= 100 * (pokemon.hp - pokemon.maxhp) / pokemon.maxhp;
					pokemon.hp = pokemon.maxhp;
				}
			}
			if ((pokemon.ability === 'NaturalCure' || pokemon.ability === '??NaturalCure') && pokemon.status) {
				pokemon.status = '';
			}

			selfS.updateStatbar(pokemon, true);
		};
		this.faint = function (pokemon, slot) {
			if (slot === undefined) slot = pokemon.slot;
			pokemon.clearVolatile();
			selfS.lastPokemon = pokemon;
			selfS.active[slot] = null;

			self.message('' + pokemon.getName() + ' fainted!');

			pokemon.fainted = true;
			pokemon.zerohp = true;
			pokemon.hp = 0;
			pokemon.side.updateStatbar(pokemon, false, true);
			pokemon.side.updateSidebar();

			if (self.faintCallback) self.faintCallback(self, selfS);
		};
		this.updateStatbar = function (pokemon, updatePrevhp, updateHp) {
			if (!pokemon) {
				if (selfS.active[0]) selfS.updateStatbar(selfS.active[0], updatePrevhp, updateHp);
				if (selfS.active[1]) selfS.updateStatbar(selfS.active[1], updatePrevhp, updateHp);
				return;
			}
			if (!pokemon || !pokemon.statbarElem) {
				return;
			}
			if (updatePrevhp || updateHp) {
				var w = pokemon.hpWidth(150);
			}
			var status = '';
			if (pokemon.status === 'brn') {
				status += '<span class="brn">BRN</span> ';
			} else if (pokemon.status === 'psn') {
				status += '<span class="psn">PSN</span> ';
			} else if (pokemon.status === 'tox') {
				status += '<span class="psn">TOX</span> ';
			} else if (pokemon.status === 'slp') {
				status += '<span class="slp">SLP</span> ';
			} else if (pokemon.status === 'par') {
				status += '<span class="par">PAR</span> ';
			} else if (pokemon.status === 'frz') {
				status += '<span class="frz">FRZ</span> ';
			}
			for (x in pokemon.boosts) {
				if (pokemon.boosts[x]) {
					status += '<span class="' + pokemon.getBoostType(x) + '">' + pokemon.getBoost(x) + '</span> ';
				}
			}
			var statusTable = {
				confusion: '<span class="bad">Confused</span> ',
				healblock: '<span class="bad">Heal&nbsp;Block</span> ',
				yawn: '<span class="bad">Drowsy</span> ',
				smackdown: '<span class="bad">Grounded</span> ',
				flashfire: '<span class="good">Flash&nbsp;Fire</span> ',
				imprison: '<span class="good">Imprisoning&nbsp;foe</span> ',
				formechange: '',
				typechange: '',
				autotomize: '<span class="neutral">Lightened</span> ',
				miracleeye: '<span class="bad">Miracle&nbsp;Eye</span> ',
				foresight: '<span class="bad">Foresight</span> ',
				telekinesis: '<span class="neutral">Telekinesis</span> ',
				transform: '<span class="neutral">Transformed</span> ',
				powertrick: '<span class="neutral">Power&nbsp;Trick</span> ',
				curse: '<span class="bad">Curse</span> ',
				nightmare: '<span class="bad">Nightmare</span> ',
				attract: '<span class="bad">Attract</span> ',
				torment: '<span class="bad">Torment</span> ',
				taunt: '<span class="bad">Taunt</span> ',
				disable: '<span class="bad">Disable</span> ',
				embargo: '<span class="bad">Embargo</span> ',
				ingrain: '<span class="good">Ingrain</span> ',
				aquaring: '<span class="good">Aqua&nbsp;Ring</span> ',
				stockpile1: '<span class="good">Stockpile</span> ',
				stockpile2: '<span class="good">Stockpile&times;2</span> ',
				stockpile3: '<span class="good">Stockpile&times;3</span> ',
				perish1: '<span class="bad">Perish&nbsp;next&nbsp;turn</span> ',
				perish2: '<span class="bad">Perish&nbsp;in&nbsp;2</span> ',
				perish3: '<span class="bad">Perish&nbsp;in&nbsp;3</span> ',
				airballoon: '<span class="good">Balloon</span> ',
				leechseed: '<span class="bad">Leech&nbsp;Seed</span> ',
				encore: '<span class="bad">Encore</span> ',
				mustrecharge: '<span class="bad">Must&nbsp;recharge</span> ',
				bide: '<span class="good">Bide</span> ',
				magnetrise: '<span class="good">Magnet&nbsp;Rise</span> ',
				smackdown: '<span class="bad">Smack&nbsp;Down</span> ',
				focusenergy: '<span class="good">Focus&nbsp;Energy</span> ',
				slowstart: '<span class="bad">Slow&nbsp;Start</span> ',
				doomdesire: '',
				futuresight: '',
				mimic: '<span class="good">Mimic</span> ',
				watersport: '<span class="good">Water&nbsp;Sport</span> ',
				mudsport: '<span class="good">Mud&nbsp;Sport</span> ',
				substitute: '',
				// sub graphics are handled elsewhere, see Battle.Sprite.animSub()
				uproar: '<span class="neutral">Uproar</span>',
				roost: '<span class="neutral">Landed</span>',
				protect: '<span class="good">Protect</span>',
				quickguard: '<span class="good">Quick&nbsp;Guard</span>',
				wideguard: '<span class="good">Wide&nbsp;Guard</span>',
				helpinghand: '<span class="good">Helping&nbsp;Hand</span>',
				magiccoat: '<span class="good">Magic&nbsp;Coat</span>',
				destinybond: '<span class="good">Destiny&nbsp;Bond</span>',
				snatch: '<span class="good">Snatch</span>',
				grudge: '<span class="good">Grudge</span>',
				endure: '<span class="good">Endure</span>',
				focuspunch: '<span class="neutral">Focusing</span>'
			};
			for (i in pokemon.volatiles) {
				if (typeof statusTable[i] === 'undefined') status += '<span class="neutral">[['+i+']]</span>';
				else status += statusTable[i];
			}
			for (i in pokemon.turnstatuses) {
				if (typeof statusTable[i] === 'undefined') status += '<span class="neutral">[['+i+']]</span>';
				else status += statusTable[i];
			}
			for (i in pokemon.movestatuses) {
				if (typeof statusTable[i] === 'undefined') status += '<span class="neutral">[['+i+']]</span>';
				else status += statusTable[i];
			}
			
			//statusbar.html(status);
		}
	};
	this.sidesSwitched = false;
	this.switchSides = function () {
		self.sidesSwitched = !self.sidesSwitched;
		if (self.sidesSwitched) {
			self.mySide = self.p2;
			self.yourSide = self.p1;
		} else {
			self.mySide = self.p1;
			self.yourSide = self.p2;
		}
		self.mySide.n = 0;
		self.yourSide.n = 1;
		self.sides[0] = self.mySide;
		self.sides[1] = self.yourSide;

		self.mySide.updateSidebar();
		self.yourSide.updateSidebar();
		// nothing else should need updating - don't call this function after sending out pokemon
	}

	this.messageActive = false;
	this.message = function (message, hiddenmessage) {
		self.messageActive = true;
		self.log('<div>' + message + (hiddenmessage ? hiddenmessage : '') + '</div>');
	}
	this.endAction = function () {
		if (self.messageActive) {
			self.messageActive = false;
		}
	}

	//
	// activities
	//
	this.start = function () {
		self.log('<div>Battle between ' + sanitize(self.p1.name) + ' and ' + sanitize(self.p2.name) + ' started!</div>');
		if (self.startCallback) self.startCallback(self);
	}
	this.winner = function (winner) {
		this.didWin = ( winner == this.mySide.name );
		if (self.fastForward !== -2) self.fastForwardOff();
		if (winner) self.message('' + winner + ' won the battle!');
		else self.message('Tie between ' + sanitize(self.p1.name) + ' and ' + sanitize(self.p2.name) + '!');
		self.done = 1;
	}
	this.prematureEnd = function () {
		if (self.fastForward !== -2) self.fastForwardOff();
		self.message('This replay ends here.');
		self.done = 1;
	}
	this.setTurn = function (turnnum) {
		turnnum = parseInt(turnnum);
		self.turn = turnnum;
		self.updateWeatherLeft();

		if (self.mySide.active[0]) self.mySide.active[0].clearTurnstatuses();
		if (self.mySide.active[1]) self.mySide.active[1].clearTurnstatuses();
		if (self.yourSide.active[0]) self.yourSide.active[0].clearTurnstatuses();
		if (self.yourSide.active[1]) self.yourSide.active[1].clearTurnstatuses();
		self.mySide.updateStatbar(null, true);
		self.yourSide.updateStatbar(null, true);

		self.log('<h2>Turn ' + turnnum + '</h2>');

		if (self.fastForward) {
			if (self.turnCallback) self.turnCallback(self);
			if (self.fastForward > -1 && turnnum >= self.fastForward) {
				self.fastForwardOff();
			}
			return;
		}
		if (self.turnCallback) self.turnCallback(self);
	}
	this.changeWeather = function (weather, poke, isUpkeep) {
		weather = toId(weather);
		var weatherTable = {
			sunnyday: {
				name: 'Sun',
				startMessage: 'The sunlight turned harsh!',
				abilityMessage: "'s Drought intensified the sun's rays!",
				//upkeepMessage: 'The sunlight is strong!',
				endMessage: "The sunlight faded."
			},
			raindance: {
				name: 'Rain',
				startMessage: 'It started to rain!',
				abilityMessage: "'s Drizzle made it rain!",
				//upkeepMessage: 'Rain continues to fall!',
				endMessage: 'The rain stopped.'
			},
			sandstorm: {
				name: 'Sandstorm',
				startMessage: 'A sandstorm kicked up!',
				abilityMessage: "'s Sand Stream whipped up a sandstorm!",
				upkeepMessage: 'The sandstorm rages.',
				endMessage: 'The sandstorm subsided.'
			},
			hail: {
				name: 'Hail',
				startMessage: 'It started to hail!',
				abilityMessage: "'s Snow Warning whipped up a hailstorm!",
				upkeepMessage: 'The hail crashes down.',
				endMessage: 'The hail stopped.'
			}
		};
		if (!weather || weather === 'none') {
			weather = '';
		}
		var newWeather = weatherTable[weather];
		if (isUpkeep) {
			if (newWeather && newWeather.upkeepMessage) self.log('<div><small>' + newWeather.upkeepMessage + '</small></div>');
			return;
		}
		if (newWeather) {
			if (poke) {
				self.message('<small>' + poke.getName() + newWeather.abilityMessage + '</small>');
				self.weatherTimeLeft = 0;
				self.weatherMinTimeLeft = 0;
			} else if (isUpkeep) {
				self.log('<div><small>' + newWeather.upkeepMessage + '</small></div>');
				self.weatherTimeLeft = 0;
				self.weatherMinTimeLeft = 0;
			} else {
				self.message('<small>' + newWeather.startMessage + '</small>');
				if (self.turn === 0) {
					self.weatherTimeLeft = 0;
					self.weatherMinTimeLeft = 0;
				} else {
					self.weatherTimeLeft = 8;
					self.weatherMinTimeLeft = 5;
				}
			}
		}
		if (self.weather && !newWeather) {
			self.message(weatherTable[self.weather].endMessage);
		}
		self.updateWeather(weather);
	}
	this.updateWeatherLeft = function () {
		for (var i = 0; i < self.pseudoWeather.length; i++) {
			if (self.pseudoWeather[i][1] > 0) self.pseudoWeather[i][1]--;
		}
		if (self.weather && self.weatherTimeLeft) {
			self.weatherTimeLeft--;
			if (self.weatherMinTimeLeft != 0) self.weatherMinTimeLeft--;
		}
		self.updateWeather();
	};
	this.weatherLeft = function (weather) {
		if (weather) {
			for (var i = 0; i < self.pseudoWeather.length; i++) {
				if (self.pseudoWeather[i][0] === weather) {
					if (self.pseudoWeather[i][1]) {
						return ' <small>(' + self.pseudoWeather[i][1] + ' turn' + (self.pseudoWeather[i][1] == 1 ? '' : 's') + ' left)</small>';
					}
					return '';
				}
			}
			return ''; // weather doesn't exist
		}
		if (self.weatherMinTimeLeft != 0) {
			return ' <small>(' + self.weatherMinTimeLeft + ' to ' + self.weatherTimeLeft + ' turns left)</small>';
		}
		if (self.weatherTimeLeft != 0) {
			return ' <small>(' + self.weatherTimeLeft + ' turn' + (self.weatherTimeLeft == 1 ? '' : 's') + ' left)</small>';
		}
		return '';
	}
	this.updateWeather = function (weather) {
		var weatherNameTable = {
			sunnyday: 'Sun',
			raindance: 'Rain',
			sandstorm: 'Sandstorm',
			hail: 'Hail'
		};

		if (typeof weather === 'undefined') {
			weather = self.weather;
		}
		if (weather === '' || weather === 'none' || weather === 'pseudo') {
			weather = (self.pseudoWeather.length ? 'pseudo' : '');
		}

		var oldweather = self.weather;
		self.weather = weather;

		var weatherhtml = '';
		if (weather) {
			if (weather !== 'pseudo') {
				weatherhtml += weatherNameTable[weather] + self.weatherLeft();
			}
			for (var i = 0; i < self.pseudoWeather.length; i++) {
				weatherhtml += '<br />' + Tools.getMove(self.pseudoWeather[i][0]).name + self.weatherLeft(self.pseudoWeather[i][0]);
			}
		}
	}

	this.useMove = function (pokemon, move, target, kwargs) {
		var fromeffect = Tools.getEffect(kwargs.from);
		pokemon.clearMovestatuses();
		pokemon.side.updateStatbar(pokemon, true);
		if (move.id === 'focuspunch') {
			pokemon.removeTurnstatus('focuspunch');
			pokemon.side.updateStatbar(pokemon);
		}
		if (!target) {
			target = pokemon.side.foe.active[0];
		}
		if (!target) {
			target = pokemon.side.foe.missedPokemon;
		}
		if (!self.fastForward) {
			// skip
			if (kwargs.miss && target.side) {
				target = target.side.missedPokemon;
			}
			if (kwargs.notarget) {
				target = pokemon.side.foe.missedPokemon;
			}
			if (kwargs.prepare || kwargs.anim === 'prepare') {
				self.prepareMove(pokemon, move, target);
			}
		}
		if (!kwargs.silent) {
			switch (fromeffect.id) {
			case 'snatch':
				break;
			case 'metronome':
				self.message('Waggling a finger let it use <strong>' + move.name + '</strong>!');
				break;
			case 'naturepower':
				self.message('Nature Power turned into <strong>' + move.name + '</strong>!');
				break;
			case 'sleeptalk':
			default:
				self.message(pokemon.getName() + ' used <strong>' + move.name + '</strong>!');
				break;
			}
		}
		pokemon.lastmove = move.id;
		self.lastmove = move.id;
		if (move.id === 'wish' || move.id === 'healingwish') {
			pokemon.side.wisher = pokemon;
		}
		if (move.id === 'hyperbeam' || move.id === 'gigaimpact' || move.id === 'rockwrecker' || move.id === 'roaroftime' || move.id === 'blastburn' || move.id === 'frenzyplant' || move.id === 'hydrocannon') {
			if (!kwargs.miss && !kwargs.notarget) {
				pokemon.addMovestatus('mustrecharge');
				pokemon.side.updateStatbar();
				//self.animationDelay += 500;
			}
		}
	};
	this.cantUseMove = function (pokemon, effect, move, kwargs) {
		pokemon.clearMovestatuses();
		pokemon.side.updateStatbar(pokemon, true);
		switch (effect.id)
		{
		case 'taunt':
			self.message('' + pokemon.getName() + ' can\'t use ' + move.name + ' after the taunt!');
			break;
		case 'imprison':
			self.message('' + pokemon.getName() + ' can\'t use the sealed ' + move.name + '!');
			break;
		case 'par':
			self.message('' + pokemon.getName() + ' is paralyzed! It can\'t move!');
			break;
		case 'frz':
			self.message('' + pokemon.getName() + ' is frozen solid!');
			break;
		case 'slp':
			self.message('' + pokemon.getName() + ' is fast asleep.');
			break;
		case 'skydrop':
			self.message('Sky Drop won\'t let ' + pokemon.getLowerName() + ' go!');
			break;
		case 'truant':
			self.message('' + pokemon.getName() + ' is loafing around!');
			break;
		case 'recharge':
			self.message('<small>' + pokemon.getName() + ' must recharge!</small>');
			break;
		case 'focuspunch':
			self.message(pokemon.getName() + ' lost its focus and couldn\'t move!');
			pokemon.removeTurnstatus('focuspunch');
			break;
		case 'flinch':
			self.message(pokemon.getName() + ' flinched!');
			pokemon.removeTurnstatus('focuspunch');
			break;
		case 'attract':
			self.message(pokemon.getName() + ' is immobilized by love!');
			break;
		default:
			self.message('<small>' + pokemon.getName() + (move.name ? ' can\'t use ' + move.name + '' : ' can\'t move') + '!</small>');
			break;
		}
	};
	this.prepareMove = function (pokemon, move, target) {
		if (!move.prepareAnim) return;
		if (!target) {
			target = pokemon.side.foe.active[0];
		}
		if (!target) {
			target = pokemon;
		}
		self.message('<small>'+move.prepareMessage(pokemon, target)+'</small>');
	};
	this.runMinor = function (args, kwargs, preempt, nextArgs, nextKwargs) {
		var actions = '';
		var hiddenactions = '';
		var minors = self.minorQueue;
		if (self.multiHitMove && minors.length) {
			var lastMinor = minors[minors.length - 1];
		}
		if (args) {
			if (args[0] === '-crit' || args[0] === '-supereffective' || args[0] === '-resisted') args.then = '.';
			if (args[0] === '-damage' && kwargs.from === 'Leech Seed' && nextArgs[0] === '-heal' && nextKwargs.silent) args.then = '.';
			minors.push([args, kwargs]);
			if (args.simult || args.then) {
				return;
			}
		}
		
		while (minors.length) {
			var row = minors.shift();
			args = row[0];
			kwargs = row[1];
			
			switch (args[0]) {
			case '-damage':
				var poke = this.getPokemon(args[1]);
				var damage = parseFloat(args[2]);
				if (isNaN(damage)) damage = 50; // wtf
				poke.hp -= poke.maxhp * damage / 100;
				poke.healthParse(args[2]);
				self.lastDamage = (damage || 1);
				
				if (kwargs.silent) {
					// do nothing
				} else if (kwargs.from) {
					var effect = Tools.getEffect(kwargs.from);
					var ofpoke = this.getPokemon(kwargs.of);
					switch (effect.id) {
					case 'stealthrock':
						actions += "Pointed stones dug into " + poke.getLowerName() + "!";
						break;
					case 'spikes':
						actions += "" + poke.getName() + " is hurt by the spikes!";
						break;
					case 'brn':
						actions += "" + poke.getName() + " was hurt by its burn!";
						break;
					case 'psn':
						actions += "" + poke.getName() + " was hurt by poison!";
						break;
					case 'lifeorb':
						hiddenactions += "" + poke.getName() + " lost some of its HP!";
						break;
					case 'recoil':
						actions += "" + poke.getName() + " is damaged by recoil!";
						break;
					case 'sandstorm':
						actions += "" + poke.getName() + " is buffeted by the sandstorm!";
						break;
					case 'hail':
						actions += "" + poke.getName() + " is buffeted by the hail!";
						break;
					case 'baddreams':
						actions += "" + poke.getName() + " is tormented!";
						break;
					case 'nightmare':
						actions += "" + poke.getName() + " is locked in a nightmare!";
						break;
					case 'confusion':
						actions += "It hurt itself in its confusion! ";
						break;
					case 'leechseed':
						actions += "" + poke.getName() + "'s health is sapped by Leech Seed!";
						break;
					case 'flameburst':
						actions += "The bursting flame hit " + poke.getLowerName() + "!";
						break;
					case 'grasspledge':
						actions += "" + poke.getName() + " is hurt by the sea of fire!";
						break;
					case 'jumpkick':
					case 'hijumpkick':
						actions += "" + poke.getName() + " kept going and crashed!";
						break;
					default:
						if (ofpoke) {
							actions += "" + poke.getName() + " is hurt by " + ofpoke.getLowerName() + "'s " + effect.name + "!";
						} else if (effect.effectType === 'Item' || effect.effectType === 'Ability') {
							actions += "" + poke.getName() + " is hurt by its " + effect.name + "!";
						} else if (kwargs.partiallytrapped) {
							actions += "" + poke.getName() + ' is hurt by ' + effect.name + '!';
						} else {
							actions += "" + poke.getName() + " lost some HP because of " + effect.name + "!";
						}
						break;
					}
				} else {
					console.log(poke.getName() + " lost " + damage + "% of its health!");
				}
				break;
			case '-heal':
				var poke = this.getPokemon(args[1]);
				var damage = parseFloat(args[2]);
				if (isNaN(damage)) damage = 50;
				poke.hp += poke.maxhp * damage / 100;
				if (poke.hp > poke.maxhp) {
					poke.hp = poke.maxhp;
				}
				poke.healthParse(args[2]);
				
				if (kwargs.silent) {
					// do nothing
				} else if (kwargs.from) {
					var effect = Tools.getEffect(kwargs.from);
					var ofpoke = this.getPokemon(kwargs.of);
					switch (effect.id) {
					case 'ingrain':
						actions += "" + poke.getName() + " absorbed nutrients with its roots!";
						break;
					case 'aquaring':
						actions += "Aqua Ring restored " + poke.getLowerName() + "'s HP!";
						break;
					case 'raindish': case 'dryskin': case 'icebody':
						actions += "" + poke.getName() + "'s " + effect.name + " heals it!";
						break;
					case 'healingwish':
						actions += "The healing wish came true for "+poke.getLowerName()+"!";
						self.lastmove = 'healing-wish';
						poke.side.wisher = null;
						break;
					case 'lunardance':
						actions += ""+poke.getName()+" became cloaked in mystical moonlight!";
						self.lastmove = 'healing-wish';
						poke.side.wisher = null;
						break;
					case 'wish':
						actions += "" + kwargs.wisher + "'s wish came true!";
						break;
					case 'drain':
						actions += ofpoke.getName() + ' had its energy drained!';
						break;
					default:
						if (kwargs.absorb) {
							actions += "" + poke.getName() + "'s " + effect.name + " absorbs the attack!";
						} else if (effect.id) {
							actions += "" + poke.getName() + " restored HP using its " + effect.name + "!";
						} else {
							actions += poke.getName() + ' regained health!';
						}
						break;
					}
				} else {
					actions += poke.getName() + ' regained health!';
				}
				break;
			case '-sethp':
				var effect = Tools.getEffect(kwargs.from);
				var poke, ofpoke;
				for (var k=0; k<2; k++)
				{
					var cpoke = self.getPokemon(args[1+2*k]);
					if (cpoke) {
						var oldhp = cpoke.hp;
						cpoke.healthParse(args[2+2*k]);
						var diff = parseFloat(args[2+2*k]);
						if (isNaN(diff)) {
							diff = cpoke.hp - oldhp;
						}
					}
					if (k==0) poke = cpoke;
					if (k==1) ofpoke = cpoke;
				}
				switch (effect.id) {
				case 'painsplit':
					actions += 'The battlers shared their pain!';
					break;
				}
				
				break;
				
			case '-boost':
				var poke = this.getPokemon(args[1]);
				var stat = args[2];
				var amount = parseInt(args[3]);
				if (!poke.boosts[stat]) {
					poke.boosts[stat] = 0;
				}
				poke.boosts[stat] += amount;
				
				var amountString = '';
				if (amount === 2) amountString = ' sharply';
				if (amount >= 3) amountString = ' drastically';
				if (kwargs.silent) {
					// do nothing
				} else if (kwargs.from) {
					var effect = Tools.getEffect(kwargs.from);
					var ofpoke = this.getPokemon(kwargs.of);
					switch (effect.id) {
					default:
						if (effect.effectType === 'Item') {
							actions += "The " + effect.name + amountString+" raised " + poke.getLowerName() + "'s " + BattleStats[stat] + "!";
						} else {
							actions += "" + poke.getName() + "'s " + effect.name +amountString+" raised its " + BattleStats[stat] + "!";
						}
						break;
					}
				} else {
					actions += "" + poke.getName() + "'s " + BattleStats[stat] + amountString + " rose" + "!";
				}
				break;
			case '-unboost':
				var poke = this.getPokemon(args[1]);
				var stat = args[2];
				var amount = parseInt(args[3]);
				if (!poke.boosts[stat]) {
					poke.boosts[stat] = 0;
				}
				poke.boosts[stat] -= amount;
				
				var amountString = '';
				if (amount === 2) amountString = ' harshly';
				if (amount >= 3) amountString = ' severely';
				if (kwargs.silent) {
					// do nothing
				} else if (kwargs.from) {
					var effect = Tools.getEffect(kwargs.from);
					var ofpoke = this.getPokemon(kwargs.of);
					switch (effect.id) {
					default:
						if (effect.effectType === 'Item') {
							actions += "The " + effect.name + amountString+" lowered " + poke.getLowerName() + "'s " + BattleStats[stat] + "!";
						} else {
							actions += "" + poke.getName() + "'s " + effect.name +amountString+" lowered its " + BattleStats[stat] + "!";
						}
						break;
					}
				} else {
					actions += "" + poke.getName() + "'s " + BattleStats[stat] + amountString + " fell!";
				}
				break;
			case '-setboost':
				var poke = this.getPokemon(args[1]);
				var stat = args[2];
				var amount = parseInt(args[3]);
				var effect = Tools.getEffect(kwargs.from);
				var ofpoke = this.getPokemon(kwargs.of);
				poke.boosts[stat] = amount;
				
				if (kwargs.silent) {
					// do nothing
				} else if (kwargs.from) {
					switch (effect.id) {
					case 'bellydrum':
						actions += '' + poke.getName() + ' cut its own HP and maximized its Attack!';
						break;
					case 'angerpoint':
						actions += '' + poke.getName() + ' maxed its Attack!';
						break;
					}
				}
				break;
			case '-swapboost':
				var poke = this.getPokemon(args[1]);
				var poke2 = this.getPokemon(args[2]);
				var stats = args[3]?args[3].split(', '):['atk','def','spa','spd','spe','accuracy','evasion'];
				var effect = Tools.getEffect(kwargs.from);
				for (var i=0; i<stats.length; i++)
				{
					var tmp = poke.boosts[stats[i]];
					poke.boosts[stats[i]] = poke2.boosts[stats[i]];
					if (!poke.boosts[stats[i]]) delete poke.boosts[stats[i]];
					poke2.boosts[stats[i]] = tmp;
					if (!poke2.boosts[stats[i]]) delete poke2.boosts[stats[i]];
				}
				
				if (kwargs.silent) {
					// do nothing
				} else if (effect.id) {
					switch (effect.id) {
					case 'guardswap':
						actions += '' + poke.getName() + ' switched all changes to its Defense and Sp. Def with the target!';
						break;
					case 'heartswap':
						actions += '' + poke.getName() + ' switched stat changes with the target!';
						break;
					case 'powerswap':
						actions += '' + poke.getName() + ' switched all changes to its Attack and Sp. Atk with the target!';
						break;
					}
				}
				break;
			case '-restoreboost':
				var poke = this.getPokemon(args[1]);
				for (i in poke.boosts) {
					if (poke.boosts[i] < 0) delete poke.boosts[i];
				}
				
				if (kwargs.silent) {
					// do nothing
				}
				break;
			case '-copyboost':
				var poke = this.getPokemon(args[1]);
				var frompoke = this.getPokemon(args[2]);
				var stats = args[3]?args[3].split(', '):['atk','def','spa','spd','spe','accuracy','evasion'];
				var effect = Tools.getEffect(kwargs.from);
				for (var i=0; i<stats.length; i++)
				{
					poke.boosts[stats[i]] = frompoke.boosts[stats[i]];
					if (!poke.boosts[stats[i]]) delete poke.boosts[stats[i]];
				}
				//poke.boosts = $.extend({}, frompoke.boosts);
				
				if (kwargs.silent) {
					// do nothing
				} else {
					actions += "" + poke.getName() + " copied " + frompoke.getLowerName() + "'s stat changes!";
				}
				break;
			case '-clearboost':
				var poke = this.getPokemon(args[1]);
				poke.boosts = {};
				
				if (kwargs.silent) {
					// do nothing
				} else {
					actions += '' + poke.getName() + '\'s stat changes were removed!';
				}
				break;
			case '-clearallboost':
				for (var slot=0; slot<self.mySide.active.length; slot++) {
					if (self.mySide.active[slot]) {
						self.mySide.active[slot].boosts = {};
					}
					if (self.yourSide.active[slot]) {
						self.yourSide.active[slot].boosts = {};
					}
				}

				if (kwargs.silent) {
					// do nothing
				} else {
					actions += 'All stat changes were eliminated!';
				}
				break;
				
			case '-crit':
				var poke = this.getPokemon(args[1]);
				for (var j=1; !poke && j<10; j++) poke = this.getPokemon(minors[i+j][0][1]);
				actions += "A critical hit! ";
				break;
				
			case '-supereffective':
				var poke = this.getPokemon(args[1]);
				for (var j=1; !poke && j<10; j++) poke = this.getPokemon(minors[i+j][0][1]);
				actions += "It's super effective! ";
				break;
				
			case '-resisted':
				var poke = this.getPokemon(args[1]);
				for (var j=1; !poke && j<10; j++) poke = this.getPokemon(minors[i+j][0][1]);
				actions += "It's not very effective... ";
				break;
				
			case '-immune':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(args[2]);
				switch (effect.id) {
				case 'confusion':
					actions += "" + poke.getName() + " doesn't become confused! ";
					break;
				default:
					if (kwargs.msg) {
						actions += "It doesn't affect " + poke.getLowerName() + "... ";
					} else {
						actions += "It had no effect! ";
					}
					break;
				}
				break;
				
			case '-miss':
				var user = this.getPokemon(args[1]);
				var target = this.getPokemon(args[2]);
				if (target) {
					actions += "" + target.getName() + " avoided the attack!";
				} else {
					actions += "" + user.getName() + "'s attack missed!";
				}
				break;
				
			case '-fail':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(args[2]);
				var fromeffect = Tools.getEffect(kwargs.from);
				switch (effect.id) {
				case 'brn':
					actions += "" + poke.getName() + " is already burned.";
					break;
				case 'tox':
				case 'psn':
					actions += "" + poke.getName() + " is already poisoned.";
					break;
				case 'slp':
					if (fromeffect.id === 'uproar') {
						if (kwargs.msg) {
							actions += "But " + poke.getLowerName() + " can't sleep in an uproar!";
						} else {
							actions += "But the uproar kept " + poke.getLowerName() + " awake!";
						}
					} else {
						actions += "" + poke.getName() + " is already asleep.";
					}
					break;
				case 'par':
					actions += "" + poke.getName() + " is already paralyzed.";
					break;
				case 'frz':
					actions += "" + poke.getName() + " is already frozen.";
					break;
				case 'substitute':
					if (kwargs.weak) {
						actions += "It was too weak to make a substitute!";
					} else {
						actions += '' + poke.getName() + ' already has a substitute!';
					}
					break;
				case '':
				default:
					actions += "But it failed!";
					break;
				}
				break;
				
			case '-notarget':
				actions += "But there was no target...";
				break;
				
			case '-ohko':
				actions += "It's a one-hit KO!";
				break;
				
			case '-hitcount':
				var hits = parseInt(args[2]);
				actions += 'Hit ' + hits + ' time(s)!';
				break;
				
			case '-nothing':
				actions += "But nothing happened! ";
				break;
				
			case '-waiting':
				var poke = this.getPokemon(args[1]);
				var ofpoke = this.getPokemon(args[2]);
				actions += "" + poke.getName() + " is waiting for " + ofpoke.getLowerName() + "'s move...";
				break;
				
			case '-combine':
				actions += "The two moves are joined! It's a combined move!";
				break;
				
			case '-prepare':
				var poke = this.getPokemon(args[1]);
				var move = Tools.getMove(args[2]);
				var target = this.getPokemon(args[3]);
				self.prepareMove(poke, move, target);
				break;
				
			case '-status':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(kwargs.from);
				poke.status = args[2];
				poke.removeVolatile('yawn');
				
				switch (args[2]) {
				case 'brn':
					actions += "" + poke.getName() + " was burned!";
					break;
				case 'tox':
					actions += "" + poke.getName() + " was badly poisoned!";
					break;
				case 'psn':
					actions += "" + poke.getName() + " was poisoned!";
					break;
				case 'slp':
					if (effect.id === 'rest') {
						actions += '' + poke.getName() + ' slept and became healthy!';
					} else {
						actions += "" + poke.getName() + " fell asleep!";
					}
					break;
				case 'par':
					actions += "" + poke.getName() + " is paralyzed! It may be unable to move!";
					break;
				case 'frz':
					actions += "" + poke.getName() + " was frozen solid!";
					break;
				}
				break;
				
			case '-curestatus':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(kwargs.from);
				var ofpoke = this.getPokemon(kwargs.of);
				poke.status = '';
				
				if (effect.id) switch (effect.id) {
				case 'psychoshift':
					actions += '' + poke.getName() + ' moved its status onto ' + ofpoke.getLowerName() + '!';
					break;
				default:
					actions += "" + poke.getName() + "'s "+effect.name+" heals its status!";
					break;
				} else switch (args[2]) {
				case 'brn':
					if (poke.side.n === 0) actions += "" + poke.getName() + "'s burn was healed.";
					else actions += "" + poke.getName() + " healed its burn!";
					break;
				case 'tox':
				case 'psn':
					var n = poke.side.n; // hack for eliminating "the foe's"
					poke.side.n = 0;
					actions += "" + poke.getName() + " was cured of its poisoning.";
					poke.side.n = n;
					break;
				case 'slp':
					actions += "" + poke.getName() + " woke up!";
					break;
				case 'par':
					actions += "" + poke.getName() + " was cured of paralysis.";
					break;
				case 'frz':
					actions += "" + poke.getName() + " thawed out!";
					break;
				default:
					poke.removeVolatile('confusion');
					actions += "" + poke.getName() + "'s status cleared!";
				}
				break;
				
			case '-cureteam':
				var poke = this.getPokemon(args[1]);
				for (var k = 0; k < poke.side.pokemon.length; k++) {
					poke.side.pokemon[k].status = '';
				}
				
				var effect = Tools.getEffect(kwargs.from);
				switch (effect.id) {
				case 'aromatherapy':
					actions += 'A soothing aroma wafted through the area!';
					break;
				case 'healbell':
					actions += 'A bell chimed!';
					break;
				default:
					actions += "" + poke.getName() + "'s team was cured!";
					break;
				}
				break;
				
			case '-item':
				var poke = this.getPokemon(args[1]);
				var item = Tools.getItem(args[2]);
				var effect = Tools.getEffect(kwargs.from);
				var ofpoke = this.getPokemon(kwargs.of);
				poke.item = item.name;
				poke.removeVolatile('airballoon');
				if (item.id === 'airballoon') poke.addVolatile('airballoon');
				
				if (effect.id) switch (effect.id) {
				case 'recycle':
				case 'pickup':
					actions += '' + poke.getName() + ' found one ' + item.name + '!';
					break;
				case 'frisk':
					actions += "" + ofpoke.getName() + " frisked its target and found one " + item.name + "!";
					break;
				case 'thief':
				case 'covet':
					actions += '' + poke.getName() + ' stole ' + ofpoke.getLowerName() + "'s " + item.name + "!";
					break;
				case 'harvest':
					actions += '' + poke.getName() + ' harvested one ' + item.name + '!';
					break;
				case 'bestow':
					actions += '' + poke.getName() + ' received ' + item.name + ' from ' + ofpoke.getLowerName() + '!';
					break;
				default:
					actions += '' + poke.getName() + ' obtained one ' + item.name + '.';
					break;
				} else switch (item.id) {
				case 'airballoon':
					actions += "" + poke.getName() + " floats in the air with its Air Balloon!";
					break;
				default:
					actions += "" + poke.getName() + " has " + item.name + "!";
					break;
				}
				break;
				
			case '-enditem':
				var poke = this.getPokemon(args[1]);
				var item = Tools.getItem(args[2]);
				var effect = Tools.getEffect(kwargs.from);
				var ofpoke = this.getPokemon(kwargs.of);
				poke.item = '';
				poke.removeVolatile('airballoon');
				
				if (kwargs.silent) {
					// do nothing
				} else if (kwargs.eat) {
					actions += '' + poke.getName() + ' ate its ' + item.name + '!';
					self.lastmove = item.id;
				} else if (kwargs.weaken) {
					actions += 'The ' + item.name + ' weakened the damage to '+poke.getLowerName();
					self.lastmove = item.id;
				} else if (effect.id) switch (effect.id) {
				case 'fling':
					actions += "" + poke.getName() + ' flung its ' + item.name + '!';
					break;
				case 'knockoff':
					actions += '' + ofpoke.getName() + ' knocked off ' + poke.getLowerName() + '\'s ' + item.name + '!';
					break;
				case 'stealeat':
					actions += '' + ofpoke.getName() + ' stole and ate its target\'s ' + item.name + '!';
					break;
				case 'gem':
					actions += 'The ' + item.name + ' strengthened ' + Tools.getMove(kwargs.move).name + '\'s power!';
					break;
				case 'incinerate':
					actions += "" + poke.getName() + "'s " + item.name + " was burnt up!";
					break;
				default:
					actions += "" + poke.getName() + ' lost its ' + item.name + '!';
					break;
				} else switch (item.id) {
				case 'airballoon':
					poke.removeVolatile('airballoon');
					actions += "" + poke.getName() + "'s Air Balloon popped!";
					break;
				case 'focussash':
					actions += "" + poke.getName() + ' hung on using its Focus Sash!';
					break;
				case 'focusband':
					actions += "" + poke.getName() + ' hung on using its Focus Band!';
					break;
				case 'mentalherb':
					poke.removeVolatile('taunt');
					poke.removeVolatile('encore');
					poke.removeVolatile('torment');
					actions += "" + poke.getName() + " used its " + item.name + " to come back to its senses!";
					break;
				case 'whiteherb':
					actions += "" + poke.getName() + " restored its status using its White Herb!";
					break;
				case 'ejectbutton':
					actions += "" + poke.getName() + " is switched out with the Eject Button!";
					break;
				case 'redcard':
					actions += "" + poke.getName() + " held up its Red Card against " + ofpoke.getLowerName() + "!";
					break;
				default:
					actions += "" + poke.getName() + "'s " + item.name + " activated!";
					break;
				}
				break;
				
			case '-ability':
				var poke = this.getPokemon(args[1]);
				var ability = Tools.getAbility(args[2]);
				var effect = Tools.getEffect(kwargs.from);
				var ofpoke = this.getPokemon(kwargs.of);
				poke.ability = ability.name;
				
				if (kwargs.silent) {
					// do nothing
				} else if (effect.id) switch (effect.id) {
				case 'trace':
					actions += '' + poke.getName() + ' traced ' + ofpoke.getLowerName() + '\'s ' + ability.name + '!';
					break;
				case 'roleplay':
					actions += '' + poke.getName() + ' copied ' + ofpoke.getLowerName() + '\'s ' + ability.name + '!';
					break;
				case 'mummy':
					actions += "" + poke.getName() + "'s Ability became Mummy!";
					break;
				default:
					actions += "" + poke.getName() + " acquired " + ability.name + "!";
					break;
				} else switch (ability.id) {
				case 'pressure':
					actions += "" + poke.getName() + " is exerting its pressure!";
					break;
				case 'moldbreaker':
					actions += "" + poke.getName() + " breaks the mold!";
					break;
				case 'turboblaze':
					actions += "" + poke.getName() + " is radiating a blazing aura!";
					break;
				case 'teravolt':
					actions += "" + poke.getName() + " is radiating a bursting aura!";
					break;
				case 'intimidate':
					actions += '' + poke.getName() + ' intimidates ' + ofpoke.getLowerName() + '!';
					break;
				case 'unnerve':
					actions += "" + poke.getName() + "'s Unnerve makes " + args[3] + "'s team too nervous to eat Berries!";
					break;
				default:
					actions += "" + poke.getName() + " has " + ability.name + "!";
					break;
				}
				break;
				
			case '-endability':
				var poke = this.getPokemon(args[1]);
				var ability = Tools.getAbility(args[2]);
				var effect = Tools.getEffect(kwargs.from);
				poke.ability = '';
				
				if (kwargs.silent) {
					// do nothing
				} else switch (effect.id) {
				default:
					actions += "" + poke.getName() + "\'s Ability was suppressed!";
					break;
				}
				break;
			
			case '-transform':
				var poke = this.getPokemon(args[1]);
				var tpoke = this.getPokemon(args[2]);
				actions += '' + poke.getName() + ' transformed into ' + tpoke.species + '!';
				poke.boosts = $.extend({}, tpoke.boosts);
				poke.addVolatile('transform');
				poke.addVolatile('formechange'); // the formechange volatile reminds us to revert the sprite change on switch-out
				//poke.removeVolatile('typechange'); // does this happen??
				poke.ability = tpoke.ability;
				poke.volatiles.formechange[2] = (tpoke.volatiles.formechange ? tpoke.volatiles.formechange[2] : tpoke.species);
				break;
			case '-formechange':
				var poke = this.getPokemon(args[1]);
				var template = Tools.getTemplate(args[2]);
				poke.addVolatile('formechange'); // the formechange volatile reminds us to revert the sprite change on switch-out
				poke.volatiles.formechange[2] = template.species;
				poke.side.updateStatbar();
				break;
			
			case '-start':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(args[2]);
				var ofpoke = this.getPokemon(kwargs.of);
				var fromeffect = Tools.getEffect(kwargs.from);
				poke.addVolatile(effect.id);
				
				switch (effect.id) {
				case 'typechange':
					poke.volatiles.typechange[2] = args[3];
					if (fromeffect.id) {
						if (fromeffect.id === 'reflecttype') {
							actions += "" + poke.getName() + "'s type changed to match " + ofpoke.getLowerName() + "'s!";
						} else {
							actions += "" + poke.getName() + "'s " + fromeffect.name + " made it the " + args[3] + " type!";
						}
					} else {
						actions += "" + poke.getName() + " transformed into the " + args[3] + " type!";
					}
					break;
				case 'powertrick':
					actions += "" + poke.getName() + " switched its Attack and Defense!";
					break;
				case 'foresight':
				case 'miracleeye':
					actions += "" + poke.getName() + " was identified!";
					break;
				case 'telekinesis':
					actions += "" + poke.getName() + " was hurled into the air!";
					break;
				case 'confusion':
					if (kwargs.already) {
						actions += "" + poke.getName() + " is already confused!";
					} else {
						actions += "" + poke.getName() + " became confused!";
					}
					break;
				case 'leechseed':
					poke.side.updateStatbar(poke);
					actions += '' + poke.getName() + ' was seeded!';
					break;
				case 'healblock':
					actions += "" + poke.getName() + " was prevented from healing!";
					break;
				case 'mudsport':
					actions += "Electricity's power was weakened!";
					break;
				case 'watersport':
					actions += "Fire's power was weakened!";
					break;
				case 'yawn':
					actions += "" + poke.getName() + ' grew drowsy!';
					break;
				case 'smackdown':
					actions += "" + poke.getName() + ' fell straight down!';
					break;
				case 'flashfire':
					actions += 'The power of ' + poke.getLowerName() + '\'s Fire-type moves rose!';
					break;
				case 'taunt':
					actions += '' + poke.getName() + ' fell for the taunt!';
					break;
				case 'imprison':
					actions += "" + poke.getName() + " sealed the opponent's move(s)!";
					break;
				case 'disable':
					actions += "" + poke.getName() + "'s " + args[3] + " was disabled!";
					break;
				case 'embargo':
					actions += "" + poke.getName() + " can't use items anymore!";
					break;
				case 'torment':
					actions += '' + poke.getName() + ' was subjected to torment!';
					break;
				case 'ingrain':
					actions += '' + poke.getName() + ' planted its roots!';
					break;
				case 'aquaring':
					actions += '' + poke.getName() + ' surrounded itself with a veil of water!';
					break;
				case 'stockpile1':
					actions += '' + poke.getName() + ' stockpiled 1!';
					break;
				case 'stockpile2':
					poke.removeVolatile('stockpile1');
					actions += '' + poke.getName() + ' stockpiled 2!';
					break;
				case 'stockpile3':
					poke.removeVolatile('stockpile2');
					actions += '' + poke.getName() + ' stockpiled 3!';
					break;
				case 'perish0':
					poke.removeVolatile('perish1');
					actions += '' + poke.getName() + "'s perish count fell to 0.";
					break;
				case 'perish1':
					poke.removeVolatile('perish2');
					actions += '' + poke.getName() + "'s perish count fell to 1.";
					break;
				case 'perish2':
					poke.removeVolatile('perish3');
					actions += '' + poke.getName() + "'s perish count fell to 2.";
					break;
				case 'perish3':
					actions += '' + poke.getName() + "'s perish count fell to 3.";
					break;
				case 'encore':
					actions += '' + poke.getName() + ' received an encore!';
					break;
				case 'bide':
					actions += "" + poke.getName() + " is storing energy!";
					break;
				case 'slowstart':
					actions += "" + poke.getName() + " can't get it going because of its Slow Start!";
					break;
				case 'attract':
					if (fromeffect.id) {
						actions += "" + poke.getName() + " fell in love from the " + fromeffect.name + "!";
					} else {
						actions += "" + poke.getName() + " fell in love!";
					}
					break;
				case 'autotomize':
					actions += "" + poke.getName() + " became nimble!";
					break;
				case 'focusenergy':
					actions += "" + poke.getName() + " is getting pumped!";
					break;
				case 'curse':
					actions += "" + ofpoke.getName() + " cut its own HP and laid a curse on " + poke.getLowerName() + "!";
					break;
				case 'nightmare':
					actions += "" + poke.getName() + " began having a nightmare!";
					break;
				case 'magnetrise':
					actions += "" + poke.getName() + " levitated with electromagnetism!";
					break;
				case 'smackdown':
					actions += "" + poke.getName() + " fell straight down!";
					break;
				case 'substitute':
					if (kwargs.damage) {
						actions += "The substitute took damage for "+poke.getLowerName()+"!";
					} else if (kwargs.block) {
						actions += 'But it failed!';
					} else if (kwargs.already) {
						actions += '' + poke.getName() + ' already has a substitute!';
					} else {
						actions += '' + poke.getName() + ' put in a substitute!';
					}
					break;
				case 'uproar':
					if (kwargs.upkeep) {
						actions += "" + poke.getName() + " is making an uproar!";
					} else {
						actions += "" + poke.getName() + " caused an uproar!";
					}
					break;
				case 'doomdesire':
					actions += '' + poke.getName() + ' chose Doom Desire as its destiny!';
					break;
				case 'futuresight':
					actions += '' + poke.getName() + ' foresaw an attack!';
					break;
				case 'mimic':
					actions += '' + poke.getName() + ' learned ' + args[3] + '!';
					break;
				default:
					actions += "" + poke.getName() + "'s " + effect.name + " started!";
				}
				break;
			case '-end':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(args[2]);
				var fromeffect = Tools.getEffect(kwargs.from);
				poke.removeVolatile(effect.id);
				switch (effect.id) {
				case 'powertrick':
					actions += "" + poke.getName() + " switched its Attack and Defense!";
					break;
				case 'telekinesis':
					actions += "" + poke.getName() + " was freed from the telekinesis!";
					break;
				case 'confusion':
					if (!kwargs.silent) {
						if (poke.side.n === 0) actions += "" + poke.getName() + " snapped out of its confusion.";
						else actions += "" + poke.getName() + " snapped out of confusion!";
					}
					break;
				case 'leechseed':
					if (fromeffect.id === 'rapidspin') {
						actions += "" + poke.getName() + " was freed from Leech Seed!";
					}
					break;
				case 'healblock':
					actions += "" + poke.getName() + "'s Heal Block wore off!";
					break;
				case 'taunt':
					actions += '' + poke.getName() + "'s taunt wore off!";
					break;
				case 'disable':
					actions += '' + poke.getName() + " is no longer disabled!";
					break;
				case 'embargo':
					actions += "" + poke.getName() + " can use items again!";
					break;
				case 'torment':
					actions += '' + poke.getName() + "'s torment wore off!";
					break;
				case 'encore':
					actions += '' + poke.getName() + "'s encore ended!";
					break;
				case 'bide':
					actions += "" + poke.getName() + " unleashed energy!";
					break;
				case 'magnetrise':
					if (poke.side.n === 0) actions += "" + poke.getName() + "'s electromagnetism wore off!";
					else actions += "The electromagnetism of "+poke.getLowerName()+" wore off!";
					break;
				case 'perishsong':
					poke.removeVolatile('perish3');
					break;
				case 'substitute':
					actions += '' + poke.getName() + "'s substitute faded!";
					break;
				case 'uproar':
					actions += "" + poke.getName() + " calmed down.";
					break;
				default:
					if (effect.effectType === 'Move') {
						actions += '' + poke.getName() + " took the " + effect.name + " attack!";
					} else {
						actions += "" + poke.getName() + "'s " + effect.name + " ended!";
					}
				}
				break;
			case '-singleturn':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(args[2]);
				var ofpoke = this.getPokemon(kwargs.of);
				var fromeffect = Tools.getEffect(kwargs.from);
				poke.addTurnstatus(effect.id);
				
				switch (effect.id) {
				case 'roost':
					//actions += '' + poke.getName() + ' landed on the ground!';
					break;
				case 'quickguard':
					actions += "Quick Guard protected " + poke.side.getLowerTeamName() + "!";
					break;
				case 'wideguard':
					actions += "Wide Guard protected " + poke.side.getLowerTeamName() + "!";
					break;
				case 'protect':
					actions += '' + poke.getName() + ' protected itself!';
					break;
				case 'endure':
					actions += '' + poke.getName() + ' braced itself!';
					break;
				case 'helpinghand':
					actions += '' + ofpoke.getName() + " is ready to help " + poke.getLowerName() + "!";
					break;
				case 'focuspunch':
					actions += '' + poke.getName() + ' is tightening its focus!';
					break;
				case 'snatch':
					actions += '' + poke.getName() + ' waits for a target to make a move!';
					break;
				case 'magiccoat':
					actions += '' + poke.getName() + ' shrouded itself with Magic Coat!';
					break;
				}
				break;
			case '-singlemove':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(args[2]);
				var ofpoke = this.getPokemon(kwargs.of);
				var fromeffect = Tools.getEffect(kwargs.from);
				poke.addMovestatus(effect.id);
				
				switch (effect.id) {
				case 'grudge':
					actions += '' + poke.getName() + ' wants its target to bear a grudge!';
					break;
				case 'destinybond':
					actions += '' + poke.getName() + ' is trying to take its foe down with it!';
					break;
				}
				break;
				
			case '-activate':
				var poke = this.getPokemon(args[1]);
				var effect = Tools.getEffect(args[2]);
				var ofpoke = this.getPokemon(kwargs.of);
				switch (effect.id) {
				case 'calm':
					actions += '' + poke.getName() + ' calmed down.';
					break;
				case 'confusion':
					actions += "" + poke.getName() + " is confused!";
					break;
				case 'destinybond':
					actions += '' + poke.getName() + ' took its attacker down with it!';
					break;
				case 'snatch':
					actions += "" + poke.getName() + " snatched " + ofpoke.getLowerName() + "'s move!";
					break;
				case 'grudge':
					actions += "" + poke.getName() + "'s " + args[3] + " lost all its PP due to the grudge!";
					break;
				case 'quickguard':
					poke.addTurnstatus('quickguard');
					actions += "Quick Guard protected " + poke.getLowerName() + "!";
					break;
				case 'wideguard':
					poke.addTurnstatus('wideguard');
					
					actions += "Wide Guard protected " + poke.getLowerName() + "!";
					break;
				case 'protect':
					poke.addTurnstatus('protect');
					
					actions += '' + poke.getName() + ' protected itself!';
					break;
				case 'substitute':
					if (kwargs.damage) {
						
						actions += 'The substitute took damage for ' + poke.getLowerName() + '!';
					} else if (kwargs.block) {
					actions += '' + poke.getName() + "'s Substitute blocked " + Tools.getMove(kwargs.block || args[3]).name + '!';
					}
					break;
				case 'skillswap':
					actions += '' + poke.getName() + ' swapped Abilities with its target!';
					break;
				case 'attract':
					actions += '' + poke.getName() + ' is in love with ' + ofpoke.getLowerName() + '!';
					break;
				case 'bide':
					actions += "" + poke.getName() + " is storing energy!";
					break;
				case 'mist':
					actions += "" + poke.getName() + " is protected by the mist!";
					break;
				
				// move activations
				case 'trick':
				case 'switcheroo':
					actions += '' + poke.getName() + ' switched items with its target!';
					break;
				case 'brickbreak':
					actions += poke.getName() + " shattered " + ofpoke.getTeamName() + " protections!";
					ofpoke.removeSideCondition('Reflect');
					ofpoke.removeSideCondition('LightScreen');
					break;
				case 'pursuit':
					actions += "" + poke.getName() + " is being sent back!";
					break;
				case 'feint':
					actions += "" + poke.getName() + " fell for the feint!";
					break;
				case 'spite':
					actions += "It reduced the PP of " + poke.getLowerName() + "'s " + Tools.getMove(args[3]).name + " by " + args[4] + "!";
					break;
				case 'gravity':
					actions += "" + poke.getName() + " couldn't stay airborne because of gravity!";
					break;
				case 'magnitude':
					actions += "Magnitude " + args[3] + "!";
					break;
				case 'sketch':
					actions += "" + poke.getName() + " sketched " + args[3] + "!";
					break;
				case 'skillswap':
					actions += "" + poke.getName() + " swapped Abilities with its target!";
					break;
				case 'charge':
					actions += "" + poke.getName() + " began charging power!";
					break;
				case 'struggle':
					actions += "" + poke.getName() + " has no moves left!";
					break;
				case 'bind':
					actions += '' + poke.getName() + ' was squeezed by ' + ofpoke.getLowerName() + '!';
					break;
				case 'wrap':
					actions += '' + poke.getName() + ' was wrapped by ' + ofpoke.getLowerName() + '!';
					break;
				case 'clamp':
					actions += '' + ofpoke.getName() + ' clamped ' + poke.getLowerName() + '!';
					break;
				case 'whirlpool':
					actions += '' + poke.getName() + ' became trapped in the vortex!';
					break;
				case 'firespin':
					actions += '' + poke.getName() + ' became trapped in the fiery vortex!';
					break;
				case 'magmastorm':
					actions += '' + poke.getName() + ' became trapped by swirling magma!';
					break;
				case 'sandtomb':
					actions += '' + poke.getName() + ' became trapped by Sand Tomb!';
					break;
				case 'afteryou':
					actions += '' + poke.getName() + ' took the kind offer!';
					break;
				case 'quash':
					actions += "" + poke.getName() + "'s move was postponed!";
					break;
				case 'powersplit':
					actions += '' + poke.getName() + ' shared its power with the target!';
					break;
				case 'guardsplit':
					actions += '' + poke.getName() + ' shared its guard with the target!';
					break;
				case 'ingrain':
					actions += '' + poke.getName() + ' anchored itself with its roots!';
					break;

				// ability activations
				case 'sturdy':
					actions += '' + poke.getName() + ' held on thanks to Sturdy!';
					break;
				case 'magicbounce':
				case 'magiccoat':
				case 'rebound':
					if (effect.id === 'magiccoat') {
						poke.addTurnstatus('magiccoat');
					}
					actions += "" + ofpoke.getName() + "'s " + args[3] + " was bounced back by " + effect.name + "!";
					break;
				case 'wonderguard':
					actions += '' + poke.getName() + '\'s Wonder Guard evades the attack!';
					break;
				case 'speedboost':
					actions += "" + poke.getName() + "'s' Speed Boost increases its speed!";
					break;
				case 'forewarn':
					actions += "" + poke.getName() + "'s Forewarn alerted it to " + args[3] + "!";
					break;
				case 'anticipation':
					actions += "" + poke.getName() + " shuddered!";
					break;
				case 'telepathy':
					actions += "" + poke.getName() + " avoids attacks by its ally Pok&#xE9;mon!";
					break;
				case 'suctioncups':
					actions += '' + poke.getName() + ' anchors itself!';
					break;
				
				// item activations
				case 'custapberry':
				case 'quickclaw':
					//actions += ''+poke.getName()+' is already preparing its next move!';
					actions += '' + poke.getName() + '\'s ' + effect.name + ' let it move first!';
					break;
				case 'leppaberry':
					actions += '' + poke.getName() + " restored " + args[3] + "'s PP using its Leppa Berry!";
					break;
				default:
					actions += "" + poke.getName() + "'s " + effect.name + " activated!";
				}
				break;
				
			case '-sidestart':
				var side = this.getSide(args[1]);
				var effect = Tools.getEffect(args[2]);
				side.addSideCondition(effect.name);
				
				switch (effect.id) {
				case 'stealthrock':
					actions += "Pointed stones float in the air around " + side.getLowerTeamName() + "!";
					break;
				case 'spikes':
					actions += "Spikes were scattered all around the feet of " + side.getLowerTeamName() + "!";
					break;
				case 'toxicspikes':
					actions += "Poison spikes were scattered all around the feet of " + side.getLowerTeamName() + "!";
					break;
				case 'tailwind':
					actions += "The tailwind blew from behind " + side.getLowerTeamName() + "!";
					break;
				case 'reflect':
					actions += "Reflect raised " + side.getLowerTeamName() + "'s Defense!";
					break;
				case 'lightscreen':
					actions += "Light Screen raised " + side.getLowerTeamName() + "'s Special Defense!";
					break;
				case 'safeguard':
					actions += "" + side.getTeamName() + " became cloaked in a mystical veil!";
					break;
				case 'mist':
					actions += "" + side.getTeamName() + " became shrouded in mist!";
					break;
				case 'luckychant':
					actions += 'The Lucky Chant shielded ' + side.getLowerTeamName() + ' from critical hits!';
					break;
				case 'firepledge':
					actions += "A rainbow appeared in the sky on " + side.getLowerTeamName() + "'s side!";
					break;
				case 'waterpledge':
					actions += "A swamp enveloped " + side.getLowerTeamName() + "!";
					break;
				case 'grasspledge':
					actions += "A sea of fire enveloped " + side.getLowerTeamName() + "!";
					break;
				default:
					actions += "" + effect.name + " started!";
					break;
				}
				break;
			case '-sideend':
				var side = this.getSide(args[1]);
				var effect = Tools.getEffect(args[2]);
				var from = Tools.getEffect(kwargs.from);
				var ofpoke = this.getPokemon(kwargs.of);
				side.removeSideCondition(effect.name);
				
				switch (effect.id) {
				case 'stealthrock':
					actions += "The pointed stones disappeared from around " + side.getLowerTeamName() + "!";
					break;
				case 'spikes':
					actions += "The spikes disappeared from around " + side.getLowerTeamName() + "'s feet!";
					break;
				case 'toxicspikes':
					actions += "The poison spikes disappeared from around " + side.getLowerTeamName() + "'s feet!";
					break;
				case 'tailwind':
					actions += "" + side.getTeamName() + "'s tailwind petered out!";
					break;
				case 'reflect':
					actions += "" + side.getTeamName() + "'s Reflect wore off!";
					break;
				case 'lightscreen':
					actions += "" + side.getTeamName() + "'s Light Screen wore off!";
					break;
				case 'safeguard':
					actions += "" + side.getTeamName() + " is no longer protected by Safeguard!";
					break;
				case 'mist':
					actions += "" + side.getTeamName() + " is no longer protected by mist!";
					break;
				case 'luckychant':
					actions += "" + side.getTeamName() + "'s Lucky Chant wore off!";
					break;
				case 'firepledge':
					actions += "The rainbow on " + side.getLowerTeamName() + "'s side disappeared!";
					break;
				case 'waterpledge':
					actions += "The swamp around " + side.getLowerTeamName() + " disappeared!";
					break;
				case 'grasspledge':
					actions += "The sea of fire around " + side.getLowerTeamName() + " disappeared!";
					break;
				default:
					actions += "" + effect.name + " ended!";
					break;
				}
				break;
				
			case '-weather':
				var effect = Tools.getEffect(args[1]);
				var poke = this.getPokemon(kwargs.of);
				self.changeWeather(effect.name, poke, kwargs.upkeep);
				break;
				
			case '-fieldstart':
				var effect = Tools.getEffect(args[1]);
				var poke = this.getPokemon(kwargs.of);
				self.addPseudoWeather(effect.name, poke);
				
				switch (effect.id) {
				case 'trickroom':
					actions += "" + poke.getName() + ' twisted the dimensions!';
					break;
				case 'wonderroom':
					actions += "It created a bizarre area in which the Defense and Sp. Def stats are swapped!";
					break;
				case 'magicroom':
					actions += "It created a bizarre area in which Pok&#xE9;mon's held items lose their effects!";
					break;
				case 'gravity':
					actions += "Gravity intensified!";
					break;
				}
				break;
				
			case '-fieldend':
				var effect = Tools.getEffect(args[1]);
				var poke = this.getPokemon(kwargs.of);
				self.removePseudoWeather(effect.name, poke);
				
				switch (effect.id) {
				case 'trickroom':
					actions += 'The twisted dimensions returned to normal!';
					break;
				case 'wonderroom':
					actions += 'Wonder Room wore off, and the Defense and Sp. Def stats returned to normal!';
					break;
				case 'magicroom':
					actions += "Magic Room wore off, and the held items' effects returned to normal!";
					break;
				case 'gravity':
					actions += 'Gravity returned to normal!';
					break;
				}
				break;
				
			case '-fieldactivate':
				var effect = Tools.getEffect(args[1]);
				switch (effect.id) {
				case 'perishsong':
					actions += 'All Pok&#xE9;mon hearing the song will faint in three turns!';
					if (self.mySide.active[0]) self.mySide.active[0].addVolatile('perish3');
					if (self.yourSide.active[0]) self.yourSide.active[0].addVolatile('perish3');
					self.mySide.updateStatbar();
					self.yourSide.updateStatbar();
					break;
				case 'payday':
					actions += 'Coins were scattered everywhere!';
					break;
				default:
					actions += ''+effect.name+' hit!';
					break;
				}
				break;
			
			case '-message':
				actions += self.sanitize(args[1]);
				break;
			
			case '-anim':
				var poke = self.getPokemon(args[1]);
				var move = Tools.getMove(args[2]);
				if (self.checkActive(poke)) return;
				poke2 = self.getPokemon(args[3]);
				kwargs.silent = true;
				self.useMove(poke, move, poke2, kwargs);
				break;

			case '-hint':
				hiddenactions += '('+args[1]+')';
				break;
			
			default:
				self.logConsole('Unknown minor: ' + args[0]);
				break;
			}
		}
		if (actions) {
			self.message('<small>' + actions + '</small>', hiddenactions ? '<small>' + hiddenactions + '</small>' : '');
		} else if (hiddenactions) {
			self.message('', '<small>' + hiddenactions + '</small>');
		}
	}

	this.parseDetails = function (name, pokemonid, details, output) {
		if (!output) output = {};
		output.details = details;
		output.name = name;
		output.species = name;
		output.level = 100;
		output.shiny = false;
		output.gender = '';
		output.ident = (name?pokemonid:'');
		output.searchid = (name?(pokemonid + '|' + details):'');
		var splitDetails = details.split(', ');
		if (splitDetails[splitDetails.length-1] === 'shiny')
		{
			output.shiny = true;
			splitDetails.pop();
		}
		if (splitDetails[splitDetails.length-1] === 'M' || splitDetails[splitDetails.length-1] === 'F')
		{
			output.gender = splitDetails[splitDetails.length-1];
			splitDetails.pop();
		}
		if (splitDetails[1])
		{
			output.level = parseInt(splitDetails[1].substr(1)) || 100;
		}
		if (splitDetails[0])
		{
			output.species = splitDetails[0];
		}
		return output;
	};
	this.getPokemon = function (pokemonid, details) {
		var siden = -1;
		var name = pokemonid;
		var isNew = false; // if yes, don't match any pokemon that already exists (for Team Preview)
		var isOld = false; // if yes, match only pokemon that have been revealed, and can match fainted pokemon (now default)
		var isOther = false; // if yes, don't match an active pokemon (for switching)
		//var position = 0; // todo: use for position in doubles/triples
		var getfoe = false;
		var slot; // if there is an explicit slot for this pokemon
		var slotChart = {a:0,b:1,c:2,d:3,e:4,f:5};
		if (typeof pokemonid === 'undefined' || name === '??') return null;
		if (name.substr(0, 5) === 'foe: ') {
			name = name.substr(5);
			pokemonid = name;
			getfoe = true;
		}
		if (name.substr(0, 5) === 'new: ') {
			name = name.substr(5);
			pokemonid = name;
			isNew = true;
			isOther = true;
		}
		if (name.substr(0, 7) === 'other: ') {
			name = name.substr(7);
			pokemonid = name;
			isOther = true;
		}
		if (name.substr(0, 5) === 'old: ') {
			name = name.substr(5);
			pokemonid = name;
			isOld = true;
		}
		if (name.substr(0, 4) === 'p2: ' || name === 'p2') {
			siden = self.p2.n;
			name = name.substr(4);
			species = name;
		} else if (name.substr(0, 4) === 'p1: ' || name === 'p1') {
			siden = self.p1.n;
			name = name.substr(4);
			species = name;
		} else if (name.substr(0, 2) === 'p2' && name.substr(3, 2) === ': ') {
			slot = slotChart[name.substr(2,1)];
			siden = self.p2.n;
			name = name.substr(5);
			pokemonid = 'p2: '+name;
			species = name;
		} else if (name.substr(0, 2) === 'p1' && name.substr(3, 2) === ': ') {
			slot = slotChart[name.substr(2,1)];
			siden = self.p1.n;
			name = name.substr(5);
			pokemonid = 'p1: '+name;
			species = name;
		}

		if (!slot) slot = 0;

		if (!details) {
			if (siden < 0) return null;
			if (self.sides[siden].active[slot]) return self.sides[siden].active[slot];
		}

		var species = name;
		var gender = '';
		var level = 100;
		var shiny = false;
		var searchid = '';
		if (details) searchid = pokemonid+'|'+details;

		var bestMatchName = null;
		if (siden !== self.p2.n && !isNew) {
			if (self.p1.active[slot] && self.p1.active[slot].searchid === searchid && !isOther) {
				self.p1.active[slot].slot = slot;
				return self.p1.active[slot];
			}
			for (var i = 0; i < self.p1.pokemon.length; i++) {
				var pokemon = self.p1.pokemon[i];
				if (pokemon.fainted && (isNew || isOther)) continue;
				if (isOther) {
					if (self.p1.active.indexOf(pokemon) >= 0) continue;
					if (pokemon == self.p1.lastPokemon && !self.p1.active[slot]) continue;
				}
				if (pokemon.searchid === searchid || (!pokemon.searchid && pokemon.checkDetails(details)) || (!searchid && pokemon.ident === pokemonid)) {
					if (!pokemon.searchid)
					{
						pokemon.name = name;
						pokemon.searchid = searchid;
						pokemon.ident = pokemonid;
						if (pokemon.needsReplace) {
							pokemon = self.p1.newPokemon(self.parseDetails(name, pokemonid, details), i);
						}
					}
					pokemon.slot = slot;
					return pokemon;
				}
			}
		}
		if (siden !== self.p1.n && !isNew) {
			if (self.p2.active[slot] && self.p2.active[slot].searchid === searchid && !isOther) {
				self.p2.active[slot].slot = slot;
				return self.p2.active[slot];
			}
			for (var i = 0; i < self.p2.pokemon.length; i++) {
				var pokemon = self.p2.pokemon[i];
				if (pokemon.fainted && (isNew || isOther)) continue;
				if (isOther) {
					if (self.p2.active.indexOf(pokemon) >= 0) continue;
					if (pokemon == self.p2.lastPokemon && !self.p2.active[slot]) continue;
				}
				if (pokemon.searchid === searchid || (!pokemon.searchid && pokemon.checkDetails(details)) || (!searchid && pokemon.ident === pokemonid)) {
					if (!pokemon.searchid)
					{
						pokemon.name = name;
						pokemon.searchid = searchid;
						pokemon.ident = pokemonid;
						if (pokemon.needsReplace) {
							pokemon = self.p2.newPokemon(self.parseDetails(name, pokemonid, details), i);
						}
					}
					pokemon.slot = slot;
					return pokemon;
				}
			}
		}
		if (!isNew && !isOther && !details) {
			return false;
		}
		if (siden < 0) siden = self.p1.n;
		if (details) {
			var splitDetails = details.split(', ');
			if (splitDetails[splitDetails.length-1] === 'shiny') {
				shiny = true;
				splitDetails.pop();
			}
			if (splitDetails[splitDetails.length-1] === 'M' || splitDetails[splitDetails.length-1] === 'F') {
				gender = splitDetails[splitDetails.length-1];
				splitDetails.pop();
			}
			if (splitDetails[1]) {
				level = parseInt(splitDetails[1].substr(1)) || 100;
			}
			if (splitDetails[0]) {
				species = splitDetails[0];
			}
		}
		var pokemon = self.sides[siden].newPokemon({
			species: species,
			details: details,
			name: name,
			ident: (name?pokemonid:''),
			searchid: (name?(pokemonid + '|' + details):''),
			level: level,
			gender: gender,
			shiny: shiny,
			slot: slot
		});
		return pokemon;
	}
	this.getSide = function (sidename) {
		if (sidename === 'p1' || sidename.substr(0,3)==='p1:') return self.p1;
		if (sidename === 'p2' || sidename.substr(0,3)==='p2:') return self.p2;
		if (self.mySide.id == sidename) return self.mySide;
		if (self.yourSide.id == sidename) return self.yourSide;
		if (self.mySide.name == sidename) return self.mySide;
		if (self.yourSide.name == sidename) return self.yourSide;
		return {
			name: sidename,
			id: sidename.replace(/ /g, '')
		};
	}

	this.add = function (command) {
		console.log("cmd: " + command);
		if (self.playbackState === 0) {
			self.playbackState = 1;
			self.activityQueue.push(command);
		} else if (self.playbackState === 4) {
			self.playbackState = 2;
			self.paused = false;
			self.activityQueue.push(command);
			self.activityQueueActive = true;
			self.nextActivity();
		} else {
			self.activityQueue.push(command);
		}
	}
	this.instantAdd = function (command) {
		self.run(command, true);
		self.preemptActivityQueue.push(command);
		self.add(command);
	}
	this.sanitize = function (str) {
		return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	this.waitForResult = function () {
		//if (self.endPrevAction()) return true;
		//self.resultWaiting = true;
		return false;		
	}
	this.runMajor = function(args, kwargs, preempt) {
		switch (args[0]) {
		case 'start':
			//self.teamPreview(false);
			self.mySide.active[0] = null;
			self.yourSide.active[0] = null;
			if (self.waitForResult()) return;
			
			self.start();
			break;
		case 'turn':
			if (self.endPrevAction()) return;
			self.setTurn(args[1]);
			break;
		case 'tier':
			if (!args[1]) args[1] = '';
			for (var i in kwargs) args[1] += '['+i+'] '+kwargs[i];
			self.log('<div style="padding:5px 0"><small>Format:</small> <br /><strong>' + self.sanitize(args[1]) + '</strong></div>');
			break;
		case 'gametype':
			self.gameType = args[1];
			if (args[1] === 'doubles') {
				if (self.mySide.active.length < 2) self.mySide.active.push(null);
				if (self.yourSide.active.length < 2) self.yourSide.active.push(null);
			}
			break;
		case 'variation':
			self.log('<div><small>Variation: <em>' + self.sanitize(args[1]) + '</em></small></div>');
			break;
		case 'rule':
			var ruleArgs = args[1].split(': ');
			self.log('<div><small><em>' + self.sanitize(ruleArgs[0]) + (ruleArgs[1]?':':'') + '</em> ' + self.sanitize(ruleArgs[1]||'') + '</div>');
			break;
		case 'rated':
			self.rated = true;
			self.log('<div class="rated"><strong>Rated battle</strong></div>');
			break;
		case 'chat':
		case 'c':
			name = args[1];
			args.shift();
			args.shift();
			var message = args.join('|');
			if (message.substr(0,2) === '//') {
				self.log(self.sanitize(name) + ':' + messageSanitize(message.substr(1)), preempt);
			} else if (message.substr(0,4).toLowerCase() === '/me ') {
				self.log(self.sanitize(name) + ': ' + messageSanitize(message.substr(4)), preempt);
			} else if (message.substr(0,14).toLowerCase() === '/data-pokemon ') {
				self.log('<div class="chat"><ul class=\"utilichart\">'+Chart.pokemonRow(Tools.getTemplate(message.substr(14)),'',{})+'<li style=\"clear:both\"></li></ul></div>', preempt);
			} else if (message.substr(0,11).toLowerCase() === '/data-item ') {
				self.log('<div class="chat"><ul class=\"utilichart\">'+Chart.itemRow(Tools.getItem(message.substr(11)),'',{})+'<li style=\"clear:both\"></li></ul></div>', preempt);
			} else if (message.substr(0,14).toLowerCase() === '/data-ability ') {
				self.log('<div class="chat"><ul class=\"utilichart\">'+Chart.abilityRow(Tools.getAbility(message.substr(14)),'',{})+'<li style=\"clear:both\"></li></ul></div>', preempt);
			} else if (message.substr(0,11).toLowerCase() === '/data-move ') {
				self.log('<div class="chat"><ul class=\"utilichart\">'+Chart.moveRow(Tools.getMove(message.substr(11)),'',{})+'<li style=\"clear:both\"></li></ul></div>', preempt);
			} else {
				self.log(self.sanitize(name) + ': ' + messageSanitize(message), preempt);
			}
			break;
		case 'chatmsg':
			args.shift();
			list = args.join('|');
			self.log('<div class="chat">' + self.sanitize(list) + '</div>', preempt);
			break;
		case 'chatmsg-raw':
		case 'raw':
			args.shift();
			list = args.join('|');
			var m = /<div style="background-color:#6688AA;color:white;padding:2px 4px"><b>Register an account to protect your ladder rating!<\/b><br \/><button onclick="overlay\('register',{ifuserid:'[a-z0-9]*'}\);return false"><b>Register<\/b><\/button><\/div>/.exec(list);
			if (m) {
				// This is a temporary hack so that this keeps working for old servers.
				// This check can be removed later.
				self.log('<div class="chat">' + m[0] + '</div>');
			} else {
				// TODO: Sanitise for safe URIs only, after we bring in the safe URI list.
				self.log('<div class="chat">' + Tools.htmlSanitize(list) + '</div>', preempt);
			}
			break;
		case 'pm':
			self.log('<div class="chat"><strong>' + sanitize(args[1]) + ':</strong> <span class="message-pm"><i style="cursor:pointer" onclick="selectTab(\'lobby\');rooms.lobby.popupOpen(\'' + args[2] + '\')">(Private to ' + sanitize(args[3]) + ')</i> ' + messageSanitize(args[4]) + '</span>');
			break;
		case 'askreg':
			self.log('<div class="message-register-account"><b>Register an account to protect your ladder rating!</b><br /><button onclick="overlay(\'register\',{ifuserid:\''+args[1]+'\'});return false"><b>Register</b></button></div>');
			break;
		case 'inactive':
			self.kickingInactive = true;
			args.shift();
			list = args.join('|');
			self.log('<div class="chat" style="color:#992222">' + self.sanitize(list) + '</div>', preempt);
			break;
		case 'inactiveoff':
			self.kickingInactive = false;
			args.shift();
			list = args.join('|');
			self.log('<div class="chat" style="color:#992222">' + self.sanitize(list) + '</div>', preempt);
			break;
		case 'join':
		case 'j':
		case 'J':
			self.log('<div class="chat"><small>' + self.sanitize(args[1]) + ' joined.</small></div>', preempt);
			break;
		case 'leave':
		case 'l':
		case 'L':
			self.log('<div class="chat"><small>' + self.sanitize(args[1]) + ' left.</small></div>', preempt);
			break;
		case 'spectator':
		case 'spectatorleave':
			break;
		case 'player':
			self.getSide(args[1]).setName(args[2]);
			break;
		case 'win':
			self.winner(args[1]);
			break;
		case 'tie':
			self.winner();
			break;
		case 'prematureend':
			self.prematureEnd();
			break;
		case 'clearpoke':
			self.p1.pokemon = [];
			self.p2.pokemon = [];
			for (var i=0; i<self.p1.active.length; i++) {
				self.p1.active[i] = null;
				self.p2.active[i] = null;
			}
			break;
		case 'poke':
			self.getPokemon('new: '+args[1], args[2]);
			break;
		case 'teampreview':
			//self.teamPreview(true);
			//self.teamPreviewCount = args[1];
			break;
		case 'switch':
		case 'drag':
		case 'replace':
			if (self.waitForResult()) return;
			var poke = self.getPokemon('other: '+args[1], args[2]);
			var slot = poke.slot;
			poke.healthParse(args[3]);
			if (args[0] === 'switch') {
				if (poke.side.active[slot])
				{
					poke.side.switchOut(poke.side.active[slot]);
					if (self.waitForResult()) return;
				}
				poke.side.switchIn(poke);
			} else if (args[0] === 'replace') {
				poke.side.replace(poke);
			} else {
				poke.side.dragIn(poke);
			}
			break;
		case 'faint':
			if (self.waitForResult()) return;
			var poke = self.getPokemon(args[1]);
			poke.side.faint(poke);
			break;
		case 'move':
			if (!kwargs.from && self.waitForResult()) return;
			var poke = self.getPokemon(args[1]);
			var move = Tools.getMove(args[2]);
			if (self.checkActive(poke)) return;
			poke2 = self.getPokemon(args[3]);
			
			self.useMove(poke, move, poke2, kwargs);
			
			break;
		case 'cant':
			if (self.waitForResult()) return;
			var poke = self.getPokemon(args[1]);
			var effect = Tools.getEffect(args[2]);
			var move = Tools.getMove(args[3]);
			self.cantUseMove(poke, effect, move, kwargs);
			break;
		case 'message':
			self.message(self.sanitize(args[1]));
			break;
		case 'done':
		case '':
			if (self.done || self.endPrevAction()) return;
			break;
		case 'error':
			args.shift();
			self.message('<strong>Error:</strong> ' + self.sanitize(args.join('|')));
			self.message('Bug? Report it to <a href="http://www.smogon.com/forums/showthread.php?t=3453192">the replay viewer\'s Smogon thread</a>');
			break;
		case 'warning':
			args.shift();
			self.message('<strong>Warning:</strong> ' + self.sanitize(args.join('|')));
			self.message('Bug? Report it to <a href="http://www.smogon.com/forums/showthread.php?t=3453192">the replay viewer\'s Smogon thread</a>');
			break;
		case 'gen':
			self.gen = parseInt(args[1]);
			break;
		case 'callback':
			args.shift();
			if (self.customCallback) self.customCallback(self, args[0], args, kwargs);
			break;
		case 'debug':
			args.shift();
			name = args.join(' ');
			self.log('<div class="chat"><small style="color:#999">[DEBUG] ' + self.sanitize(name) + '.</small></div>', preempt);
			break;
		default:
			self.logConsole('unknown command: ' + args[0]);
			self.log('<div>Unknown command: ' + self.sanitize(args[0]) + '</div>');
			break;
		}
	};

	this.run = function (str, preempt) {
		if (self.preemptActivityQueue.length && str === self.preemptActivityQueue[0]) {
			self.preemptActivityQueue.shift();
			return;
		}
		str = $.trim(str);
		if (str.substr(0,1) === '|') {
			var args = ['done'], kwargs = {};
			str = $.trim(str.substr(1));
			if (str !== '') {
				args = str.split('|');
				for (var i=0,len=args.length; i<len; i++) args[i] = $.trim(args[i]);
			}
			while (args[args.length-1] && args[args.length-1].substr(0,1) === '[') {
				var bracketPos = args[args.length-1].indexOf(']');
				if (bracketPos <= 0) break;
				var argstr = args.pop();
				// default to '.' so it evaluates to boolean true
				kwargs[argstr.substr(1,bracketPos-1)] = ($.trim(argstr.substr(bracketPos+1)) || '.');
			}

			// parse the next line if it's a minor: runnMinor needs it parsed to determine when to merge minors
			var nextLine = '', nextArgs = [''], nextKwargs = {};
			nextLine = self.activityQueue[self.activityStep+1];
			if (nextLine && nextLine.substr(0,2) === '|-') {
				nextLine = $.trim(nextLine.substr(1));
				nextArgs = nextLine.split('|');
				while (nextArgs[nextArgs.length-1] && nextArgs[nextArgs.length-1].substr(0,1) === '[') {
					var bracketPos = nextArgs[nextArgs.length-1].indexOf(']');
					if (bracketPos <= 0) break;
					var argstr = nextArgs.pop();
					// default to '.' so it evaluates to boolean true
					nextKwargs[argstr.substr(1,bracketPos-1)] = ($.trim(argstr.substr(bracketPos+1)) || '.');
				}
			}
			
			if (self.debug) {
				console.error("Dbug = " + JSON.stringify(self.debug));
				if (args[0].substr(0,1) === '-') {
					self.runMinor(args, kwargs, preempt, nextArgs, nextKwargs);
				} else {
					self.runMajor(args, kwargs, preempt);
				}
			} 
			else 
			{
				try {
					if (args[0].substr(0,1) === '-') {
						self.runMinor(args, kwargs, preempt, nextArgs, nextKwargs);
					} else {
						self.runMajor(args, kwargs, preempt);
					}
				} catch (e) {
					self.log('<div class="chat">Error parsing: ' + self.sanitize(str) + '</div>', preempt);
					if (e.stack) {
						var stack = ''+e.stack;
						stack = stack.split("\n").slice(0,2).join("\n");
						self.log('<div class="chat" style="white-space:pre-wrap">' + self.sanitize(stack) + '</div>', preempt);
					} else {
						self.log('<div class="chat">Error: ' + self.sanitize(''+e) + '</div>', preempt);
					}
				}
			}
		} else {
			self.log('<div class="chat">' + self.sanitize(str) + '</div>', preempt);
		}
	}
	this.endPrevAction = function () {
		if (self.minorQueue.length) {
			self.runMinor();
			self.activityStep--;
			return true;
		}
		if (self.resultWaiting || self.messageActive) {
			self.endAction();
			self.activityStep--;
			self.resultWaiting = false;
			self.multiHitMove = null;
			return true;
		}
		return false;
	}
	this.checkActive = function (poke) {
		if (!poke.side.active[poke.slot]) {
			// SOMEONE jumped in in the middle of a replay. <_<
			poke.side.replace(poke);
		}
		return false;
	}
	// activity queue
	this.animationDelay = 0;
	this.activityStep = 0;
	this.activityDelay = 0;
	this.activityQueue = [];
	this.preemptActivityQueue = [];
	this.activityAnimations = $();
	this.activityQueueActive = false;
	this.fastForward = false;
	this.minorQueue = [];
	this.resultWaiting = false;
	this.multiHitMove = null;
	this.queue1 = function () {
		if (self.activeQueue === self.queue1) self.nextActivity();
	};
	this.queue2 = function () {
		if (self.activeQueue === self.queue2) self.nextActivity();
	};
	this.swapQueues = function () {
		if (self.activeQueue === self.queue1) self.activeQueue = self.queue2;
		else self.activeQueue = self.queue2;
	};
	this.activeQueue = this.queue1;
	this.pause = function () {
		self.paused = true;
		self.playbackState = 3;
	}
	this.play = function () {
		if (self.fastForward) {
			self.paused = false;
			self.playbackState = 5;
		} else if (self.paused) {
			self.paused = false;
			self.playbackState = 2;
			self.nextActivity();
		}
	}
	this.skipTurn = function () {
		self.fastForwardTo(self.turn + 1);
	};		
		
	this.fastForwardTo = function (time) {
		self.playbackState = 5;
		if (self.fastForward) return;
		time = parseInt(time);
		if (isNaN(time)) return;
		if (self.activityStep >= self.activityQueue.length - 1 && time >= self.turn + 1 && !self.activityQueueActive) return;
		if (self.done && time >= self.turn + 1) return;
		if (time <= self.turn && time !== -1) {
			var paused = self.paused;
			self.reset();
			self.activityQueueActive = true;
			if (paused) self.pause();
			else self.paused = false;
			self.fastForward = time;
			self.swapQueues();
			self.nextActivity();
			return;
		}
		self.fastForward = time;
		if (self.yourSide.active[0] && self.yourSide.active[0].sprite) {
			self.yourSide.active[0].sprite.animReset();
		}
		if (self.mySide.active[0] && self.mySide.active[0].sprite) {
			self.mySide.active[0].sprite.animReset();
		}
		self.swapQueues();
		self.nextActivity();
	};
	this.fastForwardOff = function () {
		self.fastForward = false;
		self.playbackState = 2;
	};
	this.nextActivity = function () {
		if (self.paused && !self.fastForward) {
			return;
		}
		self.activityQueueActive = true;
		while (true) {
			if (self.activityStep == self.activityQueue.length) {
				self.activityQueueActive = false;
				self.paused = true;
				self.fastForwardOff();
				self.playbackState = 4;
				if (self.endCallback) self.endCallback(self);
				return;
			}
			var ret;
			if (self.paused && !self.fastForward) return;
			if (!ret) {
				self.run(self.activityQueue[self.activityStep]);
				self.activityStep++;
			}
			if (self.activityDelay) {
				self.activityDelay = 0;
			}
		}
		self.activeQueue();
	}

	this.newBattle = function () {
		self.reset();
		self.activityQueue = [];
	}
	this.setQueue = function (queue) {
		self.reset();
		self.activityQueue = queue;
		self.playbackState = 1;
	}
	
	// callback
	this.faintCallback = null;
	this.switchCallback = null;
	this.dragCallback = null;
	this.turnCallback = null;
	this.startCallback = null;
	this.stagnateCallback = null;
	this.endCallback = null;
	this.customCallback = null;

	// external
	this.resumeButton = this.play;
	this.messageDelay = 8;
	
	self.init();
}

module.exports.Pokemon = Pokemon;
module.exports.Battle = Battle;