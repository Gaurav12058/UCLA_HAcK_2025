from secret import API_KEY
from openai import OpenAI

import base64

client = OpenAI(api_key=API_KEY)


# Image encoding, code provided
def encode_image(image_path):
    with open(image_path, "rb") as image_F:
        return base64.b64encode(image_F.read()).decode('utf-8')


# TODO: Sending a request and getting a response



# TODO: How do we make things audible?
    


# TODO: Can we put everything together?

