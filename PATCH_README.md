# detail-app 패치 v5.1 — API Key 수정 (2026-03-14)

## 교체 파일

⚠️ 이번 라운드에서는 **App.tsx + geminiService.ts 2개만** 변경됨.
이전 v5에서 교체한 ResultPreview.tsx, index.html, types.ts는 그대로 유지.

```
src/App.tsx                       ← 교체 (API 키 UI + 옵션 파일명)
src/services/geminiService.ts     ← 교체 (getApiKey 헬퍼)
```

## 문제 원인
`window.aistudio`는 Google AI Studio 전용 API.
Vercel 배포에서는 존재하지 않음 → `hasApiKey` 영원히 false → 버튼 클릭 무반응.

## 수정 내용

### App.tsx
1. **API 키 화면에 수동 입력 필드 추가**
   - password 타입 input + "시작하기" 버튼
   - 입력한 키는 `window.__GEMINI_API_KEY__`에 저장
   - AI Studio 환경이면 기존 방식 유지

2. **자동 감지 로직**
   - `window.aistudio` 있으면 → AI Studio 모드
   - `process.env.API_KEY` 있으면 (Vercel 환경변수) → 자동 통과
   - 둘 다 없으면 → 수동 입력 화면

3. **에러 핸들러 개선**
   - API Key 만료/무효 시 → 키 초기화 + 입력 화면으로 돌아감
   - `window.aistudio.openSelectKey()` 호출 제거 (Vercel에서 에러 방지)

### geminiService.ts
- `getApiKey()` 헬퍼 함수 추가
- 런타임 키(`__GEMINI_API_KEY__`) → 빌드 시 키(`process.env.API_KEY`) → 에러 순서로 조회
- 모든 `new GoogleGenAI({ apiKey: ... })` 호출에 적용

## Vercel 환경변수 설정 (선택)
수동 입력 없이 자동 통과하려면:
1. Vercel Dashboard → Settings → Environment Variables
2. `GEMINI_API_KEY` = [실제 API 키] 추가
3. Redeploy

이렇게 하면 빌드 시 vite.config.ts가 process.env.API_KEY로 주입 → 자동 통과.
