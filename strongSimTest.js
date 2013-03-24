async = require('async');
Data = {}
strongSim = require('./strongSim.js');
sim = new strongSim.Battle("pew", null);
sim.winCallback = function (req) {	
	console.log(req)
}
sim.switchCallback = function (req) {	
	options = []
	switchables = sim[req.reqside].pokemon;
	for (var i = 0; i < switchables.length; i++) {
		var pokemon = switchables[i];
		if (pokemon.fainted || i < 1) {
			//controls += 'Disabled: ' + sanitize(pokemon.name) + ' (' + pokemon.hp+'/'+pokemon.maxhp + ')'+ " " +  pokemon.status + '\r\n';
			continue;
		} else {
			//controls += sanitize(pokemon.name) + ' (' + pokemon.hp+'/'+pokemon.maxhp + ')'+ " " +  pokemon.status + '\r\n';
			options.push( i );
		}
	}
	r = Math.floor(Math.random() * options.length);
	moveid = req.side.pokemon[options[r]].ident
	
	sim.choose(req.reqside, formSwitch(options[r]), req.rqid);
	console.log(req.reqside + ": " + moveid);
};
sim.moveCallback = function (req) { 
	r = Math.floor(Math.random() * req.active[0].moves.length);
	moveid = req.active[0].moves[r].id
	
	sim.choose(req.reqside, formUseMove(moveid, 'normal', sim[req.reqside].active), req.rqid);
	console.log(req.reqside + ": " + moveid);
};

sim.teamprevCallback = function (req) { console.log(JSON.stringify(req)); };

formSwitch = function (pos) {
	return 'switch '+(parseInt(pos,10)+1);
};
formUseMove = function (move) {
	return 'move '+move;
};

var team = require('./teams/team.js').parse('team.dat');
var oppTeam = ['Garchomp', 'Sandshrew', 'Sandile', 'Flygon', 'Nosepass', 'Alakazam']

sim.join(null, 'bot1', 0, team)
sim.join(null, 'bot2', 0, oppTeam)

var rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
function performOp(answer) {
  try{
	console.log(eval(answer));
	}
	catch(m)
	{
	console.log("Error: " + m);
	}
  rl.question("Operation?\r\n", performOp);
}
rl.question("Operation?\r\n", performOp);