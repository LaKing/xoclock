#!/bin/bash

# root should not run this script
if [ "$USER" == root ]
then
    echo "Start as user!"
    exit
fi

## this thread will be the music player
if [ -z "$(pidof vlc)" ]
then
    echo "START MUSIC"
    echo 170 >/var/vlc/volume
    while true
    do
        vlc -q --no-metadata-network-access --random --play-and-exit -I oldrc --rc-unix /var/vlc/socket ~/Music
        sleep 1
    done
else
    echo "Music already running"
fi
