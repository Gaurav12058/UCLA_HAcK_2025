from connections import connect_mqtt, connect_internet
from time import sleep
from machine import Pin, I2C, ADC
import time
import dht
from DIYables_MicroPython_OLED import OLED_SSD1306_I2C

# ---------- I2C OLED SETUP ----------
i2c = I2C(0, scl=Pin(1), sda=Pin(0), freq=400000)
oled = OLED_SSD1306_I2C(128, 64, i2c)
oled.set_text_size(1)

# ---------- Ultrasonic Sensor SETUP ----------
TRIG = Pin(2, Pin.OUT)
ECHO = Pin(3, Pin.IN)

# ---------- DHT11 Sensor SETUP ----------
dht_pin = Pin(4, Pin.IN, Pin.PULL_UP)
dht_sensor = dht.DHT11(dht_pin)

# ---------- LDR Sensor (Photoresistor) SETUP ----------
ldr = ADC(Pin(26))

# ---------- GLOBAL VARIABLE ----------
incoming_oled_text = None  # Stores OLED message from MQTT

# ---------- FUNCTIONS ----------
def read_light_percent():
    raw = ldr.read_u16()
    percent = (raw / 65535) * 100
    return round(percent, 1)

def get_distance():
    TRIG.value(0)
    time.sleep_us(2)
    TRIG.value(1)
    time.sleep_us(10)
    TRIG.value(0)

    timeout = 30000
    start = time.ticks_us()
    while ECHO.value() == 0:
        if time.ticks_diff(time.ticks_us(), start) > timeout:
            return None
    pulse_start = time.ticks_us()

    start = time.ticks_us()
    while ECHO.value() == 1:
        if time.ticks_diff(time.ticks_us(), start) > timeout:
            return None
    pulse_end = time.ticks_us()

    duration = time.ticks_diff(pulse_end, pulse_start)
    distance = (duration * 0.0343) / 2
    return round(distance, 1)

def update_oled(distance, temp, hum, light):
    oled.clear_display()
    oled.set_cursor(0, 0)
    oled.println("Distance: {:.1f} cm".format(distance) if distance is not None else "Distance: Error")
    oled.set_cursor(0, 15)
    oled.println("Temp: {:.1f} C".format(temp) if temp is not None else "Temp: Error")
    oled.set_cursor(0, 30)
    oled.println("Humidity: {:.1f}%".format(hum) if hum is not None else "Humidity: Error")
    oled.set_cursor(0, 45)
    oled.println("Light: {:.1f}%".format(light) if light is not None else "Light: Error")
    oled.display()

def display_message(msg):
    oled.clear_display()
    oled.set_cursor(0, 0)
    oled.println("Message from Operator:")
    oled.set_cursor(0, 15)
    oled.println(msg[:20])  # 1st line (max 20 chars)
    oled.set_cursor(0, 30)
    oled.println(msg[20:40])  # 2nd line (next 20 chars)
    oled.display()

# ---------- CALLBACK FOR MQTT ----------
def on_message(topic, msg):
    global incoming_oled_text
    if topic == b"pico/oled":
        incoming_oled_text = msg.decode()

# ---------- MAIN FUNCTION ----------
def main():
    global incoming_oled_text

    print("Connecting to WiFi...")
    connect_internet("HAcK-Project-WiFi-2", password="UCLA.HAcK.2024.Summer")

    client = connect_mqtt(
        "cd2116d580294ecb806ddd465da330cd.s1.eu.hivemq.cloud",
        "Nathan",
        "Ab123456"
    )

    client.set_callback(on_message)
    client.subscribe("pico/oled")

    print("Starting sensors...")
    time.sleep(2)

    while True:
        client.check_msg()  # Check for incoming MQTT messages

        # Display incoming OLED message if any
        if incoming_oled_text:
            print("OLED Message Received:", incoming_oled_text)
            display_message(incoming_oled_text)
            sleep(12)  # Display message for 12 seconds
            incoming_oled_text = None  # Clear after displaying

        try:
            dht_sensor.measure()
            temperature = dht_sensor.temperature()
            humidity = dht_sensor.humidity()
        except Exception as e:
            print("DHT11 Error:", e)
            temperature = None
            humidity = None

        distance = get_distance()
        light_level = read_light_percent()

        update_oled(distance, temperature, humidity, light_level)

        # Publish sensor data to MQTT topics
        client.publish("pico/temperature", str(temperature))
        client.publish("pico/humidity", str(humidity))
        client.publish("pico/distance", str(distance))
        client.publish("pico/lightlevel", str(light_level))

        sleep(2)

# ---------- RUN ----------
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Stopped by user")
