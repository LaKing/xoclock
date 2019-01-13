#!/bin/bash

#notify-send "Keypress: $1 $(date +%H:%M:%S)"

#cd "/home/$USER/xoclock"
mkdir -p logs

echo "$(date +%H:%M:%S) keys: $1" >> logs/keypress.log

if [ ! -f settings.json ]
then
    echo "settings.json not found"
    exit
fi

pass=$(cat settings.json | jq .keys_pass | xargs)

if [ -z "$pass" ]
then
    echo "Pass for the secure request is empty"
    echo "Pass for the secure request is empty" >> logs/keypress.log
    exit
fi

if [ -z "$1" ]
then
    echo "need a key as argument,.."
    echo "need a key as argument,.." >> logs/keypress.log

    exit
fi

curl -k --user "admin:$pass" "https://localhost:8443/$1" 2>> logs/keypress.log