#!/bin/node

var fs = require("fs");
var index = JSON.parse(fs.readFileSync('index.json', 'utf8'));
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

//console.log(A)

fs.writeFile('groups.json', JSON.stringify(A, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved. ", A.length, " games");
    }
}); 


