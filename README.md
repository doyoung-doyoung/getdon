# 💰 겟돈 - 계모임 관리 앱

## Vercel 배포 방법

### 1. GitHub에 올리기
```bash
git init
git add .
git commit -m "겟돈 초기 커밋"
git remote add origin https://github.com/YOUR_ID/getdon.git
git push -u origin main
```

### 2. Vercel 연결
1. vercel.com → New Project → GitHub repo 선택
2. Environment Variables 추가:
   - `NEXT_PUBLIC_ADMIN_PASSWORD` = 원하는비밀번호
3. Deploy!

### 관리자 기본 비밀번호
`getdon2025`

### 특징
- Supabase 불필요 — localStorage만 사용
- 완전 무료 Vercel 배포
- 외부 DB 없음 (브라우저에 저장)
