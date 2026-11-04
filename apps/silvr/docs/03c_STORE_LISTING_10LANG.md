# Film Camela 스토어 등록 문안 — 8개 언어 추가판 (ja · zh-CN · es · fr · pt-BR · ru · hi · ar)

> 원문: `03b_STORE_LISTING_FILM_CAMELA.md` v1.1(무료 하루 10장 · MY 탭 보상형 광고 · 선택형 Pro · 구독 고지). 03b는 수정하지 않았어요.
> 용어: 앱 UI 번역(`src/locales/{ja,zh,es,fr,pt,ru,hi,ar}.ts`)과 같은 말을 썼어요(현상소·롤·다크룸·밀착 인화·증감현상·Sunny 16 등). **MY 탭**은 앱 화면 표기 그대로 라틴 문자 "MY"로 두었어요(다른 언어 UI에 MY 라벨 번역이 아직 없음).
> **앱 이름 규칙 (사장님 결정 2026-11-02)**: `<그 언어의 '필름 카메라'> - Film Camela` — 현지어가 앞, 일반 하이픈(앞뒤 공백), "Film Camela"는 라틴 문자. Play 앱 이름과 App Store 이름 모두 같아요.
> 글자 수: 파이썬 `len()`(유니코드 코드 포인트, 공백·줄바꿈·기호 포함)로 셌고, `{{CAMERA_COUNT}}`=22, `{{FILM_COUNT}}`=20으로 바꿨을 때 기준이에요. 힌디어는 모음 기호·할란트·누크타가 각각 1자로 세어져요. 키워드는 UTF-8 바이트 수도 함께 적었어요.
> 원칙 점검(스크립트): 순위 주장·타사 상표 없음 · 이름/간단한 설명/부제에 '무료' 없음 · '광고 없음' 주장 없음 · 두 링크 포함 · 키워드는 쉼표 뒤 공백 없음, 이름·부제의 단어 제외 · 아랍어는 모든 줄이 아랍 문자로 시작.

## 0. 요약 — 10개 언어 앱 이름 · 간단한 설명

| 언어 (Play) | 앱 이름 (Play·App Store 공통) | 자 | 간단한 설명 (Play) | 자 |
|---|---|---|---|---|
| ko-KR | 필름 카메라 - Film Camela | 20/30 | 롤로 아껴 찍고, 현상소에서 기다리고, 다크룸에서 다시 현상하는 필름 카메라예요. | 45/80 |
| en-US | Film Camera - Film Camela | 25/30 | Shoot a roll, wait for the lab, re-develop anytime. Your negatives are kept. | 76/80 |
| ja-JP | フィルムカメラ - Film Camela | 21/30 | 一枚ずつ大切に撮って、現像所で待つ。撮ったあとも暗室で何度でも再現像できるフィルムカメラ。 | 45/80 |
| zh-CN | 胶片相机 - Film Camela | 18/30 | 一张一张珍惜地拍，在冲洗店慢慢等待。拍完也能随时在暗房重新冲洗，底片永远都在。 | 39/80 |
| es-419 (y es-ES) | Cámara analógica - Film Camela | 30/30 | Cada foto cuenta. Espera el revelado y vuelve a revelar cuando quieras. | 71/80 |
| fr-FR | Photo argentique - Film Camela | 30/30 | Chaque vue compte. Attendez le labo, puis redéveloppez quand vous voulez. | 73/80 |
| pt-BR | Câmera analógica - Film Camela | 30/30 | Cada pose conta. Espere a revelação e revele de novo quando quiser. | 67/80 |
| ru-RU | Плёночная камера - Film Camela | 30/30 | Каждый кадр на счету. Ждите проявку и проявляйте заново, когда захотите. | 72/80 |
| hi-IN | फ़िल्म कैमरा - Film Camela | 26/30 | हर तस्वीर दिल से खींचिए, लैब का इंतज़ार कीजिए, जब चाहें फिर से डेवलप कीजिए। | 75/80 |
| ar | كاميرا فيلم - Film Camela | 25/30 | اجعل لكل لقطة معنى، وانتظر التحميض، ثم أعد التحميض متى شئت. | 59/80 |

- ko·en 이름은 새 규칙으로 바뀐 값이에요(03b에는 아직 옛 이름 "Film Camela – 필름 카메라" / "Film Camela – Analog Camera"). 간단한 설명은 03b 그대로.
- en 이름에서 "Analog"가 빠졌으니, 03b의 영어 App Store 키워드에 `analog`를 넣을 수 있어요(현재 100/100이라 다른 단어와 맞바꿔야 함). ko는 이름이 같은 단어라 변화 없음.

### 한눈에 보는 글자 수

| 언어 | Play 이름 | 간단한 설명 | 자세한 설명 | 출시 노트 1.1 | AS 부제 | 프로모션 | 키워드 (자·바이트·개) | 스크린샷 최대 |
|---|---|---|---|---|---|---|---|---|
| ja | 21/30 | 45/80 | 1943/4000 | 154/500 | 16/30 | 66/170 | 99/100 · 249B · 21 | 19/30 |
| zh | 18/30 | 39/80 | 1571/4000 | 132/500 | 13/30 | 53/170 | 79/100 · 179B · 23 | 14/30 |
| es | 30/30 | 71/80 | 3989/4000 | 324/500 | 28/30 | 164/170 | 94/100 · 95B · 12 | 30/30 |
| fr | 30/30 | 73/80 | 3985/4000 | 341/500 | 30/30 | 166/170 | 94/100 · 96B · 12 | 29/30 |
| pt | 30/30 | 67/80 | 3979/4000 | 317/500 | 27/30 | 154/170 | 97/100 · 103B · 12 | 30/30 |
| ru | 30/30 | 72/80 | 3989/4000 | 325/500 | 26/30 | 143/170 | 95/100 · 176B · 13 | 29/30 |
| hi | 26/30 | 75/80 | 3816/4000 | 291/500 | 23/30 | 138/170 | 92/100 · 150B · 12 | 30/30 |
| ar | 25/30 | 59/80 | 3525/4000 | 277/500 | 25/30 | 129/170 | 96/100 · 176B · 12 | 30/30 |

---

## 1. 日本語 (ja-JP)

### Google Play — `ja-JP`

**앱 이름** — 21/30
```
フィルムカメラ - Film Camela
```

**간단한 설명** — 45/80
```
一枚ずつ大切に撮って、現像所で待つ。撮ったあとも暗室で何度でも再現像できるフィルムカメラ。
```

**자세한 설명** — 1943/4000
```
Film Camelaは、フィルムのように撮って、現像所で待って、暗室のように現像し直せるカメラです。

■ 一本ずつ、一枚ずつ
カメラを選んでフィルムを入れると、残りの枚数がひとつずつ減っていきます。カメラによって10〜99枚。撮っては消すのではなく、一枚を選ぶ楽しさをもう一度。

■ 現像所って、なんのため？
撮り終えたフィルムは現像所へ。受け取るタイミングは自分で選べます：今すぐ・1時間・朝9時・3日。
・どんな写真に仕上がるのか、待つ時間がときめきに変わります。本物のフィルムのように。
・その場で確認できないから、画面ではなく目の前の瞬間に集中できます。
・待ちたくない日は「今すぐ」を選ぶか、現像中でも「今すぐ現像」をタップ。
・インスタントカメラとデジタルカメラは現像所を通さず、すぐに見られます。

■ {{CAMERA_COUNT}}台のカメラ、それぞれの撮り心地
・35mm一眼レフ、レンジファインダー、街角スナップ向けのコンパクト
・27枚撮りの使い捨てカメラ：フラッシュは毎回チャージ
・防水の使い捨てカメラAqua 27：水の中のような青緑の色味
・スクエアとワイドのインスタントカメラ：写真が出てきて、ゆっくり浮かび上がります
・上からのぞき込む二眼レフTwin 66：6×6のスクエアで12枚
・2回押して1枚になるハーフサイズ、4つのレンズで連写する4レンズカメラ、1枚目に重ねて撮る二重露光
・180°魚眼、2.39:1シネマスコープ、65:24パノラマ、パーフォレーションまで写るスプロケットパノラマ
・8mmホームムービーの1コマ、白いマウントに収まるスライド、強い正面フラッシュのParty Flash
・2003年のデジカメ、0.3メガピクセルのキッズカメラ、4色のピクセルカメラ
よく使うカメラはピン留めすれば、いつもリストの先頭に。

■ オリジナルのフィルムとセンサー{{FILM_COUNT}}種
あたたかなSunny 200、人物にやさしいMuse 400、モノクロのMono 400、ネオンの下で赤くにじむNeon 800T、鮮やかなリバーサルVelvet 50、1998年に期限が切れたExpired '98まで。カメラごとに入れられるフィルムが違います。

■ 暗室で再現像
元のネガは消えません。撮ったあとでもフィルムを替え、増感／減感（±2段）、期限切れの風合い、粒子、ハレーション、光漏れ、フチを調整して現像し直せます。1枚ずつでも、全コマまとめてでも。

■ ベタ焼き
1本のフィルムを35mmのストリップに並べた1枚として、保存・共有できます。

■ 本物のフィルムカメラのための道具
Sunny 16の露出計算と、コマごとのフィルム撮影メモ（CSV書き出し対応）。初めてフィルムカメラを手にした日にも、心強い味方です。

■ 毎日10枚は無料
毎日10枚まで無料で撮影できます。もっと撮りたい日は、MYタブで広告を見て10枚ずつ追加。1日10回まで受け取れて、受け取った枚数は翌日以降に持ち越せます。制限も広告もなく撮りたいなら、Proも選べます：7日間・3か月のサブスクリプション、または一度の購入でずっと使える買い切りプラン。

■ 写真は、あなたのデバイスの中だけに
アカウントもサーバーもありません。写真と記録はデバイスの中だけに保存され、透かしも入りません。広告を見るときも、写真・記録・位置情報がデバイスの外に出ることはありません。機種変更のときは、バックアップファイル（.zip）で引き継げます。

カメラへのアクセスを許可しなくても、アルバムの写真を読み込んで現像できます。

■ Proサブスクリプションについて
・お支払いは、購入の確定時にGoogle PlayまたはApple IDのアカウントに請求されます。価格は国や地域によって異なり、購入前に表示されます。
・サブスクリプション（7日間・3か月）は、現在の期間が終わる24時間前までに解約しない限り、同じ期間で自動更新されます。更新料金は、期間終了前の24時間以内に請求されます。
・サブスクリプションは、Google PlayまたはApp Storeのアカウント設定の「定期購入」（サブスクリプション）から管理・解約できます。解約後も、お支払い済みの期間が終わるまでProをご利用いただけます。
・買い切りプランのお支払いは一度だけです。同じストアアカウントで、MYタブの「購入を復元」から再び適用できます。
・利用規約：https://silvr.muzig.ai/terms.html
・プライバシーポリシー：https://silvr.muzig.ai/privacy.html
```

**출시 노트 (1.1.0)** — 154/500
```
Film Camela 1.1をお届けします。
・毎日10枚まで無料で撮影できます
・もっと撮りたい日は、MYタブで広告を見て10枚ずつ追加（1日10回まで）
・Proなら撮影枚数の制限も広告もなし（7日間・3か月のサブスクリプション、または買い切りプラン）
・写真と記録は、これまでどおりデバイスの中だけに
```

### App Store — Japanese

**이름** — 21/30
```
フィルムカメラ - Film Camela
```

**부제** — 16/30
```
一枚ずつ大切に撮って、現像を待つ
```

**프로모션 텍스트** — 66/170
```
一枚ずつ大切に撮って、現像所でわくわく待つ。待てない日は「今すぐ」現像も。元のネガが残るから、いつでも別のフィルムで現像し直せます。
```

**설명** — Google Play 자세한 설명과 같은 글 (1943/4000).

**키워드** — 99/100자 · 21개 · UTF-8 249바이트
```
使い捨て,インスタント,写真加工,レトロ,エモい,アナログ,ヴィンテージ,暗室,ベタ焼き,モノクロ,粒子,光漏れ,ハーフサイズ,二重露光,魚眼,パノラマ,露出計,デジカメ,防水,フィルター,35mm
```

**이 버전의 새로운 기능** — 출시 노트 1.1과 같음 (154/4000).

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | Camera · viewfinder | ファインダーをのぞいて、一枚ずつ | 16/30 |
| 2 | Camera line-up · pins | カメラ{{CAMERA_COUNT}}台、お気に入りは先頭に | 16/30 |
| 3 | Lab speed choice | 受け取る日は、自分で決める | 13/30 |
| 4 | Developed roll | 現像できました。開けてみよう | 14/30 |
| 5 | Darkroom | 撮ったあとでも、フィルムを替えて | 16/30 |
| 6 | Contact sheet | 1本のフィルムを、1枚のベタ焼きに | 17/30 |
| 7 | Analog · meter / log | 露出計と撮影メモを、本物のフィルムにも | 19/30 |
| 8 | Privacy | アカウント不要、写真は手元だけに | 16/30 |

**메모**
- 名前は「フィルムカメラ」（検索語そのまま）。部分の語（フィルム・カメラ・現像・撮って・待つ・一枚・大切）はキーワード欄から外した。
- 「写ルンです」「チェキ」は他社商標のため不使用。代わりに一般名詞「使い捨て」「インスタント」。
- Half-frame は日本で定着している「ハーフサイズ」、Contact sheet はアプリと同じ「ベタ焼き」。

---

## 2. 简体中文 (zh-CN)

### Google Play — `zh-CN`

**앱 이름** — 18/30
```
胶片相机 - Film Camela
```

**간단한 설명** — 39/80
```
一张一张珍惜地拍，在冲洗店慢慢等待。拍完也能随时在暗房重新冲洗，底片永远都在。
```

**자세한 설명** — 1571/4000
```
Film Camela 是一台像胶片一样拍摄、要在冲洗店等待、还能像暗房一样重新冲洗的相机。

■ 一卷一卷，一张一张
选一台相机，装上胶卷，剩余张数会一张张减少。每台相机 10～99 张不等。不再随手连拍又删除，重新找回挑选每一张的乐趣。

■ 为什么要有冲洗店？
拍完的胶卷要送去冲洗店。什么时候拿到照片，由你决定：立即 · 1 小时 · 早上 9 点 · 3 天。
· 等待的时候，会期待照片冲出来是什么样子。就像真正的胶片。
· 拍完不能马上查看，于是你会把注意力放在眼前的瞬间，而不是屏幕上。
· 不想等？选“立即”，或在冲洗中点一下“立即冲洗”。
· 即时成像相机和数码相机不经过冲洗店，拍完马上就能看。

■ {{CAMERA_COUNT}} 台相机，各有各的拍法
· 35mm 单反、旁轴、适合街拍的便携机
· 27 张一次性相机：每次闪光前都要充电
· 防水一次性相机 Aqua 27：带着水下般的青绿色调
· 方形和宽幅即时成像相机：照片吐出后慢慢显影
· 从上往下取景的双反 Twin 66：6×6 方画幅 12 张
· 按两次合成一张的半格、四颗镜头连拍的四镜头相机、在第一张上叠拍的双重曝光
· 180° 鱼眼、2.39:1 宽银幕、65:24 全景，还有连齿孔一起拍进画面的齿孔全景
· 8mm 家庭电影的一帧、装进白色片框的幻灯片、正面强闪的 Party Flash
· 2003 年的数码相机、30 万像素的儿童相机、4 色像素相机
常用的相机置顶后，会一直排在最前面。

■ {{FILM_COUNT}} 款原创胶卷与传感器
温暖的 Sunny 200、适合人像的 Muse 400、黑白 Mono 400、在霓虹灯下泛起红晕的 Neon 800T、浓郁鲜艳的反转片 Velvet 50，还有 1998 年就已过期的 Expired '98。每台相机能装的胶卷各不相同。

■ 在暗房重新冲洗
原始底片永远不会被删除。拍完之后，依然可以换胶卷、迫冲／拉冲（±2 档），调整过期程度、颗粒、光晕、漏光和边框，重新冲洗。可以单张调整，也可以应用到整卷。

■ 接触印样
把一整卷胶卷排成 35mm 胶条，保存为一张图片并分享。

■ 为真正的胶片机准备的工具
Sunny 16 曝光计算器，以及逐张记录的胶片拍摄记录（可导出 CSV）。第一次拿起胶片机，也能更安心。

■ 每天免费拍 10 张
每天可以免费拍 10 张。想多拍的日子，在 MY 页面看一段广告，就能再得 10 张。每天最多 10 次，得到的张数可以留到之后再用。想不受限制、也不看广告，也可以选择 Pro：7 天或 3 个月订阅，或一次购买、永久使用的终身版。

■ 你的照片只留在你的设备上
无需账户，没有服务器。照片和记录只保存在设备里，也不会加水印。即使在看广告时，照片、记录和位置信息也不会离开你的设备。换新手机时，用备份文件（.zip）就能带走。

不授予相机权限，也可以从相册导入照片来冲洗。

■ 关于 Pro 订阅
· 确认购买时，费用将从你的 Google Play 或 Apple ID 账户扣除。价格因国家或地区而异，并会在付款前显示。
· 订阅（7 天、3 个月）会按相同周期自动续订，除非在当前周期结束前至少 24 小时取消。续订费用会在当前周期结束前 24 小时内扣除。
· 你可以在 Google Play 或 App Store 账户设置的“订阅”中管理或取消订阅。取消后，Pro 仍可使用至已付费周期结束。
· 终身版只需付费一次。使用同一个商店账户，在 MY 页面点“恢复购买”即可重新启用。
· 使用条款：https://silvr.muzig.ai/terms.html
· 隐私政策：https://silvr.muzig.ai/privacy.html
```

**출시 노트 (1.1.0)** — 132/500
```
Film Camela 1.1 来了。
· 每天可以免费拍 10 张
· 想多拍？在 MY 页面看广告，每次再得 10 张（每天最多 10 次）
· 想要不限张数、没有广告？选 Pro 就好（7 天或 3 个月订阅，或终身版）
· 照片和记录依然只保存在你的设备上
```

### App Store — Simplified Chinese

**이름** — 18/30
```
胶片相机 - Film Camela
```

**부제** — 13/30
```
珍惜每一张，等待冲洗的心动
```

**프로모션 텍스트** — 53/170
```
一张一张珍惜地拍，在冲洗店满怀期待地等。等不及也能立即冲洗。原始底片一直都在，随时可以换一款胶卷重新冲洗。
```

**설명** — Google Play 자세한 설명과 같은 글 (1571/4000).

**키워드** — 79/100자 · 23개 · UTF-8 179바이트
```
一次性,复古,胶卷,底片,暗房,滤镜,ccd,怀旧,黑白,颗粒,漏光,双重曝光,鱼眼,全景,半格,测光,即时成像,日系,港风,35mm,接触印样,文艺,氛围感
```

**이 버전의 새로운 기능** — 출시 노트 1.1과 같음 (132/4000).

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | Camera · viewfinder | 透过取景器，珍惜每一张 | 11/30 |
| 2 | Camera line-up · pins | {{CAMERA_COUNT}} 台相机，心爱的放最前 | 13/30 |
| 3 | Lab speed choice | 什么时候拿照片，你来定 | 11/30 |
| 4 | Developed roll | 冲洗好了！打开这卷看看 | 11/30 |
| 5 | Darkroom | 拍完也能换胶卷重新冲洗 | 11/30 |
| 6 | Contact sheet | 一卷胶卷，一张接触印样 | 11/30 |
| 7 | Analog · meter / log | 测光和记录，真胶片机也用得上 | 14/30 |
| 8 | Privacy | 无需账户，照片只存在本机 | 12/30 |

**메모**
- “拍立得”在中文里常被当作通用词，但它也是宝丽来在台湾使用的品牌名，存在商标风险，所以正文和关键词都改用“即时成像相机”。
- Google Play 在中国大陆不可用，zh-CN 页面主要面向海外华人和使用简体中文的地区；App Store 中国区可正常使用。

---

## 3. Español (es-419 · reutilizable para es-ES)

### Google Play — `es-419 (y es-ES)`

**앱 이름** — 30/30
```
Cámara analógica - Film Camela
```

**간단한 설명** — 71/80
```
Cada foto cuenta. Espera el revelado y vuelve a revelar cuando quieras.
```

**자세한 설명** — 3989/4000
```
Film Camela dispara como una cámara analógica, te hace esperar el revelado y revela como un cuarto oscuro.

UN ROLLO A LA VEZ
Elige una cámara, carga un rollo y mira cómo baja el contador: de 10 a 99 fotos, según la cámara. Nada de disparar sin pensar y borrar. Cada foto vuelve a contar.

¿PARA QUÉ SIRVE EL LABORATORIO?
Cuando terminas un rollo, lo envías a revelar y eliges cuándo vuelve: al instante, en 1 hora, a las 9 a. m. del día siguiente o en 3 días.
• La espera es la mejor parte: no sabes qué capturaste hasta que vuelve el rollo, como con película de verdad.
• Como no puedes revisar cada foto, miras el momento y no la pantalla.
• ¿Con prisa? Elige “Al instante” o toca “Revelar ya” mientras el rollo sigue en el laboratorio.
• Las cámaras instantáneas y digitales se saltan el laboratorio: fotos listas enseguida.

{{CAMERA_COUNT}} CÁMARAS, CADA UNA CON SU CARÁCTER
• Una réflex de 35 mm, una telemétrica silenciosa y una compacta para la calle
• Una desechable de 27 fotos con un flash que se carga antes de cada disparo
• Aqua 27, una desechable acuática con ese tono verdiazul de bajo el agua
• Cámaras instantáneas cuadradas y de formato ancho: la foto sale y aparece poco a poco
• Twin 66, una réflex de doble objetivo que se mira desde arriba: 12 fotos cuadradas de 6×6
• Medio fotograma en pareja, una cámara de 4 lentes en secuencia y dobles exposiciones
• Ojo de pez de 180°, cinemascope 2.39:1, panorámicas 65:24 y una panorámica hasta las perforaciones
• Un fotograma de cine casero de 8 mm, diapositivas en marcos blancos y Party Flash con su flash frontal intenso
• Una digital de 2003, una cámara infantil de 0,3 MP y una cámara de píxeles de 4 colores
Fija tus favoritas y estarán siempre al principio.

{{FILM_COUNT}} PELÍCULAS Y SENSORES ORIGINALES
La cálida Sunny 200, Muse 400 para retratos, el blanco y negro de Mono 400, Neon 800T con su brillo rojo alrededor del neón, la intensa diapositiva Velvet 50 y la impredecible Expired '98. Cada cámara tiene sus propias películas.

REVELA DE NUEVO EN EL CUARTO OSCURO
Tus negativos originales siempre se conservan. Después de la foto puedes cambiar la película, forzar o subrevelar ±2 pasos y ajustar caducidad, grano, halo, filtraciones de luz y bordes, en una foto o en todo el rollo.

HOJAS DE CONTACTOS
Guarda y comparte un rollo entero en una hoja de tiras de 35 mm.

HERRAMIENTAS PARA TU CÁMARA ANALÓGICA DE VERDAD
Una calculadora de exposición Sunny 16 y un registro de tomas foto por foto, con exportación a CSV. Muy útil si empiezas en lo analógico.

10 FOTOS GRATIS CADA DÍA
Toma 10 fotos gratis todos los días. ¿Quieres más? Mira un anuncio en la pestaña MY y recibe 10 fotos extra, hasta 10 veces al día; las fotos que ganes se guardan para después. ¿Sin límites ni anuncios? Pro está ahí si lo quieres: suscripción de 7 días o de 3 meses, o un pago único de por vida.

TUS FOTOS SE QUEDAN EN TU TELÉFONO
Sin cuenta, sin servidores, sin marca de agua. Tus fotos y registros se guardan solo en tu dispositivo, incluso cuando miras un anuncio. ¿Cambias de teléfono? Llévate un archivo de respaldo (.zip).

¿Sin permiso de cámara? Aun así puedes importar fotos de tu galería y revelarlas.

SOBRE LAS SUSCRIPCIONES PRO
• El pago se carga a tu cuenta de Google Play o de Apple ID cuando confirmas la compra. Los precios varían según el país y se muestran antes de comprar.
• Las suscripciones (7 días y 3 meses) se renuevan automáticamente por el mismo periodo, salvo que las canceles al menos 24 horas antes de que termine el periodo actual; la renovación se cobra en las 24 horas previas a su final.
• Administra o cancela tus suscripciones en la configuración de tu cuenta de Google Play o App Store (Suscripciones). Si cancelas, Pro sigue activo hasta el final del periodo pagado.
• El acceso de por vida es un pago único: restáuralo con “Restaurar compras” en la pestaña MY, con la misma cuenta de la tienda.
• Términos de uso: https://silvr.muzig.ai/terms.html
• Política de privacidad: https://silvr.muzig.ai/privacy.html
```

**출시 노트 (1.1.0)** — 324/500
```
Film Camela 1.1.
• Toma 10 fotos gratis cada día
• ¿Quieres más? Mira un anuncio en la pestaña MY y recibe 10 fotos extra (hasta 10 veces al día)
• ¿Prefieres sin límites? Pro quita el límite de fotos y todos los anuncios (suscripción de 7 días o 3 meses, o de por vida)
• Tus fotos y registros siguen solo en tu dispositivo
```

### App Store — Spanish (Mexico) / Spanish (Spain)

**이름** — 30/30
```
Cámara analógica - Film Camela
```

**부제** — 28/30
```
Cada foto cuenta, como antes
```

**프로모션 텍스트** — 164/170
```
Haz que cada foto cuente y espera el revelado como con película de verdad, o sáltate la espera con “Al instante”. Tus negativos se guardan para revelarlos de nuevo.
```

**설명** — Google Play 자세한 설명과 같은 글 (3989/4000).

**키워드** — 94/100자 · 12개 · UTF-8 95바이트
```
desechable,instantánea,vintage,retro,rollo,revelado,negativo,grano,ojo de pez,35mm,sunny16,byn
```

**이 버전의 새로운 기능** — 출시 노트 1.1과 같음 (324/4000).

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | Camera · viewfinder | Encuadra. Haz que cuente. | 25/30 |
| 2 | Camera line-up · pins | {{CAMERA_COUNT}} cámaras. Fija tus favoritas | 30/30 |
| 3 | Lab speed choice | Tú eliges cuándo llegan | 23/30 |
| 4 | Developed roll | Tu rollo ya está revelado | 25/30 |
| 5 | Darkroom | Cambia la película después | 26/30 |
| 6 | Contact sheet | Todo el rollo en una hoja | 25/30 |
| 7 | Analog · meter / log | Fotómetro y registro de tomas | 29/30 |
| 8 | Privacy | Sin cuenta. Fotos solo tuyas | 28/30 |

**메모**
- Escrito con vocabulario neutro (tú, “teléfono”, “cámara analógica”) para que sirva tal cual en es-ES: no usa “celular”, “cámara de rollo” ni “carrete”.
- es-ES · cambios opcionales (no obligatorios; la app usa “rollo” en todas las variantes, así que se mantiene por coherencia): “a las 9 a. m.” → “a las 9:00”; “teléfono” → “móvil” (2 veces en el título y el texto de la sección de privacidad); “Administra” → “Gestiona”; “Mira un anuncio” → “Ve un anuncio”. Ninguno cambia los límites de longitud de forma relevante (±3 caracteres).
- App Store: subir el mismo texto en Spanish (Mexico) y Spanish (Spain).

---

## 4. Français (fr-FR)

### Google Play — `fr-FR`

**앱 이름** — 30/30
```
Photo argentique - Film Camela
```

**간단한 설명** — 73/80
```
Chaque vue compte. Attendez le labo, puis redéveloppez quand vous voulez.
```

**자세한 설명** — 3985/4000
```
Film Camela photographie comme l'argentique, vous fait attendre le labo et développe comme une chambre noire.

UNE PELLICULE À LA FOIS
Choisissez un appareil, chargez une pellicule et regardez le compteur descendre : de 10 à 99 vues selon l'appareil. Fini les rafales qu'on efface. Chaque vue retrouve sa valeur.

À QUOI SERT LE LABO ?
Pellicule terminée ? Envoyez-la au labo et choisissez quand elle revient : immédiatement, dans 1 heure, le lendemain à 9 h ou dans 3 jours.
• L'attente fait tout le charme : on ne découvre ses photos qu'au retour de la pellicule, comme en vrai.
• Sans pouvoir tout vérifier, vous regardez l'instant, pas l'écran.
• Pressé ? Choisissez « Immédiat », ou touchez « Développer » pendant qu'elle est au labo.
• Les appareils instantanés et numériques se passent de labo : photos prêtes tout de suite.

{{CAMERA_COUNT}} APPAREILS, CHACUN SON CARACTÈRE
• Un reflex 35 mm, un télémétrique discret et un compact pour la rue
• Un jetable de 27 vues, au flash à recharger avant chaque photo
• Aqua 27, un jetable étanche aux teintes bleu-vert sous-marines
• Des instantanés carrés et larges : le tirage sort et se révèle doucement
• Twin 66, un bi-objectif qu'on regarde d'en haut : 12 vues carrées 6×6
• Des demi-formats en diptyque, un appareil 4 objectifs en rafale et des doubles expositions
• Un fisheye 180°, le format scope 2.39:1, des panoramiques 65:24 et un panoramique jusque sur les perforations
• Une image de film 8 mm amateur, des diapos sous cache blanc et Party Flash au flash frontal cru
• Un numérique de 2003, un appareil pour enfants de 0,3 Mpx et un appareil pixel 4 couleurs
Épinglez vos préférés : ils restent en tête de liste.

{{FILM_COUNT}} PELLICULES ET CAPTEURS ORIGINAUX
La chaleureuse Sunny 200, Muse 400 pour les portraits, le noir et blanc granuleux de Mono 400, Neon 800T et son halo rouge autour des néons, la diapositive éclatante Velvet 50 et l'imprévisible Expired '98. Chaque appareil a ses propres pellicules.

REDÉVELOPPEZ EN CHAMBRE NOIRE
Vos négatifs originaux sont toujours conservés. Après coup, changez de pellicule, poussez ou retenez de ±2 IL, réglez péremption, grain, halo, fuites de lumière et bordures. Sur une vue ou toute la pellicule.

PLANCHES-CONTACTS
Enregistrez et partagez toute une pellicule sur une planche de bandes 35 mm.

DES OUTILS POUR VOTRE VRAI APPAREIL ARGENTIQUE
Un calculateur d'exposition Sunny 16 et un carnet de prise de vue, vue par vue, avec export CSV. Idéal pour débuter en argentique.

10 PHOTOS GRATUITES PAR JOUR
Prenez 10 photos gratuitement chaque jour. Envie de plus ? Regardez une publicité dans l'onglet MY pour 10 photos de plus, jusqu'à 10 fois par jour ; celles gagnées restent pour plus tard. Sans limite ni publicité ? Pro est là si vous le souhaitez : abonnement de 7 jours ou de 3 mois, ou achat unique à vie.

VOS PHOTOS RESTENT SUR VOTRE TÉLÉPHONE
Pas de compte, de serveur ni de filigrane. Photos et carnets restent sur votre appareil, même quand vous regardez une publicité. Nouveau téléphone ? Emportez un fichier de sauvegarde (.zip).

Sans accès à l'appareil photo, importez des photos de la galerie et développez-les.

À PROPOS DES ABONNEMENTS PRO
• Le paiement est débité sur votre compte Google Play ou identifiant Apple à la confirmation de l'achat. Les prix varient selon le pays et s'affichent avant l'achat.
• Les abonnements (7 jours, 3 mois) se renouvellent automatiquement pour la même durée, sauf résiliation au moins 24 heures avant la fin de la période en cours ; le renouvellement est débité dans les 24 heures précédentes.
• Gérez ou résiliez vos abonnements dans les paramètres de votre compte Google Play ou App Store (Abonnements). Après résiliation, Pro reste actif jusqu'à la fin de la période payée.
• L'accès à vie est un achat unique, à restaurer avec « Restaurer les achats » dans l'onglet MY, avec le même compte de la boutique.
• Conditions d'utilisation : https://silvr.muzig.ai/terms.html
• Politique de confidentialité : https://silvr.muzig.ai/privacy.html
```

**출시 노트 (1.1.0)** — 341/500
```
Film Camela 1.1.
• 10 photos gratuites chaque jour
• Envie de plus ? Regardez une publicité dans l'onglet MY pour 10 photos supplémentaires (jusqu'à 10 fois par jour)
• Sans limite ? Pro supprime la limite de photos et toutes les publicités (abonnement de 7 jours ou 3 mois, ou accès à vie)
• Vos photos et carnets restent sur votre appareil
```

### App Store — French

**이름** — 30/30
```
Photo argentique - Film Camela
```

**부제** — 30/30
```
Chaque vue compte, comme avant
```

**프로모션 텍스트** — 166/170
```
Chaque vue compte : attendez le retour du labo comme avec une vraie pellicule, ou passez-vous d'attente avec « Immédiat ». Vos négatifs sont gardés pour redévelopper.
```

**설명** — Google Play 자세한 설명과 같은 글 (3985/4000).

**키워드** — 94/100자 · 12개 · UTF-8 96바이트
```
jetable,instantané,vintage,rétro,pellicule,labo,chambre noire,grain,fisheye,35mm,sunny16,diapo
```

**이 버전의 새로운 기능** — 출시 노트 1.1과 같음 (341/4000).

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | Camera · viewfinder | Cadrez. Chaque vue compte. | 26/30 |
| 2 | Camera line-up · pins | {{CAMERA_COUNT}} appareils. Épinglez-les | 26/30 |
| 3 | Lab speed choice | Choisissez quand ils arrivent | 29/30 |
| 4 | Developed roll | Votre pellicule est revenue | 27/30 |
| 5 | Darkroom | Changez de film après coup | 26/30 |
| 6 | Contact sheet | Une pellicule, une planche | 26/30 |
| 7 | Analog · meter / log | Posemètre et carnet de prises | 29/30 |
| 8 | Privacy | Sans compte, sans cloud | 23/30 |

**메모**
- « Appareil photo argentique » (25 car.) ne tient pas avec « - Film Camela » (limite 30). « Photo argentique » (30/30) garde le mot-clé « argentique », le terme naturel en France ; « Caméra » aurait voulu dire caméra vidéo.
- Espaces normales avant « : ? ; » (les espaces fines insécables s'affichent mal dans certaines fiches).

---

## 5. Português (pt-BR)

### Google Play — `pt-BR`

**앱 이름** — 30/30
```
Câmera analógica - Film Camela
```

**간단한 설명** — 67/80
```
Cada pose conta. Espere a revelação e revele de novo quando quiser.
```

**자세한 설명** — 3979/4000
```
Film Camela fotografa como filme, faz você esperar o laboratório e revela como um quarto escuro.

UM FILME DE CADA VEZ
Escolha uma câmera, coloque um filme e veja o contador baixar: de 10 a 99 poses, dependendo da câmera. Nada de disparar sem parar e apagar depois. Cada clique volta a valer.

PARA QUE SERVE O LABORATÓRIO?
Quando o filme acaba, você manda revelar e escolhe quando ele volta: na hora, em 1 hora, às 9h do dia seguinte ou em 3 dias.
• A espera é a parte mais gostosa. Você só descobre o que fotografou quando o filme volta, como no filme de verdade.
• Como não dá para conferir cada foto, você olha para o momento, e não para a tela.
• Com pressa? Escolha “Na hora” ou toque em “Revelar agora” enquanto o filme ainda está no laboratório.
• Câmeras instantâneas e digitais pulam o laboratório: fotos prontas na hora.

{{CAMERA_COUNT}} CÂMERAS, CADA UMA COM SEU JEITO
• Uma reflex 35 mm, uma telemétrica silenciosa e uma compacta para a rua
• Uma descartável de 27 poses, com flash para carregar antes de cada disparo
• Aqua 27, uma descartável à prova d'água com aquele tom verde-azulado de fundo do mar
• Câmeras instantâneas quadradas e largas: a foto sai e vai aparecendo devagar
• Twin 66, uma reflex de duas objetivas que você olha de cima: 12 poses quadradas 6×6
• Meio-quadro em pares, uma câmera de 4 lentes em sequência e dupla exposição
• Olho de peixe 180°, cinemascope 2.39:1, panorâmicas 65:24 e uma panorâmica até as perfurações do filme
• Um quadro de filme caseiro em 8 mm, slides em molduras brancas e Party Flash com seu flash frontal forte
• Uma câmera digital de 2003, uma câmera infantil de 0,3 MP e uma câmera de pixels de 4 cores
Fixe as favoritas e elas ficam sempre no início.

{{FILM_COUNT}} FILMES E SENSORES ORIGINAIS
O quentinho Sunny 200, o Muse 400 para retratos, o preto e branco marcante do Mono 400, o Neon 800T com brilho vermelho em volta do neon, o slide vibrante Velvet 50 e o imprevisível Expired '98. Cada câmera tem seus próprios filmes.

REVELE DE NOVO NO QUARTO ESCURO
Seus negativos originais nunca são descartados. Depois do clique, você ainda pode trocar o filme, puxar ou segurar ±2 pontos e ajustar validade, granulação, halo, vazamentos de luz e bordas. Em uma foto ou no filme todo.

FOLHAS DE CONTATO
Salve e compartilhe um filme inteiro numa folha com tiras de 35 mm.

FERRAMENTAS PARA SUA CÂMERA ANALÓGICA DE VERDADE
Uma calculadora de exposição Sunny 16 e um caderno de fotos pose a pose, com exportação em CSV. Uma mão na roda para quem está começando no analógico.

10 FOTOS GRÁTIS POR DIA
Tire 10 fotos grátis todos os dias. Quer mais? Assista a um anúncio na aba MY e ganhe 10 fotos extras, até 10 vezes por dia; as fotos ganhas ficam guardadas para depois. Sem limites e sem anúncios? O Pro está aí se você quiser: assinatura de 7 dias ou 3 meses, ou acesso vitalício com pagamento único.

SUAS FOTOS FICAM NO SEU CELULAR
Sem conta, sem servidores, sem marca d'água. Fotos e cadernos ficam salvos só no seu dispositivo, e continuam lá mesmo quando você assiste a um anúncio. Vai trocar de celular? Leve um arquivo de backup (.zip).

Sem permissão de câmera? Você ainda pode importar fotos da galeria e revelá-las.

SOBRE AS ASSINATURAS PRO
• O pagamento é cobrado na sua conta do Google Play ou ID Apple quando você confirma a compra. Os preços variam por país e são exibidos antes da compra.
• As assinaturas (7 dias e 3 meses) são renovadas automaticamente pelo mesmo período, a menos que sejam canceladas pelo menos 24 horas antes do fim do período atual; a renovação é cobrada nas 24 horas anteriores a esse fim.
• Gerencie ou cancele suas assinaturas em Assinaturas, nas configurações da sua conta do Google Play ou da App Store. Depois de cancelar, o Pro continua ativo até o fim do período pago.
• O acesso vitalício é uma compra única: restaure com “Restaurar compras” na aba MY, usando a mesma conta da loja.
• Termos de Uso: https://silvr.muzig.ai/terms.html
• Política de Privacidade: https://silvr.muzig.ai/privacy.html
```

**출시 노트 (1.1.0)** — 317/500
```
Film Camela 1.1.
• Tire 10 fotos grátis todos os dias
• Quer mais? Assista a um anúncio na aba MY e ganhe 10 fotos extras (até 10 vezes por dia)
• Prefere sem limites? O Pro remove o limite de fotos e todos os anúncios (assinatura de 7 dias ou 3 meses, ou vitalício)
• Fotos e cadernos continuam só no seu dispositivo
```

### App Store — Portuguese (Brazil)

**이름** — 30/30
```
Câmera analógica - Film Camela
```

**부제** — 27/30
```
Cada pose conta, como antes
```

**프로모션 텍스트** — 154/170
```
Faça cada pose valer e espere o laboratório como no filme de verdade, ou pule a espera com “Na hora”. Seus negativos ficam guardados para revelar de novo.
```

**설명** — Google Play 자세한 설명과 같은 글 (3979/4000).

**키워드** — 97/100자 · 12개 · UTF-8 103바이트
```
descartável,instantânea,vintage,retrô,filme,revelação,negativo,grão,olho de peixe,35mm,sunny16,pb
```

**이 버전의 새로운 기능** — 출시 노트 1.1과 같음 (317/4000).

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | Camera · viewfinder | Enquadre. Faça valer. | 21/30 |
| 2 | Camera line-up · pins | {{CAMERA_COUNT}} câmeras. Fixe as favoritas | 29/30 |
| 3 | Lab speed choice | Você escolhe quando chegam | 26/30 |
| 4 | Developed roll | Seu filme voltou da revelação | 29/30 |
| 5 | Darkroom | Troque o filme depois da foto | 29/30 |
| 6 | Contact sheet | Um filme, uma folha de contato | 30/30 |
| 7 | Analog · meter / log | Fotômetro e caderno de fotos | 28/30 |
| 8 | Privacy | Sem conta, sem nuvem | 20/30 |

**메모**
- “Filme” = rolo (como no app: “Colocar filme”, “Aplicar ao filme todo”); “pose” = fotograma, termo natural no Brasil.
- Não serve para pt-PT sem revisão (“celular”, “câmera”, “Tire fotos”).

---

## 6. Русский (ru-RU)

### Google Play — `ru-RU`

**앱 이름** — 30/30
```
Плёночная камера - Film Camela
```

**간단한 설명** — 72/80
```
Каждый кадр на счету. Ждите проявку и проявляйте заново, когда захотите.
```

**자세한 설명** — 3989/4000
```
Film Camela снимает, как настоящая плёнка: кадры на счету, снимки ждут проявки, а в тёмной комнате их можно проявить заново.

ОДНА ПЛЁНКА ЗА РАЗ
Выберите камеру, зарядите плёнку и следите, как убывает счётчик: от 10 до 99 кадров в зависимости от камеры. Никаких бесконечных серий и удалений. Каждый кадр снова что-то значит.

ЗАЧЕМ НУЖНА ЛАБОРАТОРИЯ?
Отснятую плёнку вы отдаёте в проявку и сами выбираете, когда её получить: сразу, через 1 час, завтра в 9 утра или через 3 дня.
• Ожидание — самое приятное. Вы не знаете точно, что получилось, пока плёнка не вернётся. Совсем как с настоящей плёнкой.
• Раз снимки нельзя сразу посмотреть, вы смотрите на момент, а не на экран.
• Торопитесь? Выберите «Сразу» или нажмите «Проявить сейчас», пока плёнка ещё в лаборатории.
• Моментальные и цифровые камеры обходятся без лаборатории: снимки готовы сразу.

КАМЕР В КОЛЛЕКЦИИ: {{CAMERA_COUNT}}, У КАЖДОЙ СВОЙ ХАРАКТЕР
• Зеркалка 35 мм, тихий дальномер и компакт для уличной съёмки
• Одноразовая камера на 27 кадров: вспышку нужно заряжать перед каждым снимком со вспышкой
• Aqua 27 — одноразовая камера в водонепроницаемом корпусе с сине-зелёным подводным оттенком
• Квадратные и широкие камеры моментальной печати: снимок выезжает и медленно проявляется
• Twin 66 — двухобъективная зеркалка, в которую смотрят сверху: 12 квадратных кадров 6×6
• Полукадровые пары, 4-объективная камера с серийной съёмкой и двойная экспозиция
• Фишай 180°, анаморфотный формат 2.39:1, панорамы 65:24 и панорама, захватывающая перфорацию плёнки
• Кадр из любительского 8-мм фильма, слайды в белых рамках и Party Flash с резкой фронтальной вспышкой
• Цифромыльница 2003 года, детская камера на 0,3 Мп и 4-цветная пиксельная камера
Закрепите любимые камеры — они всегда будут в начале списка.

ОРИГИНАЛЬНЫХ ПЛЁНОК И СЕНСОРОВ: {{FILM_COUNT}}
Тёплая Sunny 200, портретная Muse 400, зернистая чёрно-белая Mono 400, Neon 800T с красным ореолом вокруг неона, сочная слайдовая Velvet 50 и непредсказуемая Expired '98. У каждой камеры свой набор плёнок.

ПРОЯВЛЯЙТЕ ЗАНОВО В ТЁМНОЙ КОМНАТЕ
Исходные негативы никогда не удаляются. После съёмки можно сменить плёнку, сделать пуш или пулл на ±2 ступени, настроить возраст плёнки, зерно, ореол, засветки и рамки. Для одного кадра или для всей плёнки.

КОНТАКТНЫЕ ЛИСТЫ
Сохраните всю плёнку одним листом из 35-мм полос и поделитесь им.

ИНСТРУМЕНТЫ ДЛЯ НАСТОЯЩЕЙ ПЛЁНОЧНОЙ КАМЕРЫ
Калькулятор экспозиции по правилу Sunny 16 и покадровый журнал съёмки с экспортом в CSV. Пригодится, если вы только начинаете снимать на плёнку.

10 БЕСПЛАТНЫХ КАДРОВ КАЖДЫЙ ДЕНЬ
Каждый день — 10 кадров бесплатно. Хочется больше? Посмотрите рекламу во вкладке MY и получите ещё 10 кадров, до 10 раз в день; полученные кадры сохраняются на потом. Хотите без ограничений и рекламы? Есть Pro, если захотите: подписка на 7 дней или 3 месяца либо разовая покупка навсегда.

ВАШИ ФОТО ОСТАЮТСЯ НА ВАШЕМ ТЕЛЕФОНЕ
Ни аккаунта, ни серверов, ни водяных знаков. Фото и журналы хранятся только на вашем устройстве и остаются там, даже когда вы смотрите рекламу. Меняете телефон? Возьмите с собой файл резервной копии (.zip).

Не дали доступ к камере? Всё равно можно импортировать фото из галереи и проявить их.

О ПОДПИСКЕ PRO
• Оплата списывается с вашего аккаунта Google Play или Apple ID при подтверждении покупки. Цены зависят от страны и показываются до оплаты.
• Подписки (на 7 дней и на 3 месяца) автоматически продлеваются на тот же срок, если не отменить их как минимум за 24 часа до конца текущего периода. Плата за продление списывается в течение 24 часов до окончания периода.
• Управлять подписками и отменять их можно в разделе «Подписки» в настройках аккаунта Google Play или App Store. После отмены Pro работает до конца оплаченного периода.
• Доступ навсегда оплачивается один раз. Восстановить его можно в любое время кнопкой «Восстановить покупки» во вкладке MY с тем же аккаунтом магазина.
• Условия использования: https://silvr.muzig.ai/terms.html
• Политика конфиденциальности: https://silvr.muzig.ai/privacy.html
```

**출시 노트 (1.1.0)** — 325/500
```
Film Camela 1.1.
• 10 бесплатных кадров каждый день
• Хочется больше? Посмотрите рекламу во вкладке MY и получите ещё 10 кадров (до 10 раз в день)
• Без ограничений? Pro снимает лимит кадров и убирает всю рекламу (подписка на 7 дней или 3 месяца либо навсегда)
• Фото и журналы по-прежнему хранятся только на вашем устройстве
```

### App Store — Russian

**이름** — 30/30
```
Плёночная камера - Film Camela
```

**부제** — 26/30
```
Кадр за кадром, как раньше
```

**프로모션 텍스트** — 143/170
```
Каждый кадр на счету: ждите проявку, как с настоящей плёнкой, или выберите «Сразу». Негативы сохраняются, и любой снимок можно проявить заново.
```

**설명** — Google Play 자세한 설명과 같은 글 (3989/4000).

**키워드** — 95/100자 · 13개 · UTF-8 176바이트
```
пленка,мыльница,одноразовая,винтаж,ретро,зерно,проявка,фишай,негатив,экспонометр,35мм,чб,аналог
```

**이 버전의 새로운 기능** — 출시 노트 1.1과 같음 (325/4000).

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | Camera · viewfinder | Кадрируйте. Каждый на счету. | 28/30 |
| 2 | Camera line-up · pins | Камер: {{CAMERA_COUNT}}. Любимые — в начале | 29/30 |
| 3 | Lab speed choice | Сами решите, когда получить | 27/30 |
| 4 | Developed roll | Плёнка вернулась из проявки | 27/30 |
| 5 | Darkroom | Смените плёнку после съёмки | 27/30 |
| 6 | Contact sheet | Вся плёнка на одном листе | 25/30 |
| 7 | Analog · meter / log | Экспонометр и журнал съёмки | 27/30 |
| 8 | Privacy | Без аккаунта и облака | 21/30 |

**메모**
- Число камер/плёнок вынесено после двоеточия («Камер в коллекции: 22»), чтобы не зависеть от склонения (22 камеры / 20 камер) при замене токенов.
- В ключевых словах «пленка» без «ё» — так её чаще вводят в поиске; в названии «Плёночная» (как в приложении).
- Оплата в Google Play/App Store для российских аккаунтов сейчас ограничена; текст о Pro оставлен как требование магазинов, бесплатные 10 кадров и реклама работают независимо.

---

## 7. हिन्दी (hi-IN)

### Google Play — `hi-IN`

**앱 이름** — 26/30
```
फ़िल्म कैमरा - Film Camela
```

**간단한 설명** — 75/80
```
हर तस्वीर दिल से खींचिए, लैब का इंतज़ार कीजिए, जब चाहें फिर से डेवलप कीजिए।
```

**자세한 설명** — 3816/4000
```
Film Camela फ़िल्म की तरह तस्वीरें खींचता है, लैब में इंतज़ार कराता है और डार्करूम की तरह फिर से डेवलप करने देता है।

■ एक रोल, एक-एक तस्वीर
कैमरा चुनिए, रोल डालिए और देखिए कि बची हुई तस्वीरें एक-एक करके कम होती जाती हैं। हर कैमरे में 10 से 99 तस्वीरें। बेहिसाब क्लिक करके डिलीट करने की जगह, एक तस्वीर चुनने का मज़ा फिर से पाइए।

■ लैब किसलिए है?
रोल पूरा होते ही उसे लैब भेजिए और खुद चुनिए कि तस्वीरें कब मिलें: तुरंत, 1 घंटे में, अगली सुबह 9 बजे या 3 दिन में।
• इंतज़ार ही असली मज़ा है। रोल लौटने तक पता नहीं चलता कि तस्वीरें कैसी आईं, बिल्कुल असली फ़िल्म की तरह।
• हर तस्वीर तुरंत नहीं देख सकते, इसलिए आप स्क्रीन की जगह उस पल को जीते हैं।
• जल्दी है? “तुरंत” चुनिए, या रोल लैब में हो तब भी “अभी डेवलप करें” दबाइए।
• इंस्टेंट और डिजिटल कैमरे लैब नहीं जाते, उनकी तस्वीरें फ़ौरन तैयार होती हैं।

■ {{CAMERA_COUNT}} कैमरे, हर एक का अपना अंदाज़
• 35mm SLR, शांत रेंजफ़ाइंडर और स्ट्रीट फ़ोटोग्राफ़ी के लिए कॉम्पैक्ट
• 27 तस्वीरों वाला डिस्पोज़ेबल कैमरा: हर फ़्लैश शॉट से पहले फ़्लैश चार्ज कीजिए
• Aqua 27, वॉटरप्रूफ़ डिस्पोज़ेबल, पानी के नीचे जैसी नीली-हरी रंगत के साथ
• स्क्वेयर और वाइड इंस्टेंट कैमरे: प्रिंट बाहर आता है और धीरे-धीरे उभरता है
• Twin 66, ऊपर से झाँककर देखा जाने वाला ट्विन-लेंस रिफ़्लेक्स: 6×6 की 12 चौकोर तस्वीरें
• हाफ़-फ़्रेम जोड़ियाँ, लगातार क्लिक करने वाला 4-लेंस कैमरा और डबल एक्सपोज़र
• 180° फ़िशआई, 2.39:1 सिनेमास्कोप, 65:24 पैनोरमा और स्प्रॉकेट होल तक फैला पैनोरमा
• 8mm होम मूवी का एक फ़्रेम, सफ़ेद माउंट में स्लाइड और सामने से तेज़ फ़्लैश वाला Party Flash
• 2003 का डिजिकैम, 0.3 MP बच्चों का कैमरा और 4 रंगों वाला पिक्सेल कैमरा
जो कैमरे सबसे ज़्यादा इस्तेमाल करते हैं, उन्हें पिन कीजिए, वे हमेशा सबसे आगे रहेंगे।

■ {{FILM_COUNT}} ओरिजिनल फ़िल्में और सेंसर
गर्माहट भरी Sunny 200, पोर्ट्रेट के लिए Muse 400, ब्लैक एंड व्हाइट Mono 400, नियॉन के आसपास लाल चमक वाली Neon 800T, चटख रंगों वाली स्लाइड फ़िल्म Velvet 50 और अनोखी Expired '98। हर कैमरे की अपनी फ़िल्में होती हैं।

■ डार्करूम में फिर से डेवलप करें
आपके ओरिजिनल नेगेटिव कभी नहीं मिटते। तस्वीर खींचने के बाद भी आप फ़िल्म बदल सकते हैं, ±2 स्टॉप पुश या पुल कर सकते हैं, और पुरानी फ़िल्म का लुक, ग्रेन, ग्लो, लाइट लीक और बॉर्डर बदल सकते हैं। एक तस्वीर पर या पूरे रोल पर।

■ कॉन्टैक्ट शीट
पूरे रोल को 35mm स्ट्रिप्स वाली एक शीट के रूप में सेव और शेयर कीजिए।

■ असली फ़िल्म कैमरे के लिए टूल
Sunny 16 एक्सपोज़र कैलकुलेटर और हर फ़्रेम का फ़िल्म शूटिंग लॉग, CSV एक्सपोर्ट के साथ। फ़िल्म फ़ोटोग्राफ़ी शुरू कर रहे हैं, तो बहुत काम आएगा।

■ हर दिन 10 तस्वीरें मुफ़्त
हर दिन 10 तस्वीरें मुफ़्त खींचिए। और चाहिए? MY टैब में एक विज्ञापन देखिए और 10 तस्वीरें और पाइए, दिन में 10 बार तक। मिली हुई तस्वीरें आगे के लिए बची रहती हैं। बिना लिमिट और बिना विज्ञापन चाहिए? Pro भी है, अगर आप चाहें: 7 दिन या 3 महीने का सब्सक्रिप्शन, या एक बार की ख़रीद वाला लाइफ़टाइम।

■ आपकी तस्वीरें सिर्फ़ आपके फ़ोन में
न अकाउंट, न सर्वर, न वॉटरमार्क। तस्वीरें और लॉग सिर्फ़ आपके डिवाइस में सेव होते हैं, और विज्ञापन देखते समय भी वहीं रहते हैं। नया फ़ोन ले रहे हैं? बैकअप फ़ाइल (.zip) साथ ले जाइए।

कैमरा की अनुमति नहीं दी? फिर भी आप गैलरी से तस्वीरें इम्पोर्ट करके डेवलप कर सकते हैं।

■ Pro सब्सक्रिप्शन के बारे में
• ख़रीदारी की पुष्टि करते ही भुगतान आपके Google Play या Apple ID अकाउंट से लिया जाता है। क़ीमतें देश के हिसाब से अलग होती हैं और ख़रीदने से पहले दिखाई जाती हैं।
• सब्सक्रिप्शन (7 दिन और 3 महीने) उसी अवधि के लिए अपने-आप रिन्यू होते हैं, जब तक मौजूदा अवधि ख़त्म होने से कम से कम 24 घंटे पहले रद्द न किए जाएँ। रिन्यूअल का शुल्क अवधि ख़त्म होने से पहले के 24 घंटों में लिया जाता है।
• सब्सक्रिप्शन को Google Play या App Store अकाउंट सेटिंग्ज़ के ‘सब्सक्रिप्शन’ में मैनेज या रद्द कर सकते हैं। रद्द करने के बाद भी, भुगतान की गई अवधि ख़त्म होने तक Pro चालू रहता है।
• लाइफ़टाइम एक बार की ख़रीद है। उसी स्टोर अकाउंट से MY टैब में “ख़रीदारी रीस्टोर करें” दबाकर इसे कभी भी वापस पा सकते हैं।
• उपयोग की शर्तें: https://silvr.muzig.ai/terms.html
• निजता नीति: https://silvr.muzig.ai/privacy.html
```

**출시 노트 (1.1.0)** — 291/500
```
Film Camela 1.1
• हर दिन 10 तस्वीरें मुफ़्त
• और चाहिए? MY टैब में विज्ञापन देखकर 10 तस्वीरें और पाइए (दिन में 10 बार तक)
• बिना लिमिट? Pro से तस्वीरों की लिमिट और सारे विज्ञापन हट जाते हैं (7 दिन या 3 महीने का सब्सक्रिप्शन, या लाइफ़टाइम)
• तस्वीरें और लॉग पहले की तरह सिर्फ़ आपके डिवाइस में
```

### App Store — Hindi

**이름** — 26/30
```
फ़िल्म कैमरा - Film Camela
```

**부제** — 23/30
```
हर तस्वीर दिल से खींचिए
```

**프로모션 텍스트** — 138/170
```
हर तस्वीर दिल से खींचिए और असली फ़िल्म की तरह लैब का इंतज़ार कीजिए, या “तुरंत” चुनिए। नेगेटिव हमेशा रहते हैं, जब चाहें फिर से डेवलप कीजिए।
```

**설명** — Google Play 자세한 설명과 같은 글 (3816/4000).

**키워드** — 92/100자 · 12개 · UTF-8 150바이트
```
विंटेज,रेट्रो,एनालॉग,डिस्पोज़ेबल,vintage,retro,analog,disposable,instant,35mm,darkroom,grain
```

**이 버전의 새로운 기능** — 출시 노트 1.1과 같음 (291/4000).

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | Camera · viewfinder | फ़्रेम कीजिए, दिल से क्लिक | 26/30 |
| 2 | Camera line-up · pins | {{CAMERA_COUNT}} कैमरे, पसंदीदा सबसे आगे | 26/30 |
| 3 | Lab speed choice | तस्वीरें कब मिलें, आप चुनें | 27/30 |
| 4 | Developed roll | रोल डेवलप हो गया! | 17/30 |
| 5 | Darkroom | क्लिक के बाद भी फ़िल्म बदलें | 28/30 |
| 6 | Contact sheet | पूरा रोल, एक कॉन्टैक्ट शीट | 26/30 |
| 7 | Analog · meter / log | असली फ़िल्म के लिए मीटर और लॉग | 30/30 |
| 8 | Privacy | न अकाउंट, न क्लाउड अपलोड | 24/30 |

**메모**
- गिनती यूनिकोड कोड पॉइंट से की है (मात्राएँ, हलंत, नुक़्ता अलग गिने जाते हैं), इसलिए हिन्दी के छोटे वाक्य भी 30/80 के क़रीब पहुँचते हैं। स्टोर भी इसी तरह गिनता है।
- भारत में लोग अक्सर अंग्रेज़ी में खोजते हैं, इसलिए App Store कीवर्ड में हिन्दी और अंग्रेज़ी दोनों शब्द हैं (देवनागरी शब्द ज़्यादा जगह लेते हैं, इसलिए सिर्फ़ 4 रखे)।
- App Store Connect में Hindi भाषा तभी दिखेगी जब ऐप की उपलब्ध भाषाओं में Hindi जोड़ी जाए।

---

## 8. العربية (ar)

### Google Play — `ar`

**앱 이름** — 25/30
```
كاميرا فيلم - Film Camela
```

**간단한 설명** — 59/80
```
اجعل لكل لقطة معنى، وانتظر التحميض، ثم أعد التحميض متى شئت.
```

**자세한 설명** — 3525/4000
```
مع Film Camela تلتقط صورك كما على الفيلم، وتنتظر المعمل، ثم تعيد تحميضها كما في الغرفة المظلمة.

■ فيلم واحد، لقطة تلو الأخرى
اختر كاميرا، وأدخِل فيلمًا، وراقب العدّاد وهو ينقص لقطةً بعد لقطة: من 10 إلى 99 لقطة بحسب الكاميرا. لا تصوير عشوائي ثم حذف. لكل لقطة قيمتها من جديد.

■ لماذا المعمل؟
عندما ينتهي الفيلم، ترسله إلى المعمل وتختار متى يعود: فورًا، أو بعد ساعة، أو في التاسعة من صباح اليوم التالي، أو بعد 3 أيام.
• الانتظار أجمل ما في الأمر. لا تعرف تمامًا ما التقطته حتى يعود الفيلم، تمامًا كالفيلم الحقيقي.
• ولأنك لا تستطيع مراجعة كل لقطة، تعيش اللحظة بدل التحديق في الشاشة.
• مستعجل؟ اختر «فورًا»، أو اضغط «التحميض الآن» والفيلم ما زال في المعمل.
• الكاميرات الفورية والرقمية لا تمر بالمعمل، فصورها جاهزة في الحال.

■ {{CAMERA_COUNT}} كاميرا، لكلٍّ منها طابعها
• كاميرا عاكسة مقاس 35 مم، وكاميرا هادئة بمقدِّر مسافة، وكاميرا مدمجة لتصوير الشارع
• كاميرا تُستخدم مرة واحدة بـ27 لقطة: اشحن الفلاش قبل كل لقطة بالفلاش
• كاميرا Aqua 27 المقاومة للماء التي تُستخدم مرة واحدة، بلون أزرق مخضرّ كأنك تحت الماء
• كاميرات فورية مربعة وعريضة: تخرج الصورة ثم تظهر ببطء
• كاميرا Twin 66 العاكسة ثنائية العدسة، تنظر فيها من الأعلى: 12 لقطة مربعة بمقاس 6×6
• نصف إطار (لقطتان في إطار واحد)، وكاميرا بأربع عدسات تلتقط بالتتابع، والتعريض المزدوج
• عين السمكة 180°، وصيغة سينمائية عريضة 2.39:1، وبانوراما 65:24، وبانوراما تمتد حتى ثقوب الفيلم
• إطار من فيلم منزلي 8 مم، وشرائح في إطارات بيضاء، وكاميرا Party Flash بفلاشها الأمامي القوي
• كاميرا رقمية من عام 2003، وكاميرا أطفال بدقة 0.3 ميغابكسل، وكاميرا بكسل بأربعة ألوان
ثبّت الكاميرات التي تستخدمها أكثر لتبقى في مقدمة القائمة.

■ {{FILM_COUNT}} فيلمًا ومستشعرًا أصليًا
من فيلم Sunny 200 الدافئ، إلى Muse 400 المناسب للبورتريه، وMono 400 بالأبيض والأسود، وNeon 800T بوهجه الأحمر حول أضواء النيون، وفيلم الشرائح الزاهي Velvet 50، وصولًا إلى Expired '98 الذي لا يمكن توقّعه. لكل كاميرا أفلامها الخاصة.

■ أعد التحميض في الغرفة المظلمة
لا تُحذف صورك السالبة الأصلية أبدًا. بعد التصوير يمكنك تغيير الفيلم، والدفع أو السحب بمقدار ±2 وقفة، وضبط مظهر الفيلم القديم والحبيبات والوهج وتسرّب الضوء والحواف. على لقطة واحدة أو على الفيلم كله.

■ ورقة التلامس
احفظ فيلمًا كاملًا وشاركه في ورقة واحدة من شرائط 35 مم.

■ أدوات لكاميرا الفيلم الحقيقية
حاسبة التعريض بقاعدة Sunny 16، وسجل تصوير الفيلم لقطةً بلقطة مع التصدير إلى CSV. رفيق مفيد إن كنت تبدأ للتو مع الفيلم.

■ 10 لقطات مجانية كل يوم
صوّر 10 لقطات مجانًا كل يوم. تريد المزيد؟ شاهد إعلانًا في تبويب MY واحصل على 10 لقطات إضافية، حتى 10 مرات في اليوم، وتبقى اللقطات التي تحصل عليها لما بعد. تفضّل التصوير بلا حدود ولا إعلانات؟ يمكنك اختيار Pro إن أردت: اشتراك لمدة 7 أيام أو 3 أشهر، أو شراء لمرة واحدة مدى الحياة.

■ صورك تبقى على هاتفك
لا حساب ولا خوادم ولا علامة مائية. تُحفظ الصور والسجلات على جهازك فقط، وتبقى هناك حتى عندما تشاهد إعلانًا. ستنتقل إلى هاتف جديد؟ خذ معك ملف نسخة احتياطية (.zip).

لم تسمح بالوصول إلى الكاميرا؟ لا يزال بإمكانك استيراد الصور من المعرض وتحميضها.

■ عن اشتراكات Pro
• يُخصم المبلغ من حسابك في Google Play أو Apple ID عند تأكيد الشراء. تختلف الأسعار حسب البلد وتظهر قبل الشراء.
• تتجدد الاشتراكات (7 أيام و3 أشهر) تلقائيًا للمدة نفسها ما لم تُلغَ قبل 24 ساعة على الأقل من نهاية الفترة الحالية، ويُخصم مبلغ التجديد خلال الـ24 ساعة السابقة لنهاية الفترة.
• يمكنك إدارة الاشتراكات أو إلغاؤها من «الاشتراكات» في إعدادات حسابك على Google Play أو App Store. بعد الإلغاء، يبقى Pro مفعّلًا حتى نهاية الفترة المدفوعة.
• الوصول مدى الحياة شراء لمرة واحدة. استعده في أي وقت عبر «استعادة المشتريات» في تبويب MY باستخدام حساب المتجر نفسه.
• شروط الاستخدام: https://silvr.muzig.ai/terms.html
• سياسة الخصوصية: https://silvr.muzig.ai/privacy.html
```

**출시 노트 (1.1.0)** — 277/500
```
إصدار Film Camela 1.1
• صوّر 10 لقطات مجانًا كل يوم
• تريد المزيد؟ شاهد إعلانًا في تبويب MY واحصل على 10 لقطات إضافية (حتى 10 مرات يوميًا)
• تفضّل بلا حدود؟ يزيل Pro حدّ اللقطات وكل الإعلانات (اشتراك 7 أيام أو 3 أشهر، أو مدى الحياة)
• تبقى الصور والسجلات على جهازك فقط كما كانت
```

### App Store — Arabic

**이름** — 25/30
```
كاميرا فيلم - Film Camela
```

**부제** — 25/30
```
لكل لقطة معنى، كأيام زمان
```

**프로모션 텍스트** — 129/170
```
اجعل لكل لقطة معنى، وانتظر المعمل كما مع الفيلم الحقيقي، أو تخطَّ الانتظار مع «فورًا». صورك السالبة محفوظة لتعيد تحميضها متى شئت.
```

**설명** — Google Play 자세한 설명과 같은 글 (3525/4000).

**키워드** — 96/100자 · 12개 · UTF-8 176바이트
```
تحميض,فينتاج,ريترو,فوري,تناظري,الغرفة المظلمة,حبيبات,عين السمكة,أبيض وأسود,بانوراما,35مم,نيجاتيف
```

**이 버전의 새로운 기능** — 출시 노트 1.1과 같음 (277/4000).

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | Camera · viewfinder | من المعين، لقطة تلو الأخرى | 26/30 |
| 2 | Camera line-up · pins | {{CAMERA_COUNT}} كاميرا، والمفضلة في المقدمة | 30/30 |
| 3 | Lab speed choice | أنت تختار موعد وصول صورك | 24/30 |
| 4 | Developed roll | عاد الفيلم من المعمل! | 21/30 |
| 5 | Darkroom | غيّر الفيلم حتى بعد التصوير | 27/30 |
| 6 | Contact sheet | فيلم كامل في ورقة تلامس واحدة | 29/30 |
| 7 | Analog · meter / log | مقياس تعريض وسجل للفيلم | 23/30 |
| 8 | Privacy | بلا حساب، وصورك على جهازك فقط | 29/30 |

**메모**
- الاسم يُكتب منطقيًا «كاميرا فيلم - Film Camela»؛ في واجهة RTL يظهر الجزء العربي أولًا من اليمين ثم الشرطة ثم «Film Camela» في أقصى اليسار (بصريًا: Film Camela - كاميرا فيلم). لا حاجة لعلامات اتجاه خفية.
- كل سطر يبدأ بحرف عربي (أو رمز محايد يليه عربي) حتى يُعرض السطر من اليمين إلى اليسار حتى لو اعتمد المتجر على أول حرف قوي؛ لذلك بدأ الوصف بـ«مع Film Camela» وملاحظات الإصدار بـ«إصدار Film Camela 1.1».
- صيغة العدد: «22 كاميرا» و«20 فيلمًا» صحيحة نحويًا (11–99 تمييز مفرد منصوب). إذا صار العدد بين 3 و10 فيجب تعديل الصيغة (مثل «9 كاميرات»).
- «كاميرا فيلم» قد تُفهم أحيانًا «كاميرا سينما»؛ البديل «كاميرا أفلام» يحمل الالتباس نفسه، و«كاميرا تناظرية» أبعد عن طلب «film camera»، لذلك بقي «كاميرا فيلم» وأضيف «تناظري» في الكلمات المفتاحية.

---

## 9. 붙여 넣을 때

- 출시 직전 `{{CAMERA_COUNT}}`·`{{FILM_COUNT}}`를 03b와 같은 값으로 일괄 치환하세요. 숫자가 한 자리가 되면 1자씩 줄어요. 러시아어는 숫자를 콜론 뒤에 두어 격 변화와 무관하고, 아랍어는 11–99 범위에서만 문법이 맞아요(3–10이면 표현 수정).
- Sprocket 35를 빼면 각 언어의 '스프로킷/퍼포레이션 파노라마' 구절만 지우면 돼요(ja 「パーフォレーションまで写るスプロケットパノラマ」, zh「连齿孔一起拍进画面的齿孔全景」, es「una panorámica que llega hasta las perforaciones」, fr「un panoramique qui déborde sur les perforations」, pt「uma panorâmica que avança sobre as perfurações do filme」, ru「панорама, захватывающая перфорацию плёнки」, hi「स्प्रॉकेट होल तक फैला पैनोरमा」, ar「بانوراما تمتد حتى ثقوب الفيلم」).
- 키워드가 길이 초과로 거부되면 뒤에서부터 지우세요.
- 다시 셀 때: 이 문서는 스크립트로 생성했어요(`listing_data.py` + `gen03c.py`, 작업 폴더 scratchpad). 문구를 고치면 코드 블록 안 글자를 같은 방식(`len()`)으로 다시 세면 돼요.
