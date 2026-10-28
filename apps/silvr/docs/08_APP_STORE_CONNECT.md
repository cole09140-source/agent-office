# App Store Connect 입력 자료 (아티움그룹 주식회사)

iPhone 앱을 아티움그룹 주식회사 명의로 올릴 때 입력할 값입니다. 빌드는 Mac(Xcode)에서 `npm run cap:ios` 후 Archive → 업로드(`docs/04_LAUNCH_GUIDE.md` B). 스토어 문안 원문은 `docs/03_STORE_LISTING.md`.

## 0. Apple Developer Program — 조직으로 등록
| 항목 | 값 |
|------|----|
| 등록 유형 | **Organization** (개인 아님 — 개인으로 등록하면 판매자 이름이 개인 실명으로 표시됨) |
| 법적 이름 | ATIUM GROUP Co., Ltd. (아티움그룹 주식회사) — D-U-N-S 영문 이름과 똑같이 |
| D-U-N-S 번호 | Play와 같은 번호. 없으면 Apple의 D-U-N-S 조회 도구에서 요청하거나 나이스디앤비에서 발급 |
| 법적 권한 | 대표 정승익(계약 체결 권한자)이 신청하거나, 신청자가 권한을 위임받았다고 확인 |
| 회사 웹사이트 | https://muzig.ai (회사 도메인 이메일로 신청하면 심사가 빠름: play@muzig.ai) |
| 회사 주소·전화 | 경기도 성남시 분당구 판교역로192번길 16, 806호 · 010-9562-2198 (Apple 확인 전화가 올 수 있음) |
| 연회비 | US$99 |

## 1. 새 앱
| 항목 | 값 |
|------|----|
| 플랫폼 | iOS |
| 이름 | SILVR – 필름 카메라 (영어 현지화: SILVR – Film Camera) |
| 기본 언어 | 한국어 |
| 번들 ID | `app.silvr.camera` (Certificates, Identifiers & Profiles에서 먼저 등록) |
| SKU | `SILVR-IOS-001` |
| 사용자 액세스 | 전체 액세스 |

## 2. 앱 정보
| 항목 | 값 |
|------|----|
| 부제(30자) | 네거티브가 남는 필름 카메라 / The film camera that keeps your negatives |
| 카테고리 | 기본: 사진 및 비디오 · 보조: 라이프스타일(선택) |
| 저작권 | © 2026 ATIUM GROUP Co., Ltd. |
| 판매자 | ATIUM GROUP Co., Ltd. (조직 등록 시 자동 표시) |
| 개인정보 처리방침 URL | `https://<SILVR 웹 주소>/privacy.html` |
| 지원 URL | `https://<SILVR 웹 주소>/support.html` |
| 마케팅 URL(선택) | https://muzig.ai |
| 콘텐츠 권한 | 제3자 콘텐츠 없음 |
| 가격 | 무료 |

## 3. 앱 개인정보 보호 (App Privacy)
"**데이터를 수집하지 않음 (Data Not Collected)**"
- 근거: 서버·계정·분석·광고 SDK 없음. 사진·노트·위치는 기기 안에서만 처리하고, 공유·백업 파일 내보내기는 사용자가 직접 할 때만
- 개인정보 처리방침의 내용과 일치(운영자·보호책임자 기재됨)

## 4. 연령 등급 설문
폭력·성적 콘텐츠·욕설·약물·도박·공포 모두 "없음", 무제한 웹 접근 "아니요", 사용자 생성 콘텐츠 공유 기능 "아니요" → **4+**

## 5. 수출 규정(암호화)
`Info.plist`에 `ITSAppUsesNonExemptEncryption = false`가 이미 들어 있어 업로드 때마다 묻지 않습니다(표준 HTTPS 외 암호화 없음).

## 6. 버전 1.0.0 정보
| 항목 | 값 |
|------|----|
| 프로모션 텍스트·설명·키워드 | `03_STORE_LISTING.md` |
| 스크린샷 | 6.7"(1290×2796) `ios67-ko-framed/`·`ios67-en-framed/` 6장. 6.5"는 6.7"로 대체 가능 |
| 이 버전의 새로운 기능 | 첫 출시 — `07_PLAY_CONSOLE.md`의 출시 노트와 같은 문구 |
| 심사 연락처 | 정승익 · play@muzig.ai · 010-9562-2198 |
| 로그인 필요 | 아니요 |
| 심사 메모 | `03_STORE_LISTING.md`의 "심사 메모" (로그인 없음, 오프라인 동작, 카메라 거부 시 불러오기로 확인 가능, 결제 없음) |

## 7. 출시 전에 Mac에서 확인할 것
- Xcode Signing & Capabilities: Team = ATIUM GROUP Co., Ltd., 번들 ID `app.silvr.camera`
- 실제 iPhone에서 카메라·사진 저장("이미지 저장")·백업 공유 시트("파일에 저장") 확인(`docs/05_QA_REPORT.md` 남은 항목)
