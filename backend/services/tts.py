import os
import uuid
import requests
import json
import time

url = "https://typecast.ai/api/speak"
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer __pltDcuY7zam2k4K29nZJZVBGMW3HUqCQy8C5NXwoHpj'
}

emotion_mapping = {
    "기쁨": "happy-1",
    "분노": "angry-1",
    "억울": "tonedown-1",
    "슬픔": "sad-1",
    "무감정": "normal-1"
}

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

def generate_audio(text: str, emotion: str, output_folder: str) -> str:
    tts_emotion = emotion_mapping.get(emotion, "normal-1")
    
    # Actor ID를 동적으로 가져오기
    actor_id = get_actor_id()
    if not actor_id:
        print("❌ 유효한 Actor ID를 가져오지 못했습니다.")
        return None

    payload = {
        "actor_id": actor_id,
        "text": text,
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
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print(f"Response Text: {response.text}")

        # 2. 음성 URL 확인
        speak_url = response_json['result'].get('speak_v2_url', response_json['result'].get('speak_url'))
        print(f"[+] 음성 파일 상태 URL: {speak_url}")

        # 3. 상태 확인 및 다운로드
        for _ in range(120):
            status_response = requests.get(speak_url, headers=headers)
            status_json = status_response.json()
            status = status_json['result'].get('status', 'pending')

            print(f"🔄 상태 확인: {status}")
            if status == 'done':
                audio_download_url = status_json['result']['audio_download_url']
                print(f"✅ 음성 파일 준비 완료: {audio_download_url}")

                # 다운로드 요청
                audio_data = requests.get(audio_download_url, headers=headers)
                if audio_data.status_code == 200:
                    output_filename = f"{emotion}_{uuid.uuid4().hex[:8]}.wav"
                    output_path = os.path.join(output_folder, output_filename)

                    with open(output_path, "wb") as f:
                        f.write(audio_data.content)
                    print(f"✅ 음성 파일 저장 완료: {output_path}")
                    return output_filename
                else:
                    print(f"❌ 음성 파일 다운로드 실패: {audio_data.status_code}")
                    return None

            time.sleep(1)

        print("❌ 음성 파일 준비 대기 시간 초과")
        return None

    except Exception as e:
        print(f"❌ 음성 생성 중 오류: {str(e)}")
        return None
