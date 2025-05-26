import os
import uuid
import requests
import time
from datetime import datetime

url = "https://typecast.ai/api/speak"
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer __pltCRGJpCvbrys4jMnUYjsjTn4bbTFphQDC3ZLLEn5V'
}

emotion_mapping = {
    "기쁨": "happy-1",
    "분노": "angry-1",
    "억울": "tonedown-1",
    "슬픔": "sad-1",
    "무감정": "normal-1"
}


def create_audio_dir(base_dir, emotion):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    folder_name = f"{emotion}_{timestamp}"
    full_path = os.path.join(base_dir, folder_name)
    os.makedirs(full_path, exist_ok=True)
    return full_path  # 이 경로에 각 행에 대한 음성 저장


def get_actor_id():
    """ Typecast API를 통해 현재 사용 가능한 Actor ID를 가져옵니다. """
    try:
        response = requests.get("https://typecast.ai/api/actor", headers=headers)
        response_json = response.json()

        if response.status_code == 200 and 'result' in response_json:
            actors = response_json['result']
            if actors:
                actor_id = actors[0]['actor_id']
                print(f"✅ 사용 가능한 Actor ID: {actor_id}")
                return actor_id
            else:
                print("❌ 사용 가능한 Actor가 없습니다.")
                return None
        else:
            print(f"❌ Actor ID 조회 실패: {response_json}")
            return None
    except Exception as e:
        print(f"❌ Actor ID 조회 중 오류: {str(e)}")
        return None


def generate_audio(text: str, emotion: str, output_folder: str) -> list:
    tts_emotion = emotion_mapping.get(emotion, "normal-1")

    # Actor ID를 동적으로 가져오기
    actor_id = get_actor_id()
    if not actor_id:
        print("❌ 유효한 Actor ID를 가져오지 못했습니다.")
        return None

    lines = [line.strip() for line in text.split('\n') if line.strip()]
    audio_dir = create_audio_dir(output_folder, emotion)
    saved_files = []

    for idx, line in enumerate(lines):
        print(f"🎙️ [{idx + 1}/{len(lines)}] '{line}' → 음성 생성 중...")

        payload = {
            "actor_id": actor_id,
            "text": line,
            "lang": "auto",
            "tempo": 1,
            "volume": 100,
            "pitch": 0,
            "xapi_hd": True,
            "max_seconds": 60,
            "model_version": "latest",
            "xapi_audio_format": "wav",
            "emotion_tone_preset": tts_emotion
        }

        try:
            # 1. TTS API 요청
            response = requests.post(url, headers=headers, json=payload)
            response_json = response.json()

            # 2. 음성 URL 확인
            speak_url = response_json['result'].get('speak_v2_url', response_json['result'].get('speak_url'))
            print(f"🔗 상태 확인 URL: {speak_url}")

            # 3. 상태 확인 및 다운로드
            for _ in range(30):
                status_response = requests.get(speak_url, headers=headers)
                status_json = status_response.json()
                status = status_json['result'].get('status', 'pending')

                if status == 'done':
                    audio_download_url = status_json['result']['audio_download_url']
                    print(f"✅ 음성 파일 준비 완료: {audio_download_url}")

                    # 다운로드 요청
                    audio_data = requests.get(audio_download_url, headers=headers)
                    if audio_data.status_code == 200:
                        filename = f"{emotion}_{idx + 1}_{uuid.uuid4().hex[:8]}.wav"
                        filepath = os.path.join(audio_dir, filename)

                        with open(filepath, "wb") as f:
                            f.write(audio_data.content)
                        relative_path = f"/{os.path.basename(audio_dir)}/{filename}"
                        saved_files.append(relative_path)
                        print(f"✅ 음성 파일 저장 완료: {filepath}")
                    else:
                        print(f"❌ 음성 파일 다운로드 실패: {audio_data.status_code}")
                    break

                time.sleep(1)

        except Exception as e:
            print(f"❌ 음성 생성 중 오류: {str(e)}")

    return saved_files
