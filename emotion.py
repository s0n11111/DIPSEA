import numpy as np
from kiwipiepy import Kiwi
from keras_preprocessing.sequence import pad_sequences
from keras.models import load_model
import joblib
import pickle

# ─── 초기화 ────────────────────────────────────────
tokenizer = pickle.load(open("services/emotion/tokenizer.pkl", "rb"))
le_main = joblib.load("services/emotion/label_encoder_main.pkl")
model_main = load_model("services/emotion/main_bilstm_2.keras")
kiwi = Kiwi()

print("✅ 감정 분석 모델 로드 완료")


# ─── 감정 분석 함수 ─────────────────────────────────
def analyze_emotion(text: str) -> str:
    tokens = [token.form for token in kiwi.tokenize(text)]
    seq = tokenizer.texts_to_sequences([" ".join(tokens)])
    padded = pad_sequences(seq, maxlen=50, padding='post')

    main_pred = model_main.predict(padded, verbose=0)[0]

    main_label = le_main.inverse_transform([np.argmax(main_pred)])[0]

    return main_label
