"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiBell, FiSettings } from 'react-icons/fi';
import { 
  FaDolly, 
  FaEye, 
  FaCogs, 
  FaChartLine, 
  FaHardHat, 
  FaTruck 
} from 'react-icons/fa';
import NavbarContextBot from '../chatbot-widget';

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

const MENU_META: Record<string, { icon: any; color: string }> = {
  "자재관리": { icon: FaDolly, color: "#00A651" },
  "공정품질": { icon: FaEye, color: "#E11D48" },
  "공정설비": { icon: FaCogs, color: "#2563EB" },
  "생산관리": { icon: FaChartLine, color: "#00A651" },
  "작업관리": { icon: FaHardHat, color: "#E11D48" },
  "출하관리": { icon: FaTruck, color: "#2563EB" },
};

// --- Data ---
const subMenuData: Record<string, MenuDataType> = {
  "자재관리": {
    description: "입고부터 불량 선별까지,\nAI 비전 기술로 자재 흐름을 완벽하게 제어합니다.",
    items: [
      { label: "입고검수", href: "/material/inbound-inspection", detail: "" },
      { label: "자재창고", href: "/material/warehouse", detail: "" },
      { label: "공정재고_GR5", href: "/production/smart-factory-dashboard", detail: "" },
    ]
  },
  "공정품질": {
    description: "미세한 오차도 허용하지 않는\n실시간 공정 품질 모니터링 시스템입니다.",
    items: [
      { label: "유리틈새검사", href: "/production/glass-gap-check", detail: "" },
      { label: "발포액누설 검사", href: "/production/leak-detection", detail: "" },
      { label: "가스켓 이상 탐지", href: "/production/gasket-check", detail: "" },
      { label: "필름부착확인", href: "/production/film-attachment", detail: "" },
    ]
  },
  "공정설비": {
    description: "설비의 이상 징후를 사전에 포착하여\n중단 없는 생산 라인을 보장합니다.",
    items: [
      { label: "발포 품질 예측", href: "/production/line-monitoring", detail: "" },
      { label: "발포설비 예지보전", href: "/production/foaming-inspection", detail: "" },
    ]
  },
  "생산관리": {
    description: "데이터 기반의 의사결정으로\n생산 목표 달성을 지원합니다.",
    items: [
      { label: "작업시간관리", href: "/production/takttime-dashboard", detail: "" },
    ]
  },
  "작업관리": {
    description: "작업자와 설비가 조화를 이루는\n최적의 작업 환경을 구축합니다.",
    items: [
      { label: "Pysical AI", href: "/production/pysical-ai", detail: "" },
    ]
  },
  "출하관리": {
    description: "출하부터 배송까지,\n물류의 전 과정을 실시간으로 추적합니다.",
    items: [
      { label: "제품창고", href: "/transport/warehouse-management", detail: "" },
      { label: "출하처리", href: "/transport/shipment", detail: "" },
      { label: "운송관리", href: "/transport/realtime-status", detail: "" },
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
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative; z-index: 10000; font-family: var(--font-pretendard), sans-serif;
  display: flex; justify-content: center;
`;

const NavInner = styled.div`
  width: 100%; max-width: 1680px; padding: 0 24px; height: 100%;
  display: flex; align-items: center; justify-content: space-between;
`;

const LogoArea = styled.div`
  display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 18px; color: #111; cursor: pointer;
  font-family: 'Pretendard'; letter-spacing: -0.5px;
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
  position: relative; z-index: 1; transition: color 0.2s ease; font-family: inherit; height: 36px;
  display: flex; align-items: center; white-space: nowrap;
  &:hover { color: ${props => props.$isActive ? '#D31145' : '#111'}; }
`;

const IconActions = styled.div`
  display: flex; gap: 18px; margin-left: 28px; padding-left: 28px; border-left: 1px solid #e0e0e0; color: #666;
  svg { cursor: pointer; transition: color 0.2s; &:hover { color: #111; } }
`;

// --- [UI 개선] 서브메뉴 스타일 ---

const SubMenuWrapper = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 64px; left: 0; width: 100%; z-index: 20000; 
  background: white;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.06);
  opacity: ${props => (props.$isOpen ? '1' : '0')};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.$isOpen ? '0' : '-8px')});
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
  border-bottom: 1px solid #f0f0f0;
  overflow: hidden;
`;

const SubMenuInner = styled.div`
  width: 100%; display: flex; justify-content: center;
`;

const SubMenuContent = styled.div`
  width: 100%; max-width: 1680px; 
  padding: 56px 24px;
  display: flex; 
  align-items: stretch; 
  gap: 80px; 
`;

/* [왼쪽 영역] */
const SubMenuLeft = styled.div`
  flex: 0 0 42%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 4px; 
`;

const SubMenuHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
`;

const MenuIconBox = styled.div<{ $color: string }>`
  width: 76px;
  height: 76px;
  border-radius: 20px;
  background: linear-gradient(145deg, ${props => props.$color}15, ${props => props.$color}05);
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  flex-shrink: 0;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.8), 0 8px 20px -6px rgba(0,0,0,0.08);
  border: 1px solid ${props => props.$color}20;
`;

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
`;

const SubMenuTitle = styled.h2`
  font-size: 30px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
  font-family: 'Pretendard', sans-serif;
  letter-spacing: -0.8px;
  line-height: 1.1;
`;

const SubMenuDesc = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #666;
  margin: 0;
  white-space: pre-wrap; 
  word-break: keep-all; 
  font-weight: 500;
  opacity: 0.9;
  max-width: 540px;
`;

/* [오른쪽 영역] 버튼 리스트 */
const SubMenuRight = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  padding-left: 60px;
  border-left: 1px solid #f5f5f5;
  min-height: 140px;
`;

/* [수정] 호버 시 붉은색 효과 복원 */
const PillButton = styled.button<{ $isActive: boolean }>`
  appearance: none;
  background: ${props => props.$isActive ? '#D31145' : '#fff'};
  color: ${props => props.$isActive ? '#fff' : '#333'};
  border: 1px solid ${props => props.$isActive ? '#D31145' : '#e0e0e0'};
  border-radius: 50px;
  padding: 11px 26px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
  font-family: 'Pretendard', sans-serif;
  letter-spacing: -0.2px;

  /* 활성/비활성 상관없이 호버 시 붉은색(#D31145) 적용 */
  &:hover {
    background: #D31145;
    color: #fff;
    border-color: #D31145;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(211, 17, 69, 0.25);
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 64px; left: 0; width: 100vw; height: calc(100vh - 64px); 
  background: rgba(255, 255, 255, 0.1); 
  backdrop-filter: blur(4px);
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
  const activeMenuMeta = displayMenuKey ? MENU_META[displayMenuKey] : null;

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
          <NavbarContextBot/>
          
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
                    <SubMenuHeaderRow>
                        {activeMenuMeta && (
                            <MenuIconBox $color={activeMenuMeta.color}>
                                <activeMenuMeta.icon />
                            </MenuIconBox>
                        )}
                        <TextGroup>
                            <SubMenuTitle>{displayMenuKey}</SubMenuTitle>
                            <SubMenuDesc>{activeMenuData.description}</SubMenuDesc>
                        </TextGroup>
                    </SubMenuHeaderRow>
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