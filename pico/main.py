from connections import connect_mqtt, connect_internet
from time import sleep

def main():
    try:
        connect_internet("Sarpanch",password="7076648276") #ssid (wifi name), pass
        client = connect_mqtt("mqtts://656224219c054dc78bd6d03e97d1f8f9.s1.eu.hivemq.cloud:8883", "gaurav", "Gaurav@7") # url, user, pass

        while True:
            client.check_msg()
            sleep(0.1)

    except KeyboardInterrupt:
        print('keyboard interrupt')
        
        
if __name__ == "__main__":
    main()



