#!/bin/bash

vol=$1

if [ -z "$vol" ]
then
    vol=200;    
fi

if [ ! -f /var/vlc/volume ]
then
    echo -n $vol > /var/vlc/volume

    sleep 2
    
    for (( c=0; c<=$vol; c++ ))
    do
        sleep 0.04
        /bin/echo -n  "volume $c" | nc -U /var/vlc/socket 2> /dev/null
    done
else 
    /bin/echo -n  "volume $vol" | nc -U /var/vlc/socket   
    echo -n $vol > /var/vlc/volume 
fi 
