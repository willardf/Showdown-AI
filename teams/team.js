var $ = require('jquery');
var battledata = require('../data/battledata.js');
var BattleTypeChart = require('../data/typechart.js').BattleTypeChart;
var StatIDs = battledata.StatIDs;
var window = {};

var parseText = function(text, teams) {
		var text = text.split("\n");
		var team = [];
		var curSet = null;
		if (teams === true) {
			window.teams = [];
			teams = window.teams;
		}
		for (var i=0; i<text.length; i++) {
			var line = $.trim(text[i]);
			if (line === '' || line === '---') {
				curSet = null;
			} else if (line.substr(0, 3) === '===' && teams) {
				team = [];
				line = $.trim(line.substr(3, line.length-6));
				var format = '';
				var bracketIndex = line.indexOf(']');
				if (bracketIndex >= 0) {
					format = line.substr(1, bracketIndex-1);
					line = $.trim(line.substr(bracketIndex+1));
				}
				teams.push({
					name: line,
					format: format,
					team: team
				});
			} else if (!curSet) {
				curSet = {name: '', species: '', gender: ''};
				team.push(curSet);
				var atIndex = line.lastIndexOf(' @ ');
				if (atIndex !== -1) {
					curSet.item = line.substr(atIndex+3);
					line = line.substr(0, atIndex);
				}
				if (line.substr(line.length-4) === ' (M)') {
					curSet.gender = 'M';
					line = line.substr(0, line.length-4);
				}
				if (line.substr(line.length-4) === ' (F)') {
					curSet.gender = 'F';
					line = line.substr(0, line.length-4);
				}
				var parenIndex = line.lastIndexOf(' (');
				if (line.substr(line.length-1) === ')' && parenIndex !== -1) {
					line = line.substr(0, line.length-1);
					curSet.species = line.substr(parenIndex+2);
					line = line.substr(0, parenIndex);
					curSet.name = line;
				} else {
					curSet.name = line;
					curSet.species = line;
				}
			} else if (line.substr(0, 7) === 'Trait: ') {
				line = line.substr(7);
				curSet.ability = line;
			} else if (line === 'Shiny: Yes') {
				curSet.shiny = true;
			} else if (line.substr(0, 7) === 'Level: ') {
				line = line.substr(7);
				curSet.level = +line;
			} else if (line.substr(0, 11) === 'Happiness: ') {
				line = line.substr(11);
				curSet.happiness = +line;
			} else if (line.substr(0, 9) === 'Ability: ') {
				line = line.substr(9);
				curSet.ability = line;
			} else if (line.substr(0, 5) === 'EVs: ') {
				line = line.substr(5);
				var evLines = line.split('/');
				curSet.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
				for (var j=0; j<evLines.length; j++)
				{
					var evLine = $.trim(evLines[j]);
					var spaceIndex = evLine.indexOf(' ');
					if (spaceIndex === -1) continue;
					var statid = StatIDs[evLine.substr(spaceIndex+1)];
					var statval = parseInt(evLine.substr(0, spaceIndex));
					if (!statid) continue;
					curSet.evs[statid] = statval;
				}
			} else if (line.substr(0, 5) === 'IVs: ') {
				line = line.substr(5);
				var ivLines = line.split(' / ');
				curSet.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
				for (var j=0; j<ivLines.length; j++)
				{
					var ivLine = ivLines[j];
					var spaceIndex = ivLine.indexOf(' ');
					if (spaceIndex === -1) continue;
					var statid = StatIDs[ivLine.substr(spaceIndex+1)];
					var statval = parseInt(ivLine.substr(0, spaceIndex));
					if (!statid) continue;
					curSet.ivs[statid] = statval;
				}
			} else if (line.match(/^[A-Za-z]+ (N|n)ature/)) {
				var natureIndex = line.indexOf(' Nature');
				if (natureIndex === -1) natureIndex = line.indexOf(' nature');
				if (natureIndex === -1) continue;
				line = line.substr(0, natureIndex);
				curSet.nature = line;
			} else if (line.substr(0,1) === '-' || line.substr(0,1) === '~') {
				line = line.substr(1);
				if (line.substr(0,1) === ' ') line = line.substr(1);
				if (!curSet.moves) curSet.moves = [];
				if (line.substr(0,14) === 'Hidden Power [') {
					var hptype = line.substr(14, line.length-15);
					line = 'Hidden Power ' + hptype;
					if (!curSet.ivs) {
						curSet.ivs = {};
						for (var stat in BattleTypeChart[hptype].HPivs) {
							curSet.ivs[stat] = BattleTypeChart[hptype].HPivs[stat];
						}
					}
				}
				curSet.moves.push(line);
			}
		}
		return team;
	};
module.exports.parse = function(filename) {
	var data = require('fs').readFileSync("./teams/" + filename, 'utf8');
	return parseText(data);
	}