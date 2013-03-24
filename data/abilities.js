/*

Ratings and how they work:

-2: Extremely detrimental
	  The sort of ability that relegates Pokemon with Uber-level BSTs
	  into NU.
	ex. Slow Start, Truant

-1: Detrimental
	  An ability that does more harm than good.
	ex. Defeatist, Klutz

 0: Useless
	  An ability with no net effect on a Pokemon during a battle.
	ex. Pickup, Illuminate

 1: Ineffective
	  An ability that has a minimal effect. Should never be chosen over
	  any other ability.
	ex. Pressure, Damp

 2: Situationally useful
	  An ability that can be useful in certain situations.
	ex. Blaze, Insomnia

 3: Useful
	  An ability that is generally useful.
	ex. Volt Absorb, Iron Fist

 4: Very useful
	  One of the most popular abilities. The difference between 3 and 4
	  can be ambiguous.
	ex. Technician, Intimidate

 5: Essential
	  The sort of ability that defines metagames.
	ex. Drizzle, Magnet Pull

*/

module.exports.BattleAbilities = {
	"adaptability": {
		desc: "This Pokemon's attacks that receive STAB (Same Type Attack Bonus) are increased from 50% to 100%.",
		shortDesc: "This Pokemon's same-type attack bonus (STAB) is increased from 1.5x to 2x.",
		onModifyMove: function(move) {
			move.stab = 2;
		},
		id: "adaptability",
		name: "Adaptability",
		rating: 3.5,
		num: 91
	},
	"aftermath": {
		desc: "If a contact move knocks out this Pokemon, the opponent receives damage equal to one-fourth of its max HP.",
		shortDesc: "If this Pokemon is KOed with a contact move, that move's user loses 1/4 its max HP.",
		id: "aftermath",
		name: "Aftermath",
		onFaint: function(target, source, effect) {
			if (effect && effect.effectType === 'Move' && effect.isContact && source) {
				this.damage(source.maxhp/4, source, target);
			}
		},
		rating: 3,
		num: 106
	},
	"airlock": {
		desc: "While this Pokemon is active, all weather conditions and their effects are disabled.",
		shortDesc: "While this Pokemon is active, all weather conditions and their effects are disabled.",
		onStart: function(pokemon) {
			this.add('-message', 'The effects of weather disappeared. (placeholder)');
		},
		onAnyModifyPokemon: function(pokemon) {
			pokemon.ignore['WeatherTarget'] = true;
		},
		onAnyTryWeather: false,
		id: "airlock",
		name: "Air Lock",
		rating: 3,
		num: 76
	},
	"analytic": {
		desc: "If the user moves last, the power of that move is increased by 30%.",
		shortDesc: "This Pokemon's attacks do 1.3x damage if it is the last to move in a turn.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (!this.willMove(defender)) {
				this.debug('Analytic boost');
				return basePower * 1.3;
			}
		},
		id: "analytic",
		name: "Analytic",
		rating: 1,
		num: 148
	},
	"angerpoint": {
		desc: "If this Pokemon, or its Substitute, is struck by a Critical Hit, its Attack is boosted to six stages.",
		shortDesc: "If this Pokemon (not a Substitute) is hit by a critical hit, its Attack is boosted by 12.",
		onCriticalHit: function(target) {
			if (!target.volatiles['substitute']) {
				target.setBoost({atk: 6});
				this.add('-setboost',target,'atk',12,'[from] ability: Anger Point');
			}
		},
		id: "angerpoint",
		name: "Anger Point",
		rating: 2,
		num: 83
	},
	"anticipation": {
		desc: "A warning is displayed if an opposing Pokemon has the moves Fissure, Guillotine, Horn Drill, Sheer Cold, or any attacking move from a type that is considered super effective against this Pokemon (including Counter, Mirror Coat, and Metal Burst). Hidden Power, Judgment, Natural Gift and Weather Ball are considered Normal-type moves.",
		shortDesc: "On switch-in, this Pokemon shudders if any foe has a super effective or OHKO move.",
		onStart: function(pokemon) {
			var targets = pokemon.side.foe.active;
			for (var i=0; i<targets.length; i++) {
				if (targets[i].fainted) continue;
				for (var j=0; j<targets[i].moveset.length; j++) {
					var move = this.getMove(targets[i].moveset[j].move);
					if (move.category !== 'Status' && (this.getEffectiveness(move.type, pokemon) > 0 || move.ohko)) {
						this.add('-message', pokemon.name+' shuddered! (placeholder)');
						return;
					}
				}
			}
		},
		id: "anticipation",
		name: "Anticipation",
		rating: 1,
		num: 107
	},
	"arenatrap": {
		desc: "When this Pokemon enters the field, its opponents cannot switch or flee the battle unless they are part Flying-type, have the Levitate ability, are holding Shed Shell, or they use the moves Baton Pass or U-Turn. Flying-type and Levitate Pokemon cannot escape if they are holding Iron Ball or Gravity is in effect. Levitate Pokemon also cannot escape if their ability is disabled through other means, such as Skill Swap or Gastro Acid.",
		shortDesc: "Prevents foes from switching out normally unless they have immunity to Ground.",
		onFoeModifyPokemon: function(pokemon) {
			if (pokemon.runImmunity('Ground', false)) {
				pokemon.trapped = true;
			}
		},
		id: "arenatrap",
		name: "Arena Trap",
		rating: 5,
		num: 71
	},
	"baddreams": {
		desc: "If asleep, each of this Pokemon's opponents receives damage equal to one-eighth of its max HP.",
		shortDesc: "Causes sleeping adjacent foes to lose 1/8 of their max HP at the end of each turn.",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual: function(pokemon) {
			for (var i=0; i<pokemon.side.foe.active.length; i++) {
				var target = pokemon.side.foe.active[i];
				if (pokemon.hp && target.status === 'slp') {
					this.damage(target.maxhp/8, target);
				}
			}
		},
		id: "baddreams",
		name: "Bad Dreams",
		rating: 2,
		num: 123
	},
	"battlearmor": {
		desc: "Critical Hits cannot strike this Pokemon.",
		shortDesc: "This Pokemon cannot be struck by a critical hit.",
		onCriticalHit: false,
		id: "battlearmor",
		name: "Battle Armor",
		rating: 1,
		num: 4
	},
	"bigpecks": {
		desc: "Prevents the Pokemon's Defense stat from being reduced.",
		shortDesc: "Prevents other Pokemon from lowering this Pokemon's Defense.",
		onBoost: function(boost, target, source) {
			if (source && target === source) return;
			if (boost['def'] && boost['def'] < 0) {
				boost['def'] = 0;
				this.add("-message", target.name+"'s Defense was not lowered! (placeholder)");
			}
		},
		id: "bigpecks",
		name: "Big Pecks",
		rating: 1,
		num: 145
	},
	"blaze": {
		desc: "When its health reaches one-third or less of its max HP, this Pokemon's Fire-type attacks receive a 50% boost in power.",
		shortDesc: "When this Pokemon has 1/3 or less of its max HP, its Fire attacks do 1.5x damage.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (move.type === 'Fire' && attacker.hp <= attacker.maxhp/3) {
				this.debug('Blaze boost');
				return basePower * 1.5;
			}
		},
		id: "blaze",
		name: "Blaze",
		rating: 2,
		num: 66
	},
	"chlorophyll": {
		desc: "If this Pokemon is active while Sunny Day is in effect, its speed is temporarily doubled.",
		shortDesc: "If Sunny Day is active, this Pokemon's Speed is doubled.",
		onModifySpe: function(spe) {
			if (this.isWeather('sunnyday')) {
				return spe * 2;
			}
		},
		id: "chlorophyll",
		name: "Chlorophyll",
		rating: 2,
		num: 34
	},
	"clearbody": {
		desc: "Opponents cannot reduce this Pokemon's stats; they can, however, modify stat changes with Power Swap, Guard Swap and Heart Swap and inflict stat boosts with Swagger and Flatter. This ability does not prevent self-inflicted stat reductions.",
		shortDesc: "Prevents other Pokemon from lowering this Pokemon's stat stages.",
		onBoost: function(boost, target, source) {
			if (source && target === source) return;
			for (var i in boost) {
				if (boost[i] < 0) {
					delete boost[i];
					this.add("-message", target.name+"'s stats were not lowered! (placeholder)");
				}
			}
		},
		id: "clearbody",
		name: "Clear Body",
		rating: 2,
		num: 29
	},
	"cloudnine": {
		desc: "While this Pokemon is active, all weather conditions and their effects are disabled.",
		shortDesc: "While this Pokemon is active, all weather conditions and their effects are disabled.",
		onStart: function(pokemon) {
			this.add('-message', 'The effects of weather disappeared. (placeholder)');
		},
		onAnyModifyPokemon: function(pokemon) {
			pokemon.ignore['WeatherTarget'] = true;
		},
		onAnyTryWeather: false,
		id: "cloudnine",
		name: "Cloud Nine",
		rating: 3,
		num: 13
	},
	"colorchange": {
		desc: "This Pokemon's type changes according to the type of the last move that hit this Pokemon.",
		shortDesc: "This Pokemon's type changes to match the type of the last move that hit it.",
		onAfterMoveSecondary: function(target, source, effect) {
			if (target.isActive && effect && effect.effectType === 'Move' && effect.category !== 'Status') {
				target.addVolatile('colorchange', source, effect);
			}
		},
		effect: {
			noCopy: true,
			onStart: function(target, source, effect) {
				this.effectData.type = 'Normal';
				if (effect && effect.type && effect.type !== 'Normal') {
					this.add('-start', target, 'typechange', effect.type, '[from] Color Change');
					this.effectData.type = effect.type;
				} else {
					return false;
				}
			},
			onRestart: function(target, source, effect) {
				if (effect && effect.type && effect.type !== this.effectData.type) {
					this.add('-start', target, 'typechange', effect.type, '[from] Color Change');
					this.effectData.type = effect.type;
				}
			},
			onModifyPokemon: function(target) {
				if (!this.effectData.type) this.effectData.type = 'Normal';
				target.types = [this.effectData.type];
			}
		},
		id: "colorchange",
		name: "Color Change",
		rating: 2,
		num: 16
	},
	"compoundeyes": {
		desc: "The accuracy of this Pokemon's moves receives a 30% increase; for example, a 75% accurate move becomes 97.5% accurate.",
		shortDesc: "This Pokemon's moves have their accuracy boosted to 1.3x.",
		onModifyMove: function(move) {
			if (typeof move.accuracy !== 'number') return;
			this.debug('compoundeyes - enhancing accuracy');
			move.accuracy *= 1.3;
		},
		id: "compoundeyes",
		name: "Compoundeyes",
		rating: 3.5,
		num: 14
	},
	"contrary": {
		desc: "Stat changes are inverted.",
		shortDesc: "If this Pokemon has a stat boosted it is lowered instead, and vice versa.",
		onBoost: function(boost) {
			for (var i in boost) {
				boost[i] *= -1;
			}
		},
		id: "contrary",
		name: "Contrary",
		rating: 4,
		num: 126
	},
	"cursedbody": {
		desc: "30% chance of disabling one of the opponent's moves when attacked. This works even if the attacker is behind a Substitute, but will not activate if the Pokemon with Cursed Body is behind a Substitute.",
		shortDesc: "If this Pokemon is hit by an attack, there is a 30% chance that move gets Disabled.",
		onAfterDamage: function(damage, target, source, move) {
			if (!source || source.volatiles['disable']) return;
			if (source !== target && move && move.effectType === 'Move') {
				if (this.random(10) < 3) {
					source.addVolatile('disable');
				}
			}
		},
		id: "cursedbody",
		name: "Cursed Body",
		rating: 2,
		num: 130
	},
	"cutecharm": {
		desc: "If an opponent of the opposite gender directly attacks this Pokemon, there is a 30% chance that the opponent will become Attracted to this Pokemon.",
		shortDesc: "30% chance of infatuating Pokemon of the opposite gender if they make contact.",
		onAfterDamage: function(damage, target, source, move) {
			if (move && move.isContact) {
				if (this.random(10) < 3) {
					if (source.addVolatile('attract', target)) {
						this.add('-start', source, 'Attract', '[from] Cute Charm', '[of] '+target);
					}
				}
			}
		},
		id: "cutecharm",
		name: "Cute Charm",
		rating: 2,
		num: 56
	},
	"damp": {
		desc: "While this Pokemon is active, no Pokemon on the field can use Selfdestruct or Explosion.",
		shortDesc: "While this Pokemon is active, Selfdestruct, Explosion, and Aftermath do not work.",
		id: "damp",
		onAnyTryMove: function(target, source, effect) {
			if (effect.id === 'selfdestruct' || effect.id === 'explosion') {
				this.attrLastMove('[still]');
				this.add('-activate', this.effectData.target, 'ability: Damp');
				return false;
			}
		},
		onAnyDamage: function(damage, target, source, effect) {
			if (effect && effect.id === 'aftermath') {
				return false;
			}
		},
		name: "Damp",
		rating: 0.5,
		num: 6
	},
	"defeatist": {
		desc: "Attack and Special Attack are halved when HP is less than half.",
		shortDesc: "When this Pokemon has 1/2 or less of its max HP, its Attack and Sp. Atk are halved.",
		onModifyAtk: function(atk, pokemon) {
			if (pokemon.hp < pokemon.maxhp/2) {
				return atk / 2;
			}
		},
		onModifySpA: function(atk, pokemon) {
			if (pokemon.hp < pokemon.maxhp/2) {
				return atk / 2;
			}
		},
		onResidual: function(pokemon) {
			pokemon.update();
		},
		id: "defeatist",
		name: "Defeatist",
		rating: -1,
		num: 129
	},
	"defiant": {
		desc: "Raises the user's Attack stat by two stages when a stat is lowered, including the Attack stat. This does not include self-induced stat drops like those from Close Combat.",
		shortDesc: "This Pokemon's Attack is boosted by 2 for each of its stats that is lowered by a foe.",
		onAfterEachBoost: function(boost, target, source) {
			if (!source || target.side === source.side) {
				return;
			}
			var statsLowered = false;
			for (var i in boost) {
				if (boost[i] < 0) {
					statsLowered = true;
				}
			}
			if (statsLowered) {
				this.boost({atk: 2});
			}
		},
		id: "defiant",
		name: "Defiant",
		rating: 2,
		num: 128
	},
	"download": {
		desc: "If this Pokemon switches into an opponent with equal Defenses or higher Defense than Special Defense, this Pokemon's Special Attack receives a 50% boost. If this Pokemon switches into an opponent with higher Special Defense than Defense, this Pokemon's Attack receive a 50% boost.",
		shortDesc: "On switch-in, Attack or Sp. Atk is boosted by 1 based on the foes' weaker Defense.",
		onStart: function (pokemon) {
			var foeactive = pokemon.side.foe.active;
			var totaldef = 0;
			var totalspd = 0;
			for (var i=0; i<foeactive.length; i++) {
				if (!foeactive[i] || foeactive[i].fainted) continue;
				totaldef += foeactive[i].getStat('def');
				totalspd += foeactive[i].getStat('spd');
			}
			if (totaldef && totaldef >= totalspd) {
				this.boost({spa:1});
			} else if (totalspd) {
				this.boost({atk:1});
			}
		},
		id: "download",
		name: "Download",
		rating: 4,
		num: 88
	},
	"drizzle": {
		desc: "When this Pokemon enters the battlefield, it causes a permanent Rain Dance that can only be stopped by Air Lock, Cloud Nine or another weather condition.",
		shortDesc: "On switch-in, this Pokemon summons Rain Dance until another weather replaces it.",
		onStart: function(source) {
			this.setWeather('raindance');
			this.weatherData.duration = 0;
		},
		id: "drizzle",
		name: "Drizzle",
		rating: 5,
		num: 2
	},
	"drought": {
		desc: "When this Pokemon enters the battlefield, it causes a permanent Sunny Day that can only be stopped by Air Lock, Cloud Nine or another weather condition.",
		shortDesc: "On switch-in, this Pokemon summons Sunny Day until another weather replaces it.",
		onStart: function(source) {
			this.setWeather('sunnyday');
			this.weatherData.duration = 0;
		},
		id: "drought",
		name: "Drought",
		rating: 5,
		num: 70
	},
	"dryskin": {
		desc: "This Pokemon absorbs Water attacks and gains a weakness to Fire attacks. If Sunny Day is in effect, this Pokemon takes damage. If Rain Dance is in effect, this Pokemon recovers health.",
		shortDesc: "This Pokemon is healed 1/4 by Water, 1/8 by Rain; is hurt 1.25x by Fire, 1/8 by Sun.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.type === 'Water') {
				this.heal(target.maxhp/4);
				return null;
			}
		},
		onFoeBasePower: function(basePower, attacker, defender, move) {
			if (move.type === 'Fire') {
				return basePower * 5/4;
			}
		},
		onWeather: function(target, source, effect) {
			if (effect.id === 'raindance') {
				this.heal(target.maxhp/8);
			} else if (effect.id === 'sunnyday') {
				this.damage(target.maxhp/8);
			}
		},
		id: "dryskin",
		name: "Dry Skin",
		rating: 3.5,
		num: 87
	},
	"earlybird": {
		desc: "This Pokemon will remain asleep for half as long as it normally would; this includes both opponent-induced sleep and user-induced sleep via Rest.",
		shortDesc: "This Pokemon's sleep status lasts half as long as usual, self-induced or not.",
		id: "earlybird",
		name: "Early Bird",
		isHalfSleep: true,
		rating: 2.5,
		num: 48
	},
	"effectspore": {
		desc: "If an opponent directly attacks this Pokemon, there is a 30% chance that the opponent will become either poisoned, paralyzed or put to sleep. There is an equal chance to inflict each status.",
		shortDesc: "30% chance of poisoning, paralyzing, or causing sleep on Pokemon making contact.",
		onAfterDamage: function(damage, target, source, move) {
			if (move && move.isContact && !source.status) {
				var r = this.random(100);
				if (r < 11) source.setStatus('slp');
				else if (r < 21) source.setStatus('par');
				else if (r < 30) source.setStatus('psn');
			}
		},
		id: "effectspore",
		name: "Effect Spore",
		rating: 2,
		num: 27
	},
	"filter": {
		desc: "This Pokemon receives one-fourth reduced damage from Super Effective attacks.",
		shortDesc: "This Pokemon receives 3/4 damage from super effective attacks.",
		onSourceBasePower: function(basePower, attacker, defender, move) {
			if (this.getEffectiveness(move.type, defender) > 0) {
				this.debug('Filter neutralize');
				return basePower * 3/4;
			}
		},
		id: "filter",
		name: "Filter",
		rating: 3,
		num: 111
	},
	"flamebody": {
		desc: "If an opponent directly attacks this Pokemon, there is a 30% chance that the opponent will become burned.",
		shortDesc: "30% chance of burning a Pokemon making contact with this Pokemon.",
		onAfterDamage: function(damage, target, source, move) {
			if (move && move.isContact) {
				if (this.random(10) < 3) {
					source.trySetStatus('brn', target, move);
				}
			}
		},
		id: "flamebody",
		name: "Flame Body",
		rating: 2,
		num: 49
	},
	"flareboost": {
		desc: "When the user with this ability is burned, its Special Attack is raised by 50%.",
		shortDesc: "When this Pokemon is burned, its special attacks do 1.5x damage.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (attacker.status === 'brn' && move.category === 'Special') {
				return basePower * 1.5;
			}
		},
		id: "flareboost",
		name: "Flare Boost",
		rating: 3,
		num: 138
	},
	"flashfire": {
		desc: "This Pokemon is immune to all Fire-type attacks; additionally, its own Fire-type attacks receive a 50% boost if a Fire-type move hits this Pokemon. Multiple boosts do not occur if this Pokemon is hit with multiple Fire-type attacks.",
		shortDesc: "This Pokemon's Fire attacks do 1.5x damage if hit by one Fire move; Fire immunity.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.type === 'Fire') {
				target.addVolatile('flashfire');
				return null;
			}
		},
		effect: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart: function(target) {
				this.add('-start',target,'ability: Flash Fire');
			},
			onBasePower: function(basePower, attacker, defender, move) {
				if (move.type === 'Fire') {
					this.debug('Flash Fire boost');
					return basePower * 1.5;
				}
			}
		},
		id: "flashfire",
		name: "Flash Fire",
		rating: 3,
		num: 18
	},
	"flowergift": {
		desc: "If this Pokemon is active while Sunny Day is in effect, its Attack and Special Defense stats (as well as its partner's stats in double battles) receive a 50% boost.",
		shortDesc: "If user is Cherrim and Sunny Day is active, it and allies' Attack and Sp. Def are 1.5x.",
		onStart: function(pokemon) {
			delete this.effectData.forme;
		},
		onUpdate: function(pokemon) {
			if (!pokemon.isActive || pokemon.speciesid !== 'cherrim') return;
			if (this.isWeather('sunnyday')) {
				if (this.effectData.forme !== 'Sunshine') {
					this.effectData.forme = 'Sunshine';
					this.add('-formechange', pokemon, 'Cherrim-Sunshine');
					this.add('-message', pokemon.name+' transformed! (placeholder)');
				}
			} else {
				if (this.effectData.forme) {
					delete this.effectData.forme;
					this.add('-formechange', pokemon, 'Cherrim');
					this.add('-message', pokemon.name+' transformed! (placeholder)');
				}
			}
		},
		onAllyModifyAtk: function(atk) {
			if (this.isWeather('sunnyday')) {
				return atk *= 1.5;
			}
		},
		onAllyModifySpD: function(spd) {
			if (this.isWeather('sunnyday')) {
				return spd *= 1.5;
			}
		},
		id: "flowergift",
		name: "Flower Gift",
		rating: 3,
		num: 122
	},
	"forecast": {
		desc: "This Pokemon's type changes according to the current weather conditions: it becomes Fire-type during Sunny Day, Water-type during Rain Dance, Ice-type during Hail and remains its regular type otherwise.",
		shortDesc: "Castform's type changes to the current weather condition's type, except Sandstorm.",
		onUpdate: function(pokemon) {
			if (pokemon.baseTemplate.species !== 'Castform' || pokemon.transformed) return;
			var forme = null;
			switch (this.effectiveWeather()) {
			case 'sunnyday':
				if (pokemon.template.speciesid !== 'castformsunny') forme = 'Castform-Sunny';
				break;
			case 'raindance':
				if (pokemon.template.speciesid !== 'castformrainy') forme = 'Castform-Rainy';
				break;
			case 'hail':
				if (pokemon.template.speciesid !== 'castformsnowy') forme = 'Castform-Snowy';
				break;
			default:
				if (pokemon.template.speciesid !== 'castform') forme = 'Castform';
				break;
			}
			if (pokemon.isActive && forme) {
				pokemon.transformInto(forme);
				pokemon.transformed = false;
				this.add('-formechange', pokemon, forme);
				this.add('-message', pokemon.name+' transformed! (placeholder)');
			}
		},
		id: "forecast",
		name: "Forecast",
		rating: 4,
		num: 59
	},
	"forewarn": {
		desc: "The move with the highest Base Power in the opponent's moveset is revealed.",
		shortDesc: "On switch-in, this Pokemon is alerted to the foes' move with the highest Base Power.",
		onStart: function(pokemon) {
			var targets = pokemon.side.foe.active;
			var warnMoves = [];
			var warnBp = 1;
			for (var i=0; i<targets.length; i++) {
				if (targets[i].fainted) continue;
				for (var j=0; j<targets[i].moveset.length; j++) {
					var move = this.getMove(targets[i].moveset[j].move);
					var bp = move.basePower;
					if (move.ohko) bp = 160;
					if (move.id === 'counter' || move.id === 'metalburst' || move.id === 'mirrorcoat') bp = 120;
					if (!bp && move.category !== 'Status') bp = 80;
					if (bp > warnBp) {
						warnMoves = [[move, targets[i]]];
						warnBp = bp;
					} else if (bp == warnBp) {
						warnMoves.push([move, targets[i]]);
					}
				}
			}
			if (!warnMoves.length) return;
			var warnMove = warnMoves[this.random(warnMoves.length)];
			this.add('-activate', pokemon, 'ability: Forewarn', warnMove);
		},
		id: "forewarn",
		name: "Forewarn",
		rating: 1,
		num: 108
	},
	"friendguard": {
		desc: "Reduces the damage received from an ally in a double or triple battle.",
		shortDesc: "This Pokemon's allies receive 3/4 damage from other Pokemon's attacks.",
		id: "friendguard",
		name: "Friend Guard",
		rating: 0,
		num: 132
	},
	"frisk": {
		desc: "When this Pokemon enters the field, it identifies the opponent's held item; in double battles, the held item of an unrevealed, randomly selected opponent is identified.",
		shortDesc: "On switch-in, this Pokemon identifies a random foe's held item.",
		onStart: function(pokemon) {
			var target = pokemon.side.foe.randomActive();
			if (target && target.item) {
				this.add('-item', target, target.getItem().name, '[from] ability: Frisk', '[of] '+pokemon);
			}
		},
		id: "frisk",
		name: "Frisk",
		rating: 1.5,
		num: 119
	},
	"gluttony": {
		desc: "This Pokemon consumes its held berry when its health reaches 50% max HP or lower.",
		shortDesc: "When this Pokemon has 1/2 or less of its max HP, it uses certain Berries early.",
		id: "gluttony",
		name: "Gluttony",
		rating: 0,
		num: 82
	},
	"guts": {
		desc: "When this Pokemon is poisoned (including Toxic), burned, paralyzed or asleep (including self-induced Rest), its Attack stat receives a 50% boost; the burn status' Attack drop is also ignored.",
		shortDesc: "If this Pokemon is statused, its Attack is 1.5x; burn's Attack drop is ignored.",
		onModifyAtk: function(atk, pokemon) {
			if (pokemon.status) {
				return atk * 1.5;
			}
		},
		id: "guts",
		name: "Guts",
		rating: 3,
		num: 62
	},
	"harvest": {
		desc: "When the user uses a held Berry, it is restored at the end of the turn.",
		shortDesc: "50% chance this Pokemon's Berry is restored at the end of each turn. 100% in Sun.",
		id: "harvest",
		name: "Harvest",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual: function(pokemon) {
			if (this.isWeather('sunnyday') || this.random(2) === 0) {
				if (!pokemon.item && this.getItem(pokemon.lastItem).isBerry) {
						pokemon.setItem(pokemon.lastItem);
						this.add("-item", pokemon, pokemon.item, '[from] ability: Harvest');
				}
			}
		},
		rating: 2,
		num: 139
	},
	"healer": {
		desc: "Has a 30% chance of curing an adjacent ally's status ailment at the end of each turn in Double and Triple Battles.",
		shortDesc: "30% chance of curing an adjacent ally's status at the end of each turn.",
		id: "healer",
		name: "Healer",
		onResidualOrder: 5,
		onResidualSubOrder: 1,
		onResidual: function(pokemon) {
			var allyActive = pokemon.side.active;
			if (allyActive.length === 1) {
				return;
			}
			for (var i=0; i<allyActive.length; i++) {
				if (allyActive[i] && this.isAdjacent(pokemon, allyActive[i]) && allyActive[i].status && this.random(10) < 3) {
					allyActive[i].cureStatus();
				}
			}
		},
		rating: 0,
		num: 131
	},
	"heatproof": {
		desc: "This Pokemon receives half damage from both Fire-type attacks and residual burn damage.",
		shortDesc: "This Pokemon receives half damage from Fire-type attacks and burn damage.",
		onSourceBasePower: function(basePower, attacker, defender, move) {
			if (move.type === 'Fire') {
				return basePower / 2;
			}
		},
		onDamage: function(damage, target, source, effect) {
			if (effect && effect.id === 'brn') {
				return damage / 2;
			}
		},
		id: "heatproof",
		name: "Heatproof",
		rating: 2.5,
		num: 85
	},
	"heavymetal": {
		desc: "The user's weight is doubled. This increases user's base power of Heavy Slam and Heat Crash, as well as damage taken from the opponent's Low Kick and Grass Knot, due to these moves being calculated by the target's weight.",
		shortDesc: "This Pokemon's weight is doubled.",
		onModifyPokemon: function(pokemon) {
			pokemon.weightkg *= 2;
		},
		id: "heavymetal",
		name: "Heavy Metal",
		rating: 0,
		num: 134
	},
	"honeygather": {
		desc: "If it is not already holding an item, this Pokemon may find and be holding Honey after a battle.",
		shortDesc: "No competitive use.",
		id: "honeygather",
		name: "Honey Gather",
		rating: 0,
		num: 118
	},
	"hugepower": {
		desc: "This Pokemon's Attack stat is doubled. Therefore, if this Pokemon's Attack stat on the status screen is 200, it effectively has an Attack stat of 400; which is then subject to the full range of stat boosts and reductions.",
		shortDesc: "This Pokemon's Attack is doubled.",
		onModifyAtk: function(atk) {
			return atk * 2;
		},
		id: "hugepower",
		name: "Huge Power",
		rating: 5,
		num: 37
	},
	"hustle": {
		desc: "This Pokemon's Attack receives a 50% boost but its Physical attacks receive a 20% drop in Accuracy. For example, a 100% accurate move would become an 80% accurate move. The accuracy of moves that never miss, such as Aerial Ace, remains unaffected.",
		shortDesc: "This Pokemon's Attack is 1.5x and accuracy of its physical attacks is 0.8x.",
		onModifyAtk: function(atk) {
			return atk * 1.5;
		},
		onModifyMove: function(move) {
			if (move.category === 'Physical' && typeof move.accuracy === 'number') {
				move.accuracy *= 0.8;
			}
		},
		id: "hustle",
		name: "Hustle",
		rating: 3,
		num: 55
	},
	"hydration": {
		desc: "If this Pokemon is active while Rain Dance is in effect, it recovers from poison, paralysis, burn, sleep and freeze at the end of the turn.",
		shortDesc: "This Pokemon has its status cured at the end of each turn if Rain Dance is active.",
		onResidualOrder: 5,
		onResidualSubOrder: 1,
		onResidual: function(pokemon) {
			if (pokemon.status && this.isWeather('raindance')) {
				this.debug('hydration');
				pokemon.cureStatus();
			}
		},
		id: "hydration",
		name: "Hydration",
		rating: 2,
		num: 93
	},
	"hypercutter": {
		desc: "Opponents cannot reduce this Pokemon's Attack stat; they can, however, modify stat changes with Power Swap or Heart Swap and inflict a stat boost with Swagger. This ability does not prevent self-inflicted stat reductions.",
		shortDesc: "Prevents other Pokemon from lowering this Pokemon's Attack.",
		onBoost: function(boost, target, source) {
			if (source && target === source) return;
			if (boost['atk'] && boost['atk'] < 0) {
				boost['atk'] = 0;
				this.add("-message", target.name+"'s Attack was not lowered! (placeholder)");
			}
		},
		id: "hypercutter",
		name: "Hyper Cutter",
		rating: 1.5,
		num: 52
	},
	"icebody": {
		desc: "If active while Hail is in effect, this Pokemon recovers one-sixteenth of its max HP after each turn. If a non-Ice-type Pokemon receives this ability through Skill Swap, Role Play or the Trace ability, it will not take damage from Hail.",
		shortDesc: "If Hail is active, this Pokemon heals 1/16 of its max HP each turn; immunity to Hail.",
		onWeather: function(target, source, effect) {
			if (effect.id === 'hail') {
				this.heal(target.maxhp/16);
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'hail') return false;
		},
		id: "icebody",
		name: "Ice Body",
		rating: 3,
		num: 115
	},
	"illuminate": {
		desc: "When this Pokemon is in the first slot of the player's party, it doubles the rate of wild encounters.",
		shortDesc: "No competitive use.",
		id: "illuminate",
		name: "Illuminate",
		rating: 0,
		num: 35
	},
	"illusion": {
		desc: "Illusion will change the appearance of the Pokemon to a different species. This is dependent on the last Pokemon in the player's party. Along with the species itself, Illusion is broken when the user is damaged, but is not broken by Substitute, weather conditions, status ailments, or entry hazards. Illusion will replicate the type of Poke Ball, the species name, and the gender of the Pokemon it is masquerading as.",
		shortDesc: "This Pokemon appears as the last Pokemon in the party until it takes direct damage.",
		onBeforeSwitchIn: function(pokemon) {
			pokemon.illusion = null;
			for (var i=pokemon.side.pokemon.length-1; i>pokemon.position; i--) {
				if (!pokemon.side.pokemon[i]) continue;
				if (!pokemon.side.pokemon[i].fainted) break;
			}
			if (!pokemon.side.pokemon[i]) return;
			if (pokemon === pokemon.side.pokemon[i]) return;
			pokemon.illusion = pokemon.side.pokemon[i];
		},
		onDamage: function(damage, pokemon, source, effect) {
			if (pokemon.illusion && effect && effect.effectType === 'Move') {
				this.debug('illusion cleared');
				pokemon.illusion = null;
				this.add('replace', pokemon, pokemon.getDetails());
			}
		},
		id: "illusion",
		name: "Illusion",
		rating: 4.5,
		num: 149
	},
	"immunity": {
		desc: "This Pokemon cannot become poisoned nor Toxic poisoned.",
		shortDesc: "This Pokemon cannot be poisoned. Gaining this Ability while poisoned cures it.",
		onUpdate: function(pokemon) {
			if (pokemon.status === 'psn' || pokemon.status === 'tox') {
				pokemon.cureStatus();
			}
		},
		onImmunity: function(type) {
			if (type === 'psn') return false;
		},
		id: "immunity",
		name: "Immunity",
		rating: 1,
		num: 17
	},
	"imposter": {
		desc: "As soon as the user comes into battle, it Transforms into its opponent, copying the opponent's stats exactly, with the exception of HP. Imposter copies all stat changes on the target originating from moves and abilities such as Swords Dance and Intimidate, but not from items such as Choice Specs. Imposter will not Transform the user if the opponent is an Illusion or if the opponent is behind a Substitute.",
		shortDesc: "On switch-in, this Pokemon copies the foe it's facing; stats, moves, types, Ability.",
		onStart: function(pokemon) {
			var target = pokemon.side.foe.active[pokemon.side.foe.active.length-1-pokemon.position];
			if (target && pokemon.transformInto(target)) {
				this.add('-transform', pokemon, target);
			}
		},
		id: "imposter",
		name: "Imposter",
		rating: 5,
		num: 150
	},
	"infiltrator": {
		desc: "Ignores Reflect, Light Screen and Safeguard under effect on the target.",
		shortDesc: "This Pokemon's moves ignore the foe's Reflect, Light Screen, Safeguard, and Mist.",
		// Implemented in the corresponding effects.
		id: "infiltrator",
		name: "Infiltrator",
		rating: 1,
		num: 151
	},
	"innerfocus": {
		desc: "This Pokemon cannot be made to flinch.",
		shortDesc: "This Pokemon cannot be made to flinch.",
		onFlinch: false,
		id: "innerfocus",
		name: "Inner Focus",
		rating: 1,
		num: 39
	},
	"insomnia": {
		desc: "This Pokemon cannot be put to sleep; this includes both opponent-induced sleep as well as user-induced sleep via Rest.",
		shortDesc: "This Pokemon cannot fall asleep. Gaining this Ability while asleep cures it.",
		onUpdate: function(pokemon) {
			if (pokemon.status === 'slp') {
				pokemon.cureStatus();
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'slp') return false;
		},
		id: "insomnia",
		name: "Insomnia",
		rating: 2,
		num: 15
	},
	"intimidate": {
		desc: "When this Pokemon enters the field, the Attack stat of each of its opponents lowers by one stage.",
		shortDesc: "On switch-in, this Pokemon lowers adjacent foes' Attack by 1.",
		onStart: function(pokemon) {
			var foeactive = pokemon.side.foe.active;
			for (var i=0; i<foeactive.length; i++) {
				if (!foeactive[i] || foeactive[i].fainted) continue;
				if (foeactive[i].volatiles['substitute']) {
					// does it give a message?
					this.add('-activate',foeactive[i],'Substitute','ability: Intimidate','[of] '+pokemon);
				} else {
					this.add('-ability',pokemon,'Intimidate','[of] '+foeactive[i]);
					this.boost({atk: -1}, foeactive[i], pokemon);
				}
			}
		},
		id: "intimidate",
		name: "Intimidate",
		rating: 4,
		num: 22
	},
	"ironbarbs": {
		desc: "All moves that make contact with the Pokemon with Iron Barbs will damage the user by 1/8 of their maximum HP after damage is dealt.",
		shortDesc: "This Pokemon causes other Pokemon making contact to lose 1/8 of their max HP.",
		onAfterDamageOrder: 1,
		onAfterDamage: function(damage, target, source, move) {
			if (source && source !== target && move && move.isContact) {
				this.damage(source.maxhp/8, source, target);
			}
		},
		id: "ironbarbs",
		name: "Iron Barbs",
		rating: 3,
		num: 160
	},
	"ironfist": {
		desc: "This Pokemon receives a 20% power boost for the following attacks: Bullet Punch, Comet Punch, Dizzy Punch, Drain Punch, Dynamicpunch, Fire Punch, Focus Punch, Hammer Arm, Ice Punch, Mach Punch, Mega Punch, Meteor Mash, Shadow Punch, Sky Uppercut, and Thunderpunch. Sucker Punch, which is known Ambush in Japan, is not boosted.",
		shortDesc: "This Pokemon's punch-based attacks do 1.2x damage. Sucker Punch is not boosted.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (move.isPunchAttack) {
				this.debug('Iron Fist boost');
				return basePower * 12/10;
			}
		},
		id: "ironfist",
		name: "Iron Fist",
		rating: 3,
		num: 89
	},
	"justified": {
		desc: "Will raise the user's Attack stat one level when hit by any Dark-type moves. Unlike other abilities with immunity to certain typed moves, the user will still receive damage from the attack. Justified will raise Attack one level for each hit of a multi-hit move like Beat Up.",
		shortDesc: "This Pokemon's Attack is boosted by 1 after it is damaged by a Dark-type attack.",
		onAfterDamage: function(damage, target, source, effect) {
			if (effect && effect.type === 'Dark') {
				this.boost({atk:1});
			}
		},
		id: "justified",
		name: "Justified",
		rating: 2,
		num: 154
	},
	"keeneye": {
		desc: "This Pokemon's Accuracy cannot be lowered.",
		shortDesc: "Prevents other Pokemon from lowering this Pokemon's accuracy.",
		onBoost: function(boost, target, source) {
			if (source && target === source) return;
			if (boost['accuracy'] && boost['accuracy'] < 0) {
				boost['accuracy'] = 0;
				this.add("-message", target.name+"'s accuracy was not lowered! (placeholder)");
			}
		},
		id: "keeneye",
		name: "Keen Eye",
		rating: 1,
		num: 51
	},
	"klutz": {
		desc: "This Pokemon ignores both the positive and negative effects of its held item, other than the speed-halving and EV-enhancing effects of Macho Brace, Power Anklet, Power Band, Power Belt, Power Bracer, Power Lens, and Power Weight. Fling cannot be used.",
		shortDesc: "This Pokemon's held item has no effect, except Macho Brace. Fling cannot be used.",
		onModifyPokemon: function(pokemon) {
			pokemon.ignore['Item'] = true;
		},
		id: "klutz",
		name: "Klutz",
		rating: 0,
		num: 103
	},
	"leafguard": {
		desc: "If this Pokemon is active while Sunny Day is in effect, it cannot become poisoned, burned, paralyzed or put to sleep (other than user-induced Rest). Leaf Guard does not heal status effects that existed before Sunny Day came into effect.",
		shortDesc: "If Sunny Day is active, this Pokemon cannot be statused and Rest will fail for it.",
		onSetStatus: function(pokemon) {
			if (this.isWeather('sunnyday')) {
				return false;
			}
		},
		onTryHit: function(target, source, move) {
			if (move && move.id === 'yawn' && this.isWeather('sunnyday')) {
				return false;
			}
		},
		id: "leafguard",
		name: "Leaf Guard",
		rating: 1,
		num: 102
	},
	"levitate": {
		desc: "This Pokemon is immune to Ground-type attacks, Spikes, Toxic Spikes and the Arena Trap ability; it loses these immunities while holding Iron Ball, after using Ingrain or if Gravity is in effect.",
		shortDesc: "This Pokemon is immune to Ground; Gravity, Ingrain, Smack Down, Iron Ball nullify it.",
		onImmunity: function(type) {
			if (type === 'Ground') return false;
		},
		id: "levitate",
		name: "Levitate",
		rating: 3.5,
		num: 26
	},
	"lightmetal": {
		desc: "The user's weight is halved. This decreases the damage taken from Low Kick and Grass Knot, and also lowers user's base power of Heavy Slam and Heat Crash, due these moves being calculated by the target and user's weight.",
		shortDesc: "This Pokemon's weight is halved.",
		onModifyPokemon: function(pokemon) {
			pokemon.weightkg /= 2;
		},
		id: "lightmetal",
		name: "Light Metal",
		rating: 1,
		num: 135
	},
	"lightningrod": {
		desc: "During double battles, this Pokemon draws any single-target Electric-type attack to itself. If an opponent uses an Electric-type attack that affects multiple Pokemon, those targets will be hit. This ability does not affect Electric Hidden Power or Judgment. The user is immune to Electric and its Special Attack is increased one stage when hit by one.",
		shortDesc: "This Pokemon draws Electric moves to itself to boost Sp. Atk by 1; Electric immunity.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				this.boost({spa:1});
				return null;
			}
		},
		onAnyRedirectTargetPriority: 1,
		onAnyRedirectTarget: function(target, source, source2, move) {
			if (move.type !== 'Electric') return;
			if (this.validTarget(this.effectData.target, source, move.target)) {
				return this.effectData.target;
			}
		},
		id: "lightningrod",
		name: "Lightningrod",
		rating: 3.5,
		num: 32
	},
	"limber": {
		desc: "This Pokemon cannot become paralyzed.",
		shortDesc: "This Pokemon cannot be paralyzed. Gaining this Ability while paralyzed cures it.",
		onUpdate: function(pokemon) {
			if (pokemon.status === 'par') {
				pokemon.cureStatus();
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'par') return false;
		},
		id: "limber",
		name: "Limber",
		rating: 2,
		num: 7
	},
	"liquidooze": {
		desc: "When another Pokemon uses Absorb, Drain Punch, Dream Eater, Giga Drain, Leech Life, Leech Seed or Mega Drain against this Pokemon, the attacking Pokemon loses the amount of health that it would have gained.",
		shortDesc: "This Pokemon damages those draining HP from it for as much as they would heal.",
		id: "liquidooze",
		onSourceTryHeal: function(damage, target, source, effect) {
			this.debug("Heal is occurring: "+target+" <- "+source+" :: "+effect.id);
			var canOoze = {drain: 1, leechseed: 1};
			if (canOoze[effect.id]) {
				this.damage(damage);
				return 0;
			}
		},
		name: "Liquid Ooze",
		rating: 1,
		num: 64
	},
	"magicbounce": {
		desc: "Non-damaging moves are reflected back at the user.",
		shortDesc: "This Pokemon blocks certain status moves and uses the move itself.",
		id: "magicbounce",
		name: "Magic Bounce",
		onAllyTryFieldHit: function(target, source, move) {
			if (target === source) return;
			if (typeof move.isBounceable === 'undefined') {
					move.isBounceable = !!(move.category === 'Status' && (move.status || move.boosts || move.volatileStatus === 'confusion' || move.forceSwitch));
			}
			if (move.target !== 'foeSide' && target !== this.effectData.target) {
				return;
			}
			if (move.hasBounced) {
				return;
			}
			if (move.isBounceable) {
				var newMove = this.getMoveCopy(move.id);
				newMove.hasBounced = true;
				this.add('-activate', target, 'ability: Magic Bounce', newMove, '[of] '+source);
				this.moveHit(source, target, newMove);
				return null;
			}
		},
		effect: {
			duration: 1
		},
		rating: 5,
		num: 156
	},
	"magicguard": {
		desc: "Prevents all damage except from direct attacks.",
		shortDesc: "This Pokemon can only be damaged by direct attacks.",
		onDamage: function(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				return false;
			}
		},
		id: "magicguard",
		name: "Magic Guard",
		rating: 4.5,
		num: 98
	},
	"magmaarmor": {
		desc: "This Pokemon cannot become frozen.",
		shortDesc: "This Pokemon cannot be frozen. Gaining this Ability while frozen cures it.",
		onUpdate: function(pokemon) {
			if (pokemon.status === 'frz') {
				pokemon.cureStatus();
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'frz') return false;
		},
		id: "magmaarmor",
		name: "Magma Armor",
		rating: 0.5,
		num: 40
	},
	"magnetpull": {
		desc: "When this Pokemon enters the field, Steel-type opponents cannot switch out nor flee the battle unless they are holding Shed Shell or use the attacks U-Turn or Baton Pass.",
		shortDesc: "Prevents Steel-type foes from switching out normally.",
		onFoeModifyPokemon: function(pokemon) {
			if (pokemon.hasType('Steel')) {
				pokemon.trapped = true;
			}
		},
		id: "magnetpull",
		name: "Magnet Pull",
		rating: 5,
		num: 42
	},
	"marvelscale": {
		desc: "When this Pokemon becomes burned, poisoned (including Toxic), paralyzed, frozen or put to sleep (including self-induced sleep via Rest), its Defense receives a 50% boost.",
		shortDesc: "If this Pokemon is statused, its Defense is 1.5x.",
		onModifyDef: function(def, pokemon) {
			if (pokemon.status) {
				return def * 1.5;
			}
		},
		id: "marvelscale",
		name: "Marvel Scale",
		rating: 3,
		num: 63
	},
	"minus": {
		desc: "This Pokemon's Special Attack receives a 50% boost in double battles if its partner has the Plus ability.",
		shortDesc: "If another ally has this Ability or the Plus Ability, this Pokemon's Sp. Atk is 1.5x.",
		onModifySpA: function(spa, pokemon) {
			var allyActive = pokemon.side.active;
			if (allyActive.length === 1) {
				return;
			}
			for (var i=0; i<allyActive.length; i++) {
				if (allyActive[i] && allyActive[i].position !== pokemon.position && !allyActive[i].fainted && (allyActive[i].ability === 'minus' || allyActive[i].ability === 'plus')) {
					return spa * 1.5
				}
			}
		},
		id: "minus",
		name: "Minus",
		rating: 0,
		num: 58
	},
	"moldbreaker": {
		desc: "When this Pokemon becomes active, it nullifies the abilities of opposing active Pokemon that hinder this Pokemon's attacks. These abilities include Battle Armor, Clear Body, Damp, Dry Skin, Filter, Flash Fire, Flower Gift, Heatproof, Herbivore, Hyper Cutter, Immunity, Inner Focus, Insomnia, Keen Eye, Leaf Guard, Levitate, Lightningrod, Limber, Magma Armor, Marvel Scale, Motor Drive, Oblivious, Own Tempo, Sand Veil, Shell Armor, Shield Dust, Simple, Snow Cloak, Solid Rock, Soundproof, Sticky Hold, Storm Drain, Sturdy, Suction Cups, Tangled Feet, Thick Fat, Unaware, Vital Spirit, Volt Absorb, Water Absorb, Water Veil, White Smoke and Wonder Guard.",
		shortDesc: "This Pokemon's moves ignore the target's Ability if it could modify the effectiveness.",
		onStart: function(pokemon) {
			this.add('-ability', pokemon, 'Mold Breaker');
		},
		onAllyModifyPokemonPriority: 100,
		onAllyModifyPokemon: function(pokemon) {
			if (this.activePokemon === this.effectData.target && pokemon !== this.activePokemon) {
				pokemon.ignore['Ability'] = 'A';
			}
		},
		onFoeModifyPokemonPriority: 100,
		onFoeModifyPokemon: function(pokemon) {
			if (this.activePokemon === this.effectData.target) {
				pokemon.ignore['Ability'] = 'A';
			}
		},
		id: "moldbreaker",
		name: "Mold Breaker",
		rating: 3,
		num: 104
	},
	"moody": {
		desc: "Causes the Pokemon to raise one of its stats by two stages, while another stat is lowered by one stage at the end of each turn. These stats include accuracy and evasion.",
		shortDesc: "Boosts a random stat by 2 and lowers another stat by 1 at the end of each turn.",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual: function(pokemon) {
			var stats = [], i = '';
			var boost = {};
			for (var i in pokemon.boosts) {
				if (pokemon.boosts[i] < 6) {
					stats.push(i);
				}
			}
			if (stats.length) {
				i = stats[this.random(stats.length)];
				boost[i] = 2;
			}
			stats = [];
			for (var j in pokemon.boosts) {
				if (pokemon.boosts[j] > -6 && j !== i) {
					stats.push(j);
				}
			}
			if (stats.length) {
				i = stats[this.random(stats.length)];
				boost[i] = -1;
			}
			this.boost(boost);
		},
		id: "moody",
		name: "Moody",
		rating: 5,
		num: 141
	},
	"motordrive": {
		desc: "This Pokemon is immune to all Electric-type attacks, including Thunder Wave, and if an Electric-type attack hits this Pokemon, it receives a one-level Speed boost.",
		shortDesc: "This Pokemon's Speed is boosted by 1 if hit by an Electric move; Electric immunity.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				this.boost({spe:1});
				return null;
			}
		},
		id: "motordrive",
		name: "Motor Drive",
		rating: 3,
		num: 78
	},
	"moxie": {
		desc: "When a Pokemon with Moxie faints another Pokemon, its Attack rises by one stage.",
		shortDesc: "This Pokemon's Attack is boosted by 1 if it attacks and faints another Pokemon.",
		onSourceFaint: function(target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({atk:1}, source);
			}
		},
		id: "moxie",
		name: "Moxie",
		rating: 4,
		num: 153
	},
	"multiscale": {
		desc: "Lowers damage taken by half when at maximum HP.",
		shortDesc: "If this Pokemon is at full HP, it takes half damage from attacks.",
		onSourceBasePower: function(basePower, attacker, defender, move) {
			if (defender.hp >= defender.maxhp) {
				this.debug('Multiscale weaken');
				return basePower/2;
			}
		},
		id: "multiscale",
		name: "Multiscale",
		rating: 4,
		num: 136
	},
	"multitype": {
		desc: "This Pokemon changes its type to match its corresponding held Plate; this ability only works for Arceus, prevents the removal of Arceus' held item and cannot be Skill Swapped, Role Played or Traced.",
		shortDesc: "If this Pokemon is Arceus, its type changes to match its held Plate.",
		onModifyPokemon: function(pokemon) {
			if (pokemon.baseTemplate.species !== 'Arceus') {
				return;
			}
			var type = this.runEvent('Plate', pokemon);
			if (type && type !== true) {
				pokemon.types = [type];
			}
		},
		onTakeItem: function(item) {
			if (item.onPlate) return false;
		},
		id: "multitype",
		name: "Multitype",
		rating: 5,
		num: 121
	},
	"mummy": {
		desc: "When the user is attacked by a contact move, the opposing Pokemon's ability is turned into Mummy as well. Multitype, Wonder Guard and Mummy itself are the only abilities not affected by Mummy. The effect of Mummy is not removed by Mold Breaker, Turboblaze, or Teravolt.",
		shortDesc: "Pokemon making contact with this Pokemon have their Ability changed to Mummy.",
		id: "mummy",
		name: "Mummy",
		onAfterDamage: function(damage, target, source, move) {
			if (source && source !== target && move && move.isContact) {
				if (source.setAbility('mummy')) {
					this.add('-ability', source, 'Mummy', '[from] Mummy');
				}
			}
		},
		rating: 1,
		num: 152
	},
	"naturalcure": {
		desc: "When this Pokemon switches out of battle, it is cured of poison (including Toxic), paralysis, burn, freeze and sleep (including self-induced Rest).",
		shortDesc: "This Pokemon has its status cured when it switches out.",
		onSwitchOut: function(pokemon) {
			pokemon.setStatus('');
		},
		id: "naturalcure",
		name: "Natural Cure",
		rating: 4,
		num: 30
	},
	"noguard": {
		desc: "Every attack used by or against this Pokemon will always hit.",
		shortDesc: "Every move used by or against this Pokemon will always hit.",
		onModifyMove: function(move) {
			move.accuracy = true;
			move.alwaysHit = true;
		},
		onSourceModifyMove: function(move) {
			move.accuracy = true;
			move.alwaysHit = true;
		},
		id: "noguard",
		name: "No Guard",
		rating: 4.5,
		num: 99
	},
	"normalize": {
		desc: "Makes all of this Pokemon's attacks Normal-typed.",
		shortDesc: "This Pokemon's moves all become Normal-typed.",
		onModifyMove: function(move) {
			if (move.id !== 'struggle') {
				move.type = 'Normal';
			}
		},
		id: "normalize",
		name: "Normalize",
		rating: -1,
		num: 96
	},
	"oblivious": {
		desc: "This Pokemon cannot become attracted to another Pokemon.",
		shortDesc: "This Pokemon cannot be infatuated. Gaining this Ability while infatuated cures it.",
		onUpdate: function(pokemon) {
			if (pokemon.volatiles['attract']) {
				pokemon.removeVolatile('attract');
				this.add("-message", pokemon.name+" got over its infatuation. (placeholder)");
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'attract') {
				this.add('-immune', pokemon, '[from] Oblivious');
				return false;
			}
		},
		onTryHit: function(pokemon, target, move) {
			if (move.id === 'captivate') {
				this.add('-immune', pokemon, '[msg]', '[from] Oblivious');
				return null;
			}
		},
		id: "oblivious",
		name: "Oblivious",
		rating: 0.5,
		num: 12
	},
	"overcoat": {
		desc: "In battle, the Pokemon does not take damage from weather conditions like Sandstorm or Hail.",
		shortDesc: "This Pokemon does not take damage from Sandstorm or Hail.",
		onImmunity: function(type, pokemon) {
			if (type === 'sandstorm' || type === 'hail') return false;
		},
		id: "overcoat",
		name: "Overcoat",
		rating: 1,
		num: 142
	},
	"overgrow": {
		desc: "When its health reaches one-third or less of its max HP, this Pokemon's Grass-type attacks receive a 50% boost in power.",
		shortDesc: "When this Pokemon has 1/3 or less of its max HP, its Grass attacks do 1.5x damage.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (move.type === 'Grass' && attacker.hp <= attacker.maxhp/3) {
				this.debug('Overgrow boost');
				return basePower * 1.5;
			}
		},
		id: "overgrow",
		name: "Overgrow",
		rating: 2,
		num: 65
	},
	"owntempo": {
		desc: "This Pokemon cannot become confused.",
		shortDesc: "This Pokemon cannot be confused. Gaining this Ability while confused cures it.",
		onUpdate: function(pokemon) {
			if (pokemon.volatiles['confusion']) {
				pokemon.removeVolatile('confusion');
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'confusion') {
				this.add('-immune', pokemon, 'confusion');
				return false;
			}
		},
		id: "owntempo",
		name: "Own Tempo",
		rating: 1,
		num: 20
	},
	"pickup": {
		desc: "If an opponent uses a consumable item, Pickup will give the Pokemon the item used, if it is not holding an item. If multiple Pickup Pokemon are in play, one will pick up a copy of the used Berry, and may or may not use it immediately. Works on Berries, Gems, Absorb Bulb, Focus Sash, Herbs, Cell Battery, Red Card, and anything that is thrown with Fling.",
		shortDesc: "If this Pokemon has no item, it finds one used by an adjacent Pokemon this turn.",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual: function(pokemon) {
			var foe = pokemon.side.foe.randomActive();
			if (!foe) return;
			if (!pokemon.item && foe.lastItem && foe.usedItemThisTurn && foe.lastItem !== 'airballoon' && foe.lastItem !== 'ejectbutton') {
				pokemon.setItem(foe.lastItem);
				foe.lastItem = '';
				var item = pokemon.getItem();
				this.add('-item', pokemon, item, '[from] Pickup');
				if (item.isBerry) pokemon.update();
			}
		},
		id: "pickup",
		name: "Pickup",
		rating: 0,
		num: 53
	},
	"pickpocket": {
		desc: "Steals attacking Pokemon's held item on contact.",
		shortDesc: "If this Pokemon has no item, it steals an item off a Pokemon making contact.",
		onAfterDamage: function(damage, target, source, move) {
			if (source && source !== target && move && move.isContact) {
				if (target.item) {
					return;
				}
				var yourItem = source.takeItem(target);
				if (!yourItem) {
					return;
				}
				if (!target.setItem(yourItem)) {
					source.item = yourItem.id;
					return;
				}
				this.add('-item', target, yourItem, '[from] ability: Pickpocket');
			}
		},
		id: "pickpocket",
		name: "Pickpocket",
		rating: 1,
		num: 124
	},
	"plus": {
		desc: "This Pokemon's Special Attack receives a 50% boost in double battles if its partner has the Minus ability.",
		shortDesc: "If another ally has this Ability or the Minus Ability, this Pokemon's Sp. Atk is 1.5x.",
		onModifySpA: function(spa, pokemon) {
			var allyActive = pokemon.side.active;
			if (allyActive.length === 1) {
				return;
			}
			for (var i=0; i<allyActive.length; i++) {
				if (allyActive[i] && allyActive[i].position !== pokemon.position && !allyActive[i].fainted && (allyActive[i].ability === 'minus' || allyActive[i].ability === 'plus')) {
					return spa * 1.5
				}
			}
		},
		id: "plus",
		name: "Plus",
		rating: 0,
		num: 57
	},
	"poisonheal": {
		desc: "If this Pokemon becomes poisoned or Toxic Poisoned, it will recover one-eighth of its max HP after each turn.",
		shortDesc: "This Pokemon is healed by 1/8 of its max HP each turn when poisoned; no HP loss.",
		onDamage: function(damage, target, source, effect) {
			if (effect.id === 'psn' || effect.id === 'tox') {
				this.heal(target.maxhp/8);
				return false;
			}
		},
		id: "poisonheal",
		name: "Poison Heal",
		rating: 4,
		num: 90
	},
	"poisonpoint": {
		desc: "If an opponent directly attacks this Pokemon, there is a 30% chance that the opponent will become poisoned.",
		shortDesc: "30% chance of poisoning a Pokemon making contact with this Pokemon.",
		onAfterDamage: function(damage, target, source, move) {
			if (move && move.isContact) {
				if (this.random(10) < 3) {
					source.trySetStatus('psn', target, move);
				}
			}
		},
		id: "poisonpoint",
		name: "Poison Point",
		rating: 2,
		num: 38
	},
	"poisontouch": {
		desc: "The contact-based attacks from a Pokemon with Poison Touch have a 30% chance of poisoning the target.",
		shortDesc: "This Pokemon's contact moves have a 30% chance of poisoning.",
		// upokecenter says this is implemented as an added secondary effect
		onModifyMove: function(move) {
			if (!move || !move.isContact) return;
			if (!move.secondaries) {
				move.secondaries = [];
			}
			move.secondaries.push({
				chance: 30,
				status: 'psn'
			});
		},
		id: "poisontouch",
		name: "Poison Touch",
		rating: 2,
		num: 143
	},
	"prankster": {
		desc: "Increases the priority of non-damaging moves by 1.",
		shortDesc: "This Pokemon's non-damaging moves have their priority increased by 1.",
		onModifyPriority: function(priority, pokemon, target, move) {
			if (move && move.category === 'Status') {
				return priority + 1;
			}
		},
		id: "prankster",
		name: "Prankster",
		rating: 4.5,
		num: 158
	},
	"pressure": {
		desc: "When an opponent uses a move that affects this Pokemon, an additional PP is required for the opponent to use that move.",
		shortDesc: "If this Pokemon is the target of a move, that move loses one additional PP.",
		onStart: function(pokemon) {
			this.add('-ability', pokemon, 'Pressure');
		},
		onSourceDeductPP: function(pp, target, source) {
			if (target === source) return;
			return pp+1;
		},
		id: "pressure",
		name: "Pressure",
		rating: 2,
		num: 46
	},
	"purepower": {
		desc: "This Pokemon's Attack stat is doubled. Therefore, if this Pokemon's Attack stat on the status screen is 200, it effectively has an Attack stat of 400; which is then subject to the full range of stat boosts and reductions.",
		shortDesc: "This Pokemon's Attack is doubled.",
		onModifyAtk: function(atk) {
			return atk * 2;
		},
		id: "purepower",
		name: "Pure Power",
		rating: 5,
		num: 74
	},
	"quickfeet": {
		desc: "When this Pokemon is poisoned (including Toxic), burned, paralyzed, asleep (including self-induced Rest) or frozen, its Speed stat receives a 50% boost; the paralysis status' Speed drop is also ignored.",
		shortDesc: "If this Pokemon is statused, its Speed is 1.5x; paralysis' Speed drop is ignored.",
		onModifySpe: function(spe, pokemon) {
			if (pokemon.status) {
				return spe * 1.5;
			}
		},
		id: "quickfeet",
		name: "Quick Feet",
		rating: 3,
		num: 95
	},
	"raindish": {
		desc: "If active while Rain Dance is in effect, this Pokemon recovers one-sixteenth of its max HP after each turn.",
		shortDesc: "If Rain Dance is active, this Pokemon heals 1/16 of its max HP each turn.",
		onWeather: function(target, source, effect) {
			if (effect.id === 'raindance') {
				this.heal(target.maxhp/16);
			}
		},
		id: "raindish",
		name: "Rain Dish",
		rating: 1,
		num: 44
	},
	"rattled": {
		desc: "Raises the user's Speed one stage when hit by a Dark-, Bug-, or Ghost-type move.",
		shortDesc: "This Pokemon's Speed is boosted by 1 if hit by a Dark-, Bug-, or Ghost-type attack.",
		onAfterDamage: function(damage, target, source, effect) {
			if (effect && (effect.type === 'Dark' || effect.type === 'Bug' || effect.type === 'Ghost')) {
				this.boost({spe:1});
			}
		},
		id: "rattled",
		name: "Rattled",
		rating: 2,
		num: 155
	},
	"reckless": {
		desc: "When this Pokemon uses an attack that causes recoil damage, or an attack that has a chance to cause recoil damage such as Jump Kick and Hi Jump Kick, the attacks's power receives a 20% boost.",
		shortDesc: "This Pokemon's attacks with recoil or crash damage do 1.2x damage; not Struggle.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (move.recoil || move.hasCustomRecoil) {
				this.debug('Reckless boost');
				return basePower * 12/10;
			}
		},
		id: "reckless",
		name: "Reckless",
		rating: 3,
		num: 120
	},
	"regenerator": {
		desc: "Causes the user to restore HP by 1/3 of its maximum when switching out.",
		shortDesc: "This Pokemon heals 1/3 of its max HP when it switches out.",
		onSwitchOut: function(pokemon) {
			pokemon.heal(pokemon.maxhp/3);
		},
		id: "regenerator",
		name: "Regenerator",
		rating: 4.5,
		num: 144
	},
	"rivalry": {
		desc: "Increases base power of Physical and Special attacks by 25% if the opponent is the same gender, but decreases base power by 25% if opponent is the opposite gender.",
		shortDesc: "This Pokemon's attacks do 1.25x on same gender targets; 0.75x on opposite gender.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (attacker.gender && defender.gender) {
				if (attacker.gender === defender.gender) {
					this.debug('Rivalry boost');
					return basePower * 5/4;
				} else {
					this.debug('Rivalry weaken');
					return basePower * 3/4;
				}
			}
		},
		id: "rivalry",
		name: "Rivalry",
		rating: 0.5,
		num: 79
	},
	"rockhead": {
		desc: "This Pokemon does not receive recoil damage unless it uses Struggle, it misses with Jump Kick or Hi Jump Kick or it is holding Life Orb, Jaboca Berry or Rowap Berry.",
		shortDesc: "This Pokemon does not take recoil damage besides Struggle, Life Orb, crash damage.",
		onModifyMove: function(move) {
			delete move.recoil;
		},
		id: "rockhead",
		name: "Rock Head",
		rating: 3,
		num: 69
	},
	"roughskin": {
		desc: "Causes recoil damage equal to 1/8 of the opponent's max HP if an opponent directly attacks.",
		shortDesc: "This Pokemon causes other Pokemon making contact to lose 1/8 of their max HP.",
		onAfterDamageOrder: 1,
		onAfterDamage: function(damage, target, source, move) {
			if (source && source !== target && move && move.isContact) {
				this.damage(source.maxhp/8, source, target);
			}
		},
		id: "roughskin",
		name: "Rough Skin",
		rating: 3,
		num: 24
	},
	"runaway": {
		desc: "Unless this Pokemon is under the effects of a trapping move or ability, such as Mean Look or Shadow Tag, it will escape from wild Pokemon battles without fail.",
		shortDesc: "No competitive use.",
		id: "runaway",
		name: "Run Away",
		rating: 0,
		num: 50
	},
	"sandforce": {
		desc: "Raises the power of Rock, Ground, and Steel-type moves by 30% while a Sandstorm is in effect. It also gives the user immunity to damage from Sandstorm.",
		shortDesc: "This Pokemon's Rock/Ground/Steel attacks do 1.3x in Sandstorm; immunity to it.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (this.isWeather('sandstorm')) {
				if (move.type === 'Rock' || move.type === 'Ground' || move.type === 'Steel') {
					this.debug('Sand Force boost');
					return basePower * 13/10;
				}
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		id: "sandforce",
		name: "Sand Force",
		rating: 2,
		num: 159
	},
	"sandrush": {
		desc: "Doubles Speed in a Sandstorm, and makes the Pokemon immune to Sandstorm damage.",
		shortDesc: "If Sandstorm is active, this Pokemon's Speed is doubled; immunity to Sandstorm.",
		onModifySpe: function(spe, pokemon) {
			if (this.isWeather('sandstorm')) {
				return spe * 2;
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		id: "sandrush",
		name: "Sand Rush",
		rating: 2,
		num: 146
	},
	"sandstream": {
		desc: "When this Pokemon enters the battlefield, it causes a permanent Sandstorm that can only be stopped by Air Lock, Cloud Nine or another weather condition.",
		shortDesc: "On switch-in, this Pokemon summons Sandstorm until another weather replaces it.",
		onStart: function(source) {
			this.setWeather('sandstorm');
			this.weatherData.duration = 0;
		},
		id: "sandstream",
		name: "Sand Stream",
		rating: 5,
		num: 45
	},
	"sandveil": {
		desc: "If active while Sandstorm is in effect, this Pokemon's Evasion receives a 20% boost; if this Pokemon has a typing that would normally take damage from Sandstorm, this Pokemon is also immune to Sandstorm's damage.",
		shortDesc: "If Sandstorm is active, this Pokemon's evasion is 1.25x; immunity to Sandstorm.",
		onImmunity: function(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		onAccuracy: function(accuracy) {
			if (typeof accuracy !== 'number') return;
			if (this.isWeather('sandstorm')) {
				this.debug('Sand Veil - decreasing accuracy');
				return accuracy * 0.8;
			}
		},
		id: "sandveil",
		name: "Sand Veil",
		rating: 1,
		num: 8
	},
	"sapsipper": {
		desc: "When a Pokemon with Sap Sipper is hit with a Grass-type attack, its attack is increased by one level, and the move itself has no effect. If hit by a multi-hit attack like Bullet Seed, it will increase attack by one stage for each hit. The only Grass-type move that will not activate Sap Sipper is Aromatherapy.",
		shortDesc: "This Pokemon's Attack is boosted by 1 if hit by any Grass move; Grass immunity.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.type === 'Grass') {
				this.boost({atk:1});
				return null;
			}
		},
		id: "sapsipper",
		name: "Sap Sipper",
		rating: 3.5,
		num: 157
	},
	"scrappy": {
		desc: "This Pokemon has the ability to hit Ghost-type Pokemon with Normal-type and Fighting-type moves. Effectiveness of these moves takes into account the Ghost-type Pokemon's other weaknesses and resistances.",
		shortDesc: "This Pokemon can hit Ghost-types with Normal- and Fighting-type moves.",
		onFoeModifyPokemon: function(pokemon) {
			if (pokemon.hasType('Ghost')) {
				pokemon.negateImmunity['Normal'] = true;
				pokemon.negateImmunity['Fighting'] = true;
			}
		},
		id: "scrappy",
		name: "Scrappy",
		rating: 3,
		num: 113
	},
	"serenegrace": {
		desc: "The side effects of this Pokemon's attack occur twice as often. For example, if this Pokemon uses Ice Beam, it will have a 20% chance to freeze its target.",
		shortDesc: "This Pokemon's moves have their secondary effect chance doubled.",
		onModifyMove: function(move) {
			if (move.secondaries) {
				this.debug('doubling secondary chance');
				for (var i=0; i<move.secondaries.length; i++) {
					move.secondaries[i].chance *= 2;
				}
			}
		},
		id: "serenegrace",
		name: "Serene Grace",
		rating: 4,
		num: 32
	},
	"shadowtag": {
		desc: "When this Pokemon enters the field, its opponents cannot switch or flee the battle unless they have the same ability, are holding Shed Shell, or they use the moves Baton Pass or U-Turn.",
		shortDesc: "Prevents foes from switching out normally unless they also have this Ability.",
		onFoeModifyPokemon: function(pokemon) {
			if (pokemon.ability !== 'shadowtag') {
				pokemon.trapped = true;
			}
		},
		id: "shadowtag",
		name: "Shadow Tag",
		rating: 5,
		num: 23
	},
	"shedskin": {
		desc: "After each turn, this Pokemon has a 33% chance to heal itself from poison (including Toxic), paralysis, burn, freeze or sleep (including self-induced Rest).",
		shortDesc: "This Pokemon has a 33% chance to have its status cured at the end of each turn.",
		onResidualOrder: 5,
		onResidualSubOrder: 1,
		onResidual: function(pokemon) {
			if (pokemon.status && this.random(3) === 0) {
				this.debug('shed skin');
				this.add('-activate', pokemon, 'ability: Shed Skin');
				pokemon.cureStatus();
			}
		},
		id: "shedskin",
		name: "Shed Skin",
		rating: 4,
		num: 61
	},
	"sheerforce": {
		desc: "Raises the base power of all moves that have any secondary effects by 30%, but the secondary effects are ignored. However, this ability is not applied to moves that have a negative effect on the user, such as recoil, two-turn moves, and stat reduction after using certain moves. If a Pokemon with Sheer Force is holding a Life Orb and uses an attack that would be boosted by Sheer Force, then the move gains both boosts but the user receives no recoil damage.",
		shortDesc: "This Pokemon's attacks with secondary effects do 1.3x damage; nullifies the effects.",
		onModifyMove: function(move) {
			if (move.secondaries) {
				if (!move.basePowerModifier) move.basePowerModifier = 1;
				move.basePowerModifier *= 13/10;
				delete move.secondaries;
				move.negateSecondary = true;
			}
		},
		id: "sheerforce",
		name: "Sheer Force",
		rating: 4,
		num: 125
	},
	"shellarmor": {
		desc: "Critical Hits cannot strike this Pokemon.",
		shortDesc: "This Pokemon cannot be struck by a critical hit.",
		onCriticalHit: false,
		id: "shellarmor",
		name: "Shell Armor",
		rating: 1,
		num: 75
	},
	"shielddust": {
		desc: "If the opponent uses a move that has secondary effects that affect this Pokemon in addition to damage, the move's secondary effects will not trigger. (For example, an Ice Beam will lose its 10% chance to freeze this Pokemon.)",
		shortDesc: "This Pokemon is not affected by the secondary effect of another Pokemon's attack.",
		onTrySecondaryHit: function() {
			this.debug('Shield Dust prevent secondary');
			return null;
		},
		id: "shielddust",
		name: "Shield Dust",
		rating: 2,
		num: 19
	},
	"simple": {
		desc: "This Pokemon doubles all of its positive and negative stat modifiers. For example, if this Pokemon uses Curse, its Attack and Defense stats each receive a two-level increase while its Speed stat receives a two-level decrease.",
		shortDesc: "This Pokemon has its own stat boosts and drops doubled as they happen.",
		onBoost: function(boost) {
			for (var i in boost) {
				boost[i] *= 2;
			}
		},
		id: "simple",
		name: "Simple",
		rating: 4,
		num: 86
	},
	"skilllink": {
		desc: "When this Pokemon uses an attack that strikes multiple times in one turn, such as Fury Attack or Spike Cannon, such attacks will always strike for the maximum number of hits.",
		shortDesc: "This Pokemon's multi-hit attacks always hit the maximum number of times.",
		onModifyMove: function(move) {
			if (move.multihit && move.multihit.length) {
				move.multihit = move.multihit[1];
			}
		},
		id: "skilllink",
		name: "Skill Link",
		rating: 4,
		num: 92
	},
	"slowstart": {
		desc: "After this Pokemon switches into the battle, its Attack and Speed stats are halved for five turns; for example, if this Pokemon has an Attack stat of 400, it will effectively have an Attack stat of 200 until the effects of Slow Start wear off.",
		shortDesc: "On switch-in, this Pokemon's Attack and Speed are halved for 5 turns.",
		onStart: function(pokemon) {
			pokemon.addVolatile('slowstart');
		},
		effect: {
			duration: 5,
			onStart: function(target) {
				this.add('-start', target, 'Slow Start');
			},
			onModifyAtk: function(atk, pokemon) {
				if (pokemon.ability !== 'slowstart') {
					pokemon.removeVolatile('slowstart');
					return;
				}
				return atk / 2;
			},
			onModifySpe: function(spe, pokemon) {
				if (pokemon.ability !== 'slowstart') {
					pokemon.removeVolatile('slowstart');
					return;
				}
				return spe / 2;
			},
			onEnd: function(target) {
				this.add('-end', target, 'Slow Start');
			}
		},
		id: "slowstart",
		name: "Slow Start",
		rating: -2,
		num: 112
	},
	"sniper": {
		desc: "When this Pokemon lands a Critical Hit, the base power of its attack is tripled rather than doubled.",
		shortDesc: "If this Pokemon strikes with a critical hit, the damage is tripled instead of doubled.",
		onModifyMove: function(move) {
			move.critModifier = 3;
		},
		id: "sniper",
		name: "Sniper",
		rating: 1,
		num: 97
	},
	"snowcloak": {
		desc: "If active while Hail is in effect, this Pokemon's Evasion receives a 20% boost; if this Pokemon has a typing that would normally take damage from Hail, this Pokemon is also immune to Hail's damage.",
		shortDesc: "If Hail is active, this Pokemon's evasion is 1.25x; immunity to Hail.",
		onImmunity: function(type, pokemon) {
			if (type === 'hail') return false;
		},
		onAccuracy: function(accuracy) {
			if (typeof accuracy !== 'number') return;
			if (this.isWeather('hail')) {
				this.debug('Snow Cloak - decreasing accuracy');
				return accuracy * 0.8;
			}
		},
		id: "snowcloak",
		name: "Snow Cloak",
		rating: 0.5,
		num: 81
	},
	"snowwarning": {
		desc: "When this Pokemon enters the battlefield, it causes a permanent Hail that can only be stopped by Air Lock, Cloud Nine or another weather condition.",
		shortDesc: "On switch-in, this Pokemon summons Hail until another weather replaces it.",
		onStart: function(source) {
			this.setWeather('hail');
			this.weatherData.duration = 0;
		},
		id: "snowwarning",
		name: "Snow Warning",
		rating: 4.5,
		num: 117
	},
	"solarpower": {
		desc: "If this Pokemon is active while Sunny Day is in effect, its Special Attack temporarily receives a 50% boost but this Pokemon also receives damage equal to one-eighth of its max HP after each turn.",
		shortDesc: "If Sunny Day is active, this Pokemon's Sp. Atk is 1.5x and loses 1/8 max HP per turn.",
		onModifySpA: function(spa, pokemon) {
			if (this.isWeather('sunnyday')) {
				return spa * 1.5;
			}
		},
		onWeather: function(target, source, effect) {
			if (effect.id === 'sunnyday') {
				this.damage(target.maxhp/8);
			}
		},
		id: "solarpower",
		name: "Solar Power",
		rating: 1.5,
		num: 94
	},
	"solidrock": {
		desc: "This Pokemon receives one-fourth reduced damage from Super Effective attacks.",
		shortDesc: "This Pokemon receives 3/4 damage from super effective attacks.",
		onSourceBasePower: function(basePower, attacker, defender, move) {
			if (this.getEffectiveness(move.type, defender) > 0) {
				this.debug('Solid Rock neutralize');
				return basePower * 3/4;
			}
		},
		id: "solidrock",
		name: "Solid Rock",
		rating: 3,
		num: 116
	},
	"soundproof": {
		desc: "This Pokemon is immune to the effects of the sound-related moves Bug Buzz, Chatter, Echoed Voice, Grasswhistle, Growl, Heal Bell, Hyper Voice, Metal Sound, Perish Song, Relic Song, Roar, Round, Screech, Sing, Snarl, Snore, Supersonic, and Uproar.",
		shortDesc: "This Pokemon is immune to sound-based moves, except Heal Bell.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.isSoundBased) {
				this.add('-immune', target.id, '[msg]');
				return null;
			}
		},
		id: "soundproof",
		name: "Soundproof",
		rating: 2,
		num: 43
	},
	"speedboost": {
		desc: "While this Pokemon is active, its Speed increases by one stage at the end of every turn; the six stage maximum for stat boosts is still in effect.",
		shortDesc: "This Pokemon's Speed is boosted by 1 at the end of each full turn on the field.",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual: function(pokemon) {
			if (pokemon.activeTurns) {
				this.boost({spe:1});
			}
		},
		id: "speedboost",
		name: "Speed Boost",
		rating: 4.5,
		num: 3
	},
	"stall": {
		desc: "This Pokemon attacks last in its priority bracket.",
		shortDesc: "This Pokemon moves last among Pokemon using the same or greater priority moves.",
		onModifyPriority: function(priority) {
			return priority - 0.1;
		},
		id: "stall",
		name: "Stall",
		rating: -1,
		num: 100
	},
	"static": {
		desc: "If an opponent directly attacks this Pokemon, there is a 30% chance that the opponent will become paralyzed.",
		shortDesc: "30% chance of paralyzing a Pokemon making contact with this Pokemon.",
		onAfterDamage: function(damage, target, source, effect) {
			if (effect && effect.isContact) {
				if (this.random(10) < 3) {
					source.trySetStatus('par', target, effect);
				}
			}
		},
		id: "static",
		name: "Static",
		rating: 2,
		num: 9
	},
	"steadfast": {
		desc: "If this Pokemon is made to flinch, its Speed receives a one-level boost.",
		shortDesc: "If this Pokemon is made to flinch, its Speed is boosted by 1.",
		onFlinch: function(pokemon) {
			this.boost({spe: 1});
		},
		id: "steadfast",
		name: "Steadfast",
		rating: 1,
		num: 80
	},
	"stench": {
		desc: "Damaging moves have a 10% chance to flinch.",
		shortDesc: "This Pokemon's attacks without a chance to flinch have a 10% chance to flinch.",
		onModifyMove: function(move) {
			if (move.category !== "Status") {
				this.debug('Adding Stench flinch');
				if (!move.secondaries) move.secondaries = [];
				for (var i=0; i<move.secondaries.length; i++) {
					if (move.secondaries[i].volatileStatus === 'flinch') return;
				}
				move.secondaries.push({
					chance: 10,
					volatileStatus: 'flinch'
				});
			}
		},
		id: "stench",
		name: "Stench",
		rating: 0,
		num: 1
	},
	"stickyhold": {
		desc: "Opponents cannot remove items from this Pokemon.",
		shortDesc: "This Pokemon cannot lose its held item due to another Pokemon's attack.",
		onTakeItem: function(item, pokemon, source) {
			if (source && source !== pokemon) return false;
		},
		id: "stickyhold",
		name: "Sticky Hold",
		rating: 1,
		num: 60
	},
	"stormdrain": {
		desc: "During double battles, this Pokemon draws any single-target Water-type attack to itself. If an opponent uses an Water-type attack that affects multiple Pokemon, those targets will be hit. This ability does not affect Water Hidden Power, Judgment or Weather Ball. The user is immune to Water and its Special Attack is increased one stage when hit by one.",
		shortDesc: "This Pokemon draws Water moves to itself to boost Sp. Atk by 1; Water immunity.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.type === 'Water') {
				this.boost({spa:1});
				return null;
			}
		},
		onAnyRedirectTargetPriority: 1,
		onAnyRedirectTarget: function(target, source, source2, move) {
			if (move.type !== 'Water') return;
			if (this.validTarget(this.effectData.target, source, move.target)) {
				return this.effectData.target;
			}
		},
		id: "stormdrain",
		name: "Storm Drain",
		rating: 3.5,
		num: 114
	},
	"sturdy": {
		desc: "This Pokemon is immune to OHKO moves, and will survive with 1 HP if hit by an attack which would KO it while at full health.",
		shortDesc: "If this Pokemon is at full HP, it lives one hit with at least 1HP. OHKO moves fail on it.",
		onDamagePriority: -100,
		onDamage: function(damage, target, source, effect) {
			if (effect && effect.ohko) {
				this.add('-activate',target,'Sturdy');
				return 0;
			}
			if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move') {
				this.add('-activate',target,'Sturdy');
				return target.hp - 1;
			}
		},
		id: "sturdy",
		name: "Sturdy",
		rating: 3,
		num: 5
	},
	"suctioncups": {
		desc: "This Pokemon cannot be forced out.",
		shortDesc: "This Pokemon cannot be forced to switch out by another Pokemon's attack or item.",
		onDragOut: false,
		id: "suctioncups",
		name: "Suction Cups",
		rating: 2.5,
		num: 21
	},
	"superluck": {
		desc: "Raises the chance of this Pokemon scoring a Critical Hit.",
		shortDesc: "This Pokemon's critical hit ratio is boosted by 1.",
		onModifyMove: function(move) {
			move.critRatio++;
		},
		id: "superluck",
		name: "Super Luck",
		rating: 1,
		num: 105
	},
	"swarm": {
		desc: "When its health reaches one-third or less of its max HP, this Pokemon's Bug-type attacks receive a 50% boost in power.",
		shortDesc: "When this Pokemon has 1/3 or less of its max HP, its Bug attacks do 1.5x damage.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (move.type === 'Bug' && attacker.hp <= attacker.maxhp/3) {
				this.debug('Swarm boost');
				return basePower * 1.5;
			}
		},
		id: "swarm",
		name: "Swarm",
		rating: 2,
		num: 68
	},
	"swiftswim": {
		desc: "If this Pokemon is active while Rain Dance is in effect, its speed is temporarily doubled.",
		shortDesc: "If Rain Dance is active, this Pokemon's Speed is doubled.",
		onModifySpe: function(spe, pokemon) {
			if (this.isWeather('raindance')) {
				return spe * 2;
			}
		},
		id: "swiftswim",
		name: "Swift Swim",
		rating: 2,
		num: 33
	},
	"synchronize": {
		desc: "If an opponent burns, poisons or paralyzes this Pokemon, it receives the same condition.",
		shortDesc: "If another Pokemon burns/poisons/paralyzes this Pokemon, it also gets that status.",
		onAfterSetStatus: function(status, target, source) {
			if (!source || source === target) return;
			if (status.id === 'slp' || status.id === 'frz') return;
			source.trySetStatus(status);
		},
		id: "synchronize",
		name: "Synchronize",
		rating: 3,
		num: 28
	},
	"tangledfeet": {
		desc: "When this Pokemon is confused, its opponent's attacks have a 50% chance of missing.",
		shortDesc: "This Pokemon's evasion is doubled as long as it is confused.",
		onAccuracy: function(accuracy, target) {
			if (typeof accuracy !== 'number') return;
			if (target && target.volatiles['confusion']) {
				this.debug('Tangled Feet - decreasing accuracy');
				return accuracy * 0.5;
			}
		},
		id: "tangledfeet",
		name: "Tangled Feet",
		rating: 1,
		num: 77
	},
	"technician": {
		desc: "When this Pokemon uses an attack that has 60 Base Power or less, the move's Base Power receives a 50% boost. For example, a move with 60 Base Power effectively becomes a move with 90 Base Power.",
		shortDesc: "This Pokemon's attacks of 60 Base Power or less do 1.5x damage. Includes Struggle.",
		onBasePowerPriority: 10,
		onBasePower: function(basePower, attacker, defender, move) {
			if (basePower <= 60) {
				this.debug('Technician boost');
				return basePower * 1.5;
			}
		},
		id: "technician",
		name: "Technician",
		rating: 4,
		num: 101
	},
	"telepathy": {
		desc: "If a Pokemon has Telepathy, it will not take damage from its teammates' moves in double and triple battles.",
		shortDesc: "This Pokemon does not take damage from its allies' attacks.",
		onTryHit: function(target, source, move) {
			if (target.side === source.side && move.category !== 'Status') {
				this.add('-activate', target, 'ability: Telepathy');
				return null;
			}
		},
		id: "telepathy",
		name: "Telepathy",
		rating: 0,
		num: 140
	},
	"teravolt": {
		desc: "When this Pokemon becomes active, it nullifies the abilities of opposing active Pokemon that hinder this Pokemon's attacks. These abilities include Battle Armor, Clear Body, Damp, Dry Skin, Filter, Flash Fire, Flower Gift, Heatproof, Hyper Cutter, Immunity, Inner Focus, Insomnia, Keen Eye, Leaf Guard, Levitate, Lightningrod, Limber, Magma Armor, Marvel Scale, Motor Drive, Oblivious, Own Tempo, Sand Veil, Shell Armor, Shield Dust, Simple, Snow Cloak, Solid Rock, Soundproof, Sticky Hold, Storm Drain, Sturdy, Suction Cups, Tangled Feet, Thick Fat, Unaware, Vital Spirit, Volt Absorb, Water Absorb, Water Veil, White Smoke and Wonder Guard.",
		shortDesc: "This Pokemon's moves ignore the target's Ability if it could modify the effectiveness.",
		onStart: function(pokemon) {
			this.add('-ability', pokemon, 'Teravolt');
		},
		onAllyModifyPokemon: function(pokemon) {
			if (this.activePokemon === this.effectData.target && pokemon !== this.activePokemon) {
				pokemon.ignore['Ability'] = 'A';
			}
		},
		onFoeModifyPokemon: function(pokemon) {
			if (this.activePokemon === this.effectData.target) {
				pokemon.ignore['Ability'] = 'A';
			}
		},
		id: "teravolt",
		name: "Teravolt",
		rating: 3,
		num: 164
	},
	"thickfat": {
		desc: "This Pokemon receives halved damage from Ice-type and Fire-type attacks.",
		shortDesc: "This Pokemon receives half damage from Fire- and Ice-type attacks.",
		onSourceBasePower: function(basePower, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Thick Fat weaken');
				return basePower / 2;
			}
		},
		id: "thickfat",
		name: "Thick Fat",
		rating: 3,
		num: 47
	},
	"tintedlens": {
		desc: "Doubles the power of moves that are Not Very Effective against opponents.",
		shortDesc: "This Pokemon's attacks that are not very effective on a target do double damage.",
		onBasePowerPriority: -100,
		onBasePower: function(basePower, attacker, defender, move) {
			if (this.getEffectiveness(move.type, defender) < 0) {
				this.debug('Tinted Lens boost');
				return basePower * 2;
			}
		},
		id: "tintedlens",
		name: "Tinted Lens",
		rating: 4,
		num: 110
	},
	"torrent": {
		desc: "When its health reaches one-third or less of its max HP, this Pokemon's Water-type attacks receive a 50% boost in power.",
		shortDesc: "When this Pokemon has 1/3 or less of its max HP, its Water attacks do 1.5x damage.",
		onBasePower: function(basePower, attacker, defender, move) {
			if (move.type === 'Water' && attacker.hp <= attacker.maxhp/3) {
				this.debug('Torrent boost');
				return basePower * 1.5;
			}
		},
		id: "torrent",
		name: "Torrent",
		rating: 2,
		num: 67
	},
	"toxicboost": {
		desc: "When the user is poisoned, its Attack stat is raised by 50%.",
		shortDesc: "When this Pokemon is poisoned, its physical attacks do 1.5x damage.",
		onBasePower: function(basePower, attacker, defender, move) {
			if ((attacker.status === 'psn' || attacker.status === 'tox') && move.category === 'Physical') {
				return basePower * 1.5;
			}
		},
		id: "toxicboost",
		name: "Toxic Boost",
		rating: 3,
		num: 137
	},
	"trace": {
		desc: "When this Pokemon enters the field, it temporarily copies an opponent's ability (except Multitype). This ability remains with this Pokemon until it leaves the field.",
		shortDesc: "On switch-in, or when it can, this Pokemon copies a random adjacent foe's Ability.",
		onUpdate: function(pokemon) {
			var target = pokemon.side.foe.randomActive();
			if (!target) return;
			var ability = this.getAbility(target.ability);
			var bannedAbilities = {flowergift:1, forecast:1, illusion:1, imposter:1, multitype:1, trace:1, zenmode:1};
			if (bannedAbilities[target.ability]) {
				return;
			}
			if (pokemon.setAbility(ability)) {
				this.add('-ability',pokemon, ability,'[from] ability: Trace','[of] '+target);
			}
		},
		id: "trace",
		name: "Trace",
		rating: 3.5,
		num: 36
	},
	"truant": {
		desc: "After this Pokemon is switched into battle, it skips every other turn.",
		shortDesc: "This Pokemon skips every other turn instead of using a move.",
		onBeforeMove: function(pokemon, target, move) {
			if (pokemon.removeVolatile('truant')) {
				this.add('cant',pokemon,'ability: Truant', move);
				pokemon.movedThisTurn = true;
				return false;
			}
			pokemon.addVolatile('truant');
		},
		effect: {
			duration: 2
		},
		id: "truant",
		name: "Truant",
		rating: -2,
		num: 54
	},
	"turboblaze": {
		desc: "When this Pokemon becomes active, it nullifies the abilities of opposing active Pokemon that hinder this Pokemon's attacks. These abilities include Battle Armor, Clear Body, Damp, Dry Skin, Filter, Flash Fire, Flower Gift, Heatproof, Hyper Cutter, Immunity, Inner Focus, Insomnia, Keen Eye, Leaf Guard, Levitate, Lightningrod, Limber, Magma Armor, Marvel Scale, Motor Drive, Oblivious, Own Tempo, Sand Veil, Shell Armor, Shield Dust, Simple, Snow Cloak, Solid Rock, Soundproof, Sticky Hold, Storm Drain, Sturdy, Suction Cups, Tangled Feet, Thick Fat, Unaware, Vital Spirit, Volt Absorb, Water Absorb, Water Veil, White Smoke and Wonder Guard.",
		shortDesc: "This Pokemon's moves ignore the target's Ability if it could modify the effectiveness.",
		onStart: function(pokemon) {
			this.add('-ability', pokemon, 'Turboblaze');
		},
		onAllyModifyPokemon: function(pokemon) {
			if (this.activePokemon === this.effectData.target && pokemon !== this.activePokemon) {
				pokemon.ignore['Ability'] = 'A';
			}
		},
		onFoeModifyPokemon: function(pokemon) {
			if (this.activePokemon === this.effectData.target) {
				pokemon.ignore['Ability'] = 'A';
			}
		},
		id: "turboblaze",
		name: "Turboblaze",
		rating: 3,
		num: 163
	},
	"unaware": {
		desc: "This Pokemon ignores an opponent's stat boosts for Attack, Defense, Special Attack and Special Defense. These boosts will still be calculated if this Pokemon uses Punishment.",
		shortDesc: "This Pokemon ignores other Pokemon's stat changes when taking or doing damage.",
		id: "unaware",
		name: "Unaware",
		onModifyMove: function(move, user, target) {
			move.ignoreEvasion = true;
			move.ignoreDefensive = true;
		},
		onSourceModifyMove: function(move, user, target) {
			move.ignoreAccuracy = true;
			move.ignoreOffensive = true;
		},
		rating: 2,
		num: 109
	},
	"unburden": {
		desc: "Increases Speed by one level if this Pokemon loses its held item through usage (i.e. Berries) or via Thief, Knock Off, etc.",
		shortDesc: "Speed is doubled on held item loss; boost is lost if it switches, gets new item/Ability.",
		onUseItem: function(item, pokemon) {
			pokemon.addVolatile('unburden');
		},
		onTakeItem: function(item, pokemon) {
			pokemon.addVolatile('unburden');
		},
		effect: {
			onModifySpe: function(spe, pokemon) {
				if (pokemon.ability !== 'unburden') {
					pokemon.removeVolatile('unburden');
					return;
				}
				if (!pokemon.item) {
					return spe * 2;
				}
			}
		},
		id: "unburden",
		name: "Unburden",
		rating: 3.5,
		num: 84
	},
	"unnerve": {
		desc: "Opposing Pokemon can't eat their Berries.",
		shortDesc: "While this Pokemon is active, prevents opposing Pokemon from using their Berries.",
		onStart: function(pokemon) {
			this.add('-ability',pokemon,'Unnerve',pokemon.side.foe);
		},
		onFoeEatItem: false,
		id: "unnerve",
		name: "Unnerve",
		rating: 1,
		num: 127
	},
	"victorystar": {
		desc: "Raises every friendly Pokemon's Accuracy, including this Pokemon's, by 10% (multiplied).",
		shortDesc: "This Pokemon and its allies' moves have their accuracy boosted to 1.1x.",
		onAllyModifyMove: function(move) {
			if (typeof move.accuracy === 'number') {
				move.accuracy *= 1.1;
			}
		},
		id: "victorystar",
		name: "Victory Star",
		rating: 2,
		num: 162
	},
	"vitalspirit": {
		desc: "This Pokemon cannot be put to sleep; this includes both opponent-induced sleep as well as user-induced sleep via Rest.",
		shortDesc: "This Pokemon cannot fall asleep. Gaining this Ability while asleep cures it.",
		onUpdate: function(pokemon) {
			if (pokemon.status === 'slp') {
				pokemon.cureStatus();
			}
		},
		onImmunity: function(type) {
			if (type === 'slp') return false;
		},
		id: "vitalspirit",
		name: "Vital Spirit",
		rating: 2,
		num: 72
	},
	"voltabsorb": {
		desc: "When an Electric-type attack hits this Pokemon, it recovers 25% of its max HP.",
		shortDesc: "This Pokemon heals 1/4 of its max HP when hit by Electric moves; Electric immunity.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				var d = target.heal(target.maxhp/4);
				this.add('-heal',target,d+target.getHealth(),'[from] ability: Volt Absorb');
				return null;
			}
		},
		id: "voltabsorb",
		name: "Volt Absorb",
		rating: 3.5,
		num: 10
	},
	"waterabsorb": {
		desc: "When a Water-type attack hits this Pokemon, it recovers 25% of its max HP.",
		shortDesc: "This Pokemon heals 1/4 of its max HP when hit by Water moves; Water immunity.",
		onTryHit: function(target, source, move) {
			if (target !== source && move.type === 'Water') {
				var d = target.heal(target.maxhp/4);
				this.add('-heal',target,d+target.getHealth(),'[from] ability: Water Absorb');
				return null;
			}
		},
		id: "waterabsorb",
		name: "Water Absorb",
		rating: 3.5,
		num: 11
	},
	"waterveil": {
		desc: "This Pokemon cannot become burned.",
		shortDesc: "This Pokemon cannot be burned. Gaining this Ability while burned cures it.",
		onUpdate: function(pokemon) {
			if (pokemon.status === 'brn') {
				pokemon.cureStatus();
			}
		},
		onImmunity: function(type, pokemon) {
			if (type === 'brn') return false;
		},
		id: "waterveil",
		name: "Water Veil",
		rating: 1.5,
		num: 41
	},
	"weakarmor": {
		desc: "Causes physical moves to lower the Pokemon's Defense and increase its Speed stat by one stage.",
		shortDesc: "If a physical attack hits this Pokemon, Defense is lowered 1 and Speed is boosted 1.",
		onAfterDamage: function(damage, target, source, move) {
			if (move.category === 'Physical') {
				this.boost({spe:1, def:-1});
			}
		},
		id: "weakarmor",
		name: "Weak Armor",
		rating: 0,
		num: 133
	},
	"whitesmoke": {
		desc: "Opponents cannot reduce this Pokemon's stats; they can, however, modify stat changes with Power Swap, Guard Swap and Heart Swap and inflict stat boosts with Swagger and Flatter. This ability does not prevent self-inflicted stat reductions. [Field Effect]\u00a0If this Pokemon is in the lead spot, the rate of wild Pokemon battles decreases by 50%.",
		shortDesc: "Prevents other Pokemon from lowering this Pokemon's stat stages.",
		onBoost: function(boost, target, source) {
			if (!source || target === source) return;
			for (var i in boost) {
				if (boost[i] < 0) {
					delete boost[i];
					this.add("-message", target.name+"'s stats were not lowered! (placeholder)");
				}
			}
		},
		id: "whitesmoke",
		name: "White Smoke",
		rating: 2,
		num: 73
	},
	"wonderguard": {
		desc: "This Pokemon only receives damage from attacks belonging to types that cause Super Effective to this Pokemon. Wonder Guard does not protect a Pokemon from status ailments (burn, freeze, paralysis, poison, sleep, Toxic or any of their side effects or damage), recoil damage nor the moves Beat Up, Bide, Doom Desire, Fire Fang, Future Sight, Hail, Leech Seed, Sandstorm, Spikes, Stealth Rock and Struggle. Wonder Guard cannot be Skill Swapped nor Role Played. Trace, however, does copy Wonder Guard.",
		shortDesc: "This Pokemon can only be damaged by super effective moves and indirect damage.",
		onDamagePriority: 10,
		onDamage: function(damage, target, source, effect) {
			if (effect.effectType !== 'Move') return;
			if (effect.type === '???' || effect.id === 'Struggle') return;
			this.debug('Wonder Guard immunity: '+effect.id);
			if (this.getEffectiveness(effect.type, target) <= 0) {
				this.add('-activate',target,'ability: Wonder Guard');
				return null;
			}
		},
		onSubDamage: function(damage, target, source, effect) {
			if (effect.effectType !== 'Move') return;
			if (target.negateImmunity[effect.type]) return;
			this.debug('Wonder Guard immunity: '+effect.id);
			if (this.getEffectiveness(effect.type, target) <= 0) {
				this.add('-activate',target,'ability: Wonder Guard');
				return null;
			}
		},
		id: "wonderguard",
		name: "Wonder Guard",
		rating: 5,
		num: 25
	},
	"wonderskin": {
		desc: "Causes the chance of a status move working to be halved. It does not affect moves that inflict status as a secondary effect like Thunder's chance to paralyze.",
		shortDesc: "All status moves with a set % accuracy are 50% accurate if used on this Pokemon.",
		onAccuracyPriority: 10,
		onAccuracy: function(accuracy, target, source, move) {
			if (move.category === 'Status' && typeof move.accuracy === 'number') {
				this.debug('Wonder Skin - setting accuracy to 50');
				return 50;
			}
		},
		id: "wonderskin",
		name: "Wonder Skin",
		rating: 1,
		num: 147
	},
	"zenmode": {
		desc: "When Darmanitan's HP drops to below half, it will enter Zen Mode at the end of the turn. If it loses its ability, or recovers HP to above half while in Zen mode, it will change back. This ability only works on Darmanitan, even if it is copied by Role Play, Entrainment, or swapped with Skill Swap.",
		shortDesc: "If this Pokemon is Darmanitan, it changes to Zen Mode whenever it is below half HP.",
		onResidualOrder: 27,
		onResidual: function(pokemon) {
			if (pokemon.baseTemplate.species !== 'Darmanitan') {
				return;
			}
			if (pokemon.hp <= pokemon.maxhp/2 && pokemon.template.speciesid==='darmanitan'){
				pokemon.addVolatile('zenmode');
			} else if (pokemon.hp > pokemon.maxhp/2 && pokemon.template.speciesid==='darmanitanzen') {
				pokemon.removeVolatile('zenmode');
			}
		},
		effect: {
			onStart: function(pokemon) {
				if (pokemon.transformInto('Darmanitan-Zen')) {
					pokemon.transformed = false;
					this.add('-formechange', pokemon, 'Darmanitan-Zen');
					this.add('-message', 'Zen Mode triggered! (placeholder)');
				} else {
					return false;
				}
			},
			onEnd: function(pokemon) {
				if (pokemon.transformInto('Darmanitan')) {
					pokemon.transformed = false;
					this.add('-formechange', pokemon, 'Darmanitan');
					this.add('-message', 'Zen Mode ended! (placeholder)');
				} else {
					return false;
				}
			},
			onUpdate: function(pokemon) {
				if (pokemon.ability !== 'zenmode') {
					pokemon.transformed = false;
					pokemon.removeVolatile('zenmode');
				}
			}
		},
		id: "zenmode",
		name: "Zen Mode",
		rating: -1,
		num: 161
	},

	// CAP
	"mountaineer": {
		desc: "This Pokémon avoids all Rock-type attacks and hazards when switching in.",
		shortDesc: "On switch-in, this Pokemon avoids all Rock-type attacks and Stealth Rock.",
		onDamage: function(damage, target, source, effect) {
			if (effect && effect.id === 'stealthrock') {
				return false;
			}
		},
		onImmunity: function(type, target) {
			if (type === 'Rock' && !target.activeTurns) {
				return false;
			}
		},
		id: "mountaineer",
		isNonstandard: true,
		name: "Mountaineer",
		rating: 3.5,
		num: -2
	},
	"rebound": {
		desc: "It can reflect the effect of status moves when switching in.",
		shortDesc: "On switch-in, this Pokemon blocks certain status moves and uses the move itself.",
		id: "rebound",
		isNonstandard: true,
		name: "Rebound",
		onAllyTryFieldHit: function(target, source, move) {
			if (target === source) return;
			if (this.effectData.target.activeTurns) return;
			if (typeof move.isBounceable === 'undefined') {
				move.isBounceable = !!(move.status || move.forceSwitch);
			}
			if (move.target !== 'foeSide' && target !== this.effectData.target) {
				return;
			}
			if (this.pseudoWeather['magicbounce']) {
				return;
			}
			if (move.isBounceable) {
				this.addPseudoWeather('magicbounce');
				this.add('-activate', target, 'ability: Rebound', move, '[of] '+source);
				this.moveHit(source, source, move);
				return null;
			}
		},
		effect: {
			duration: 1
		},
		rating: 4.5,
		num: -3
	},
	"persistent": {
		desc: "Increases the duration of many field effects by two turns when used by this Pokémon.",
		shortDesc: "The duration of certain field effects is increased by 2 turns if used by this Pokemon.",
		id: "persistent",
		isNonstandard: true,
		name: "Persistent",
		// implemented in the corresponding move
		rating: 4,
		num: -4
	}
};
