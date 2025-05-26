import React from 'react';
import {useNavigate} from 'react-router-dom';
import '../styles/IntroPage.css';

function IntroPage() {
    const navigate = useNavigate();

    return (<div className="intro-container">
            <h1 className="intro-title">DIPSEA AI 콘텐츠 생성</h1>
            <p className="intro-sub">텍스트, 시, 음성을 입력하고 AI와 함께 창작을 시작하세요.</p>

            <div className="intro-section">
                <div className="intro-text-block">
                    <h2 className="intro-highlight">시에 어울리는는 감성 영상을 자동 생성</h2>
                    <p className="intro-description">
                        시를 입력하면 감각적인 분위기의 <strong>AI 영상</strong>을 자동으로 생성해주는 기능입니다.
                        감정을 시각화하고 싶은 창작자에게 추천합니다.
                    </p>
                    <button onClick={() => navigate('/page1')}>🎬 동영상 생성</button>
                </div>
                <div className="intro-image-block">
                    <img src="/assets/video.png" alt="동영상 생성 예시"/>
                </div>
            </div>

            <div className="intro-section">
                <div className="intro-text-block">
                    <h2 className="intro-highlight">일상어 한 줄이 감성 시로 변신</h2>
                    <p className="intro-description">
                        짧은 일상어를 감성적인 <strong>시</strong>로 바꿔주는 기능입니다.
                        나만의 감정을 문학적으로 표현하고 싶은 사용자에게 적합합니다.
                    </p>
                    <button onClick={() => navigate('/page2')}>📝 시 생성</button>
                </div>
                <div className="intro-image-block">
                    <img src="/assets/poem.png" alt="시 생성 예시"/>
                </div>
            </div>

            <div className="intro-section">
                <div className="intro-text-block">
                    <h2 className="intro-highlight">음성 입력으로 시각적 콘텐츠까지 자동으로</h2>
                    <p className="intro-description">
                        마이크를 눌러 말을 하면 해당 음성의 <strong>감정을 분석</strong>하고,
                        분석한 감정에 맞게 <strong>시를 생성</strong>하고,
                        감정을 담아 <strong>시를 낭독</strong>해주고,
                        이를 바탕으로 감성에 맞는 <strong>영상</strong>까지 생성해 줍니다.
                    </p>
                    <button onClick={() => navigate('/page3')}>🎤 음성 변환</button>
                </div>
                <div className="intro-image-block">
                    <img src="/assets/voice.png" alt="음성 변환 예시"/>
                </div>
            </div>
        </div>);
}

export default IntroPage;
