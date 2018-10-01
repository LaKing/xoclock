#!/bin/bash

vol=200;

if [ -f /var/vlc/volume ]
then
    vol="$(cat /var/vlc/volume)"
    
    rm -rf /var/vlc/volume
    
    for (( c=$vol; c>1; c-- ))
    do
        sleep 0.01
        /bin/echo -n  "volume $c" | nc -U /var/vlc/socket 2> /dev/null
    done

fi
