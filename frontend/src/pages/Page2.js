import React, {useState, useRef, useEffect} from 'react';
import './Page2.css';
import {FaPaperPlane} from 'react-icons/fa';

function Page2() {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversations, setConversations] = useState(() => {
        const saved = sessionStorage.getItem('page2Conversations');
        return saved ? JSON.parse(saved) : [];
    });

    const messagesEndRef = useRef(null);

    useEffect(() => {
        sessionStorage.setItem('page2Conversations', JSON.stringify(conversations));
    }, [conversations]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const userText = input.trim();
        setInput('');
        setIsProcessing(true);

        const newEntry = {user: userText, poem: null};
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

            setConversations((prev) => prev.map((item, idx) => idx === prev.length - 1 ? {
                ...item,
                poem: poem || '시 생성 실패'
            } : item));
        } catch (error) {
            console.error('시 생성 실패:', error);
            alert('시 생성 중 오류가 발생했습니다.');
            setConversations((prev) => prev.map((item, idx) => idx === prev.length - 1 ? {
                ...item,
                poem: '시 생성 실패'
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [conversations]);

    return (<div className="page2-chat-container">
        <div className="page2-chat-header">
            <h2>시 생성</h2>
            <button className="page2-reset-btn" onClick={handleReset}>리셋</button>
        </div>

        <div className="page2-chat-messages">
            {conversations.map((conv, idx) => (<div key={idx} className="conversation-block">
                <div className="chat-message user-message">
                    <div className="bubble">{conv.user}</div>
                </div>
                <div className="chat-message bot-message">
                    <div className="bubble">
                        {conv.poem ? (conv.poem) : (
                            <span style={{color: '#888', fontStyle: 'italic'}}>시를 생성 중입니다...</span>)}
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
