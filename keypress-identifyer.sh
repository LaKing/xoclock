#!/bin/bash

xbindkeys -mk

exit

while true
do
    echo 'Press Ctrl-C to exit ...'
    xbindkeys -k
    sleep 1
done