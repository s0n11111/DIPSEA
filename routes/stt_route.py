from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import uuid
from services.stt import transcribe  # 실제 서비스 로직 호출

stt_bp = Blueprint("stt", __name__)


@stt_bp.route("/stt", methods=["POST"])
def transcribe_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files["file"]
    filename = secure_filename(file.filename)
    file_id = str(uuid.uuid4())
    filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], f"{file_id}_{filename}")
    file.save(filepath)

    transcript = transcribe(filepath)

    return jsonify({
        "transcript": transcript,
        "filename": f"{file_id}_{filename}",
        "file_path": f"/static/uploads/{file_id}_{filename}"
    })
