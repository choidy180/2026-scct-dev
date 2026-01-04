"use client";

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link'; 
import { FiBell, FiSettings, FiGrid } from 'react-icons/fi';

// -------------------------------------------------------------------------
// 데이터 정의
// -------------------------------------------------------------------------

type SubMenuItemType = {
  label: string;
  href: string;
};

const subMenuData: Record<string, SubMenuItemType[]> = {
  "AI 자재관리": [
    { label: "실시간 재고 현황", href: "/material/inventory" },
    { label: "입출고 리포트", href: "/material/report" },
    { label: "수요 예측 분석", href: "/material/forecast" },
    { label: "안전재고 설정", href: "/material/safety-stock" },
  ],
  "AI 생산관리": [
    { label: "유리틈새확인", href: "/production/glass-gap-check" },
    { label: "발포설비 대차정위치", href: "/production/foaming-cart-position" },
    { label: "발포설비 양불 판정", href: "/production/foaming-inspection" },
    { label: "발포 액누설 체크", href: "/production/leak-detection" },
    { label: "가스켓 이상 탐지", href: "/production/gasket-check" },
    { label: "필름부착확인", href: "/production/film-attachment" },
  ],
  "AI 운송관리": [
    { label: "배차 최적화", href: "/transport/dispatch-opt" },
    { label: "실시간 경로 관제", href: "/transport/tracking" },
    { label: "운송비 정산", href: "/transport/cost-settlement" },
    { label: "납기 관리 지표", href: "/transport/delivery-metrics" },
  ],
};

// -------------------------------------------------------------------------
// Styled Components
// -------------------------------------------------------------------------

const NavWrapper = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  height: 64px;
  /* ✅ NavWrapper 자체는 sticky로 유지하되, 자식들이 튀어나갈 수 있게 visible 설정 */
  overflow: visible; 
  z-index: 9999;
  background: transparent;
`;

const NavContainer = styled.nav`
  height: 64px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10000;
  font-family: var(--font-pretendard), sans-serif;
  display: flex;
  justify-content: center;
`;

const NavInner = styled.div`
  width: 100%;
  max-width: 1680px; 
  padding: 0 24px;   
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 18px;
  color: #333;
  cursor: pointer;

  .logo-icon {
    width: 32px;
    height: 32px;
    background: #D31145;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 10px rgba(211, 17, 69, 0.3);
  }
`;

const MenuArea = styled.div`
  display: flex;
  align-items: center;
  gap: 4px; 
  position: relative; 
  height: 100%;
`;

const MenuGlider = styled.div`
  position: absolute;
  height: 36px; 
  background-color: #FFF0F3;
  border-radius: 8px;
  z-index: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  top: 50%;
  transform: translateY(-50%);
`;

const MenuItem = styled.button<{ $isActive?: boolean }>`
  border: none;
  background: transparent; 
  color: ${props => props.$isActive ? '#D31145' : '#555'};
  padding: 0 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  z-index: 1; 
  transition: color 0.3s ease;
  font-family: inherit;
  height: 36px;
  display: flex;
  align-items: center;

  &:hover {
    color: ${props => props.$isActive ? '#D31145' : '#222'};
  }
`;

const IconActions = styled.div`
  display: flex;
  gap: 16px;
  margin-left: 24px;
  padding-left: 24px;
  border-left: 1px solid #ddd;
  color: #666;

  svg {
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    &:hover { 
      color: #111; 
      transform: rotate(15deg);
    }
  }
`;

// ✅ 중요 수정: position을 'fixed'로 변경하여 부모 영역(height:64px) 무시하고 화면에 그림
const SubMenuWrapper = styled.div<{ $isOpen: boolean }>`
  position: fixed; 
  top: 64px;
  left: 0;
  width: 100%;
  
  /* ✅ 어떤 지도나 차트보다도 위에 오도록 강력한 z-index */
  z-index: 20000; 

  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);

  display: grid;
  grid-template-rows: ${props => (props.$isOpen ? '1fr' : '0fr')};
  opacity: ${props => (props.$isOpen ? '1' : '0')};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  
  transition: 
    grid-template-rows 0.35s cubic-bezier(0.33, 1, 0.68, 1),
    opacity 0.35s ease,
    visibility 0.35s;

  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
`;

const SubMenuInner = styled.div`
  overflow: hidden;
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: 0;
`;

const SubMenuContent = styled.div<{ $isOpen: boolean }>`
  width: 100%;
  max-width: 1680px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  transform: translateY(${props => (props.$isOpen ? '0' : '-15px')});
  transition: transform 0.35s cubic-bezier(0.33, 1, 0.68, 1);
`;

const SubMenuTitle = styled.div`
  font-size: 13px;
  color: #888;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
  text-transform: uppercase;
`;

const SubMenuList = styled.div`
  display: flex;
  gap: 60px;
`;

const SubMenuItemLink = styled(Link)`
  font-size: 16px;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  position: relative;
  transition: color 0.2s;
  cursor: pointer;
  display: block; 

  &::after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -4px;
    left: 0;
    background-color: #D31145;
    transition: width 0.3s;
  }

  &:hover {
    color: #D31145;
    &::after {
      width: 100%;
    }
  }
`;

// ✅ Overlay도 fixed로 변경
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 64px; 
  left: 0;
  width: 100vw;
  height: calc(100vh - 64px);
  background: rgba(0, 0, 0, 0.2); 
  backdrop-filter: blur(4px);
  
  opacity: ${props => (props.$isOpen ? '1' : '0')};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  
  transition: opacity 0.3s ease, visibility 0.3s;
  z-index: 15000; /* 서브메뉴(20000) 보다는 낮게 */
  
  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
`;

// -------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TopNavigation({ activeTab, onTabChange }: TopNavigationProps) {
  const [gliderStyle, setGliderStyle] = useState({ left: 0, width: 0 });
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const menus = Object.keys(subMenuData);

  const updateGliderPosition = () => {
    const activeIndex = menus.indexOf(activeTab);
    const currentTab = tabsRef.current[activeIndex];
    if (currentTab) {
      setGliderStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth
      });
    }
  };

  useEffect(() => {
    updateGliderPosition();
    if (document.fonts) {
      document.fonts.ready.then(updateGliderPosition);
    }
    window.addEventListener("resize", updateGliderPosition);
    return () => window.removeEventListener("resize", updateGliderPosition);
  }, [activeTab]);

  return (
    <NavWrapper onMouseLeave={() => setHoveredMenu(null)}>
      
      <NavContainer>
        <NavInner>
          <LogoArea onClick={() => onTabChange("AI 운송관리")}>
            <div className="logo-icon"><FiGrid /></div>
            물류 자원 회전율 및 운송 최적화 관제
          </LogoArea>
          
          <MenuArea>
            <MenuGlider style={{ left: gliderStyle.left, width: gliderStyle.width }} />
            
            {menus.map((menu, index) => (
              <MenuItem 
                key={menu}
                ref={(el) => { tabsRef.current[index] = el }}
                $isActive={activeTab === menu}
                onClick={() => onTabChange(menu)}
                onMouseEnter={() => setHoveredMenu(menu)}
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

      <SubMenuWrapper $isOpen={!!hoveredMenu}>
        <SubMenuInner>
          <SubMenuContent $isOpen={!!hoveredMenu}>
            <SubMenuTitle>{hoveredMenu}</SubMenuTitle>
            <SubMenuList>
              {hoveredMenu && subMenuData[hoveredMenu]?.map((subItem) => (
                <SubMenuItemLink 
                  key={subItem.label} 
                  href={subItem.href}
                >
                  {subItem.label}
                </SubMenuItemLink>
              ))}
            </SubMenuList>
          </SubMenuContent>
        </SubMenuInner>
      </SubMenuWrapper>

      <Overlay 
        $isOpen={!!hoveredMenu} 
        onMouseEnter={() => setHoveredMenu(null)}
      />

    </NavWrapper>
  );
}