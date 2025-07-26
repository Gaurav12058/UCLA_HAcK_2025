from secrets import API_KEY
from openai import OpenAI
import base64
import os
import sys

client = OpenAI(api_key=API_KEY)

# Image encoding, code provided
def encode_image(image_path):
    with open(image_path, "rb") as image_F:
        return base64.b64encode(image_F.read()).decode('utf-8')


#Sending a request and getting a response
def analyze_image(image_path, input_text):
    encoded = encode_image(image_path)

    response = client.responses.create(
        model="gpt-4.1",
        input=[
            {
                "role": "user",
                "content": [
                    { "type": "input_text", "text": input_text },
                    {
                        "type": "input_image",
                        "image_url": f"data:image/jpeg;base64,{encoded}",
                    },
                ],
            }
        ],
    )
    return response.output_text

def save_audio_from_text(text, output_path="../backend/output.wav", voice="nova"):
    # Resolve output_path relative to the script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    abs_output_path = os.path.normpath(os.path.join(script_dir, output_path))
    
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
        response_format="wav"
    )

    with open(abs_output_path, "wb") as f:
        f.write(response.content)


# rtext = analyze_image("/Users/rothk/VSProjects/UCLA_HAcK_2025/frontend/public/downloaded_image.jpg", "What is in this image?")
# print(rtext)
# save_audio_from_text(rtext)


if __name__ == "__main__":
# Get input text from command line argument
    if len(sys.argv) < 2:
        print("Usage: python send_to_openai.py 'your input text here'")
        sys.exit(1)

    input_text = sys.argv[1]

    default_image_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "../frontend/public/downloaded_image.jpg")
    )

    gpt_response = analyze_image(default_image_path, input_text)
    print("GPT Response:", gpt_response)
    save_audio_from_text(gpt_response)