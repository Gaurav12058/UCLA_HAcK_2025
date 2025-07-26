import os
import sys
import base64
from openai import OpenAI
from secrets import API_KEY  

client = OpenAI(api_key=API_KEY)

def encode_image(image_path):
    try:
        with open(image_path, "rb") as image_F:
            return base64.b64encode(image_F.read()).decode("utf-8")
    except Exception as e:
        print(f"Error encoding image: {e}")
        sys.exit(1)

def analyze_image(image_path, input_text):
    encoded = encode_image(image_path)
    try:
        response = client.chat.completions.create(
            model="gpt-4.1-2025-04-14",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": input_text},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=500
        )
        print("GPT response:", response.choices[0].message.content)
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error during OpenAI chat completion: {e}")
        sys.exit(1)

def save_audio_from_text(text, output_path="../frontend/public/audio/output.wav", voice="nova"):
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        abs_output_path = os.path.normpath(os.path.join(script_dir, output_path))
        print(f"Saving audio to: {abs_output_path}")

        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="wav",
        )

        with open(abs_output_path, "wb") as f:
            f.write(response.content)
    except Exception as e:
        print(f"Error during audio generation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Set prompt here directly
    input_text = "Describe the image"

    default_image_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "../frontend/public/downloaded_image.jpg")
    )

    response_text = analyze_image(default_image_path, input_text)
    save_audio_from_text(response_text)
