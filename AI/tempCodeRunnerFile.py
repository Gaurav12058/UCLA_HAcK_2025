def save_audio_from_text(text, output_path="../backend/output.wav", voice="nova"):
#     os.makedirs(os.path.dirname(output_path), exist_ok=True)
#     response = client.audio.speech.create(
#         model="tts-1",
#         voice=voice,
#         input=text,
#         response_format="mp3"
#     )

#     with open(output_path, "wb") as f:
#         f.write(response.content)