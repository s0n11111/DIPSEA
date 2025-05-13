import os
import shutil
import uuid

def generate_audio(text: str, emotion: str, output_folder: str) -> str:
    # 더미용으로 오디오 파일 복사
    dummy_source = os.path.join(output_folder, "dummy_audio.wav")
    output_filename = f"{emotion}_{uuid.uuid4().hex[:8]}.wav"
    output_path = os.path.join(output_folder, output_filename)
    shutil.copy(dummy_source, output_path)
    return output_filename
