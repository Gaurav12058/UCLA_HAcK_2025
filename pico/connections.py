from simple import MQTTClient
import ssl
from time import sleep


class sslWrap:
    def __init__(self):
        self.wrap_socket = ssl.wrap_socket


def connect_mqtt(mqtt_server, mqtt_user, mqtt_pass):
    client = MQTTClient(
        client_id=b"pico",
        server= mqtt_server,
        port=8883,
        user=mqtt_user,
        password=mqtt_pass,
        keepalive=3000, 
        ssl=sslWrap()     
    )
    client.connect()
    print("connected to MQTT")
    return client


import network

def connect_internet(ssid, password=None):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    found = False
    while not found:
        print("Scanning for networks...")
        nets = wlan.scan()
        for net in nets:
            net_ssid = net[0].decode()
            print(net_ssid)
            if net_ssid == ssid:
                found = True
                break
        if not found:
            print(f"SSID '{ssid}' not found, rescanning in 2s...")
            sleep(2)
    if not password:
        wlan.connect(ssid)
    else:
        wlan.connect(ssid, password)
    # Just wait for connection, don't scan again
    while wlan.isconnected() == False:
        print('Waiting for connection...')
        sleep(1)
    ip = wlan.ifconfig()[0]
    print(f'Connected on {ip}')
    return ip

