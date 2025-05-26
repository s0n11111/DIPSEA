import React, {useState, useEffect, useRef} from 'react';
import {
    Box, IconButton, TextField, Typography, Paper, CircularProgress,
} from '@mui/material';
import {ChatBubble, Refresh, Send} from '@mui/icons-material';
import '../styles/Page2.css'; // 외부 CSS 파일 import

function Page2() {
    const [input, setInput] = useState('');
    const [conversations, setConversations] = useState(() => {
        const saved = sessionStorage.getItem('page2Conversations');
        return saved ? JSON.parse(saved) : [];
    });
    const [playingIndex, setPlayingIndex] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const progressRef = useRef(null);

    const messagesEndRef = useRef(null);

    const playSequentialAudio = async (audioUrls, convIdx, totalDuration) => {
        if (!audioUrls || audioUrls.length === 0) return;

        setPlayingIndex(convIdx);
        const progressBar = document.querySelectorAll('.progress-bar')[convIdx];

        if (progressBar) {
            progressBar.style.width = '0%';
        }

        let idx = 0;
        let playedDuration = 0;

        const playNext = () => {
            if (idx >= audioUrls.length) {
                setPlayingIndex(null);
                if (progressBar) progressBar.style.width = '0%';
                return;
            }

            const audio = new Audio(audioUrls[idx]);

            audio.onplaying = () => {
                const startTime = Date.now();
                const thisDuration = audio.duration;

                const interval = setInterval(() => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const percent = Math.min((playedDuration + elapsed) / totalDuration, 1) * 100;
                    if (progressBar) progressBar.style.width = `${percent}%`;

                    if (elapsed >= thisDuration) {
                        clearInterval(interval);
                    }
                }, 50); // 50ms마다 갱신
            };

            audio.onended = () => {
                playedDuration += audio.duration;
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

        setIsProcessing(true);

        const userText = input.trim();
        setInput('');

        const newEntry = {user: userText, poem: null};
        setConversations((prev) => [...prev, newEntry]);

        try {
            // 1. 감정 분석 요청
            const emotionRes = await fetch('http://localhost:5000/emotion', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: userText}),
            });
            const {emotion} = await emotionRes.json();

            // 2. 감정 기반 시 생성 요청
            const poemRes = await fetch('http://localhost:5000/poem', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: userText, emotion}),
            });
            const {poem} = await poemRes.json();

            // 3. TTS 음성 생성 요청
            const ttsRes = await fetch('http://localhost:5000/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: poem, emotion}),
            });
            const {output, duration} = await ttsRes.json();

            // 결과 반영
            setConversations((prev) => prev.map((item, idx) => idx === prev.length - 1 ? {
                ...item, poem, audioUrls: output.map(url => `http://localhost:5000${url}`), totalDuration: duration
            } : item));
        } catch (err) {
            console.error('시 생성 실패:', err);
            alert('시 생성 중 오류가 발생했습니다.');
            setConversations((prev) => prev.map((item, idx) => idx === prev.length - 1 ? {
                ...item, poem: '⚠️ 시 생성 실패'
            } : item));
        }

        setIsProcessing(false);
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
        }, 100);
    };

    const handleReset = () => {
        if (window.confirm('정말 초기화하시겠습니까?')) {
            setConversations([]);
            sessionStorage.removeItem('page2Conversations');
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'auto'});
    }, []);

    return (<Box className="page2-container">
        <Box className="page2-top-toolbar">
            <Box className="page2-toolbar-left">
                <ChatBubble sx={{fontSize: 15}}/>
                <Typography variant="subtitle1" fontSize={14}>시 생성</Typography>
            </Box>
            <IconButton onClick={handleReset} className="page2-reset-button">
                <Refresh fontSize="small"/>
            </IconButton>
        </Box>

        <Box className="page2-messages-container">
            <Box className="page2-messages-inner">
                {conversations.map((conv, idx) => (<Box key={idx} className="page2-message-block">
                    <Box className="page2-user-message">
                        <Paper elevation={0} className="page2-message-paper-user">
                            <Typography className="page2-message-text">{conv.user}</Typography>
                        </Paper>
                    </Box>
                    <Box className="page2-response-message">
                        {conv.poem ? (<Paper elevation={0} className="page2-message-paper-bot">
                            <Typography className="page2-message-text">{conv.poem}</Typography>

                            {conv.audioUrls && conv.audioUrls.length > 0 && (<Box className="overlay-wrapper">
                                <button
                                    className={`page2-overlay-button ${playingIndex === idx ? 'playing' : ''}`}
                                    onClick={() => playSequentialAudio(conv.audioUrls, idx, conv.totalDuration)}
                                >
                                    <div className="progress-bar" ref={progressRef}/>
                                </button>
                            </Box>)}
                        </Paper>) : (<Box className="page2-loading-box">
                            <CircularProgress size={36} sx={{color: '#e5d9fc'}}/>
                        </Box>)}
                    </Box>
                </Box>))}
                <div ref={messagesEndRef}/>
            </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit} className="page2-input-box">
            <TextField
                variant="standard"
                placeholder="일상어를 입력하세요"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                multiline
                maxRows={4}
                fullWidth
                InputProps={{disableUnderline: true}}
                className="page2-input-text"
            />
            <IconButton type="submit" disabled={isProcessing}>
                <Send fontSize="small" sx={{color: input.trim() ? '#7c3aed' : '#f9efff'}}/>
            </IconButton>
        </Box>
    </Box>);
}

export default Page2;