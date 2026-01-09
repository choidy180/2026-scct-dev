"use client";

import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { usePathname, useRouter } from 'next/navigation';
import { FiBell, FiSettings, FiGrid } from 'react-icons/fi';

// --- Types ---
type SubMenuItemType = {
  label: string;
  href: string;
};

// --- Data ---
// 1. 여기서 Key 이름을 "AI 자재입고관리"로 변경해야 합니다.
const subMenuData: Record<string, SubMenuItemType[]> = {
  "AI 자재입고관리": [ 
    { label: "입고검수", href: "/material/inbound-inspection" },
    { label: "자재창고", href: "/material/warehouse" },
  ],
  "AI 생산관리": [
    { label: "라인설비 모니터링", href: "/production/line-monitoring" },
    { label: "택타임 대시보드", href: "/production/takttime-dashboard" },
    { label: "발포설비 이상 탐지", href: "/production/foaming-inspection" },
    { label: "유리틈새확인", href: "/production/glass-gap-check" },
    { label: "발포설비 대차정위치", href: "/production/foaming-cart-position" },
    { label: "발포 누설액 체크", href: "/production/leak-detection" },
    { label: "가스켓 이상 탐지", href: "/production/gasket-check" },
    { label: "필름부착확인", href: "/production/film-attachment" },
    { label: "Pysical AI", href: "/production/pysical-ai"}
  ],
  "AI 운송관리": [
    { label: "실시간 운송현황", href: "/transport/realtime-status" },
    { label: "창고관리", href: "/transport/warehouse-management" },
    { label: "출하관리", href: "/transport/shipment" },
  ],
};

// --- Styled Components (생략 - 기존과 동일) ---
const NavWrapper = styled.div<{ $isDisabled: boolean }>`
  position: sticky; top: 0; width: 100%; height: 64px;
  overflow: visible; z-index: 9999; background: transparent;
  ${props => props.$isDisabled && css`
    pointer-events: none; opacity: 0.6; cursor: not-allowed;
  `}
  transition: opacity 0.3s ease;
`;
// ... (나머지 스타일 컴포넌트는 그대로 유지) ...
const NavContainer = styled.nav`
  height: 64px; background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: relative; z-index: 10000; font-family: var(--font-pretendard), sans-serif;
  display: flex; justify-content: center;
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
`;
const MenuGlider = styled.div`
  position: absolute; height: 36px; background-color: #FFF0F3; border-radius: 8px; z-index: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); top: 50%; transform: translateY(-50%);
`;
const MenuItem = styled.button<{ $isActive?: boolean }>`
  border: none; background: transparent; 
  color: ${props => props.$isActive ? '#D31145' : '#555'};
  padding: 0 20px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
  position: relative; z-index: 1; transition: color 0.3s ease; font-family: inherit; height: 36px;
  display: flex; align-items: center; white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  &:hover { color: ${props => props.$isActive ? '#D31145' : '#222'}; }
`;
const IconActions = styled.div`
  display: flex; gap: 16px; margin-left: 24px; padding-left: 24px; border-left: 1px solid #ddd; color: #666;
  svg { cursor: pointer; transition: color 0.2s, transform 0.2s; &:hover { color: #111; transform: rotate(15deg); } }
`;
const SubMenuWrapper = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 64px; left: 0; width: 100%; z-index: 20000; 
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  display: grid; grid-template-rows: ${props => (props.$isOpen ? '1fr' : '0fr')};
  opacity: ${props => (props.$isOpen ? '1' : '0')}; visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transition: grid-template-rows 0.35s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.35s ease, visibility 0.35s;
  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
`;
const SubMenuInner = styled.div`
  overflow: hidden; width: 100%; display: flex; justify-content: center; min-height: 0;
`;
const SubMenuContent = styled.div<{ $isOpen: boolean }>`
  width: 100%; max-width: 1680px; padding: 40px 24px; display: flex; flex-direction: column; gap: 16px;
  transform: translateY(${props => (props.$isOpen ? '0' : '-15px')});
  transition: transform 0.35s cubic-bezier(0.33, 1, 0.68, 1);
`;
const SubMenuList = styled.div`
  display: flex; gap: 60px;
`;
const NavItemText = styled.div<{ $isActive: boolean }>`
  font-size: 16px; 
  color: ${props => props.$isActive ? '#D31145' : '#333'}; 
  text-decoration: none; 
  font-weight: 500;
  position: relative; 
  transition: color 0.2s; 
  cursor: pointer; 
  display: block; 
  
  &::after { 
    content: ''; 
    position: absolute; 
    width: ${props => props.$isActive ? '100%' : '0'};
    height: 2px; 
    bottom: -4px; 
    left: 0; 
    background-color: #D31145; 
    transition: width 0.3s; 
  }
  
  &:hover { 
    color: #D31145; 
    &::after { width: 100%; } 
  }
`;
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 64px; left: 0; width: 100vw; height: calc(100vh - 64px); background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(4px);
  opacity: ${props => (props.$isOpen ? '1' : '0')}; visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s; z-index: 15000; 
  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
`;

// --- Component ---
interface TopNavigationProps {
  isLoading?: boolean;
}

export default function TopNavigation({ isLoading = false }: TopNavigationProps) {
  const [gliderStyle, setGliderStyle] = useState({ left: 0, width: 0 });
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  
  // subMenuData의 Key가 바뀌었으므로 menus 배열도 자동으로 "AI 자재입고관리"를 포함하게 됩니다.
  const menus = Object.keys(subMenuData);

  // 2. 판별 로직에서도 반환값을 "AI 자재입고관리"로 맞춰주어야 합니다.
  const getCurrentActiveMenu = () => {
    if (pathname.includes('/transport')) return "AI 운송관리";
    if (pathname.includes('/production')) return "AI 생산관리";
    // ✨ 핵심 수정: 반환 문자열을 subMenuData의 키값과 100% 일치시켜야 함
    if (pathname.includes('/material')) return "AI 자재입고관리"; 
    return "AI 운송관리"; 
  };

  const currentActiveMenu = getCurrentActiveMenu();

  const handleMenuClick = (e: React.MouseEvent, menu: string) => {
    e.preventDefault(); 
    if (isLoading) return;
    
    const subItems = subMenuData[menu];
    if (subItems && subItems.length > 0) {
      router.push(subItems[0].href);
    }
  };

  const handleSubMenuClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    setHoveredMenu(null);
    router.push(href);
  };

  // Glider 위치 업데이트
  const updateGliderPosition = () => {
    // 3. menus 배열에서 currentActiveMenu와 정확히 일치하는 인덱스를 찾습니다.
    const activeIndex = menus.indexOf(currentActiveMenu);
    
    // 만약 문자열이 불일치하면 activeIndex는 -1이 되어 ref를 못 찾고 Glider가 깨집니다.
    // 위에서 문자열을 맞췄으므로 정확한 DOM 요소를 찾아갑니다.
    const currentTabElement = tabsRef.current[activeIndex];
    
    if (currentTabElement) {
      setGliderStyle({
        left: currentTabElement.offsetLeft,
        width: currentTabElement.offsetWidth // 글자 길이에 맞춰 늘어난 너비를 가져옴
      });
    }
  };

  useEffect(() => {
    // 리사이징 및 폰트 로딩 시 위치 재계산
    updateGliderPosition();
    if (document.fonts) { document.fonts.ready.then(updateGliderPosition); }
    window.addEventListener("resize", updateGliderPosition);
    return () => window.removeEventListener("resize", updateGliderPosition);
  }, [currentActiveMenu]); 

  // 4. Ref 배열 초기화 (렌더링 시 인덱스 밀림 방지)
  tabsRef.current = [];

  return (
    <NavWrapper onMouseLeave={() => setHoveredMenu(null)} $isDisabled={isLoading}>
      <NavContainer>
        <NavInner>
          <LogoArea onClick={(e: any) => handleMenuClick(e, "AI 운송관리")}>
            <div className="logo-icon"><FiGrid /></div>
            물류 자원 회전율 및 운송 최적화 관제
          </LogoArea>
          
          <MenuArea>
            {/* 글라이더 위치 스타일 */}
            <MenuGlider style={{ left: gliderStyle.left, width: gliderStyle.width }} />
            {menus.map((menu, index) => (
              <MenuItem 
                key={menu}
                // Ref 할당 방식 개선
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

      <SubMenuWrapper $isOpen={!!hoveredMenu && !isLoading}>
        <SubMenuInner>
          <SubMenuContent $isOpen={!!hoveredMenu && !isLoading}>
            <SubMenuList>
              {hoveredMenu && subMenuData[hoveredMenu]?.map((subItem) => (
                <NavItemText 
                  key={subItem.label} 
                  $isActive={pathname === subItem.href} 
                  onClick={(e) => handleSubMenuClick(e, subItem.href)}
                >
                  {subItem.label}
                </NavItemText>
              ))}
            </SubMenuList>
          </SubMenuContent>
        </SubMenuInner>
      </SubMenuWrapper>

      <Overlay $isOpen={!!hoveredMenu && !isLoading} onMouseEnter={() => setHoveredMenu(null)} />
    </NavWrapper>
  );
}