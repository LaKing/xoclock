#!/bin/bash

SCRIPT="$(realpath $0)"
SCRIPTPATH="$(dirname $SCRIPT)"
cd "$SCRIPTPATH"

echo "Working in $SCRIPTPATH"

if [ "$EUID" != 0 ]
then
    echo "The installer needs root privileges."
    sudo $SCRIPT
    exit
fi

## this should be fedora.
echo "Started the xoclock-installer."

source /etc/os-release

if [[ $NAME == Fedora ]]
then
    echo "Starting the installer"
else
    echo "Your distribution is not supported yet. Please install manually."
    exit
fi

    mkdir -p /var/vlc
    chmod 777 /var/vlc
    
    dnf -y update
    
    dnf -y install mc
    
    ## install vlc
    dnf -y install --nogpgcheck http://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm http://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
    dnf -y install vlc

    ## aplay
    dnf -y install alsa-utils

    ## sox with mp3 // libsox-fmt-mp3 on ubuntu
    dnf -y install sox 
    #sox-plugins-freeworld

    dnf -y install festival espeak

    bash google-installer.sh

    ## dont deactivate if the lid is closed
    echo "HandleLidSwitch=ignore" >> /etc/systemd/logind.conf

    ## open firewall and port setup
    # dnf -y install iptables-services
    echo "http and https will be opened on the firewall"
    systemctl start firewalld

    firewall-cmd --add-service=http
    firewall-cmd --add-service=https

    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https

    firewall-cmd --reload

    sudo dnf -y install nodejs

    sudo dnf -y install xbindkeys
    sudo dnf -y install jq

    setcap 'cap_net_bind_service=+ep' /usr/bin/node

    echo "" >> /etc/hosts
    echo "127.0.0.1 	xoclock" >> /etc/hosts
    echo "" >> /etc/hosts
    

    #node modules
    npm install
    
    npm rebuild


    dnf -y install ntp
    systemctl start ntpd

## reduce cpu and memory usage
    systemctl stop abrtd
    systemctl disable abrtd


## Create a certificate

        ssl_password="no_password"
        ssl_days=365
        ssl_key=key.pem
        ssl_csr=csr.pem
        ssl_org=org.pem
        ssl_crt=crt.pem
        ssl_config=cert-config.txt    
        
if [[ ! -f "$ssl_key" ]] || [[ ! -f "$ssl_crt" ]]
then
    echo "Generate self-signed certificate"
    
        ## Generate a Private Key
        openssl genrsa -des3 -passout "pass:$ssl_password" -out "$ssl_key" 2048 2> /dev/null

        ## Generate a CSR (Certificate Signing Request)
        openssl req -new -passin "pass:$ssl_password" -passout "pass:$ssl_password" -key "$ssl_key" -out "$ssl_csr" -days "$ssl_days" -config "$ssl_config" 2> /dev/null
        
        ## Remove Passphrase from Key
        cp "$ssl_key" "$ssl_org"
        openssl rsa -passin "pass:$ssl_password" -in "$ssl_org" -out "$ssl_key" 2> /dev/null       
        
        ## Self-Sign Certificate
        openssl x509 -req -days "$ssl_days" -passin "pass:$ssl_password" -extensions v3_req -in "$ssl_csr" -signkey "$ssl_key" -out "$ssl_crt" 2> /dev/null

fi


## get music / we assume there is only one user
if [ -z "$(ls /home/*/Music)" ]
then
    echo "We need Music"
    cd /home/*/Music
    wget ftp://d250.hu/D250/LaKing-Summer2006/LaKing-Summer2006.mp3
fi

echo "Installation done. Installation of google chrome is not part of the installer, please install manually."
echo "Based on the example configs, create settings.json and team's index.json in the xoclock application folder."
echo "You also might want to create the roundrobin schedule with make-groups.sh that will create groups.json"
