import React, {useState, useEffect, useRef} from 'react';
import './Page1.css';
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

        // 메시지 UI에 추가 (결과는 나중에 채움)
        const newMessage = {text: userText, videoUrl: '', showResult: true};
        setMessages(prev => [...prev, newMessage]);

        try {
            // 1. 감정 분석
            const emotionRes = await fetch('http://localhost:5000/emotion', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: userText})
            });
            const {emotion} = await emotionRes.json();

            // 2. TTS
            await fetch('http://localhost:5000/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: userText, emotion})
            });

            // 3. 영상 생성
            const videoRes = await fetch('http://localhost:5000/video', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: userText, emotion})
            });

            const {video_url} = await videoRes.json();

            setMessages(prev => prev.map((msg, idx) => idx === prev.length - 1 ? {...msg, videoUrl: video_url} : msg));
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
                <p>{msg.text}</p>

                {msg.showResult && msg.videoUrl && (<div className="page1-video-wrapper">
                    <iframe
                        width="100%"
                        height="300"
                        src={msg.videoUrl}
                        title="추천 동영상"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
