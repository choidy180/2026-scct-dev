"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiBell, FiSettings } from 'react-icons/fi';

// --- Types ---
export type SubMenuItemType = {
  label: string;
  href: string;
  detail: string;
};

export type MenuDataType = {
  description: string; 
  items: SubMenuItemType[];
};

// --- Data (기존 데이터 유지) ---
const subMenuData: Record<string, MenuDataType> = {
  "자재관리": {
    description: "입고부터 불량 선별까지,\nAI 비전 기술로 자재 흐름을 완벽하게 제어합니다.",
    items: [
      { label: "입고검수", href: "/material/inbound-inspection", detail: "입고된 자재의 수량 및 품질을 AI 비전으로 검사합니다." },
      { label: "자재창고", href: "/material/warehouse", detail: "창고 내 자재 위치 시각화 및 적재 효율 분석." },
      { label: "공정재고_GR5", href: "/production/smart-factory-dashboard", detail: "물리적 환경 변수 학습 및 설비 세팅 제안." },
    ]
  },
  "공정품질": {
    description: "미세한 오차도 허용하지 않는\n실시간 공정 품질 모니터링 시스템입니다.",
    items: [
      { label: "유리틈새검사", href: "/production/glass-gap-check", detail: "조립된 유리의 틈새 규격 정밀 측정." },
      { label: "발포액누설 검사", href: "/production/leak-detection", detail: "화학 용액 누설 감지 및 알림." },
      { label: "가스켓 이상 탐지", href: "/production/gasket-check", detail: "가스켓 부착 상태 검사." },
      { label: "필름부착확인", href: "/production/film-attachment", detail: "보호 필름 기포/부착 상태 확인." },
    ]
  },
  "공정설비": {
    description: "설비의 이상 징후를 사전에 포착하여\n중단 없는 생산 라인을 보장합니다.",
    items: [
      { label: "발포 품질 예측", href: "/production/line-monitoring", detail: "생산 라인 가동률 실시간 추적." },
      { label: "발포설비 예지보전", href: "/production/foaming-inspection", detail: "미세 이상 징후 사전 포착." },
    ]
  },
  "생산관리": {
    description: "데이터 기반의 의사결정으로\n생산 목표 달성을 지원합니다.",
    items: [
      { label: "작업시간관리", href: "/production/takttime-dashboard", detail: "공정별 목표 대비 실제 작업 시간 분석." },
    ]
  },
  "작업관리": {
    description: "작업자와 설비가 조화를 이루는\n최적의 작업 환경을 구축합니다.",
    items: [
      { label: "Pysical AI", href: "/production/pysical-ai", detail: "최적 설비 세팅값 제안." },
    ]
  },
  "출하관리": {
    description: "출하부터 배송까지,\n물류의 전 과정을 실시간으로 추적합니다.",
    items: [
      { label: "제품창고", href: "/transport/warehouse-management", detail: "출하 대기 물품 재고 현황 관리." },
      { label: "출하처리", href: "/transport/shipment", detail: "출하 지시서 생성 및 상차 모니터링." },
      { label: "운송관리", href: "/transport/realtime-status", detail: "차량 위치 및 배송 예정 시간 추적." },
    ]
  },
};

const MENU_KEYS = Object.keys(subMenuData);

// --- Styled Components ---

const NavWrapper = styled.div<{ $isDisabled: boolean }>`
  position: sticky; top: 0; width: 100%; height: 64px;
  overflow: visible; z-index: 9999; background: transparent;
  ${props => props.$isDisabled && css`
    pointer-events: none; opacity: 0.6; cursor: not-allowed;
  `}
`;

const NavContainer = styled.nav`
  height: 64px; background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: relative; z-index: 10000; font-family: var(--font-pretendard), sans-serif;
  display: flex; justify-content: center;
  will-change: transform; 
`;

const NavInner = styled.div`
  width: 100%; max-width: 1680px; padding: 0 24px; height: 100%;
  display: flex; align-items: center; justify-content: space-between;
`;

const LogoArea = styled.div`
  display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; color: #333; cursor: pointer;
  font-family: 'Pretendard';
`;

const MenuArea = styled.div`
  display: flex; align-items: center; gap: 4px; position: relative; height: 100%;
  transform: translateZ(0); 
`;

const MenuGlider = styled.div`
  position: absolute; height: 36px; background-color: #FFF0F3; border-radius: 8px; z-index: 0;
  transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1), width 0.3s cubic-bezier(0.2, 0, 0.2, 1);
  top: 50%; will-change: transform, width;
`;

const MenuItem = styled.button<{ $isActive?: boolean }>`
  border: none; background: transparent; 
  color: ${props => props.$isActive ? '#D31145' : '#555'};
  padding: 0 20px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
  position: relative; z-index: 1; transition: color 0.3s ease; font-family: inherit; height: 36px;
  display: flex; align-items: center; white-space: nowrap;
  &:hover { color: ${props => props.$isActive ? '#D31145' : '#222'}; }
`;

const IconActions = styled.div`
  display: flex; gap: 16px; margin-left: 24px; padding-left: 24px; border-left: 1px solid #ddd; color: #666;
  svg { cursor: pointer; transition: color 0.2s, transform 0.2s; &:hover { color: #111; transform: rotate(15deg); } }
`;

// --- [수정됨] 서브메뉴 레이아웃 & 스타일 ---

const SubMenuWrapper = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 64px; left: 0; width: 100%; z-index: 20000; 
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  opacity: ${props => (props.$isOpen ? '1' : '0')};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.$isOpen ? '0' : '-8px')});
  transition: opacity 0.2s ease-out, transform 0.2s ease-out, visibility 0.2s;
  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
  border-bottom: 1px solid #eee;
  overflow: hidden;
`;

const SubMenuInner = styled.div`
  width: 100%; display: flex; justify-content: center;
`;

const SubMenuContent = styled.div`
  width: 100%; max-width: 1680px; 
  padding: 40px 24px;
  display: flex; 
  /* justify-content: space-between; 제거하고 flex 비율로 조정 */
  align-items: flex-start;
`;

/* [수정] 왼쪽 영역: 50% 너비 */
const SubMenuLeft = styled.div`
  width: 50%; /* 정확히 절반 차지 */
  padding-right: 40px; /* 오른쪽 영역과 간격 */
  display: flex;
  flex-direction: column;
`;

const SubMenuTitle = styled.h2`
  font-size: 48px;
  font-weight: 900;
  color: #000;
  margin: 0 0 16px 0;
  font-family: 'Pretendard', sans-serif;
  text-transform: uppercase;
  letter-spacing: -1px;
`;

const SubMenuDesc = styled.p`
  font-size: 15px;
  line-height: 1.5;
  color: #555;
  margin: 0;
  white-space: pre-line;
  max-width: 80%; /* 텍스트가 너무 길게 늘어지지 않도록 제한 */
`;

/* [수정] 오른쪽 영역: 50% 너비 */
const SubMenuRight = styled.div`
  width: 50%; /* 정확히 절반 차지 */
  display: flex;
  flex-wrap: wrap; /* 버튼이 많으면 다음 줄로 */
  align-items: flex-start;
  gap: 12px;
  padding-left: 40px;
  border-left: 1px solid #eee; 
  min-height: 120px; 
`;

/* [수정] 캡슐형 버튼 스타일: 붉은색(#D31145) 적용 */
const PillButton = styled.button<{ $isActive: boolean }>`
  appearance: none;
  /* Active 상태일 때 배경색을 프로젝트 붉은색으로 */
  background: ${props => props.$isActive ? '#D31145' : '#fff'};
  color: ${props => props.$isActive ? '#fff' : '#333'};
  border: 1px solid ${props => props.$isActive ? '#D31145' : '#ddd'};
  border-radius: 50px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: 'Pretendard', sans-serif;

  /* Hover 시 검은색 대신 붉은색(#D31145) 배경 적용 */
  &:hover {
    background: #D31145;
    color: #fff;
    border-color: #D31145;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(211, 17, 69, 0.2); /* 붉은색 계열 그림자 */
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 64px; left: 0; width: 100vw; height: calc(100vh - 64px); 
  background: rgba(0, 0, 0, 0.2); 
  opacity: ${props => (props.$isOpen ? '1' : '0')}; 
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s; 
  z-index: 15000; 
  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
`;

// --- Component ---
interface TopNavigationProps {
  isLoading?: boolean;
}

export default function TopNavigation({ isLoading = false }: TopNavigationProps) {
  const [gliderStyle, setGliderStyle] = useState({ x: 0, width: 0 });
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [lastActiveMenu, setLastActiveMenu] = useState<string | null>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const menuAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hoveredMenu) {
      setLastActiveMenu(hoveredMenu);
    }
  }, [hoveredMenu]);

  const getCurrentActiveMenu = useCallback(() => {
    const activeKey = MENU_KEYS.find(key => 
      subMenuData[key].items.some(item => 
        pathname === item.href || pathname.startsWith(item.href)
      )
    );

    if (activeKey) return activeKey;
    if (pathname.includes('/material')) return "자재관리";
    if (pathname.includes('/production')) return "공정품질";
    if (pathname.includes('/transport')) return "출하관리";
    
    return "자재관리"; 
  }, [pathname]);

  const currentActiveMenu = getCurrentActiveMenu();

  const handleMenuClick = (e: React.MouseEvent, menu: string) => {
    e.preventDefault(); 
    if (isLoading) return;
    const subItems = subMenuData[menu]?.items;
    if (subItems && subItems.length > 0) router.push(subItems[0].href);
  };

  const handleSubMenuClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault(); e.stopPropagation();
    if (isLoading) return;
    setHoveredMenu(null);
    router.push(href);
  };

  const updateGliderPosition = useCallback(() => {
    const activeIndex = MENU_KEYS.indexOf(currentActiveMenu);
    const currentTabElement = tabsRef.current[activeIndex];
    const parentElement = menuAreaRef.current;

    if (currentTabElement && parentElement) {
      const parentRect = parentElement.getBoundingClientRect();
      const childRect = currentTabElement.getBoundingClientRect();
      const relativeX = childRect.left - parentRect.left;
      
      setGliderStyle(prev => {
        if (Math.abs(prev.x - relativeX) < 0.5 && Math.abs(prev.width - childRect.width) < 0.5) {
          return prev;
        }
        return { x: relativeX, width: childRect.width };
      });
    }
  }, [currentActiveMenu]);

  useEffect(() => {
    updateGliderPosition();
    const resizeObserver = new ResizeObserver(() => updateGliderPosition());

    if (menuAreaRef.current) resizeObserver.observe(menuAreaRef.current);
    tabsRef.current.forEach(tab => {
      if (tab) resizeObserver.observe(tab);
    });

    return () => resizeObserver.disconnect();
  }, [updateGliderPosition]);

  const handleNavLeave = () => {
    setHoveredMenu(null);
  };

  const displayMenuKey = hoveredMenu || lastActiveMenu;
  const activeMenuData = displayMenuKey ? subMenuData[displayMenuKey] : null;

  return (
    <NavWrapper onMouseLeave={handleNavLeave} $isDisabled={isLoading}>
      <NavContainer>
        <NavInner>
          <LogoArea onClick={() => router.push('/master-dashboard')}>
            <div style={{ position: 'relative', width: '60px', height: '40px' }}>
                <Image src="/logo/gmt_logo.png" alt="Company Logo" fill style={{ objectFit: 'contain' }} priority />
            </div>
            <h4>고모텍 AI 관제센터</h4>
          </LogoArea>
          
          <MenuArea ref={menuAreaRef}>
            <MenuGlider style={{ transform: `translate(${gliderStyle.x}px, -50%)`, width: gliderStyle.width }} />
            {MENU_KEYS.map((menu, index) => (
              <MenuItem 
                key={menu}
                ref={(el) => { if(el) tabsRef.current[index] = el; }}
                $isActive={currentActiveMenu === menu} 
                onClick={(e) => handleMenuClick(e, menu)}
                onMouseEnter={() => !isLoading && setHoveredMenu(menu)}
              >
                {menu}
              </MenuItem>
            ))}
            <IconActions>
              <FiBell size={20} />
              <FiSettings size={20} />
            </IconActions>
          </MenuArea>
        </NavInner>
      </NavContainer>

      <SubMenuWrapper $isOpen={!!hoveredMenu && !isLoading}>
        <SubMenuInner>
          <SubMenuContent>
            {displayMenuKey && activeMenuData && (
              <>
                <SubMenuLeft>
                    <SubMenuTitle>{displayMenuKey}</SubMenuTitle>
                    <SubMenuDesc>{activeMenuData.description}</SubMenuDesc>
                </SubMenuLeft>

                <SubMenuRight>
                  {activeMenuData.items.map((subItem: SubMenuItemType) => (
                    <PillButton 
                      key={subItem.label} 
                      $isActive={pathname === subItem.href}
                      onClick={(e) => handleSubMenuClick(e, subItem.href)}
                    >
                      {subItem.label}
                    </PillButton>
                  ))}
                </SubMenuRight>
              </>
            )}
          </SubMenuContent>
        </SubMenuInner>
      </SubMenuWrapper>

      <Overlay $isOpen={!!hoveredMenu && !isLoading} onMouseEnter={handleNavLeave} />
    </NavWrapper>
  );
}