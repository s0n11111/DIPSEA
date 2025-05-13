from flask import Flask
from flask_cors import CORS
import os


def create_app():
    app = Flask(__name__)
    CORS(app)

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'static', 'uploads')
    app.config['OUTPUT_FOLDER'] = os.path.join(BASE_DIR, 'static', 'output')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

    # 블루프린트 등록
    from routes.stt_route import stt_bp
    from routes.emotion_route import emotion_bp
    from routes.poem_route import poem_bp
    from routes.tts_route import tts_bp
    from routes.video_route import video_bp

    app.register_blueprint(stt_bp)
    app.register_blueprint(emotion_bp)
    app.register_blueprint(poem_bp)
    app.register_blueprint(tts_bp)
    app.register_blueprint(video_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
