# SILVR 제품 명세 (v1.0)

> "찍는 순간은 필름처럼, 고르는 건 나중에." — 네거티브가 남는 필름 카메라

## 1. 플랫폼 · 기술

| 항목 | 내용 |
|------|------|
| 배포 형태 | ① PWA (웹, 설치형·오프라인) ② iOS / Android 앱 (Capacitor 8 래핑, `ios/`, `android/` 포함) |
| 프론트엔드 | Preact 10 + @preact/signals, TypeScript, Vite 5 |
| 필름 엔진 | WebGL2 프래그먼트 셰이더(실시간 미리보기·현상) + 동일 수식 CPU 레퍼런스(폴백·테스트) |
| 저장소 | IndexedDB (원본 네거티브·현상본·썸네일·롤·노트·설정), 서버·계정 없음 |
| 번들 | 메인 JS ≈ 47 KB gzip, CSS ≈ 5 KB gzip |
| 언어 | 한국어 / English (시스템 자동 감지, 설정에서 변경) |

## 2. 기능 목록

### 2.1 카메라
- 실시간 GPU 필름 미리보기 (톤커브 LUT, 크로스토크, 채도, 스플릿톤, 할레이션, 블룸, 비네팅, 색수차, 빛샘, ISO 연동 그레인)
- 롤 넣기: 필름 12종 중 선택, 12/24/36장, 남은 장수 카운터
- 비율 3:2 / 4:3 / 1:1, 1×/2× 줌, 3초·10초 타이머, 격자, 날짜 각인 토글
- 플래시: 후면은 토치, 전면은 화면 플래시. 현상 시 "플래시 룩"(중앙 광량, 깊은 비네팅) 적용
- 전면/후면 전환, 전면 좌우 반전 저장(설정)
- 셔터음·필름 감는 소리(WebAudio 합성), 진동
- 가로로 들고 찍은 사진 자동 회전(기기 기울기 센서), 다크룸 수동 회전
- 카메라 권한 거부·미지원 시 안내와 "사진 불러와 현상하기" 대체 경로
- WebGL2 미지원 기기: 일반 비디오 미리보기 + CPU 현상

### 2.2 현상소 (Lab)
- 롤 완료 또는 되감기 시 현상 속도 선택: 즉시 / 1시간 / 내일 아침 9시 / 3일
- 진행률·남은 시간 표시, 완료 시 앱 내 알림(토스트 + 바로가기), 탭 배지
- "지금 바로 현상"(Rush). 향후 Pro 혜택 후보이며 현재는 무료

### 2.3 앨범
- 현상된 롤 목록(커버, 날짜, 컷 수, NEW 배지), 롤별 그리드
- 사진 뷰어: 스와이프/화살표 이동, 공유(Web Share·네이티브 공유 시트), 저장, 정보, 삭제
- 밀착 인화(Contact Sheet): 롤 전체를 35mm 스트립 한 장으로 미리보기 → 공유/저장
- 사진 불러오기: 여러 장 선택 → 필름 선택 → 즉시 현상 롤 생성 (EXIF 회전 반영, 손상 파일은 건너뜀)

### 2.4 다크룸 (재현상, 비파괴)
- 원본 네거티브 보존. 필름 교체, 증감현상 −2 ~ +2 EV, 유효기간 경과(0 ~ 30년), 입자, 할레이션
- 빛샘 켜기/끄기와 다른 패턴 재추첨, 플래시 룩, 날짜 각인, 테두리(없음 / 35mm / 인스턴트 / 인화지), 회전
- 길게 눌러 원본 비교, 초기화, 롤 전체에 적용

### 2.5 아날로그 컴패니언
- Sunny 16 노출 계산기: 빛 10단계 × ISO 50 ~ 3200 × 조리개 f/1.4 ~ 22 × 보정 ±3. 셔터 속도와 EV, 삼각대 권장, 범위 초과 경고
- 필름 촬영 노트: 실제 롤(카메라, 필름, ISO, 장수) → 컷별 조리개, 셔터, 렌즈, 메모, 시간, 선택 위치. CSV 내보내기(엑셀 호환 BOM)

### 2.6 설정
- 언어, 셔터음, 진동, 격자, 전면 반전, 새 컷 날짜 각인, 날짜 형식(YMD/MDY/DMY), 기본 롤 장수, 기본 현상 속도
- 저장 공간 사용량, 저장소 보호(persist), 홈 화면 설치, 개인정보 처리방침, 이용약관, 오픈소스 라이선스, 소개 다시 보기, 버전, 모든 데이터 삭제

### 2.7 PWA · 운영
- 서비스워커 전체 프리캐시(오프라인 동작), 새 버전 감지 → "새로고침" 배너
- 매니페스트(standalone, maskable 아이콘, 바로가기), OG 이미지, CSP
- 여러 탭 동시 사용 시 BroadcastChannel로 동기화
- iOS Safari 탭 사용자에게 1회 홈 화면 추가 안내(7일 저장소 삭제 정책 대응)

## 3. 필름 스톡 (12종, 모두 자체 명칭)

| ID | 이름 | 계열 | 무료/PRO | 특징 |
|----|------|------|----------|------|
| sunny200 | Sunny 200 | 컬러 네거 | 무료 | 따뜻한 노랑, 일상 스냅 |
| muse400 | Muse 400 | 컬러 네거 | 무료 | 인물, 부드러운 피부톤 |
| mint400 | Mint 400 | 컬러 네거 | 무료 | 그늘의 초록빛 |
| snap800 | Snap 800 | 일회용 | 무료 | 플래시, 비네팅, 빛샘 30% |
| mono400 | Mono 400 | 흑백 | 무료 | 강한 대비와 입자, 35mm 테두리 |
| insta600 | Insta 600 | 인스턴트 | 무료 | 1:1, 흰 테두리, 바랜 색 |
| neon800t | Neon 800T | 시네마 텅스텐 | PRO | 붉은 할레이션 |
| velvet50 | Velvet 50 | 슬라이드 | PRO | 고채도, 고대비 |
| chrome100 | Chrome 100 | 슬라이드 | PRO | 차갑고 맑은 톤 |
| silver100 | Silver 100 | 흑백 | PRO | 고운 입자 |
| dream160 | Dream 160 | 컬러 네거 | PRO | 저대비 파스텔 |
| expired98 | Expired '98 | 만료 필름 | PRO | 마젠타 포그, 먼지 |

> 결제가 꺼져 있어(`PAYMENTS_ENABLED = false`) PRO 필름도 모두 무료이며 PRO 배지는 숨겨져 있습니다.

## 4. 데이터 모델

```
Roll   { id, kind: camera|import, stockId, capacity, shots, aspect, status: loaded|developing|developed,
         createdAt, finishedAt?, readyAt?, seenAt?, coverPhotoId? }
Photo  { id, rollId, frame, takenAt, width, height, develop: DevelopSettings, printKey?, printW?, printH? }
DevelopSettings { stockId, push, expired, grain, halation, leak(seed|null), flash, dateStamp, border, seed, rotate? }
blobs  `${photoId}:neg` (원본, JPEG 0.95, 최대 4096px) · `:print` (현상본, 최대 3600px) · `:thumb` (540px)
LogRoll / LogFrame (아날로그 노트), kv(settings, lastStock, iosHint)
```
- 현상본은 `developKey(recipe)+dateFormat` 기준 캐시. 레시피가 바뀌면 자동 재현상. `RENDER_VERSION` 증가 시 전체 재현상

## 5. 결제 연동 지점 (미구현)
- `src/entitlements.ts`: `PAYMENTS_ENABLED`, `hasPro()`, `canUse(feature)`, `canUseStock(stock)`
- 권장 방식: RevenueCat Capacitor SDK (iOS StoreKit 2 / Google Play Billing), 웹은 Stripe Checkout
- 게이트 대상: `proStocks`(PRO 필름), `rushDevelop`(즉시 현상) 등. 결제를 붙일 때 StockCard 선택 시 `canUseStock()`이 false면 페이월로 보내는 UI를 추가
