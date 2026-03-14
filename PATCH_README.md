# detail-app 패치 v3 (2026-03-14)

## 파일 교체
```
src/components/ResultPreview.tsx  ← 교체
src/services/geminiService.ts     ← 교체
src/types.ts                      ← 교체
```

## v3 수정 요약

### 글씨 잘림 — 기존 섹션 포함 전체 폰트 축소
| 섹션 | 항목 | 변경 전 | 변경 후 |
|------|------|---------|---------|
| HERO | 상품명 (mainHook) | text-6xl | text-4xl |
| STORY | 감성 문구 | text-4xl | text-2xl |
| POINTS | 섹션 제목 | text-6xl | text-4xl |
| POINTS | 서브 제목 | text-4xl | text-xl |
| POINTS ZIGZAG | 포인트 제목 | text-5xl | text-3xl |
| POINTS ZIGZAG | 포인트 설명 | text-2xl | text-lg |
| POINTS CARDS | 포인트 제목 | text-4xl | text-2xl |
| POINTS SIMPLE | 포인트 제목 | text-4xl | text-2xl |
| MD's Pick | 본문 | text-4xl | text-2xl |
| INFO Check Point | 헤더 | text-4xl | text-2xl |
| INFO sizeTip | 본문 | text-3xl | text-xl |

### 후기 섹션 개선
- 제목 아래 별도 줄: ★★★★★ 평점 4.9 / 5.0
- 후기 기본 텍스트 2~3줄로 변경 (더 자연스럽게)
- 폰트: text-sm (글씨 잘림 방지)

### 추천 섹션 디자인 전면 교체
- 이모지(🎯) 제거
- 배경색 칩/라운드 아이콘 제거
- 깔끔한 ✓ 리스트 + border-bottom 구분선
- max-w-2xl 중앙정렬
- text-sm 폰트

### 세탁 가이드(PRODUCT_GUIDE) 기본 비표시
- planTypeMap에서 'GUIDE' 매핑 주석처리
- planSections에 GUIDE 타입이 없으면 섹션 자체가 안 나옴

### AI 수정 프롬프트 (geminiService.ts)
- ONE version only, 서론/옵션번호 절대 금지
- 후처리: [MD's Pick], 옵션 1., (추천), --- 자동 제거

### 옵션 파일명
- App.tsx에 이미 fileName: file.name 존재 (212줄)
- ResultPreview에서 정상 수신 시 파일명 표시
- 미수신 시 fallback: "컬러 N" + console.warn 디버그
- ⚠️ 배포된 App.tsx가 최신인지 확인 필요

## types.ts 추가 타입
- PlanSection (기획안 섹션)
- ProductInfoDisclosure (상품 정보고시)
