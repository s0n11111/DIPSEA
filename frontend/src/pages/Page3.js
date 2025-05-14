import React, {useState, useEffect, useRef} from 'react';
import './Page3.css';
import Recorder from 'recorder-js';

function Page3() {
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('page3Messages');
        return saved ? JSON.parse(saved) : [];
    });

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState(null);
    const [progress, setProgress] = useState(30);

    const audioRef = useRef(null);
    const countdownRef = useRef(null);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const recorderRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        sessionStorage.setItem('page3Messages', JSON.stringify(messages));
    }, [messages]);

    const startCountdown = () => {
        setProgress(30);
        countdownRef.current = setInterval(() => {
            setProgress((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopCountdown = () => {
        clearInterval(countdownRef.current);
        setProgress(0);
    };

    const processAudioBlob = async (blob) => {
        setIsProcessing(true);

        const formData = new FormData();
        formData.append('file', blob, `recording_${Date.now()}.wav`);

        try {
            // 1. STT
            const sttRes = await fetch('http://localhost:5000/stt', {
                method: 'POST', body: formData,
            });
            const {transcript} = await sttRes.json();

            // 2. 감정 분석
            const emotionRes = await fetch('http://localhost:5000/emotion', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: transcript}),
            });
            const {emotion} = await emotionRes.json();

            // 3. 시 생성
            const poemRes = await fetch('http://localhost:5000/poem', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: transcript, emotion}),
            });
            const {poem} = await poemRes.json();

            // 4. TTS
            const ttsRes = await fetch('http://localhost:5000/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: poem, emotion}),
            });
            const {output} = await ttsRes.json();

            // 5. Video
            const videoRes = await fetch('http://localhost:5000/video', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: transcript, emotion}),
            });
            const {video_url} = await videoRes.json();

            const newMsg = {
                text: transcript,
                resultText: poem || '시 생성 실패',
                audioUrl: output ? `http://localhost:5000${output}` : null,
                recordedUrl: URL.createObjectURL(blob),
                videoUrl: video_url || null,
                showResult: true,
            };

            setMessages((prev) => [...prev, newMsg]);
        } catch (err) {
            console.error(err);
            alert('전체 생성 중 오류가 발생했습니다.');
        } finally {
            stopCountdown();
            setIsProcessing(false);
        }
    };

    const toggleVoiceRecognition = async () => {
        if (isRecording) {
            recorderRef.current.stop().then(async ({blob}) => {
                setIsRecording(false);
                await processAudioBlob(blob);
            });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            const recorder = new Recorder(audioContext);
            await recorder.init(stream);
            recorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            startCountdown();

            // 자동 종료 타이머 (30초 후)
            setTimeout(() => {
                if (isRecording) {
                    recorderRef.current.stop().then(async ({blob}) => {
                        setIsRecording(false);
                        await processAudioBlob(blob);
                    });
                }
            }, 30000);
        } catch (err) {
            alert('녹음 실패: ' + err.message);
        }
    };

    const handleAudio = (url, index) => {
        if (!url) return;

        if (speakingIndex === index && audioRef.current) {
            audioRef.current.pause();
            setSpeakingIndex(null);
            return;
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
        setSpeakingIndex(index);
        audio.onended = () => setSpeakingIndex(null);
    };

    const toggleResult = (index) => {
        setMessages((prev) => prev.map((msg, i) => i === index ? {...msg, showResult: !msg.showResult} : msg));
    };

    const handleReset = () => {
        if (window.confirm('정말 초기화하시겠습니까?')) {
            setMessages([]);
            sessionStorage.removeItem('page3Messages');
        }
    };

    return (<div className="page3-chat-container">
            <div className="page3-chat-header">
                <h2>음성 입력 분석</h2>
                <button className="page3-reset-btn" onClick={handleReset}>리셋</button>
            </div>

            <div className="page3-chat-messages">
                {messages.map((msg, idx) => (<div key={idx} className="page3-chat-message">
                        <p>{msg.text}</p>

                        <div className="page3-result-button-wrapper">
                            <button
                                className="page3-tts-btn"
                                onClick={() => handleAudio(msg.recordedUrl, idx)}
                                disabled={!msg.recordedUrl}
                            >
                                {speakingIndex === idx ? "🔊 중지" : "🔊 듣기"}
                            </button>

                            <button
                                className="page3-view-result-btn"
                                onClick={() => toggleResult(idx)}
                            >
                                {msg.showResult ? "결과 닫기" : "결과 보기"}
                            </button>
                        </div>

                        {msg.showResult && (<div>
                                <div className="page3-result-text" style={{whiteSpace: 'pre-line'}}>
                                    {msg.resultText}
                                </div>
                                {msg.audioUrl && (<audio controls src={msg.audioUrl}>
                                        브라우저가 오디오 재생을 지원하지 않습니다.
                                    </audio>)}
                                {msg.videoUrl && (<div className="page3-video-wrapper">
                                        <iframe
                                            width="100%"
                                            height="300"
                                            src={msg.videoUrl}
                                            title="추천 동영상"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>)}
                            </div>)}
                    </div>))}
                <div ref={messagesEndRef}/>
            </div>

            <div className="page3-voice-input-area">
                <div className="mic-wrapper">
                    <button
                        className={`page3-mic-btn ${isRecording ? 'recording' : ''}`}
                        onClick={toggleVoiceRecognition}
                        disabled={isProcessing}
                    >
                        {isRecording && (<div
                                className="progress-overlay"
                                style={{width: `${(progress / 30) * 100}%`}}
                            />)}
                        <span className="page3-mic-btn-text">
              {isProcessing ? '⏳ 생성 중' : isRecording ? '🛑 종료' : '🎤 말하기'}
            </span>
                    </button>
                </div>
            </div>
        </div>);
}

export default Page3;
