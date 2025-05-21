import React, {useState, useRef, useEffect} from 'react';
import '../styles/Page2.css';
import {FaPaperPlane} from 'react-icons/fa';

function Page2() {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversations, setConversations] = useState(() => {
        const saved = sessionStorage.getItem('page2Conversations');
        return saved ? JSON.parse(saved) : [];
    });
    const [playingIndex, setPlayingIndex] = useState(null);
    const progressRef = useRef(null);
    let currentAudio = null;

    const messagesEndRef = useRef(null);

    const playSequentialAudio = async (audioUrls, convIdx, totalDuration) => {
        if (!audioUrls || audioUrls.length === 0) return;

        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        setPlayingIndex(convIdx);
        const progressBar = document.querySelectorAll('.progress-bar')[convIdx];

        let idx = 0;
        const playNext = () => {
            if (idx >= audioUrls.length) {
                setPlayingIndex(null);
                if (progressBar) {
                    progressBar.style.transition = 'none';
                    progressBar.style.width = '0%';
                }
                return;
            }

            const audio = new Audio(audioUrls[idx]);

            if (idx === 0 && progressBar) {
                audio.onplaying = () => {
                    progressBar.style.transition = 'none';
                    progressBar.style.width = '0%';

                    requestAnimationFrame(() => {
                        progressBar.style.transition = `width ${totalDuration}s linear`;
                        progressBar.style.width = '100%';
                    });
                };
            }

            audio.onended = () => {
                idx++;
                playNext();
            };

            audio.play();
        };

        playNext();
    };

    useEffect(() => {
        sessionStorage.setItem('page2Conversations', JSON.stringify(conversations));
    }, [conversations]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const userText = input.trim();
        setInput('');
        setIsProcessing(true);

        const newEntry = {user: userText, poem: null, audioUrls: []};
        setConversations((prev) => [...prev, newEntry]);

        try {
            // 1. 감정 분석
            const emotionRes = await fetch('http://localhost:5000/emotion', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: userText})
            });
            const {emotion} = await emotionRes.json();

            // 2. 시 생성
            const poemRes = await fetch('http://localhost:5000/poem', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: userText, emotion})
            });
            const {poem} = await poemRes.json();

            // 3. TTS 음성 생성
            const ttsRes = await fetch('http://localhost:5000/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: poem, emotion})
            });
            const {output, duration} = await ttsRes.json();

            setConversations((prev) => prev.map((item, idx) => idx === prev.length - 1 ? {
                ...item,
                poem,
                audioUrls: Array.isArray(output) ? output.map(url => `http://localhost:5000${url}`) : [],
                totalDuration: duration
            } : item));
        } catch (error) {
            console.error('시 생성 또는 TTS 실패:', error);
            alert('시 생성 또는 TTS 생성 중 오류가 발생했습니다.');
            setConversations((prev) => prev.map((item, idx) => idx === prev.length - 1 ? {
                ...item, poem: '시 생성 실패', audioUrls: null
            } : item));
        } finally {
            setIsProcessing(false);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
            }, 100);
        }
    };

    const handleReset = () => {
        if (window.confirm('정말 초기화하시겠습니까?')) {
            setConversations([]);
            sessionStorage.removeItem('page2Conversations');
        }
    };

    return (<div className="page2-chat-container">
        <div className="page2-chat-header">
            <h2>시 생성 및 음성 합성</h2>
            <button className="page2-reset-btn" onClick={handleReset}>리셋</button>
        </div>

        <div className="page2-chat-messages">
            {conversations.map((conv, idx) => (<div key={idx} className="conversation-block">
                <div className="chat-message user-message">
                    <div className="bubble">{conv.user}</div>
                </div>
                <div className="chat-message bot-message">
                    <div className="bubble">
                        {conv.poem ? conv.poem : '시를 생성 중입니다...'}

                        {conv.audioUrls && conv.audioUrls.length > 0 && (<button
                            className={`overlay-button ${playingIndex === idx ? 'playing' : ''}`}
                            onClick={() => playSequentialAudio(conv.audioUrls, idx, conv.totalDuration)}
                        >
                            <div className="progress-bar" ref={progressRef}/>
                        </button>)}
                    </div>
                </div>
            </div>))}
            <div ref={messagesEndRef}/>
        </div>

        <form onSubmit={handleSubmit} className="page2-chat-input-form">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="일상어를 입력하세요"
                rows="2"
                required
                disabled={isProcessing}
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

export default Page2;
