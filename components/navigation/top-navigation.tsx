"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { usePathname, useRouter } from 'next/navigation';
import { FiBell, FiSettings, FiGrid, FiInfo } from 'react-icons/fi';

// --- Types ---
export type SubMenuItemType = {
  label: string;
  href: string;
  detail: string;
};

export type MenuDataType = {
  items: SubMenuItemType[];
};

// --- Data ---
const subMenuData: Record<string, MenuDataType> = {
  "AI 자재입고관리": {
    items: [
      { label: "입고검수", href: "/material/inbound-inspection", detail: "입고된 자재의 수량 및 품질을 AI 비전으로 검사하고 불량품을 자동으로 분류합니다." },
      { label: "자재창고", href: "/material/warehouse", detail: "창고 내 자재의 위치를 시각화하고 적재 효율을 분석합니다." },
    ]
  },
  "AI 생산관리": {
    items: [
      { label: "라인설비 모니터링", href: "/production/line-monitoring", detail: "각 생산 라인의 가동률과 설비 상태를 실시간으로 추적합니다." },
      { label: "택타임 대시보드", href: "/production/takttime-dashboard", detail: "공정별 목표 시간 대비 실제 작업 시간을 비교 분석합니다." },
      { label: "발포설비 이상 탐지", href: "/production/foaming-inspection", detail: "발포 공정 중 발생하는 미세한 이상 징후를 사전에 포착합니다." },
      { label: "유리틈새확인", href: "/production/glass-gap-check", detail: "조립된 유리의 틈새 규격 준수 여부를 정밀 측정합니다." },
      // { label: "발포설비 대차정위치", href: "/production/foaming-cart-position", detail: "대차가 정해진 위치에 정확히 안착했는지 센서로 확인합니다." },
      { label: "발포 누설액 체크", href: "/production/leak-detection", detail: "화학 용액의 누설 여부를 카메라로 감지하여 알림을 보냅니다." },
      { label: "가스켓 이상 탐지", href: "/production/gasket-check", detail: "가스켓의 부착 상태와 손상 여부를 검사합니다." },
      { label: "필름부착확인", href: "/production/film-attachment", detail: "보호 필름이 기포 없이 정확하게 부착되었는지 확인합니다." },
      { label: "Pysical AI", href: "/production/pysical-ai", detail: "물리적 환경 변수를 학습하여 최적의 설비 세팅값을 제안합니다." },
      { label: "Pysical AI2", href: "/production/smart-factory-dashboard", detail: "물리적 환경 변수를 학습하여 최적의 설비 세팅값을 제안합니다." }
    ]
  },
  "AI 운송관리": {
    items: [
      { label: "실시간 운송현황", href: "/transport/realtime-status", detail: "차량의 현재 위치와 배송 예정 시간을 실시간 지도로 보여줍니다." },
      { label: "창고관리", href: "/transport/warehouse-management", detail: "출하 대기 중인 물품의 재고 현황을 관리합니다." },
      { label: "출하관리", href: "/transport/shipment", detail: "출하 지시서를 생성하고 상차 작업을 모니터링합니다." },
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
  /* 블러 효과는 유지하되 성능을 위해 값 조절 (너무 높으면 렉 유발) */
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: relative; z-index: 10000; font-family: var(--font-pretendard), sans-serif;
  display: flex; justify-content: center;
  /* 하드웨어 가속 힌트 */
  will-change: transform; 
`;

const NavInner = styled.div`
  width: 100%; max-width: 1680px; padding: 0 24px; height: 100%;
  display: flex; align-items: center; justify-content: space-between;
`;

const LogoArea = styled.div`
  display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; color: #333; cursor: pointer;
  .logo-icon { width: 32px; height: 32px; background: #D31145; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(211, 17, 69, 0.3); }
`;

const MenuArea = styled.div`
  display: flex; align-items: center; gap: 4px; position: relative; height: 100%;
  transform: translateZ(0); 
`;

const MenuGlider = styled.div`
  position: absolute; height: 36px; background-color: #FFF0F3; border-radius: 8px; z-index: 0;
  /* 부드러운 이동 애니메이션 */
  transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1), width 0.3s cubic-bezier(0.2, 0, 0.2, 1);
  top: 50%; 
  will-change: transform, width;
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

const SubMenuWrapper = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 64px; left: 0; width: 100%; z-index: 20000; 
  background: rgba(255, 255, 255, 0.98);
  /* 그림자 단순화로 렌더링 성능 향상 */
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.04);
  
  /* Layout Thrashing 방지: max-height 대신 transform/opacity 사용 */
  opacity: ${props => (props.$isOpen ? '1' : '0')};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.$isOpen ? '0' : '-8px')});
  
  /* 닫힐 때도 부드럽게 사라지도록 transition 설정 */
  transition: opacity 0.2s ease-out, transform 0.2s ease-out, visibility 0.2s;
  
  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
  will-change: opacity, transform;
  overflow: hidden;
`;

const SubMenuInner = styled.div`
  width: 100%; display: flex; justify-content: center;
`;

const SubMenuContent = styled.div`
  width: 100%; max-width: 1680px; 
  padding: 24px 24px; 
  display: flex; flex-direction: column; 
`;

const SubMenuList = styled.div`
  display: flex; gap: 40px; flex-wrap: wrap; 
`;

const NavItemText = styled.div<{ $isActive: boolean; $isHovered: boolean }>`
  font-size: 16px; 
  color: ${props => props.$isActive || props.$isHovered ? '#D31145' : '#333'}; 
  font-weight: 500; position: relative; cursor: pointer; display: block; 
  transition: color 0.2s;

  &::after { 
    content: ''; position: absolute; width: ${props => props.$isActive || props.$isHovered ? '100%' : '0'};
    height: 2px; bottom: -4px; left: 0; background-color: #D31145; transition: width 0.3s; 
  }
`;

const DetailSection = styled.div<{ $isVisible: boolean }>`
  /* 성능을 위해 height 애니메이션 제거, opacity만 사용 */
  display: ${props => props.$isVisible ? 'block' : 'none'}; 
  opacity: ${props => (props.$isVisible ? '1' : '0')};
  margin-top: 16px;
  animation: ${props => props.$isVisible ? 'fadeIn 0.3s ease' : 'none'};
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const DetailInner = styled.div`
  min-height: 0;
  padding-bottom: 2px; 
`;

const DetailBox = styled.div`
  background: #F8F9FA; border-radius: 8px; padding: 14px 20px;
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: #555; border: 1px solid #eee;
  
  svg { color: #D31145; flex-shrink: 0; }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 64px; left: 0; width: 100vw; height: calc(100vh - 64px); 
  background: rgba(0, 0, 0, 0.1); 
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
  
  // hoveredMenu: 실제 마우스가 올라간 메뉴 (Logic용)
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  
  // lastActiveMenu: 닫히는 애니메이션 동안 내용을 보여주기 위한 상태 (View용)
  const [lastActiveMenu, setLastActiveMenu] = useState<string | null>(null);
  
  const [hoveredSubItem, setHoveredSubItem] = useState<SubMenuItemType | null>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const menuAreaRef = useRef<HTMLDivElement>(null);

  // [중요] 메뉴가 활성화되면 내용을 기억(setLastActiveMenu)
  // 마우스가 떠나서 hoveredMenu가 null이 되어도, lastActiveMenu는 남아있어 내용이 사라지지 않음
  useEffect(() => {
    if (hoveredMenu) {
      setLastActiveMenu(hoveredMenu);
    }
  }, [hoveredMenu]);

  const getCurrentActiveMenu = useCallback(() => {
    if (pathname.includes('/transport')) return "AI 운송관리";
    if (pathname.includes('/production')) return "AI 생산관리";
    if (pathname.includes('/material')) return "AI 자재입고관리"; 
    return "AI 운송관리"; 
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
    setHoveredMenu(null); // 닫기 트리거
    setHoveredSubItem(null);
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
    const resizeObserver = new ResizeObserver(() => {
      updateGliderPosition();
    });

    if (menuAreaRef.current) {
      resizeObserver.observe(menuAreaRef.current);
    }
    tabsRef.current.forEach(tab => {
      if (tab) resizeObserver.observe(tab);
    });

    return () => resizeObserver.disconnect();
  }, [updateGliderPosition]);

  const handleNavLeave = () => {
    setHoveredMenu(null);
    setHoveredSubItem(null);
  };

  useEffect(() => {
    setHoveredSubItem(null);
  }, [hoveredMenu]);

  // 렌더링 시 사용할 메뉴 키 결정 (현재 호버 중이거나, 아니면 방금 닫힌 메뉴)
  const displayMenuKey = hoveredMenu || lastActiveMenu;

  return (
    <NavWrapper onMouseLeave={handleNavLeave} $isDisabled={isLoading}>
      <NavContainer>
        <NavInner>
          <LogoArea onClick={(e: any) => handleMenuClick(e, "AI 운송관리")}>
            <div className="logo-icon"><FiGrid /></div>
            물류 자원 회전율 및 운송 최적화 관제
          </LogoArea>
          
          <MenuArea ref={menuAreaRef}>
            <MenuGlider 
              style={{ 
                transform: `translate(${gliderStyle.x}px, -50%)`, 
                width: gliderStyle.width 
              }} 
            />
            {MENU_KEYS.map((menu, index) => (
              <MenuItem 
                key={menu}
                ref={(el) => { tabsRef.current[index] = el }}
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

      {/* $isOpen은 현재 마우스 상태(hoveredMenu)를 따라감 */}
      <SubMenuWrapper $isOpen={!!hoveredMenu && !isLoading}>
        <SubMenuInner>
          <SubMenuContent>
            
            {/* 내용은 displayMenuKey(마지막 활성 상태)를 따라감 -> 닫힐 때 내용 유지 */}
            {displayMenuKey && subMenuData[displayMenuKey] && (
              <>
                <SubMenuList>
                  {subMenuData[displayMenuKey].items.map((subItem: SubMenuItemType) => (
                    <NavItemText 
                      key={subItem.label} 
                      $isActive={pathname === subItem.href}
                      $isHovered={hoveredSubItem?.label === subItem.label}
                      onClick={(e) => handleSubMenuClick(e, subItem.href)}
                      onMouseEnter={() => setHoveredSubItem(subItem)}
                    >
                      {subItem.label}
                    </NavItemText>
                  ))}
                </SubMenuList>

                <DetailSection $isVisible={!!hoveredSubItem}>
                    <DetailInner>
                        <DetailBox>
                            <FiInfo size={16} />
                            {hoveredSubItem?.detail}
                        </DetailBox>
                    </DetailInner>
                </DetailSection>
              </>
            )}

          </SubMenuContent>
        </SubMenuInner>
      </SubMenuWrapper>

      <Overlay $isOpen={!!hoveredMenu && !isLoading} onMouseEnter={handleNavLeave} />
    </NavWrapper>
  );
}