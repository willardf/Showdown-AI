var ToolsMod = require('./Tools.js');
var Tools = ToolsMod.Tools;
var AITools = require('./AITools.js');
var fs = require('fs');
var $ = require('jquery');
require('./sylvester.src.js');
var lastAction;

function GreedyMove(battle, action, pokemon){
	var output = 0;
	
	var yourPoke = battle.yourSide.active[0];
	var myPoke = pokemon || battle.mySide.active[0];
	var move = Tools.getMove(action.id);
	
	var damageMod = (yourPoke && move.type) ? AITools.getDamageMod(move.type, yourPoke.types[0], yourPoke.types[1]) : 1;
	var basepower = move.basePower ? move.basePower : 0;
	
	stab = move.type ? (AITools.getSTAB(move.type, myPoke.types[0], myPoke.types[1]) + 1) : 1;
	spd = yourPoke ? yourPoke.baseStats.spd : 1;
	def = yourPoke ? yourPoke.baseStats.def : 1;
	
	if (move.category == "Special") 
		output = basepower * myPoke.baseStats.spa / spd * stab * damageMod;
	else if (move.category == "Physical") 
		output = basepower * myPoke.baseStats.atk / def * stab * damageMod;
	
	if (!isNaN(move.accuracy)) output *= move.accuracy / 100.0;
	
	return {'type': "move", 'id': action.id, 'val': output};
}

var GreedySwitch = function(battle, action){
	var output = 0.0;
	var myPoke = battle.mySide.pokemon[action.idx];
	
	temp = []
	for (move in myPoke.moves) temp.push( GreedyMove(battle, {'type': 'move', id: myPoke.moves[move]}, myPoke) );
	
	output = maxVal(temp) * ((lastAction && lastAction.type == "switch") ? .8 : 1);
	return {'type': "switch", 'idx': action.idx, 'id': myPoke.species, 'val': output};
}

function calcVal(battle, action){
	if (action.type != 'switch') return GreedyMove(battle, action);
	else return GreedySwitch(battle, action);
};

function argMax(set){
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
function maxVal(set){
	x = set[0];
	for (i in set) if (x < set[i]) x = set[i];
	return x;
}

module.exports.postGame = function(){
	
}
module.exports.addWin = function(battle){
	appendData(battle);
}
module.exports.addLose = function(battle){
	appendData(battle);
}
function appendData(battle) {	
	if (norecord) return;
	lastAction = null;
	
	var dmg = 0.0;
	for( p in battle.mySide.pokemon){
		var poke = battle.mySide.pokemon[p];
		dmg -= poke.hp / (1.0 * poke.maxhp);
	}
	for( p in battle.yourSide.pokemon){
		var poke = battle.yourSide.pokemon[p];
		dmg += poke.hp / (1.0 * poke.maxhp);
	}
	// Unrevealed pokemon are at full health
	dmg -= battle.yourSide.totalPokemon - battle.yourSide.pokemon.length;
	console.log(battle.yourSide.totalPokemon + "=t\tl=" + battle.yourSide.pokemon.length);
	
	var output = "," + dmg;
	fs.appendFileSync(randomFile, output);
	console.log("Wrote to: " + randomFile);
}

module.exports.chooseMove = function(room, actions)
{	
	for (i = actions.length -1; i > -1; i--) 
	if (actions[i].id == undefined && actions[i].idx == undefined){
		console.log("Pruned:" + i);
		actions.splice(i,1)
	}
	
	qVals = []
	for (i in actions)
	{
		qv = calcVal(room.battle, actions[i]);
		qVals.push(qv);
	}
	
	q = qVals[0];
	if (randomFlag)
	{
		random = Math.floor(Math.random() * qVals.length);
		q = qVals[random];
	}
	else
	{
		var temp = []
		for (i in qVals) temp.push(qVals[i].val);
		q = qVals[argMax(temp)];
	}
		
	lastAction = q;
	if (q.type != "switch")
	{
		console.log("Using " + q.id);
		room.formUseMove(q.id);
	}else{
		console.log("Switching to " + q.idx +": " + q.id);
		room.formSwitchTo(q.idx);
	}
	console.log();
};

module.exports.SaveState = function()
{
};
var norecord = false;
var randomFile = "data.csv";
var randomFlag = false;
if (process.argv.length > 2)
{
	for (i = 2; i < process.argv.length; i++)
	{
		var arg = process.argv[i];	
		switch(arg.slice(1))
		{
			case 'norecord':
				norecord = true;
				console.log('Not saving data.');
				break;
			case 'random':
				console.log("Random mode enabled");
				randomFlag = true;
				break;
			default:
				if (arg.indexOf("output") == 1)
				{
					randomFile = arg.split(":")[1];
					console.log("Saving data to: " + randomFile);
				}
				break;
		}
	
	}
}
