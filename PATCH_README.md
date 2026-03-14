# detail-app 패치 v5 FINAL (2026-03-14)

## 파일 교체 (5개)
```
cusomelab/detail-app/
├── index.html                        ← 교체 (프리미엄 폰트 추가)
├── src/
│   ├── App.tsx                       ← 교체 (★ 옵션 파일명 근본 수정)
│   ├── types.ts                      ← 교체 (PlanSection, ProductInfoDisclosure)
│   ├── components/
│   │   └── ResultPreview.tsx         ← 교체
│   └── services/
│       └── geminiService.ts          ← 교체
```

## 핵심 수정 요약

### ★ 옵션 파일명 근본 해결 (App.tsx)
**원인**: forEach로 setProcessedImages를 여러 번 호출 → React batching 타이밍에 따라
ResultPreview useEffect가 중간 상태에서 실행 → 옵션 이미지 아직 없음 → fallback 표시

**해결**: 모든 이미지(main + detail + option)를 배열에 모은 후 
`setProcessedImages(allImages)` 한 번에 세팅.
ResultPreview useEffect가 최종 완성된 images로 1회만 실행됨.

### HERO 상단 상품명 표시
- NEW ARRIVAL COLLECTION (text-xs 연한 영문)
- **상품명** (text-3xl font-black)
- 카피 문구 (text-lg 회색)

### 프리미엄 폰트 Noto Serif KR
- index.html에 Google Fonts 추가
- .font-premium CSS 클래스 + tailwind config
- 리뷰/추천/사이즈 등 제목에 자동 적용
- 에디터에서도 "프리미엄 (세리프)" 옵션 선택 가능

### 리뷰 디자인 (── Real Review ──)
- 영문 구분선 + 세리프 제목
- 별점 4.9/5.0 별도 줄
- 왼쪽 보더라인 카드 (border-l-4)
- "후기N:" 접두사 + 따옴표 자동 제거

### 추천 디자인 (── For You ──)
- 영문 구분선 + 세리프 제목
- 번호 뱃지(01,02) + 카드형 레이아웃

### 정보고시 항상 표시
- infoDisclosure props 없어도 기본 데이터로 표시

### AI 수정 서론 제거 강화
- geminiService.ts: ONE version only 프롬프트
- stripMarkdown: AI 서론 패턴 제거

### 기타
- MARKETPIA 텍스트 축소 (text-xs)
- 세탁가이드(PRODUCT_GUIDE) 기본 비표시
- 전체 폰트 사이즈 정리 (text-6xl → text-4xl 등)
