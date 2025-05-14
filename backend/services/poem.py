import sys
import torch
from transformers import AutoTokenizer
from models.exaone_merged.configuration_exaone import ExaoneConfig
from models.exaone_merged.modeling_exaone import ExaoneForCausalLM

# ─── 모델 로딩 ──────────────────────────────────────────────

MODEL_PATH = "models/exaone_merged"
sys.path.append(MODEL_PATH)

# 모델 및 토크나이저 초기화 (최초 1회만)
try:
    config = ExaoneConfig.from_pretrained(MODEL_PATH)

    model = ExaoneForCausalLM.from_pretrained(
        MODEL_PATH,
        config=config,
        torch_dtype=torch.float16,
        device_map="auto",
        local_files_only=True,
        trust_remote_code=True
    )

    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_PATH,
        trust_remote_code=True,
        local_files_only=True
    )

    print("✅ EXAONE 시 생성 모델 로드 성공")

except Exception as e:
    print(f"❌ 모델 로드 실패: {e}")
    model = None
    tokenizer = None

# ─── 감정 기반 시 생성 함수 ────────────────────────────────

def generate_poem(emotion: str, text: str) -> str:
    if model is None or tokenizer is None:
        return "⚠️ 모델이 초기화되지 않았습니다."

    prompt = f"### Instruction:\n사용자가 다음과 같은 상황에 처했어. {text}\n{emotion} 감정이 느껴지는 3줄 이상의 시를 써줘\n\n### Response:\n"

    input_ids = tokenizer(prompt, return_tensors="pt").input_ids.to(model.device)

    try:
        output = model.generate(
            input_ids,
            max_new_tokens=100,
            temperature=1.0,
            top_p=0.9,
            do_sample=True,
            repetition_penalty=1.2
        )

        result = tokenizer.decode(output[0], skip_special_tokens=True)
        poem = result.split("### Response:")[-1].strip()
        return poem

    except Exception as e:
        print(f"❌ 시 생성 실패: {e}")
        return "⚠️ 시 생성 실패"
