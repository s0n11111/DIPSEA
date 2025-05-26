import React, {useState, useEffect, useRef} from 'react';
import {
    Box, IconButton, TextField, Typography, Paper, CircularProgress,
} from '@mui/material';
import {Videocam, Refresh, Send, ExpandMore} from '@mui/icons-material';
import '../styles/Page1.css';

function Page1() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('page1Messages');
        return saved ? JSON.parse(saved) : [];
    });

    const messagesEndRef = useRef(null);


    useEffect(() => {
        sessionStorage.setItem('page1Messages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'auto'});
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const userText = input.trim();
        const newMessage = {
            text: userText, videoUrl: null, loading: true, showResult: true,
        };

        setMessages((prev) => [...prev, newMessage]);
        setInput('');

        try {
            // 1. 감정 분석
            const emotionRes = await fetch('http://localhost:5000/emotion', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: userText}),
            });
            const {emotion} = await emotionRes.json();

            // 2. TTS
            const ttsRes = await fetch('http://localhost:5000/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: userText, emotion}),
            });
            const ttsData = await ttsRes.json();
            const audioPaths = ttsData.output;  // 리스트
            const prompts = userText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line !== '');

            // 3. 영상 생성
            const videoRes = await fetch('http://localhost:5000/video', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
                    prompts: prompts.join('\n'), audio_path: audioPaths
                }),
            });
            const {video_url} = await videoRes.json();

            // 메시지 업데이트
            setMessages((prev) => prev.map((msg, idx) => idx === prev.length - 1 ? {
                ...msg, videoUrl: video_url, loading: false
            } : msg));
        } catch (error) {
            console.error('처리 중 오류 발생:', error);
            alert('영상 생성 중 오류가 발생했습니다.');
            setMessages((prev) => prev.map((msg, idx) => idx === prev.length - 1 ? {
                ...msg, videoUrl: null, loading: false
            } : msg));
        }

        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
        }, 100);
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

    return (<Box className="page1-container">
        <Box className="page1-top-toolbar">
            <Box className="page1-toolbar-left">
                <Videocam fontSize="small"/>
                <Typography variant="subtitle1" fontSize={14}>
                    동영상 생성
                </Typography>
            </Box>
            <IconButton onClick={handleReset} className="page1-reset-button">
                <Refresh fontSize="small"/>
            </IconButton>
        </Box>

        <Box className="page1-messages-container">
            <Box className="page1-messages-inner">
                {messages.map((msg, idx) => (<Box key={idx} className="page1-message-block">
                    <Box className="page1-user-message">
                        <Paper elevation={0} className="page1-message-paper">
                            <Typography className="page1-message-text">{msg.text}</Typography>
                        </Paper>
                    </Box>

                    {msg.showResult && (<Box className="page1-result-container">
                        <Box className="page1-video-wrapper">
                            {msg.loading ? (<CircularProgress size={64} sx={{color: '#e5d9fc'}}/>) : (<Box>
                                <video
                                    controls
                                    style={{borderRadius: '12px', maxWidth: '100%'}}
                                >
                                    <source src={`http://localhost:5000${msg.videoUrl}?t=${Date.now()}`} type="video/mp4"/>
                                    브라우저가 video 태그를 지원하지 않습니다.
                                </video>
                            </Box>)}

                        </Box>
                    </Box>)}

                    <Box className="page1-toggle-button">
                        <IconButton
                            size="small"
                            onClick={() => toggleResult(idx)}
                            style={{
                                transform: msg.showResult ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                                color: '#555',
                            }}
                        >
                            <ExpandMore fontSize="small"/>
                        </IconButton>
                    </Box>
                </Box>))}
                <div ref={messagesEndRef}/>
            </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit} className="page1-input-box">
            <TextField
                variant="standard"
                placeholder="시 입력"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                multiline
                maxRows={4}
                fullWidth
                InputProps={{disableUnderline: true}}
                className="page1-input-text"
            />
            <IconButton type="submit">
                <Send fontSize="small" sx={{color: input.trim() ? '#7c3aed' : '#f9efff'}}/>
            </IconButton>
        </Box>
    </Box>);
}

export default Page1;