import os
import base64
from flask import Flask, request, jsonify, send_file
from openai import OpenAI
from google.cloud import texttospeech
import io
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Initialize OpenAI client
# API key is loaded from .env file via OPENAI_API_KEY
try:
    openai_client = OpenAI()
except Exception as e:
    print(f"Failed to initialize OpenAI client: {e}")
    print("Please ensure the OPENAI_API_KEY is set in your .env file.")
    openai_client = None

# Initialize Google Cloud TextToSpeechClient
# Credentials path is loaded from .env file via GOOGLE_APPLICATION_CREDENTIALS
try:
    tts_client = texttospeech.TextToSpeechClient()
except Exception as e:
    print(f"Failed to initialize Google Cloud TTS client: {e}")
    print("Please ensure the GOOGLE_APPLICATION_CREDENTIALS is set in your .env file.")
    tts_client = None

@app.route('/describe', methods=['POST'])
def describe_image():
    if not openai_client:
        return jsonify({"error": "OpenAI client not initialized. Check API key."}), 500
    if not tts_client:
        return jsonify({"error": "TTS client not initialized. Check Google Cloud credentials."}), 500

    if not request.data:
        return jsonify({"error": "No image data received"}), 400

    image_bytes = request.data
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    try:
        # --- Get description from OpenAI ---
        # Using GPT-4o as an example, adjust model as needed
        # The prompt is similar to the one used in Qhacks2025
        prompt_text = (
            "You are assisting a visually impaired person by describing their surroundings "
            "based on an image taken from their perspective. Speak directly to them, "
            "addressing them as 'you,' as if you're standing next to them. "
            "Focus on practical, sensory-rich details like the positions of objects, "
            "distances, sounds, and movements around them. "
            "Avoid unnecessary details like lighting or colors, and don't describe it as a photograph. "
            "Instead, describe the surroundings in a way that helps them feel immersed and "
            "connected to their environment. Limit the response to about 50-70 words."
        )
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # Or "gpt-4-vision-preview"
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=150
        )
        description = response.choices[0].message.content.strip()
        print(f"OpenAI Description: {description}")

        # --- Convert description to speech using Google Cloud TTS ---
        synthesis_input = texttospeech.SynthesisInput(text=description)
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Journey-F" # Example voice, choose one that fits
            # ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0 # Adjust as needed
        )

        tts_response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        audio_content = tts_response.audio_content
        print(f"Generated audio, {len(audio_content)} bytes.")

        # Send the audio content back
        return send_file(
            io.BytesIO(audio_content),
            mimetype='audio/mpeg',
            as_attachment=False, # Send inline
            # download_name='description.mp3' # Not needed if not an attachment
        )

    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Make sure to run on a host accessible by your ESP32, e.g., 0.0.0.0
    # Choose a port that is not in use.
    app.run(host='0.0.0.0', port=5000, debug=True) 