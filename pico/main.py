from connections import connect_mqtt, connect_internet
from time import sleep


def main():
    try:
        connect_internet("",password="") #ssid (wifi name), pass
        client = connect_mqtt("", "", "") # url, user, pass

        while True:
            client.check_msg()
            sleep(0.1)

    except KeyboardInterrupt:
        print('keyboard interrupt')
        
        
if __name__ == "__main__":
    main()



