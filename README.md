# UCLA HAcK 2025
This REPO contains all the files/code we created during the UCLA HAcK 2025 Challenge

# HAcK 2025 Theme
Wes is a famous jewelry collector.  His most prized possession, a 500 carat diamond, was stolen just last week by a thief that no one could track down…until now. We’ve confirmed the location of the diamond, and we’ll be sending our HAcKers in to retrieve it.  However, we are expecting heavy security, so it won’t be easy finding the jewel. Insider information gave us insight on the security measures they have in place, and you must construct a device that will aid you in deciphering them.

HAcKers will send in one agent equipped with a wearable spy device of their own creation to infiltrate the Secure Base where the diamond is being held. The agent will communicate and send data to their operator (in another room) who will guide the agent by sending messages back to interpret clues, decode information and recover the diamond.

# Technical Challenge
You will need to construct a device (or series of devices) that meets the following requirements:
- Your device(s) must attach to the operator without them having to hold or support them with their hands.
- Your device(s) must resemble wearable accessories/articles of clothing, and should be disguised or otherwise discreet.
- Your device(s) must contain/conceal electrical components
- A device must feature your team logo on it

Our intel suggests that your prototype will need to be able to perform the following tasks:
- Your pico must be able to gather accurate temperature and humidity data to analyze the active field environment
- Your pico must be able to measure light levels and determine distances between objects
- Your ESP-32 cam must be able to take photos that save to the operator’s laptop
- All collected data must be sent to the operator at the bay station for further decoding/analysis

You must also create a website for your operator at the bay station to use:
- Your website must operate the camera, deciding when to  take a picture
- All data received from the agent must be visible on  the website (Temperature in F, Distance in cm, Humidity %, Light in lumens)
- Your website must be able to make api calls to our supercomputer back at HQ (ChatGPT) in order to audibly decipher any additional unknowns
- The results of your api calls must also be viewable on the website
- Your website must be able to communicate information from the operator to the agent in the field

Should anything happen to you or your fellow agents, our team must be able to reproduce your prototypes. As such, you will be required to document the following:
- All code must be uploaded to a GitHub repository and be properly updated.
- You must create and save a CAD for each part of your design.
- You must maintain a simple schematic of your circuits that contains the wiring route and the electrical components used.

# Backend and Frontend setup

- In the backend directory, create a file named '.env', and add the following:

- CONNECT_URL=mqtts://(your URL):(your port)

- MQTT_USER=(your user)

- MQTT_PASS=(your pass)

- Then, while in the backend directory, install the dependencies by running
### `npm install`
- You can start the backend by running 
### `node index.js`

- In a separate terminal, in the frontend directory, install the dependencies by running
### `npm install`
- You can start the frontend by running 
### `npm start`

# Using connections.py for your Pico 2W

- You will be able to use 2 functions in connections.py
    - One for connection to the MQTT broker (connect_mqtt) and one for connecting to WIFI (connect_internet)

    - connect_mqtt(mqtt_server, mqtt_user, mqtt_pass):

        - mqtt_server: the server url which you have obtained by making a free serverless MQTT Broker on HIVEMQ
            - Should look something like: '37##616##db7#bd1##cac997eb01##13.s1.eu.hivemq.cloud'

        - mqtt_user:
            - This is the name of the user you create when you make a credential
                - The purpose of this is just to have a unique user in which the MQTT Broker can understand where the message is coming from 
                - Ex: username = 'pico' when creating credentials for the Raspberry Pi Pico W to send something

        - mqtt_pass:
            - This is the password that goes along with your mqtt_user
            - Just for the broker to validate the user
            - Make this whatever you want, just write it down

        - RETURNS client, which you can use 
            - client.subscribe(b"topic") to subscribe to a topic of your choice
            - client.publish(b"topic", b"message") to publish a message with a topic of your choice
            - client

    - connect_internet( ssid, password ):
        
        - ssid: 
            - This is the name of the wi-fi network you are trying to connect to

        - password:
            - this is the password of the wi-fi network you are trying to connect to
