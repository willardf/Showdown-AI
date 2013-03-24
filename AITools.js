var ToolsMod = require('./Tools.js');
var Tools = ToolsMod.Tools;
var TypeChart = require('./data/typechart.js').BattleTypeChart;

module.exports.argMax = function(set){
	y = 0;
	x = set[0];
	for (i in set) {
		if (x < set[i]) 
		{ 
			x = set[i]; y = i; 
		}
	}
	return y;
}
module.exports.maxVal = function(set){
	x = set[0];
	for (i in set) if (x < set[i]) x = set[i];
	return x;
}


function getDamageMod(typeA, type1, type2){
	if (!typeA || !type1) return 1;
	var yT = type1.charAt(0).toUpperCase() + type1.slice(1);
	var mT = typeA.charAt(0).toUpperCase() + typeA.slice(1);
	
	var dm = TypeChart[yT].damageTaken[mT];
	var damageMod = (dm == 0 ? 1 : (dm == 1 ? 2 : (dm == 2 ? .5 : 0)));
	
	if (type2) {
		var yT2 = type2.charAt(0).toUpperCase() + type2.slice(1);
		
		dm = TypeChart[yT2].damageTaken[mT];
		damageMod *= (dm == 0 ? 1 : (dm == 1 ? 2 : (dm == 2 ? .5 : 0)));
	}
	return damageMod;
};

function getSTAB(typeA, type1, type2){
	return ((typeA.toLowerCase() == type1) || 
		(typeA.toLowerCase() == type2)) ? 1.5 : 1;
}

function damageCalc(move, yourSide, defSide, yourPoke, defPoke, weather){	
	if (!move.type) return 0;
	if (!yourPoke || !defPoke) return 65;
	var damage = 0;
	var power = move.basePower;
	var mod1 = 1.0;
	
	if (weather == 'raindance' && move.type == 'water' ||
		weather == 'sunnyday' && move.type == 'fire') mod1 = 1.5;
	else if (weather == 'raindance' && move.type == 'fire' ||
		weather == 'sunnyday' && move.type == 'water') mod1 = 0.5;

	
	var stab = getSTAB(move.type, yourPoke.types[0], yourPoke.types[1]);
	var typemod = getDamageMod(move.type, defPoke.types[0], defPoke.types[1]);
	
	if (move.category == "Special"){
		mod1 *= 'lightscreen' in defSide.sideConditions ? .5 : 1.0;
		atk = yourPoke.getStat('spa');
		def = defPoke.getStat('spd');
	} 
	else if (move.category == "Physical"){
		// Ignore guts
		mod1 *= yourPoke.status == 'brn' ? .5 : 1;
		mod1 *= 'reflect' in defSide.sideConditions ? .5 : 1
		atk = yourPoke.getStat('atk');
		def = defPoke.getStat('def');
	}
	else return 0; // Support move
	damage = ((((42 * power * atk / 50) / def) * mod1) + 2) * stab * typemod;
	if (isNaN(damage)) damage = 0; // power might not be defined
	return damage
}

function worstCaseDamage(battle, yourPoke, defPoke, statOut){
	if (!yourPoke || !defPoke) return 0;
	
	// This might be slow...
	// Copy-pasting damage calc would speed it up
	
	var move = {}
	var dmg = 0;
	for(midx in yourPoke.learnset)
	{		
		m = Tools.getMove(midx);
		if (!m.basePower) continue;
		d = damageCalc(m, battle.yourSide, battle.mySide, yourPoke, defPoke, battle.weather) 
		if (d >= dmg) {
			move = m;
			dmg = d;
		}
	}
	if (statOut && move.category == 'Physical') statOut.stat = 'def';
	if (statOut && move.category == 'Special') statOut.stat = 'spd';
	return dmg;
};
module.exports.damageCalc = damageCalc;
module.exports.getDamageMod = getDamageMod;
module.exports.getSTAB = getSTAB;
module.exports.worstCaseDamage = worstCaseDamage;