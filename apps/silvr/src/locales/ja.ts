/**
 * Film Camela — Japanese (ja). Lazy-loaded when this language is chosen or detected.
 *
 * TRANSLATOR CONTRACT — read docs/10_LOCALIZATION_GUIDE.md first (§2.3 for this language, §3 names,
 * §4 placeholders, §5 plurals, §6 glossary, §8 length, §9 locale-specific content, §12 checklist).
 *
 * 1. Edit only this file. For each line below: remove the leading "// ", put your text between the
 *    quotes, keep the trailing "// ko: … · en: …" comment or delete it. A key you leave commented out
 *    falls back to English at runtime. Never paste English in as a translation.
 * 2. Keys come from ko.ts (the source). Do not add, rename or remove keys; do not edit ko.ts or en.ts.
 * 3. Copy every {placeholder} exactly (same name, same braces). You may move it; never translate,
 *    rename, duplicate or drop it. {shots}/{left} are ready-made phrases ("12 shots"): don't add a noun.
 *    Lines marked "[+ counts: n, m]" also receive the raw counts n (shots taken) and m (shots left),
 *    which you may use ONLY as plural selectors for agreement (see ko.ts pluralCounts).
 * 4. Plurals (ICU syntax):  {n, plural, <selector> {<text>} … other {<text>}}
 *      selectors: zero one two few many other, and exact values =0 =1 =2 (checked first)
 *      "other" is required; "#" prints the number (locale-formatted); {n} works too; a form may omit the number.
 *      Two counts = two blocks: '{rolls, plural, one {# roll} other {# rolls}}, {photos, plural, …}'
 *    Japanese has only "other": no plural blocks. Write the counter word directly: '{n}枚', '{n}本'.
 * 5. Never translate, transliterate or inflect: Film Camela, camera names (Pro 35, Snap 27…), film names
 *    (Sunny 200, Expired '98…), ISO, EV, f/8, 1/125, 35mm, 6×6, 2.39:1, 65:24, PRO, CSV, .zip, HTTPS,
 *    Safari, Chrome. Dates, times, sizes and durations arrive formatted in {time} {date} {t} {wait} {used}.
 * 6. Typography: plain Unicode text only; no HTML, no line breaks, no bidi control characters, no "!" hype.
 * 7. Check your file:  STRICT_I18N=1 npx vitest run tests/locales.test.ts   (lists missing keys, bad
 *    placeholders, plural syntax errors) and  npx tsc --noEmit .
 *
 * cameraText.era and the tab labels are pre-filled from the guide's tables (§3.3, §8.3); review them.
 */
import type { LocaleCameraText, LocaleMessages, LocaleStockText } from './types';

export const messages: LocaleMessages = {
  'app.tagline': 'オリジナルがそのまま残る、フィルムカメラ', // ko: 원본이 그대로 남는 필름 카메라 · en: The film camera that keeps every original
  'tab.camera': 'カメラ', // ko: 카메라 · en: Camera
  'tab.lab': '現像所', // ko: 현상소 · en: Lab
  'tab.gallery': 'アルバム', // ko: 앨범 · en: Album
  'tab.analog': 'アナログ', // ko: 아날로그 · en: Analog
  'tab.settings': 'マイ',
  'common.cancel': 'キャンセル', // ko: 취소 · en: Cancel
  'common.close': '閉じる', // ko: 닫기 · en: Close
  'common.save': '保存', // ko: 저장 · en: Save
  'common.delete': '削除', // ko: 삭제 · en: Delete
  'common.done': '完了', // ko: 완료 · en: Done
  'common.retry': '再試行', // ko: 다시 시도 · en: Retry
  'common.back': '戻る', // ko: 뒤로 · en: Back
  'common.next': '次へ', // ko: 다음 · en: Next
  'common.start': 'はじめる', // ko: 시작하기 · en: Get started
  'common.on': 'オン', // ko: 켜짐 · en: On
  'common.off': 'オフ', // ko: 꺼짐 · en: Off
  'common.pro': 'PRO', // ko: PRO · en: PRO
  'common.loading': '読み込み中…', // ko: 불러오는 중… · en: Loading…
  'common.error': '問題が発生しました。もう一度お試しください。', // ko: 잠시 문제가 생겼어요. 다시 시도해 주세요. · en: Something went wrong. Please try again.
  'toast.close': '通知を閉じる', // ko: 알림 닫기 · en: Dismiss
  'lab.developedMany': 'フィルム{n}本、仕上がりました', // ko: 롤 {n}개 현상이 끝났어요 · en: {n} rolls developed
  'cam.loadCard': 'メモリーカードを入れる', // ko: 메모리 카드 넣기 · en: Insert card
  'cam.loadPack': 'フィルムパックを入れる', // ko: 필름 팩 넣기 · en: Load film pack
  'cam.useCamera': 'このカメラで撮る', // ko: 이 카메라로 찍기 · en: Use this camera
  'cam.allCameras': 'すべて表示', // ko: 모두 보기 · en: All cameras
  'cam.allCamerasTitle': 'すべてのカメラ', // ko: 카메라 모두 보기 · en: All cameras
  'cam.group.film': 'フィルムカメラ', // ko: 필름 카메라 · en: Film cameras
  'cam.group.instant': 'インスタントカメラ', // ko: 즉석 카메라 · en: Instant cameras
  'cam.group.digital': 'デジタル', // ko: 디지털 · en: Digital
  'cam.group.toy': 'トイ・特殊カメラ', // ko: 토이·특수 카메라 · en: Toy & special
  'cam.group.phone': 'ケータイ・スマホ', // ko: 휴대폰 카메라 · en: Phone cameras
  'a11y.stockKeys': '←→キーでフィルムを見比べ、Enterキーで選びます', // ko: ← → 키로 필름을 살펴보고 Enter로 골라요 · en: Arrow keys browse films; Enter selects
  'gal.importHint': '選んだフィルムで現像します。暗室でいつでも変更できます。', // ko: 고른 필름으로 현상해요. 다크룸에서 언제든 바꿀 수 있어요. · en: Your photos develop with this film. You can change it in the darkroom any time.
  'onb.restore': '機種変更しましたか？　バックアップから復元', // ko: 이전 폰에서 옮겨 오셨나요? 백업 불러오기 · en: Coming from another phone? Restore a backup
  'onb.1.title': 'フィルムのように、撮る。', // ko: 필름처럼, 한 장씩 · en: Shoot like film
  'onb.1.body': 'カメラを選んで、フィルムを入れましょう。残りの枚数を数えながら、一枚ずつ大切に。', // ko: 카메라를 고르고 롤을 넣어 보세요. 남은 장수를 세어 가며, 셔터 한 번에 마음을 담아요. · en: Pick a camera, load a roll, and make every frame count.
  'onb.2.title': '現像所で、待つ楽しみ。', // ko: 현상소에서 기다리는 설렘 · en: Let the lab take its time
  'onb.2.body': '撮り終えたフィルムは、現像に出しましょう。今すぐ・1時間・朝9時・3日から、待つ時間を選べます。', // ko: 다 찍은 롤은 현상소로 보내요. 즉시, 1시간, 아침 9시, 3일 중에서 기다림의 길이를 골라 보세요. · en: Send finished rolls to the lab and choose your wait: Instant, 1 hour, next 9 AM, or 3 days.
  'onb.3.title': '暗室で、何度でも現像。', // ko: 다크룸에서 언제든 다시 현상 · en: Re-develop in the darkroom
  'onb.3.body': 'オリジナルは、いつでもそのまま残ります。フィルムや明るさ、期限切れの風合い、光のにじみまで、あとから選び直せます。', // ko: 찍은 원본은 언제나 그대로 남아요. 필름, 밝기, 오래된 필름 느낌, 빛 번짐까지 몇 번이고 다시 골라 보세요. · en: Your original is always kept. Try another film, brightness, aged-film look, or glow, as often as you like.
  'onb.privacy': '1日{n}枚まで無料。アカウント不要。写真はすべて、このデバイスの中だけに。',
  'cam.loadFilm': 'フィルムを入れる', // ko: 필름 넣기 · en: Load film
  'cam.chooseFilm': 'フィルムを選ぶ', // ko: 필름을 고르세요 · en: Choose your film
  'cam.exposures': '{n}枚撮り', // ko: {n}장 · en: {n} exp
  'cam.load': 'このフィルムを入れる', // ko: 이 필름 넣기 · en: Load this film
  'cam.left': '残り{n}枚', // ko: {n}장 남음 · en: {n} left
  'cam.rewind': '現像に出す', // ko: 현상소로 보내기 · en: Send to lab
  'cam.rollFull': 'フィルムを撮りきりました', // ko: 롤을 끝까지 다 찍었어요 · en: Roll finished
  'cam.sendToLab': '現像に出す', // ko: 현상소로 보내기 · en: Send to lab
  'cam.flash': 'フラッシュ', // ko: 플래시 · en: Flash
  'cam.timer': 'タイマー', // ko: 타이머 · en: Timer
  'cam.grid': 'グリッド', // ko: 격자 · en: Grid
  'cam.date': '日付', // ko: 날짜 · en: Date
  'cam.flip': 'カメラを切り替え', // ko: 카메라 전환 · en: Switch camera
  'cam.zoom': 'ズーム', // ko: 줌 · en: Zoom
  'cam.aspect': '比率', // ko: 비율 · en: Format
  'cam.shutter': '撮影', // ko: 촬영 · en: Take photo
  'cam.noCamera.title': 'カメラを使用できません', // ko: 카메라를 사용할 수 없어요 · en: Camera unavailable
  'cam.noCamera.body': 'ブラウザまたはデバイスの設定で、カメラへのアクセスを許可してください。それまでのあいだ、デバイス内の写真を読み込んで現像することもできます。', // ko: 브라우저나 기기 설정에서 카메라 권한을 허용해 주세요. 그동안 기기에 있는 사진을 불러와 현상할 수도 있어요. · en: Allow camera access in your browser or device settings. In the meantime, you can import photos and develop them.
  'cam.noCamera.import': '写真を読み込んで現像', // ko: 사진 불러와 현상하기 · en: Import & develop photos
  'cam.starting': 'カメラを準備中…', // ko: 카메라 준비 중… · en: Starting camera…
  'cam.saved': '{n}コマ目', // ko: {n}번째 컷 · en: Frame {n}
  'cam.rewindConfirm': '{shots}撮りました。残りの{left}は空けたまま、現像に出しますか？', // ko: {shots} 찍었어요. 남은 {left}은 비워 둔 채 현상소로 보낼까요? · en: You’ve taken {shots}. Send this roll to the lab? The remaining {left} will stay blank. [+ counts: n, m]
  'cam.emptyRewind': 'まだ1枚も撮っていません。いま取り出すと、このフィルムは破棄されます。', // ko: 아직 찍은 사진이 없어요. 지금 필름을 빼면 이 롤은 사라져요. · en: No shots yet. If you unload now, this roll is discarded.
  'cam.unload': 'フィルムを取り出す', // ko: 필름 빼기 · en: Unload film
  'cam.rollSize': '撮影枚数', // ko: 롤 장수 · en: Roll size
  'cam.rollInfo': 'フィルム情報', // ko: 롤 정보 · en: roll info
  'cam.sec': '{n}秒', // ko: {n}초 · en: {n}s
  'cam.err.insecure': 'カメラは安全な接続（HTTPS）でのみ使用できます。「https://」で始まるアドレスで開いてください。', // ko: 카메라는 보안 연결(HTTPS)에서만 쓸 수 있어요. https 주소로 열어 주세요. · en: The camera only works over a secure (HTTPS) connection. Open the https address.
  'cam.err.unsupported': 'このブラウザはカメラに対応していません。最新のSafariまたはChromeで開いてください。', // ko: 이 브라우저는 카메라를 지원하지 않아요. 최신 Safari나 Chrome에서 열어 주세요. · en: This browser doesn't support the camera. Try the latest Safari or Chrome.
  'cam.err.busy': 'ほかのアプリがカメラを使用中です。そのアプリを閉じて、もう一度お試しください。そのあいだに、写真を読み込んで現像することもできます。', // ko: 다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해 주세요. 그동안 기기의 사진을 불러와 현상할 수 있어요. · en: Another app is using the camera. Close it and try again. In the meantime, you can import photos and develop them.
  'cam.err.notfound': 'このデバイスにカメラが見つかりませんでした。代わりに、デバイス内の写真を読み込んで現像できます。', // ko: 이 기기에서 카메라를 찾지 못했어요. 대신 기기의 사진을 불러와 현상할 수 있어요. · en: No camera was found on this device. You can import photos and develop them instead.
  'cam.quadProgress': 'レンズ{n}/4', // ko: 렌즈 {n}/4 · en: Lens {n}/4
  'common.skip': 'スキップ', // ko: 건너뛰기 · en: Skip
  'view.savedToast': '画像を保存しました', // ko: 이미지를 저장했어요 · en: Image saved
  'view.prev': '前の写真', // ko: 이전 사진 · en: Previous photo
  'view.next': '次の写真', // ko: 다음 사진 · en: Next photo
  'view.photoN': '{n}枚目の写真', // ko: {n}번째 사진 · en: Photo {n}
  'dr.applyRollConfirm': 'この設定を、フィルムのすべての写真に適用しますか？', // ko: 이 설정을 롤의 모든 사진에 적용할까요? · en: Apply these settings to every photo in the roll?
  'dr.original': 'オリジナル', // ko: 원본 · en: Original
  'dr.showOriginal': 'オリジナルを表示', // ko: 원본 보기 · en: Show original
  'dr.years': '{n}年', // ko: {n}년 · en: {n, plural, one {# year} other {# years}}
  'an.log.deleteFrame': '{n}コマ目の記録を削除', // ko: {n}번 컷 기록 삭제 · en: Delete frame {n} log
  'lab.rushFor': '今すぐ現像・{stock}', // ko: 지금 바로 현상 · {stock} · en: Develop now · {stock}
  'speed.default': '標準', // ko: 기본 · en: default
  'palette.moss': '苔色', // ko: 이끼 · en: Moss
  'palette.mono': 'モノクロ', // ko: 흑백 · en: Mono
  'palette.sepia': 'セピア', // ko: 세피아 · en: Sepia
  'palette.ice': '氷色', // ko: 얼음 · en: Ice
  'palette.berry': 'ベリー', // ko: 베리 · en: Berry
  'cam.chooseCamera': 'カメラを選ぶ', // ko: 카메라를 고르세요 · en: Choose your camera
  'cam.film': 'フィルム', // ko: 필름 · en: Film
  'cam.fixedFilm': '専用フィルム', // ko: 전용 필름 · en: Built-in film
  'cam.pin': '{name}をピン留め', // ko: {name} 고정 · en: Pin {name}
  'cam.pinHint': '先頭にピン留め', // ko: 맨 앞에 고정 · en: Pin to the front
  'cam.pinned': 'ピン留め中', // ko: 고정됨 · en: Pinned
  'cam.pinnedSay': '{name}をピン留めしました。先頭に表示されます', // ko: {name} 고정했어요 · 맨 앞에 보여요 · en: {name} pinned to the front
  'cam.unpinnedSay': '{name}のピン留めを外しました', // ko: {name} 고정을 풀었어요 · en: {name} unpinned
  'cam.pinnedToast': '{name}をピン留めして、先頭に移動しました', // ko: {name} 고정 · 맨 앞으로 옮겼어요 · en: {name} pinned · moved to the front
  'cam.pinShow': '表示', // ko: 보기 · en: Show
  'cam.otherWindow': '別のウインドウですでに撮影しました', // ko: 다른 창에서 이미 찍었어요 · en: Already taken in another window
  'cam.pressesDropped': 'シャッター{n}回分は取り消されました', // ko: {n}번 누른 건 취소됐어요 · en: {n, plural, one {# press was} other {# presses were}} cancelled
  'cam.quickStart': 'クイックスタート', // ko: 빠른 시작 · en: Quick start
  'cam.quick.film': 'フィルムカメラ', // ko: 일반 필름 · en: Film camera
  'cam.quick.instant': 'インスタント写真', // ko: 즉석 사진 · en: Instant photo
  'cam.quick.disposable': '使い捨て', // ko: 일회용 · en: Disposable
  'cam.pack': '{n}枚パック', // ko: {n}장 팩 · en: {n}-shot pack
  'cam.card': 'メモリー{n}枚', // ko: {n}장 메모리 · en: {n}-shot card
  'cam.halves': 'ハーフ{n}枚', // ko: 하프 {n}장 · en: {n} half-frames
  'cam.flashCharge': 'タップしてフラッシュを充電', // ko: 탭해서 플래시 충전 · en: Tap to charge the flash
  'cam.flashCharging': '充電中…', // ko: 충전 중… · en: Charging…
  'cam.flashReady': 'フラッシュ準備完了', // ko: 플래시 준비됨 · en: Flash ready
  'cam.ev': '露出', // ko: 노출 · en: Exposure
  'cam.palette': 'パレット', // ko: 팔레트 · en: Palette
  'cam.halfNext': '次の1枚は右半分に写ります', // ko: 다음 장은 오른쪽 칸에 찍혀요 · en: Next shot fills the right half
  'cam.double1': '1回目の露光が終わりました。重ねるシーンを探しましょう', // ko: 첫 번째 노출 완료 · 겹쳐 담을 장면을 찾아보세요 · en: First exposure done · now find the second scene
  'cam.quadHint': '1回押すと、4つのレンズが順に撮影します', // ko: 한 번 누르면 렌즈 4개가 차례로 찍어요 · en: One press, four lenses in sequence
  'cam.inCamera': 'カメラ内', // ko: 카메라 안 · en: In camera
  'cam.lastShot': '最後の写真', // ko: 마지막 사진 · en: Last shot
  'cam.packDone': 'パックを使いきりました。写真はアルバムで待っています。', // ko: 팩을 다 썼어요. 사진은 앨범에서 기다리고 있어요. · en: Pack finished. Your photos are waiting in the album.
  'cam.nShots': '{n}枚', // ko: {n}장 · en: {n, plural, one {# shot} other {# shots}}
  'cam.nHalves': '{n}枚（{f}コマ）', // ko: {n}컷({f}프레임) · en: {n, plural, one {# half} other {# halves}} ({f, plural, one {# frame} other {# frames}})
  'cam.nHalfShots': '{n}枚', // ko: {n}컷 · en: {n, plural, one {# half} other {# halves}}
  'cam.develop': '現像へ', // ko: 현상소로 · en: Send to lab
  'cam.finishPack': '取り出す', // ko: 팩 꺼내기 · en: Finish pack
  'cam.finishCard': '使い終える', // ko: 카드 정리 · en: Finish card
  'cam.rewindSub': 'フィルムを巻き戻して、現像に出します。現像が終わると、アルバムで見られます。', // ko: 필름을 감아 현상소로 보내요. 현상이 끝나면 앨범에서 볼 수 있어요. · en: The roll goes to the lab. Once developed, the photos appear in your album.
  'cam.finishSubViewable': '写真はすでにアルバムにあります。使い終えると、新しく入れ直せます。', // ko: 사진은 이미 앨범에 있어요. 정리하면 새로 넣을 수 있어요. · en: Your photos are already in the album. Finish to start a fresh one.
  'cam.finishPackConfirm': '{shots}撮りました。パックに残った{left}は使わずに、取り出しますか？', // ko: {shots} 찍었어요. 팩에 남은 {left}은 쓰지 않고 꺼낼까요? · en: {shots} taken. Finish the pack? The remaining {left} will go unused. [+ counts: n, m]
  'cam.finishCardConfirm': '{shots}撮りました。写真はアルバムにそのまま残ります。カードに残った{left}は空けたまま、使い終えますか？', // ko: {shots} 찍었어요. 카드에 남은 {left}은 비워 두고 정리할까요? 사진은 앨범에 그대로 있어요. · en: {shots} taken. Finish the card? The remaining {left} will stay blank; your photos stay in the album. [+ counts: n, m]
  'cam.switchBody': '別のカメラに替える', // ko: 다른 카메라로 바꾸기 · en: Switch camera body
  'cam.switchSub': 'いまのフィルムを先に現像に出してから、新しいカメラを選びます。', // ko: 지금 롤을 먼저 현상소로 보낸 뒤 새 카메라를 골라요. · en: This roll goes to the lab first, then you pick a new camera.
  'cam.switchSubViewable': 'いまの写真はアルバムに残したまま、新しいカメラを選びます。', // ko: 지금 사진은 앨범에 두고 새 카메라를 골라요. · en: Your photos stay in the album, then you pick a new camera.
  'cam.switchSubEmpty': 'まだ何も撮っていないので、すぐに替えられます。', // ko: 아직 찍은 사진이 없어서 바로 바꿀 수 있어요. · en: Nothing shot yet, so you can switch right away.
  'cam.switchConfirm': 'カメラを替えるには、いまのフィルム（{shots}）を先に現像に出します。撮った写真はすべて現像されます。', // ko: 카메라를 바꾸려면 지금 롤({shots})을 먼저 현상소로 보내야 해요. 찍은 사진은 모두 현상돼요. · en: To switch cameras, this roll ({shots}) goes to the lab first. Every shot will be developed. [+ counts: n] — shown only when no frames are left unused
  'cam.switchConfirmPack': 'カメラを替えるには、いまのパック（{shots}）を先に取り出します。写真はアルバムにそのまま残ります。', // ko: 카메라를 바꾸려면 지금 팩({shots})을 먼저 꺼내요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this pack ({shots}) comes out first. Your photos stay in the album. [+ counts: n]
  'cam.switchConfirmCard': 'カメラを替えるには、いまのカード（{shots}）を先に使い終えます。写真はアルバムにそのまま残ります。', // ko: 카메라를 바꾸려면 지금 카드({shots})를 먼저 정리해요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this card ({shots}) is finished first. Your photos stay in the album. [+ counts: n]
  'cam.switchOkFilm': '現像に出して替える', // ko: 현상소로 보내고 바꾸기 · en: Send to lab & switch
  'cam.switchOkDone': '使い終えて替える', // ko: 정리하고 바꾸기 · en: Finish & switch
  'cam.switchedLab': 'フィルムを現像に出しました。次のカメラを選びましょう。', // ko: 롤을 현상소에 보냈어요. 이제 새 카메라를 골라 보세요. · en: Roll sent to the lab. Pick your next camera.
  'cam.switchedAlbum': '写真をアルバムに入れました。次のカメラを選びましょう。', // ko: 사진을 앨범에 넣었어요. 이제 새 카메라를 골라 보세요. · en: Photos are in your album. Pick your next camera.
  'cam.more': 'その他', // ko: 더보기 · en: More
  'cam.flashOnSay': 'フラッシュオン', // ko: 플래시 켬 · en: Flash on
  'cam.flashOffSay': 'フラッシュオフ', // ko: 플래시 끔 · en: Flash off
  'cam.flashOnScreen': 'フラッシュオン。前面カメラでは画面が白く光ります', // ko: 플래시 켬 · 전면 카메라는 화면이 하얗게 빛나요 · en: Flash on · the front camera lights up the screen instead
  'cam.flipToFront': '前面カメラに切り替え', // ko: 전면 카메라로 전환 · en: Flip to front camera
  'cam.flipToBack': '背面カメラに切り替え', // ko: 후면 카메라로 전환 · en: Flip to back camera
  'gal.emptyHintCamera': 'カメラの中で、{shots}の写真が待っています。現像に出すと、仕上がりしだいここに表示されます。', // ko: 카메라 안에 사진 {shots}이 기다리고 있어요. 현상소로 보내면 현상을 마친 뒤 여기에 나타나요. · en: You have {shots} in the camera. Send them to the lab and they show up here once developed. [+ counts: n]
  'gal.developNow': '現像に出す', // ko: 현상소로 보내기 · en: Send to lab
  'gal.inCameraBanner': 'カメラの中に{shots}・現像に出す', // ko: 카메라 안 {shots} · 현상소로 보내기 · en: {shots} in the camera · Send to lab [+ counts: n]
  'lab.emptyCamera': 'カメラの中に{shots}の写真があります。現像に出すと、ここで現像が始まります。', // ko: 카메라 안에 사진 {shots}이 있어요. 현상소로 보내면 여기서 현상이 시작돼요. · en: You have {shots} in the camera. Send the roll to the lab and it develops here. [+ counts: n]
  'speed.title': 'いつ受け取りますか？', // ko: 언제 받아볼까요? · en: When do you want your prints?
  'speed.instant': '今すぐ', // ko: 즉시 · en: Instant
  'speed.why': '忘れたころに届く、あのときめき。それがフィルムの楽しみです。待てないときは「今すぐ」で。', // ko: 잊을 즈음 도착하는 설렘, 그게 필름의 재미예요. 바로 보려면 ‘즉시’. · en: Forget the roll, then find it again. That’s film. Instant shows them now.
  'speed.at.now': 'すぐアルバムへ', // ko: 지금 바로 앨범에 도착 · en: In your album right away
  'speed.at.today': '今日{time}着', // ko: 오늘 {time} 도착 · en: Arrives today at {time}
  'speed.at.tomorrow': '明日{time}着', // ko: 내일 {time} 도착 · en: Arrives tomorrow at {time}
  'speed.at.date': '{date}着', // ko: {date} 도착 · en: Arrives {date}
  'speed.instant.d': '待たずに、すぐ見られる', // ko: 기다림 없이, 지금 바로 · en: No waiting. See them now
  'speed.1h': '1時間', // ko: 1시간 · en: 1 hour
  'speed.1h.d': 'コーヒーでも一杯', // ko: 커피 한 잔의 기다림 · en: Time for a coffee
  'speed.morning': '朝9時', // ko: 아침 9시 · en: Next 9 AM
  'speed.morning.d': '目覚めたら、もう届いている', // ko: 자고 일어나면 와 있어요 · en: Wake up to your photos
  'speed.3d': '3日', // ko: 3일 · en: 3 days
  'speed.3d.d': 'フィルムらしく、気長に', // ko: 진짜 필름처럼, 느긋하게 · en: Slow, like real film
  'lab.title': '現像所', // ko: 현상소 · en: Film Lab
  'lab.empty': '現像所は、いま静かです。', // ko: 지금은 현상소가 조용해요. · en: The lab is quiet right now.
  'lab.emptyHint': '現像に出したフィルムは、ここで仕上がりを待ちます。', // ko: 현상소로 보낸 롤은 여기서 기다려요. · en: Rolls you send to the lab wait here.
  'lab.emptyWhat': '現像に出したフィルムが、仕上がるまで過ごす場所です。', // ko: 현상소로 보낸 롤이 현상될 때까지 머무는 곳이에요. · en: Rolls you send to the lab rest here while they develop.
  'lab.emptyHow': '選んだ時間に合わせて届きます。「今すぐ」なら、そのままアルバムへ。', // ko: 고른 시간에 맞춰 도착해요. ‘즉시’라면 바로 앨범으로. · en: They arrive on the schedule you choose. Instant skips the wait.
  'lab.intro': '現像が終わったフィルムは、アルバムに移ります。', // ko: 현상을 마친 롤은 앨범으로 옮겨져요. · en: Developed rolls move to your album.
  'lab.introRush': '待ちきれないときは「今すぐ現像」をどうぞ。', // ko: 기다리기 어렵다면 ‘지금 바로 현상’을 눌러 보세요. · en: Can’t wait? Tap Develop now.
  'lab.readyIn': 'あと{t}', // ko: {t} 남음 · en: Ready in {t}
  'lab.ready': '現像完了', // ko: 현상 완료 · en: Developed
  'lab.rush': '今すぐ現像', // ko: 지금 바로 현상 · en: Develop now
  'lab.rushConfirm': '待ち時間をスキップして、すぐにアルバムで見られます。', // ko: 기다림을 건너뛰고 바로 앨범에서 볼 수 있어요. · en: Skip the wait and see the photos in the album right away.
  'lab.developedToast': '{stock}、仕上がりました', // ko: {stock} 롤 현상이 끝났어요 · en: Your {stock} roll is developed
  'lab.open': '写真を見る', // ko: 사진 보기 · en: View photos
  'gal.title': 'アルバム', // ko: 앨범 · en: Album
  'gal.empty': '現像された写真はまだありません。', // ko: 아직 현상된 사진이 없어요. · en: No developed photos yet.
  'gal.emptyHint': '最初の1本を撮りに行きましょう。', // ko: 첫 롤은 카메라에서 시작돼요. · en: Your first roll starts in the camera.
  'gal.emptyHintLab': '現像所で、フィルム{n}本を現像しています。', // ko: 현상소에서 {n}롤이 현상 중이에요. · en: {n, plural, one {# roll is} other {# rolls are}} developing in the lab.
  'gal.openLab': '現像所を見る', // ko: 현상소 보기 · en: Open the lab
  'gal.import': '写真を読み込む', // ko: 사진 불러오기 · en: Import photos
  'gal.restore': 'バックアップから復元', // ko: 이전 폰 백업 불러오기 · en: Restore a backup
  'gal.importing': '現像中…{n}/{total}', // ko: 현상 중… {n}/{total} · en: Developing… {n}/{total}
  'gal.imported': '読み込んだ写真', // ko: 불러온 사진 · en: Imported
  'gal.new': 'NEW', // ko: 새 롤 · en: NEW
  'gal.frames': '{n}枚', // ko: {n}장 · en: {n, plural, one {# frame} other {# frames}}
  'gal.contact': 'ベタ焼き', // ko: 밀착 인화 · en: Contact sheet
  'gal.deleteRoll': 'フィルムを削除', // ko: 롤 삭제 · en: Delete roll
  'gal.deleteRollConfirm': 'このフィルムの写真{n}枚がすべて削除されます。削除してから数秒間は、取り消すことができます。', // ko: 이 롤의 사진 {n}장이 모두 삭제돼요. 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: All {n, plural, one {# photo} other {# photos}} in this roll will be deleted. You can undo it for a few seconds afterwards.
  'gal.developing': '現像中', // ko: 현상 중 · en: Developing
  'view.share': '共有', // ko: 공유 · en: Share
  'view.saveImage': '保存', // ko: 저장 · en: Save
  'view.darkroom': '暗室', // ko: 다크룸 · en: Darkroom
  'view.info': '情報', // ko: 정보 · en: Info
  'view.deleteConfirm': 'この写真を削除しますか？　オリジナルも一緒に削除されます。', // ko: 이 사진을 삭제할까요? 원본도 함께 삭제돼요. · en: Delete this photo? The original is deleted too.
  'view.developing': '現像中…', // ko: 현상 중… · en: Developing…
  'view.taken': '撮影日時', // ko: 촬영 · en: Taken
  'view.film': 'フィルム', // ko: 필름 · en: Film
  'view.frame': 'コマ', // ko: 컷 · en: Frame
  'view.size': 'サイズ', // ko: 크기 · en: Size
  'dr.title': '暗室', // ko: 다크룸 · en: Darkroom
  'dr.film': 'フィルム', // ko: 필름 · en: Film
  'dr.push': '増感／減感', // ko: 증감현상 (대비·입자) · en: Push / pull (contrast & grain)
  'dr.push.hint': '+でコントラストと粒子が強く、−でやわらかく', // ko: + 대비·입자↑ / − 부드럽게 · en: + contrast & grain / − softer
  'dr.stops': '{v}段', // ko: {v} 스톱 · en: {v} {n, plural, one {stop} other {stops}} [+ counts: n]
  'dr.normal': 'ノーマル', // ko: 노멀 · en: Normal
  'dr.redevelop': '再現像', // ko: 다시 현상 · en: Re-develop
  'dr.expired': '期限切れの風合い', // ko: 오래된 필름 느낌 (만료) · en: Aged film look (expired)
  'dr.grain': '粒子', // ko: 입자 · en: Grain
  'dr.halation': 'にじみ（ハレーション）', // ko: 빛 번짐 (할레이션) · en: Glow (halation)
  'dr.leak': '光漏れ', // ko: 빛샘 · en: Light leak
  'dr.leak.reroll': '別の光漏れ', // ko: 다른 빛샘 · en: Another leak
  'dr.flash': 'フラッシュ風', // ko: 플래시 룩 · en: Flash look
  'dr.date': '日付写し込み', // ko: 날짜 각인 · en: Date stamp
  'dr.border': 'フチ', // ko: 테두리 · en: Border
  'dr.border.none': 'なし', // ko: 없음 · en: None
  'dr.border.film35': '35mm', // ko: 35mm · en: 35mm
  'dr.border.instant': 'インスタント', // ko: 인스턴트 · en: Instant
  'dr.border.print': 'プリント', // ko: 인화지 · en: Print
  'dr.border.slide': 'スライド', // ko: 슬라이드 · en: Slide
  'dr.border.gate': 'シネ', // ko: 시네 · en: Cine
  'dr.border.sprocket': 'スプロケット', // ko: 스프로킷 · en: Sprocket
  'dr.compare': '長押しで比較', // ko: 길게 눌러 원본 보기 · en: Hold to see the original
  'dr.reset': 'リセット', // ko: 초기화 · en: Reset
  'dr.saved': '再現像しました', // ko: 다시 현상했어요 · en: Re-developed
  'dr.applyRoll': '全コマに適用', // ko: 롤 전체에 적용 · en: Apply to roll
  'dr.rotate': '回転', // ko: 회전 · en: Rotate
  'dr.ev': '露出補正', // ko: 노출 보정 · en: Exposure
  'dr.palette': 'パレット', // ko: 팔레트 · en: Palette
  'dr.camera': 'カメラ', // ko: 카메라 · en: Camera
  'hint.ios': 'Film Camelaをホーム画面に追加すると、写真をより安全に保管できます（「共有」→「ホーム画面に追加」）。', // ko: 홈 화면에 추가하면 사진을 더 안전하게 지킬 수 있어요. (공유 → 홈 화면에 추가) · en: Add Film Camela to your Home Screen to keep photos safe (Share → Add to Home Screen).
  'dr.applyRollDone': '全コマに適用しました', // ko: 롤 전체에 적용했어요 · en: Applied to the whole roll
  'dr.applyRollUndone': '全コマへの適用を取り消しました', // ko: 롤 전체 적용을 되돌렸어요 · en: Roll settings restored
  'dr.discardConfirm': '変更を破棄しますか？', // ko: 변경 사항을 버릴까요? · en: Discard changes?
  'dr.discard': '破棄', // ko: 버리기 · en: Discard
  'dr.saveNew': '複製を保存', // ko: 새 사진으로 저장 · en: Save as new photo
  'dr.savedNew': '複製を保存しました（{n}コマ目）', // ko: 새 사진으로 저장했어요 ({n}번) · en: Saved as a new photo (#{n})
  'dr.tone': 'デジタル風', // ko: 디지털 룩 · en: Digital look
  'dr.look': '仕上がり', // ko: 룩 · en: Look
  'dr.tone.none': '標準', // ko: 기본 · en: Default
  'dr.tone.cool': 'クール', // ko: 쿨 · en: Cool
  'dr.tone.warm': 'ウォーム', // ko: 웜 · en: Warm
  'dr.tone.washed': '色あせ', // ko: 바랜 · en: Washed
  'dr.tone.night': 'ナイト', // ko: 야간 · en: Night
  'view.noDate': '日付情報なし', // ko: 날짜 정보 없음 · en: No date info
  'roll.select': '選択', // ko: 선택 · en: Select
  'roll.selectHint': '写真をタップして選択', // ko: 사진을 눌러 선택하세요 · en: Tap photos to select them
  'roll.selectedN': '{n}枚を選択中', // ko: {n}장 선택됨 · en: {n} selected
  'roll.shareN': '{n}枚を共有', // ko: 공유 {n}장 · en: Share {n}
  'roll.saveN': '{n}枚を保存', // ko: 저장 {n}장 · en: Save {n}
  'roll.selectPhoto': '写真{n}を選択', // ko: 사진 {n} 선택 · en: Select photo {n}
  'roll.ready': '写真{n}枚の準備ができました', // ko: 사진 {n}장이 준비됐어요 · en: {n, plural, one {# photo} other {# photos}} ready
  'an.title': 'アナログ', // ko: 아날로그 · en: Analog
  'an.subtitle': '手もとのフィルムカメラのための道具', // ko: 실제 필름 카메라를 위한 도구 · en: Tools for your real film camera
  'an.meter': 'Sunny 16の露出計算', // ko: Sunny 16 노출 계산기 · en: Sunny 16 exposure calculator
  'an.iso': 'ISO', // ko: ISO · en: ISO
  'an.light': '光', // ko: 빛 · en: Light
  'an.aperture': '絞り', // ko: 조리개 · en: Aperture
  'an.shutter': 'シャッタースピード', // ko: 셔터 속도 · en: Shutter speed
  'an.comp': '露出補正', // ko: 노출 보정 · en: Compensation
  'an.tripod': '三脚がおすすめです', // ko: 삼각대를 권장해요 · en: Use a tripod
  'an.outOfRange': 'シャッタースピードの範囲外です。絞りかISOを変えてみてください。', // ko: 셔터 범위를 벗어났어요. 조리개나 ISO를 바꿔보세요. · en: Outside the shutter range. Try another aperture or ISO.
  'an.light.snow': '晴天の雪原・砂浜', // ko: 맑은 날 눈밭·해변 · en: Snow / sand, sunny
  'an.light.sunny': '晴れ（くっきりした影）', // ko: 맑음 (선명한 그림자) · en: Sunny (sharp shadows)
  'an.light.slightOvercast': '薄曇り', // ko: 약간 흐림 · en: Slightly overcast
  'an.light.overcast': '曇り', // ko: 흐림 · en: Overcast
  'an.light.heavyOvercast': '厚い曇り', // ko: 매우 흐림 · en: Heavy overcast
  'an.light.shade': '日陰', // ko: 그늘 · en: Open shade
  'an.light.sunset': '日没直前', // ko: 일몰 직전 · en: Just before sunset
  'an.light.indoorBright': '明るい室内', // ko: 밝은 실내 · en: Bright interior
  'an.light.indoor': '室内', // ko: 실내 · en: Interior
  'an.light.night': '夜の街', // ko: 밤거리 · en: Night street
  'an.log': 'フィルム撮影メモ', // ko: 필름 촬영 노트 · en: Film shooting log
  'an.log.empty': 'まだ記録中のフィルムはありません。', // ko: 아직 기록 중인 롤이 없어요. · en: No logged rolls yet.
  'an.log.new': '新しいフィルムを記録', // ko: 새 롤 기록 · en: Log a new roll
  'an.log.camera': 'カメラ', // ko: 카메라 · en: Camera
  'an.log.film': 'フィルム', // ko: 필름 · en: Film
  'an.log.exposures': '撮影枚数', // ko: 장수 · en: Exposures
  'an.log.note': 'メモ', // ko: 메모 · en: Note
  'an.log.addFrame': 'コマを記録', // ko: 컷 기록 · en: Log frame
  'an.log.lens': 'レンズ', // ko: 렌즈 · en: Lens
  'an.log.export': 'CSVを書き出す', // ko: CSV 내보내기 · en: Export CSV
  'an.log.deleteRoll': '記録を削除', // ko: 기록 삭제 · en: Delete log
  'an.log.deleteConfirm': 'このフィルムの記録を削除しますか？', // ko: 이 롤 기록을 삭제할까요? · en: Delete this roll log?
  'an.log.useMeter': '計算値を使う', // ko: 계산기 값 사용 · en: Use calculator values
  'an.log.frames': '{n}/{m}枚', // ko: {n}/{m}장 · en: {n}/{m} frames
  'an.log.location': '位置情報も保存', // ko: 위치 함께 저장 · en: Save location
  'an.active': '記録中のフィルム', // ko: 지금 기록 중인 롤 · en: Roll in progress
  'an.active.go': 'コマを記録する', // ko: 컷 기록하기 · en: Log a frame
  'an.log.repeat': '同じ設定で+1コマ', // ko: 같은 설정으로 +1컷 · en: Same settings +1
  'an.log.otherSettings': '別の設定', // ko: 다른 설정 · en: New settings
  'an.log.frameN': '{n}コマ目を記録', // ko: {n}번 컷 기록 · en: Log frame {n}
  'an.log.editFrame': '{n}コマ目を編集', // ko: {n}번 컷 고치기 · en: Edit frame {n}
  'an.log.saveFrame': 'このコマを記録', // ko: 이 컷 기록 · en: Log this frame
  'an.log.saveEdit': '変更を保存', // ko: 고친 내용 저장 · en: Save changes
  'an.log.manual': '直接入力', // ko: 직접 입력 · en: Type it in
  'an.log.pickStops': '目盛りから選ぶ', // ko: 눈금에서 고르기 · en: Pick from the dial
  'an.log.logged': '{n}コマ目を記録しました', // ko: {n}번 컷을 기록했어요 · en: Frame {n} logged
  'an.log.deleted': '{n}コマ目の記録を削除しました', // ko: {n}번 컷 기록을 지웠어요 · en: Frame {n} log deleted
  'an.log.undo': '取り消す', // ko: 되돌리기 · en: Undo
  'an.log.undoFailed': 'そのあいだに同じコマ番号が記録されたため、取り消せませんでした', // ko: 그 사이 같은 번호가 기록돼서 되돌리지 못했어요 · en: Couldn't undo: that frame number is taken now
  'an.log.full': 'このフィルムのコマをすべて記録しました', // ko: 이 롤의 컷을 모두 기록했어요 · en: Every frame on this roll is logged
  'an.log.firstHint': '1コマ撮るたびに、ここに記録しておきましょう。行をタップすれば、いつでも直せます。', // ko: 한 컷 찍을 때마다 여기에 남겨 두세요. 줄을 누르면 언제든 고칠 수 있어요. · en: Log each frame here as you shoot. Tap a row any time to edit it.
  'set.title': '設定', // ko: 설정 · en: Settings
  'set.lang': '言語', // ko: 언어 · en: Language
  'set.lang.auto': 'システム', // ko: 시스템 · en: System
  'set.sound': 'シャッター音', // ko: 셔터 소리 · en: Shutter sound
  'set.haptics': '振動', // ko: 진동 · en: Haptics
  'set.dateStamp': '写真に日付を写し込む', // ko: 사진에 날짜 넣기 · en: Add the date to photos
  'set.dateFormat': '日付の形式', // ko: 날짜 형식 · en: Date format
  'set.grid': 'グリッドを表示', // ko: 격자 표시 · en: Show grid
  'set.mirror': '前面カメラを左右反転', // ko: 전면 카메라 좌우 반전 저장 · en: Mirror front camera photos
  'set.rollSize': '標準の撮影枚数', // ko: 기본 롤 장수 · en: Default roll size
  'set.speed': '標準の現像スピード', // ko: 기본 현상 속도 · en: Default lab speed
  'set.speed.hint': 'フィルムを現像に出すとき、「標準」と表示されます。インスタントカメラとデジカメの写真は、現像所を通らずにそのままアルバムに入ります。', // ko: 필름 롤을 현상소로 보낼 때 ‘기본’으로 표시돼요. 인스턴트·디카 사진은 현상소 없이 바로 앨범에 들어가요. · en: Marked as default when you send a film roll to the lab. Instant and digital cameras skip the lab: their photos go straight to the album.
  'set.storage': 'ストレージ', // ko: 저장 공간 · en: Storage
  'set.storage.used': '{used}を使用中', // ko: {used} 사용 중 · en: {used} used
  'set.storage.persist': '写真が消えないように保護', // ko: 사진 지워지지 않게 보호 · en: Keep photos from being cleared
  'set.storage.persistHint': 'デバイスの空き容量が少なくなっても、ブラウザがこのアプリの写真を自動で消去しないよう依頼します。', // ko: 기기 저장 공간이 부족해져도 브라우저가 이 앱의 사진을 자동으로 지우지 않도록 요청해요. · en: Asks the browser not to clear this app’s photos automatically when the device runs low on space.
  'set.storage.persistAsk': '保護をオン', // ko: 보호 켜기 · en: Turn on
  'set.storage.persisted': '保護中', // ko: 보호됨 · en: Protected
  'set.storage.refusedShort': '未許可', // ko: 허락 안 됨 · en: Not allowed
  'set.storage.refused': 'このブラウザでは保護が許可されませんでした。Film Camelaをホーム画面に追加すると、より長く保管されます。バックアップもあわせて取っておきましょう。', // ko: 이 브라우저가 보호를 허락하지 않았어요. 홈 화면에 추가하면 더 오래 보관돼요. 백업도 함께 해 두세요. · en: This browser declined. Adding Film Camela to your Home Screen keeps photos longer. Keep a backup too.
  'set.install': 'ホーム画面にアプリを追加', // ko: 홈 화면에 앱 설치 · en: Install app to home screen
  'set.privacy': 'プライバシーポリシー', // ko: 개인정보 처리방침 · en: Privacy policy
  'set.terms': '利用規約', // ko: 이용약관 · en: Terms of use
  'set.support': 'サポート・お問い合わせ', // ko: 고객지원 · 문의 · en: Support & contact
  'set.licenses': 'オープンソースライセンス', // ko: 오픈소스 라이선스 · en: Open-source licenses
  'set.backup': 'バックアップ', // ko: 백업 · en: Backup
  'set.backup.hint': '写真と記録は、このデバイスにだけ保存されます。機種変更やブラウザのデータ消去の前に、バックアップ（.zip）を保存しておきましょう。', // ko: 사진과 기록은 이 기기에만 머물러요. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일(.zip)로 챙겨 두세요. · en: Your photos and logs live only on this device. Before you switch phones or clear browser data, save a backup file (.zip) somewhere safe.
  'set.backup.export': 'バックアップを保存（.zip）', // ko: 백업 파일 저장 (.zip) · en: Save backup file (.zip)
  'set.backup.saveAgain': 'もう一度保存', // ko: 한 번 더 저장 · en: Save another copy
  'set.backup.send': 'LINEやメールで送る', // ko: 카카오톡·드라이브로 보내기 · en: Send to KakaoTalk or Drive
  'set.backup.savedWeb': 'ダウンロードフォルダに保存しました。{name}', // ko: 다운로드 폴더에 저장했어요 · {name} · en: Saved to your Downloads folder · {name}
  'set.backup.savedShared': '共有シートで選んだ場所（「ファイル」やクラウドなど）に保存しました。{name}', // ko: 공유 창에서 고른 곳(파일·드라이브 등)에 저장했어요 · {name} · en: Saved where you picked in the share sheet (Files, Drive…) · {name}
  'set.backup.restoreHint': '機種変更するときは、このファイルをLINEやメールなどで自分に送り、新しいスマートフォンのFilm Camelaで「バックアップから復元」を選んでください。', // ko: 새 폰으로 옮기려면 이 파일을 카카오톡 ‘나와의 채팅’이나 드라이브로 보낸 뒤, 새 폰의 Film Camela 설정에서 ‘백업에서 복원’을 눌러 열어요. · en: To move to a new phone, send this file to yourself (KakaoTalk, Drive or email), then open it there with Restore from backup in Film Camela Settings.
  'set.credit': '© 2026 ATIUM GROUP Co., Ltd.', // ko: © 2026 아티움그룹 주식회사 (ATIUM GROUP Co., Ltd.) · en: © 2026 ATIUM GROUP Co., Ltd.
  'set.backup.import': 'バックアップから復元', // ko: 백업에서 복원 · en: Restore from backup
  'set.backup.working': 'バックアップ中…{done}/{total}', // ko: 백업 중… {done}/{total} · en: Backing up… {done}/{total}
  'set.backup.restoring': '復元中…', // ko: 복원 중… · en: Restoring…
  'set.backup.done': 'バックアップの準備ができました。フィルム{rolls}本・写真{photos}枚', // ko: 백업 준비 완료 · 롤 {rolls}개, 사진 {photos}장 · en: Backup ready · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}}
  'set.backup.save': 'ファイルを保存', // ko: 준비 완료 · 저장하기 · en: Ready · Save it
  'set.backup.saved': 'バックアップファイルを保存しました', // ko: 백업 파일을 저장했어요 · en: Backup file saved
  'set.backup.saveFailed': '保存できませんでした。もう一度タップしてください', // ko: 저장하지 못했어요. 다시 눌러 주세요 · en: Couldn't save it. Tap again
  'set.backup.tooLarge': '4GBを超えるため、1つのファイルにまとめられません。古いフィルムを整理してから、もう一度お試しください', // ko: 4GB가 넘어 파일 하나에 담을 수 없어요. 오래된 롤을 정리한 뒤 다시 시도해 주세요 · en: Over 4 GB, too large for one file. Clear out some old rolls and try again
  'set.backup.newer': '新しいバージョンのアプリで作成されたバックアップです。アプリをアップデートしてください', // ko: 더 새로운 버전의 앱에서 만든 백업이에요. 앱을 업데이트해 주세요 · en: This backup is from a newer version of the app. Please update
  'set.backup.partial': 'フィルム{rolls}本まで復元して止まりました。ストレージの空きを確保してからもう一度復元すると、続きから再開します', // ko: 롤 {rolls}개까지 복원하고 멈췄어요. 저장 공간을 확보한 뒤 다시 복원하면 이어서 진행돼요 · en: Stopped after restoring {rolls, plural, one {# roll} other {# rolls}}. Free up storage and restore again to continue
  'set.backup.empty': 'バックアップする写真や記録はまだありません', // ko: 아직 백업할 사진이나 기록이 없어요 · en: Nothing to back up yet
  'set.backup.restored': '復元が完了しました。フィルム{rolls}本・写真{photos}枚を追加しました', // ko: 복원 완료 · 롤 {rolls}개, 사진 {photos}장 추가 · en: Restored · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}} added
  'set.backup.skipped': 'すでにある{n}件は、そのままにしました', // ko: 이미 있는 항목 {n}개는 그대로 두었어요 · en: Skipped {n, plural, one {# item} other {# items}} you already have
  'set.backup.damaged': '破損した{n}件はスキップしました', // ko: 손상된 항목 {n}개는 건너뛰었어요 · en: Skipped {n} damaged {n, plural, one {item} other {items}}
  'set.backup.invalid': 'Film Camelaのバックアップファイルではないか、ファイルが破損しています', // ko: Film Camela 백업 파일이 아니거나 손상된 파일이에요 · en: Not a Film Camela backup, or the file is damaged
  'set.backup.failed': 'バックアップを作成できませんでした。ストレージの空き容量を確認してください', // ko: 백업을 만들지 못했어요. 저장 공간을 확인해 주세요 · en: Couldn't create the backup. Check free storage
  'set.reset': 'すべてのデータを削除', // ko: 모든 데이터 삭제 · en: Delete all data
  'set.resetConfirm': 'すべてのフィルム、写真、記録、設定が削除され、元に戻せません。先に上の「バックアップを保存」でバックアップしておきましょう。それでも削除しますか？', // ko: 모든 롤, 사진, 기록, 설정이 삭제되고 되돌릴 수 없어요. 먼저 위의 ‘백업 파일 저장’으로 백업해 두세요. 그래도 삭제할까요? · en: All rolls, photos, logs and settings will be deleted, and this cannot be undone. Save a backup file first (above). Delete anyway?
  'set.version': 'バージョン', // ko: 버전 · en: Version
  'set.replayOnb': '紹介をもう一度見る', // ko: 소개 다시 보기 · en: Replay intro
  'share.title': 'Film Camelaで撮影', // ko: Film Camela로 촬영 · en: Shot on Film Camela
  'err.storage': 'ストレージの空きが足りません。写真を何枚か削除して、もう一度お試しください。', // ko: 저장 공간이 부족해요. 사진 몇 장을 지우고 다시 시도해 주세요. · en: Storage is full. Delete a few photos and try again.
  'common.notFound': '見つかりませんでした。削除された可能性があります。', // ko: 찾을 수 없어요. 삭제되었을 수 있어요. · en: Couldn't find this. It may have been deleted.
  'an.log.noLocation': '位置情報を取得できなかったため、位置なしで保存しました', // ko: 위치를 확인하지 못해 위치 없이 저장했어요 · en: Couldn’t get your location, so it was saved without one
  'err.storagePermission': 'ストレージへのアクセスがオフになっています。設定 > アプリ > Film Camela > 権限で、ストレージを許可してください。', // ko: 저장 권한이 꺼져 있어요. 설정 > 앱 > Film Camela > 권한에서 저장공간을 허용해 주세요. · en: Storage permission is off. Allow it in Settings > Apps > Film Camela > Permissions.
  'err.noStorage': 'このブラウザの設定では、写真を保存できません。プライベートブラウズをオフにするか、サイトデータの保存を許可してから、アプリを開き直してください。', // ko: 이 브라우저 설정에서는 사진을 저장할 수 없어요. 사생활 보호(시크릿) 모드를 끄거나 사이트 데이터 저장을 허용해 주세요. · en: This browser won't let Film Camela save photos. Turn off private browsing or allow site data, then reopen the app.
  'err.import': 'このファイルは読み込めません。', // ko: 이 파일은 불러올 수 없어요. · en: This file could not be imported.
  'update.ready': '新しいバージョンの準備ができました', // ko: 새 버전이 준비됐어요 · en: A new version is ready
  'update.reload': '再読み込み', // ko: 새로고침 · en: Reload
  'offline.ready': 'オフラインでも使えます', // ko: 오프라인에서도 사용할 수 있어요 · en: Ready to work offline
  'a11y.cameraTitle': 'カメラ', // ko: 카메라 · en: Camera
  'a11y.rollLoaded': '{stock}を入れました。{n}枚撮り', // ko: {stock} · {n}장 넣었어요 · en: {stock} loaded · {n, plural, one {# shot} other {# shots}}
  'a11y.sentToLab': '現像に出しました。{wait}後に届きます', // ko: 현상소로 보냈어요 · {wait} 뒤 도착 · en: Sent to the lab · ready in {wait}
  'a11y.cameraKeys': '←→キーでカメラを選び、Tabキーでピン留めボタンに移動します', // ko: ← → 키로 카메라를 고르고, Tab으로 고정 버튼으로 가요 · en: Use the arrow keys to choose a camera; Tab reaches its pin button
  'cam.timerSay': '{n}秒後に撮影します。もう一度シャッターを押すと取り消せます', // ko: {n}초 뒤 촬영 · 셔터를 다시 누르면 취소 · en: Taking the photo in {n} seconds · press the shutter again to cancel
  'cam.timerCancelled': 'タイマーを取り消しました', // ko: 타이머를 취소했어요 · en: Timer cancelled
  'cam.tapToCancel': 'タップで取り消し', // ko: 탭하면 취소 · en: Tap to cancel
  'cam.cancelTimer': 'タイマーを取り消す', // ko: 타이머 취소 · en: Cancel timer
  'cam.doubleHint': '2回押して、1枚に重ねます', // ko: 두 번 눌러 한 장에 겹쳐요 · en: Two presses, one frame
  'cam.double2': 'もう一度押すと、最初のシーンに重ねて撮影します', // ko: 한 번 더 누르면 첫 장면 위에 겹쳐 찍혀요 · en: Press again to expose over the first shot
  'cam.pressBusy': '前の写真を保存しています', // ko: 앞 사진을 저장하는 중이에요 · en: Still saving the previous shots
  'cam.pressFull': '残りのコマがありません', // ko: 남은 컷이 없어요 · en: No frames left
  'cam.startingQueued': 'カメラの準備ができしだい撮影します', // ko: 카메라가 준비되면 바로 찍어요 · en: Taking the photo as soon as the camera is ready
  'cam.switchConfirmFilm2': 'カメラを替えると、いまのフィルムは現像に出されます。撮った{shots}は現像され、残りの{left}は使われません。', // ko: 카메라를 바꾸면 지금 롤은 현상소로 가요. 찍은 {shots}은 현상하고, 남은 {left}은 쓰지 않아요. · en: Switching sends this roll to the lab. The {shots} you took {n, plural, one {gets} other {get}} developed; the {left} left {m, plural, one {stays} other {stay}} unused. [+ counts: n, m]
  'cam.switchConfirmPack2': 'カメラを替えると、いまのパックを取り出します。撮った{shots}はアルバムへ。残りの{left}は使われません。', // ko: 카메라를 바꾸면 지금 팩을 꺼내요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching takes this pack out. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'cam.switchConfirmCard2': 'カメラを替えると、いまのカードを使い終えます。撮った{shots}はアルバムへ。残りの{left}は使われません。', // ko: 카메라를 바꾸면 지금 카드를 정리해요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching finishes this card. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'common.undo': '取り消す', // ko: 되돌리기 · en: Undo
  'view.deleteUndoConfirm': '削除してから数秒間は、取り消すことができます。', // ko: 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: You can undo it for a few seconds afterwards.
  'view.deleted': '写真を削除しました', // ko: 사진을 삭제했어요 · en: Photo deleted
  'view.restored': '写真を元に戻しました', // ko: 사진을 되돌렸어요 · en: Photo restored
  'view.deleteTitle': 'この写真を削除しますか？', // ko: 사진을 삭제할까요? · en: Delete this photo?
  'view.savedWeb': 'ダウンロードフォルダに保存しました', // ko: 다운로드 폴더에 저장했어요 · en: Saved to your Downloads folder
  'view.savedAndroid': 'ギャラリーの「Film Camela」アルバムに保存しました', // ko: 갤러리 › Film Camela 앨범에 저장했어요 · en: Saved to Gallery › Film Camela album
  'gal.deleteRollTitle': 'このフィルムを削除しますか？', // ko: 이 롤을 삭제할까요? · en: Delete this roll?
  'gal.rollDeleted': 'フィルムを削除しました', // ko: 롤을 삭제했어요 · en: Roll deleted
  'gal.rollRestored': 'フィルムを元に戻しました', // ko: 롤을 되돌렸어요 · en: Roll restored
  'gal.rollRestoreBlocked': 'カメラに別のフィルムが入っているため、元に戻せません', // ko: 카메라에 다른 롤이 들어 있어서 되돌릴 수 없어요 · en: Can't restore it: another roll is in the camera now
  'gal.framesHalf': '{f}コマ（{n}枚）', // ko: {f}프레임 ({n}컷) · en: {f, plural, one {# frame} other {# frames}} ({n, plural, one {# shot} other {# shots}})
  'gal.help': 'ヘルプ', // ko: 도움말 · en: Help
  'lab.rushTitle': '今すぐ現像しますか？', // ko: 지금 바로 현상할까요? · en: Develop now?
  'view.pushNormal': 'ノーマル', // ko: 노멀 · en: Normal
  'view.expiredNone': '新しいフィルム', // ko: 새 필름 · en: Fresh film
  'view.expiredYears': '期限切れから{n}年', // ko: {n}년 지난 필름 · en: Expired {n, plural, one {# year} other {# years}}
  'dur.days': '{n}日', // ko: {n}일 · en: {n}d
  'dur.hours': '{n}時間', // ko: {n}시간 · en: {n}h
  'dur.minutes': '{n}分', // ko: {n}분 · en: {n}m
  'dur.seconds': '{n}秒', // ko: {n}초 · en: {n}s
  'dur.pair': '{a}{b}', // ko: {a} {b} · en: {a} {b}
  'wait.days': '{n}日', // ko: {n}일 · en: {n} d
  'wait.hours': '{n}時間', // ko: {n}시간 · en: {n} h
  'wait.minutes': '{n}分', // ko: {n}분 · en: {n} min

  // MY tab (shots, rewarded ads, Pro) and the paywall sheet. {n} = a count; {left} = how many are left;
  // {time} = local clock time; {date} = a date; {store} = "Google Play" / "App Store" (never translated).
  'quota.empty': '今日の無料10枚を使い切りました。マイでチャージするか、Proで無制限に。',
  'my.free': '今日の無料撮影',
  'my.free.say': '今日の無料{n}枚のうち、残り{left}枚です',
  'my.unlimited': '無制限',
  'my.earned.label': '広告でもらった枚数',
  'my.earned.note': '日付が変わっても消えません',
  'my.resets': '{time}に無料{n}枚がまた使えます',
  'my.ad.watch': '広告を見て+{n}枚',
  'my.ad.left': '今日はあと{left}回（1日{n}回まで）',
  'my.ad.loading': '広告を読み込んでいます…',
  'my.ad.none': '今日の広告はすべて見ました。0時にまた見られます。',
  'my.ad.offline': 'インターネットに接続すると、広告を見られます。',
  'my.ad.blocked': '今は広告を見られません。',
  'my.ad.pro': 'Proなら広告なしで、好きなだけ撮れます。',
  'my.ad.rewarded': '+{n}枚もらいました。撮影を続けましょう。',
  'my.ad.dismissed': '広告を最後まで見ると{n}枚もらえます。',
  'my.ad.failed': '広告を読み込めませんでした。少し待ってからもう一度お試しください。',
  'my.pro.lead': '無制限の撮影・広告なし',
  'my.plans': 'Proプラン',
  'my.plan.week': '1週間',
  'my.plan.3month': '3か月',
  'my.plan.lifetime': '買い切り',
  'my.plan.week.d': '毎週自動更新',
  'my.plan.3month.d': '3か月ごとに自動更新',
  'my.plan.lifetime.d': '1回の購入で、ずっと使えます',
  'my.plan.best': 'いちばんお得',
  'my.buy': 'Proをはじめる',
  'my.restore': '購入を復元',
  'my.manage': 'サブスクリプションを管理',
  'my.pro.on': 'Proをご利用中です',
  'my.pro.lifetimeOn': '買い切り・無制限の撮影、広告なし',
  'my.pro.subOn': 'サブスクリプション利用中・無制限の撮影、広告なし',
  'my.pro.renews': '次回更新日：{date}',
  'my.pro.pending': 'お支払いの承認を待っています。承認されると、すぐにProが使えます。',
  'my.pro.noStore': '今はストアに接続できません。少し待ってからもう一度お試しください。',
  'my.pro.legal': 'サブスクリプションは、期間終了の24時間以上前に解約しない限り、同じ期間で自動更新されます。料金は{store}アカウントに請求されます。解約は{store}のサブスクリプション設定からいつでも行えます。買い切りは1回限りのお支払いです。',
  'my.buy.done': 'Proが使えるようになりました。好きなだけ撮りましょう。',
  'my.buy.failed': '購入を完了できませんでした。もう一度お試しください。',
  'my.restore.done': 'Proを復元しました。',
  'my.restore.none': 'このアカウントに復元できる購入はありません。',
  'my.restore.failed': '復元できませんでした。少し待ってからもう一度お試しください。',
  'my.app.title': 'アプリなら、もっと撮れます',
  'my.app.body': 'アプリでは広告で{n}枚追加、Proなら無制限に撮れます。',
  'my.app.play': 'Google Playで入手',
  'my.adPrivacy': '広告のプライバシー設定',
  'shots.left': '今日あと{n}枚',
  'shots.leftSay': '今日撮れる写真はあと{n}枚です',
  'pw.title': '今日の無料{n}枚を使い切りました',
  'pw.lead': 'まだ光がきれいなら、もう少し撮りましょう。',
  'pw.pro': 'Proで無制限に撮る',
  'pw.later': 'また明日にします',
};

export const cameraText: LocaleCameraText = {
  /** Camera body descriptions (expressive register, guide §1.1). */
  desc: {
    pro35: '頼れる35mm一眼レフ。どの35mmフィルムでも使えて、3つの比率にズーム、露出補正まで。', // ko: 믿음직한 35mm SLR. 모든 35mm 필름과 3가지 비율, 줌, 노출 보정까지. · en: A dependable 35mm SLR. Every 35mm film, three formats, zoom, and an exposure dial.
    snap27: '27枚撮りの使い捨てカメラ。ほんのりやわらかなレンズと、1枚ごとに充電するフラッシュ。', // ko: 27장짜리 일회용 카메라. 살짝 뭉개지는 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable. A soft plastic lens and a flash you charge before every shot.
    instasq: '10枚パックの真四角インスタント。撮ったそばから写真が出てきて、ゆっくりと像が浮かびます。', // ko: 정사각 인스턴트, 10장 팩. 찍자마자 사진이 나오고, 천천히 상이 떠올라요. · en: A square instant camera with 10-shot packs. Each print slides out and slowly comes to life.
    half72: '35mmの1コマに2枚を並べて撮るハーフサイズ。フィルム1本で72枚、残せる瞬間も2倍に。', // ko: 35mm 한 컷에 두 장을 나란히 담는 하프프레임. 한 롤에 72장, 두 배의 순간. · en: Two shots side by side in every frame. 72 half-frames, twice the moments.
    zonelc: 'トンネルのような周辺減光と、濃い色。街を歩く日のためのコンパクト。', // ko: 터널 같은 비네팅과 진한 색. 골목을 걷는 날을 위한 컴팩트. · en: Tunnel vignetting and saturated color. A compact made for wandering the streets.
    toy120: 'プラスチックレンズの中判トイカメラ。ぼやけた四隅、濃い周辺減光、たびたび起きる光漏れ。', // ko: 플라스틱 렌즈의 중판 토이 카메라. 흐릿한 가장자리, 짙은 비네팅, 자주 스미는 빛샘. · en: A plastic-lens medium-format toy. Soft edges, deep vignetting, and frequent light leaks.
    quad4: '4つのレンズが、0.2秒間隔で順番に。1枚に収まる、4つの動き。', // ko: 렌즈 4개가 0.2초 간격으로 차례차례. 한 장에 담기는 네 번의 움직임. · en: Four lenses fire 0.2 s apart. Four moments of motion in one frame.
    doublex: '1コマに、2回の露光。最初のシーンに、2つめのシーンがそっと重なります。', // ko: 한 컷에 두 번의 노출. 첫 장면 위로 두 번째 장면이 포개져요. · en: Two exposures, one frame. A second scene settles over the first.
    panox: '65:24のワイドパノラマ。視界いっぱいに、フィルム1本で21枚。', // ko: 65:24의 넓은 파노라마. 시야 가득, 한 롤에 21장. · en: Sweeping 65:24 panoramas. 21 frames per roll.
    fish180: '180°の円周魚眼。世界をまあるく写します。', // ko: 180° 원형 어안. 세상을 동그랗게 담아요. · en: A 180° circular fisheye. The whole world in a circle.
    cine: '2.39:1のシネスコサイズ。明るい光を横切る、青いフレア。', // ko: 2.39:1 시네마스코프. 밝은 빛을 가로지르는 푸른 플레어. · en: 2.39:1 anamorphic widescreen. Blue streaks of flare across bright lights.
    ccd03: '2003年、あのころのデジカメ。99枚のメモリー、デジタルの日付、撮ってすぐ確認。', // ko: 2003년 그 시절의 디카. 99장 메모리, 디지털 날짜, 찍고 바로 확인. · en: A digicam straight from 2003. 99-shot card, digital date imprint, instant review.
    pixel: '128×112のポケットピクセルカメラ。4色パレットで撮る30枚。', // ko: 128×112 픽셀의 포켓 카메라. 4색 팔레트에 담는 30장. · en: A 128×112 pocket pixel camera. 30 shots in four-color palettes.
    range: '静かなレンジファインダー。シャープなレンズ、ブライトフレーム、モノクロが基本。', // ko: 조용한 레인지파인더. 선명한 렌즈, 밝은 프레임 라인, 기본은 흑백. · en: A quiet rangefinder. Crisp lens, bright frame lines, black and white by default.
    aqua27: '防水ハウジングをまとった27枚撮りの使い捨て。水のような青緑の色調、やわらかなレンズ、1枚ごとに充電するフラッシュ。', // ko: 방수 하우징을 입은 27장 일회용. 물빛 청록 톤, 부드러운 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable in a waterproof housing. Blue-green water tones, a soft lens, a flash you charge every shot.
    instaw: '横長のワイドインスタント、10枚パック。大きく広がる写真に、ゆっくりと像が浮かびます。', // ko: 가로로 넓은 와이드 인스턴트, 10장 팩. 넓게 나온 사진에 천천히 상이 떠올라요. · en: A wide-format instant camera with 10-shot packs. Landscape prints slide out and slowly come to life.
    twin66: '上からのぞき込む二眼レフ。6×6の真四角で12枚、ファインダーの中は左右が逆に見えます。', // ko: 고개 숙여 내려다보는 이안 리플렉스. 6×6 정사각 12장, 파인더 속 세상은 좌우가 뒤바뀌어요. · en: A twin-lens reflex you look down into. 12 square 6×6 frames through a mirror-reversed finder.
    super8: '8mmホームムービーから切り出した1コマ。丸みのあるゲート、あたたかな色、粗い粒子。', // ko: 8mm 홈무비에서 꺼낸 한 프레임. 둥근 게이트, 따뜻한 색, 굵은 입자. · en: A single frame from an 8mm home movie. Rounded gate, warm color, heavy grain.
    slide35: 'リバーサルフィルム専用のコンパクト。鮮やかな色を、白いマウントに収めて返します。', // ko: 슬라이드 필름 전용 컴팩트. 쨍한 색을 하얀 마운트에 담아 돌려줘요. · en: A compact made for slide film. Vivid color, returned in white slide mounts.
    party: '大きなフラッシュが最初からオンの、パーティー向けコンパクト。正面から強く当たる光と、日付の写し込み。', // ko: 큼직한 플래시가 기본으로 켜지는 파티용 컴팩트. 정면으로 터지는 강한 플래시와 날짜 각인. · en: A party compact whose big flash is on by default. Hard, direct flash and a date imprint.
    kidcam: '0.3メガピクセルのキッズデジカメ。640ピクセル、めいっぱい濃い色、デジタルの日付、撮ってすぐ確認。', // ko: 0.3메가 어린이 디카. 640픽셀, 넘치는 채도, 디지털 날짜, 찍고 바로 확인. · en: A 0.3 MP kids’ camera. 640 px, colors turned all the way up, digital date, instant review.
    sprocket: 'パーフォレーションまで写るパノラマ。写真の上下に、フィルムの穴が残ります。', // ko: 필름 구멍까지 담기는 파노라마. 사진 위아래로 퍼포레이션이 그대로 남아요. · en: A panorama that runs right over the sprocket holes, so the perforations frame every shot.
    floppy98: 'フロッピーディスクに記録する1998年のデジカメ。1枚に640ピクセルの写真が20枚、冷たくにじんだ色。', // ko: 플로피 디스크에 저장하는 1998년 디카. 디스크 한 장에 640픽셀 사진 20장, 차갑고 뭉개진 색. · en: A 1998 digicam that saves to a floppy disk. 20 shots of 640 px per disk, cool smeared color.
    slim06: 'ポケットに入る700万画素の薄型デジカメ。鮮やかな色、最初からオンのフラッシュ、デジタルの日付。', // ko: 주머니에 쏙 들어가는 700만 화소 초슬림 디카. 쨍한 색, 기본으로 켜지는 플래시, 디지털 날짜. · en: A 7 MP ultra-slim for your pocket. Punchy color, flash on by default, digital date.
    bridge09: '20倍ズームの高倍率デジカメ。遠くのものも引き寄せて、4:3・3:2・1:1の3つの比率で。', // ko: 20배 줌의 하이줌 디카. 먼 곳도 당겨 찍고, 4:3·3:2·1:1 세 가지 비율로. · en: A 20× superzoom. Pull in what’s far away, in 4:3, 3:2 or 1:1.
    zoom90: '90年代のズームコンパクト。2倍ズーム、モーター巻き上げ、オレンジ色の日付。', // ko: 90년대 자동 줌 카메라. 2배 줌, 모터 감기, 주황색 날짜 각인. · en: A 90s auto zoom compact. 2× zoom, motor wind, orange date imprint.
    mf645: '6×4.5の中判フィルム。1本15枚、とても鋭いレンズと広い階調。', // ko: 6×4.5 중형 필름. 롤 하나에 15장, 아주 선명한 렌즈와 넓은 계조. · en: 6×4.5 medium format. 15 frames a roll, a very sharp lens and a long tonal range.
    pinhole: 'レンズの代わりに針穴ひとつの木の箱。全体がやわらかく、四隅は深く暗く落ちます。', // ko: 렌즈 대신 바늘구멍 하나로 찍는 나무 상자. 전체가 부드럽고 가장자리는 깊게 어두워요. · en: A wooden box with a pinhole instead of a lens. Soft all over, with deep, dark corners.
    flip03: '2004年のモトローラ RAZR V3の30万画素カメラ。640ピクセル、色あせた色、つぶれたディテール。', // ko: 2004년 모토로라 RAZR V3의 30만 화소 카메라. 640픽셀, 바랜 색, 뭉개진 디테일. · en: The 0.3 MP camera of the 2004 Motorola RAZR V3. 640 px, faded color, smeared detail.
    touch07: '初代iPhone（2007年）の200万画素カメラ。固定フォーカス、暖かいトーン、白く飛んだ空。', // ko: 2007년 첫 아이폰의 200만 화소 카메라. 고정 초점, 따뜻한 톤, 하얗게 날아간 하늘. · en: The 2 MP camera of the first iPhone (2007). Fixed focus, warm tones, blown-out skies.
    curve07: '2007年のBlackBerry Curveの200万画素カメラ。冷たいホワイトバランス、強いシャープネス、ざらついたノイズ。', // ko: 2007년 블랙베리 커브의 200만 화소 카메라. 차가운 화이트밸런스, 강한 샤픈, 자글자글한 노이즈. · en: The 2 MP camera of the 2007 BlackBerry Curve. Cool white balance, heavy sharpening, gritty noise.
    filter10: 'iPhone 4と2010年の写真アプリのフィルター。正方形の写真、浮いた黒、黄色いハイライト、白いフチ。', // ko: 2010년 아이폰 4와 사진 앱 필터 감성. 정사각 사진, 들뜬 검정, 노란 하이라이트, 하얀 테두리. · en: The iPhone 4 and the 2010 photo-app filters. Square shots, lifted blacks, yellow highlights, a white border.
  },
  /** Type word in the era line "1979 · SLR" (guide §3.3). The year and " · " are added by the app. */
  era: {
    SLR: '一眼レフ',
    Disposable: '使い捨て',
    Instant: 'インスタント',
    'Half-frame': 'ハーフサイズ',
    Compact: 'コンパクト',
    '120 toy': '120トイカメラ',
    '4-lens': '4レンズ',
    'Multi-ex': '多重露光',
    Panoramic: 'パノラマ',
    Fisheye: '魚眼',
    Anamorphic: 'アナモルフィック',
    Digicam: 'デジカメ',
    '2-bit': '2ビット',
    Rangefinder: 'レンジファインダー',
    Waterproof: '防水',
    Wide: 'ワイド',
    TLR: '二眼レフ',
    'Home movie': 'ホームムービー',
    Slide: 'リバーサル',
    'Big flash': 'ビッグフラッシュ',
    'Kids digicam': 'キッズデジカメ',
    Sprocket: 'スプロケット',
    'Floppy digicam': 'フロッピーデジカメ',
    'Ultra-slim': '薄型デジカメ',
    Superzoom: '高倍率ズーム',
    'Zoom compact': 'ズームコンパクト',
    'Medium format': '中判',
    Pinhole: 'ピンホール',
    'Flip phone': '折りたたみケータイ',
    Smartphone: 'スマートフォン',
    'Filter app': 'フィルターアプリ',
    'QWERTY phone': 'QWERTYフォン',
  },
};

/** Film stock / sensor descriptions (expressive register). Film names stay in Latin letters. */
export const stockText: LocaleStockText = {
  sunny200: '陽ざしをたっぷり含んだ、あたたかな黄色。旅と日常のスナップの定番。', // ko: 햇살을 머금은 따뜻한 노랑. 여행과 일상 스냅의 정석. · en: Warm yellows full of sunshine. The classic film for travel and everyday snapshots.
  muse400: 'やわらかな肌の色と、パステルのハイライト。人を撮るためのポートレートフィルム。', // ko: 부드러운 피부톤, 파스텔빛 하이라이트. 사람을 담기 좋은 인물용 필름. · en: Gentle skin tones and pastel highlights. Made for portraits.
  mint400: '影にほのかな緑。街の空気を、そのまま1コマに。', // ko: 그늘에 살짝 도는 초록빛. 도시와 거리의 공기. · en: A hint of green in the shadows. City air in a frame.
  snap800: '使い捨てカメラの、あのころの感じ。フラッシュ、濃い周辺減光、偶然が生んだ光漏れ。', // ko: 일회용 카메라, 그때 그 느낌. 플래시, 진한 비네팅, 우연이 만든 빛샘. · en: Straight out of a disposable. Flash, deep vignetting, and leaks by happy accident.
  mono400: '深い黒と、ざらついた粒子のモノクロ。ありのままを写す、ドキュメンタリーの手ざわり。', // ko: 깊은 검정과 거친 입자의 흑백. 있는 그대로를 담는 다큐멘터리의 결. · en: Deep blacks and gritty grain. Black and white that tells it straight.
  insta600: 'ほんのり色あせた色と、白いフチ。手のひらに収まる、インスタント写真のぬくもり。', // ko: 살짝 바랜 색과 하얀 테두리. 손에 쥐는 즉석 사진의 온기. · en: Softly faded color in a white frame. The warmth of an instant print.
  neon800t: 'タングステンタイプのシネマフィルム。ネオンのまわりに、赤いハレーションがにじみます。', // ko: 텅스텐 시네마 필름. 네온 불빛 둘레로 번지는 붉은 할레이션. · en: Tungsten cinema film. Red halation blooms around neon lights.
  velvet50: '鮮やかな彩度と、高いコントラスト。風景のためのリバーサルフィルム。', // ko: 쨍한 채도와 높은 대비의 슬라이드 필름. 풍경을 위한 필름. · en: Rich saturation and bold contrast. A slide film for landscapes.
  chrome100: '澄んだ、クールなリバーサルの色調。抜けるような青空。', // ko: 맑고 차가운 슬라이드 톤. 투명하게 갠 하늘. · en: Clean, cool slide tones. Skies as clear as glass.
  silver100: 'きめ細かな粒子と、豊かな階調。光の機微まで繊細に写すモノクロ。', // ko: 고운 입자와 넓은 계조. 빛의 결이 섬세한 흑백. · en: Fine grain and a long tonal range. Black and white in quiet, subtle shades.
  dream160: '低いコントラスト、空気のように軽いパステル。', // ko: 낮은 대비, 공기처럼 가벼운 파스텔. · en: Low contrast and pastels as light as air.
  expired98: '1998年に期限が切れたフィルム。マゼンタのかぶりとほこり。仕上がりは、現像してみるまでわかりません。', // ko: 1998년에 만료된 필름. 마젠타 포그와 먼지, 결과는 현상해 봐야 알아요. · en: Expired in 1998. Magenta fog, dust, and a surprise in every frame.
  xpro200: 'リバーサルフィルムをネガ（C-41）でクロス現像。強いコントラスト、黄緑のハイライト、青緑の影。', // ko: 슬라이드 필름을 네거티브(C-41)로 교차현상. 강한 대비, 연둣빛 하이라이트, 청록빛 그림자. · en: Slide film cross-processed as negative (C-41). Hard contrast, lime highlights, teal shadows.
  instamini: '明るく軽やかなミニインスタント。すっきりした白と、少しクールな色調。', // ko: 밝고 산뜻한 미니 인스턴트. 깨끗한 화이트와 살짝 차가운 톤. · en: Bright, crisp mini instant film with clean whites and a cool touch.
  ccd: '2000年代初めのデジカメCCD。白飛びするハイライト、青みがかった色、紫のにじみ。', // ko: 2000년대 초 디카의 CCD. 날아가는 하이라이트, 푸르스름한 톤, 보랏빛 번짐. · en: The CCD of an early-2000s digicam. Clipped highlights, a blue cast, purple fringing.
  pixel: '128ピクセル・2ビットのセンサー。たった4色と、ディザリング。', // ko: 128픽셀 2비트 센서. 단 4가지 색과 디더링. · en: A 128-pixel, 2-bit sensor. Just four colors and dithering.
  aqua400: '水中用の使い捨てフィルム。赤みが抜けた青緑の色調と、かすんだような粒子。', // ko: 물속 일회용 필름. 붉은빛이 바래 사라진 청록 톤, 뿌연 입자. · en: Underwater disposable film. Reds fade into a blue-green haze, with soft grain.
  instawide: 'ワイドインスタントフィルム。自然な色と、ほんのりあたたかなハイライト。', // ko: 와이드 인스턴트 필름. 자연스러운 색에 살짝 따뜻한 하이라이트. · en: Wide instant film. Natural color with gently warm highlights.
  reel40: 'ホームムービー用のリバーサルフィルム。あたたかく濃い色、粗い粒子、ほこりの舞うゲート。', // ko: 홈무비 리버설 필름. 따뜻하고 진한 색, 굵은 입자, 먼지 앉은 게이트. · en: Home-movie reversal film. Warm, saturated color, big grain, and a dusty gate.
  toycmos: '0.3メガピクセルのおもちゃセンサー。キャンディのような色、白飛び、まだらなカラーノイズ。', // ko: 0.3메가 장난감 센서. 사탕 같은 색, 날아간 하이라이트, 얼룩덜룩한 색 노이즈. · en: A 0.3 MP toy sensor: candy colors, blown highlights, blotchy color noise.
  vga98: '90年代末のフロッピーデジカメのセンサー。狭い階調、冷たい色かぶり、にじんだJPEG。', // ko: 90년대 말 플로피 디카의 센서. 좁은 계조, 차가운 톤, 뭉개진 JPEG. · en: A late-90s floppy-disk sensor. Short tonal range, a cool cast, soft JPEG blur.
  ccd7: '2000年代半ばの700万画素CCD。鮮やかな色、暖かい肌、強いシャープネス、すぐ白飛びするハイライト。', // ko: 2000년대 중반 700만 화소 CCD. 쨍한 색, 따뜻한 피부, 과한 샤프닝, 확 날아가는 하이라이트. · en: A mid-2000s 7 MP CCD. Punchy color, warm skin, crunchy sharpening, hard-clipped highlights.
  vgaphone: '初期のカメラ付きケータイのセンサー。あせた色、黄緑の色かぶり、ざらついた影。', // ko: 초기 폰카 센서. 바랜 색, 누르스름한 초록빛, 자글자글한 그림자. · en: An early camera-phone sensor. Washed out, a green-yellow cast, noisy shadows.
  phone2mp: '第1世代スマートフォンのセンサー。暖かいホワイトバランス、白く飛んだ空、やわらかいディテール。', // ko: 1세대 스마트폰 센서. 따뜻한 화이트밸런스, 날아간 하늘, 부드러운 디테일. · en: A first-generation smartphone sensor. Warm white balance, blown skies, soft detail.
  bbcurve: 'QWERTYフォンのセンサー。青みがかったトーン、強すぎるシャープネス、粗いシャドウノイズ。', // ko: 쿼티폰 센서. 푸르스름한 톤, 과한 샤픈, 거친 그림자 노이즈. · en: A QWERTY-phone sensor. Bluish tones, over-sharpened edges, coarse shadow noise.
  app10: '2010年代初めの写真アプリのフィルター。マットな黒、黄色いハイライト、強い周辺減光。', // ko: 2010년대 초 사진 앱 필터. 들뜬 검정, 노란 하이라이트, 진한 비네팅. · en: An early-2010s photo-app filter. Matte blacks, yellow highlights, a heavy vignette.
};
