var ToolsMod = require('./Tools.js');
var Tools = ToolsMod.Tools;
var AITools = require('./AITools.js');
var fs = require('fs');
var $ = require('jquery');

// Hack for undefined object.length
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// Uses Pseudo-static member model.BitArrayMembers
// If we start using bit arrays for anything but pokemon, we could overflow our int.
function BitArray(){
	this.keys = model.BitArrayKeys;
	this.shift = 0; for (k in this.keys) this.shift += this.keys[k].width;
	this.data = 0;
	this.set = function(key, value, maxValue)
	{
		if (isNaN(value)) value = 0;
		//if (isNaN(maxValue)) maxValue = 1;
		if (!(key in this.keys))
		{
			var width = Math.floor(Math.log(maxValue) / Math.log(2)) + 1;
			this.keys[key] = {'shift':this.shift, 'width':width};
			this.shift += width;
		}
		this.data |= value << this.keys[key].shift;
	}
	this.get = function(key)
	{
		if (!(key in this.keys)) throw "Key not valid";
		var mask = this.keys[key].width << this.keys[key].shift;
		
		value = (this.data & (mask)) >> this.keys[key].shift
		
		return value;
	}
}

// Returns {mySide:[BitArray-per-pokemon], yourSide:[BitArray-per-pokemon]}
function DehashState(state){
	var output = {myPokemon:[], yourPokemon:[]};
	var split = state.split(',');
	for (i = 0; i < 6; i++){
		p = new BitArray()
		p.data = +split[i];
		output.myPokemon.push(p);
	}
	for (i = 6; i < split.length; i++){
		p = new BitArray()
		p.data = +split[i];
		output.yourPokemon.push(p);
	}
	return output
}

// Returns a number representing a pokemon's state
function HashPokemon(pokemon, isActive){
	var output = new BitArray();
	
	if (isActive) output.set('active', 1, 1);
	var c_numHpBuckets = 4;
	percenthp = pokemon.hp / pokemon.maxhp * 100;
	bucketHP = Math.floor(percenthp / (101 / c_numHpBuckets));
	output.set('hp', bucketHP, c_numHpBuckets);
	
	var c_numStatBuckets = 4;
	bucketAtk = Math.floor(pokemon.baseStats.atk / (256 / c_numStatBuckets));
	output.set('atk', bucketAtk, c_numStatBuckets);
	bucketDef = Math.floor(pokemon.baseStats.def / (256 / c_numStatBuckets));
	output.set('def', bucketDef, c_numStatBuckets);
	bucketSpA = Math.floor(pokemon.baseStats.spa / (256 / c_numStatBuckets));
	output.set('spa', bucketSpA, c_numStatBuckets);
	bucketSpD = Math.floor(pokemon.baseStats.spd / (256 / c_numStatBuckets));
	output.set('spd', bucketSpD, c_numStatBuckets);
	
	types = {"None": 0, "Dark": 1, "Dragon": 2, "Electric": 3, "Fighting": 4, "Fire": 5, "Flying": 6, "Ghost": 7, "Grass": 8, "Ground": 9,"Ice": 10, "Normal": 11, "Poison": 12, "Psychic": 13, "Rock": 14, "Steel": 15, "Water": 16, "Bug": 17};
	type1 = pokemon.types[0][0].toUpperCase() + pokemon.types[0].slice(1);
	output.set('type1', types[type1], Object.size(types));
	if (pokemon.types[1]){
		type2 = pokemon.types[1][0].toUpperCase() + pokemon.types[1].slice(1);
		output.set('type2', types[type2], Object.size(types));
	} else output.set('type2', types.length, Object.size(types)); // Set none
	
	statuses = {'': 0, 'psn' : 1, 'slp': 2, 'tox': 3, 'brn': 4, 'frz': 5}
	output.set('status', statuses[pokemon.status], Object.size(statuses));
	
	return output.data;
}

// Returns twelve pokemon state numbers joined by ,
function HashState(battle){
	var hashVal = '';
	
	myPokes = battle.mySide.pokemon.slice(0);
	myPokes.sort(function (a, b) {  return ((a.species < b.species) ? -1 : ((a.species > b.species) ? 1 : 0)); });

	myActive = battle.mySide.active[0];
	for (pIdx in myPokes)
	{
		active = false;
		if (myActive) active = (myPokes[pIdx].species == myActive.species);
		myPokes[pIdx] = HashPokemon(myPokes[pIdx], active );
	}
	
	yourPokes = battle.yourSide.pokemon.slice(0);
	yourPokes.sort(function (a, b) {  return ((a.species < b.species) ? -1 : ((a.species > b.species) ? 1 : 0)); });
	
	yourActive = battle.yourSide.active[0];
	for (pIdx in yourPokes)
	{
		active = false;
		if (yourActive) active = (yourPokes[pIdx].species == yourActive.species);
		yourPokes[pIdx] = HashPokemon(yourPokes[pIdx], active);
	}
	var output = myPokes.join() + "," + yourPokes.join();
	console.log(output);
	return output;
}

// Contains a list of states in tree, and a transition 
// function that isn't really necessary. Should be rolled into state list
function ModelStruct(){
	this.BitArrayKeys = {}
	this.wins = 0;
	this.loses = 0;
	// transition[state][action][statep] = #visits
	this.transition = {};
	// state: {cumulative reward, cnt}
	this.states = {};
	// Returns possible states and their visit numbers
	this.getTransitionProb = function(state, action) {
		if ((state in this.transition) && (action in this.transition[state]))
		{
			return this.transition[state][action];
		}
		return [];
	}
	this.addTransition = function(state, action, statep){
		if (!(state in this.transition)) this.transition[state] = {};
		if (!(action in this.transition[state])) this.transition[state][action] = {};
		if (!(statep in this.transition[state][action])) this.transition[state][action][statep] = 0;
		
		this.transition[state][action][statep]++;
	}
	this.getActionCount = function(state, action){
		output = 0;
		if ((state in this.transition) && (action in this.transition[state])) {
			for (idx in this.transition[state][action]) {
				output += this.transition[state][action][idx];
			}
		}
		return output;
	}
	this.addState = function(state, reward){
		if (state in this.states)
			this.states[state].reward = (this.states[state].reward * this.states[state].count + reward) / (this.states[state].count + 1);
		else
			this.states[state] = {'reward': reward, 'count':0};
		this.states[state].count++;
	}
	this.reward = function(state)
	{
		battle = DehashState(state); // battle.(my/your)Pokemon = [BitArrays]
		output = 0;
		for( p in battle.myPokemon){
			output += battle.myPokemon[p].get('hp');
		}
		for( p in battle.yourPokemon){
			output -= battle.yourPokemon[p].get('hp');
		}
		output -= 6 - battle.yourPokemon.length;
		return output;
	}
	
	this.fold = function(coeff){
		// TODO
	}
}

var model = new ModelStruct();
var firstStateAction; // Action to add to our "tree"
var nodesToUpdate = []; // Nodes to update the reward of
var cumulativeReward = 0;
var lastState, lastAction;

function randomInt(){
	var bytes = require('crypto').randomBytes(4);
	var inter = bytes[0] + 
		(bytes[1] << 8) + (bytes[2] << 16) + (bytes[3] << 24);
	return inter > 0 ? inter : -inter;
}
function argMax(set){
	y = 0;
	x = set[0];
	for (i in set) if (x < set[i]) { x = set[i]; y = i; }
	return y;
}
function maxVal(set){
	x = set[0];
	for (i in set) if (x < set[i]) x = set[i];
	return x;
}

// Runs just before next game. After add(Win/Lose)
module.exports.postGame = function(){
	if (!learn) return;

	// firstStateAction can be null if we never leave the tree...
	// It doesn't hurt anything, so it almost seems useful?
	model.addState(firstStateAction, cumulativeReward);
	
	for (idx in nodesToUpdate)
		model.addState(nodesToUpdate[idx], cumulativeReward);
	
	nodesToUpdate = [];
	firstStateAction = null;
	cumulativeReward = 0;
}
module.exports.addWin = function(){
	model.wins++;
	cumulativeReward = 10;
}
module.exports.addLose = function(){
	model.loses++;
	cumulativeReward = -1;//-1;
}

module.exports.chooseMove = function(room, actions){	
	var c_c = 10; // expected horizon?
	var currentstate = HashState(room.battle);
	
	cumulativeReward += model.reward(currentstate);
	console.log(cumulativeReward);
	
	if (currentstate in model.states)
	{ // Tree policy
		nodesToUpdate.push(currentstate);
		qVals = []
		for (actIdx in actions)
		{
			var action = actions[actIdx];
				
			q = model.states[currentstate].reward;
			cnt = model.states[currentstate].count;
			actCnt = model.getActionCount(currentstate, action.id);
			if (greedy)
				ex = 0;
			else
				ex = c_c * Math.sqrt(Math.log(cnt) / actCnt);
			
			qVals.push(q+ex);
		}
		currentaction = actions[argMax(qVals)];
	}
	else
	{
		if (!firstStateAction) firstStateAction = currentstate;
		
		rIdx = Math.floor(Math.random() * actions.length);
		currentaction = actions[rIdx];
	}
	
	// Learning
	if (lastState && learn) {
		model.addTransition(lastState, lastAction, currentstate);
	}	
	
	lastAction = currentaction.id;
	lastState = currentstate;
	if (currentaction.type != "switch")
	{
		console.log("Using " + currentaction.id);
		room.formUseMove(currentaction.id);
	}else{
		console.log("Switching to " + currentaction.idx + ": " + currentaction.id);
		room.formSwitchTo(currentaction.idx);
	}
	console.log();
};

module.exports.SaveState = function(){	
	if (learn)
	{
		if (fs.existsSync(randomFile))
		{
			fs.unlinkSync(randomFile);
		}
		
		lastAction = null;
		var output = model;
		var fd = fs.writeFileSync(randomFile, JSON.stringify(output));
		console.log("Wrote to: " + randomFile);
	}
};

function loadState(filename){
	if (fs.existsSync(filename))
	{
		console.log("Loading " + filename);
		var data = JSON.parse(fs.readFileSync(filename, 'utf8'));
		model = $.extend(true, new ModelStruct(), data);
	}
}

var randomFile = "aidata" + randomInt() + ".json";
var glie = false;
var greedy = false;
var learn = true;
if (process.argv.length > 2){
	for (i = 2; i < process.argv.length; i++)
	{
		var arg = process.argv[i];
		if (arg.indexOf('-') < 0){
			try{
				loadState(arg);
				randomFile = arg;
			}
			catch(e){console.log(e);}
		}else{
			switch(arg.slice(1))
			{
				case 'glie':
					console.log("GLIE mode enabled");
					glie = true;
					break;
				case 'greedy':
					console.log("Greedy mode enabled");
					greedy = true;
					break;
				case 'learn':
					console.log("Learning disabled");
					learn = false;
					break;
			}
		}
	}
}

