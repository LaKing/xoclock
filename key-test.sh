#!/bin/bash


killall xbindkeys
echo "restart xbindkeys"
#$(xbindkeys -v -n) &
xbindkeys &
echo SHOW
xbindkeys -s
echo PIDOF
pidof xbindkeys
