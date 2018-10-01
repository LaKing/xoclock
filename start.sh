#!/bin/bash

# root should not run this script
if [ "$USER" == root ]
then
    setcap 'cap_net_bind_service=+ep' /usr/bin/node
    echo "Start as user!"
    exit
fi

sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node

## make all curtains and screensavers dimmers locks inactive
gsettings set org.gnome.desktop.session idle-delay 0
xset -dpms s noblank 

# exit of previous versions
echo "killall previous processes"
killall node
killall xbindkeys

NOW=$(date +%Y.%m.%d-%H:%M:%S)
mkdir -p logs
echo "Xoclock log is $NOW.log" > logs/$NOW.log

#echo "start xbindkeys"
$(xbindkeys -v -n -f xbindkeysrc >> logs/$NOW-xbindkeys.log 2> logs/$NOW-xbindkeys.err) &

echo "start browser"
bash start-ui.sh &

echo "volume control socket"
$(sleep 2 && /bin/echo -n  "volume 170" | nc -U /var/vlc/socket) &

echo -n 170 > /var/vlc/volume

echo "External IP: $(hostname -I)"
notify-send "External IP: $(hostname -I)"

echo "start Music"
gnome-terminal --title="MUSIC" --zoom=0.5 -e "/bin/bash music_start.sh >> logs/$NOW.music.log 2> logs/$NOW.music.err" &

#echo "start xoclock server.js"
#$(node server.js >> logs/$NOW.log 2> logs/$NOW.err) &

export GOOGLE_APPLICATION_CREDENTIALS="$PWD/google-apikey.json"

echo "start xoclock server.js"
node server.js
