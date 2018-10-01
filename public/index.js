(function() {

    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    var timeFormat = function(t) {
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

    var debug = false;
    if (location === "https://xoclock/debug.html") debug = true;

    var app = angular.module('app', []);

    app.run(function($rootScope) {
        
        $rootScope.mainInit = false;

        // rootscope functions and variables
        $rootScope.index = [];
        $rootScope.settings = {};
        $rootScope.user = '';
        $rootScope.passpin = '';

        $rootScope.xo = {};

        $rootScope.grstatus = '';
        $rootScope.clock_delay = '';
        $rootScope.status = 'Xoclock - loading data!';
        $rootScope.subtitles = "";
        $rootScope.gametime = '00:00';
        $rootScope.breaktime = '00:00';
	$rootScope.sch = false;

        $rootScope.left_pit_style = {};
        $rootScope.right_pit_style = {};
        $rootScope.left_field_style = {};
        $rootScope.right_field_style = {};

        $rootScope.isadmin = false;

        $rootScope.block = false;
        $rootScope.white = false;
        $rootScope.viewOnly = true;

        if (location.protocol === 'https:') $rootScope.viewOnly = false;

    });


    app.factory('socket', function($rootScope) {
        var socket = io.connect();
        return {
            on: function(eventName, callback) {
                socket.on(eventName, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function(eventName, data, callback) {
                socket.emit(eventName, data, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }
        };
    });

    app.controller('mainController', ['$scope', '$http', '$rootScope', 'socket', function($scope, $http, $rootScope, socket) {

        if ($rootScope.mainInit) return;
        else $rootScope.mainInit = true;

        if (isChrome) $rootScope.speech = 1;
        else $rootScope.speech = 0;

        if (isChrome) $rootScope.beep = 1;
        else $rootScope.beep = 0;

        $rootScope.sound = function(t) {
            socket.emit('sound', t);
        };


            var peep = new Audio();
            peep.src = "/beep/click_sound.wav";

            var beep = new Audio();
            beep.src = "/beep/start_sound.wav";

            var buup = new Audio();
            buup.src = "/beep/stop_sound.wav";

        $rootScope.browser_sound = function(t) {

           if ($rootScope.beep === 0) return alert("Volume is set to 0.");

            peep.volume = $rootScope.beep;
            beep.volume = $rootScope.beep;
            buup.volume = $rootScope.beep;


            if (t === 'start') {
            peep.play();
            setTimeout(function(){ peep.play(); }, 1000);
            setTimeout(function(){ peep.play(); }, 2000);
            setTimeout(function(){ peep.play(); }, 3000);
            setTimeout(function(){ peep.play(); }, 4000);
            setTimeout(function(){ peep.play(); }, 5000);
            setTimeout(function(){ peep.play(); }, 6000);
            setTimeout(function(){ peep.play(); }, 7000);
            setTimeout(function(){ peep.play(); }, 8000);
            setTimeout(function(){ peep.play(); }, 9000);

            setTimeout(function(){ beep.play(); }, 10000);
            }

            if (t === 'stop') {
        	buup.play();
            }

        };


        $rootScope.login = function() {
            socket.emit('login', $rootScope.passpin);
        };

        $rootScope.buttonAdmin = function(msg) {
            $rootScope.block = true;
            socket.emit(msg, msg);
        };

        $rootScope.buttonTeam = function(msg, i) {
            $rootScope.block = true;
            socket.emit(msg, i);
        };

        $rootScope.applyFormat = function() {
            socket.emit('applyFormat', $rootScope.settings.format);
        };

        $rootScope.applyMusic = function(arg) {
            socket.emit('applyMusic', arg);
        };


        $rootScope.applyVolume = function() {
            socket.emit('applyVolume', $rootScope.settings.volume);
        };

        $scope.applyGame = function(nextgame) {
            socket.emit('applyGame', nextgame);
        };

        $scope.pit = {};
        $scope.applyPit = function() {
            socket.emit('applyPit', $scope.pit);
            $scope.pit={};
        };
        
        
        $scope.teamIndex = function(op,team) {
            socket.emit('teamIndex-'+op, team);
        };
        $scope.alert = function(arg) {
            alert(arg);
        };



        $scope.checkPit = function() {
	    var p = $scope.pit;
	    if (p.a == undefined) return false;
	    if (p.b == undefined) return false;
	    if (p.a == p.b) return false;
	    if (p.c == undefined && p.d == undefined) return true;
	    
	    // dual pits
	    if (p.c == undefined) return false;
	    if (p.d == undefined) return false;
	    if (p.c == p.d) return false;
	    
	    if (p.a == p.c) return false;
	    if (p.a == p.d) return false;
	    if (p.b == p.c) return false;
	    if (p.b == p.d) return false;
	    
	    return true;

        };





        $rootScope.blindClick = function() {
            $rootScope.block = true;
            var msg = $rootScope.blindFunction();
            socket.emit(msg, msg);
        };

        $rootScope.blindFunction = function() {
            
            var msg='technical-timeout'
            if (!$rootScope.xo.game_live && $rootScope.xo.grs[$rootScope.xo.gr].b > 15) msg = "start";
            if ($rootScope.xo.left_team_time || $rootScope.xo.right_team_time) msg = 'approve';

            return msg;
        };


	// Used in the admin scoreboard
        $scope.edit_points = function(f,g,p) {
            socket.emit('edit_points', {f:f,g:g,p:p});
        };
        
        $scope.edit_time = function(msg) {
            socket.emit('edit_time', msg);
        };

        socket.on('setIndex', function(data) {
            $rootScope.index = data;
            //console.log(data);
        });

        socket.on('key', function(data) {
            $rootScope.lastkey = data;
            //console.log(data);
        });


        socket.on('b', function(data) {
    	    if (data > 0 && data < 12) $rootScope.block = true;
            $rootScope.breaktime = timeFormat(data);
            if(debug) console.log('b ' + JSON.stringify(data));
        });
        socket.on('g', function(data) {
            $rootScope.gametime = timeFormat(data);
            if (debug) console.log('g ' + JSON.stringify(data));
        });

        socket.on('xo', function(xo) {
            $rootScope.xo = xo;
            if (debug) console.log('xo ' + JSON.stringify(xo));
		
	    if (xo.gr === undefined) return;
	    if (xo.grs === undefined) return;

            $rootScope.gametime = timeFormat(xo.grs[xo.gr].g);
            $rootScope.breaktime = timeFormat(xo.grs[xo.gr].b);

	    // sidechange?
	    $rootScope.sch = false;
	    if (xo.grs[xo.gr].playing && (xo.grs[xo.gr].l.points + xo.grs[xo.gr].r.points) % 2 === 1) $rootScope.sch = true;
	    
            $rootScope.left_pit_style='';
            $rootScope.right_pit_style='';
            $rootScope.left_field_style='';
            $rootScope.right_field_style='';


	    if (!$rootScope.sch) {
                if (xo.left_team_time) $rootScope.left_pit_style='sel';
                if (xo.right_team_time) $rootScope.right_pit_style='sel';
                if (xo.left_team_time) $rootScope.left_field_style='sel';
                if (xo.right_team_time) $rootScope.right_field_style='sel';
	    } else {
                if (xo.left_team_time) $rootScope.right_pit_style='sel';
                if (xo.right_team_time) $rootScope.left_pit_style='sel';
                if (xo.left_team_time) $rootScope.left_field_style='sel';
                if (xo.right_team_time) $rootScope.right_field_style='sel';
            }


            $rootScope.status = '';
            if (xo.grs.length > 1 && (xo.grs[0].playing || xo.grs[1].playing)) {
                if (xo.gr === 0) $rootScope.status = 'First group: ';
                if (xo.gr === 1) $rootScope.status = 'Second group: ';

                var br = Math.abs(xo.gr - 1);
                $rootScope.grstatus = xo.grs[br].l.team + ' vs ' + xo.grs[br].r.team + ' ' + xo.grs[br].l.points + '-' + xo.grs[br].r.points + ' Game-time: ' + timeFormat(xo.grs[br].g);
                if (!xo.grs[br].playing) $rootScope.grstatus += ' game over.';

            } else $rootScope.grstatus = '';
            $rootScope.status += xo.status;

            $rootScope.clock_delay = '';
        });

        socket.on('block', function(data) {
            if (data > 0)
                $rootScope.block = true;
            else $rootScope.block = false;
            //console.log('block ' + data);
        });
        socket.on('clock_delay', function(data) {
            $rootScope.clock_delay = '';
            if (data > 0) $rootScope.clock_delay += '(' + data + ')';

            if (data > 0)
                $rootScope.block = true;
            else $rootScope.block = false;

            //console.log('clock delay' + data);
        });

        //socket.on('setPit', function(data) {
        //    $rootScope.pit = data;
        //    //console.log('pit ' + JSON.stringify(data));
        //});

        socket.on('setSettings', function(data) {
            $rootScope.settings = data;
        });

        socket.on('setUser', function(data) {
            //console.log('setUser: ' + JSON.stringify(data));
            if ($rootScope.user === '') {
                $rootScope.user = data.team;
                $rootScope.isadmin = data.admin;
            }
        });

        socket.on('s', function(data) {
            console.log(data);
            $rootScope.subtitles = data;
            if ($rootScope.speech === 0) return;
            var msg = new SpeechSynthesisUtterance(data);
            msg.volume = $rootScope.speech;
            msg.rate = 0.8;
            window.speechSynthesis.speak(msg);
        });

        socket.on('sd', function(data) {
            console.log(data);
            $rootScope.subtitles = data;
            if ($rootScope.speech === 0) return;
            setTimeout(function(){
                var msg = new SpeechSynthesisUtterance(data);
                msg.rate = 0.8;
                msg.volume = $rootScope.speech;
                window.speechSynthesis.speak(msg);
            }, 1200);
        });

        socket.on('beep', function(data) {
            console.log(data);
            $rootScope.subtitles = '';
            if ($rootScope.beep === 0) return;
            var beep = new Audio();
            beep.volume = $rootScope.beep;
            beep.src = "/beep/" + data + ".wav";
            beep.play();
        });

    }]);

})();
