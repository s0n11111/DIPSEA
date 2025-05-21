from flask import Blueprint, request, jsonify, current_app
from services.tts import generate_audio
from pydub import AudioSegment
import os

tts_bp = Blueprint("tts", __name__)

def get_total_duration(base_dir, relative_paths):
    total = 0.0
    for rel_path in relative_paths:
        abs_path = os.path.join(base_dir, rel_path.lstrip("/"))
        audio = AudioSegment.from_file(abs_path)
        total += audio.duration_seconds
    return round(total, 2)


@tts_bp.route("/tts", methods=["POST"])
def handle_generate_audio():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    text = data.get("text")
    emotion = data.get("emotion")

    if not text or not emotion:
        return jsonify({"error": "Both 'text' and 'emotion' are required"}), 400

    try:
        output_path = generate_audio(text, emotion, current_app.config["AUDIO_FOLDER"])
        total_duration = get_total_duration(current_app.config["AUDIO_FOLDER"], output_path)
        if output_path:
            return jsonify({
                "output": [f"/static/output/audio{path}" for path in output_path],
                "duration": total_duration
            })
        else:
            return jsonify({"error": "TTS generation failed"}), 500
    except Exception as e:
        return jsonify({"error": f"TTS 실패: {str(e)}"}), 500
