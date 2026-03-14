# detail-app 패치 v2 (2026-03-14)

## 파일 교체 경로
```
cusomelab/detail-app/src/
├── components/ResultPreview.tsx  ← 교체
├── services/geminiService.ts     ← 교체
└── types.ts                      ← 교체
```

## v2 수정 내역 (스크린샷 피드백 6건 반영)

### 1. 글씨 잘림 해결
- 모든 신규 섹션 제목: text-5xl → text-3xl
- 본문/항목: text-2xl → text-base~text-lg
- 리뷰 카드: text-xl → text-base
- 전체 padding/margin 축소

### 2. 문단 줄바꿈 → splitContentItems() 스마트 파서 추가
- "1. 항목A / 2. 항목B / 3. 항목C" 패턴 자동 분리
- 줄바꿈 번호 리스트 자동 분리
- 번호 prefix 자동 제거
- REVIEW, RECOMMEND, PRODUCT_GUIDE, CAUTION_NOTE 모두 적용

### 3. AI 수정 프롬프트 전면 재작성
- ONE version only, no alternatives
- 서론/옵션번호/MD's Pick 라벨 후처리 제거
- temperature 0.85 → 0.8

### 4. 리뷰 3개 보장
- 3개 미만이면 기본 리뷰 자동 보충

### 5. 옵션 텍스트 개선
- fallback: "옵션 설명을 입력하세요" → "컬러 1"
- fileName 누락 시 console.warn 디버그

### 6. 세탁 가이드 개선
- 세탁 기호 이미지 업로드 슬롯 추가 (편집 모드)
- 제목: "제품 관리 가이드"

## App.tsx 주의사항
옵션 이미지가 파일명 대신 "컬러 N"으로 나오면
App.tsx processedImages에 fileName: file.name 전달 확인 필요
