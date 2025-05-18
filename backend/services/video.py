from flask import current_app
import yt_dlp
import os
import random
import uuid
import traceback


def generate_video(prompt: str, emotion: str) -> str:
    # 감정 기반 추천 영상 리스트
    VIDEO_URLS = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Rickroll
        "https://www.youtube.com/watch?v=2Vv-BfVoq4g",  # Ed Sheeran - Perfect
        "https://www.youtube.com/watch?v=kJQP7kiw5Fk",  # Despacito
    ]

    url = random.choice(VIDEO_URLS)
    video_dir = current_app.config["VIDEO_FOLDER"]
    os.makedirs(video_dir, exist_ok=True)

    filename = f"{emotion}_{uuid.uuid4().hex[:8]}.mp4"
    save_path = os.path.join(video_dir, filename)

    ydl_opts = {
        'outtmpl': save_path,
        'format': 'mp4',
        'quiet': True,
        'noplaylist': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"✅ 영상 다운로드 완료: {filename}")
        return f"/static/output/video/{filename}"
    except Exception as e:
        traceback.print_exc()
        print(f"❌ 영상 다운로드 실패: {e}")
        return None
