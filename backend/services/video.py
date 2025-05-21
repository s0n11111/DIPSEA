import requests
from moviepy.editor import ImageClip, concatenate_audioclips, concatenate_videoclips, AudioFileClip
from io import BytesIO
from PIL import Image
from flask import current_app
from pydub import AudioSegment
import os
import uuid

DEEPAI_API_KEY = "69900b38-13e8-428a-a632-74b908dabe27"


def generate_image(prompt):
    url = "https://api.deepai.org/api/text2img"
    response = requests.post(
        url,
        data={'text': prompt},
        headers={'api-key': DEEPAI_API_KEY}
    )
    result = response.json()
    print("🔍 DeepAI 응답:", result)
    if 'output_url' in result:
        image_url = result['output_url']
        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content))
        return image
    return None


def generate_slideshow(prompts: list, audio_paths: list):
    if not prompts or not audio_paths or len(prompts) != len(audio_paths):
        raise ValueError("프롬프트와 오디오 파일 수가 일치해야 합니다.")

    clips = []
    audio_clips = []

    for idx, (prompt, audio_path) in enumerate(zip(prompts, audio_paths)):
        if not os.path.isfile(audio_path):
            raise FileNotFoundError(f"음성 파일이 존재하지 않습니다: {audio_path}")

        print(f"📸 이미지 생성 프롬프트: {prompt}")
        image = generate_image(prompt)

        if image is None:
            print(f"⚠️ 이미지 생성 실패: '{prompt}' → 기본 배경 이미지 사용")
            image_path = os.path.join(current_app.config['IMAGE_FOLDER'], "default.jpg")  # 기본 이미지 대체
        else:
            image_path = os.path.join(current_app.config['IMAGE_FOLDER'], f"frame_{uuid.uuid4().hex[:8]}.png")
            image.save(image_path)

        # 오디오 길이 계산
        audio = AudioSegment.from_file(audio_path)
        duration = audio.duration_seconds
        print(f"🎵 {os.path.basename(audio_path)} 길이: {duration:.2f}초")

        # 이미지 클립과 오디오 클립 생성
        img_clip = ImageClip(image_path, duration=duration).fadein(0.5).fadeout(0.5)
        clips.append(img_clip)
        audio_clips.append(AudioFileClip(audio_path))

    # 오디오 연결
    full_audio = concatenate_audioclips(audio_clips)
    final_video = concatenate_videoclips(clips).set_audio(full_audio)

    output_path = os.path.join(current_app.config["VIDEO_FOLDER"], f"slideshow_{uuid.uuid4().hex[:8]}.mp4")
    final_video.write_videofile(output_path, codec="libx264", audio_codec="aac", fps=24)

    url_path = os.path.relpath(output_path, current_app.root_path).replace("\\", "/")
    return "/" + url_path
