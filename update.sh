#!/bin/bash

echo "Updating."
git pull

sudo ./install.sh

echo "Please use ./start.sh to run the application."
