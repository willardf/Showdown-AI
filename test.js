//var Config = { server: 'sim.smogon.com', serverid: 'showdown' };
var Config = { server: 'localhost', serverid: 'localhost' }

require('sugar');
$ = require('jquery');
var sjsc = require('sockjs-client');
var socket = sjsc.create("http://" + Config.server + ":8000");	
var Battle = require('./battle.js').Battle;
Data = {}
Tools = require('./Tools.js');
sanitize = function(str, jsEscapeToo) {
	str = (str?''+str:'');
	str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	if (jsEscapeToo) str = str.replace(/'/g, '\\\'');
	return str;
}

var crypto = require('crypto');
function randomInt(){
	var bytes = crypto.randomBytes(4);
	var inter = bytes[0] + 
		(bytes[1] << 8) + (bytes[2] << 16) + (bytes[3] << 24);
	return inter > 0 ? inter : -inter;
}

var BattleFormats = {};
var teams = [];

var lastUpdate = {};

var actionphp = "http://play.pokemonshowdown.com/~~" + Config.serverid + "/action.php";
var name = ("0" + randomInt());

var selectedTeam = 0;
function overlay(data, data2) {console.log(data); console.log(JSON.stringify(data));}
function logfunc(msg){
	if (!silent)
		console.log(msg);
}

function selectTeam(i){
	if (isNaN(i)) i = -1;
	i = parseInt(i);

	if (i < 0 || teams.length == 0) {
		rooms.lobby.send('/utm null');
	} else {
		rooms.lobby.send('/utm ' + JSON.stringify(teams[i].team));
	}
	selectedTeam = i;
	if (AI.setTeam) AI.setTeam(teams[i]);
}
function login(username, password){
	var name = username;
	$.post(actionphp, {
		act: 'login',
		name: name,
		pass: password,
		challengekeyid: me.challengekeyid,
		challenge: me.challenge
		}, 
		Tools.safeJson(function (data) {
			if (!data) data = {};
			var token = data.assertion;
			if (data.curuser && data.curuser.loggedin) {
				me.registered = data.curuser;
				name = data.curuser.username;
				if (!socket) {
					return;
				}
				rooms.lobby.send('/trn '+name+',0,'+token);
			} else {
				overlay(overlayType, {
					name: name,
					error: 'Wrong password.'
				});
			}
		}), 'text');
}
function renameMe(name) {
	console.log("Am renamed: " + name);
	if (me.userid !== toId(name)) {
		var query = actionphp + '?act=getassertion&userid=' + toId(name) +
				'&challengekeyid=' + me.challengekeyid +
				'&challenge=' + me.challenge;
		if (Config.testclient) {
			overlay('testclientgetassertion', { name: name, query: query });
			return;
		}
		if (name === '') {
			return;
		}
		$.get(query, function(data) {
			if (data === ';') {
				overlay('login', {name: name});
			} else if (data.substr(0, 2) === ';;') {
				overlay('rename', {error: data.substr(2)});
			} else if (data.indexOf('\n') >= 0) {
				alert("The login server is overloaded. Please try again later.");
			} else {
				rooms.lobby.send('/trn '+name+',0,'+data);
			}
		});
	} else {
		rooms.lobby.send('/trn '+name);
	}
}
function notify (data) {
	var message = 'Something has happened!';
	switch (data.type) {
	case 'challenge':
		message = ""+data.user+" has challenged you to a battle!";
		break;
	case 'highlight':
		message = 'You have been highlighted by ' + data.user + '!';
		break;
	case 'pm':
		message = 'You have received a PM from ' + data.user + '!';
		break;
	case 'yourMove':
	case 'yourSwitch':
		message = "It's your move in your battle against "+data.user+".";
		break;
	}
	logfunc(message);
}
toId = function(text) {
	text = text || '';
	if (typeof text === 'number') text = ''+text;
	if (typeof text !== 'string') return toId(text && text.id);
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
toUserid = toId;

function emit(socket, type, data) {
	//socket.emit(type, data);
	if (typeof data === 'object') data.type = type;
	else data = {type: type, message: data};

	if (data.type === 'chat') {
		// if (window.console && console.log) console.log('>> '+data.room+'|'+data.message);
		socket.write(''+data.room+'|'+data.message);
	} else {
		socket.write(JSON.stringify(data));
	}
}

function BattleRoom(id) {
	var selfR = this;
	this.id = id;
	this.meIdent = {
		name: me.name,
		named: 'init'
	};
	this.notifying = false;
	me.rooms[id] = {};
	selfR.me = me.rooms[id];

	this.battleEnded = false;

	this.dealloc = function () {
		if (selfR.battle) selfR.battle.dealloc();
	};

	this.updateJoinButton = function () {
		output = "";
		if (selfR.battle.done) selfR.battleEnded = true;
		if (selfR.battleEnded && !selfR.newReq) {
			selfR.newReq = true;
			output += "Battle Ended:" + selfR.id;
			battleFinished(selfR.id);
		} else if (selfR.me.side) {
			if (selfR.battle.kickingInactive) {
				output += 'rooms[\'' + selfR.id + '\'].formStopBattleTimer() == Stop victory timer';
			} else {
				//selfR.formKickInactive();
			}
		} else {
			output += 'rooms[\'' + selfR.id + '\'].formJoinBattle() == Join Battle';
		}
		if (output != "")
			console.log(output);
	};
	this.init = function (data) {
		this.version = (data.version !== undefined) ? data.version : 0;
		if (selfR.battle.activityQueue) {
			// re-initialize
			selfR.battleEnded = false;
			selfR.battle = new Battle();

			selfR.battle.customCallback = selfR.callback;
			selfR.battle.startCallback = selfR.updateJoinButton;
			selfR.battle.stagnateCallback = selfR.updateJoinButton;
			selfR.battle.endCallback = selfR.updateJoinButton;
		}
		selfR.battle.play();
		if (data.battlelog) {
			for (var i = 0; i < data.battlelog.length; i++) {
				selfR.battle.add(data.battlelog[i]);
			}
			selfR.battle.fastForwardTo(-1);
		}
	};
	this.rawMessage = function(message) {
		this.message({rawMessage: message});
	};
	this.message = function (message, andLobby) {
		if (message.pm) {
			var pmuserid = (toUserid(message.name) === me.userid ? toUserid(message.pm) : toUserid(message.name))
			if (me.ignore[toUserid(message.name)] && message.name.substr(0, 1) === ' ') return;
			selfR.add('|pm|' + message.name.substr(1) + '|' + pmuserid + '|' + message.pm + '|' + message.message);
		} else if (message.rawMessage) {
			// This is sanitised in battle.js.
			selfR.add('|chatmsg-raw|' + message.rawMessage);
		} else if (message.evalRulesRedirect || message.evalRawMessage) {
			// TODO: This will be removed in due course.
			//window.location.href = 'http://pokemonshowdown.com/rules';
		} else if (message.name) {
			selfR.add('|chat|' + message.name.substr(1) + '|' + message.message);
		} else if (message.message) {
			selfR.add('|chatmsg|' + message.message);
		} else {
			selfR.add('|chatmsg|' + message);
		}

		if (andLobby && rooms.lobby) {
			rooms.lobby.message(message);
		}
	};
	this.send = function (message) {
		emit(socket, 'chat', {room:this.id,message:message});
	};
	// Same as send, but appends the rqid to the message so that the server
	// can verify that the decision is sent in response to the correct request.
	this.sendDecision = function (message) {
		this.send(message + '|' + this.me.request.rqid);
	};
	this.add = function (log) {
		if (log.indexOf('|chat')) console.log(log);
		if (typeof log === 'string') log = log.split('\n');
		selfR.update({updates:log});
	};
	this.update = function (update) {
		if (update.updates) {
			var updated = false;
			for (var i = 0; i < update.updates.length; i++) {
				if (!updated && (update.updates[i] === '')) {
					selfR.me.callbackWaiting = false;
					updated = true;
				}
				if (update.updates[i] === 'RESET') {
					delete selfR.me.side;
					selfR.battleEnded = false;
					selfR.battle = new Battle();

					selfR.battle.customCallback = selfR.callback;
					selfR.battle.startCallback = selfR.updateJoinButton;
					selfR.battle.stagnateCallback = selfR.updateJoinButton;
					selfR.battle.endCallback = selfR.updateJoinButton;
					selfR.battle.play();
					selfR.updateJoinButton();
					break;
				}
				if (update.updates[i].substr(0, 6) === '|chat|' || 
					update.updates[i].substr(0, 9) === '|chatmsg|' || 
					update.updates[i].substr(0, 10) === '|inactive|') 
				{
					selfR.battle.instantAdd(update.updates[i]);
				} else {
		//console.log("Process:" + update.updates[i]);
					selfR.battle.add(update.updates[i]);
				}
			}
		}
		if (update.request) {
			selfR.me.request = update.request;
			selfR.me.request.requestType = 'move';
			var notifyObject = null;
			if (selfR.me.request.forceSwitch) {
				selfR.me.request.requestType = 'switch';
				notifyObject = {
					type: 'yourSwitch',
					room: selfR.id
				};
			} else 
			if (selfR.me.request.teamPreview) {
				selfR.me.request.requestType = 'team';
				notifyObject = {
					type: 'yourSwitch',
					room: selfR.id
				};
			} else 
			if (selfR.me.request.wait) {
				selfR.me.request.requestType = 'wait';
			} 
			else {
				notifyObject = {
					type: 'yourMove',
					room: selfR.id
				};
			}
			if (notifyObject) {
				var doNotify = function() {
					notify(notifyObject);
					selfR.notifying = true;
					// updateRoomList();
				};
				if (selfR.battle.yourSide.initialized) {
					// The opponent's name is already known.
					notifyObject.user = selfR.battle.yourSide.name;
					doNotify();
				} else {
					// The opponent's name isn't known yet, so wait until it is
					// known before sending the notification, so that it can include
					// the opponent's name.
					var callback = selfR.battle.stagnateCallback;
					selfR.battle.stagnateCallback = function(battle) {
						notifyObject.user = battle.yourSide.name;
						doNotify();
						battle.stagnateCallback = callback;
						if (callback) callback(battle);
					};
				}
			}
		}
		if (typeof update.active !== 'undefined') {
			if (!update.active && selfR.me.side) {
				// selfR.controlsElem.html('<div class="controls"><button onclick="return rooms[\'' + selfR.id + '\'].formLeaveBattle()">Leave this battle</button></div>');
			}
		}
		if (update.side) {
			if (update.side === 'none') {
				delete selfR.me.side;
			} else {
				selfR.me.side = update.side;
			}
		}
		if (update.sideData) {
			selfR.updateSide(update.sideData, update.midBattle);
		}
		// selfR.updateMe();
	};
	this.updateSide = function(sideData, midBattle) {
		var sidesSwitched = false;
		selfR.me.sideData = sideData; // just for easy debugging
		if (selfR.battle.sidesSwitched !== !!(selfR.me.side === 'p2')) {
			sidesSwitched = true;
			selfR.battle.reset();
			selfR.battle.switchSides();
		}
		for (var i = 0; i < sideData.pokemon.length; i++) {
			var pokemonData = sideData.pokemon[i];
			var pokemon;
			if (i == 0) {
				pokemon = selfR.battle.getPokemon(''+pokemonData.ident, pokemonData.details);
				pokemon.slot = 0;
				pokemon.side.pokemon = [pokemon];
				// if (pokemon.side.active[0] && pokemon.side.active[0].ident == pokemon.ident) pokemon.side.active[0] = pokemon;
			} else if (i < selfR.battle.mySide.active.length) {
				pokemon = selfR.battle.getPokemon('new: '+pokemonData.ident, pokemonData.details);
				pokemon.slot = i;
				// if (pokemon.side.active[i] && pokemon.side.active[i].ident == pokemon.ident) pokemon.side.active[i] = pokemon;
				if (pokemon.side.active[i] && pokemon.side.active[i].ident == pokemon.ident) {
					pokemon.side.active[i].item = pokemon.item;
					pokemon.side.active[i].ability = pokemon.ability;
					pokemon.side.active[i].baseAbility = pokemon.baseAbility;
				}
			} else {
				pokemon = selfR.battle.getPokemon('new: '+pokemonData.ident, pokemonData.details);
			}
			pokemon.healthParse(pokemonData.condition);
			if (pokemonData.baseAbility) {
				pokemon.baseAbility = pokemonData.baseAbility;
				if (!pokemon.ability || pokemon.ability.substr(0,2) === '??') pokemon.ability = pokemon.baseAbility;
			}
			pokemon.item = pokemonData.item;
			pokemon.moves = pokemonData.moves;
		}
		selfR.battle.mySide.updateSidebar();
		if (sidesSwitched) {
			if (midBattle) {
				selfR.battle.fastForwardTo(-1);
			} else {
				selfR.battle.play();
			}
		}
	};
	this.callback = function (battle, type, moveTarget) {
		if (!battle) battle = selfR.battle;
		selfR.notifying = false;
		if (type === 'restart') {
			selfR.me.callbackWaiting = false;
			selfR.battleEnded = true;
			// updateRoomList();
			return;
		}

		var myActive = selfR.battle.mySide.active;
		var yourActive = selfR.battle.yourSide.active;
		var text = '';
		
		if (!selfR.me.request) {
			selfR.updateJoinButton();
			// updateRoomList();
			return;
		}
		if (selfR.me.request.side) {
			selfR.updateSide(selfR.me.request.side, true);
		}
		selfR.me.callbackWaiting = true;
		var active = selfR.battle.mySide.active[0];
		if (!active) active = {};
		var act = '';
		var switchables = [];

		if (selfR.me.request) {
			act = selfR.me.request.requestType;
			if (selfR.me.request.side) {
				switchables = selfR.battle.mySide.pokemon;
			}
		}
		switch (act) {
		case 'move':
			{
				if (type !== 'move2' && type !== 'movetarget') {
					selfR.choices = [];
					selfR.choiceSwitchFlags = {};
					while (switchables[selfR.choices.length] && switchables[selfR.choices.length].fainted) selfR.choices.push('pass');
				}
				var pos = selfR.choices.length - (type === 'movetarget'?1:0);
				var hpbar = switchables[pos].hp+'/'+switchables[pos].maxhp;
				var active = selfR.me.request;
				if (active.active) active = active.active[pos];
				var moves = active.moves;
				var trapped = active.trapped;

				var controls = '';
				if (type === 'move2' || type === 'movetarget') {
					controls += '<button onclick="rooms[\'' + selfR.id + '\'].callback(null,\'move\')">Back</button> ';
				}

				// Target selector

				if (type === 'movetarget') {
					controls += 'At who? '+hpbar+'</div>';

					var myActive = selfR.battle.mySide.active;
					var yourActive = selfR.battle.yourSide.active;
					var yourSlot = yourActive.length-1-pos;
					for (var i = yourActive.length-1; i >= 0; i--) {
						var pokemon = yourActive[i];

						var disabled = false;
						if (moveTarget === 'adjacentAlly' || moveTarget === 'adjacentAllyOrSelf') {
							disabled = true;
						} else if (moveTarget === 'normal' || moveTarget === 'adjacentFoe') {
							if (Math.abs(yourSlot-i) > 1) disabled = true;
						}


					}
					for (var i = 0; i < myActive.length; i++) {
						var pokemon = myActive[i];

						var disabled = false;
						if (moveTarget === 'adjacentFoe') {
							disabled = true;
						} else if (moveTarget === 'normal' || moveTarget === 'adjacentAlly' || moveTarget === 'adjacentAllyOrSelf') {
							if (Math.abs(pos-i) > 1) disabled = true;
						}
						if (moveTarget !== 'adjacentAllyOrSelf' && pos == i) disabled = true;

					}
					logfunc(controls);
					break;
				}

				// Move chooser

				console.log('\r\nWhat will ' + sanitize(switchables[pos].name) + ' do? '+hpbar);
				var AIActions = []
				var hasMoves = false;
				var hasDisabled = false;
				controls += '\r\nAttacks:\r\n';
				var movebuttons = '';
				for (var i = 0; i < moves.length; i++) {
					var moveData = moves[i];
					var move = Tools.getMove(moves[i].move);
					if (!move) {
						move = {
							name: moves[i].move,
							id: moves[i].move,
							type: '' };
					}
					var name = move.name;
					var pp = moveData.pp + '/' + moveData.maxpp;
					if (!moveData.maxpp) pp = '&ndash;';
					if (move.id === 'Struggle' || move.id === 'Recharge') pp = '&ndash;';
					if (move.id === 'Recharge') move.type = '&ndash;';
					if (name.substr(0, 12) === 'Hidden Power') name = 'Hidden Power';
					if (moveData.disabled) {
						controls += 'Disabled -- ';
						hasDisabled = true;
					} else {
						AIActions.push(move);
						hasMoves = true;
					}
					movebuttons += name + '\r\n' + move.type + '\tPP: ' + pp + '\r\n';
				}
				if (!hasMoves) {
					controls += 'Struggle\r\n';
					AIActions.push({name: 'Struggle', id: 'struggle', type: 'Normal'});
				} else {
					controls += movebuttons;
				}
				controls += '\r\nSwitch:\r\n';
				if (trapped) {
					controls += 'You are trapped and cannot switch!';
				} else {
					controls += '';
					for (var i = 0; i < switchables.length; i++) {
						var pokemon = switchables[i];
						pokemon.name = pokemon.ident.substr(4);
						if (pokemon.zerohp || i < selfR.battle.mySide.active.length || selfR.choiceSwitchFlags[i]) {
							// Pokemon dead
							controls += 'Disabled: ' +i + ': ' + sanitize(pokemon.name) + pokemon.hp +'/' + pokemon.maxhp +(pokemon.status?pokemon.status:'') + "\r\n";
						} else {
							controls += i + ': ' + sanitize(pokemon.name) + pokemon.hp +'/' + pokemon.maxhp +(pokemon.status?pokemon.status:'') + "\r\n";
							AIActions.push( {type:"switch",
								id: pokemon.species,
								idx: i});
						}
					}
				}
				logfunc(controls);
				chooseMove(selfR.id, AIActions);
			}
			selfR.notifying = true;
			break;
		case 'switch':
			if (type !== 'switch2') {
				selfR.choices = [];
				selfR.choiceSwitchFlags = {};
				if (selfR.me.request.forceSwitch !== true) {
					while (!selfR.me.request.forceSwitch[selfR.choices.length] && selfR.choices.length < 6) selfR.choices.push('pass');
				}
			}
			var pos = selfR.choices.length;
			var controls = '';
			if (type === 'switch2') {
				controls += '<button onclick="rooms[\'' + selfR.id + '\'].callback(null,\'switch\')">Back</button> ';
			}
			var AIActions = [];
			controls += 'Switch '+sanitize(switchables[pos].name)+' to:\r\n';
			for (var i = 0; i < switchables.length; i++) {
				var pokemon = switchables[i];
				if (pokemon.zerohp || i < selfR.battle.mySide.active.length || selfR.choiceSwitchFlags[i]) {
					controls += 'Disabled: ' + sanitize(pokemon.name) + ' (' + pokemon.hp+'/'+pokemon.maxhp + ')'+ " " +  pokemon.status + '\r\n';
				} else {
					controls += sanitize(pokemon.name) + ' (' + pokemon.hp+'/'+pokemon.maxhp + ')'+ " " +  pokemon.status + '\r\n';
					AIActions.push( {type:"switch",
								id: pokemon.species,
								idx: i});
				}
			}
			logfunc(controls);
			chooseMove(selfR.id, AIActions);
			selfR.formSelectSwitch();
			selfR.notifying = true;
			break;
		case 'team':
			var controls = '';
			var AIActions = []
			if (type !== 'team2') {
				
				selfR.teamPreviewChoice = [1,2,3,4,5,6].slice(0,switchables.length);
				selfR.teamPreviewDone = 0;
				selfR.teamPreviewCount = 0;
				if (selfR.battle.gameType === 'doubles') {
					selfR.teamPreviewCount = 2;
				}
				controls += 'How will you start the battle?';
				for (var i = 0; (i < switchables.length) && (i < 6); i++) {
					var pokemon = switchables[i];
					
					if (toId(pokemon.baseAbility) === 'illusion') {
						selfR.teamPreviewCount = 6;
					}
					
					controls += i + ': ' + sanitize(pokemon.name) + '\r\n';
					AIActions.push( {type:"switch",
								id: pokemon.species,
								idx: i});
				}
				if (selfR.battle.teamPreviewCount) 
					selfR.teamPreviewCount = parseInt(selfR.battle.teamPreviewCount,10);
			} else {
				controls += selfR.id + '\'].callback(null,\'team\')">Back</button> What about the rest of your team?\r\n';
				controls += '<button onclick="rooms[\'' + selfR.id + '\'].formSelectSwitch()">Choose a pokemon for slot '+(selfR.teamPreviewDone+1)+'\r\n';
				for (var i = 0; i < switchables.length; i++) {
					var pokemon = switchables[selfR.teamPreviewChoice[i]-1];
					if (i >= 6) {
						break;
					}
					if (i < selfR.teamPreviewDone) {
					//	controls += '<button disabled="disabled"' + tooltipAttrs(i, 'sidepokemon') + '><span class="pokemonicon" style="display:inline-block;vertical-align:middle;'+Tools.getIcon(pokemon)+'"></span>' + sanitize(pokemon.name) + '</button> ';
					} else {
						controls += 'rooms[\'' + selfR.id + '\t' + i + ': ' + sanitize(pokemon.name) + '\r\n';
					}
				}
			}
			logfunc(controls);
			
			ChooseTeamPreview(AIActions, selfR, selfR.formTeamPreviewSelect);
			selfR.notifying = true;
			break;
		}
	};
	this.formTeamPreviewSelect = function (pos) {
		pos = parseInt(pos,10);
		console.log("Selected: " + pos + ": ");
		if (selfR.teamPreviewChoice)
			console.log(JSON.stringify(selfR.teamPreviewChoice[pos]));
		selfR.sendDecision('/team ' + pos);
		return false;
	};
	this.formJoinBattle = function () {
		selfR.send('/joinbattle');
		return false;
	};
	this.formKickInactive = function () {
		console.log("Kicking inactive user.");
		selfR.send('/kickinactive');
		return false;
	};
	this.formStopBattleTimer = function () {
		selfR.send('/timer off');
		return false;
	};
	this.formForfeit = function () {
		selfR.send('/forfeit');
		return false;
	};
	this.formSaveReplay = function () {
		selfR.send('/savereplay');
		return false;
	};
	this.formRestart = function () {
		selfR.me.request = null;
		selfR.battle.reset();
		selfR.battle.play();
		return false;
	};
	this.formUseMove = function (move, target) {
		var myActive = selfR.battle.mySide.active;
		
		if (move !== undefined) {
			var choosableTargets = {normal:1, any:1, adjacentAlly:1, adjacentAllyOrSelf:1, adjacentFoe:1};
			selfR.choices.push('move '+move);
			if (myActive.length > 1 && target in choosableTargets) {
				selfR.callback(selfR.battle, 'movetarget', target);
				return false;
			}
		}
		while (myActive.length > selfR.choices.length && !myActive[selfR.choices.length]) {
			selfR.choices.push('pass');
		}
		if (myActive.length > selfR.choices.length) {
			selfR.callback(selfR.battle, 'move2');
			return false;
		}
		selfR.sendDecision('/choose '+selfR.choices.join(','));
		selfR.notifying = false;
		// updateRoomList();
		return false;
	};
	this.formSelectTarget = function (pos, isMySide) {
		var posString;
		if (isMySide) {
			posString = ''+(-(pos+1));
		} else {
			posString = ''+(pos+1);
		}
		selfR.choices[selfR.choices.length-1] += ' '+posString;
		selfR.formUseMove();
		return false;
	};
	this.formSwitchTo = function (pos) {
		
		selfR.choices.push('switch '+(parseInt(pos,10)+1));
		selfR.choiceSwitchFlags[pos] = true;
		if (selfR.me.request && selfR.me.request.requestType === 'move' && selfR.battle.mySide.active.length > selfR.choices.length) {
			selfR.callback(selfR.battle, 'move2');
			return false;
		}
		if (selfR.me.request && selfR.me.request.requestType === 'switch') {
			if (selfR.me.request.forceSwitch !== true) {
				while (selfR.battle.mySide.active.length > selfR.choices.length && !selfR.me.request.forceSwitch[selfR.choices.length]) selfR.choices.push('pass');
			}
			if (selfR.battle.mySide.active.length > selfR.choices.length) {
				selfR.callback(selfR.battle, 'switch2');
				return false;
			}
		}

		selfR.sendDecision('/choose '+selfR.choices.join(','));
		selfR.notifying = false;
		// updateRoomList();
		return false;
	};
	this.formTeamPreviewSelect = function (pos) {
		pos = parseInt(pos,10);
		
		if (selfR.teamPreviewCount) {
			var temp = selfR.teamPreviewChoice[pos];
			selfR.teamPreviewChoice[pos] = selfR.teamPreviewChoice[selfR.teamPreviewDone];
			selfR.teamPreviewChoice[selfR.teamPreviewDone] = temp;

			selfR.teamPreviewDone++;

			if (selfR.teamPreviewDone < Math.min(selfR.teamPreviewChoice.length, selfR.teamPreviewCount)) {
				selfR.callback(selfR.battle, 'team2');
				return false;
			}
			pos = selfR.teamPreviewChoice.join('');
		} else {
			pos = pos+1;
		}

		selfR.sendDecision('/team '+(pos));
		selfR.notifying = false;		
		return false;
	};
	this.formUndoDecision = function (pos) {
		selfR.send('/undo');
		selfR.notifying = true;
		selfR.callback(selfR.battle, 'decision');
		return false;
	};

	this.formRename = function () {
		overlay('rename');
		return false;
	};
	this.formLeaveBattle = function () {
		
		selfR.send('/leavebattle');
		selfR.notifying = false;
		// updateRoomList();
		return false;
	};
	this.formSelectSwitch = function () {
		
		//selfR.controlsElem.find('.controls').attr('class', 'controls switch-controls');
		return false;
	};
	this.formSelectMove = function () {
		
		//selfR.controlsElem.find('.controls').attr('class', 'controls move-controls');
		return false;
	};

	this.battle = new Battle();

	this.battle.customCallback = this.callback;
	this.battle.endCallback = this.endCallback;
	// this.battle.startCallback = this.updateMe;
	// this.battle.stagnateCallback = this.updateMe;
}


function Lobby(id) {
	var selfR = this;
	this.id = id;
	this.meIdent = {
		name: me.name,
		named: 'init'
	};
	me.rooms[id] = {};
	this.me = 'lobby';//me.rooms[id];
	this.joinLeave = {
		'join': [],
		'leave': []
	};
	this.joinLeaveElem = null;
	this.userCount = {};
	this.userList = {};
	this.userActivity = [];
	this.tabComplete = {
		candidates: null,
		index: 0,
		prefix: null,
		cursor: -1
	};
	this.chatHistory = (function() {
		var self = {
			lines: [],
			index: 0,
			push: function(line) {
				if (self.lines.length > 100) {
					self.lines.splice(0, 20);
				}
				self.lines.push(line);
				self.index = self.lines.length;
			}
		};
		return self;
	})();
	this.searcher = null;
	this.selectedTeam = 0;
	this.selectedFormat = '';
	
	
	this.dealloc = function () {};
	this.rawMessage = function(message) {
		this.message({rawMessage: message});
	};
	this.message = function (message) {
		if (typeof message !== 'string') {
			selfR.add([message]);
		} else {
			selfR.add([{
				message: message
			}]);
		}
	};
	this.send = function (message) {
		emit(socket, 'chat', {room:this.id, message:message});
	};
	this.parseCommand = function(text) {
		var cmd = '';
		var target = '';
		if (text.substr(0,2) !== '//' && text.substr(0,1) === '/') {
			var spaceIndex = text.indexOf(' ');
			if (spaceIndex > 0) {
				cmd = text.substr(1, spaceIndex-1);
				target = text.substr(spaceIndex+1);
			} else {
				cmd = text.substr(1);
				target = '';
			}
		}

		switch (cmd.toLowerCase()) {
		case 'challenge':
		case 'user':
		case 'open':
			if (!target) target = prompt('Who?');
			if (target) rooms.lobby.formChallenge(target);
			return false;

		case 'ignore':
			if (me.ignore[toUserid(target)]) {
				this.message('User ' + target + ' is already on your ignore list. (Moderator messages will not be ignored.)');
			} else {
				me.ignore[toUserid(target)] = 1;
				this.message('User ' + target + ' ignored. (Moderator messages will not be ignored.)');
			}
			return false;

		case 'unignore':
			if (!me.ignore[toUserid(target)]) {
				this.message('User ' + target + ' isn\'t on your ignore list.');
			} else {
				delete me.ignore[toUserid(target)];
				this.message('User ' + target + ' no longer ignored.');
			}
			return false;

		case 'clear':
			if (this.clear) this.clear();
			return false;

		case 'nick':
			if (target) {
				renameMe(target);
			} else {
				rooms.lobby.formRename();
			}
			return false;

		case 'showjoins':
			rooms.lobby.add('Join/leave messages: ON');
			return false;
		case 'hidejoins':
			rooms.lobby.add('Join/leave messages: HIDDEN');
			return false;

		case 'showbattles':
			rooms.lobby.add('Battle messages: ON');
			return false;
		case 'hidebattles':
			rooms.lobby.add('Battle messages: HIDDEN');
			return false;

		case 'timestamps':
			var targets = target.split(',');
			if ((['all', 'lobby', 'pms'].indexOf(targets[0]) === -1)
					|| (targets.length < 2)
					|| (['off', 'minutes', 'seconds'].indexOf(
						targets[1] = targets[1].trim()) === -1)) {
				rooms.lobby.add("Error: Valid options are /timestamps [all|lobby|pms], [minutes|seconds|off]");
				return false;
			}
			var timestamps = {};
			if (typeof timestamps === 'string') {
				// The previous has a timestamps preference from the previous
				// regime. We can't set properties of a string, so set it to
				// an empty object.
				timestamps = {};
			}
			switch (targets[0]) {
			case 'all':
				timestamps.lobby = targets[1];
				timestamps.pms = targets[1];
				break;
			case 'lobby':
				timestamps.lobby = targets[1];
				break;
			case 'pms':
				timestamps.pms = targets[1];
				break;
			}
			rooms.lobby.add('Timestamps preference set to: `' + targets[1] + '` for `' + targets[0] + '`.');
			//Tools.prefs.set('timestamps', timestamps, true);
			return false;
			
		case 'highlight':
			var highlights = Tools.prefs.get('highlights') || [];
			if (target.indexOf(',') > -1) {
				var targets = target.split(',');
				// trim the targets to be safe
				for (var i=0, len=targets.length; i<len; i++) {
					targets[i] = targets[i].trim();
				}
				switch (targets[0]) {
				case 'add':
					for (var i=1, len=targets.length; i<len; i++) {
						highlights.push(targets[i].trim());
					}
					rooms.lobby.add("Now highlighting words: " + highlights.join(', '));
					// We update the regex
					this.regex = new RegExp('\\b('+highlights.join('|')+')\\b', 'gi');
					break;
				case 'delete':
					var newHls = [];
					for (var i=0, len=highlights.length; i<len; i++) {
						if (targets.indexOf(highlights[i]) === -1) {
							newHls.push(highlights[i]);
						}
					}
					highlights = newHls;
					rooms.lobby.add("Now highlighting words: " + highlights.join(', '));
					// We update the regex
					this.regex = new RegExp('\\b('+highlights.join('|')+')\\b', 'gi');
					break;
				}
				//Tools.prefs.set('highlights', highlights, true);
			} else {
				if (target === 'delete') {
					//Tools.prefs.set('highlights', false, true);
					rooms.lobby.add("All highlights cleared");
				} else if (target === 'show' || target === 'list') {
					// Shows a list of the current highlighting words
					if (highlights.length > 0) {
						var hls = highlights.join(', ');
					} else {
						var hls = 'Currently none.';
					}
					rooms.lobby.add("Current highlighting words: " + hls);
				} else {
					// Wrong command
					rooms.lobby.add("Error: Valid options are /highlight add, [word]; /highlight delete, [word]; (remove word for highlight cleaning), and /highlight show.");
				}
			}
			return false;

		case 'rank':
		case 'ranking':
		case 'rating':
		case 'ladder':
			if (!target) target = me.userid;
			var self = this;
			$.get(actionphp + '?act=ladderget&user='+target, Tools.safeJson(function(data) {
				try {
					var buffer = '<div class="ladder"><table>';
					buffer += '<tr><td colspan="7">User: <strong>'+target+'</strong></td></tr>';
					if (!data.length) {
						buffer += '<tr><td colspan="7"><em>This user has not played any ladder games yet.</em></td></tr>';
					} else {
						buffer += '<tr><th>Format</th><th>ACRE</th><th>GXE</th><th>Glicko2</th><th>W</th><th>L</th><th>T</th></tr>';
						for (var i=0; i<data.length; i++) {
							var row = data[i];
							buffer += '<tr><td>'+row.formatid+'</td><td><strong>'+Math.round(row.acre)+'</strong></td><td>'+Math.round(row.gxe,1)+'</td><td>';
							if (row.rprd > 50) {
								buffer += '<span><em>'+Math.round(row.rpr)+'<small> &#177; '+Math.round(row.rprd)+'</small></em> <small>(provisional)</small></span>';
							} else {
								buffer += '<em>'+Math.round(row.rpr)+'<small> &#177; '+Math.round(row.rprd)+'</small></em>';
							}
							buffer += '</td><td>'+row.w+'</td><td>'+row.l+'</td><td>'+row.t+'</td></tr>';
						}
					}
					buffer += '</table></div>';
					self.rawMessage(buffer);
				} catch(e) {
				}
			}), 'text');
			return false;
			
		case 'buttonban':
			var reason = prompt('Why do you wish to ban this user?');
			if (reason === null) return false;
			if (reason === false) reason = '';
			rooms.lobby.send('/ban ' + target + ', ' + reason);
			return false;
		
		case 'buttonmute':
			var reason = prompt('Why do you wish to mute this user?');
			if (reason === null) return false;
			if (reason === false) reason = '';
			rooms.lobby.send('/mute ' + target + ', ' + reason);
			return false;
			
		case 'buttonunmute':
			rooms.lobby.send('/unmute ' + target);
			return false;
		
		case 'buttonkick':
			var reason = prompt('Why do you wish to kick this user?');
			if (reason === null) return false;
			if (reason === false) reason = '';
			rooms.lobby.send('/kick ' + target + ', ' + reason);
			return false;

		case 'avatar':
			var parts = target.split(',');
			var avatar = parseInt(parts[0], 10);
			if (avatar) {
				//Tools.prefs.set('avatar', avatar, true);
			}
			return text; // Send the /avatar command through to the server.

		}

		return text;
	};
	
	// Mark a user as active for the purpose of tab complete.
	this.markUserActive = function (userid) {
		var idx = selfR.userActivity.indexOf(userid);
		if (idx !== -1) {
			selfR.userActivity.splice(idx, 1);
		}
		selfR.userActivity.push(userid);
		if (selfR.userActivity.length > 100) {
			// Prune the list.
			selfR.userActivity.splice(0, 20);
		}
	};
	this.getTimestamp = function (section) {
		var pref = {};
		var sectionPref = ((section === 'pms') ? pref.pms : pref.lobby) || 'off';
		if ((sectionPref === 'off') || (sectionPref === undefined)) return '';
		var date = new Date();
		var components = [ date.getHours(), date.getMinutes() ];
		if (sectionPref === 'seconds') {
			components.push(date.getSeconds());
		}
		return '[' + components.map(
				function(x) { return (x < 10) ? '0' + x : x; }
			).join(':') + '] ';
	};
	this.getHighlight = function (message) {
		var highlights = [];
		if (!this.regex) {
			try {
				this.regex = new RegExp('\\b('+highlights.join('|')+')\\b', 'gi');
			} catch (e) {
				// If the expression above is not a regexp, we'll get here.
				// Don't throw an exception because that would prevent the chat
				// message from showing up, or, when the lobby is initialising,
				// it will prevent the initialisation from completing.
				return false;
			}
		}
		return ((highlights.length > 0) && this.regex.test(message));
	};
	this.add = function (log) {
		if (typeof log === 'string') log = log.split('\n');
		var autoscroll = false;

		selfR.lastUpdate = log;
		for (var i = 0; i < log.length; i++) {
			if (typeof log[i] === 'string') {
				if (log[i].substr(0,1) !== '|') log[i] = '||'+log[i];
				var row = log[i].substr(1).split('|');
				switch (row[0]) {
				case 'c':
				case 'chat':
					log[i] = {
						name: row[1],
						message: row.slice(2).join('|')
					};
					break;
				case 'b':
				case 'B':
					log[i] = {
						action: 'battle',
						room: row[1],
						name: row[2],
						name2: row[3],
						silent: (row[0] === 'B')
					};
					break;
				case 'j':
				case 'J':
					log[i] = {
						action: 'join',
						name: row[1],
						silent: (row[0] === 'J')
					};
					
					break;
				case 'l':
				case 'L':
					log[i] = {
						action: 'leave',
						name: row[1],
						silent: (row[0] === 'L')
					};
					
					break;
				case 'n':
				case 'N':
					log[i] = {
						action: 'rename',
						name: row[1],
						oldid: row[2],
						silent: true
					};
					
					break;
				case 'raw':
					log[i] = {
						rawMessage: row.slice(1).join('|')
					};
					break;
				case 'formats':
					var isSection = false;
					var section = '';
					BattleFormats = {};
					for (var j=1; j<row.length; j++) {
						if (isSection) {
							section = row[j];
							isSection = false;
						} else if (row[j] === '') {
							isSection = true;
						} else {
							var searchShow = true;
							var challengeShow = true;
							var team = null;
							var name = row[j];
							if (name.substr(name.length-2) === ',#') { // preset teams
								team = 'preset';
								name = name.substr(0,name.length-2);
							}
							if (name.substr(name.length-2) === ',,') { // search-only
								challengeShow = false;
								name = name.substr(0,name.length-2);
							} else if (name.substr(name.length-1) === ',') { // challenge-only
								searchShow = false;
								name = name.substr(0,name.length-1);
							}
							BattleFormats[toId(name)] = {
								id: toId(name),
								name: name,
								team: team,
								section: section,
								searchShow: searchShow,
								challengeShow: challengeShow,
								rated: challengeShow && searchShow,
								isTeambuilderFormat: challengeShow && searchShow && !team,
								effectType: 'Format'
							};
						}
					}
					selfR.updateMainTop(true);
					break;
				case '':
				default:
					log[i] = {
						message: row.slice(1).join('|')
					};
					break;
				}
			}
			if (log[i].name && log[i].message) {
				var userid = toUserid(log[i].name);

				if (me.ignore[userid] && log[i].name.substr(0, 1) === ' ') continue;

				// Add this user to the list of people who have spoken recently.
				selfR.markUserActive(userid);

				selfR.joinLeaveElem = null;
				selfR.joinLeave = {
					'join': [],
					'leave': []
				};
				var clickableName = 'rooms.lobby.formChallenge(\'' + userid + '\'): ' + sanitize(log[i].name.substr(1)) + '\r\n';
				var message = log[i].message;
				console.log("message: " + message);
				/*var isHighlighted = selfR.getHighlight(message);
				if (isHighlighted) {
					notify({
						type: 'highlight',
						user: log[i].name
					});
				}*/
				var highlight = '';
				var chatDiv = '';
				var timestamp = selfR.getTimestamp(log[i].pm ? 'pms' : 'lobby');
				if (log[i].name.substr(0, 1) !== ' ') clickableName = '' + sanitize(log[i].name.substr(0, 1)) + ': '+clickableName;
				if (log[i].pm) {
					var pmuserid = (userid === me.userid ? toUserid(log[i].pm) : userid);
					if (!me.pm[pmuserid]) me.pm[pmuserid] = '';
					var pmcode = '' + timestamp + ':\t' + clickableName + ': ' + messageSanitize(message) + '</em></div>';
					for (var j = 0; j < me.popups.length; j++) {
						if (pmuserid === me.popups[j]) break;
					}
					if (j == me.popups.length) {
						// This is a new PM.
						me.popups.unshift(pmuserid);
						notify({
							type: 'pm',
							user: log[i].name
						});
					}
					me.pm[pmuserid] += pmcode;
					if (me.popups.length && me.popups[me.popups.length - 1] === pmuserid) {
						selfR.updatePopup(pmcode);
					} else {
						selfR.updatePopup();
					}
				}
			} else if (log[i].name && log[i].action === 'battle') {
				var id = log[i].room;
				var matches = id.match(/^battle\-([a-z0-9]*[a-z])[0-9]*$/);
				var format = (matches ? matches[1] : '');
				selfR.rooms.push({
					id: id,
					format: format,
					p1: log[i].name,
					p2: log[i].name2
				});
				if (selfR.rooms.length > 8) selfR.rooms.shift();

				if (log[i].silent) continue;

				selfR.joinLeaveElem = null;
				selfR.joinLeave = {
					'join': [],
					'leave': []
				};
				var id = log[i].room;
				var battletype = 'Battle';
				if (log[i].format) {
					battletype = log[i].format + ' battle';
					if (log[i].format === 'Random Battle') battletype = 'Random Battle';
				}
			} else if (log[i].name && (log[i].action === 'join' || log[i].action === 'leave' || log[i].action === 'rename')) {
				var userid = toUserid(log[i].name);
				if (log[i].action === 'join') {
					if (log[i].oldid) delete me.users[toUserid(log[i].oldid)];
					if (!me.users[userid]) selfR.userCount.users++;
					me.users[userid] = log[i].name;
				} else if (log[i].action === 'leave') {
					if (me.users[userid]) selfR.userCount.users--;
					delete me.users[userid];
				} else if (log[i].action === 'rename') {
					if (log[i].oldid) delete me.users[toUserid(log[i].oldid)];
					me.users[toUserid(log[i].name)] = log[i].name;
					continue;
				}
				if (log[i].silent) continue;
				var message = '';
				if (selfR.joinLeave['join'].length) {
					var preList = selfR.joinLeave['join'];
					var list = [];
					var named = {};
					for (var j = 0; j < preList.length; j++) {
						if (!named[preList[j]]) list.push(preList[j]);
						named[preList[j]] = true;
					}
					for (var j = 0; j < list.length; j++) {
						if (j >= 5) {
							message += ', and ' + (list.length - 5) + ' others';
							break;
						}
						if (j > 0) {
							if (j == 1 && list.length == 2) {
								message += ' and ';
							} else if (j == list.length - 1) {
								message += ', and ';
							} else {
								message += ', ';
							}
						}
						message += sanitize(list[j]);
					}
					message += ' joined';
				}
				if (selfR.joinLeave['leave'].length) {
					if (selfR.joinLeave['join'].length) {
						message += '; ';
					}
					var preList = selfR.joinLeave['leave'];
					var list = [];
					var named = {};
					for (var j = 0; j < preList.length; j++) {
						if (!named[preList[j]]) list.push(preList[j]);
						named[preList[j]] = true;
					}
					for (var j = 0; j < list.length; j++) {
						if (j >= 5) {
							message += ', and ' + (list.length - 5) + ' others';
							break;
						}
						if (j > 0) {
							if (j == 1 && list.length == 2) {
								message += ' and ';
							} else if (j == list.length - 1) {
								message += ', and ';
							} else {
								message += ', ';
							}
						}
						message += sanitize(list[j]);
					}
					message += ' left\r\n';
				}
				logfunc(message);
			}
		}
	};
	// Lobby init
	this.init = function (data) {
		if (data.log) {
			// Disable timestamps for the past log because the server doesn't
			// tell us what time the messages were sent at.
			var timestamps = {}
		}
		selfR.update(data);
		
		if (me.named) {
			// Preferred avatar feature
			var avatar = {};
			if (avatar) {
				// This will be compatible even with servers that don't support
				// the second argument for /avatar yet.
				selfR.send('/avatar ' + avatar + ',1');
			}
		}
	};
	this.update = function (data) {
		if (typeof data.searching !== 'undefined') {
			if (data.searching) console.log("Server is searching for battle.");
			selfR.me.searching = data.searching;
			selfR.updateMainTop();
		}
		if (typeof data.searcher !== 'undefined') {
			selfR.searcher = data.searcher;
		}
		if (typeof data.users !== 'undefined') {
			selfR.userList = data.users;
			selfR.userCount.users = 'who knows';
			me.users = data.users.list;
		}
		if (typeof data.u !== 'undefined') {
			selfR.userCount = {};
			selfR.userList = {};
			var commaIndex = data.u.indexOf(',');
			if (commaIndex >= 0) {
				selfR.userCount.users = parseInt(data.u.substr(0,commaIndex),10);
				var users = data.u.substr(commaIndex+1).split(',');
				for (var i=0,len=users.length; i<len; i++) {
					if (users[i]) selfR.userList[toId(users[i])] = users[i];
				}
			} else {
				selfR.userCount.users = parseInt(data.u);
				selfR.userCount.guests = selfR.userCount.users;
			}
			me.users = selfR.userList;
		}
		if (data.rooms) {
			selfR.rooms = [];
			for (var id in data.rooms) {
				var room = data.rooms[id];
				var matches = id.match(/^battle\-([a-z0-9]*[a-z])[0-9]*$/);
				room.format = (matches ? matches[1] : '');
				room.id = id;
				selfR.rooms.unshift(room);
			}
		}		
		
	};
	this.mainTopState = '';
	this.command = function (data) {
		if (data.command === 'userdetails') {
			var userid = data.userid;
			//if (!$('#' + selfR.id + '-userdetails-' + userid).length) return;

			var roomListCode = '';
			for (var id in data.rooms) {
				var roomData = data.rooms[id];
				var matches = id.match(/^battle\-([a-z0-9]*[a-z])[0-9]*$/);
				var format = (matches ? '<small>[' + matches[1] + ']</small>\r\n' : '');
				var roomDesc = format + '<em class="p1">' + sanitize(roomData.p1) + '</em> <small class="vs">vs.</small> <em class="p2">' + sanitize(roomData.p2) + '</em>';
				if (!roomData.p1) {
					matches = id.match(/[^0-9]([0-9]*)$/);
					roomDesc = format + 'empty room ' + matches[1];
				} else if (!roomData.p2) {
					roomDesc = format + '<em class="p1">' + sanitize(roomData.p1) + '</em>';
				}
				roomListCode += 'Tab:' + id + ' Desc:' + roomDesc + '\r\n';
			}

			var code = '';
			if (roomListCode) {
				roomListCode = 'In rooms:' + roomListCode;
			}
			if (data.ip) {
				// Mute and Ban buttons for auths
				var banMuteBuffer = '';
				// var isAuth = me.users[me.userid].substr(0,1) in {'%':1, '@':1, '&':1, '~':1};
				if (me.users[userid].substr(0,1) === '!') {
					banMuteBuffer += '\r\n<button onclick="rooms[\'' + selfR.id + '\'].parseCommand(\'/buttonunmute ' + userid + '\');">Unmute</button>';
				} else {
					banMuteBuffer += '\r\n<button onclick="rooms[\'' + selfR.id + '\'].parseCommand(\'/buttonmute ' + userid + '\');">Mute</button>';
				}
				banMuteBuffer += ' <button onclick="rooms[\'' + selfR.id + '\'].parseCommand(\'/buttonban ' + userid + '\');">Ban</button>';
				banMuteBuffer += ' <button onclick="rooms[\'' + selfR.id + '\'].parseCommand(\'/buttonkick ' + userid + '\');">Kick</button>';
				roomListCode = '<div class="action-form"><small>IP: <a href="http://www.geoiptool.com/en/?IP=' + data.ip + '" target="iplookup">' + data.ip + '</a></small>'+banMuteBuffer+'</div>' + roomListCode;
			}
		} else if (data.command === 'roomlist') {
			//if (!$('#' + selfR.id + '-roomlist').length) return;
			var roomListCode = '';
			var i = 0;
			for (var id in data.rooms) {
				var roomData = data.rooms[id];
				var matches = id.match(/^battle\-([a-z0-9]*[a-z])[0-9]*$/);
				var format = (matches ? '<small>[' + matches[1] + ']</small>\r\n' : '');
				var roomDesc = format + '<em class="p1">' + sanitize(roomData.p1) + '</em> <small class="vs">vs.</small> <em class="p2">' + sanitize(roomData.p2) + '</em>';
				if (!roomData.p1) {
					matches = id.match(/[^0-9]([0-9]*)$/);
					roomDesc = format + 'empty room ' + matches[1];
				} else if (!roomData.p2) {
					roomDesc = format + '<em class="p1">' + sanitize(roomData.p1) + '</em>';
				}
				roomListCode += 'Tab: ' + id + ' Desc:' + roomDesc;
				i++;
			}

			if (!roomListCode) {
				roomListCode = 'No battles are going on right now.';
			}
		} else if (data.command === 'savereplay') {
			var id = data.id;
			$.post(actionphp + '?act=uploadreplay', {
				log: data.log,
				id: data.id
			}, function(data) {
				if (data === 'success') {
					overlay('replayuploaded', id);
				} else {
					overlay('message', "Error while uploading replay: "+data);
				}
			});
		}
	};
	this.rooms = [];
	this.updateMainTop = function (force) {
		var text = '';
		var challenge = null;
		if (me.challengesFrom) {
			for (var i in me.challengesFrom) {
				challenge = me.challengesFrom[i];
				break;
			}
		}
		if (force) selfR.mainTopState = '';
		selfR.notifying = !! challenge;
		// updateRoomList();
		if (challenge) {
			if (selfR.mainTopState === 'challenge-' + challenge.from) return;
			selfR.mainTopState = 'challenge-' + challenge.from;

			if (me.lastChallengeNotification !== challenge.from) {
				notify({
					type: 'challenge',
					room: selfR.id,
					user: (me.users[challenge.from] || challenge.from),
					userid: challenge.from
				});
				me.lastChallengeNotification = challenge.from;
			}
			selfR.selectedFormat = toId(challenge.format);
			// text = '<div class="action-notify"><button class="closebutton" style="float:right;margin:-6px -10px 0 0" onclick="return rooms[\'' + selfR.id + '\'].formRejectChallenge(\'' + sanitize(challenge.from) + '\')"><i class="icon-remove-sign"></i></button>';
			// text += 'Challenge from: ' + (me.users[challenge.from] || challenge.from) + '\r\n<label class="label">Format:</label> ' + sanitize(challenge.format) + '</br >';
			// text += '' + selfR.getTeamSelect(challenge.format) + '\r\n';
			// text += '<button onclick="return rooms[\'' + selfR.id + '\'].formAcceptChallenge(\'' + sanitize(challenge.from) + '\')" id="' + selfR.id + '-gobutton"' + (selfR.goDisabled ? ' disabled="disabled"' : '') + '>Accept</button> <button onclick="return rooms[\'' + selfR.id + '\'].formRejectChallenge(\'' + sanitize(challenge.from) + '\')"><small>Reject</small></button></div>';
			text += "Select format screen";
		} else if (me.userForm) {
			var userid = toUserid(me.userForm);
			var name = (me.users[userid] || me.userForm);
			var groupDetails = {
				'~': "Administrator (~)",
				'&': "Leader (&amp;)",
				'@': "Moderator (@)",
				'%': "Driver (%)",
				'+': "Voiced (+)",
				'!': "<span style='color:#777777'>Muted (!)</span>"
			};
			var group = groupDetails[name.substr(0, 1)];
			if (group) name = name.substr(1);
			if (selfR.mainTopState === 'userform-' + userid) return;
			selfR.mainTopState = 'userform-' + userid;

			if (me.userForm === '#lobby-rooms') {
				text = '<div><button onclick="rooms[\'' + selfR.id + '\'].formCloseUserForm();return false"><i class="icon-chevron-left"></i> Back to lobby</button> <button onclick="rooms[\'' + selfR.id + '\'].send(\'/cmd roomlist\');return false"><i class="icon-refresh"></i> Refresh</button></div><div id="' + selfR.id + '-roomlist"><em>Loading...</em></div>';
				selfR.send('/cmd roomlist');
			} else {
				text = '<div class="action-form"><button style="float:right;margin:-6px -10px 0 0" class="closebutton" onclick="return rooms[\'' + selfR.id + '\'].formCloseUserForm()"><i class="icon-remove-sign"></i></button>';
				text += '<strong>' + sanitize(name) + '</strong>\r\n';
				text += '<small>' + (group || '') + '</small>\r\n';
				text += '<div id="' + selfR.id + '-userdetails-' + userid + '" style="height:85px"></div>';
				if (userid === me.userid) {
					text += '<button onclick="return rooms[\'' + selfR.id + '\'].formCloseUserForm()">Close</button></div>';
				} else {
					text += '<button onclick="$(\'#' + selfR.id + '-challengeform\').toggle();return false"><strong>Challenge</strong></button> <button onclick="rooms[\'' + selfR.id + '\'].popupOpen(\'' + userid + '\');rooms[\'' + selfR.id + '\'].formCloseUserForm();return false"><strong>PM</strong></button> <button onclick="return rooms[\'' + selfR.id + '\'].formCloseUserForm()">Close</button>';
					text += '</div><div class="action-form" style="display:none" id="' + selfR.id + '-challengeform">';
					text += selfR.getFormatSelect('challenge') + '\r\n';
					text += '' + selfR.getTeamSelect(selfR.selectedFormat) + '\r\n';
					text += '<button onclick="return rooms[\'' + selfR.id + '\'].formMakeChallenge(\'' + sanitize(userid) + '\')" id="' + selfR.id + '-gobutton"' + (selfR.goDisabled ? ' disabled="disabled"' : '') + '><strong>Make challenge</strong></button> <button onclick="$(\'#' + selfR.id + '-challengeform\').hide();return false">Cancel</button></div>';
				}
				text += '<div id="' + selfR.id + '-userrooms-' + userid + '"></div>';
				selfR.send('/cmd userdetails '+userid);
			}
		} else if (me.challengeTo) {
			if (selfR.mainTopState === 'challenging') return;
			selfR.mainTopState = 'challengeto';

			var teamname = 'Random team';
			if (selectedTeam >= 0) teamname = teams[selectedTeam].name;
			text = '<div class="action-waiting">Challenging: ' + (me.users[me.challengeTo.to] || me.challengeTo.to) + '\r\nFormat: ' + me.challengeTo.format + '\r\nTeam: ' + teamname + '\r\n<button onclick="return rooms[\'' + selfR.id + '\'].formCloseUserForm(\'' + sanitize(me.challengeTo.to) + '\')"><small>Cancel</small></button></div>';
		} else if (selfR.me.searching) {
			if (selfR.mainTopState === 'searching') return;
			selfR.mainTopState = 'searching';

			text = 'Format: ' + selfR.me.searching.format + '\r\nSearching...\r\n<button onclick="return rooms[\'' + selfR.id + '\'].formSearchBattle(false)"><small>Cancel</small></button></div>';
		} else {
			var roomListCode = '';
			for (var i=selfR.rooms.length-1; i>=0; i--) {
				var roomData = selfR.rooms[i];
				if (!roomListCode) roomListCode += '<h3>Watch battles:';
				var roomDesc = '<small>[' + roomData.format + ']</small>\r\n<em class="p1">' + sanitize(roomData.p1) + '</em> <small class="vs">vs.</small> <em class="p2">' + sanitize(roomData.p2) + '</em>';
				roomListCode += 'Tab: ' + roomData.id + ' Desc:' + roomDesc;
			}
			if (roomListCode) roomListCode += '<button onclick="rooms[\'' + selfR.id + '\'].formChallenge(\'#lobby-rooms\');return false">All battles &rarr;</button>';

			var searcherText = '';
			if (selfR.searcher) {
				searcherText = 'There be ' + selfR.searcher + ' others searching.</small>';
			}
			if (selfR.mainTopState === 'search-'+selfR.selectedFormat+(!selfR.goDisabled?'-nogo':'')) {
				
				return;
			}
			selfR.mainTopState = 'search-'+selfR.selectedFormat+(!selfR.goDisabled?'-nogo':'');

			text = '' + selfR.getFormatSelect('search') + '\r\n';
			text += '' + selfR.getTeamSelect(selfR.selectedFormat) + '\r\n';

			text += 'Searcher Text: ' + searcherText + '\r\n';

			text += 'Room List Code: ' + roomListCode;
		}
		logfunc(text);

		if (!challenge) {
			me.lastChallengeNotification = '';
		}
	};
	this.debounceUpdateTimeout = null;
	this.debounceUpdateQueued = false;
	this.debounceUpdate = function() {
		if (!selfR.debounceUpdateTimeout) {
			selfR.updateMainElem();
			selfR.debounceUpdateQueued = false;
			selfR.debounceUpdateTimeout = setTimeout(selfR.debounceUpdateEnd, 600);
		} else {
			selfR.debounceUpdateQueued = true;
		}
	};
	this.debounceUpdateEnd = function() {
		if (selfR.debounceUpdateQueued) {
			selfR.updateMainElem();
		}
		selfR.debounceUpdateTimeout = null;
	};
	this.updateMainElem = function (force) {
		selfR.updateMainTop(force);

		var text = '';
		text += '<ul class="userlist">';
		text += '<li style="text-align:center;padding:2px 0"><small>' + (selfR.userCount.users || '0') + ' users online:</small></li>';
		var Ranks = {
			'~': 2,
			'&': 2,
			'@': 1,
			'%': 1,
			'+': 1,
			' ': 0,
			'!': 0,
			'#': 0
		};
		var RankOrder = {
			'~': 1,
			'&': 2,
			'@': 3,
			'%': 4,
			'+': 5,
			' ': 6,
			'!': 7,
			'#': 8
		};
		var users = [];
		if (selfR.userList) users = Object.keys(selfR.userList).sort(function(a,b){
			var aRank = RankOrder[selfR.userList[a].substr(0,1)];
			var bRank = RankOrder[selfR.userList[b].substr(0,1)];
			if (aRank != bRank) return aRank - bRank;
			return (a>b?1:-1);
		});
		for (var i=0, len=users.length; i<users.length; i++) {
			var userid = users[i];
			var group = selfR.userList[userid].substr(0, 1);
			text += '<li' + (me.userForm === userid ? ' class="cur"' : '') + '>';
			if (me.named) {
				text += '<button class="userbutton" onclick="return rooms[\'' + selfR.id + '\'].formChallenge(\'' + sanitize(userid) + '\')">';
			} else {
				text += '<button class="userbutton" onclick="return rooms[\'' + selfR.id + '\'].formRename()">';
			}
			text += '<em class="group' + (Ranks[group]===2 ? ' staffgroup' : '') + '">' + sanitize(group) + '</em>';
			if (group === '~' || group === '&') {
				text += ' ' + userid + '">' + sanitize(selfR.userList[userid].substr(1)) + '</em></strong>';
			} else if (group === '%' || group === '@') {
				text += ' ' + userid + '">' + sanitize(selfR.userList[userid].substr(1)) + '</strong>';
			} else {
				text += ' ' + userid + '">' + sanitize(selfR.userList[userid].substr(1)) + '</span>';
			}
			text += '</button>';
			text += '</li>';
		}
		if (!users.length) {
			text += '<li>No named users online</li>';
		}
		if (selfR.userCount.unregistered) {
			text += '<li style="height:auto;padding-top:5px;padding-bottom:5px">';
			text += '<span style="font-size:10pt;display:block;text-align:center;padding-bottom:5px;font-style:italic">Due to lag, ' + selfR.userCount.unregistered + ' unregistered users are hidden.</span>';
			text += ' <button' + (me.challengeTo ? ' disabled="disabled"' : ' onclick="var gname=prompt(\'Challenge who?\');if (gname) rooms[\'' + selfR.id + '\'].formChallenge(gname);return false"') + '>Challenge an unregistered user</button>';
			text += '<div style="clear:both"></div>';
			text += '</li>';
		}
		if (selfR.userCount.guests) {
			text += '<li style="text-align:center;padding:2px 0"><small>(' + selfR.userCount.guests + ' guest' + (selfR.userCount.guests == 1 ? '' : 's') + ')</small></li>';
		}
		text += '</ul>';
//		selfR.mainBottomElem.html(text);
	};

	this.formRename = function () {
		overlay('rename');
		return false;
	};
	this.formSearchBattle = function (search, name) {
		if (!search) {
			selfR.send('/search');
		} else {
			if (!me.named) {
				overlay('rename');
				return false;
			}
			var format = $('#' + selfR.id + '-format').val();
			selectTeam($('#' + selfR.id + '-team').val());
			selfR.send('/search '+toId(format));
		}
		return false;
	};
	this.startBattle = function (format) {		
		format = format || 'randombattle';
		selectTeam(selectedTeam);
		selfR.send('/search ' + format);
	};
	this.formChallenge = function (user) {
		me.userForm = user;
		selfR.updateMainElem();
		return false;
	};
	this.getFormatSelect = function (selectType) {
		var text = '';
		text += '<label class="label">Format:</label> <select id="' + selfR.id + '-format" onchange="return rooms[\'' + selfR.id + '\'].formSelectFormat()">';
		var curSection = '';
		for (var i in BattleFormats) {
			var format = BattleFormats[i];
			var selected = false;
			if (format.effectType !== 'Format') continue;
			if (selectType && !format[selectType + 'Show']) continue;

			if (!selfR.selectedFormat) {
				if (selectType) selected = format[selectType + 'Default'];
				if (selected && !format.team && !teams.length) selected = false;
				if (selected) {
					selfR.selectedFormat = i;
				}
			} else {
				selected = (selfR.selectedFormat === i);
			}
			var details = '';
			if (format.rated && selectType === 'search') {
				//details = ' (rated)';
			}
			if (format.section && format.section !== curSection) {
				if (curSection) text += '</optgroup>';
				text += '<optgroup label="'+sanitize(format.section)+'">';
				curSection = format.section;
			}
			if (!format.section && curSection) text += '</optgroup>';
			text += '<option value="' + sanitize(i) + '"' + (selected ? ' selected="selected"' : '') + '>' + sanitize(format.name) + details + '</option>';
		}
		return text;
	};
	this.getTeamSelect = function (format) {
		if (!format) format = selfR.selectedFormat;
		var formatid = '';
		if (!format.name) {
			formatid = format;
			format = BattleFormats[toId(format)];
			if (!format) format = {id:formatid, name:formatid};
		}

		selfR.goDisabled = false;
		if (format.team) {
			return 'Team: Random Team\r\n';
		} else {
			var text = 'Teamselect:\r\nformSelectTeam()\r\n';
			if (!teams.length) {
				text += 'You have no teams\r\n';
				selfR.goDisabled = true;
			} else {
				var teamFormat = (format.teambuilderFormat || (format.isTeambuilderFormat ? formatid : false));
				for (var i = 0; i < teams.length; i++) {
					var selected = (i === selfR.selectedTeam);
					if ((!teams[i].format && !teamFormat) || teams[i].format === teamFormat) {
						text += 'Option value: ' + i + '\tn' + sanitize(teams[i].name) + '\t' + (selected ? 'selected\r\n' : '\r\n');
					}
				}
				text += 'Other teams:\r\n';
				for (var i = 0; i < teams.length; i++) {
					if ((!teams[i].format && !teamFormat) || teams[i].format === teamFormat) continue;
					text += 'Option value: ' + i + '\t' + sanitize(teams[i].name) + '\r\n';
				}
			}
			if (format.canUseRandomTeam) {
				text += '<option value="-1">Random Team</option>';
			}
			text += '</select></span>';
			return text;
		}
	};
	this.formSelectTeam = function () {
		var i = parseInt($('#' + selfR.id + '-team').val());
		if (i === 0 && !teams.length) selfR.goDisabled = true;
		else selfR.goDisabled = false;

		selfR.selectedTeam = i;
		if (AI.setTeam) AI.setTeam(teams[i]);

		selfR.updateMainTop();
	};
	this.formSelectFormat = function (format) {
		selfR.selectedFormat = $('#' + selfR.id + '-format').val();
		$('#' + selfR.id + '-teamselect').replaceWith(selfR.getTeamSelect());
		
		selfR.updateMainTop();
	};
	this.formMakeChallenge = function (userid) {
		requestNotify();
		var format = $('#' + selfR.id + '-format').val();
		me.userForm = '';
		selectTeam($('#' + selfR.id + '-team').val());
		selfR.send('/challenge '+userid+', '+format);
		return false;
	};
	this.formCloseUserForm = function (userid) {
		if (me.userForm) {
			me.userForm = '';
			selfR.updateMainElem();
			return false;
		}
		selfR.updateMainElem();
		selfR.send('/cancelchallenge '+userid);
		return false;
	};
	this.formAcceptChallenge = function (userid) {
		requestNotify();
		selectTeam($('#' + selfR.id + '-team').val());
		selfR.send('/accept '+userid);
		return false;
	};
	this.formRejectChallenge = function (userid) {
		selfR.send('/reject '+userid);
		return false;
	};
}

var me = {
	name: '',
	named: false,
	registered: false,
	userid: '',
	token: '',
	challengekeyid: -1,
	challenge: '',
	users: {},
	rooms: {},
	ignore: {},
	mute: false,
	lastChallengeNotification: '',
	pm: {},
	curPopup: '',
	popups: []
};
var rooms = {};

function addTab(tab, type) {
	switch (type) {
	case 'lobby':
		rooms[tab] = new Lobby(tab);
		break;
	case 'teambuilder':
		rooms[tab] = new Teambuilder(tab);
		break;
	case 'ladder':
		rooms[tab] = new Ladder(tab);
		break;
	case 'battle':
		rooms[tab] = new BattleRoom(tab);
		break;
	default:
		break;
	}
}

function parseSpecialData(text) {
		var parts = text.split('|');
		if (parts.length < 2) return false;

		switch (parts[1]) {
			case 'challenge-string':
			case 'challstr':
				me.challengekeyid = parseInt(parts[2], 10);
				me.challenge = parts[3];
				renameMe(name);
				return true;
		}
		return false;
	}

var events = {
		init: function (data) {
			console.log("Initialized: " + data.room);
			if (data.name) {
				me.name = data.name;
				me.named = data.named;
				me.userid = data.userid;
				me.renamePending = !! data.renamePending;
				if (data.token) me.token = data.token;
			}
			addTab(data.room, data.roomType);
			rooms[data.room].init(data);
		},
		update: function (data) {
			lastUpdate = JSON.stringify(data);
			if (typeof data.name !== 'undefined') {
				me.name = data.name;
				me.named = data.named;
				me.userid = data.userid;
				me.renamePending = !! data.renamePending;
				if (data.token) me.token = data.token;
			}
			if (typeof data.challengesFrom !== 'undefined') {
				me.challengesFrom = data.challengesFrom;
				rooms.lobby.notifying = false;
				for (var i in me.challengesFrom) {
					rooms.lobby.notifying = true;
					break;
				}
				//updateRoomList();
				rooms.lobby.updateMainTop();
			}
			if (typeof data.challengeTo !== 'undefined') {
				me.challengeTo = data.challengeTo;
				rooms.lobby.updateMainTop();
			}
			// updateMe(data);
			if (data.room && rooms[data.room]) {
				rooms[data.room].update(data);
			}
		},
		disconnect: function () {
			console.log("disconnect: ");
		},
		nameTaken: function (data) {
			console.log("nametaken: " + JSON.stringify(data));
		},
		message: function (data) {
			console.log("message: " + JSON.stringify(data));
		},
		command: function (data) {
			console.log("command: " + JSON.stringify(data));
		},
		console: function (data) {
			console.log("console: " + JSON.stringify(data));
		}
	};

socket.on('data', function (msg) {
			if (msg.substr(0,1) !== '{') {
				var text = msg;
				var roomid = 'lobby';
				if (text.substr(0,1) === '>') {
					var nlIndex = text.indexOf('\n');
					if (nlIndex < 0) return;
					roomid = text.substr(1,nlIndex-1);
					text = text.substr(nlIndex+1);
				}
				if (!parseSpecialData(text)) {
					rooms[roomid].add(text);
				}
				return;
			}
			var data = JSON.parse(msg);
			if (!data) return;
			if (events[data.type]) events[data.type](data);
		});

//for (e in events) socket.on(e, events[e]);
		
socket.on('error', function(e) {
		console.log('problem with request: ' + e);
	});
socket.on('connection', function()
	{
		console.log("\r\nSocket open. Join sent.");
		emit(socket, "join", {room:'lobby', name: name, token:''});
	});

function leaveTab(tab, confirm) {
	if (rooms[tab]) {
		rooms[tab].send('/leave');
		rooms[tab].dealloc();
		delete rooms[tab];
	}
}
	
function battleFinished(tab)
{	
	for (t in rooms){ 
		if (t == 'lobby') continue;
		if (rooms[t].kickTimer) clearTimeout(rooms[t].kickTimer);
		
		if (rooms[t].battle.didWin) {
			AI.addWin(rooms[t].battle);
			console.log("I won!");
		} else AI.addLose(rooms[t].battle);
		leaveTab(t);
	}
	if (AI.postGame) AI.postGame();
	AI.SaveState();
	
	if (typeof runnum != 'undefined'){
		runnum--;
		if (runnum == 0){
		stopvar = true;
		}
	}
	s();
}
function chooseMove(id, actions)
{
	if (rooms[id].kickTimer) clearTimeout(rooms[id].kickTimer);
	//rooms[id].kickTimer = setTimeout(rooms[id].formKickInactive, 120000);
	try{
		//AI.chooseMove(rooms[id], actions);
	}catch(e){console.log(e)}
}
function ChooseTeamPreview(actions, room, callback){
	AI.chooseTeamPreview();
}

function s()
{
	if (!stopvar)
		rooms.lobby.startBattle(format);
}
var stopvar = false;
function stop() {stopvar = true;}
var hardcoded = false;
var silent = false;
var format = 'ou'
var AI;
var teamfile = 'team.dat'
for (argi = process.argv.indexOf('test') + 1; argi < process.argv.length; argi++)
{
	var arg = process.argv[argi];
	if (arg.indexOf('-') >= 0)
	{
		switch(arg.slice(1))
		{
			case 'runnum':
				runnum = parseInt(process.argv[++argi]);
				console.log("Limited to " + runnum + " runs.")
				break;
			case 'uct':
				AI = require('./uctAI.js');
				break;
			case 'hardcoded':
				AI = require('./GreedyAI.js');
				break;
			case 'silent':
				silent = true;
				break;
			case 'format':
				arg = process.argv[++argi];
				format = arg;
				break;
			case 'server':
				Config.serverid = process.argv[++argi];
				break;
			default:
				if (arg.indexOf("team") == 1)
				{
					teamfile = arg.split(":")[1];
					console.log("Team file: " + teamfile);
				}
				break;
		}
	}
}
if (!AI) AI = require('./uctAI.js');
AI.format = format;
teams.push(
	{
	name: "Default",
	format: "ou",
	team: require('./teams/team.js').parse(teamfile)
	});

var rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
function performOp(answer) {
  try{
	console.log(eval(answer));
	}
	catch(m)
	{
	console.log("Error: " + m);
	}
  rl.question("Operation? ", performOp);
}
rl.question("Operation?", performOp);