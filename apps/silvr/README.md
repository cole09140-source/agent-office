# SILVR — Film Camera

네거티브가 남는 필름 카메라. PWA + iOS/Android(Capacitor).

- 롤 단위 촬영(카메라별 장수) → 현상소(즉시/1시간/내일 9시/3일) → 앨범
- **다크룸 재현상**: 원본 네거티브를 보존하므로 필름, 증감현상, 만료도, 입자, 할레이션, 빛샘, 테두리를 언제든 다시 조절
- **카메라 14종**: 하프프레임, 4렌즈, 이중 노출, 인스턴트, 일회용(플래시 충전), 어안, 시네마스코프, 파노라마, CCD 디카, 픽셀 카메라 등 각자 다른 촬영 방식과 렌즈
- 오리지널 필름 16종, 밀착 인화, Sunny 16 노출계, 실제 필름 촬영 노트(CSV)
- 계정·서버·추적 없음. 모든 데이터는 기기에만 저장하고, **백업 파일(.zip)로 내보내기/복원** 가능

## 문서
| 문서 | 내용 |
|------|------|
| [docs/01_COMPETITIVE_ANALYSIS.md](docs/01_COMPETITIVE_ANALYSIS.md) | 국내외 상위 10개 앱 분석과 차별화 전략 |
| [docs/02_PRODUCT_SPEC.md](docs/02_PRODUCT_SPEC.md) | 기능 명세, 카메라 14종, 필름 16종, 데이터 모델, 결제 연동 지점 |
| [docs/03_STORE_LISTING.md](docs/03_STORE_LISTING.md) | App Store / Google Play 문안(KR/EN) |
| [docs/04_LAUNCH_GUIDE.md](docs/04_LAUNCH_GUIDE.md) | 웹, iOS, Android 배포 절차와 출시 체크리스트 |
| [docs/05_QA_REPORT.md](docs/05_QA_REPORT.md) | QA 결과: 1차 10라운드, 카메라 15라운드, 심화 50라운드, 출시 준비 점검 |
| [docs/06_TRADEMARK_SEARCH.md](docs/06_TRADEMARK_SEARCH.md) | "SILVR" 상표 1차 조사(KR·US·EU)와 대체 이름 후보 |

## 개발

```bash
npm ci
npm run dev          # http://localhost:5173 (카메라는 localhost 또는 HTTPS에서만 동작)
npm run typecheck
npm test             # 단위 테스트 (vitest)
npm run build && npm run test:e2e   # E2E (Playwright, 가상 카메라)
npm run test:all     # 전체
```

## 구조

```
src/
  film/        필름 엔진: stocks(16종), resolve(현상 레시피→LUT), shader(WebGL2), glRenderer,
               cpuRender(CPU 레퍼런스/폴백), develop(현상 파이프라인·큐), overlays(날짜·테두리·먼지), contactSheet
  cameras/     카메라 14종 정의(models), 촬영 합성(compose), 카메라 선택 패널, 본체 SVG, 뷰파인더 오버레이, 셔터음
  camera/      getUserMedia 제어, 캡처·가져오기, 기울기 기반 회전
  store/       IndexedDB: 롤·사진·블롭(원자적 트랜잭션), 설정, 필름 노트, 백업(zip)
  screens/     Camera, Lab, Gallery, Roll, Photo, Darkroom, Analog, Settings, Onboarding
  state/       signals 상태, 해시 라우터
  platform/    공유/저장(Web Share·Capacitor), PWA, 진동
  companion/   Sunny 16 계산
  entitlements.ts  결제 연동 지점 (PAYMENTS_ENABLED=false)
public/        manifest, 아이콘, 개인정보·약관·라이선스
ios/ android/  Capacitor 네이티브 프로젝트
tests/ e2e/    vitest / Playwright
scripts/       아이콘·스플래시 생성, 스토어 스크린샷(store-shots), Android 기기 검수(android-qa, android-release-smoke)
```
