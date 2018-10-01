#!/bin/bash

if [[ ! -f google-apikey.json ]]
then
    echo "We need a google-apikey.json from the google cloud console,..."
    exit
fi

sudo tee -a /etc/yum.repos.d/google-cloud-sdk.repo << EOM
[google-cloud-sdk]
name=Google Cloud SDK
baseurl=https://packages.cloud.google.com/yum/repos/cloud-sdk-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg
       https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOM

sudo dnf -y install google-cloud-sdk

gcloud auth activate-service-account --key-file=google-apikey.json

npm install --save @google-cloud/text-to-speech

export GOOGLE_APPLICATION_CREDENTIALS="/home/x/Downloads/google-apikey.json"