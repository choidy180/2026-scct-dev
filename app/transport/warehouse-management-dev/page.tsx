'use client';

import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// =============================================================================
// 0. GLOBAL STYLE & THEME (Clean White & Intuitive)
// =============================================================================

const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
    background-color: #F5F7FA; /* 더 밝고 산뜻한 쿨 그레이 */
    color: #1A202C;
    overflow: hidden;
  }
  * { box-sizing: border-box; }
  
  /* 커스텀 스크롤바 */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
`;

// =============================================================================
// 1. DATA DEFINITIONS
// =============================================================================

const JIG_1_L = ['GJ01', 'GJ03', 'GJ05', 'GJ07', 'GJ09', 'GJ11', 'GJ13', 'GJ15', 'GJ17'];
const JIG_1_R = ['GJ19', 'GJ21', 'GJ23', 'GJ25', 'GJ27', 'GJ29', 'GJ31'];
const JIG_BTM = ['GJ33', 'GJ35', 'GJ37', 'GJ39', 'GJ41', 'GJ43', 'GJ45', 'GJ47', 'GJ49', 'GJ51', 'GJ53', 'GJ55', 'GJ57', 'GJ59'];

const GF_LEFT_COL = ['24','18','12','06'];
const GF_RIGHT_COL = ['23','17','11','05'];
const GF_GRID = [
  ['22','21','20','19'], ['16','15','14','13'], ['10','09','08','07'], ['04','03','02','01']
];

const GA_TOP_1 = ['10','09','08','07','06','05','04','03','02','01'];
const GA_TOP_2 = ['20','19','18','17','16','15','14','13','12','11'];
const GA_TOP_VALS: Record<string, string> = { '09':'5606', '08':'5606', '07':'5606', '06':'5606', '05':'1919', '19':'5606', '18':'5606', '17':'5606', '16':'5606', '15':'5606', '14':'5606' };

const GA_ROWS = [
  { l:['30','29','28'], r:['27','26','25','24','23','22','21'], v:{'25':'5603','24':'5603','23':'5603','22':'7903'} },
  { l:['40','39','38'], r:['37','36','35','34','33','32','31'], v:{} },
  { l:['50','49','48'], r:['47','46','45','44','43','42','41'], v:{} },
  { l:['60','59','58'], r:['57','56','55','54','53','52','51'], v:{'54':'5603','53':'5603','52':'5603'} },
  { l:['70','69','68'], r:['67','66','65','64','63','62','61'], v:{'64':'5603','63':'5603','62':'1924'} }
];

const GB_34_L = ['34','33','32'];
const GB_34_R = ['31','30','29','28','27','26','25','24','23','22','21','20','19','18'];
const GB_17_L = ['17','16','15'];
const GB_17_R = ['14','13','12','11','10','09','08','07','06','05','04','03','02','01'];
const GB_VALS: Record<string, string> = { '28':'3803', '26':'6917', '25':'6917', '24':'6917', '23':'6917', '11':'3803', '09':'6917', '08':'6917', '07':'6917', '06':'6917' };

const GC_L_TOP = ['26','25','24','23','22','21','20','19','18'];
const GC_L_BTM = ['13','12','11','10','09','08','07','06','05'];
const GC_R_TOP = ['17','16','15','14'];
const GC_R_BTM = ['04','03','02','01'];
const GC_VALS: Record<string, string> = { '11':'4709', '05':'5501', '15':'7901', '04':'6906', '02':'6726' };

const GE_L = ['28'];
const GE_BODY = [{l:'27',r:'26'}, {l:'25',r:'24'}, {l:'23',r:'22'}];
const GE_GRID = [
  ['21','20','19'],['18','17','16'],['15','14','13'],['12','11','10'],['09','08','07'],['06','05','04']
];

const GD_STRIP = [
  {l:'45',r:'44'}, {l:'43',r:'42'}, {l:'41',r:'40'}, {l:'39',r:'38'}, {l:'37',r:'36'}, {l:'35',r:'34'}, {l:'33',r:'32'}, {l:'31',r:'30'}, {l:'29',r:'28'}
];
const GD_GRID_H = ['GE03','GE02','GE01'];
const GD_GRID = [
  ['27','26','25'],['24','23','22'],['21','20','19'],['18','17','16'],['15','14','13'],['12','11','10'],['09','08','07'],['06','05','04'],['03','02','01']
];

const INVENTORY = [
  { code: 'ADC30047501', qty: 318 }, { code: 'AGF04075606', qty: 182 }, { code: 'AGF04075603', qty: 180 },
  { code: 'ADC30006917', qty: 154 }, { code: 'ACQ30707903', qty: 93 }, { code: 'ACQ30707901', qty: 62 },
  { code: 'ADC30021002', qty: 30 }, { code: 'ADC30003803', qty: 18 }, { code: 'ADC75566732', qty: 5 },
  { code: 'ADC75566726', qty: 4 }, { code: 'ADC30035501', qty: 3 }, { code: 'ADC30024709', qty: 2 }
];

const STATS = [
  { name: 'GA', total: 70, used: 23 },
  { name: 'GB', total: 34, used: 8 },
  { name: 'GC', total: 26, used: 6 },
  { name: 'GD', total: 50, used: 4 },
  { name: 'GE', total: 28, used: 18 },
  { name: 'GF', total: 24, used: 0 },
];

// =============================================================================
// 2. STYLED COMPONENTS (Clean & Intuitive)
// =============================================================================

// *** Widths (FHD fit) ***
const W_JIG = '58px';
const W_NARROW = '48px';
const W_WIDE = '96px';
const CELL_HEIGHT = '36px';

const Layout = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  padding: 20px;
  gap: 20px;
  background-color: #F5F7FA;
`;

// --- SIDE PANELS (White Theme Cards) ---
const Panel = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border: 1px solid #EDF2F7;
`;

const LeftPanel = styled(Panel)` width: 260px; `;
const RightPanel = styled(Panel)` width: 260px; `;

const Header = styled.div`
  padding: 18px 20px;
  font-size: 16px;
  font-weight: 800;
  color: #2D3748;
  border-bottom: 1px solid #EDF2F7;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// --- CENTER MAP (No Box, Just Layout) ---
const MapCanvas = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 10px;
  overflow: hidden; /* No Scroll */
`;

const MapContent = styled.div`
  display: flex;
  gap: 40px;
  /* Scaled slightly to ensure no scroll on smaller FHD headers/footers */
  transform-origin: top center;
  @media (max-height: 1000px) { transform: scale(0.95); }
`;

const ColLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  width: fit-content;
`;

const ColRight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding-top: 5px;
`;

// --- GRID STYLES (Border Collapse Logic) ---
const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: fit-content;
  /* Outer Border (Top/Left) */
  border-top: 1px solid #A0AEC0;
  border-left: 1px solid #A0AEC0;
  background-color: white;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
`;

const Row = styled.div`
  display: flex;
`;

const CellBox = styled.div<{ w: string }>`
  width: ${props => props.w};
  height: ${CELL_HEIGHT};
  display: flex;
  flex-direction: column;
  /* Inner Border (Bottom/Right) */
  border-right: 1px solid #A0AEC0;
  border-bottom: 1px solid #A0AEC0;
  background-color: white;
`;

const CellHeader = styled.div`
  height: 14px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #4A5568;
  background-color: #EDF2F7; /* Light Gray Header Background */
  border-bottom: 1px solid #E2E8F0;
`;

// FIX: Used transient prop $active to prevent prop leakage to DOM
const CellValue = styled.div<{ $active?: boolean }>`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  /* Green for Active, White for Empty */
  background-color: ${props => props.$active ? '#48BB78' : 'white'};
  color: ${props => props.$active ? 'white' : 'transparent'};
  transition: background-color 0.2s;
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #718096;
  margin-bottom: 5px;
  margin-left: 2px;
`;

// --- INTERACTIVE CARDS (Sidebar Items) ---
const StatusCard = styled.div`
  padding: 12px 15px;
  border-bottom: 1px solid #F7FAFC;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #F7FAFC;
  }
`;

const StatLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #2D3748;
`;

const ProgressBarBg = styled.div`
  width: 100%;
  height: 6px;
  background-color: #EDF2F7;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ percent: number }>`
  width: ${props => props.percent}%;
  height: 100%;
  background-color: ${props => props.percent > 80 ? '#F6AD55' : '#48BB78'};
  border-radius: 3px;
`;

const InvCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #EDF2F7;
  transition: background 0.2s;
  
  &:hover {
    background-color: #F0FFF4; /* Light Green Tint on Hover */
  }
`;

const InvCode = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #4A5568;
`;

const InvQty = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: #2F855A;
  background: #F0FFF4;
  padding: 2px 8px;
  border-radius: 10px;
`;

// =============================================================================
// 3. COMPONENTS
// =============================================================================

const Cell = ({ id, val, w }: any) => (
  <CellBox w={w}>
    <CellHeader>{id}</CellHeader>
    <CellValue $active={!!val}>{val}</CellValue>
  </CellBox>
);

const JigStrip = ({ ids }: { ids: string[] }) => (
  <Row>
    {ids.map(id => <Cell key={id} id={id} w={W_JIG} />)}
  </Row>
);

export default function FinalDashboard() {
  const totalCap = STATS.reduce((a,b)=>a+b.total,0);
  const totalUsed = STATS.reduce((a,b)=>a+b.used,0);
  const totalPercent = Math.round((totalUsed / totalCap) * 100);

  return (
    <>
      <GlobalStyle />
      <Layout>
        
        {/* LEFT: STATUS */}
        <LeftPanel>
          <Header>구역별 가동 현황</Header>
          <div style={{overflowY:'auto', flex:1, padding:'5px 0'}}>
            {STATS.map(s => {
              const pct = Math.round((s.used / s.total) * 100);
              return (
                <StatusCard key={s.name}>
                  <StatLabelRow>
                    <span>{s.name} 구역</span>
                    <span style={{color:'#718096'}}>{s.used} / {s.total} ({pct}%)</span>
                  </StatLabelRow>
                  <ProgressBarBg>
                    <ProgressBarFill percent={pct} />
                  </ProgressBarBg>
                </StatusCard>
              );
            })}
          </div>
          <div style={{padding:'20px', background:'#F9FAFB', borderTop:'1px solid #EDF2F7'}}>
             <div style={{fontSize:'12px', color:'#718096', marginBottom:'5px'}}>전체 가동률</div>
             <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
                <div style={{fontSize:'24px', fontWeight:'800', color:'#2D3748'}}>{totalPercent}%</div>
                <div style={{fontSize:'13px', fontWeight:'600', color:'#48BB78'}}>정상 운영 중</div>
             </div>
          </div>
        </LeftPanel>

        {/* CENTER: MAP */}
        <MapCanvas>
          <MapContent>
            
            {/* === LEFT COLUMN === */}
            <ColLeft>
              
              {/* JIG ZONE */}
              <div>
                <SectionTitle>JIG ZONE</SectionTitle>
                <div style={{display:'flex', gap:'20px', alignItems:'flex-end'}}>
                   <GridContainer>
                      <JigStrip ids={JIG_1_L} />
                      <JigStrip ids={JIG_1_L} />
                   </GridContainer>
                   <GridContainer>
                      <JigStrip ids={JIG_1_R} />
                      <JigStrip ids={JIG_1_R} />
                   </GridContainer>
                </div>
                <div style={{marginTop:'10px', marginLeft:'60px'}}>
                   <GridContainer>
                      <JigStrip ids={JIG_BTM} />
                      <JigStrip ids={JIG_BTM} />
                   </GridContainer>
                </div>
              </div>

              {/* GA TOP */}
              <div>
                 <SectionTitle>GA</SectionTitle>
                 <GridContainer>
                    <Row>
                       {GA_TOP_1.slice(0,3).map((n) => <Cell key={n} id={`GA${n}`} w={W_NARROW} val={GA_TOP_VALS[n]} />)}
                       {GA_TOP_1.slice(3).map((n) => <Cell key={n} id={`GA${n}`} w={W_WIDE} val={GA_TOP_VALS[n]} />)}
                    </Row>
                    <Row>
                       {GA_TOP_2.slice(0,3).map((n) => <Cell key={n} id={`GA${n}`} w={W_NARROW} val={GA_TOP_VALS[n]} />)}
                       {GA_TOP_2.slice(3).map((n) => <Cell key={n} id={`GA${n}`} w={W_WIDE} val={GA_TOP_VALS[n]} />)}
                    </Row>
                 </GridContainer>
              </div>

              {/* MAIN RACK (GA/GB) */}
              <div>
                 <SectionTitle>GA / GB</SectionTitle>
                 <GridContainer>
                    {/* GA Rows */}
                    {GA_ROWS.map((row, i) => (
                        <Row key={i}>
                            {row.l.map(n => <Cell key={n} id={`GA${n}`} w={W_NARROW} val={(row.v as any)[n]} />)}
                            {row.r.map(n => <Cell key={n} id={`GA${n}`} w={W_WIDE} val={(row.v as any)[n]} />)}
                        </Row>
                    ))}
                    {/* Divider visual via thick border on next row */}
                    {/* GB Rows */}
                    <Row>
                        {GB_34_L.map(n => <Cell key={n} id={`GB${n}`} w={W_NARROW} val={GB_VALS[n]} />)}
                        {GB_34_R.map(n => <Cell key={n} id={`GB${n}`} w={W_NARROW} val={GB_VALS[n]} />)}
                    </Row>
                    <Row>
                        {GB_17_L.map(n => <Cell key={n} id={`GB${n}`} w={W_NARROW} val={GB_VALS[n]} />)}
                        {GB_17_R.map(n => <Cell key={n} id={`GB${n}`} w={W_NARROW} val={GB_VALS[n]} />)}
                    </Row>
                 </GridContainer>
              </div>

              {/* GC */}
              <div>
                 <SectionTitle>GC</SectionTitle>
                 <div style={{display:'flex', gap:'20px'}}>
                    <GridContainer>
                        <Row>{GC_L_TOP.map(n => <Cell key={n} id={`GC${n}`} w={W_NARROW} />)}</Row>
                        <Row>{GC_L_BTM.map(n => <Cell key={n} id={`GC${n}`} w={W_NARROW} val={GC_VALS[n]} />)}</Row>
                    </GridContainer>
                    <GridContainer>
                        <Row>{GC_R_TOP.map(n => <Cell key={n} id={`GC${n}`} w={W_NARROW} val={GC_VALS[n]} />)}</Row>
                        <Row>{GC_R_BTM.map(n => <Cell key={n} id={`GC${n}`} w={W_NARROW} val={GC_VALS[n]} />)}</Row>
                    </GridContainer>
                 </div>
              </div>

            </ColLeft>

            {/* === RIGHT COLUMN === */}
            <ColRight>
               
               {/* GF */}
               <div>
                  <SectionTitle>GF</SectionTitle>
                  <div style={{display:'flex', gap:'15px'}}>
                      <GridContainer>
                          <Row>
                              <div style={{display:'flex', flexDirection:'column'}}>
                                 {GF_LEFT_COL.map(n => <Cell key={n} id={`GF${n}`} w={W_NARROW} />)}
                              </div>
                              <div style={{display:'flex', flexDirection:'column'}}>
                                 {GF_RIGHT_COL.map(n => <Cell key={n} id={`GF${n}`} w={W_NARROW} />)}
                              </div>
                          </Row>
                      </GridContainer>
                      <GridContainer>
                          {GF_GRID.map((row, i) => (
                              <Row key={i}>
                                  {row.map(n => <Cell key={n} id={`GF${n}`} w={W_NARROW} val={['22','21','20','17'].includes(n)?'7501':undefined} />)}
                              </Row>
                          ))}
                      </GridContainer>
                  </div>
               </div>

               {/* CLUSTER: GD (Left) + GE (Right) */}
               <div>
                   <SectionTitle>GE / GD</SectionTitle>
                   <div style={{display:'flex', gap:'20px'}}>
                       {/* Left Sub-Col: GE28 + GD Strip */}
                       <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
                           <GridContainer style={{marginRight: W_NARROW, marginBottom:'10px'}}>
                               <Cell id={`GE${GE_L[0]}`} w={W_NARROW} />
                           </GridContainer>
                           <GridContainer style={{marginBottom:'20px'}}>
                               {GE_BODY.map((p,i) => (
                                   <Row key={i}>
                                       <Cell id={`GE${p.l}`} w={W_NARROW} />
                                       <Cell id={`GE${p.r}`} w={W_NARROW} />
                                   </Row>
                               ))}
                           </GridContainer>

                           {/* GD Strip */}
                           <GridContainer>
                               {GD_STRIP.map((p,i) => (
                                   <Row key={i}>
                                       <Cell id={`GD${p.l}`} w={W_NARROW} val={['45','43','41','39'].includes(p.l) ? (p.l==='39'?'3804':'1002') : undefined} />
                                       <Cell id={`GD${p.r}`} w={W_NARROW} val={p.r==='42'?'6732':undefined} />
                                   </Row>
                               ))}
                           </GridContainer>
                       </div>

                       {/* Right Sub-Col: GE Grid + GD Grid */}
                       <div style={{display:'flex', flexDirection:'column'}}>
                           <div style={{height:'40px'}}></div> {/* Spacer */}
                           
                           {/* GE Grid */}
                           <GridContainer style={{marginBottom:'20px'}}>
                               {GE_GRID.map((row,i) => (
                                   <Row key={i}>
                                       {row.map(n => <Cell key={n} id={`GE${n}`} w={W_NARROW} val="7501" />)}
                                   </Row>
                               ))}
                           </GridContainer>

                           {/* GD Grid */}
                           <GridContainer>
                               <Row>{GD_GRID_H.map(id => <Cell key={id} id={id} w={W_NARROW} val="7501" />)}</Row>
                               {GD_GRID.map((row,i) => (
                                   <Row key={i}>
                                       {row.map(n => <Cell key={n} id={`GD${n}`} w={W_NARROW} />)}
                                   </Row>
                               ))}
                           </GridContainer>
                       </div>
                   </div>
               </div>

            </ColRight>

          </MapContent>
        </MapCanvas>

        {/* RIGHT: INVENTORY */}
        <RightPanel>
          <Header>
             실시간 재고
             <span style={{fontSize:'12px', background:'#C6F6D5', color:'#22543D', padding:'2px 8px', borderRadius:'12px'}}>Live</span>
          </Header>
          <div style={{overflowY:'auto', flex:1, padding:'5px 0'}}>
            {INVENTORY.map((item) => (
              <InvCard key={item.code}>
                <InvCode>{item.code}</InvCode>
                <InvQty>{item.qty}</InvQty>
              </InvCard>
            ))}
          </div>
        </RightPanel>

      </Layout>
    </>
  );
}