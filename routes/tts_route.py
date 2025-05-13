from flask import Blueprint, request, jsonify, current_app
from services.tts import generate_audio

tts_bp = Blueprint("tts", __name__)


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
        output_path = generate_audio(text, emotion, current_app.config["OUTPUT_FOLDER"])
        return jsonify({
            "output": f"/static/output/{output_path}"
        })
    except Exception as e:
        return jsonify({"error": f"TTS 실패: {str(e)}"}), 500
