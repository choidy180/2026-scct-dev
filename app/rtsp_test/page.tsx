'use client'; // 클라이언트 사이드에서만 동작하도록 설정

import { useEffect, useRef, useState } from 'react';

export default function RtspStream() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState({ text: '연결 준비 중...', color: '#aaa' });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const url = 'ws://192.168.2.147:8135';
        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            setStatus({ text: `연결 성공: ${url}`, color: 'lightgreen' });
        };

        ws.onmessage = (event) => {
            const blob = new Blob([event.data], { type: 'image/jpeg' });
            const imageUrl = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                if (canvas.width !== img.width) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
                ctx?.drawImage(img, 0, 0);
                URL.revokeObjectURL(imageUrl); // 메모리 해제
            };
            img.src = imageUrl;
        };

        ws.onerror = () => {
            setStatus({ text: '에러 발생: 연결을 확인하세요.', color: 'red' });
        };

        ws.onclose = () => {
            setStatus({ text: '연결 종료', color: 'orange' });
        };

        // 컴포넌트가 사라질 때 소켓 닫기 (메모리 누수 방지)
        return () => {
            ws.close();
        };
    }, []);

    return (
        <div style={{ textAlign: 'center', background: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
            <h2 style={{ color: 'white' }}>실시간 중계</h2>
            <div style={{ marginBottom: '10px', color: status.color }}>{status.text}</div>
            <canvas 
                ref={canvasRef} 
                style={{ width: '80%', background: '#000', border: '2px solid #555' }} 
            />
        </div>
    );
}