from flask import Blueprint, request, jsonify
from services.video import generate_video

video_bp = Blueprint("video", __name__)


@video_bp.route("/video", methods=["POST"])
def handle_generate_video():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    text = data.get("text")
    emotion = data.get("emotion")

    if not text or not emotion:
        return jsonify({"error": "Both 'text' and 'emotion' are required"}), 400

    try:
        # 영상 생성 (더미)
        video_url = generate_video(text, emotion)

        return jsonify({
            "video_url": video_url
        })

    except Exception as e:
        return jsonify({"error": f"비디오 생성 실패: {str(e)}"}), 500
