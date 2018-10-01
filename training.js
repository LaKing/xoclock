#!/bin/node

console.log("Starting Xoclock - training mode");

// load libs
var http = require("http");
var https = require("https");
var auth = require('http-auth');
var fs = require("fs");
var sys = require('sys');
var exec = require('child_process').exec;
var crypto = require('crypto');
var hash_typ = "sha512";
var hash_dig = "hex";
var express = require('express');


console.reset = function () {
  return process.stdout.write('\033c');
};

function timeFormat(t) {
    var str = '';
    var m = Math.floor(t / 60);
    var s = t - m * 60;


    if (m < 10) str += '0' + m;
    else str = String(m);

    str += ':';

    if (s < 10) str += '0' + s;
    else str += '' + s;

    return str;
};

// https needs certificates
var options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("crt.pem")
};

var settings = {};
try {
    settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
} catch(err) {
    console.log("didnt load settings.json ",err)
}

if (!settings.training) settings.training = {};
if (!settings.volume) settings.volume = {};

if (!settings.volume.music) settings.volume.music = 30;
if (!settings.training.announce) settings.training.announce = 'on';

if (!settings.keys_port) settings.keys_port = 8000;

var keys_basic = auth.basic({
    realm: "Xoclock keys."
}, function(username, password, callback) {
    // Custom authentication method. 
    // var hash = crypto.createHash(hash_typ).update(password).digest(hash_dig);
    if (password === settings.keys_pass) {
        //console.log("authenticated as admin");
        callback(true);
        return;
    }

    console.log("KEYS failed");

    callback(false);
    return;
});


// HTTPS for admins and team captains
// var xoclockapp = express();


// update. We dont use basic auth, but rather a passpin based auth.
// xoclockapp.use(auth.connect(basic));


// keys for buzzers, and keypresses
var keys = express();
keys.use(auth.connect(keys_basic));
var keysServer = https.createServer(options, keys);


// speak
function s(s) {
    if (settings.training.announce === 'on')
        var child = exec('/bin/bash speak.sh "' + s + '"',
            function(error, stdout, stderr) {
                if (error !== null) {
                    console.log("exec error: " + error);
                }
            });
};

// speak delayed
function sd(s) {
    if (settings.training.announce === 'on')
        var child = exec('sleep 1 && /bin/bash speak.sh "' + s + '"',
            function(error, stdout, stderr) {
                if (error !== null) {
                    console.log("exec error: " + error);
                }
            });
};


function start_sound() {
    var child = exec('aplay ./beep/start_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};
function stop_sound() {
    var child = exec('aplay ./beep/stop_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};
function click_sound() {
    var child = exec('aplay ./beep/click_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};

function ping_sound() {
    var child = exec('aplay ./beep/ping_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};
function pingping_sound() {
    var child = exec('aplay ./beep/pingping_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};


function music_on() {
    if (settings.volume.music > 0)
        var child = exec('/bin/bash music_on.sh ' + (50 + settings.volume.music * 2),
            function(error, stdout, stderr) {
                if (error !== null) {
                    console.log("exec error: " + error);
                }
            });
};

function music_off() {
    var child = exec('/bin/bash music_off.sh',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};

function music_op(arg) {
    var child = exec('/bin/bash music_op.sh '+arg,
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};

var b = 70;

function a() {
    console.log("ACTION");
    if (b < 0) {
	b = 200;
	stop_sound();
	music_on();
    }
    else 
    if(b<=16) b=600;
    else b = 16;
}

// THE MAIN CLOCK
setInterval(function() {

    b--;

            if (b === 14) music_off();
            if (b === 11) {
                console.log("COUNTDOWN!");
            }
            if (b === 12) s('10 seconds');

            if (b === 31) {
                pingping_sound();
                sd('30 seconds');
            }
            if (b === 61) {
                ping_sound();
                sd('1 minute');
            }

            if (b === 120) s('2 minutes');
            if (b > 0 && b < 11) click_sound();
            if (b === 0) {
                console.log('GAME ON!');

                start_sound();
                music_off();
            }
    console.reset();
    if (b>0) console.log(b);
    else console.log(timeFormat(-b));

}, 1000);


keys.get('/time', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/start', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/nopoint', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/approve', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/resume', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/left', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/right', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/pointleft', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/pointright', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/leftpit', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/rightpit', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/technical-timeout', function (req, res) {
    a();
    res.send("OK");
});

keys.get('/nopoint', function (req, res) {
    a();
    res.send("OK");
});




keysServer.listen(settings.keys_port);



/*




// read input files

// TEAM INDEX
var index = [{},{}];

// set some defaults
index[0].team = "Local Team";
index[1].team = "Guest Team";

index[0].pin = "1111";
index[1].pin = "2222";

var groups = [{
    a: 0,
    b: 1
}];


// main xoclock object for currently running game
var xo = {};
    xo.game_group = 0;

if (groups.length > 0) xo.groups = groups;


try {
    xo = JSON.parse(fs.readFileSync('xo.json', 'utf8'));
    console.log("loaded xo.json to continue.");
} catch(err) {
    console.log("didnt load the xo.json ", err);
}


try {
    index = JSON.parse(fs.readFileSync('index.json', 'utf8'));
    console.log("Team-ndex loaded");
} catch(err) {
    console.log("didnt load index.json ",err)
}


try {
    groups = JSON.parse(fs.readFileSync('groups.json', 'utf8'));
    console.log("groups loaded");
} catch(err) {
    console.log("didnt load groups.json ",err)
}


function save() {
    fs.writeFile('xo.json', JSON.stringify(xo, null, 4), function(err) {
    if(err) {
    	    console.log(err);
	} else {
    	    //console.log("xo JSON saved.");
	}
    });
}

//if (groups.length > 1 && !xo.groups) xo.groups = groups;

if (groups.length > 0) xo.groups = groups;



// verify team index format and files
function check_team_index() {
    console.log("Check team index")
    for (var i = 0; i < index.length; i++) {
        // check teamname
        if (!index[i].team) index[i].team = "Team-" + i;

        // check password
        //if (!index[i].hash && !index[i].pass) {
        //    var pass = Math.random().toString(36).slice(9);
        //    index[i].hash = crypto.createHash(hash_typ).update(pass).digest(hash_dig);
        //    console.log("ADDED team/password for " + index[i].team + " password: " + pass);
        //}

        // check sounds
        get_team_mp3(index[i].team);

    }
};


// verify team index format and files
function find_team_by_pin(pin) {

    for (var i = 0; i < index.length; i++) {

        // check password hash
        //if (!index[i].hash && !index[i].pass) {
        //    var pass = Math.random().toString(36).slice(9);
        //    index[i].hash = crypto.createHash(hash_typ).update(pass).digest(hash_dig);
        //    console.log("ADDED team/password for " + index[i].team + " password: " + pass);
        //}

        if (index[i].pin == pin) return index[i].team;

    }

    return "visitor";
};

//console.log('admin ' + crypto.createHash(hash_typ).update('xxxxxx').digest(hash_dig));

// helper function to get the username from http-auth in socket.io
function getUserName(socket) {
    if (!socket.handshake.headers.authorization) return;
    if (socket.handshake.headers.authorization.search('Basic ') !== 0) return;
    var auth = new Buffer(socket.handshake.headers.authorization.split(' ')[1], 'base64').toString().split(":");
    return auth.shift();
};


// Set the default ports
if (!settings.http_port) settings.http_port = 80;
if (!settings.https_port) settings.https_port = 443;
if (!settings.keys_port) settings.keys_port = 8000;

// default is an empty password - for testing and devel!
if (!settings.admin_hash) settings.admin_hash = "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e";
if (!settings.admin_pin) settings.admin_pin='0000';

// default admin username
if (!settings.admin_user) settings.admin_user = 'admin';

// minimum time for the other group to enter the filed
if (!settings.entrytime) settings.entrytime = 31;

// delay for announcments and such, ..
if (!settings.clock_delay) settings.clock_delay = 10;

if (!settings.volume) settings.volume = {};

if (!settings.volume.music) settings.volume.music = 30;
if (!settings.volume.announce) settings.volume.announce = 'on';

if (!settings.format) settings.format = {}

//{
//    "teamsize": "5 on 5",
//    "condition": "mercy at 4 points lead",
//    "gametime": "10 minutes",
//    "rules": "m-500 format x-ball",
//    "breaktime": "2 minutes",
//    "overtime": "3 minutes",
//    "pitsystem": "simple",
//    "timeouts": 1
//};

if (!settings.format.teamsize) settings.format.teamsize = "5 on 5";
if (!settings.format.condition) settings.format.condition = "mercy at 4 points lead";
if (!settings.format.gametime) settings.format.gametime = "10 minutes";
if (!settings.format.rules) settings.format.rules = "m-500 format x-ball";
if (!settings.format.breaktime) settings.format.breaktime = "2 minutes";
if (!settings.format.overtime) settings.format.overtime = "3 minutes";
if (!settings.format.pitsystem) settings.format.pitsystem = "simple";
if (!settings.format.timeouts) settings.format.timeouts = "1";


// block double keypresses and sound overlays
var block = 0;

// delay for speaches and such if > 0, switch teams to play if === 0, nothing to do if < 0;
var clock_delay = -1;


// bool - for each game
var overtime;

// win condition
var race_to = 0; // points
var mercy_at = 0; // points

// selected team index in the pits
// a vs b and c vs d
//var pit = groups[0];
// pit is obsolete, we use xo.groups[xo.game_group]

// xo.dual_pits = false;
// if (settings.format.pitsystem === "dual") xo.dual_pits = true;

function is_dualpit(group) {
    if (typeof group.b === "number" && typeof group.c === "number") return true;
    return false;
}

function init_xo(gg) {
    console.log("init_xo_game",gg);
    // argument is xo.groups[xo.game_group] object or a custom version of it

    // outer - a match is team vs team going for points 
    xo.match_live = false;
    // inner - if the game is live, on live field, players free to fire
    xo.game_live = false;
    // the status string gets displayed
    xo.status = 'prepare for the game';
    // the group index currently in the pit
    xo.gr = 0;
    // one or two objects describing the current pit situation
    xo.grs = [];

    var d = is_dualpit(gg);

    xo.grs[0] = {};
    if (d) xo.grs[1] = {};
    
    // left and right
    xo.grs[0].l = {};
    xo.grs[0].r = {};
    if (d) xo.grs[1].l = {};
    if (d) xo.grs[1].r = {};

    xo.grs[0].l.team = index[gg.a].team;
    xo.grs[0].r.team = index[gg.b].team;
    if (d) xo.grs[1].l.team = index[gg.c].team;
    if (d) xo.grs[1].r.team = index[gg.d].team;

    xo.grs[0].l.points = 0;
    xo.grs[0].r.points = 0;
    if (d) xo.grs[1].l.points = 0;
    if (d) xo.grs[1].r.points = 0;

    xo.grs[0].l.timeouts = settings.format.timeouts;
    xo.grs[0].r.timeouts = settings.format.timeouts;
    if (d) xo.grs[1].l.timeouts = settings.format.timeouts;
    if (d) xo.grs[1].r.timeouts = settings.format.timeouts;

    // each group has its own gametime     
    xo.grs[0].g = settings.gametime;
    if (d) xo.grs[1].g = settings.gametime;
    xo.grs[0].b = settings.breaktime;
    if (d) xo.grs[1].b = settings.breaktime;

    xo.grs[0].overtime = false;
    if (d) xo.grs[1].overtime = false;
    xo.grs[0].overtime1v1 = false;
    if (d) xo.grs[1].overtime1v1 = false;

    xo.grs[0].playing = true;
    if (d) xo.grs[1].playing = true;

    xo.delay = 0;

    // by field
    xo.left_team_time=false;
    xo.right_team_time=false;

};

function setBreakTime() {
    if (xo.grs[xo.gr].b < settings.breaktime)
        xo.grs[xo.gr].b = settings.breaktime;
};

function select_format() {

    settings.gametime = 60 * Number(settings.format.gametime.substr(0, 2));
    settings.breaktime = 60 * Number(settings.format.breaktime.substr(0, 2));
    settings.overtime = 60 * Number(settings.format.overtime.substr(0, 2));

    if (settings.format.condition.substring(0, 7) === "race to") {
        race_to = Number(settings.format.condition.substring(8, 10));
        settings.format.condition = "race to " + race_to;
    } else race_to = 0;

    if (settings.format.condition.substring(0, 8) === "mercy at") {
        mercy_at = Number(settings.format.condition.substring(9, 10));
        settings.format.condition = "mercy at " + mercy_at + " points lead";
    } else mercy_at = 0;

    //xo.dual_pits = (settings.format.pitsystem === "dual");
    xo.training_mode = (settings.format.rules === 'training mode');

    if (settings.breaktime === 0) settings.breaktime = 15;

};

// authentication-related
var basic = auth.basic({
    realm: "Xoclock admin."
}, function(username, password, callback) {
    // Custom authentication method. 
    var hash = crypto.createHash(hash_typ).update(password).digest(hash_dig);

    if (hash === settings.admin_hash) {
        //console.log("authenticated as admin");
        callback(true);
        return;
    }

    for (var i = 0; i < index.length; i++) {
        if (hash === index[i].hash && username === index[i].team) {
            callback(true);
            return;
        }
        if (password === index[i].pass && username === index[i].team) {
            callback(true);
            return;
        }
    }

    console.log("AUTH failed for " + username + " '" + hash + "' :(");

    callback(false);
    return;
});


var keys_basic = auth.basic({
    realm: "Xoclock keys."
}, function(username, password, callback) {
    // Custom authentication method. 
    // var hash = crypto.createHash(hash_typ).update(password).digest(hash_dig);

    if (password === settings.keys_pass) {
        //console.log("authenticated as admin");
        callback(true);
        return;
    }

    console.log("KEYS failed");

    callback(false);
    return;
});

// HTTPS for admins and team captains
var xoclockapp = express();


// update. We dont use basic auth, but rather a passpin based auth.
// xoclockapp.use(auth.connect(basic));


xoclockapp.use(express.static('public'));

var httpsServer = https.createServer(options, xoclockapp);
var io = require('socket.io')(httpsServer);

// readonly-io HTTP for readers, screens, etc
var readonlyapp = express();
readonlyapp.use(express.static('public'));

var httpServer = http.createServer(readonlyapp);
var rio = require('socket.io')(httpServer);

// keys for buzzers, and keypresses
var keys = express();
keys.use(auth.connect(keys_basic));
var keysServer = https.createServer(options, keys);

// node-to-bash functions
function get_team_mp3(s) {
    var child = exec('/bin/bash gettext.sh "' + s + '"',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};

// speak
function s(s) {
    if (settings.volume.announce === 'on')
        var child = exec('/bin/bash speak.sh "' + s + '"',
            function(error, stdout, stderr) {
                if (error !== null) {
                    console.log("exec error: " + error);
                }
            });
};

// speak delayed
function sd(s) {
    if (settings.volume.announce === 'on')
        var child = exec('sleep 1 && /bin/bash speak.sh "' + s + '"',
            function(error, stdout, stderr) {
                if (error !== null) {
                    console.log("exec error: " + error);
                }
            });
};


function start_sound() {
    var child = exec('aplay ./beep/start_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};
function stop_sound() {
    var child = exec('aplay ./beep/stop_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};
function click_sound() {
    var child = exec('aplay ./beep/click_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};

function ping_sound() {
    var child = exec('aplay ./beep/ping_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};
function pingping_sound() {
    var child = exec('aplay ./beep/pingping_sound.wav',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};


function music_on() {
    if (settings.volume.music > 0)
        var child = exec('/bin/bash music_on.sh ' + (50 + settings.volume.music * 2),
            function(error, stdout, stderr) {
                if (error !== null) {
                    console.log("exec error: " + error);
                }
            });
};

function music_off() {
    var child = exec('/bin/bash music_off.sh',
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};

function music_op(arg) {
    var child = exec('/bin/bash music_op.sh '+arg,
        function(error, stdout, stderr) {
            if (error !== null) {
                console.log("exec error: " + error);
            }
        });
};

function timeFormat(t) {
    var str = '';
    var m = Math.floor(t / 60);
    var s = t - m * 60;


    if (m < 10) str += '0' + m;
    else str = String(m);

    str += ':';

    if (s < 10) str += '0' + s;
    else str += '' + s;

    return str;
};

xo.status = 'Xoclock started.';

// broadcast xoclock object
function screen() {
    io.emit('xo', xo);
    rio.emit('xo', xo);
    save();
};

function setDelay() {
    clock_delay = settings.clock_delay;
    if (xo.training_mode) clock_delay = 2;
};

function game_log(str) {
    console.log(str + " GAME " + xo.grs[xo.gr].l.team + " VS " + xo.grs[xo.gr].r.team + " (" + xo.grs[xo.gr].l.points + "-" + xo.grs[xo.gr].r.points + ") gametime: " + xo.grs[xo.gr].g + "sec Status: " + xo.status);
};
// the | characters indicates a team-name on speach
function announce_point(team, towel) {

    var l = xo.grs[xo.gr].l;
    var r = xo.grs[xo.gr].r;

    var by = ", scored a point";
    if (towel) by = ", threw the towel";

    if (l.points < 10 && r.points < 10) sd("|" + team + by + ", state of the game is, " + l.points + "-" + r.points);
    else sd("|" + team + by + ", state of the game is, " + l.points + ", " + r.points);

};

function announce_score(point) {

    var l = xo.grs[xo.gr].l;
    var r = xo.grs[xo.gr].r;

    var pre = "game over, ";
    if (point) pre = "point, game over, ";
    var post = "";
    if (!xo.grs[0].playing && !xo.grs[0].playing) post += ', barrel-socks on';

    if (l.points < 10 && r.points < 10) sd(pre + "|" + l.team + ", against, |" + r.team + ", " + l.points + "-" + r.points + post);
    else sd(pre + "|" + l.team + ", against, |" + r.team + ", " + l.points + ", " + r.points + post);
};

function checkWin(point, team, towel) {
    // on point, on towel, on time-0
    // in current group. Arguments only for announcement

    // local variable, is this group game still on?
    var on = true;

    // check points according to format
    if (race_to > 0 && (xo.grs[xo.gr].l.points >= race_to || xo.grs[xo.gr].r.points >= race_to)) on = false;
    if (mercy_at > 0 && Math.abs(xo.grs[xo.gr].l.points - xo.grs[xo.gr].r.points) >= mercy_at) on = false;
    if (xo.grs[xo.gr].overtime && xo.grs[xo.gr].l.points !== xo.grs[xo.gr].r.points) on = false;

    if (on && xo.grs[xo.gr].g < 6) {
        // gametime very low
        xo.grs[xo.gr].g = 0;

        // on equal points
        if (xo.grs[xo.gr].l.points == xo.grs[xo.gr].r.points) {
            xo.status += ' Stalemate.';
            if (xo.grs[xo.gr].overtime) {

                // set up the one on one to be played
                xo.status += ' One-on-One.';
                game_log("Stalemate. One-on-One.");
                if (xo.grs[xo.gr].overtime1v1) xo.grs[xo.gr].b = 70;
                else xo.grs[xo.gr].b = 130;
                xo.grs[xo.gr].g = 120;
                sd("select a player to compete in a one on one" );
                xo.grs[xo.gr].overtime1v1=true;

            } else {
                if (settings.overtime > 0) {
                   // set overtime
                   xo.grs[xo.gr].overtime = true;
                   xo.grs[xo.gr].g = settings.overtime;
                   xo.status += ' Overtime! ';
                   game_log("OVERTIME");
                   sd('overtime');
                } else {
            	    sd('game over');
            	    on = false
                };
            }

        // game over by gametime, with a winner
        } else on = false;
    }

    if (!on && xo.grs[xo.gr].playing) {
        // the game ended just now.

        if (xo.grs[xo.gr].l.points > xo.grs[xo.gr].r.points) xo.status += ' ' + xo.grs[xo.gr].l.team + ' wins.';
        if (xo.grs[xo.gr].l.points < xo.grs[xo.gr].r.points) xo.status += ' ' + xo.grs[xo.gr].r.team + ' wins.';
        announce_score(point);
        xo.status += " GAME OVER";
        screen();
        game_log("GAME-OVER");

        //xo.grs[xo.gr].b = 0;
        //xo.grs[xo.gr].g = 0;
    }

    // group is playing
    
    if (on && point) announce_point(team, towel);

    xo.grs[xo.gr].playing = on;
};

function checkGameOver() {

	if (xo.grs.length > 1)
        if (!xo.grs[0].playing && !xo.grs[1].playing) {
            xo.match_live = false;
            xo.status = "BOTH GAMES OVER";
            screen();
        }

	if (xo.grs.length === 1)
        if (!xo.grs[0].playing) {
            xo.match_live = false;
            xo.status = "GAME OVER!";
            screen();
        }

}

function performSwitch() {
    clock_delay = -1;

    // dont swich if we are after the overtime in a 1v1
    // if (xo.grs[xo.gr].overtime1v1) return;

    if (xo.grs.length > 1) {
        // dual pits - set group
        if (xo.grs[0].playing && xo.grs[1].playing) xo.gr = Math.abs(xo.gr - 1);
        if (xo.grs[0].playing && !xo.grs[1].playing) xo.gr = 0;
        if (!xo.grs[0].playing && xo.grs[1].playing) xo.gr = 1;
    }

    if (xo.grs[xo.gr].b < settings.entrytime) xo.grs[xo.gr].b = settings.entrytime;
    if (xo.training_mode) xo.grs[xo.gr].b = 20;
    xo.status = "enter the field."
    screen();
};


/// START THE PROGRAM

select_format();
check_team_index();

if (!xo.grs) init_xo(xo.groups[xo.game_group]);

var g = 0;
var b = 0;

// THE MAIN CLOCK
setInterval(function() {

    block--;
    io.emit('block', block);
    rio.emit('block', block);

    // clock delay has highest priority
    if (clock_delay > 0) {
        clock_delay--;
        io.emit('clock_delay', clock_delay);
        rio.emit('clock_delay', clock_delay);
        return;
    }

    checkGameOver()

    // a match is played, clocks are running
    if (xo.match_live) {

        if (clock_delay === 0) performSwitch();

        if (xo.grs.length > 1) {
            xo.grs[Math.abs(xo.gr - 1)].b--;
        }

        // the game is live, field is live
        if (xo.game_live) {

            // clock calc
            if (xo.grs[xo.gr].g > 0) xo.grs[xo.gr].g--;
            g = xo.grs[xo.gr].g;

            if (g === 60 && !xo.grs[xo.gr].overtime1v1) s('attention 60 seconds rule applies');

            if (g === 0) {
                // gametime is up.
                stop_sound();
                xo.game_live = false;
                xo.status = "Time is up. ";
                setDelay();
                setBreakTime();
                checkWin(false, null, null);

                music_on();

                screen();
                return;

            }
            io.emit('g', g);
            rio.emit('g', g);
        }


        // we are in a break
        if (!xo.game_live) {

            // clock calc
            if (xo.grs[xo.gr].b > 0) xo.grs[xo.gr].b--;
            b = xo.grs[xo.gr].b;

            if (b === 14) music_off();
            if (b === 11) {
                xo.status = "COUNTDOWN!";
                screen();
            }
            if (b === 12) s('10 seconds');

            if (b === 31) {
                pingping_sound();
                sd('30 seconds');
            }
            if (b === 61) {
                ping_sound();
                sd('1 minute');
            }

            if (b === 120) s('2 minutes');
            if (b > 0 && b < 11) click_sound();
            if (b === 0) {
                xo.status = 'GAME ON!';
                if (xo.grs[xo.gr].overtime) xo.status = 'OVERTIME GAME ON!';
                if (xo.grs[xo.gr].overtime1v1) xo.status = 'One-on-One GAME ON!';

                start_sound();
                music_off();
                xo.game_live = true;
                screen();
                game_log("GAME ON!");
            }
            io.emit('b', b);
            rio.emit('b', b);

        }
    }
}, 1000);

function edit_time(msg) {

    if (msg === 'g+') xo.grs[xo.gr].g += 10;
    if (msg === 'g-') xo.grs[xo.gr].g -= 10;
    if (msg === 'b+') xo.grs[xo.gr].b += 10;
    if (msg === 'b-') xo.grs[xo.gr].b -= 10;

    if (xo.grs[xo.gr].b < 0) xo.grs[xo.gr].b = 0;
    if (xo.grs[xo.gr].g < 0) xo.grs[xo.gr].g = 0;

    io.emit('g', xo.grs[xo.gr].g);
    rio.emit('g', xo.grs[xo.gr].g);
    io.emit('b', xo.grs[xo.gr].b);
    rio.emit('b', xo.grs[xo.gr].b);

}

function register_points() {

            if (xo.gr === 0) {
                xo.groups[xo.game_group].a_points = xo.grs[xo.gr].l.points;
                xo.groups[xo.game_group].b_points = xo.grs[xo.gr].r.points;
            }

            if (xo.gr === 1) {
                xo.groups[xo.game_group].c_points = xo.grs[xo.gr].l.points;
                xo.groups[xo.game_group].d_points = xo.grs[xo.gr].r.points;
            }
}

function edit_points(msg) {
    var f = msg.f;
    var g = msg.g;
    var p = msg.p + '_points';

    console.log('edit_points',f,g,p)

    if (xo.groups[g][p] === undefined) xo.groups[g][p] = 0;

    if (f === '+') xo.groups[g][p]++;
    if (f === '-') xo.groups[g][p]--;

    if (xo.groups[g][p] < 0) xo.groups[g][p] = 0;

    if (xo.game_group === g) {
        if (msg.p === 'a') xo.grs[0].l.points = xo.groups[g][p];
        if (msg.p === 'b') xo.grs[0].r.points = xo.groups[g][p];
        if (xo.grs.length > 1) {
    	    if (msg.p === 'c') xo.grs[1].l.points = xo.groups[g][p];
    	    if (msg.p === 'd') xo.grs[1].r.points = xo.groups[g][p];
	}
    }
    

    screen();
}

function on_start_game() {

            if (block > 0) return;
            else block = 1;

            clock_delay = -1;

            init_xo(xo.groups[xo.game_group]);

            // start of the game
            xo.game_live = false;
            xo.match_live = true;

            screen();

            //if (!xo.training_mode)
            s('game started, barrel-socks can be taken off');

            game_log("START-GAME");

            music_on();

}

function on_start() {

            if (block > 0) return;
            else block = 5;

            if (xo.game_live) return;

            clock_delay = -1;

            xo.match_live = true;

                if (xo.training_mode) {
                    xo.grs[xo.gr].b = 4;
                    //block = 5;
                    music_off();

                } else {
                    s('field is live');
                    xo.grs[xo.gr].b = 15;
                    //block = 16;
                }

                xo.left_team_time=false;
                xo.right_team_time=false;

            xo.status = "START!";
            screen();
}

function on_time(i) {
    // l, r, a, buzzer is field-side sensitive

	    var sch = false;
	    if ((xo.grs[xo.gr].l.points + xo.grs[xo.gr].r.points) % 2 === 1) sch = true;

            if (block > 0) return;

            if (!xo.game_live) return;
            if (xo.left_team_time || xo.right_team_time) {
                if (xo.left_team_time && i === 'l') on_resume();
                if (xo.right_team_time && i === 'r') on_resume();
                return;
            }

            block = 4;

            xo.status = "TIME!";

            stop_sound();
            sd("time");

            xo.match_live = false;

            if (i==='l') xo.left_team_time=true;
            if (i==='r') xo.right_team_time=true;

            screen();

}

function on_approve() {

            var sch = false;
            if ((xo.grs[xo.gr].l.points + xo.grs[xo.gr].r.points) % 2 === 1) sch = true;

            if (!sch && xo.left_team_time) on_point('l')
            if (!sch && xo.right_team_time) on_point('r');
            if (sch && xo.left_team_time) on_point('r')
            if (sch && xo.right_team_time) on_point('l');

}

function on_resume() {

            if (block > 0) return;
            block = 2;

            if (xo.match_live) return;
            if (!xo.game_live) return;

            xo.status = "GAME!";
            start_sound();
            sd("clock running");

            xo.match_live = true;
            xo.left_team_time=false;
            xo.right_team_time=false;

            screen();
}

function on_technical_timeout() {

            if (block > 0) return;


            if (xo.match_live) {
                xo.status = "TECHNICAL TIMEOUT";
                if (xo.game_live) {
                    stop_sound();
                    sd("technical timeout");
                } else {
                    s("technical timeout");
                }
                xo.match_live = false;

                block = 4;
                screen();
                return;
            }

            if (!xo.match_live) {

                 // start countdown from 15 after a technical timeout
                 if (xo.grs[xo.gr].b < 15 && xo.grs[xo.gr].b > 0) xo.grs[xo.gr].b = 15;

                 s("clock running");
                 xo.status = "clock running!";
                 xo.match_live = true;
                 block = 2;
                 screen();
                 return;
            }
}


function on_stop_game() {

            block = 2;

            if (xo.game_live) stop_sound();

            s("barrel-socks on, game over");
            xo.status = "Game over!";

            xo.match_live = false;
            xo.game_live = false;

            game_log("GAME OVER pressed");

            screen();
            music_on();
}

function on_nopoint() {

            if (block > 0) return;
            else block = 2;

            if (xo.game_live) {

                stop_sound();

                sd('no point');
                xo.status = 'No point';

                xo.match_live = true;
                xo.game_live = false;
                xo.left_team_time=false;
                xo.right_team_time=false;

                if (xo.grs[xo.gr].overtime) {
                    xo.grs[xo.gr].playing = false;
                    xo.status = 'No overtime-point';
                }

                setBreakTime();
                setDelay();
                screen();

                game_log("NO POINT");
            }
            music_on();
}

function on_noshow(i) {

        if (block > 0) return;
        else block = 2;


        xo.match_live = true;
        xo.game_live = false;
        xo.grs[xo.gr].playing = false;

        var par;
        // first reversed - adding points
        if (i === 'l') par = xo.grs[xo.gr].r;
        if (i === 'r') par = xo.grs[xo.gr].l;
        par.points = 1;

        var tar;
        if (i === 'l') tar = xo.grs[xo.gr].l;
        if (i === 'r') tar = xo.grs[xo.gr].r;
        tar.points = 0;

        stop_sound();
        game_log("NO SHOW");

        sd('|' + tar.team +', no show');
        xo.status = tar.team + " no show, " + par.team + " wins.";

        register_points();

        setBreakTime();
        setDelay();

        screen();


        music_on();
}

function on_point(i) {

            if (block > 0) return;
            else block = 2;

            // are we in a break?
            if (b !== 0) return;
            if (clock_delay > -1) return;


            stop_sound();
            xo.game_live = false;

            xo.left_team_time=false;
            xo.right_team_time=false;

            var tar;
            if (i === 'l') tar = xo.grs[xo.gr].l;
            if (i === 'r') tar = xo.grs[xo.gr].r;

            tar.points++;
            register_points();

            xo.status = 'Point for ' + tar.team + '! ';
            game_log("POINT");

            xo.match_live = true;

            checkWin(true, tar.team, false);
            setBreakTime();
            setDelay();
            screen();

            music_on();

}

function on_timeout(i) {

        if (block > 0) return;
        else block = 3;

        if (clock_delay > 0) return;

        var tar;
        if (i === 'l') tar = xo.grs[xo.gr].l;
        if (i === 'r') tar = xo.grs[xo.gr].r;

        if (!xo.game_live && tar.timeouts > 0) {
            xo.grs[xo.gr].b += 60;

            s('|' + tar.team + ', requested the timeout');

            tar.timeouts--;

            xo.status = 'Timeout ' + tar.team;
            screen();
        }

        game_log("TIMEOUT");

}

function on_towel(i) {

        if (block > 0) return;
        else block = 3;

        if (clock_delay > 0) return;

        if (!xo.game_live) return;

        var par;
        // first reversed - adding points
        if (i === 'l') par = xo.grs[xo.gr].r;
        if (i === 'r') par = xo.grs[xo.gr].l;
        par.points++;
        
        register_points();

	var tar;
        // selected arguments
        if (i === 'l') tar = xo.grs[xo.gr].l;
        if (i === 'r') tar = xo.grs[xo.gr].r;

        stop_sound();
        xo.game_live = false;

        xo.status = 'Towel ' + tar.team;
        game_log("TOWEL");

        checkWin(true, tar.team, true);

        setBreakTime();
        setDelay();

        screen();


        music_on();

}


function on_penalty(i,p) {
    // side-sensitive

    if (block > 0) return;
    else block = 3;

    if (!xo.game_live) return;

    // sidechange
    var sch = false;
    if ((xo.grs[xo.gr].l.points + xo.grs[xo.gr].r.points) % 2 === 1) sch = true;

    var par;
    var tar;

    // partner team
    if (!sch && i === 'l') par = xo.grs[xo.gr].r;
    if (!sch && i === 'r') par = xo.grs[xo.gr].l;
    // target team
    if (!sch && i === 'l') tar = xo.grs[xo.gr].l;
    if (!sch && i === 'r') tar = xo.grs[xo.gr].r;

    // partner team
    if (sch && i === 'l') par = xo.grs[xo.gr].l;
    if (sch && i === 'r') par = xo.grs[xo.gr].r;
    // target team
    if (sch && i === 'l') tar = xo.grs[xo.gr].r;
    if (sch && i === 'r') tar = xo.grs[xo.gr].l;

    if (xo.left_team_time || xo.right_team_time) {
	// action depends here on number of players on field.
    }


    if (((p === "major" || p === "gross major") && xo.grs[xo.gr].g < 61) || xo.grs[xo.gr].overtime1v1) {

        // award point
        par.points++;
        register_points();

        // stop play
        stop_sound();
        xo.game_live = false;

        // log
        xo.status = p + ' penalty ' + tar.team;
        game_log(p + "penalty");

        checkWin(null, null, null);
        if (xo.grs[xo.gr].playing) sd("|" + tar.team + ", " + p + " penalty");

        setBreakTime();
        setDelay();

        screen();
        music_on();
        return;
    } 

    // just announce it.
    s("|" + tar.team + ", " + p + " penalty");

}

// HTTPS socket communication
io.on('connection', function(socket) {
    var ip = socket.request.connection.remoteAddress;
    var admin = false;
    //obsolete
    //var username = getUserName(socket);

    io.emit('setSettings', settings);
    io.emit('setIndex', index);

    screen();

    if (ip == settings.admin_ip) admin = true;
    if (ip == '127.0.0.1') admin = true;

    socket.team = "";

    user = {
        "team": "",
        "admin": admin
    };

    socket.admin = admin;

    //if (username === settings.admin_user) user.admin = true;

    socket.emit('setUser', user);

    socket.on('disconnect', function() {
        console.log(socket.team + ' disconnected');
    });

    socket.on('login', function(passpin) {
	
	var admin = false;
	
	if (passpin == settings.admin_pin) admin = true;

	var team = find_team_by_pin(passpin);
	console.log(team, " login by pin")

	var user = {
        "team": team,
        "admin": admin
	};

	socket.emit('setUser', user);
	socket.team = team;
	socket.admin = admin;
    });

    //if (socket.admin)

        socket.on('start', function(msg) {
    	    console.log("start pressed");
            if (socket.admin) on_start();
        });

        socket.on('start-game', function(msg) {
            if (socket.admin) on_start_game();
        });

        socket.on('time', function(msg) {
           if (socket.admin) on_time('a');
        });

        socket.on('technical-timeout', function(msg) {
           if (socket.admin) on_technical_timeout();
        });

        socket.on('stop', function(msg) {
           if (socket.admin) on_stop();
        });

        socket.on('stop-game', function(msg) {
            if (socket.admin) on_stop_game();
        });

        socket.on('nopoint', function(msg) {
           if (socket.admin) on_nopoint();
        });


        socket.on('buzzer', function(i) {
           if (i !== "l" && i !== "r") return;
           if (socket.admin) on_time(i);
        });

        socket.on('minor', function(i) {
           if (i !== "l" && i !== "r") return;
           if (socket.admin) on_penalty(i, "minor");
        });

        socket.on('major', function(i) {
           if (i !== "l" && i !== "r") return;
           if (socket.admin) on_penalty(i, "major");
        });

        socket.on('gross', function(i) {
           if (i !== "l" && i !== "r") return;
           if (socket.admin) on_penalty(i, "gross major");
        });

        socket.on('point', function(i) {
           if (i !== "l" && i !== "r") return;
           if (socket.admin) on_point(i);
        });


        socket.on('approve', function() {
           if (socket.admin) on_approve();
        });

        socket.on('resume', function(i) {
           if (socket.admin) on_resume();
        });

    socket.on('timeout', function(i) {
        if (i !== "l" && i !== "r") return;
	if (socket.admin) on_timeout(i);
    });

    socket.on('towel', function(i) {
        if (i !== "l" && i !== "r") return;
	if (socket.admin) on_towel(i);

    });

    socket.on('noshow', function(i) {
        if (i !== "l" && i !== "r") return;
        if (socket.admin) on_noshow(i);
    });

// we reuthenticate every request based on the passpin, for clients reconnecting
    socket.on('timeout-team', function(passpin) {
	var team = find_team_by_pin(passpin)
        if (xo.grs[xo.gr].l.team === team) on_timeout('l');
        if (xo.grs[xo.gr].r.team === team) on_timeout('r');
    });

    socket.on('towel-team', function(passpin) {
	var team = find_team_by_pin(passpin)
        if (xo.grs[xo.gr].l.team === team) on_towel('l');
        if (xo.grs[xo.gr].r.team === team) on_towel('r'); 
    });

    socket.on('noshow-team', function(passpin) {
	var team = find_team_by_pin(passpin);
        if (xo.grs[xo.gr].l.team === team || xo.grs[xo.gr].r.team === team) {
           xo.status = team + " no-show?";
           screen();
        }
    });


        socket.on('applyFormat', function(msg) {
            if (!socket.admin) return;

            settings.format = msg;
            select_format();
            s(settings.format.teamsize + ", " + settings.format.condition + ", " + settings.format.gametime + " gametime, " + settings.format.rules);
            io.emit('setSettings', settings);

            screen();

            console.log("APPLY-FORMAT " + settings.format.teamsize + ", " + settings.format.condition + ", " + settings.format.gametime + " gametime, " + settings.format.rules);

        });


        socket.on('applyVolume', function(msg) {
            if (!socket.admin) return;
            settings.volume = msg;
            io.emit('setSettings', settings);

            if (settings.volume.music === 0) music_off();
            else music_on();
        });

        socket.on('applyPit', function(pit) {
            if (!socket.admin) return;

	    xo.groups.push(pit);
	    screen();
        });

        socket.on('applyGame', function(n) {
            if (!socket.admin) return;
            console.log('applyGame',n)
            if (n < 0) {
                n = 0;
            }

            if (n >= xo.groups.length) {
                n = xo.groups.length-1;
            }

            xo.game_group = n;
            var gg = xo.groups[xo.game_group];
            var d = is_dualpit(gg);

            if (!d) s("next game, left pit, |" + index[gg.a].team + ", right pit, |" + index[gg.b].team);
            if (d) s("next game, first group, |" + index[gg.a].team + ", |" + index[gg.b].team + ", second group, |" + index[gg.c].team + ", |" + index[gg.d].team);

            init_xo(xo.groups[xo.game_group]);
            screen();

            if (!d) console.log("APPLY-PIT SIMPLE " + index[gg.a].team + " vs " + index[gg.b].team);
            if (d) console.log("APPLY-PIT  DUAL  " + index[gg.a].team + " vs " + index[gg.b].team + " | " + index[gg.c].team + " vs " + index[gg.d].team);



        });


        socket.on('applyMusic',function(msg){
            if (socket.admin) music_op(msg);
        });

        socket.on('edit_points',function(msg){
            if (socket.admin) edit_points(msg);
        });

        socket.on('edit_time',function(msg){
            if (socket.admin) edit_time(msg);
        });
        
        
        socket.on('sound', function(t) {
            if (socket.admin) {
        	if (t === "start") start_sound();
        	if (t === "stop") stop_sound();
            };
        });


});

rio.on('connection', function(socket) {
    console.log('a viewer connected');
    socket.emit('setIndex', index);

    screen();
});


keys.get('/time', function (req, res) {
    io.emit("key","time");
    res.send('ACK time');
    on_time();
});

keys.get('/start', function (req, res) {
    io.emit("key","start");
    res.send('ACK start');
    on_start();
});

keys.get('/nopoint', function (req, res) {
    io.emit("key","nopoint");
    res.send('ACK nopoint');
    on_nopoint();
});

keys.get('/approve', function (req, res) {
    io.emit("key","approve");
    res.send('ACK approve');
    on_approve();
});

keys.get('/resume', function (req, res) {
    io.emit("key","resume");
    res.send('ACK resume');
    on_resume();
});


keys.get('/left', function (req, res) {
    io.emit("key","left");
    res.send('ACK left');

    if (xo.training_mode) on_point('l');
    else on_time('l');
});

keys.get('/right', function (req, res) {
    io.emit("key","right");
    res.send('ACK right');

    if (xo.training_mode) on_point('r');
    else on_time('r');
});


keys.get('/pointleft', function (req, res) {
    io.emit("key","pointleft");
    res.send('ACK pointleft');

    if ((xo.grs[xo.gr].l.points + xo.grs[xo.gr].r.points) % 2 === 1) on_point('r');
    else on_point('l');

});

keys.get('/pointright', function (req, res) {
    io.emit("key","pointright");
    res.send('ACK pointright');

    if ((xo.grs[xo.gr].l.points + xo.grs[xo.gr].r.points) % 2 === 1) on_point('l');
    else on_point('r');

});


keys.get('/leftpit', function (req, res) {
    io.emit("key","leftpit");
    res.send('ACK leftpit');

    if (xo.game_live) on_towel('l');
    else on_timeout('l');

});

keys.get('/rightpit', function (req, res) {
    io.emit("key","rightpit");
    res.send('ACK rightpit');

    if (xo.game_live) on_towel('r');
    else on_timeout('r');

});

keys.get('/technical-timeout', function (req, res) {
    io.emit("key","technical-timeout");
    console.log('ACK technical-timeout')
    res.send('ACK technical-timeout');
    on_technical_timeout();
});

keys.get('/nopoint', function (req, res) {
    io.emit("key","nopoint");
    res.send('ACK nopoint');
    on_nopoint();
});



// all code has been loaded, start the http and https servers
httpServer.listen(settings.http_port, function() {
    console.log("Xoclock http training mode server started on port " + settings.http_port);
});
httpsServer.listen(settings.https_port, function() {
    console.log("Xoclock https training mode server started on port " + settings.https_port);
    music_on();
});
keysServer.listen(settings.keys_port);
*/