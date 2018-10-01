#!/bin/node

console.log("Starting Xoclock");

// you may attach additional arguments to aplay
const aplay = "aplay -D sysdefault:CARD=PCH"

// load libs
var http = require("http");
var https = require("https");
var auth = require('http-auth');
var fs = require("fs");
var sys = require('sys');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var hash_typ = "sha512";
var hash_dig = "hex";
var express = require('express');

// https needs certificates
var options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("crt.pem")
};


// voice generation of display texts with api
var speeches = {};
var speechex = {};

function filename(text) {
    return text.replace('.', '').trim().toLowerCase().replace(/ /g, '_').replace(/:/g, 'to') + ".wav";
};

function dspx(texts) {
    texts.split('|').forEach(function(e) {
        var key=filename(e);
        speechex[key] = e;
    });
    return texts;
}

function dsp(texts) {
    texts.split('|').forEach(function(e) {
        var key=filename(e);
        speeches[key] = e;
    });
    return texts;
}

function write_speechex() {
    for (i in index) {
       dspx(index[i].team);
    }
    fs.writeFileSync('speechex.json', JSON.stringify(speechex,null,4));
}

function write_speeches() {
    for (var i=0; i<10; i++) {
        for (var j=0; j<10; j++) {
             dsp(i+":"+j);
        }
    }

    fs.writeFileSync('speeches.json', JSON.stringify(speeches,null,4));
}

// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Creates a client
const client = new textToSpeech.TextToSpeechClient();

const AUDIO = "audio";
const TEAMS = "teams";

function download(dir, filename, text) {

    const file = dir + "/" + filename;
    if (fs.existsSync(file)) return;// console.log(filename + "already exists");

    setTimeout(function(){ 

      // Construct the request
      const request = {
        input: {text: text},
        // Select the language and SSML Voice Gender (optional)
        voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL', name: 'en-US-Wavenet-C'},
        // Select the type of audio encoding
        audioConfig: {audioEncoding: 'LINEAR16'},
      };

      // Performs the Text-to-Speech request
      client.synthesizeSpeech(request, (err, response) => {
        if (err) return console.error('ERROR:', err);
        // Write the binary audio content to a local file
        fs.writeFile(file, response.audioContent, 'binary', err => {
        if (err) return console.error('ERROR:', err);
        console.log('Audio content written to file:', file);
        });
      });

     }, Math.floor(Math.random() * 60) * 100);

}

function speech_downloads() {
    for (var i in speeches) {
       download(AUDIO, i, speeches[i]);
    }

    write_speechex();
    for (var j in speechex) {
       download(TEAMS, j, speechex[j]);
    }
}


// read input files

// TEAM INDEX
var index = [{},{}];

// set some defaults
index[0].team = dsp("Local Team");
index[1].team = dsp("Guest Team");

index[0].pin = "1111";
index[1].pin = "2222";

var groups = [{
    a: 0,
    b: 1
}];


// main xoclock object for currently running game
var xo = {};
    xo.game_group = 0;

xo.title = "Paintball Turnament";
if (groups.length > 0) xo.groups = groups;



try {
    index = JSON.parse(fs.readFileSync('index.json', 'utf8'));
    console.log("Team-index loaded", index);
} catch(err) {
    console.log("didnt load index.json ",err)
}

try {
    groups = JSON.parse(fs.readFileSync('groups.json', 'utf8'));
    console.log("groups loaded");
} catch(err) {
    console.log("didnt load groups.json ",err)
}

var settings = {};
try {
    settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
} catch(err) {
    console.log("didnt load settings.json ",err)
}


try {
    xo = JSON.parse(fs.readFileSync('xo.json', 'utf8'));
    console.log("loaded xo.json to continue.");
} catch(err) {
    console.log("didnt load the xo.json ", err);
    xo.groups = groups;
}


function save() {
    fs.writeFile('xo.json', JSON.stringify(xo, null, 4), function(err) {
    if(err) {
    	    console.log(err);
	} else {
    	    console.log("xo JSON saved.");
	}
    });
}

function save_index() {
    fs.writeFile('index.json', JSON.stringify(index, null, 4), function(err) {
       if(err) console.log(err);
    });
}

function save_groups() {
    fs.writeFile('groups.json', JSON.stringify(xo.groups, null, 4), function(err) {
       if(err) console.log(err);
    });
}

//if (groups.length > 1 && !xo.groups) xo.groups = groups;
//if (groups.length > 0) xo.groups = groups;

function make_roundrobin() {

  var t = index.length

  // 
  var dualpits = true;

  //We build a half matrix cut at the identity line, and conquer it parallel to identity

  var s = (t * t - t)/2
  console.log(t + ' teams in team-index, matches total: ' + s)
  if (dualpits) console.log('Generating round-robin in dual-pits')

  var A = [];

  // n is the number of round robin teams
  var n = t;
  // that needs to b even
  if (t % 2 === 1) n++; 
  // we make a dual-pit system here, so we need at least 4 teams
  if (t < 4) {
     dualpits = false;
  }

  var ns = (n*n-n)/2 // roundrobin teams
  var r = n/2 // halfring-length

  // we consider 0 as the fixed element
  // we calculate the round-robin teams in a functional way

  function getX(e) {

     var o = e % r // step in the halfring
     var t = ~~(e/r) // block: rotation times.

     // the fixed element
     if (o === 0) return 0
     // ringify
     return ( (o+t-1) % (n-1) ) +1
  }

  function getY(e) {

     var o = e % r // step in the halfring
     var t = ~~(e/r) // block: rotation times.

     return ( (n - o + t -2) % (n-1) ) +1

   }

  function place(x,y) {
     l = A.length - 1
     if (dualpits) {
        if (A[l] !== undefined && A[l].c === undefined && A[l].d === undefined) {
          console.log('+',index[x].team,'|',index[y].team)
      A[l].c = x;
      A[l].d = y;
      return;
        }
     }
     console.log('-',index[x].team,'|',index[y].team)
     A.push({a:x,b:y});
  }

  for (i = 0; i < ns; i++) {

   var ix = getX(i)
   var iy = getY(i)

   // skip the bye elements 
   if (t % 2 === 1) {
      if (ix === t || iy == t) continue
   }
 
   place(ix,iy)

  }

  return A;
  // make roundrobin end
}

// verify team index format and files
function check_team_index() {
    console.log("Check team index");

    if (index.length < 2) {
        index[0] = {team: 'Home team', pin: '1111'};
        index[1] = {team: 'Guest team', pin: '2222'};
    }

    for (var i = 0; i < index.length; i++) {
        // check teamname
        if (!index[i].team) index[i].team = "Team-" + i;
        // check team pin
        if (!index[i].pin) index[i].pin = "" + Math.floor((Math.random() * 9) + 1) + "" + Math.floor((Math.random() * 9) + 1) + "" + Math.floor((Math.random() * 9) + 1) + "" + Math.floor((Math.random() * 9) + 1);
    }

    groups = make_roundrobin();
    xo.groups = groups;
    xo.game_group = 0;
    init_xo(xo.groups[xo.game_group]);
    io.emit('xo',xo);
    rio.emit('xo',xo);

    io.emit('setIndex', index);
    rio.emit('setIndex', index);

    save();
    save_index();
    save_groups();
    speech_downloads();
};

function team_index_add(team) {
    console.log("Add to team index", team)

    for (var i = 0; i < index.length; i++) {
        // check teamname
        if (index[i].team === team) return console.log("Already in the index");
    }

    var ti = {};
    ti.team = team;
    ti.pin =  "" + Math.floor((Math.random() * 10) + 1) + "" + Math.floor((Math.random() * 10) + 1) + "" + Math.floor((Math.random() * 10) + 1) + "" + Math.floor((Math.random() * 10) + 1);
    index.push(ti);

    check_team_index()
};

function team_index_remove(team) {
    console.log("Remove from team index", team)
    for (var i = 0; i < index.length; i++) {
        // check teamname
        if (index[i].team === team) index.splice(i,1);
    }

    check_team_index()
};


function team_index_clear() {
    groups=[];
    xo.groups = groups;
    xo.game_group = 0;
    io.emit('xo',xo);
    rio.emit('xo',xo);
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
if (!settings.keys_port) settings.keys_port = 8443;

// default is an empty password - for testing and devel!
// if (!settings.admin_hash) settings.admin_hash = "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e";
if (!settings.admin_pin) settings.admin_pin='0000';

// default admin username
if (!settings.admin_user) settings.admin_user = 'admin';

// minimum time for the other group to enter the filed
if (!settings.entrytime) settings.entrytime = 50;

// delay for announcments and such, ..
if (!settings.clock_delay) settings.clock_delay = 10;

if (!settings.volume) settings.volume = {};

if (!settings.volume.music) settings.volume.music = 30;
if (!settings.volume.announce) settings.volume.announce = 'on';

if (!settings.format) settings.format = {}

if (!settings.beep) settings.beep = true;

// quantize to multiples of 15s
if (!settings.quantize) settings.quantize = false;

//{
//    "teamsize": "5 on 5",
//    "condition": "mercy at 4 points",
//    "gametime": "10 minutes",
//    "rules": "m-500 format x-ball",
//    "breaktime": "2 minutes",
//    "overtime": "3 minutes",
//    "pitsystem": "simple",
//    "timeouts": 1
//};

if (!settings.format.teamsize) settings.format.teamsize = "5 on 5";
if (!settings.format.condition) settings.format.condition = "mercy at 4 points";
if (!settings.format.gametime) settings.format.gametime = "10 minutes";
if (!settings.format.rules) settings.format.rules = "M500 format x-ball";
if (!settings.format.breaktime) settings.format.breaktime = "2 minutes";
if (!settings.format.overtime) settings.format.overtime = "3 minutes";
//if (!settings.format.pitsystem) settings.format.pitsystem = "simple";
if (!settings.format.timeouts) settings.format.timeouts = "1";

dsp("1 on 1|2 on 2|3 on 3|4 on 4|5 on 5|6 on 6|7 on 7|8 on 8|9 on 9|10 on 10");
dsp("sudden death|unlimited");
dsp("race to 2|race to 3|race to 4|race to 5|race to 6|race to 7|race to 8");
dsp("mercy at 2 points|mercy at 3 points|mercy at 4 points|mercy at 5 points|mercy at 6 points|mercy at 7 points|mercy at 8 points");
dsp("2 minutes gametime|3 minutes gametime|4 minutes gametime|5 minutes gametime|6 minutes gametime|7 minutes gametime|8 minutes gametime|9 minutes gametime");
dsp("10 minutes gametime|12 minutes gametime|15 minutes gametime|20 minutes gametime|30 minutes gametime|60 minutes gametime");
dsp("M500 format X-ball|M800 format X-ball|Professional X-ball|training mode");
dsp("1 minute breaktime|2 minutes breaktime|3 minutes breaktime|4 minutes breaktime|5 minutes breaktime|6 minutes breaktime");
dsp("no overtime|2 minutes overtime|3 minutes overtime|5 minutes overtime");

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

function is_dualpit(group) {
    if (group)
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
        settings.format.condition = "mercy at " + mercy_at + " points";
    } else mercy_at = 0;
    
    if (settings.format.condition === 'Sudden death') race_to = 1; 

    //xo.dual_pits = (settings.format.pitsystem === "dual");
    xo.training_mode = (settings.format.rules === 'training mode');

    if (settings.breaktime === 0) settings.breaktime = 15;

};

// OBSOLETE
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

// OBSOLETE
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

var proxy = require("socket.io-client")('https://'+settings.proxy);

// autocorrect .)
function ac(string) {
    return string.charAt(0).toUpperCase() + string.slice(1) + '.';
}

var speech_process;

function speak(string) {
    console.log("speak string", string);

    //speech_process.close();
    var parts = string.split(",");
    var args = [];

    for (i in parts) {
       var file = filename(parts[i]);
       if (speeches[file] !== undefined) args.push("audio/" + file);
       else if (speechex[file] !== undefined) args.push("teams/" + file);
    }

    if (args.length < 1) return console.log(args, "Nothing to say?");
    console.log("speak args", args);

    speech_process = spawn('play', args);

    speech_process.stdout.on('data', (data) => {
       console.log(`speech_process stdout: ${data}`);
    });

    speech_process.stderr.on('data', (data) => {
        console.log(`speech_process stderr: ${data}`);
    });

    speech_process.on('close', (code) => {
        console.log(`speech_process child process exited with code ${code}`);
    });

};


// speak
function s(string) {
    var s = ac(string);
    console.log('SPEAK', s);
    io.emit('s', s);
    rio.emit('s',s);
    speak(string);
};

// speak delayed
function sd(string) {
    var s = ac(string);
    console.log('SPEAK-DELAYED', s);
    io.emit('sd', s);
    rio.emit('sd', s);
    setTimeout(function(){ 
       speak(string);
    }, 1200);
};


function beep(beep) {
    console.log(beep);
    io.emit('beep',beep);
    rio.emit('beep',beep);
        var child = exec(aplay + ' public/beep/' + beep + '.wav',
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
    proxy.emit('xo', xo);
};

function setDelay() {
    clock_delay = settings.clock_delay;
    //if (xo.training_mode) clock_delay = 2;
};

function game_log(str) {
    console.log(str + " GAME " + xo.grs[xo.gr].l.team + " VS " + xo.grs[xo.gr].r.team + " (" + xo.grs[xo.gr].l.points + "-" + xo.grs[xo.gr].r.points + ") gametime: " + xo.grs[xo.gr].g + "sec Status: " + xo.status);
};

dsp("scored a point|threw the towel|state of the game");


function announce_point(team, towel) {

    var l = xo.grs[xo.gr].l;
    var r = xo.grs[xo.gr].r;

    var by = ", scored a point";
    if (towel) by = ", threw the towel";

    if (l.points < 10 && r.points < 10) sd(team + by + ", " + l.points + ":" + r.points);
    else sd(team + by);

};

dsp("Point|Game over|Barrel-socks on|against");

function announce_score(point) {

    var l = xo.grs[xo.gr].l;
    var r = xo.grs[xo.gr].r;

    var pre = "Game over, ";
    if (point) pre = "Point, game over, ";
    var post = "";
    if (!xo.grs[0].playing && !xo.grs[0].playing) post = ', barrel-socks on';

    if (l.points < 10 && r.points < 10) sd(pre + l.team + ", against, " + r.team + ", " + l.points + ":" + r.points + post);
    else sd(pre + l.team + ", against, " + r.team + ", " + l.points + ", " + r.points + post);
};

dsp("overtime|select a player to compete in a one on one");
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

if (!xo.grs) init_xo(xo.groups[xo.game_group]);

var g = 0;
var b = 0;

dsp("attention 60 seconds rule applies");
dsp("10 seconds|30 seconds|1 minute|2 minutes");
function main(){

    block--;

    // clock delay has highest priority
    if (clock_delay > 0) {
        clock_delay--;
        io.emit('clock_delay', clock_delay);
        rio.emit('clock_delay', clock_delay);
	proxy.emit('clock_delay', clock_delay);
        return;
    }

    io.emit('block', block);
    rio.emit('block', block);

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
                beep("stop_sound");
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
	    proxy.emit('g', g);
        }


        // we are in a break
        if (!xo.game_live) {

            // clock calc
            if (xo.grs[xo.gr].b > 0) xo.grs[xo.gr].b--;
            b = xo.grs[xo.gr].b;

	if (settings.quantize)
	    if (b === 15) {
		var now = new Date();
		var sec = 60 - now.getSeconds();
		var mod = sec % 15;
		if (mod !== 0) b = 15 + mod;
		xo.grs[xo.gr].b = b;
		if (mod !== 0) xo.status += "(+"+mod+"s) ";
		else xo.status = "Prepare for countdown...";
		screen();
	    };

            if (b === 11) {
                xo.status = "COUNTDOWN!";
                screen();
                block=12;
            }
            if (b === 12) s('10 seconds');
            if (b === 14) music_off();

            if (b === 31) {
                beep("pingping_sound");
                sd('30 seconds');
            }
            if (b === 61) {
                beep("ping_sound");
                sd('1 minute');
            }

            if (b === 120) s('2 minutes');
            if (b > 0 && b < 11) beep("click_sound");
            if (b === 0) {
                xo.status = 'GAME ON!';
                if (xo.grs[xo.gr].overtime) xo.status = 'OVERTIME GAME ON!';
                if (xo.grs[xo.gr].overtime1v1) xo.status = 'One-on-One GAME ON!';

                beep("start_sound");
                music_off();
                xo.game_live = true;
                screen();
                game_log("GAME ON!");
            }
            io.emit('b', b);
            rio.emit('b', b);
	    proxy.emit('b', b);

        }
    }
}


// Okay, so instead setinterval we use this recursive loop
// it is more accurate, and it is in sync with the system clock.

function main_loop() {

    var now = new Date();
    var tik = 1000 - now.getMilliseconds();

    setTimeout(function(){ 

	main();
	setTimeout(main_loop, 10);

     }, tik);

};

main_loop();


function edit_time(msg) {

    if (msg === 'g+') xo.grs[xo.gr].g += 10;
    if (msg === 'g-') xo.grs[xo.gr].g -= 10;
    if (msg === 'b+') xo.grs[xo.gr].b += 10;
    if (msg === 'b-') xo.grs[xo.gr].b -= 10;

    if (xo.grs[xo.gr].b < 0) xo.grs[xo.gr].b = 0;
    if (xo.grs[xo.gr].g < 0) xo.grs[xo.gr].g = 0;

    io.emit('g', xo.grs[xo.gr].g);
    rio.emit('g', xo.grs[xo.gr].g);
    proxy.emit('g', xo.grs[xo.gr].g);

    io.emit('b', xo.grs[xo.gr].b);
    rio.emit('b', xo.grs[xo.gr].b);
    proxy.emit('b', xo.grs[xo.gr].b);
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

dsp("game started|barrel-socks can be taken off");

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

dsp('field is live');

function on_start() {

            if (block > 0) return;
            else block = 5;

            if (xo.game_live) return;

            clock_delay = -1;

            xo.match_live = true;

                //if (xo.training_mode) {
                //    xo.grs[xo.gr].b = 4;
                //    //block = 5;
                //    music_off();
                //} else {
                    s('field is live');
                    xo.grs[xo.gr].b = 16;
                    //block = 16;
                //}

                xo.left_team_time=false;
                xo.right_team_time=false;

            xo.status = "START!";
            screen();
}

dsp("time");

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

            beep("stop_sound");
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

dsp("clock running");

function on_resume() {

            if (block > 0) return;
            block = 2;

            if (xo.match_live) return;
            if (!xo.game_live) return;

            xo.status = "GAME!";
            beep("start_sound");
            sd("clock running");

            xo.match_live = true;
            xo.left_team_time=false;
            xo.right_team_time=false;

            screen();
}

dsp("technical timeout");
dsp("clock running");

function on_technical_timeout() {

            //if (block > 0) return;


            if (xo.match_live) {
                xo.status = "TECHNICAL TIMEOUT";
                if (xo.game_live) {
                    beep("stop_sound");
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
                 if (xo.game_live) {
                    beep("start_sound");
                    sd("clock running");
                 } else {
                    s("clock running");
                 }

                 xo.status = "clock running!";
                 xo.match_live = true;
                 block = 2;
                 screen();
                 return;
            }
}

dsp("barrel-socks on|game over");

function on_stop_game() {

            block = 2;

            if (xo.game_live) beep("stop_sound");

            s("barrel-socks on, game over");
            xo.status = "Game over!";

            xo.match_live = false;
            xo.game_live = false;

            game_log("GAME OVER");

            screen();
            music_on();
}


dsp('no point');

function on_nopoint() {

            if (block > 0) return;
            else block = 2;

            if (xo.game_live) {

                beep("stop_sound");

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


dsp('no show');


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

        beep("stop_sound");
        game_log("NO SHOW");

        sd(tar.team +', no show');
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


            beep("stop_sound");
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


dsp('requested the timeout');


function on_timeout(i) {

        if (block > 0) return;
        else block = 3;

        if (clock_delay > 0) return;

        var tar;
        if (i === 'l') tar = xo.grs[xo.gr].l;
        if (i === 'r') tar = xo.grs[xo.gr].r;

        if (!xo.game_live && tar.timeouts > 0) {
            xo.grs[xo.gr].b += 60;

            s(tar.team + ', requested the timeout');

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

        beep("stop_sound");
        xo.game_live = false;

        xo.status = 'Towel ' + tar.team;
        game_log("TOWEL");

        checkWin(true, tar.team, true);

        setBreakTime();
        setDelay();

        screen();


        music_on();

}

dsp("minor penalty|major penalty|gross major penalty");

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
        beep("stop_sound");
        xo.game_live = false;

        // log
        xo.status = p + ' penalty ' + tar.team;
        game_log(p + "penalty");

        checkWin(null, null, null);
        if (xo.grs[xo.gr].playing) sd(tar.team + ", " + p + " penalty");

        setBreakTime();
        setDelay();

        screen();
        music_on();
        return;
    } 

    // just announce it.
    s(tar.team + ", " + p + " penalty");

}

dsp("next game|left pit|right pit|first group|second group");


// HTTPS socket communication
io.on('connection', function(socket) {
    var ip = socket.request.connection.remoteAddress;
    var admin = false;
    //obsolete
    //var username = getUserName(socket);

    console.log("connection ", ip);

    socket.emit('setSettings', settings);
    socket.emit('setIndex', index);

    socket.emit('xo', xo);

    if (ip == settings.admin_ip) admin = true;
    if (ip == '::ffff:127.0.0.1') admin = true;
    if (settings.demo) admin = true;

    socket.team = "";

    user = {
        "team": "",
        "admin": admin
    };

    socket.admin = admin;

    socket.emit('setUser', user);

    socket.on('disconnect', function() {
        console.log(socket.team + ' disconnected');
    });

    socket.on('login', function(passpin) {
	console.log('login', passpin);
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

        socket.on('teamIndex-remove', function(team) {
           if (socket.admin) team_index_remove(team);
        });

        socket.on('teamIndex-add', function(team) {
           if (socket.admin) team_index_add(team);
        });

        socket.on('teamIndex-clear', function() {
           if (socket.admin) team_index_clear();
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
	    rio.emit('setSettings', settings);
	    proxy.emit('setSettings', settings);

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

            if (!d) s("next game, left pit, " + index[gg.a].team + ", right pit, " + index[gg.b].team);
            if (d) s("next game, first group, " + index[gg.a].team + ", " + index[gg.b].team + ", second group, " + index[gg.c].team + ", " + index[gg.d].team);

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
        	if (t === "start") beep("start_sound");
        	if (t === "stop") beep("stop_sound");
            };
        });


});

rio.on('connection', function(socket) {
    console.log('a viewer connected');
    socket.emit('setIndex', index);
    socket.emit('xo', xo);
});

proxy.once('connect', function() {
    console.log('proxy connected ', settings.proxy);
    proxy.emit('setSettings', settings);
    setTimeout(function(){
    	proxy.emit('setIndex', index);
    	proxy.emit('xo', xo);
    },1000);
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
    
    if (!xo.game_live) beep("stop_sound");


    
});

keys.get('/right', function (req, res) {
    io.emit("key","right");
    res.send('ACK right');

    if (xo.training_mode) on_point('r');
    else on_time('r');
    
    if (!xo.game_live) beep("stop_sound");

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
    console.log("Xoclock http server started on port " + settings.http_port);
});
httpsServer.listen(settings.https_port, function() {
    console.log("Xoclock https server started on port " + settings.https_port);
    music_on();
});
keysServer.listen(settings.keys_port);

/*
process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.error(xo);
  console.log("ERROR - Node NOT Exiting...");
});
*/

// 0:0, 1:0, ... etc
write_speechex()
write_speeches()
speech_downloads();