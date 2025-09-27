# 절대색감 게임 🎨

미세한 색상 차이를 구별하는 웹 게임입니다.

## 게임 규칙

- 60초 내에 최대한 많은 레벨을 클리어하세요
- 타일 중에서 색이 다른 하나를 찾아 클릭하세요
- 레벨이 올라갈수록 타일 개수가 늘어나고 색상 차이가 줄어듭니다

## 기능

- 🎯 실시간 랭킹 시스템 (Supabase)
- 🏆 TOP 10 리더보드 with 메달 시스템
- 📱 완전 반응형 디자인 (웹/모바일)
- 🎨 PWA 지원 (홈 화면 추가 가능)
- 🔒 보안 강화 (Rate limiting, Input validation)

## 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정해주세요:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
```

## 보안 기능

- ✅ Rate limiting (1분에 10회 제한)
- ✅ 입력값 검증 및 살니티제이션
- ✅ XSS 방지
- ✅ API 키 환경변수 보호
- ✅ 비정상 점수 탐지
- ✅ 스팸 방지 로직

## 배포

이 프로젝트는 Vercel로 배포할 수 있습니다.

```bash
npx vercel
```

## 로컬 실행

```bash
npm start
```

또는 간단히 `index.html` 파일을 브라우저에서 열어주세요.

## 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript
- **백엔드**: Vercel Serverless Functions
- **데이터베이스**: Supabase (PostgreSQL)
- **배포**: Vercel
- **보안**: Rate limiting, Input validation, XSS protection