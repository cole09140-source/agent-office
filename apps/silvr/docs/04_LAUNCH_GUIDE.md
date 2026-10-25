# 출시 가이드

## A. 웹(PWA) 즉시 배포 — 10분

```bash
cd apps/silvr
npm ci
npm run test:all     # typecheck + unit + build + E2E (선택, 약 8분)
npm run build        # → dist/
```

`dist/`를 HTTPS 정적 호스팅에 올리면 끝입니다(카메라 API는 HTTPS 필수). 하위 경로에서도 동작합니다(`base: './'`, 해시 라우팅).

| 호스트 | 방법 |
|--------|------|
| Cloudflare Pages | Build command `npm run build`, output `dist`, root `apps/silvr` |
| Vercel / Netlify | 동일 설정. SPA rewrite 불필요(해시 라우팅) |
| GitHub Pages | `dist/` 업로드. 정상 동작 |

**캐시 헤더 권장값**
- `sw.js`, `index.html`, `manifest.webmanifest`: `Cache-Control: no-cache`
- `assets/*` (해시 파일명): `Cache-Control: public, max-age=31536000, immutable`

Netlify 예시 `_headers`:
```
/sw.js
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

## B. iOS (App Store)

필요: macOS, Xcode 16+, Apple Developer Program 계정.

```bash
cd apps/silvr
npm ci
npm run cap:ios          # build → cap sync ios → Xcode 열기
```
Xcode에서:
1. Signing & Capabilities → Team 선택, Bundle ID `app.silvr.camera`(원하면 변경하고 `capacitor.config.json`도 같이 변경)
2. General → Version `1.0.0`, Build `1`
3. Info.plist 권한 문구는 이미 넣어 두었습니다(카메라, 사진 추가·읽기, 위치, 모션). 화면은 세로로 고정돼 있습니다.
4. Product → Archive → App Store Connect 업로드
5. App Store Connect: `docs/03_STORE_LISTING.md` 문안, 개인정보 라벨 "데이터 수집 안 함", 개인정보 처리방침 URL(웹 배포의 `/privacy.html`)

## C. Android (Google Play)

필요: Android Studio(최신), JDK 21.

```bash
cd apps/silvr
npm ci
npm run cap:android      # build → cap sync android → Android Studio 열기
```
1. `android/app/build.gradle`에서 `versionCode 1`, `versionName "1.0.0"` 확인
2. Build → Generate Signed App Bundle (.aab), 업로드 키 생성 및 보관
3. Play Console: 데이터 보안 양식 "수집·공유 데이터 없음", 콘텐츠 등급 설문, 스토어 문안 입력
4. AndroidManifest에는 CAMERA와 위치(선택) 권한, 세로 고정이 이미 설정돼 있습니다.

## D. 출시 전 체크리스트

### 지금 이 저장소에서 완료된 항목 ✅
- [x] 기능 전체 구현(결제 제외). `docs/02_PRODUCT_SPEC.md` 참조
- [x] QA 1차 10라운드 + 카메라 QA 15라운드 + 심화 QA 50라운드 통과. `docs/05_QA_REPORT.md`
- [x] 백업/복원(.zip): 기기 변경·브라우저 데이터 삭제 대비
- [x] WCAG 2.1 AA 자동 감사(axe) 전 화면 통과
- [x] PWA: 오프라인, 설치, 업데이트 배너, 아이콘, maskable, OG 이미지, CSP
- [x] iOS / Android 네이티브 프로젝트, 권한 문구, 아이콘, 스플래시
- [x] 개인정보 처리방침, 이용약관, 오픈소스 고지(`public/*.html`)
- [x] 스토어 문안 KR/EN

### 사람이 해야 하는 항목 ⏳
- [ ] **실기기 QA**(필수): iPhone(iOS 16~18)과 Android 2대 이상에서 카메라, 플래시(토치), 가로 촬영 회전, 공유, 사진 앱 저장을 확인. 이 환경에는 실제 기기가 없어 가상 카메라로만 검증했습니다.
- [ ] 개인정보 처리방침의 연락처 `privacy@silvr.app`를 실제 주소로 교체
- [ ] 앱 이름 "SILVR" 상표 검색(KIPRIS, USPTO). 충돌 시 `capacitor.config.json`, `manifest.webmanifest`, i18n 문자열 변경
- [ ] 실사 스크린샷 촬영(문안의 6컷 구성 참고)
- [ ] 웹 배포 도메인 확정 후 `index.html`의 `og:image`를 절대 URL로 변경(SNS 미리보기용)
- [ ] (선택) 결제: `src/entitlements.ts` 교체. RevenueCat Capacitor SDK 권장

## E. 운영 팁
- 필름 렌더링 수식을 바꾸면 `src/film/resolve.ts`의 `RENDER_VERSION`을 올리세요. 기존 사진이 새 수식으로 자동 재현상됩니다(원본은 보존).
- 새 필름 추가: `src/film/stocks.ts`에 항목 추가, `src/i18n.ts`의 `stockKo/stockEn`에 설명 추가. 단위 테스트가 LUT 단조성과 범위를 자동 검증합니다.
- 아이콘 변경: `public/icons/icon.svg` 수정 후 `npm run icons`(웹, 네이티브 아이콘, 스플래시 일괄 재생성)
