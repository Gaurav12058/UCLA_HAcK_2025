import requests
import os

import send_to_openai

# Get the folder where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
filename = os.path.join(script_dir, "../frontend/public/downloaded_image.jpg") 

url = "http://172.20.10.9/1024x768.jpg"             # You will have to change the IP Address

# Function to download the image from esp32
def download_image():
    response = requests.get(url)

    if response.status_code == 200:
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"Image saved to: {filename}")
    else:
        print("Failed to download image. Status code:", response.status_code)

if __name__ == "__main__":
    download_image()