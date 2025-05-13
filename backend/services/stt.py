import librosa
import torch
import soundfile as sf
import numpy as np
import re
import warnings
from transformers import pipeline, WhisperProcessor

warnings.filterwarnings("ignore", category=UserWarning, module="h5py")

MODEL_ROOT = "services/whisper_korean"
DEVICE_ID = 0 if torch.cuda.is_available() else -1

# ─── Whisper 모델 초기화 ─────────────────────────────
try:
    processor = WhisperProcessor.from_pretrained(MODEL_ROOT)
    asr = pipeline(
        "automatic-speech-recognition",
        model=MODEL_ROOT,
        device=DEVICE_ID,
        chunk_length_s=30,
        stride_length_s=(5, 5),
    )
    gen_cfg = asr.model.generation_config
    gen_cfg.forced_decoder_ids = None
    gen_cfg.suppress_tokens = []
    gen_cfg.begin_suppress_tokens = []
    gen_cfg.decoder_start_token_id = processor.tokenizer.convert_tokens_to_ids("<|ko|>")
    print("✔️ Whisper 모델 초기화 완료")
except Exception as e:
    print(f"❌ Whisper 초기화 실패: {e}")
    processor = None
    asr = None

# ─── STT 함수 (soundfile + numpy 기반) ───────────────
def transcribe(audio_path: str) -> str:
    if asr is None:
        print("❌ STT 모델이 초기화되지 않았습니다.")
        return ""

    try:
        audio, sr = sf.read(audio_path)
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)  # 다채널 → 단일 채널
    except Exception as e:
        print(f"⚠️ soundfile 로딩 실패: {e}")
        return ""

    try:
        if sr != 16000:
            print(f"⚠️ 현재 sr={sr}, 리샘플링 필요")
            audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
            sr = 16000

        result = asr({"array": audio, "sampling_rate": sr})
        raw_text = result["text"]
        korean_only = re.sub(r"[^가-힣\s]", "", raw_text).strip()
        return korean_only

    except Exception as e:
        print(f"❌ STT 실패: {e}")
        return ""
