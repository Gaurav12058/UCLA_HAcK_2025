ESP32-Camera

Uploading Code to the Camera
-Download Arduino or other C IDE
-Inside of WifiCam change WIFI_SSiD and WIFI_PASS accordingly
-Attach the camera to the daughterboard (says ..-MB on it)
-Connect to computer using USB cable
-Hold the IO0 Button and press the reset button on the Camera to enter programming mode
-Click on 'Tools'->'Manage Libraries', then donwnload the esp32cam library
-Upload the code using the upload button on the IDE
-Click reset and open the serial monitor in Arduino IDE
-Be on a baud rate of 115200 
-Check it connected to wifi successfully 
-Note the IP address -> in the form http:/....

Running the Python Code receive.py
-Make sure the IP Address in receive.py is the same as the one seen in the serial monitor