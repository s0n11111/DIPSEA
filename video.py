import random


def generate_video(prompt: str, emotion: str) -> str:
    VIDEO_URLS = [
        "https://www.youtube.com/embed/hlWiI4xVXKY",
        "https://www.youtube.com/embed/UFLyhzlG8FQ",
        "https://www.youtube.com/embed/n3McD-676Jw",
        "https://www.youtube.com/embed/XJ9Vylyk5Uw",
    ]
    return random.choice(VIDEO_URLS)
