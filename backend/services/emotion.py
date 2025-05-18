import torch
from kiwipiepy import Kiwi
import pickle
import joblib
from keras_preprocessing.sequence import pad_sequences
from models.emotion.model_config import SimpleAttention, BiLSTMAttnModel

# ─── 토크나이저 및 라벨 인코더 로드 ────────────────────────────
tokenizer = pickle.load(open("models/emotion/tokenizer.pkl", "rb"))
le_main = joblib.load("models/emotion/label_encoder_main.pkl")
kiwi = Kiwi()

# ─── 설정 값 (model 저장 당시와 일치해야 함) ─────────────────────
vocab_size = 18061
embedding_dim = 100
hidden_dim = 128
num_classes = 5

# ─── 모델 로드 ───────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = BiLSTMAttnModel(vocab_size, embedding_dim, hidden_dim, num_classes)
model.load_state_dict(torch.load("models/emotion/main_bilstm_2.pth", map_location=device))
model.eval()

print("✅ 감정 분석 모델 로드 완료")


# ─── 감정 분석 함수 ────────────────────────────────
def analyze_emotion(text: str) -> str:
    tokens = [token.form for token in kiwi.tokenize(text)]
    seq = tokenizer.texts_to_sequences([" ".join(tokens)])
    padded = pad_sequences(seq, maxlen=50, padding='post')

    input_tensor = torch.tensor(padded, dtype=torch.long)
    with torch.no_grad():
        logits = model(input_tensor)
        pred_class = torch.argmax(logits, dim=-1).item()

    main_label = le_main.inverse_transform([pred_class])[0]
    return main_label
