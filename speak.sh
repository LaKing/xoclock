#!/bin/bash

texts="$@"

if [ -z "$texts" ]
then
    texts="technical timeout"
fi

killall aplay play espeak festival
sleep 0.3

## turn the text to files based on commas
dir='audio/'
_texts="$(echo ${texts//|/$dir} | xargs | tr [:upper:] [:lower:] | tr ' ' '_'),_"
files="${_texts//,_/.wav }"

cd audio

if ! play "$files" >> log
then
    echo "$texts" >> log
    echo "$files" >> log
    ## failed to play as audio, so speach synth
    #echo "$texts" | festival --tts
    espeak "$texts"
fi
