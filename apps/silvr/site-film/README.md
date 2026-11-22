# muzig.ai/film — Film Camela 소개 페이지

정적 파일만 있어요(빌드 없음). muzig.ai 운영 서버(muzig-front, Vite SPA + nginx)에 이렇게 올립니다.

| 이 폴더 | muzig-front 에 둘 곳 | 주소 |
|---|---|---|
| `index.html`, `img/` | `public/film/index.html`, `public/film/img/` | https://muzig.ai/film/ |
| `app-ads.txt` | `public/app-ads.txt` | https://muzig.ai/app-ads.txt (AdMob 앱 인증용, 루트에 있어야 함) |

- 배포 후 확인: `/film`(끝 슬래시 없음)도 `/film/` 로 열리는지 — nginx 가 SPA 로 넘겨 404 화면이 뜨면 `location = /film { return 301 /film/; }` 추가.
- `app-ads.txt` 는 `text/plain` 으로 200 이 나와야 AdMob 이 읽음(SPA index.html 이 나오면 실패).
- 미리보기: 루트 `.claude/launch.json` 의 `film-site`(포트 8842).
- 스크린샷 6번(아날로그)은 실제 상표(Nikon·Portra)가 보여서 일부러 안 씀.
