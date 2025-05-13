from flask import Blueprint, request, jsonify
from services.poem import generate_poem

poem_bp = Blueprint("poem", __name__)


@poem_bp.route("/poem", methods=["POST"])
def handle_generate_poem():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    emotion = data.get("emotion")
    text = data.get("text")

    if not emotion or not text:
        return jsonify({"error": "Both 'emotion' and 'text' are required"}), 400

    try:
        poem = generate_poem(emotion, text)
        return jsonify({"poem": poem})
    except Exception as e:
        return jsonify({"error": f"Failed to generate poem: {str(e)}"}), 500