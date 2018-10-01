#!/bin/bash

SCRIPT=$(realpath $0)
SCRIPTPATH=$(dirname $SCRIPT)
cd $SCRIPTPATH

echo "Working in $SCRIPTPATH"

if [ "$EUID" != 0 ]
then
    echo "The installer needs root privileges."
    sudo ./install.sh
    exit
fi

## this should be fedora.
echo "Started the xoclock-installer."

source arch.sh

if $fedora || $raspbian || $ubuntu
then
    echo "Starting the installer"
else
    echo "Your distribution is not supported yet. Please install manually."
    exit
fi

    mkdir -p /var/vlc
    chmod 777 /var/vlc

cd $SCRIPTPATH

## raspbian installer
if $raspbian || $ubuntu
then
    apt-get -y update
    apt-get -y install mc
    apt-get -y install vlc
    apt-get -y install sox
    apt-get -y install libsox-fmt-mp3
    
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    apt-get install -y nodejs
fi

if $raspbian
then 
    apt-get -y install iceweasel
    apt-get -y install unclutter
    apt-get -y install x11-xserver-utils
    
    ## raspberry PI3 as WIFI AP https://frillip.com/using-your-raspberry-pi-3-as-a-wifi-access-point-with-hostapd/
    apt-get -y install dnsmasq hostapd
    
    if [ -z "$(cat /etc/dhcpcd.conf | grep Xoclock)" ]
    then
        echo '' >> /etc/dhcpcd.conf 
        echo '## Xoclock config'>> /etc/dhcpcd.conf
        echo 'interface wlan0 ' >> /etc/dhcpcd.conf
        echo 'static ip_address=10.10.10.10/24' >> /etc/dhcpcd.conf
    fi
    
    if [ -z "$(cat /etc/network/interfaces | grep Xoclock)" ]
    then   
        cat /etc/network/interfaces > /etc/network/interfaces.bak
        echo '## Xoclock generated' > /etc/network/interfaces
        echo '# interfaces(5) file used by ifup(8) and ifdown(8)' >> /etc/network/interfaces
        echo 'source-directory /etc/network/interfaces.d' >> /etc/network/interfaces
        echo 'auto lo' >> /etc/network/interfaces
        echo 'iface lo inet loopback' >> /etc/network/interfaces
        echo 'iface eth0 inet manual' >> /etc/network/interfaces
        echo 'allow-hotplug wlan0' >> /etc/network/interfaces
        echo 'iface wlan0 inet manual' >> /etc/network/interfaces
        echo 'allow-hotplug wlan1' >> /etc/network/interfaces
        echo 'iface wlan1 inet manual' >> /etc/network/interfaces
        echo '' >> /etc/network/interfaces
    fi
    
    service dhcpcd restart
    
    if [ ! -f /etc/hostapd/hostapd.conf ]
    then
    
        cat > /etc/hostapd/hostapd.conf << EOF
## Xoclock config

# This is the name of the WiFi interface we configured above
interface=wlan0

# Use the nl80211 driver with the brcmfmac driver
driver=nl80211

# This is the name of the network
ssid=xoclock

# Use the 2.4GHz band
hw_mode=g

# Use channel 6
channel=3

# Enable 802.11n
ieee80211n=1

# Enable WMM
wmm_enabled=1

# Enable 40MHz channels with 20ns guard interval
ht_capab=[HT40][SHORT-GI-20][DSSS_CCK-40]

# Accept all MAC addresses
macaddr_acl=0

# Use WPA authentication
auth_algs=1

# Require clients to know the network name
ignore_broadcast_ssid=0

## ENABLE PASSWORD PROTECTION HERE
# to Use WPA2  set wpa=2
wpa=0

# Use a pre-shared key
wpa_key_mgmt=WPA-PSK

# The network passphrase min 8 chars
wpa_passphrase=paintball

# Use AES, instead of TKIP
rsn_pairwise=CCMP

EOF
    
    fi
    
    if [ -z "$(cat /etc/default/hostapd | grep Xoclock)" ]
    then   
        echo '## Xoclock config' >> /etc/default/hostapd
        echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf"' >> /etc/default/hostapd
    fi    

    if [ -z "$(cat /etc/dnsmasq.conf | grep Xoclock)" ]
    then   
        cat /etc/dnsmasq.conf > /etc/dnsmasq.bak
        
        cat > /etc/dnsmasq.conf << EOF
## Xoclock config
interface=wlan0      # Use interface wlan0  
bind-interfaces      # Bind to the interface to make sure we aren't sending things elsewhere  
server=8.8.8.8       # Forward DNS requests to Google DNS  
domain-needed        # Don't forward short names  
bogus-priv           # Never forward addresses in the non-routed address spaces.  
dhcp-range=10.10.10.11,10.10.10.250,12h # Assign IP addresses with a 12 hour lease time 
address=/xoclock.local/10.10.10.10
EOF

    fi        

    if [ -z "$(cat /etc/sysctl.conf | grep Xoclock)" ]
    then   
        echo '## Xoclock config' >> /etc/sysctl.conf
        echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
    fi

    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT  
    iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT
    
    ## use default ports instead of node portsIPTBL=/sbin/iptables
    echo "1" > /proc/sys/net/ipv4/ip_forward

    IF_IN=wlan0
    PORT_IN=80

    IP_OUT=10.10.10.10
    PORT_OUT=8080
    
    iptables -A PREROUTING -t nat -i $IF_IN -p tcp --dport $PORT_IN -j DNAT --to-destination ${IP_OUT}:${PORT_OUT}
    iptables -A FORWARD -p tcp -d $IP_OUT --dport $PORT_OUT -j ACCEPT
    iptables -A POSTROUTING -t nat -j MASQUERADE

    IF_IN=wlan0
    PORT_IN=443

    IP_OUT=10.10.10.10
    PORT_OUT=8443

    iptables -A PREROUTING -t nat -i $IF_IN -p tcp --dport $PORT_IN -j DNAT --to-destination ${IP_OUT}:${PORT_OUT}
    iptables -A FORWARD -p tcp -d $IP_OUT --dport $PORT_OUT -j ACCEPT
    iptables -A POSTROUTING -t nat -j MASQUERADE


    sh -c "iptables-save > /etc/iptables.ipv4.nat"
    
    if [ ! -f /lib/dhcpcd/dhcpcd-hooks/70-ipv4-nat ]
    then
        echo 'iptables-restore < /etc/iptables.ipv4.nat' >> /lib/dhcpcd/dhcpcd-hooks/70-ipv4-nat
    fi
    
    service hostapd start  
    service dnsmasq start  
    
    ## autostart on raspbian
    echo "@lxpanel --profile LXDE-pi" > /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@pcmanfm --desktop --profile LXDE-pi" >> /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@xset s off" >> /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@xset -dpms" >> /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@xset s noblank" >> /etc/xdg/lxsession/LXDE-pi/autostart
    
    echo "@lxpanel --profile LXDE-pi" > /home/pi/.config/lxsession/LXDE-pi/autostart
    echo "@pcmanfm --desktop --profile LXDE-pi" >> /home/pi/.config/lxsession/LXDE-pi/autostart
    echo "@lxterminal -l -e $SCRIPTPATH/start.sh" >> /home/pi/.config/lxsession/LXDE-pi/autostart

    ## need
    ## /etc/kbd/config
    # BLANK_TIME=0
    # POWERDOWN_TIME=0


    ## run firefox in fullscreen    
    cd /home/*/.config/openbox
    
    if [ -z "$(cat lxde-pi-rc.xml | grep Xoclock)" ]
    then   
        cat lxde-pi-rc.xml > lxde-pi-rc.bak
        cat lxde-pi-rc.bak | sed 's|</applications>|<!--## Xoclock -->\n<application class="Firefox" name="Navigator">\n<fullscreen>yes</fullscreen>\n</application>\n</applications>|g' > lxde-pi-rc.xml
    fi
    cd $SCRIPTPATH 

fi

if $fedora
then
    
    dnf -y update
    
    dnf -y install mc
    
    ## install vlc
    dnf -y install --nogpgcheck http://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm http://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
    dnf -y install vlc

    ## aplay
    dnf -y install alsa-utils

    ## sox with mp3 // libsox-fmt-mp3 on ubuntu
    dnf -y install sox-plugins-freeworld

    dnf -y install festival espeak

    ## dont deactivate if the lid is closed
    echo "HandleLidSwitch=ignore" >> /etc/systemd/logind.conf

    ## open firewall and port setup
    #dnf -y install iptables-services
    echo "http and https will be opened on the firewall"
    systemctl start firewalld

    firewall-cmd --add-service=http
    firewall-cmd --add-service=https

    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https

    firewall-cmd --reload

    echo "Checking for node.js"
    sudo curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
    sudo dnf -y install nodejs

    sudo dnf -y install xbindkeys
    sudo dnf -y install jq

fi

setcap 'cap_net_bind_service=+ep' /usr/bin/node
echo "127.0.0.1 	xoclock" >> /etc/hosts

#node modules
npm install


## Create a certificate

        ssl_password="no_password"
        ssl_days=365
        ssl_key=key.pem
        ssl_csr=csr.pem
        ssl_org=org.pem
        ssl_crt=crt.pem
        ssl_config=cert-config.txt    
        
if [ ! -f $ssl_key ] || [ ! -f $ssl_crt ]
then
    echo "Generate self-signed certificate"
    
        ## Generate a Private Key
        openssl genrsa -des3 -passout pass:$ssl_password -out $ssl_key 2048 2> /dev/null

        ## Generate a CSR (Certificate Signing Request)
        openssl req -new -passin pass:$ssl_password -passout pass:$ssl_password -key $ssl_key -out $ssl_csr -days $ssl_days -config $ssl_config 2> /dev/null
        
        ## Remove Passphrase from Key
        cp $ssl_key $ssl_org
        openssl rsa -passin pass:$ssl_password -in $ssl_org -out $ssl_key 2> /dev/null       
        
        ## Self-Sign Certificate
        openssl x509 -req -days $ssl_days -passin pass:$ssl_password -extensions v3_req -in $ssl_csr -signkey $ssl_key -out $ssl_crt 2> /dev/null
        
        
fi


## get music / we assume there is only one user
if [ -z "$(ls /home/*/Music)" ]
then
    cd /home/*/Music
    wget ftp://d250.hu/D250/LaKing-Summer2006/LaKing-Summer2006.mp3
fi

echo "Installation done."
echo "based on the example configs, create settings.json and team's index.json in the xoclock application folder."
echo "You also might want to create the roundrobin schedule with make-groups.sh that will create groups.json"
