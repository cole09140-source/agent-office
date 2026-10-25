# SILVR — Film Camera

네거티브가 남는 필름 카메라. PWA + iOS/Android(Capacitor).

- 롤 단위 촬영(12/24/36) → 현상소(즉시/1시간/내일 9시/3일) → 앨범
- **다크룸 재현상**: 원본 네거티브를 보존하므로 필름, 증감현상, 만료도, 입자, 할레이션, 빛샘, 테두리를 언제든 다시 조절
- 12가지 오리지널 필름, 밀착 인화, Sunny 16 노출계, 실제 필름 촬영 노트(CSV)
- 계정·서버·추적 없음. 모든 데이터는 기기에만 저장

## 문서
| 문서 | 내용 |
|------|------|
| [docs/01_COMPETITIVE_ANALYSIS.md](docs/01_COMPETITIVE_ANALYSIS.md) | 국내외 상위 10개 앱 분석과 차별화 전략 |
| [docs/02_PRODUCT_SPEC.md](docs/02_PRODUCT_SPEC.md) | 기능 명세, 필름 스톡, 데이터 모델, 결제 연동 지점 |
| [docs/03_STORE_LISTING.md](docs/03_STORE_LISTING.md) | App Store / Google Play 문안(KR/EN) |
| [docs/04_LAUNCH_GUIDE.md](docs/04_LAUNCH_GUIDE.md) | 웹, iOS, Android 배포 절차와 출시 체크리스트 |
| [docs/05_QA_REPORT.md](docs/05_QA_REPORT.md) | QA 10라운드 결과 |

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
  film/        필름 엔진: stocks(12종), resolve(현상 레시피→LUT), shader(WebGL2), glRenderer,
               cpuRender(CPU 레퍼런스/폴백), develop(현상 파이프라인·큐), overlays(날짜·테두리·먼지), contactSheet
  camera/      getUserMedia 제어, 캡처·가져오기, 기울기 기반 회전
  store/       IndexedDB: 롤·사진·블롭, 설정, 필름 노트
  screens/     Camera, Lab, Gallery, Roll, Photo, Darkroom, Analog, Settings, Onboarding
  state/       signals 상태, 해시 라우터
  platform/    공유/저장(Web Share·Capacitor), PWA, 사운드·진동
  companion/   Sunny 16 계산
  entitlements.ts  결제 연동 지점 (PAYMENTS_ENABLED=false)
public/        manifest, 아이콘, 개인정보·약관·라이선스
ios/ android/  Capacitor 네이티브 프로젝트
tests/ e2e/    vitest / Playwright
```
