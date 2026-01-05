'use client';

import React from 'react';
import styled from 'styled-components';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// --- Types & Interfaces ---

interface ChartData {
  name: string;
  합격: number;
  불량: number;
}

interface HistoryStatusProps {
  status: 'ok' | 'fail';
}

// --- Styled Components (White Theme) ---

const DashboardContainer = styled.div`
  width: 100vw;
  height: calc(100vh - 64px);
  background-color: #f1f5f9;
  color: #0f172a;
  padding: 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
  overflow: hidden;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  position: relative;
`;

const FullHeightCard = styled(Card)`
  height: 100%;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0;

  .badge {
    background-color: #3b82f6;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 700;
    margin-right: 10px;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
  }
`;

const ImageArea = styled.div`
  width: 100%;
  height: 200px;
  background-color: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  position: relative;
  border: 1px solid #cbd5e1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .label {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    color: #0f172a;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  align-items: center;

  span.label {
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
  }

  span.value {
    color: #0f172a;
    font-weight: 600;
    font-size: 1rem;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 20px;
  height: 100%;
  min-height: 0;

  .chart-area {
    flex: 2;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .history-area {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    padding: 15px;
    overflow-y: auto;

    h4 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 0.9rem;
      color: #64748b;
    }
  }
`;

const ScoreBoard = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 10px;

  div {
    background: #f1f5f9;
    padding: 8px 15px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #e2e8f0;

    .title { font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px; }
    .score { font-size: 1.1rem; font-weight: bold; }
    .score.pass { color: #059669; }
    .score.fail { color: #e11d48; }
  }
`;

const HistoryItem = styled.div<HistoryStatusProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.85rem;
  color: #334155;

  &:last-child { border-bottom: none; }

  .time { color: #94a3b8; margin-top: 2px; font-size: 0.8rem; }
  .status {
    width: 8px; height: 8px; border-radius: 50%;
    background: ${props => props.status === 'ok' ? '#10b981' : '#f43f5e'};
    box-shadow: 0 0 0 2px ${props => props.status === 'ok' ? '#d1fae5' : '#fee2e2'};
  }
`;

// --- Mock Data ---

const chartData: ChartData[] = [
  { name: '1번업체', 합격: 85, 불량: 15 },
  { name: '2번업체', 합격: 90, 불량: 10 },
  { name: '3번업체', 합격: 95, 불량: 5 },
  { name: '4번업체', 합격: 98, 불량: 2 },
];

// --- Component ---

export default function SmartFactoryDashboard() {
  return (
    <DashboardContainer>
      {/* --- Left Column: 차량 인식 (고정) --- */}
      <Column>
        <FullHeightCard>
          <CardHeader>
            <span className="badge">01</span>
            <h3>입고차량 인식</h3>
          </CardHeader>

          <ImageArea>
            <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', background: '#f1f5f9'}}>
              차량 사진 CCTV
            </div>
            <div className="label">📸 차량사진</div>
          </ImageArea>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#475569', marginBottom: '15px' }}>차량 정보</h4>
            <InfoRow>
              <span className="label">차량번호</span>
              <span className="value" style={{fontSize: '1.5rem', color: '#2563eb'}}>12우 1545</span>
            </InfoRow>
            <hr style={{borderColor: '#e2e8f0', margin: '20px 0'}}/>
            <InfoRow>
              <span className="label">공급업체</span>
              <span className="value">(주)퓨처로지스</span>
            </InfoRow>
            <InfoRow>
              <span className="label">도착시간</span>
              <span className="value">12:12</span>
            </InfoRow>
            <InfoRow>
              <span className="label">출차예정</span>
              <span className="value">13:12</span>
            </InfoRow>
            <InfoRow>
                <span className="label">운전자</span>
                <span className="value">김철수 기사님</span>
            </InfoRow>
          </div>

          <div style={{marginTop: 'auto', background:'#fff1f2', padding:'15px', borderRadius:'8px', border: '1px solid #fecdd3'}}>
             <p style={{margin:0, color:'#e11d48', fontSize:'0.9rem', fontWeight: 'bold'}}>⚠️ 특이사항</p>
             <p style={{margin:'5px 0 0 0', fontSize:'0.95rem', color: '#881337'}}>사전 입고 예약 확인됨.<br/>A게이트 진입 허가.</p>
          </div>
        </FullHeightCard>
      </Column>

      {/* --- Right Column --- */}
      <Column>
        {/* 상단: 자재 검수 화면 (남은 공간 모두 차지 -> flex: 1) */}
        <Card style={{ flex: '1', padding: 0, overflow: 'hidden' }}>
           <div style={{position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', alignItems: 'center'}}>
             <div style={{background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', marginRight:'10px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>Live</div>
             <h3 style={{color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', margin: 0}}>자재검수 화면</h3>
           </div>

           <ImageArea style={{height: '100%', width: '100%', margin: 0, border: 'none', background: '#334155', borderRadius: 0}}>
              <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#cbd5e1'}}>
                 [실시간 검수 카메라 화면 - 메인 뷰]
              </div>
              
              <div style={{position:'absolute', right:'20px', top:'20px', background:'rgba(255,255,255,0.95)', padding:'20px', borderRadius:'12px', fontSize:'0.9rem', color: '#334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}>
                 <div style={{fontWeight: 'bold', marginBottom: '10px', fontSize:'1rem'}}>📦 검사 항목</div>
                 <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>✅ 박스 규격: <span style={{color:'#059669', fontWeight:'bold'}}>완료</span></div>
                 <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>✅ 수량 확인: <span style={{color:'#059669', fontWeight:'bold'}}>완료</span></div>
                 <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>🔲 파손 여부: <span style={{color:'#2563eb', fontWeight:'bold'}}>검사중 (AI)</span></div>
                 <div style={{display:'flex', alignItems:'center', gap:'10px'}}>🔲 라벨 일치: <span style={{color:'#94a3b8'}}>대기</span></div>
              </div>
           </ImageArea>
        </Card>

        {/* 하단: 자재검수 현황 (높이 고정 -> height: 320px) */}
        <Card style={{ height: '320px', flexShrink: 0 }}>
          <CardHeader>
            <span className="badge">02</span>
            <h3>자재검수 통계 및 이력</h3>
            <div style={{marginLeft: 'auto', fontSize:'0.8rem', color:'#64748b', display: 'flex', alignItems: 'center', gap: '5px'}}>
                <span style={{width: 8, height: 8, background: '#ef4444', borderRadius: '50%'}}></span> 실시간 모니터링
            </div>
          </CardHeader>
          
          <StatsContainer>
            {/* 왼쪽: 차트 */}
            <div className="chart-area">
              <ScoreBoard>
                <div>
                  <span className="title">합격률</span>
                  <span className="score pass">98.5%</span>
                </div>
                <div>
                  <span className="title">불량률</span>
                  <span className="score fail">1.5%</span>
                </div>
                <div style={{flex:1, textAlign:'left', paddingLeft:'20px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <span className="title" style={{textAlign: 'left'}}>검수번호</span>
                    <span className="score" style={{color:'#334155', fontSize: '1rem'}}>AJQ121..</span>
                </div>
              </ScoreBoard>
              
              <div style={{ width: '100%', flex: 1 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} 
                        itemStyle={{color: '#1e293b'}}
                        cursor={{fill: 'rgba(0,0,0,0.03)'}}
                    />
                    <Bar dataKey="합격" fill="#10b981" barSize={30} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="불량" fill="#f43f5e" barSize={30} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 오른쪽: 이력 */}
            <div className="history-area">
              <h4>최근 검수 이력</h4>
              <HistoryItem status="ok">
                <div>
                  <div style={{fontWeight: 600}}>퓨처로지스</div>
                  <div className="time">10:30</div>
                </div>
                <div className="status"></div>
              </HistoryItem>
              <HistoryItem status="ok">
                <div>
                  <div style={{fontWeight: 600}}>글로벌테크</div>
                  <div className="time">10:45</div>
                </div>
                <div className="status"></div>
              </HistoryItem>
              <HistoryItem status="fail">
                <div>
                  <div style={{fontWeight: 600}}>에이치물산</div>
                  <div className="time">11:00</div>
                </div>
                <div className="status"></div>
              </HistoryItem>
              <HistoryItem status="ok">
                <div>
                  <div style={{fontWeight: 600}}>대성산업</div>
                  <div className="time">11:15</div>
                </div>
                <div className="status"></div>
              </HistoryItem>
            </div>
          </StatsContainer>
        </Card>
      </Column>
    </DashboardContainer>
  );
}