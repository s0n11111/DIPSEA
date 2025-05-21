import React, {useState, useEffect, useRef} from 'react';
import '../styles/Page1.css';
import {FaPaperPlane} from 'react-icons/fa';

function Page1() {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('page1Messages');
        return saved ? JSON.parse(saved) : [];
    });

    const messagesEndRef = useRef(null);

    useEffect(() => {
        sessionStorage.setItem('page1Messages', JSON.stringify(messages));
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const userText = input.trim();
        setInput('');
        setIsProcessing(true);

        const newMessage = {text: userText, videoUrl: '', showResult: true};
        setMessages(prev => [...prev, newMessage]);

        try {
            const emotionRes = await fetch('http://localhost:5000/emotion', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: userText})
            });
            const {emotion} = await emotionRes.json();
            console.log("감정 분석 결과:", emotion);

            const ttsRes = await fetch('http://localhost:5000/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: userText, emotion})
            });

            const ttsData = await ttsRes.json();
            if (!ttsData.output) {
                throw new Error("TTS 음성 생성 실패");
            }

            // TTS 음성 경로 확인
            const audioPath = ttsData.output;
            console.log("TTS 음성 파일 경로:", audioPath);

            const prompts = userText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line !== '');
            const videoRes = await fetch('http://localhost:5000/video', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
                    prompts: prompts, audio_path: audioPath
                })
            });

            const videoData = await videoRes.json();
            if (!videoData.video_url) {
                throw new Error("동영상 생성 실패");
            }

            // 동영상 URL
            const videoUrl = `http://localhost:5000${videoData.video_url}`;
            console.log("동영상 URL:", videoUrl);

            // 메시지 업데이트
            setMessages(prev => prev.map((msg, idx) => idx === prev.length - 1 ? {...msg, videoUrl: videoUrl} : msg));
        } catch (err) {
            console.error('생성 실패:', err);
            alert('영상 생성 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
            }, 100);
        }
    };

    const toggleResult = (index) => {
        setMessages((prev) => prev.map((msg, i) => i === index ? {...msg, showResult: !msg.showResult} : msg));
    };

    const handleReset = () => {
        if (window.confirm('정말 초기화하시겠습니까?')) {
            setMessages([]);
            sessionStorage.removeItem('page1Messages');
        }
    };

    return (<div className="page1-chat-container">
        <div className="page1-chat-header">
            <h2>동영상 생성</h2>
            <button className="page1-reset-btn" onClick={handleReset}>리셋</button>
        </div>

        <div className="page1-chat-messages">
            {messages.map((msg, idx) => (<div key={idx} className="page1-chat-message">
                <div style={{whiteSpace: 'pre-line'}}>
                    {msg.text}
                </div>
                {msg.showResult && msg.videoUrl && (<div className="page1-video-wrapper">
                    <iframe
                        width="100%"
                        height="300"
                        src={msg.videoUrl}
                        title="추천 동영상"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>)}
                <div className="page1-result-button-wrapper">
                    <button
                        className="page1-view-result-btn"
                        onClick={() => toggleResult(idx)}
                    >
                        {msg.showResult ? "결과 닫기" : "결과 보기"}
                    </button>
                </div>
            </div>))}
            <div ref={messagesEndRef}/>
        </div>

        <form onSubmit={handleSubmit} className="page1-chat-input-form">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="시를 입력하세요"
                    rows="2"
                    required
                />
            <button
                type="submit"
                disabled={isProcessing}
                className={`submit-button ${isProcessing ? 'processing' : ''}`}
            >
                <FaPaperPlane/>
            </button>
        </form>
    </div>);
}

export default Page1;
