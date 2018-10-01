#!/bin/bash

if [ ! -f index.json ]
then
    echo 'No team index! This script requires an index.json listing teams.'
    exit
fi

node make-groups-roundrobin.js