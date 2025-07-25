import requests
import os

# Get the folder where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
filename = os.path.join(script_dir, "downloaded_image.jpg")

# Function to download the image
def download_image():
    url = "http://172.20.10.6/1024x768.jpg"
    response = requests.get(url)

    if response.status_code == 200:
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"Image saved to: {filename}")
    else:
        print("Failed to download image. Status code:", response.status_code)

# Main loop with input options
while True:
    user_input = input("Enter 'update' to download a new photo or 'quit' to exit: ").strip().lower()

    if user_input == 'update':
        download_image()
    elif user_input == 'quit':
        print("Exiting the program.")
        break
    else:
        print("Invalid input. Please enter 'update' or 'quit'.")