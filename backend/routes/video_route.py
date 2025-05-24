from flask import Blueprint, request, jsonify, current_app
from services.video import generate_slideshow
import os

video_bp = Blueprint("video", __name__)


@video_bp.route("/video", methods=["POST"])
def handle_generate_video():
    data = request.get_json()

    prompts = data.get("prompts")
    audio_path = data.get("audio_path")

    if not prompts or not audio_path:
        return jsonify({"error": "Both 'prompts' and 'audio_path' are required"}), 400

    try:
        audio_file = audio_path[0]
        audio_dir = os.path.dirname(audio_file.replace("/static/output/audio", "").lstrip("/"))
        full_audio_path = os.path.join(current_app.config["AUDIO_FOLDER"], audio_dir)
        print(f"🔄 오디오 파일 경로: {full_audio_path}")

        # 디렉토리 안의 .wav 파일들 정렬
        audio_files = sorted([
            os.path.join(full_audio_path, f)
            for f in os.listdir(full_audio_path)
            if f.endswith(".wav")
        ])

        # 동영상 생성
        video_url = generate_slideshow(prompts, audio_files, current_app.config)
        return jsonify({"video_url": video_url})
    except Exception as e:
        print(f"❌ 동영상 생성 오류: {e}")
        return jsonify({"error": str(e)}), 500
