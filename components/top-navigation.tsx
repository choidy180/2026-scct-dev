"use client";

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiBell, FiSettings, FiGrid } from 'react-icons/fi';

const NavContainer = styled.nav`
  background: #fff;
  height: 64px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
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
  color: ${props => props.$isActive ? '#D31145' : '#666'};
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  z-index: 1; 
  transition: color 0.3s ease;
  font-family: inherit;
  height: 36px; 
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */

  &:hover {
    color: ${props => props.$isActive ? '#D31145' : '#333'};
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

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TopNavigation({ activeTab, onTabChange }: TopNavigationProps) {
  const [gliderStyle, setGliderStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const menus = ["AI 자재관리", "AI 생산관리", "AI 운송관리"];

  // ✅ 핵심 수정: 위치 계산 로직을 함수로 분리
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
    // 1. 최초 실행
    updateGliderPosition();

    // 2. 폰트 로딩 완료 후 재계산 (Pretendard 로딩 시점 차이 해결)
    if (document.fonts) {
      document.fonts.ready.then(() => {
        updateGliderPosition();
      });
    }

    // 3. 윈도우 리사이즈 시 재계산 (반응형 대응)
    window.addEventListener("resize", updateGliderPosition);

    return () => {
      window.removeEventListener("resize", updateGliderPosition);
    };
  }, [activeTab]); // activeTab이 바뀔 때마다 실행

  return (
    <NavContainer>
      <NavInner>
        <LogoArea>
          <div className="logo-icon"><FiGrid /></div>
          AI-Driven 공정 최적화 및 설비 지능형 관제
        </LogoArea>
        <MenuArea>
          <MenuGlider style={{ left: gliderStyle.left, width: gliderStyle.width }} />
          
          {menus.map((menu, index) => (
            <MenuItem 
              key={menu}
              ref={(el) => { tabsRef.current[index] = el }}
              $isActive={activeTab === menu}
              onClick={() => onTabChange(menu)}
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
  );
}