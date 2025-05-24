import os
import uuid
import requests
from flask import current_app
from PIL import Image
from io import BytesIO
from pydub import AudioSegment
from moviepy.editor import ImageClip, AudioFileClip, concatenate_audioclips, concatenate_videoclips
import openai

# 🔑 OpenAI API 키 설정
openai.api_key = "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"  # 실제 키로 교체할 것

MAX_PROMPT_LENGTH = 950

# 🔮 GPT를 사용한 프롬프트 생성 함수
def generate_visual_prompt_with_gpt(poetic_line: str):
    system_msg = (
        "You're a poetic image prompt designer. Your job is to create a concise, cinematic, and visual prompt "
        "under 950 characters for DALL·E from a poetic line. Focus on imagery and emotion, skip title/headers."
    )
    user_msg = f"Create a DALL·E image generation prompt for this poetic line: '{poetic_line}'"

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
            temperature=0.8
        )
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"❌ GPT 프롬프트 생성 실패: {e}")
        return f"A minimalistic image describing the line: '{poetic_line}'"

# 🎨 DALL·E 이미지 생성기
def generate_image_with_dalle(prompt: str, size="1024x1024"):
    try:
        response = openai.Image.create(
            prompt=prompt,
            n=1,
            size=size
        )
        image_url = response['data'][0]['url']
        image_response = requests.get(image_url)
        return Image.open(BytesIO(image_response.content))
    except Exception as e:
        print(f"❌ DALL·E 이미지 생성 실패: {e}")
        return None

# 🎥 슬라이드쇼 생성기
def generate_slideshow(lines, audio_paths, config):
    if not lines or not audio_paths or len(lines) != len(audio_paths):
        raise ValueError("시 구절과 오디오 파일 수가 일치해야 합니다.")

    image_folder = config['IMAGE_FOLDER']
    video_folder = config['VIDEO_FOLDER']
    clips, audio_clips = [], []

    for line, audio_path in zip(lines, audio_paths):
        print(f"\n🖌️ 시구: {line}")
        gpt_prompt = generate_visual_prompt_with_gpt(line)
        print(f"🧠 GPT 프롬프트: {gpt_prompt}")

        image = generate_image_with_dalle(gpt_prompt)
        if image is None:
            image_path = os.path.join(image_folder, "default.jpg")
        else:
            image_path = os.path.join(image_folder, f"frame_{uuid.uuid4().hex[:8]}.png")
            image.save(image_path)

        # 오디오 길이 계산
        audio = AudioSegment.from_file(audio_path)
        duration = audio.duration_seconds

        # 이미지와 오디오를 합쳐서 클립 생성
        img_clip = ImageClip(image_path, duration=duration).fadein(0.5).fadeout(0.5)
        clips.append(img_clip)
        audio_clips.append(AudioFileClip(audio_path))

    # 오디오 & 비디오 연결
    final_audio = concatenate_audioclips(audio_clips)
    final_video = concatenate_videoclips(clips).set_audio(final_audio)

    # 결과 저장
    output_path = os.path.join(video_folder, f"slideshow_{uuid.uuid4().hex[:8]}.mp4")
    final_video.write_videofile(output_path, codec="libx264", audio_codec="aac", fps=24)

    url_path = os.path.relpath(output_path, current_app.root_path).replace("\\", "/")
    return "/" + url_path

