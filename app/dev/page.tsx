'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';

type ModuleKey = 'wearable' | 'qr' | 'vlm' | 'stt';
type Status = 'normal' | 'warning' | 'danger';
type ToastTone = 'normal' | 'success' | 'danger';

type ModuleItem = {
  id: ModuleKey;
  icon: string;
  title: string;
  description: string;
  impact: string;
  latency: string;
  accent: string;
};

type NodeItem = {
  id: string;
  label: string;
  status: Status;
  checked: boolean;
  metric: string;
  temp: string;
};

type LineItem = {
  id: string;
  name: string;
  owner: string;
  throughput: number;
  target: number;
  nodes: NodeItem[];
};

type LogItem = {
  id: string;
  time: string;
  slot: string;
  line: string;
  status: Status;
  result: string;
  assignee: string;
  start: string;
  end: string;
  memo: string;
};

type ToastItem = {
  id: string;
  title: string;
  body: string;
  tone: ToastTone;
};

const REMINDER_SLOTS = ['14:00', '16:00', '18:00', '20:00'] as const;

const MODULES: ModuleItem[] = [
  {
    id: 'wearable',
    icon: '⌚',
    title: '타임체크 알림',
    description: '작업자 웨어러블과 연동해 정해진 시간에 메일/문자 알림을 보냅니다.',
    impact: '누락 감소 32%',
    latency: '0.9s',
    accent: '#3b82f6',
  },
  {
    id: 'qr',
    icon: '▣',
    title: 'QR 설비/제품 인식',
    description: 'QR 스캔만으로 설비 식별과 점검 대상을 빠르게 매칭합니다.',
    impact: '탐색 시간 -41%',
    latency: '1.3s',
    accent: '#22c55e',
  },
  {
    id: 'vlm',
    icon: '◎',
    title: 'VLM 수치 추출',
    description: '검사장비 화면 수치를 읽어와 이상 후보를 자동으로 반영합니다.',
    impact: '판독 자동화 88%',
    latency: '1.1s',
    accent: '#a78bfa',
  },
  {
    id: 'stt',
    icon: '🎙',
    title: 'STT 특이사항 입력',
    description: '음성 입력을 텍스트로 변환해 점검 이력에 빠르게 기록합니다.',
    impact: '기록 시간 -57%',
    latency: '0.7s',
    accent: '#f59e0b',
  },
];

const INITIAL_LINES: LineItem[] = [
  {
    id: 'A',
    name: '라인A',
    owner: '정비A',
    throughput: 96,
    target: 100,
    nodes: [
      {
        id: 'A-1',
        label: '원료',
        status: 'normal',
        checked: true,
        metric: '입고 값 정상',
        temp: '34.8°C',
      },
      {
        id: 'A-2',
        label: '세척',
        status: 'normal',
        checked: true,
        metric: '압력 안정',
        temp: '35.1°C',
      },
      {
        id: 'A-3',
        label: '조립',
        status: 'normal',
        checked: true,
        metric: '편차 ±0.2',
        temp: '35.8°C',
      },
      {
        id: 'A-4',
        label: '검사',
        status: 'normal',
        checked: true,
        metric: '판독률 99.1%',
        temp: '34.9°C',
      },
      {
        id: 'A-5',
        label: '포장',
        status: 'normal',
        checked: false,
        metric: '대기 중',
        temp: '35.0°C',
      },
    ],
  },
  {
    id: 'B',
    name: '라인B',
    owner: '정비B',
    throughput: 83,
    target: 100,
    nodes: [
      {
        id: 'B-1',
        label: '원료',
        status: 'normal',
        checked: true,
        metric: '투입량 정상',
        temp: '34.1°C',
      },
      {
        id: 'B-2',
        label: '세척',
        status: 'normal',
        checked: true,
        metric: '수위 정상',
        temp: '35.4°C',
      },
      {
        id: 'B-3',
        label: '조립',
        status: 'danger',
        checked: false,
        metric: '진동 수치 급등',
        temp: '48.7°C',
      },
      {
        id: 'B-4',
        label: '검사',
        status: 'normal',
        checked: true,
        metric: '점검 완료',
        temp: '36.0°C',
      },
      {
        id: 'B-5',
        label: '포장',
        status: 'normal',
        checked: false,
        metric: '대기 중',
        temp: '35.8°C',
      },
    ],
  },
  {
    id: 'C',
    name: '라인C',
    owner: '정비C',
    throughput: 98,
    target: 100,
    nodes: [
      {
        id: 'C-1',
        label: '원료',
        status: 'normal',
        checked: true,
        metric: '공급 안정',
        temp: '34.7°C',
      },
      {
        id: 'C-2',
        label: '세척',
        status: 'normal',
        checked: true,
        metric: '세척 완료',
        temp: '35.5°C',
      },
      {
        id: 'C-3',
        label: '조립',
        status: 'normal',
        checked: true,
        metric: '편차 ±0.1',
        temp: '35.9°C',
      },
      {
        id: 'C-4',
        label: '검사',
        status: 'normal',
        checked: true,
        metric: '양품률 99.4%',
        temp: '35.0°C',
      },
      {
        id: 'C-5',
        label: '포장',
        status: 'normal',
        checked: false,
        metric: '대기 중',
        temp: '34.9°C',
      },
    ],
  },
  {
    id: 'D',
    name: '라인D',
    owner: '정비D',
    throughput: 79,
    target: 100,
    nodes: [
      {
        id: 'D-1',
        label: '원료',
        status: 'normal',
        checked: true,
        metric: '투입 정상',
        temp: '34.0°C',
      },
      {
        id: 'D-2',
        label: '세척',
        status: 'danger',
        checked: false,
        metric: '세척 압력 저하',
        temp: '46.2°C',
      },
      {
        id: 'D-3',
        label: '조립',
        status: 'normal',
        checked: true,
        metric: '재확인 완료',
        temp: '36.2°C',
      },
      {
        id: 'D-4',
        label: '검사',
        status: 'normal',
        checked: true,
        metric: '점검 완료',
        temp: '35.8°C',
      },
      {
        id: 'D-5',
        label: '포장',
        status: 'normal',
        checked: true,
        metric: '점검 완료',
        temp: '35.1°C',
      },
    ],
  },
];

const INITIAL_LOGS: LogItem[] = [
  {
    id: 'log-1',
    time: '13:45',
    slot: '14:00',
    line: '라인A',
    status: 'normal',
    result: '정상 / 특이사항 없음',
    assignee: '정비A',
    start: '13:45',
    end: '13:55',
    memo: 'VLM 수치와 QR 이력 정상',
  },
  {
    id: 'log-2',
    time: '16:00',
    slot: '16:00',
    line: '라인B',
    status: 'danger',
    result: '이상 / 베어링 진동 급증',
    assignee: '정비B',
    start: '16:00',
    end: '16:25',
    memo: '조립 구간 재점검 접수',
  },
  {
    id: 'log-3',
    time: '13:25',
    slot: '14:00',
    line: '라인C',
    status: 'normal',
    result: '정상 / 양품률 우수',
    assignee: '정비C',
    start: '13:25',
    end: '13:35',
    memo: '검사 구간 판독률 99.4%',
  },
  {
    id: 'log-4',
    time: '12:00',
    slot: '14:00',
    line: '라인D',
    status: 'danger',
    result: '이상 / 세척 압력 저하',
    assignee: '정비D',
    start: '12:00',
    end: '12:18',
    memo: '압력 계기값 재보정 필요',
  },
  {
    id: 'log-5',
    time: '11:25',
    slot: '12:00',
    line: '라인B',
    status: 'normal',
    result: '정상 / 재가동 완료',
    assignee: '정비B',
    start: '11:25',
    end: '11:35',
    memo: 'QR 스캔 후 설비 식별 재확인',
  },
  {
    id: 'log-6',
    time: '11:00',
    slot: '12:00',
    line: '라인D',
    status: 'normal',
    result: '정상 / 초기 점검 완료',
    assignee: '정비D',
    start: '11:00',
    end: '11:05',
    memo: '초기 점검 로그 동기화 완료',
  },
];

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }

  70% {
    transform: scale(1.5);
    opacity: 0;
  }

  100% {
    transform: scale(1.5);
    opacity: 0;
  }
`;

const toastIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const panelBase = css`
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 18px;
  background: #0f172a;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.35);
`;

const scrollStyle = css`
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.18);
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const makeId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const formatClock = (date: Date) => {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const addMinutes = (date: Date, minutes: number) => {
  const next = new Date(date.getTime());
  next.setMinutes(next.getMinutes() + minutes);
  return next;
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hour = Math.floor(minutes / 60);
  const remain = minutes % 60;

  if (remain === 0) {
    return `${hour}시간`;
  }

  return `${hour}시간 ${remain}분`;
};

const getStatusColor = (status: Status) => {
  if (status === 'danger') {
    return '#ef4444';
  }

  if (status === 'warning') {
    return '#f59e0b';
  }

  return '#22c55e';
};

const getStatusLabel = (status: Status) => {
  if (status === 'danger') {
    return '이상';
  }

  if (status === 'warning') {
    return '주의';
  }

  return '정상';
};

const nearestSlot = (date: Date) => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const candidates = REMINDER_SLOTS.map((slot) => {
    const [hour, minute] = slot.split(':').map(Number);

    return {
      slot,
      value: hour * 60 + minute,
    };
  });

  const closest = candidates.reduce((acc, item) => {
    return Math.abs(item.value - currentMinutes) < Math.abs(acc.value - currentMinutes)
      ? item
      : acc;
  }, candidates[0]);

  return closest.slot;
};

const createLog = (
  line: string,
  status: Status,
  result: string,
  memo: string,
  slotOverride?: string,
  assignee?: string,
): LogItem => {
  const now = new Date();
  const end = addMinutes(now, status === 'danger' ? 18 : 8);

  return {
    id: makeId(),
    time: formatClock(now),
    slot: slotOverride ?? nearestSlot(now),
    line,
    status,
    result,
    assignee: assignee ?? (status === 'danger' ? '현장대응팀' : 'AUTO BOT'),
    start: formatClock(now),
    end: formatClock(end),
    memo,
  };
};

export default function Page() {
  const [moduleId, setModuleId] = useState<ModuleKey>('wearable');
  const [selectedSlot, setSelectedSlot] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [searchText, setSearchText] = useState('');
  const [lines, setLines] = useState<LineItem[]>(INITIAL_LINES);
  const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS);
  const [selectedLineId, setSelectedLineId] = useState('B');
  const [selectedNodeId, setSelectedNodeId] = useState('B-3');
  const [now, setNow] = useState<Date | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [bars, setBars] = useState([46, 52, 48, 58, 61, 56, 64, 59, 66, 62, 68, 71]);

  const activeModule = useMemo(() => {
    return MODULES.find((item) => item.id === moduleId) ?? MODULES[0];
  }, [moduleId]);

  const activeLine = useMemo(() => {
    return lines.find((line) => line.id === selectedLineId) ?? lines[0];
  }, [lines, selectedLineId]);

  const activeNode = useMemo(() => {
    return activeLine?.nodes.find((node) => node.id === selectedNodeId) ?? activeLine?.nodes[0] ?? null;
  }, [activeLine, selectedNodeId]);

  const totalNodes = useMemo(() => {
    return lines.flatMap((line) => line.nodes).length;
  }, [lines]);

  const checkedCount = useMemo(() => {
    return lines.flatMap((line) => line.nodes).filter((node) => node.checked).length;
  }, [lines]);

  const dangerCount = useMemo(() => {
    return lines.flatMap((line) => line.nodes).filter((node) => node.status === 'danger').length;
  }, [lines]);

  const healthyLineCount = useMemo(() => {
    return lines.filter((line) => !line.nodes.some((node) => node.status === 'danger')).length;
  }, [lines]);

  const completion = useMemo(() => {
    return Math.round((checkedCount / totalNodes) * 100);
  }, [checkedCount, totalNodes]);

  const nextReminder = useMemo(() => {
    if (!now) {
      return null;
    }

    const items = REMINDER_SLOTS.map((slot) => {
      const [hour, minute] = slot.split(':').map(Number);
      const next = new Date(now.getTime());

      next.setHours(hour, minute, 0, 0);

      if (next.getTime() < now.getTime()) {
        next.setDate(next.getDate() + 1);
      }

      return {
        slot,
        date: next,
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());

    const target = items[0];
    const diff = Math.max(0, Math.round((target.date.getTime() - now.getTime()) / 60000));

    return {
      slot: target.slot,
      minutes: diff,
    };
  }, [now]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesStatus = statusFilter === 'all' ? true : log.status === statusFilter;
      const matchesSlot = selectedSlot === 'ALL' ? true : log.slot === selectedSlot;
      const keyword = searchText.trim().toLowerCase();

      const matchesSearch =
        keyword.length === 0
          ? true
          : `${log.line} ${log.result} ${log.memo} ${log.assignee}`.toLowerCase().includes(keyword);

      return matchesStatus && matchesSlot && matchesSearch;
    });
  }, [logs, searchText, selectedSlot, statusFilter]);

  const latestLineLog = useMemo(() => {
    if (!activeLine) {
      return null;
    }

    return logs.find((log) => log.line === activeLine.name) ?? null;
  }, [activeLine, logs]);

  const pushToast = (title: string, body: string, tone: ToastTone = 'normal') => {
    const id = makeId();

    setToasts((prev) => {
      return [...prev, { id, title, body, tone }].slice(-4);
    });

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2400);
  };

  useEffect(() => {
    const tick = () => {
      setNow(new Date());
    };

    tick();

    const clock = window.setInterval(() => {
      tick();
    }, 1000);

    const livePulse = window.setInterval(() => {
      setBars((prev) => {
        return prev.map((value, index) => {
          const delta = Math.round(Math.sin(Date.now() / 600 + index) * 3 + (Math.random() * 4 - 2));
          return clamp(value + delta, 24, 88);
        });
      });

      setLines((prev) => {
        return prev.map((line) => {
          const delta = Math.round(Math.random() * 4 - 2);
          const low = Math.max(72, line.target - 18);
          const high = line.target + 2;

          return {
            ...line,
            throughput: clamp(line.throughput + delta, low, high),
          };
        });
      });
    }, 2200);

    const syncPulse = window.setInterval(() => {
      if (Math.random() > 0.58) {
        const randomLine = INITIAL_LINES[Math.floor(Math.random() * INITIAL_LINES.length)];

        const liveLog = createLog(
          randomLine.name,
          'normal',
          '실시간 상태 동기화',
          '센서 데이터와 점검 이력 싱크 완료',
          nearestSlot(new Date()),
          'SYSTEM',
        );

        setLogs((prev) => [liveLog, ...prev].slice(0, 14));
      }
    }, 10000);

    return () => {
      window.clearInterval(clock);
      window.clearInterval(livePulse);
      window.clearInterval(syncPulse);
    };
  }, []);

  const handleModuleSelect = (id: ModuleKey) => {
    setModuleId(id);

    const current = MODULES.find((item) => item.id === id);

    if (current) {
      pushToast('모듈 전환', `${current.title} 모듈을 기준으로 화면을 갱신했습니다.`, 'normal');
    }
  };

  const handleSlotClick = (slot: string) => {
    const nextValue = selectedSlot === slot ? 'ALL' : slot;

    setSelectedSlot(nextValue);

    pushToast(
      '시간 필터 적용',
      nextValue === 'ALL' ? '전체 시간대 보기로 전환했습니다.' : `${nextValue} 기준 이력만 표시합니다.`,
      'normal',
    );
  };

  const handleNodeSelect = (lineId: string, nodeId: string) => {
    const line = lines.find((item) => item.id === lineId);
    const node = line?.nodes.find((item) => item.id === nodeId);

    if (!line || !node) {
      return;
    }

    setSelectedLineId(lineId);
    setSelectedNodeId(nodeId);

    if (node.status === 'danger') {
      pushToast('이상 노드 선택', `${line.name} · ${node.label} 구간에 즉시 확인이 필요합니다.`, 'danger');
      return;
    }

    if (node.checked) {
      pushToast('이미 점검 완료', `${line.name} · ${node.label} 노드는 이미 확인되었습니다.`, 'normal');
      return;
    }

    setLines((prev) => {
      return prev.map((currentLine) => {
        if (currentLine.id !== lineId) {
          return currentLine;
        }

        return {
          ...currentLine,
          nodes: currentLine.nodes.map((currentNode) => {
            if (currentNode.id !== nodeId) {
              return currentNode;
            }

            return {
              ...currentNode,
              checked: true,
              metric: '수동 점검 완료',
            };
          }),
        };
      });
    });

    const newLog = createLog(
      line.name,
      'normal',
      `${node.label} 수동 점검 완료`,
      '작업자가 현장 탭에서 정상 확인 처리',
      selectedSlot === 'ALL' ? undefined : selectedSlot,
      line.owner,
    );

    setLogs((prev) => [newLog, ...prev].slice(0, 14));
    pushToast('수동 점검 반영', `${line.name} · ${node.label} 노드를 정상 처리했습니다.`, 'success');
  };

  const handleAutoInspect = () => {
    const candidate = lines
      .flatMap((line) => line.nodes.map((node) => ({ line, node })))
      .find(({ node }) => node.status === 'normal' && !node.checked);

    if (!candidate) {
      pushToast('자동 점검 완료', '추가로 자동 점검할 정상 노드가 없습니다.', 'success');
      return;
    }

    setLines((prev) => {
      return prev.map((line) => {
        if (line.id !== candidate.line.id) {
          return line;
        }

        return {
          ...line,
          nodes: line.nodes.map((node) => {
            if (node.id !== candidate.node.id) {
              return node;
            }

            return {
              ...node,
              checked: true,
              metric: 'AI 자동 점검 완료',
            };
          }),
        };
      });
    });

    setSelectedLineId(candidate.line.id);
    setSelectedNodeId(candidate.node.id);

    const newLog = createLog(
      candidate.line.name,
      'normal',
      `${candidate.node.label} 자동 점검 완료`,
      'AI 순회 점검으로 체크 상태 반영',
      selectedSlot === 'ALL' ? undefined : selectedSlot,
      'AUTO BOT',
    );

    setLogs((prev) => [newLog, ...prev].slice(0, 14));
    pushToast('자동 점검 성공', `${candidate.line.name} · ${candidate.node.label} 노드를 자동 확인했습니다.`, 'success');
  };

  const handleDemoIncident = () => {
    const candidates = lines
      .flatMap((line) => line.nodes.map((node) => ({ line, node })))
      .filter(({ node }) => node.status === 'normal');

    if (candidates.length === 0) {
      pushToast('데모 이벤트 실패', '이상 이벤트를 생성할 수 있는 정상 노드가 없습니다.', 'danger');
      return;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    setLines((prev) => {
      return prev.map((line) => {
        if (line.id !== picked.line.id) {
          return line;
        }

        return {
          ...line,
          nodes: line.nodes.map((node) => {
            if (node.id !== picked.node.id) {
              return node;
            }

            return {
              ...node,
              status: 'danger',
              checked: false,
              metric: '실시간 이상 감지',
              temp: `${(44 + Math.random() * 6).toFixed(1)}°C`,
            };
          }),
        };
      });
    });

    setSelectedLineId(picked.line.id);
    setSelectedNodeId(picked.node.id);

    const newLog = createLog(
      picked.line.name,
      'danger',
      `${picked.node.label} 이상 감지`,
      '데모 이벤트로 긴급 알림 발행',
      selectedSlot === 'ALL' ? undefined : selectedSlot,
      'AI WATCHER',
    );

    setLogs((prev) => [newLog, ...prev].slice(0, 14));
    pushToast('데모 이상 발생', `${picked.line.name} · ${picked.node.label} 노드에 이상 상태를 만들었습니다.`, 'danger');
  };

  const handleResolveAlert = () => {
    if (!activeLine || !activeNode) {
      return;
    }

    if (activeNode.status !== 'danger') {
      pushToast('정상 상태', '현재 선택한 노드는 이미 정상 상태입니다.', 'normal');
      return;
    }

    setLines((prev) => {
      return prev.map((line) => {
        if (line.id !== activeLine.id) {
          return line;
        }

        return {
          ...line,
          nodes: line.nodes.map((node) => {
            if (node.id !== activeNode.id) {
              return node;
            }

            return {
              ...node,
              status: 'normal',
              checked: true,
              metric: '조치 완료 / 정상화',
              temp: '35.6°C',
            };
          }),
        };
      });
    });

    const newLog = createLog(
      activeLine.name,
      'normal',
      `${activeNode.label} 조치 완료`,
      '정비반이 현장 조치 후 정상 상태로 복귀',
      selectedSlot === 'ALL' ? undefined : selectedSlot,
      activeLine.owner,
    );

    setLogs((prev) => [newLog, ...prev].slice(0, 14));
    pushToast('이상 처리 완료', `${activeLine.name} · ${activeNode.label} 노드를 정상화했습니다.`, 'success');
  };

  const handleHistoryFocus = (log: LogItem) => {
    const targetLine = lines.find((item) => item.name === log.line);

    if (!targetLine) {
      return;
    }

    const node = targetLine.nodes.find((item) => item.status === 'danger') ?? targetLine.nodes[0];

    setSelectedLineId(targetLine.id);
    setSelectedNodeId(node.id);
    pushToast('이력 포커스 이동', `${log.line} 관련 노드와 상세 패널을 연결했습니다.`, 'normal');
  };

  return (
    <Shell>
      <Frame>
        <TopBar>
          <BrandBlock>
            <BrandTag>SMART FACTORY</BrandTag>
            <PageTitle>현장형 스마트 순회 점검</PageTitle>
            <PageDesc>심플한 남색 다크 테마 기반 MI 실시간 관제 화면</PageDesc>
          </BrandBlock>

          <TopBarRight>
            <LiveChip>
              <LiveDot />
              LIVE
            </LiveChip>

            <ClockBadge>{now ? formatClock(now) : '--:--'}</ClockBadge>
          </TopBarRight>
        </TopBar>

        <ContentGrid>
          <Sidebar>
            <SidebarHeader>
              <SidebarTitle>시스템 구성</SidebarTitle>
              <SidebarSub>현장 입력 채널</SidebarSub>
            </SidebarHeader>

            <SidebarScroll>
              <SectionBlock>
                <SectionLabel>모듈</SectionLabel>

                <ModuleList>
                  {MODULES.map((module) => (
                    <ModuleButton
                      key={module.id}
                      type="button"
                      $active={moduleId === module.id}
                      $accent={module.accent}
                      onClick={() => handleModuleSelect(module.id)}
                    >
                      <ModuleAccent
                        $accent={module.accent}
                      />

                      <ModuleIcon>{module.icon}</ModuleIcon>

                      <ModuleText>
                        <ModuleName>{module.title}</ModuleName>
                        <ModuleDesc>{module.description}</ModuleDesc>
                      </ModuleText>
                    </ModuleButton>
                  ))}
                </ModuleList>
              </SectionBlock>

              <SectionBlock>
                <SectionLabel>타임체크 알림</SectionLabel>

                <SlotGrid>
                  {REMINDER_SLOTS.map((slot) => (
                    <SlotButton
                      key={slot}
                      type="button"
                      $active={selectedSlot === slot}
                      onClick={() => handleSlotClick(slot)}
                    >
                      {slot}
                    </SlotButton>
                  ))}
                </SlotGrid>
              </SectionBlock>

              <SectionBlock>
                <SectionLabel>빠른 실행</SectionLabel>

                <ActionGrid>
                  <PrimaryButton
                    type="button"
                    onClick={handleAutoInspect}
                  >
                    자동 점검
                  </PrimaryButton>

                  <SubtleButton
                    type="button"
                    onClick={handleDemoIncident}
                  >
                    데모 이상
                  </SubtleButton>

                  <SubtleButton
                    type="button"
                    onClick={handleResolveAlert}
                  >
                    이상 처리
                  </SubtleButton>
                </ActionGrid>
              </SectionBlock>

              <ActiveModuleCard>
                <CardEyebrow>ACTIVE MODULE</CardEyebrow>
                <ActiveTitle>{activeModule.title}</ActiveTitle>
                <ActiveDesc>{activeModule.description}</ActiveDesc>

                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>운영 효과</InfoLabel>
                    <InfoValue>{activeModule.impact}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>응답 지연</InfoLabel>
                    <InfoValue>{activeModule.latency}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </ActiveModuleCard>
            </SidebarScroll>
          </Sidebar>

          <Dashboard>
            <DashboardHeader>
              <div>
                <DashboardTitle>MI 실시간 관제 대시보드</DashboardTitle>
                <DashboardSub>라인 상태, 점검 이력, 이상 처리 현황을 한 화면에서 확인</DashboardSub>
              </div>
            </DashboardHeader>

            <StatsRow>
              <StatCard>
                <StatLabel>점검 완료율</StatLabel>
                <StatValue>{completion}%</StatValue>
                <StatHint>전체 노드 기준</StatHint>
              </StatCard>

              <StatCard>
                <StatLabel>점검 완료</StatLabel>
                <StatValue>
                  {checkedCount}/{totalNodes}
                </StatValue>
                <StatHint>수동 + 자동 점검</StatHint>
              </StatCard>

              <StatCard>
                <StatLabel>이상 노드</StatLabel>
                <StatValue>{dangerCount}건</StatValue>
                <StatHint>즉시 확인 필요</StatHint>
              </StatCard>

              <StatCard>
                <StatLabel>다음 알림</StatLabel>
                <StatValue>{nextReminder ? nextReminder.slot : '--:--'}</StatValue>
                <StatHint>{nextReminder ? formatDuration(nextReminder.minutes) : '계산 중'}</StatHint>
              </StatCard>
            </StatsRow>

            <StageGrid>
              <MainPanel>
                <MainPanelHeader>
                  <PanelTitleBlock>
                    <PanelTitle>생산 라인 현황</PanelTitle>
                    <PanelSub>
                      {selectedSlot === 'ALL' ? '전체 시간대' : `${selectedSlot} 필터 적용`} · 정상 라인{' '}
                      {healthyLineCount}/{lines.length}
                    </PanelSub>
                  </PanelTitleBlock>

                  <HeaderActions>
                    <HeaderBadge>{activeModule.title}</HeaderBadge>
                    <HeaderBadge>{selectedSlot === 'ALL' ? 'ALL' : selectedSlot}</HeaderBadge>
                  </HeaderActions>
                </MainPanelHeader>

                <OverviewStrip>
                  <GaugeCard>
                    <GaugeRing
                      style={
                        {
                          '--value': `${completion}%`,
                        } as CSSProperties
                      }
                    >
                      <GaugeInner>
                        <GaugeValue>{completion}%</GaugeValue>
                        <GaugeText>완료율</GaugeText>
                      </GaugeInner>
                    </GaugeRing>
                  </GaugeCard>

                  <OverviewGrid>
                    <OverviewItem>
                      <OverviewLabel>현재 선택 라인</OverviewLabel>
                      <OverviewValue>{activeLine?.name ?? '-'}</OverviewValue>
                    </OverviewItem>

                    <OverviewItem>
                      <OverviewLabel>담당자</OverviewLabel>
                      <OverviewValue>{activeLine?.owner ?? '-'}</OverviewValue>
                    </OverviewItem>

                    <OverviewItem>
                      <OverviewLabel>선택 노드</OverviewLabel>
                      <OverviewValue>{activeNode?.label ?? '-'}</OverviewValue>
                    </OverviewItem>

                    <OverviewItem>
                      <OverviewLabel>상태</OverviewLabel>
                      <OverviewValue
                        $tone={activeNode?.status ?? 'normal'}
                      >
                        {activeNode ? getStatusLabel(activeNode.status) : '-'}
                      </OverviewValue>
                    </OverviewItem>
                  </OverviewGrid>
                </OverviewStrip>

                <LineScroll>
                  {lines.map((line) => {
                    const hasDanger = line.nodes.some((node) => node.status === 'danger');
                    const percent = Math.round((line.throughput / line.target) * 100);

                    return (
                      <LineCard
                        key={line.id}
                        $active={selectedLineId === line.id}
                        onClick={() => setSelectedLineId(line.id)}
                      >
                        <LineHead>
                          <LineMeta>
                            <LineTitleRow>
                              <LineName>{line.name}</LineName>
                              <LineStatusBadge
                                $status={hasDanger ? 'danger' : 'normal'}
                              >
                                {hasDanger ? 'CHECK' : 'RUN'}
                              </LineStatusBadge>
                            </LineTitleRow>

                            <LineOwner>담당 {line.owner}</LineOwner>

                            <LineBar>
                              <LineBarFill
                                style={{
                                  width: `${clamp(percent, 0, 100)}%`,
                                }}
                              />
                            </LineBar>

                            <LineThroughput>
                              처리율 {line.throughput}% / 목표 {line.target}%
                            </LineThroughput>
                          </LineMeta>
                        </LineHead>

                        <NodeList>
                          {line.nodes.map((node) => (
                            <NodeButton
                              key={node.id}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleNodeSelect(line.id, node.id);
                              }}
                            >
                              <NodeCircle
                                $status={node.status}
                                $checked={node.checked}
                                $selected={selectedNodeId === node.id}
                              >
                                {node.status === 'danger' ? '!' : node.checked ? '✓' : '•'}
                              </NodeCircle>

                              <NodeLabel>{node.label}</NodeLabel>
                            </NodeButton>
                          ))}
                        </NodeList>
                      </LineCard>
                    );
                  })}
                </LineScroll>
              </MainPanel>

              <AsideColumn>
                <HistoryPanel>
                  <HistoryHeader>
                    <PanelTitleBlock>
                      <PanelTitle>점검 이력</PanelTitle>
                      <PanelSub>{filteredLogs.length}건 표시 중</PanelSub>
                    </PanelTitleBlock>
                  </HistoryHeader>

                  <SearchInput
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="라인 / 결과 / 메모 검색"
                  />

                  <FilterRow>
                    <FilterChip
                      type="button"
                      $active={statusFilter === 'all'}
                      onClick={() => setStatusFilter('all')}
                    >
                      전체
                    </FilterChip>

                    <FilterChip
                      type="button"
                      $active={statusFilter === 'normal'}
                      onClick={() => setStatusFilter('normal')}
                    >
                      정상
                    </FilterChip>

                    <FilterChip
                      type="button"
                      $active={statusFilter === 'danger'}
                      onClick={() => setStatusFilter('danger')}
                    >
                      이상
                    </FilterChip>
                  </FilterRow>

                  <HistoryScroll>
                    {filteredLogs.map((log) => (
                      <HistoryItem
                        key={log.id}
                        type="button"
                        onClick={() => handleHistoryFocus(log)}
                      >
                        <HistoryDot
                          $status={log.status}
                        />

                        <HistoryBody>
                          <HistoryTop>
                            <HistoryTime>{log.time}</HistoryTime>
                            <HistoryLine>{log.line}</HistoryLine>
                          </HistoryTop>

                          <HistoryResult>
                            {log.result}
                            <HistoryStatus
                              $status={log.status}
                            >
                              {getStatusLabel(log.status)}
                            </HistoryStatus>
                          </HistoryResult>

                          <HistoryMeta>
                            {log.assignee} · 시작 {log.start} · 종료 {log.end}
                          </HistoryMeta>

                          <HistoryMemo>{log.memo}</HistoryMemo>
                        </HistoryBody>
                      </HistoryItem>
                    ))}
                  </HistoryScroll>
                </HistoryPanel>

                <DetailPanel>
                  <DetailHeader>
                    <PanelTitleBlock>
                      <PanelTitle>선택 노드 상세</PanelTitle>
                      <PanelSub>
                        {activeLine?.name ?? '-'} · {activeNode?.label ?? '-'}
                      </PanelSub>
                    </PanelTitleBlock>

                    <DetailStatus
                      $status={activeNode?.status ?? 'normal'}
                    >
                      {activeNode ? getStatusLabel(activeNode.status) : '-'}
                    </DetailStatus>
                  </DetailHeader>

                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>상태 설명</DetailLabel>
                      <DetailValue>{activeNode?.metric ?? '-'}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>센서 온도</DetailLabel>
                      <DetailValue>{activeNode?.temp ?? '-'}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>추천 모듈</DetailLabel>
                      <DetailValue>{activeModule.title}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>최근 이력</DetailLabel>
                      <DetailValue>{latestLineLog?.result ?? '관련 이력 없음'}</DetailValue>
                    </DetailItem>
                  </DetailGrid>

                  <TrendBox>
                    <TrendLabel>실시간 센서 흐름</TrendLabel>

                    <TrendBars>
                      {bars.map((value, index) => (
                        <TrendBar
                          key={`${index}-${value}`}
                          style={{
                            height: `${value}%`,
                          }}
                        />
                      ))}
                    </TrendBars>
                  </TrendBox>

                  <NoteBox>
                    <NoteTitle>메모</NoteTitle>
                    <NoteText>{latestLineLog?.memo ?? '현재 선택한 라인에 대한 추가 메모가 없습니다.'}</NoteText>
                  </NoteBox>
                </DetailPanel>
              </AsideColumn>
            </StageGrid>
          </Dashboard>
        </ContentGrid>

        <ToastStack>
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              $tone={toast.tone}
            >
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastBody>{toast.body}</ToastBody>
            </ToastCard>
          ))}
        </ToastStack>
      </Frame>
    </Shell>
  );
}

const Shell = styled.main`
  height: 100vh;
  padding: 16px;
  background: #0b1220;
  overflow: hidden;

  @media (max-width: 1080px) {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }
`;

const Frame = styled.div`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
`;

const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const BrandTag = styled.div`
  color: #60a5fa;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
`;

const PageTitle = styled.h1`
  margin: 0;
  color: #e5eefc;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const PageDesc = styled.div`
  color: #94a3b8;
  font-size: 13px;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LiveChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  background: #0f172a;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
`;

const LiveDot = styled.span`
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: #22c55e;
    animation: ${pulse} 1.8s infinite;
  }
`;

const ClockBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  background: #0f172a;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 700;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
  height: 100%;

  @media (max-width: 1280px) {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const Sidebar = styled.aside`
  ${panelBase};
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
`;

const SidebarTitle = styled.h2`
  margin: 0;
  color: #e5eefc;
  font-size: 20px;
  font-weight: 700;
`;

const SidebarSub = styled.div`
  color: #94a3b8;
  font-size: 13px;
`;

const SidebarScroll = styled.div`
  ${scrollStyle};
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 16px;
  overflow: auto;
`;

const SectionBlock = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionLabel = styled.div`
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 700;
`;

const ModuleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ModuleButton = styled.button<{ $active: boolean; $accent: string }>`
  display: grid;
  grid-template-columns: 4px 34px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 72px;
  padding: 12px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(59, 130, 246, 0.24)' : 'rgba(148, 163, 184, 0.10)')};
  border-radius: 14px;
  background: ${({ $active }) => ($active ? '#111c34' : '#0b1528')};
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(59, 130, 246, 0.22);
  }
`;

const ModuleAccent = styled.span<{ $accent: string }>`
  width: 4px;
  height: 100%;
  border-radius: 999px;
  background: ${({ $accent }) => $accent};
`;

const ModuleIcon = styled.div`
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #162238;
  color: #dbeafe;
  font-size: 15px;
`;

const ModuleText = styled.div`
  min-width: 0;
`;

const ModuleName = styled.div`
  color: #f8fafc;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
`;

const ModuleDesc = styled.div`
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const SlotButton = styled.button<{ $active: boolean }>`
  height: 40px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(59, 130, 246, 0.26)' : 'rgba(148, 163, 184, 0.10)')};
  border-radius: 12px;
  background: ${({ $active }) => ($active ? '#162238' : '#0b1528')};
  color: ${({ $active }) => ($active ? '#dbeafe' : '#cbd5e1')};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const ActionGrid = styled.div`
  display: grid;
  gap: 8px;
`;

const PrimaryButton = styled.button`
  height: 42px;
  border: 0;
  border-radius: 12px;
  background: #2563eb;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.18s ease,
    transform 0.18s ease;

  &:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }
`;

const SubtleButton = styled.button`
  height: 42px;
  border: 1px solid rgba(148, 163, 184, 0.10);
  border-radius: 12px;
  background: #0b1528;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(148, 163, 184, 0.18);
  }
`;

const ActiveModuleCard = styled.div`
  ${panelBase};
  padding: 16px;
  background: #0b1528;
`;

const CardEyebrow = styled.div`
  color: #60a5fa;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
`;

const ActiveTitle = styled.div`
  margin-top: 10px;
  color: #f8fafc;
  font-size: 18px;
  font-weight: 700;
`;

const ActiveDesc = styled.div`
  margin-top: 8px;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.6;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
`;

const InfoItem = styled.div`
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.10);
  border-radius: 12px;
  background: #0f172a;
`;

const InfoLabel = styled.div`
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
`;

const InfoValue = styled.div`
  margin-top: 6px;
  color: #e5eefc;
  font-size: 14px;
  font-weight: 700;
`;

const Dashboard = styled.section`
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const DashboardTitle = styled.h2`
  margin: 0;
  color: #e5eefc;
  font-size: 22px;
  font-weight: 700;
`;

const DashboardSub = styled.div`
  margin-top: 4px;
  color: #94a3b8;
  font-size: 13px;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatCard = styled.div`
  ${panelBase};
  padding: 16px 18px;
`;

const StatLabel = styled.div`
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
`;

const StatValue = styled.div`
  margin-top: 8px;
  color: #f8fafc;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const StatHint = styled.div`
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
`;

const StageGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 360px;
  gap: 16px;
  min-height: 0;

  @media (max-width: 1360px) {
    grid-template-columns: minmax(0, 1fr) 340px;
  }

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const MainPanel = styled.div`
  ${panelBase};
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
`;

const MainPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
`;

const PanelTitleBlock = styled.div`
  min-width: 0;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: #f8fafc;
  font-size: 18px;
  font-weight: 700;
`;

const PanelSub = styled.div`
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const HeaderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.10);
  border-radius: 999px;
  background: #0b1528;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
`;

const OverviewStrip = styled.div`
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const GaugeCard = styled.div`
  ${panelBase};
  display: grid;
  place-items: center;
  padding: 18px;
  background: #0b1528;
`;

const GaugeRing = styled.div`
  --value: 75%;
  position: relative;
  display: grid;
  place-items: center;
  width: 120px;
  height: 120px;
  border-radius: 999px;
  background: conic-gradient(
    from -90deg,
    #3b82f6 0%,
    #3b82f6 var(--value),
    rgba(148, 163, 184, 0.14) var(--value),
    rgba(148, 163, 184, 0.14) 100%
  );

  &::after {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: 999px;
    background: #0f172a;
  }
`;

const GaugeInner = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;

const GaugeValue = styled.div`
  color: #f8fafc;
  font-size: 28px;
  font-weight: 800;
`;

const GaugeText = styled.div`
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1040px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const OverviewItem = styled.div`
  ${panelBase};
  padding: 14px;
  background: #0b1528;
`;

const OverviewLabel = styled.div`
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
`;

const OverviewValue = styled.div<{ $tone?: Status }>`
  margin-top: 8px;
  color: ${({ $tone }) => ($tone ? getStatusColor($tone) : '#f8fafc')};
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
`;

const LineScroll = styled.div`
  ${scrollStyle};
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px 18px 18px;
  overflow: auto;
`;

const LineCard = styled.div<{ $active: boolean }>`
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  padding: 14px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(59, 130, 246, 0.24)' : 'rgba(148, 163, 184, 0.10)')};
  border-radius: 14px;
  background: ${({ $active }) => ($active ? '#111c34' : '#0b1528')};
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(59, 130, 246, 0.18);
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const LineHead = styled.div`
  display: flex;
  align-items: center;
`;

const LineMeta = styled.div`
  width: 100%;
`;

const LineTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const LineName = styled.div`
  color: #f8fafc;
  font-size: 20px;
  font-weight: 700;
`;

const LineStatusBadge = styled.div<{ $status: Status }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: ${({ $status }) =>
    $status === 'danger' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(34, 197, 94, 0.14)'};
  color: ${({ $status }) => getStatusColor($status)};
  font-size: 11px;
  font-weight: 800;
`;

const LineOwner = styled.div`
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
`;

const LineBar = styled.div`
  position: relative;
  height: 8px;
  margin-top: 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  overflow: hidden;
`;

const LineBarFill = styled.div`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: #3b82f6;
`;

const LineThroughput = styled.div`
  margin-top: 8px;
  color: #cbd5e1;
  font-size: 12px;
`;

const NodeList = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
`;

const NodeButton = styled.button`
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 8px 4px;
  border: 0;
  background: transparent;
  cursor: pointer;
`;

const NodeCircle = styled.div<{ $status: Status; $checked: boolean; $selected: boolean }>`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid
    ${({ $selected, $status }) =>
      $selected
        ? 'rgba(59, 130, 246, 0.42)'
        : $status === 'danger'
          ? 'rgba(239, 68, 68, 0.26)'
          : 'rgba(148, 163, 184, 0.12)'};
  border-radius: 999px;
  background: ${({ $status, $checked }) => {
    if ($status === 'danger') {
      return 'rgba(239, 68, 68, 0.12)';
    }

    if ($checked) {
      return 'rgba(34, 197, 94, 0.10)';
    }

    return 'rgba(59, 130, 246, 0.10)';
  }};
  color: ${({ $status, $checked }) => {
    if ($status === 'danger') {
      return '#ef4444';
    }

    if ($checked) {
      return '#22c55e';
    }

    return '#60a5fa';
  }};
  font-size: 18px;
  font-weight: 800;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;

  ${NodeButton}:hover & {
    transform: translateY(-1px);
  }
`;

const NodeLabel = styled.div`
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
`;

const AsideColumn = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 16px;
  min-height: 0;
`;

const HistoryPanel = styled.div`
  ${panelBase};
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
`;

const HistoryHeader = styled.div`
  padding: 18px 18px 10px;
`;

const SearchInput = styled.input`
  margin: 0 18px 10px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.10);
  border-radius: 12px;
  background: #0b1528;
  color: #f8fafc;
  font-size: 13px;
  outline: none;

  &::placeholder {
    color: #64748b;
  }

  &:focus {
    border-color: rgba(59, 130, 246, 0.26);
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 18px 12px;
  flex-wrap: wrap;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  height: 30px;
  padding: 0 10px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(59, 130, 246, 0.26)' : 'rgba(148, 163, 184, 0.10)')};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#162238' : '#0b1528')};
  color: ${({ $active }) => ($active ? '#dbeafe' : '#cbd5e1')};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`;

const HistoryScroll = styled.div`
  ${scrollStyle};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 0 18px 18px;
  overflow: auto;
`;

const HistoryItem = styled.button`
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.10);
  border-radius: 12px;
  background: #0b1528;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(59, 130, 246, 0.18);
  }
`;

const HistoryDot = styled.span<{ $status: Status }>`
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 999px;
  background: ${({ $status }) => getStatusColor($status)};
`;

const HistoryBody = styled.div`
  min-width: 0;
`;

const HistoryTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const HistoryTime = styled.div`
  color: #f8fafc;
  font-size: 13px;
  font-weight: 700;
`;

const HistoryLine = styled.div`
  color: #94a3b8;
  font-size: 12px;
`;

const HistoryResult = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  flex-wrap: wrap;
`;

const HistoryStatus = styled.span<{ $status: Status }>`
  color: ${({ $status }) => getStatusColor($status)};
  font-size: 11px;
  font-weight: 800;
`;

const HistoryMeta = styled.div`
  margin-top: 6px;
  color: #64748b;
  font-size: 11px;
`;

const HistoryMemo = styled.div`
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
`;

const DetailPanel = styled.div`
  ${panelBase};
  padding: 18px;
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const DetailStatus = styled.div<{ $status: Status }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: ${({ $status }) => {
    if ($status === 'danger') {
      return 'rgba(239, 68, 68, 0.14)';
    }

    if ($status === 'warning') {
      return 'rgba(245, 158, 11, 0.14)';
    }

    return 'rgba(34, 197, 94, 0.14)';
  }};
  color: ${({ $status }) => getStatusColor($status)};
  font-size: 12px;
  font-weight: 800;
`;

const DetailGrid = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 16px;
`;

const DetailItem = styled.div`
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.10);
  border-radius: 12px;
  background: #0b1528;
`;

const DetailLabel = styled.div`
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
`;

const DetailValue = styled.div`
  margin-top: 6px;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
`;

const TrendBox = styled.div`
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.10);
  border-radius: 12px;
  background: #0b1528;
`;

const TrendLabel = styled.div`
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
`;

const TrendBars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 88px;
  margin-top: 12px;
`;

const TrendBar = styled.div`
  flex: 1;
  min-width: 8px;
  border-radius: 999px 999px 6px 6px;
  background: #3b82f6;
  transition: height 0.45s ease;
`;

const NoteBox = styled.div`
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.10);
  border-radius: 12px;
  background: #0b1528;
`;

const NoteTitle = styled.div`
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
`;

const NoteText = styled.div`
  margin-top: 8px;
  color: #cbd5e1;
  font-size: 12px;
  line-height: 1.6;
`;

const ToastStack = styled.div`
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 30;
  display: grid;
  gap: 8px;
  width: min(320px, calc(100vw - 32px));
`;

const ToastCard = styled.div<{ $tone: ToastTone }>`
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-left: 4px solid
    ${({ $tone }) => {
      if ($tone === 'danger') {
        return '#ef4444';
      }

      if ($tone === 'success') {
        return '#22c55e';
      }

      return '#3b82f6';
    }};
  border-radius: 12px;
  background: #111c34;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.35);
  animation: ${toastIn} 0.2s ease;
`;

const ToastTitle = styled.div`
  color: #f8fafc;
  font-size: 13px;
  font-weight: 700;
`;

const ToastBody = styled.div`
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5; 
`;