#!/bin/node

console.log("Starting Xoclock");

// load libs
var http = require("http");
var https = require("https");
//var auth = require('http-auth');
var fs = require("fs");
var sys = require('sys');
var exec = require('child_process').exec;
var crypto = require('crypto');
var hash_typ = "sha512";
var hash_dig = "hex";
var express = require('express');

// https needs certificates
var options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("crt.pem")
};

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

var g = 0;
var b = 0;

var settings = {};


try {
    xo = JSON.parse(fs.readFileSync('xo.json', 'utf8'));
    console.log("loaded xo.json to continue.");
} catch(err) {
    console.log("didnt load the xo.json ", err);
}


try {
    index = JSON.parse(fs.readFileSync('index.json', 'utf8'));
    console.log("Team-index loaded");
} catch(err) {
    console.log("didnt load index.json ",err)
}


try {
    groups = JSON.parse(fs.readFileSync('groups.json', 'utf8'));
    console.log("groups loaded");
} catch(err) {
    console.log("didnt load groups.json ",err)
}


try {
    settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
} catch(err) {
    console.log("didnt load settings.json ",err)
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
    }
};


// Set the default ports
if (!settings.http_port) settings.proxy_http_port = 80;
if (!settings.https_port) settings.proxy_https_port = 443;


// HTTPS for admins and team captains
var xoclockapp = express();

xoclockapp.use(express.static('public'));

var httpsServer = https.createServer(options, xoclockapp);
var io = require('socket.io')(httpsServer);

// readonly-io HTTP for readers, screens, etc
var readonlyapp = express();
readonlyapp.use(express.static('public'));

var httpServer = http.createServer(readonlyapp);
var rio = require('socket.io')(httpServer);



xo.status = 'Xoclock proxy started.';

// broadcast xoclock object
function screen() {
    io.emit('xo', xo);
    rio.emit('xo', xo);
    save();
};


// HTTPS socket communication
io.on('connection', function(socket) {
    var ip = socket.request.connection.remoteAddress;
	
    socket.proxyauth = false;	

    console.log("connection ",ip);

    io.emit('setSettings', settings);
    io.emit('setIndex', index);

    socket.emit('xo', xo);

    socket.on('disconnect', function() {
        console.log('disconnected - proxy:',socket.proxyauth);
    });

    socket.on('xo', function(data) {
        console.log('Proxy::xo');
	xo = data;
	screen();
    });
    
    socket.on('b', function(data) {
	b = data;
	io.emit('b', b);
        rio.emit('b', b);
    });
    socket.on('g', function(data) {
	g = data;
	io.emit('g', g);
        rio.emit('g', g);
    });
    socket.on('setIndex', function(data) {
	console.log("Proxy::setIndex ",data);
	index = data;
	io.emit('setIndex', index);
        rio.emit('setIndex', index);
    });
    socket.on('setSettings', function(data) {
	if (data.proxy_pass !== settings.proxy_pass) return console.log("proxy auth failure ", data.proxy_pass);
	socket.proxyauth = true;
	console.log("Proxy::setSettings ",data);
	settings = data;
	io.emit('setSettings', settings);
        rio.emit('setSettings', settings);
    });
    socket.on('clock_delay', function(data) {
        io.emit('clock_delay', data);
        rio.emit('clock_delay', data);
    });
});

rio.on('connection', function(socket) {
    console.log('a viewer connected');
    socket.emit('setIndex', index);

    socket.emit('xo', xo);
});




// all code has been loaded, start the http and https servers
httpServer.listen(settings.proxy_http_port, function() {
    console.log("Xoclock http proxy server started on port " + settings.proxy_http_port);
});
httpsServer.listen(settings.proxy_https_port, function() {
    console.log("Xoclock https proxy server started on port " + settings.proxy_https_port);
});

