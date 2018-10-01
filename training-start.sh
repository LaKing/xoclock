#!/bin/bash

MUSIC_ON=true

# root should not run this script
if [ "$USER" == root ]
then
    echo "Start as user!"
    exit
fi

## make all curtains and screensavers dimmers locks inactive
gsettings set org.gnome.desktop.session idle-delay 0
xset -dpms s noblank 

# exit of previous versions
killall node
killall firefox

if "$MUSIC_ON"
then
    echo $(sleep 2 && /bin/echo -n  "volume 170" | nc -U /var/vlc/socket) &
    echo -n 170 > /var/vlc/volume
    gnome-terminal --zoom=0.5 --title="MUSIC" -e "/bin/bash music_start.sh >> logs/$NOW.music.log 2> logs/$NOW.music.err" &
fi

echo "Xoclock training mode."

gnome-terminal --zoom=3.5 --title="xoclock" -e "node training.js"

echo "press q to quit"

while true 
do
    read -rsn1 input
    if [ "$input" == "q" ]
    then 
        exit
    else
	echo key-input
	bash key-input.sh start
    fi
done