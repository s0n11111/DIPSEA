import torch
import torchaudio
import torchaudio.transforms as T
import re
import warnings
from transformers import pipeline, WhisperProcessor

warnings.filterwarnings("ignore", category=UserWarning, module="h5py")

MODEL_ROOT = "models/whisper_korean"
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
    print("✅ Whisper 모델 초기화 완료")
except Exception as e:
    print(f"❌ Whisper 초기화 실패: {e}")
    processor = None
    asr = None


# ─── STT 함수 (torchaudio 기반) ────────────────────────
def transcribe(audio_path: str) -> str:
    if asr is None:
        print("❌ STT 모델이 초기화되지 않았습니다.")
        return ""

    try:
        waveform, sr = torchaudio.load(audio_path)  # waveform shape: [1, N] or [2, N]
        if waveform.size(0) > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)  # 다채널 → 단일 채널

        if sr != 16000:
            print(f"⚠️ 현재 sr={sr}, 리샘플링 필요")
            resampler = T.Resample(orig_freq=sr, new_freq=16000)
            waveform = resampler(waveform)
            sr = 16000

        audio_np = waveform.squeeze().numpy()
        result = asr({"array": audio_np, "sampling_rate": sr})
        raw_text = result["text"]
        korean_only = re.sub(r"[^가-힣\s]", "", raw_text).strip()
        return korean_only

    except Exception as e:
        print(f"❌ STT 실패: {e}")
        return ""
