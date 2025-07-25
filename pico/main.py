from connections import connect_mqtt, connect_internet
from time import sleep
from machine import Pin, I2C
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

# ---------- FUNCTIONS ----------
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

def update_oled(distance, temp, hum):
    oled.clear_display()

    oled.set_cursor(0, 0)
    oled.println("Distance: {:.1f} cm".format(distance) if distance is not None else "Distance: Error")

    oled.set_cursor(0, 20)
    oled.println("Temp: {:.1f} C".format(temp) if temp is not None else "Temp: Error")

    oled.set_cursor(0, 35)
    oled.println("Humidity: {:.1f}%".format(hum) if hum is not None else "Humidity: Error")

    oled.display()

# ---------- MAIN FUNCTION ----------
def main():
    print("Connecting to WiFi...")
    connect_internet("Jerard", password="jerarda32")

    client = connect_mqtt(
        "cd2116d580294ecb806ddd465da330cd.s1.eu.hivemq.cloud", 
        "Nathan", 
        "Ab123456"
    )

    print("Starting sensors...")
    time.sleep(2)

    while True:
        try:
            dht_sensor.measure()
            temperature = dht_sensor.temperature()
            humidity = dht_sensor.humidity()
        except Exception as e:
            print("DHT11 Error:", e)
            temperature = None
            humidity = None

        distance = get_distance()

        if distance is not None:
            print("Distance:", distance, "cm")
        else:
            print("Distance: Timeout or error")

        if temperature is not None:
            print("Temperature:", temperature, "°C")
        if humidity is not None:
            print("Humidity:", humidity, "%")

        update_oled(distance, temperature, humidity)

        client.publish("pico/temperature", str(temperature))
        client.publish("pico/humidity", str(humidity))
        client.publish("pico/distance", str(distance))

        sleep(2)

# ---------- RUN ----------
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Stopped by user")
