# detail-app 패치 v4 (2026-03-14)

## 파일 교체
```
src/components/ResultPreview.tsx  ← 교체
src/services/geminiService.ts     ← 교체 (⚠️ 반드시 배포 확인)
src/types.ts                      ← 교체
```

## v4 수정 요약

### 1. 정보고시 항상 표시
- infoDisclosure props 없어도 editableCopy의 기본 데이터로 표시
- 제품명, 원산지, 소재 등 기본 정보가 항상 나옴
- FASHION 카테고리: 세탁방법 기본값 자동 적용

### 2. 후기 "후기1:" 접두사 제거 + 제목 크기 UP
- splitContentItems에서 "후기N:" 패턴 자동 제거
- 따옴표('') 자동 제거
- 제목: text-3xl font-black (더 크고 눈에 띄게)

### 3. 추천 섹션 디자인 개선
- 번호(01, 02...) + 테마색 원형 뱃지 + 카드 레이아웃
- 각 항목이 독립 카드로 분리 표시
- 3가지 디자인 무드 모두 지원

### 4. AI 수정 문구 - 이중 방어
- stripMarkdown: "요청하신 규칙에 맞춰" 등 AI 서론 패턴 제거 추가
- geminiService.ts: ONE version only 프롬프트 (⚠️ 반드시 배포 필요)

### 5. MARKETPIA 박스 축소
- text-xl → text-xs, 색상 연하게 (text-gray-300)
- margin 축소 (mt-12 → mt-8)

### 6. splitContentItems 강화
- "후기N:" 접두사 제거
- 따옴표 자동 제거
- ". N. " 패턴 (마침표 뒤 번호) 분리 추가

## ⚠️ 중요 확인사항

### geminiService.ts 배포 확인
AI 수정 시 "세 가지 버전으로 재작성해 드립니다" 같은 서론이 나오면
geminiService.ts가 제대로 배포되지 않은 것입니다.
GitHub에 push 후 Vercel 빌드 완료를 확인하세요.

### 옵션 파일명 문제
App.tsx 212줄에 fileName: file.name이 있습니다.
배포된 App.tsx가 최신인지 확인하세요.
Vercel에서 빌드 로그 확인 → 최신 commit이 배포되었는지 체크.
