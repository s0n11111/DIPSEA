from flask import Blueprint, request, jsonify
from services.emotion import analyze_emotion

emotion_bp = Blueprint('emotion', __name__)


@emotion_bp.route('/emotion', methods=['POST'])
def emotion():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No input text provided'}), 400

    text = data['text']
    emotion = analyze_emotion(text)
    return jsonify({'emotion': emotion})
