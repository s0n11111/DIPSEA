import React, {useState, useEffect, useRef} from 'react';
import '../styles/Page3.css';
import Recorder from 'recorder-js';
import {
    Box, IconButton, Typography, Paper, Button, CircularProgress,
} from '@mui/material';
import {Mic, Refresh, ExpandMore} from '@mui/icons-material';

function Page3() {
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('page3Messages');
        return saved ? JSON.parse(saved) : [];
    });

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(30);

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
            // 1. STT 변환
            const sttRes = await fetch('http://localhost:5000/stt', {
                method: 'POST', body: formData,
            });
            const {transcript} = await sttRes.json();
            console.log(transcript);

            // 2. 감정 분석
            const emotionRes = await fetch('http://localhost:5000/emotion', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: transcript}),
            });
            const {emotion} = await emotionRes.json();
            console.log(emotion)

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
            const ttsData = await ttsRes.json();
            const audioPaths = ttsData.output;  // 리스트
            const prompts = poem
                .split('\n')
                .map(line => line.trim())
                .filter(line => line !== '');

            // 5. 영상 추천
            const videoRes = await fetch('http://localhost:5000/video', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompts: prompts.join('\n'), audio_path: audioPaths}),
            });
            const {video_url} = await videoRes.json();

            // 메시지 추가
            setMessages((prev) => [...prev, {
                user: transcript, poem: poem || '⚠️ 시 생성 실패', videoUrl: video_url || null, showResult: true,
            },]);
        } catch (err) {
            console.error(err);
            alert('전체 생성 중 오류가 발생했습니다.');
        } finally {
            stopCountdown();
            setIsProcessing(false);
        }
    };

    const toggleVoiceRecording = async () => {
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

    const toggleResult = (index) => {
        setMessages((prev) => prev.map((msg, i) => i === index ? {...msg, showResult: !msg.showResult} : msg));
    };

    const handleReset = () => {
        if (window.confirm('정말 초기화하시겠습니까?')) {
            setMessages([]);
            sessionStorage.removeItem('page3Messages');
        }
    };

    return (<Box className="page3-container">
        <Box className="page3-top-toolbar">
            <Box className="page3-toolbar-left">
                <Mic fontSize="small"/>
                <Typography variant="subtitle1" fontSize={14}>음성 변환</Typography>
            </Box>
            <IconButton onClick={handleReset} className="page3-reset-button">
                <Refresh fontSize="small"/>
            </IconButton>
        </Box>

        <Box className="page3-messages-container">
            <Box className="page3-messages-inner">
                {messages.map((msg, idx) => (<Box key={idx} className="page3-message-block">
                    <Paper elevation={0} className="page3-message-paper">
                        <Typography className="page3-message-text">{msg.user}</Typography>
                    </Paper>
                    <Box className="page3-response-message">
                        <Paper elevation={0} className="page3-message-paper-bot">
                            <Typography className="page3-message-text">{msg.poem}</Typography>
                        </Paper>
                    </Box>
                    {msg.showResult && msg.videoUrl && (<Box className="page3-video-container">
                        <video
                            controls
                            style={{borderRadius: '12px', maxWidth: '100%'}}
                        >
                            <source src={`http://localhost:5000${msg.videoUrl}?t=${Date.now()}`} type="video/mp4"/>
                            브라우저가 video 태그를 지원하지 않습니다.
                        </video>
                    </Box>)}
                    <Box className="page3-toggle-button">
                        <IconButton size="small" onClick={() => toggleResult(idx)} style={{
                            transform: msg.showResult ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s',
                            color: '#555',
                        }}>
                            <ExpandMore fontSize="small"/>
                        </IconButton>
                    </Box>
                </Box>))}
                {isProcessing && (<Box className="page3-loading-container">
                    <CircularProgress size={64} sx={{color: '#e5d9fc'}}/>
                </Box>)}
                <div ref={messagesEndRef}/>
            </Box>
        </Box>

        <Box className="page3-record-button-container">
            <Button
                onClick={toggleVoiceRecording}
                variant="contained"
                className="page3-record-button"
                color={isRecording ? 'error' : 'primary'}
                disabled={isProcessing}
            >
                {isRecording && (<div
                    className="progress-overlay"
                    style={{width: `${(progress / 30) * 100}%`}}
                />)}
                <span className="page3-mic-btn-text">
              {isProcessing ? '⏳ 생성 중' : isRecording ? '🛑 종료' : '🎤 말하기'}
            </span>
            </Button>
        </Box>
    </Box>);
}

export default Page3;
