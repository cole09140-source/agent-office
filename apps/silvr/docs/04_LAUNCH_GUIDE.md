# 출시 가이드

## A. 웹(PWA) 즉시 배포 — 10분

```bash
cd apps/silvr
npm ci
npm run test:all     # typecheck + unit + build + E2E (선택, 약 25분)
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
npm run build && npx cap sync android
cd android
./gradlew assembleRelease bundleRelease   # → app/build/outputs/apk/release, bundle/release
```
1. **업로드 키**: `android/keystore/silvr-upload.jks` + `android/keystore.properties`(storeFile·storePassword·keyAlias·keyPassword). 둘 다 git에서 제외돼 있고, 없으면 릴리스가 서명되지 않은 채로 빌드됩니다. 원본은 별도 백업(2026-10-28 생성분은 `Desktop\클로드코드\_결과물\SILVR_안드로이드\서명키_백업`)
2. 릴리스는 R8 코드 축소·리소스 축소가 켜져 있습니다(앱 전용 플러그인은 Capacitor 규칙으로 보존). 출시 전 `scripts/android-release-smoke.mjs`로 서명본을 기기에서 확인
3. 버전: `android/app/build.gradle`의 `versionCode`(올릴 때마다 +1)·`versionName`
4. Play Console: Play 앱 서명 사용(권장), `.aab` 업로드, 데이터 보안 양식 "수집·공유 데이터 없음", 콘텐츠 등급 설문, 스토어 문안·스크린샷 입력
5. 앱 전용 네이티브 코드: `GalleryPlugin.java`(사진을 `Pictures/SILVR`에 저장, Android 10+ MediaStore·7~9 저장소 권한). 매니페스트: 카메라·위치(선택)·진동·저장소(28 이하), 자동 백업 끔(`allowBackup=false`), 세로 고정

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
- [x] 개인정보 처리방침·이용약관에 운영자(아티움그룹 주식회사)와 보호책임자·연락처(play@muzig.ai) 기재 (2026-10-28)
- [x] 상표 1차 조사: `docs/06_TRADEMARK_SEARCH.md`. 한국·미국 낮음~중간, EU·호주 중간~높음(Silvr Group 등 9류 등록). 출원 전 변리사 검토 권장, 이름 유지 여부는 결정 필요
- [x] 스토어 스크린샷: 6컷 × (iPhone 6.7" 1290×2796 · Android 1080×1920) × (한·영), 문구 프레임 포함(`scripts/store-shots/`, 아래 F). 장면 사진은 AI로 만든 이미지 → 실제 사진으로 바꾸려면 사진만 바꿔 다시 실행
- [x] Android 에뮬레이터 검수(Android 15): 디버그 21항목, 서명된 릴리스 6단계 통과
- [x] Android 릴리스: 업로드 키 서명 APK·AAB(`Desktop\클로드코드\_결과물\SILVR_안드로이드`)
- [ ] **실기기 QA**(필수): `SILVR-1.0.0-release.apk`를 Android 폰 2대 이상에 설치해 카메라, 플래시(토치), 가로 촬영 회전, 공유, 사진 앱 저장 확인. iPhone(iOS 16~18)은 Mac에서 `npm run cap:ios`로 빌드 후 확인
- [ ] 웹 배포 도메인 확정 후 `index.html`의 `og:image`를 절대 URL로 변경(SNS 미리보기용)
- [ ] (선택) 결제: `src/entitlements.ts` 교체. RevenueCat Capacitor SDK 권장

## F. 출시 도구
```bash
# 스토어 스크린샷: 장면 사진 → 가상 카메라 영상 → 4세트 촬영 → 문구 프레임
node scripts/store-shots/make-scene.mjs <out.y4m> alley.png seaside.png cafe.png neon.png
npm run build
SCENE=<out.y4m> OUT=<저장 폴더> npx playwright test -c scripts/store-shots/store-shots.config.ts
node scripts/store-shots/frame.mjs <저장 폴더>

# Android 실기기·에뮬레이터 검수(디버그 APK 설치 후, adb 연결) — 21항목
node scripts/android-qa.mjs <adb 기기 이름> <캡처 폴더>
# 서명된 릴리스 APK 스모크(앱을 지우고 설치함) — 6단계
node scripts/android-release-smoke.mjs <adb 기기 이름> <app-release.apk> <캡처 폴더>
```
디버그 APK 빌드: `npm run build && npx cap sync android` 후 `android/`에서 `gradlew assembleDebug`(JDK 21, Android SDK). 경로에 한글이 있으면 Gradle이 거부하므로 `subst`로 영문 드라이브를 연결해 빌드합니다.

## E. 운영 팁
- 필름 렌더링 수식을 바꾸면 `src/film/resolve.ts`의 `RENDER_VERSION`을 올리세요. 기존 사진이 새 수식으로 자동 재현상됩니다(원본은 보존).
- 새 필름 추가: `src/film/stocks.ts`에 항목 추가, `src/i18n.ts`의 `stockKo/stockEn`에 설명 추가. 단위 테스트가 LUT 단조성과 범위를 자동 검증합니다.
- 아이콘 변경: `public/icons/icon.svg` 수정 후 `npm run icons`(웹, 네이티브 아이콘, 스플래시 일괄 재생성)
