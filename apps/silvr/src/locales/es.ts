/**
 * Film Camela — Spanish (neutral, LatAm-friendly) (es). Lazy-loaded when this language is chosen or detected.
 *
 * TRANSLATOR CONTRACT — read docs/10_LOCALIZATION_GUIDE.md first (§2.5 for this language, §3 names,
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
 *    Categories one / many / other ("many" is only for exact millions; write one + other).
 *     '{n, plural, one {# foto} other {# fotos}}'
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
  // 'app.tagline': '', // ko: 원본이 남는 필름 카메라 · en: The film camera that keeps your originals
  'tab.camera': 'Cámara', // from guide §8.3 · en: Camera
  'tab.lab': 'Revelado', // from guide §8.3 · en: Lab
  'tab.gallery': 'Álbum', // from guide §8.3 · en: Album
  'tab.analog': 'Analógico', // from guide §8.3 · en: Analog
  'tab.settings': 'Ajustes', // from guide §8.3 · en: Settings
  // 'common.cancel': '', // ko: 취소 · en: Cancel
  // 'common.close': '', // ko: 닫기 · en: Close
  // 'common.save': '', // ko: 저장 · en: Save
  // 'common.delete': '', // ko: 삭제 · en: Delete
  // 'common.done': '', // ko: 완료 · en: Done
  // 'common.retry': '', // ko: 다시 시도 · en: Retry
  // 'common.back': '', // ko: 뒤로 · en: Back
  // 'common.next': '', // ko: 다음 · en: Next
  // 'common.start': '', // ko: 시작하기 · en: Get started
  // 'common.on': '', // ko: 켜짐 · en: On
  // 'common.off': '', // ko: 꺼짐 · en: Off
  // 'common.pro': '', // ko: PRO · en: PRO
  // 'common.loading': '', // ko: 불러오는 중… · en: Loading…
  // 'common.error': '', // ko: 문제가 발생했어요. 다시 시도해 주세요. · en: Something went wrong. Please try again.
  // 'toast.close': '', // ko: 알림 닫기 · en: Dismiss
  // 'lab.developedMany': '', // ko: 롤 {n}개 현상이 끝났어요 · en: {n} rolls developed
  // 'cam.loadCard': '', // ko: 메모리 카드 넣기 · en: Insert card
  // 'cam.loadPack': '', // ko: 필름 팩 넣기 · en: Load film pack
  // 'cam.useCamera': '', // ko: 이 카메라로 찍기 · en: Use this camera
  // 'cam.allCameras': '', // ko: 모두 보기 · en: All cameras
  // 'cam.allCamerasTitle': '', // ko: 카메라 모두 보기 · en: All cameras
  // 'cam.group.film': '', // ko: 필름 카메라 · en: Film cameras
  // 'cam.group.instant': '', // ko: 즉석 카메라 · en: Instant cameras
  // 'cam.group.digital': '', // ko: 디지털 · en: Digital
  // 'cam.group.toy': '', // ko: 토이·특수 카메라 · en: Toy & special
  // 'a11y.stockKeys': '', // ko: ← → 키로 필름을 살펴보고 Enter로 골라요 · en: Arrow keys browse films; Enter selects
  // 'gal.importHint': '', // ko: 고른 필름으로 현상해요. 다크룸에서 언제든 바꿀 수 있어요. · en: Photos are developed with this film. You can change it in the darkroom any time.
  // 'onb.restore': '', // ko: 이전 폰에서 옮겨 오셨나요? 백업 불러오기 · en: Coming from another phone? Restore a backup
  // 'onb.1.title': '', // ko: 필름처럼 찍고 · en: Shoot like film
  // 'onb.1.body': '', // ko: 카메라를 고르고 롤을 넣으세요. 남은 장수를 세며 신중하게 한 장씩. · en: Pick a camera, load a roll and make every frame count.
  // 'onb.2.title': '', // ko: 현상소에서 기다리고 · en: Wait for the lab
  // 'onb.2.body': '', // ko: 다 찍은 롤은 현상소로 보내요. 즉시, 1시간, 아침 9시, 3일 중 기다림을 직접 고르세요. · en: Send finished rolls to the lab. Instant, 1 hour, next 9 AM or 3 days: you choose the wait.
  // 'onb.3.title': '', // ko: 다크룸에서 다시 현상 · en: Re-develop in the darkroom
  // 'onb.3.body': '', // ko: 찍은 원본은 그대로 남아요. 필름 종류, 밝기, 오래된 필름 느낌, 빛 번짐을 언제든 다시 바꿔보세요. · en: Your original shot is always kept. Change the film, brightness, aged-film look or light glow any time.
  // 'onb.privacy': '', // ko: 무료 · 계정도 서버도 없어요. 모든 사진은 이 기기에만 저장돼요. · en: Free. No account, no server. Every photo stays on this device.
  // 'cam.loadFilm': '', // ko: 필름 넣기 · en: Load film
  // 'cam.chooseFilm': '', // ko: 필름을 고르세요 · en: Choose your film
  // 'cam.exposures': '', // ko: {n}장 · en: {n} exp
  // 'cam.load': '', // ko: 이 필름 넣기 · en: Load this film
  // 'cam.left': '', // ko: {n}장 남음 · en: {n} left
  // 'cam.rewind': '', // ko: 현상소로 보내기 · en: Send to lab
  // 'cam.rollFull': '', // ko: 롤을 다 찍었어요! · en: Roll finished!
  // 'cam.sendToLab': '', // ko: 현상소로 보내기 · en: Send to lab
  // 'cam.flash': '', // ko: 플래시 · en: Flash
  // 'cam.timer': '', // ko: 타이머 · en: Timer
  // 'cam.grid': '', // ko: 격자 · en: Grid
  // 'cam.date': '', // ko: 날짜 · en: Date
  // 'cam.flip': '', // ko: 카메라 전환 · en: Switch camera
  // 'cam.zoom': '', // ko: 줌 · en: Zoom
  // 'cam.aspect': '', // ko: 비율 · en: Format
  // 'cam.shutter': '', // ko: 촬영 · en: Take photo
  // 'cam.noCamera.title': '', // ko: 카메라를 사용할 수 없어요 · en: Camera unavailable
  // 'cam.noCamera.body': '', // ko: 브라우저/기기 설정에서 카메라 권한을 허용해 주세요. 그동안 기기의 사진을 불러와 현상할 수 있어요. · en: Allow camera access in your browser or device settings. Meanwhile you can import photos and develop them.
  // 'cam.noCamera.import': '', // ko: 사진 불러와 현상하기 · en: Import & develop photos
  // 'cam.starting': '', // ko: 카메라 준비 중… · en: Starting camera…
  // 'cam.saved': '', // ko: {n}번째 컷 · en: Frame {n}
  // 'cam.rewindConfirm': '', // ko: {shots} 찍었어요. 남은 {left}은 비워 둔 채 현상소로 보낼까요? · en: {shots} taken. Send this roll to the lab? The remaining {left} will stay blank. [+ counts: n, m]
  // 'cam.emptyRewind': '', // ko: 아직 찍은 사진이 없어요. 필름을 빼면 이 롤은 사라져요. · en: No frames yet. Unloading discards this roll.
  // 'cam.unload': '', // ko: 필름 빼기 · en: Unload film
  // 'cam.rollSize': '', // ko: 롤 장수 · en: Roll size
  // 'cam.rollInfo': '', // ko: 롤 정보 · en: roll info
  // 'cam.sec': '', // ko: {n}초 · en: {n}s
  // 'cam.err.insecure': '', // ko: 카메라는 보안 연결(HTTPS)에서만 쓸 수 있어요. https 주소로 열어 주세요. · en: The camera only works over a secure (HTTPS) connection. Open the https address.
  // 'cam.err.unsupported': '', // ko: 이 브라우저는 카메라를 지원하지 않아요. 최신 Safari나 Chrome에서 열어 주세요. · en: This browser doesn't support the camera. Try the latest Safari or Chrome.
  // 'cam.err.busy': '', // ko: 다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해 주세요. 그동안 기기의 사진을 불러와 현상할 수 있어요. · en: Another app is using the camera. Close it and try again. Meanwhile you can import photos and develop them.
  // 'cam.err.notfound': '', // ko: 이 기기에서 카메라를 찾지 못했어요. 대신 기기의 사진을 불러와 현상할 수 있어요. · en: No camera was found on this device. You can import photos and develop them instead.
  // 'cam.quadProgress': '', // ko: 렌즈 {n}/4 · en: Lens {n}/4
  // 'common.skip': '', // ko: 건너뛰기 · en: Skip
  // 'view.savedToast': '', // ko: 이미지를 저장했어요 · en: Image saved
  // 'view.prev': '', // ko: 이전 사진 · en: Previous photo
  // 'view.next': '', // ko: 다음 사진 · en: Next photo
  // 'view.photoN': '', // ko: {n}번째 사진 · en: Photo {n}
  // 'dr.applyRollConfirm': '', // ko: 이 설정을 롤의 모든 사진에 적용할까요? · en: Apply these settings to every photo in the roll?
  // 'dr.original': '', // ko: 원본 · en: Original
  // 'dr.showOriginal': '', // ko: 원본 보기 · en: Show original
  // 'dr.years': '', // ko: {n}년 · en: {n, plural, one {# year} other {# years}}
  // 'an.log.deleteFrame': '', // ko: {n}번 컷 기록 삭제 · en: Delete frame {n} log
  // 'lab.rushFor': '', // ko: 지금 바로 현상 · {stock} · en: Develop now · {stock}
  // 'speed.default': '', // ko: 기본 · en: default
  // 'palette.moss': '', // ko: 이끼 · en: Moss
  // 'palette.mono': '', // ko: 흑백 · en: Mono
  // 'palette.sepia': '', // ko: 세피아 · en: Sepia
  // 'palette.ice': '', // ko: 얼음 · en: Ice
  // 'palette.berry': '', // ko: 베리 · en: Berry
  // 'cam.chooseCamera': '', // ko: 카메라를 고르세요 · en: Choose your camera
  // 'cam.film': '', // ko: 필름 · en: Film
  // 'cam.fixedFilm': '', // ko: 전용 필름 · en: Built-in film
  // 'cam.pin': '', // ko: {name} 고정 · en: Pin {name}
  // 'cam.pinHint': '', // ko: 맨 앞에 고정 · en: Pin to the front
  // 'cam.pinned': '', // ko: 고정됨 · en: Pinned
  // 'cam.pinnedSay': '', // ko: {name} 고정했어요 · 맨 앞에 보여요 · en: {name} pinned to the front
  // 'cam.unpinnedSay': '', // ko: {name} 고정을 풀었어요 · en: {name} unpinned
  // 'cam.pinnedToast': '', // ko: {name} 고정 · 맨 앞으로 옮겼어요 · en: {name} pinned · moved to the front
  // 'cam.pinShow': '', // ko: 보기 · en: Show
  // 'cam.otherWindow': '', // ko: 다른 창에서 이미 찍었어요 · en: Already taken in another window
  // 'cam.pressesDropped': '', // ko: {n}번 누른 건 취소됐어요 · en: {n, plural, one {# press was} other {# presses were}} cancelled
  // 'cam.quickStart': '', // ko: 빠른 시작 · en: Quick start
  // 'cam.quick.film': '', // ko: 일반 필름 · en: Film camera
  // 'cam.quick.instant': '', // ko: 즉석 사진 · en: Instant photo
  // 'cam.quick.disposable': '', // ko: 일회용 · en: Disposable
  // 'cam.pack': '', // ko: {n}장 팩 · en: {n}-shot pack
  // 'cam.card': '', // ko: {n}장 메모리 · en: {n}-shot card
  // 'cam.halves': '', // ko: 하프 {n}장 · en: {n} half-frames
  // 'cam.flashCharge': '', // ko: 탭해서 플래시 충전 · en: Tap to charge the flash
  // 'cam.flashCharging': '', // ko: 충전 중… · en: Charging…
  // 'cam.flashReady': '', // ko: 플래시 준비됨 · en: Flash ready
  // 'cam.ev': '', // ko: 노출 · en: Exposure
  // 'cam.palette': '', // ko: 팔레트 · en: Palette
  // 'cam.halfNext': '', // ko: 다음 장은 오른쪽 칸에 찍혀요 · en: Next shot fills the right half
  // 'cam.double1': '', // ko: 첫 번째 노출 완료 · 겹쳐 찍을 장면을 찾으세요 · en: First exposure done · frame the second one
  // 'cam.quadHint': '', // ko: 한 번 누르면 렌즈 4개가 차례로 찍어요 · en: One press, four lenses in sequence
  // 'cam.inCamera': '', // ko: 카메라 안 · en: In camera
  // 'cam.lastShot': '', // ko: 마지막 사진 · en: Last shot
  // 'cam.packDone': '', // ko: 팩을 다 썼어요! 사진은 앨범에 있어요. · en: Pack finished! Your photos are in the album.
  // 'cam.nShots': '', // ko: {n}장 · en: {n, plural, one {# shot} other {# shots}}
  // 'cam.nHalves': '', // ko: {n}컷({f}프레임) · en: {n, plural, one {# half} other {# halves}} ({f, plural, one {# frame} other {# frames}})
  // 'cam.nHalfShots': '', // ko: {n}컷 · en: {n, plural, one {# half} other {# halves}}
  // 'cam.develop': '', // ko: 현상소로 · en: Send to lab
  // 'cam.finishPack': '', // ko: 팩 꺼내기 · en: Finish pack
  // 'cam.finishCard': '', // ko: 카드 정리 · en: Finish card
  // 'cam.rewindSub': '', // ko: 필름을 감아 현상소로 보내요. 현상이 끝나면 앨범에서 볼 수 있어요. · en: The roll goes to the lab. Once developed, the photos appear in your album.
  // 'cam.finishSubViewable': '', // ko: 사진은 이미 앨범에 있어요. 정리하면 새로 넣을 수 있어요. · en: Your photos are already in the album. Finish to start a fresh one.
  // 'cam.finishPackConfirm': '', // ko: {shots} 찍었어요. 팩에 남은 {left}은 쓰지 않고 꺼낼까요? · en: {shots} taken. Finish the pack? The remaining {left} will go unused. [+ counts: n, m]
  // 'cam.finishCardConfirm': '', // ko: {shots} 찍었어요. 카드에 남은 {left}은 비워 두고 정리할까요? 사진은 앨범에 그대로 있어요. · en: {shots} taken. Finish the card? The remaining {left} will stay blank; your photos stay in the album. [+ counts: n, m]
  // 'cam.switchBody': '', // ko: 다른 카메라로 바꾸기 · en: Switch camera body
  // 'cam.switchSub': '', // ko: 지금 롤을 먼저 현상소로 보낸 뒤 새 카메라를 골라요. · en: This roll goes to the lab first, then you pick a new camera.
  // 'cam.switchSubViewable': '', // ko: 지금 사진은 앨범에 두고 새 카메라를 골라요. · en: Your photos stay in the album, then you pick a new camera.
  // 'cam.switchSubEmpty': '', // ko: 아직 찍은 사진이 없어서 바로 바꿀 수 있어요. · en: Nothing shot yet, so you can switch right away.
  // 'cam.switchConfirm': '', // ko: 카메라를 바꾸려면 지금 롤({shots})을 먼저 현상소로 보내야 해요. 남은 칸은 비워 둔 채 현상해요. · en: To switch cameras, this roll ({shots}) goes to the lab first. Unused frames stay blank. [+ counts: n]
  // 'cam.switchConfirmPack': '', // ko: 카메라를 바꾸려면 지금 팩({shots})을 먼저 꺼내요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this pack ({shots}) comes out first. Your photos stay in the album. [+ counts: n]
  // 'cam.switchConfirmCard': '', // ko: 카메라를 바꾸려면 지금 카드({shots})를 먼저 정리해요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this card ({shots}) is finished first. Your photos stay in the album. [+ counts: n]
  // 'cam.switchOkFilm': '', // ko: 현상소로 보내고 바꾸기 · en: Send to lab & switch
  // 'cam.switchOkDone': '', // ko: 정리하고 바꾸기 · en: Finish & switch
  // 'cam.switchedLab': '', // ko: 롤을 현상소에 보냈어요. 새 카메라를 고르세요. · en: Roll sent to the lab. Pick your next camera.
  // 'cam.switchedAlbum': '', // ko: 사진을 앨범에 넣었어요. 새 카메라를 고르세요. · en: Photos are in your album. Pick your next camera.
  // 'cam.more': '', // ko: 더보기 · en: More
  // 'cam.flashOnSay': '', // ko: 플래시 켬 · en: Flash on
  // 'cam.flashOffSay': '', // ko: 플래시 끔 · en: Flash off
  // 'cam.flashOnScreen': '', // ko: 플래시 켬 · 전면 카메라는 화면이 하얗게 빛나요 · en: Flash on · the front camera lights up the screen instead
  // 'cam.flipToFront': '', // ko: 전면 카메라로 전환 · en: Flip to front camera
  // 'cam.flipToBack': '', // ko: 후면 카메라로 전환 · en: Flip to back camera
  // 'gal.emptyHintCamera': '', // ko: 카메라에 찍은 사진 {shots}이 있어요. 현상소로 보내면 현상이 끝난 뒤 여기에 보여요. · en: You have {shots} in the camera. Send them to the lab and they show up here once developed. [+ counts: n]
  // 'gal.developNow': '', // ko: 현상소로 보내기 · en: Send to lab
  // 'gal.inCameraBanner': '', // ko: 카메라 안 {shots} · 현상소로 보내기 · en: {shots} in the camera · Send to lab [+ counts: n]
  // 'lab.emptyCamera': '', // ko: 카메라에 찍은 사진 {shots}이 있어요. 현상소로 보내면 여기서 현상돼요. · en: You have {shots} in the camera. Send the roll here to develop it. [+ counts: n]
  // 'speed.title': '', // ko: 언제 받아볼까요? · en: When do you want your prints?
  // 'speed.instant': '', // ko: 즉시 · en: Instant
  // 'speed.why': '', // ko: 잊을 즈음 도착하는 설렘, 필름의 재미예요. 바로 보려면 즉시. · en: Forget the roll, then rediscover it. Instant shows them now.
  // 'speed.at.now': '', // ko: 지금 바로 앨범에 도착 · en: In your album right away
  // 'speed.at.today': '', // ko: 오늘 {time} 도착 · en: Arrives today at {time}
  // 'speed.at.tomorrow': '', // ko: 내일 {time} 도착 · en: Arrives tomorrow at {time}
  // 'speed.at.date': '', // ko: {date} 도착 · en: Arrives {date}
  // 'speed.instant.d': '', // ko: 기다림 없이 바로 보기 · en: No wait, see them now
  // 'speed.1h': '', // ko: 1시간 · en: 1 hour
  // 'speed.1h.d': '', // ko: 커피 한 잔의 기다림 · en: A coffee break
  // 'speed.morning': '', // ko: 아침 9시 · en: Next 9 AM
  // 'speed.morning.d': '', // ko: 자고 일어나면 도착 · en: Wake up to your photos
  // 'speed.3d': '', // ko: 3일 · en: 3 days
  // 'speed.3d.d': '', // ko: 진짜 필름처럼 · en: Like real film
  // 'lab.title': '', // ko: 현상소 · en: Film Lab
  // 'lab.empty': '', // ko: 현상소가 비어 있어요. · en: The lab is empty.
  // 'lab.emptyHint': '', // ko: 현상소로 보낸 롤이 여기로 와요. · en: Rolls you send to the lab show up here.
  // 'lab.emptyWhat': '', // ko: 다 찍었거나 현상소로 보낸 롤이 현상을 기다리는 곳이에요. · en: Rolls you finish and send to the lab wait here to develop.
  // 'lab.emptyHow': '', // ko: 고른 속도대로 도착해요. 즉시면 바로 앨범으로. · en: They arrive at the speed you pick. Instant skips the wait.
  // 'lab.intro': '', // ko: 현상이 끝나면 앨범으로 옮겨져요. · en: Developed rolls move to your album.
  // 'lab.introRush': '', // ko: 못 기다리겠으면 ‘지금 바로 현상’을 눌러요. · en: Can’t wait? Tap Develop now.
  // 'lab.readyIn': '', // ko: {t} 남음 · en: Ready in {t}
  // 'lab.ready': '', // ko: 현상 완료! · en: Developed!
  // 'lab.rush': '', // ko: 지금 바로 현상 · en: Develop now
  // 'lab.rushConfirm': '', // ko: 기다림을 건너뛰고 바로 앨범에서 볼 수 있어요. · en: Skip the wait and see the photos in the album right away.
  // 'lab.developedToast': '', // ko: {stock} 롤 현상이 끝났어요 · en: Your {stock} roll is developed
  // 'lab.open': '', // ko: 사진 보기 · en: View photos
  // 'gal.title': '', // ko: 앨범 · en: Album
  // 'gal.empty': '', // ko: 아직 현상된 사진이 없어요. · en: No developed photos yet.
  // 'gal.emptyHint': '', // ko: 카메라에서 첫 롤을 찍어보세요. · en: Shoot your first roll in the camera.
  // 'gal.emptyHintLab': '', // ko: 현상소에서 {n}롤이 현상 중이에요. · en: {n, plural, one {# roll is} other {# rolls are}} developing in the lab.
  // 'gal.openLab': '', // ko: 현상소 보기 · en: Open the lab
  // 'gal.import': '', // ko: 사진 불러오기 · en: Import photos
  // 'gal.restore': '', // ko: 이전 폰 백업 불러오기 · en: Restore a backup
  // 'gal.importing': '', // ko: 현상 중… {n}/{total} · en: Developing… {n}/{total}
  // 'gal.imported': '', // ko: 불러온 사진 · en: Imported
  // 'gal.new': '', // ko: 새 롤 · en: NEW
  // 'gal.frames': '', // ko: {n}장 · en: {n, plural, one {# frame} other {# frames}}
  // 'gal.contact': '', // ko: 밀착 인화 · en: Contact sheet
  // 'gal.deleteRoll': '', // ko: 롤 삭제 · en: Delete roll
  // 'gal.deleteRollConfirm': '', // ko: 이 롤의 사진 {n}장이 모두 삭제돼요. 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: All {n, plural, one {# photo} other {# photos}} in this roll will be deleted. You can undo it for a few seconds afterwards.
  // 'gal.developing': '', // ko: 현상 중 · en: Developing
  // 'view.share': '', // ko: 공유 · en: Share
  // 'view.saveImage': '', // ko: 저장 · en: Save
  // 'view.darkroom': '', // ko: 다크룸 · en: Darkroom
  // 'view.info': '', // ko: 정보 · en: Info
  // 'view.deleteConfirm': '', // ko: 이 사진을 삭제할까요? 원본도 함께 삭제돼요. · en: Delete this photo? The original is deleted too.
  // 'view.developing': '', // ko: 현상 중… · en: Developing…
  // 'view.taken': '', // ko: 촬영 · en: Taken
  // 'view.film': '', // ko: 필름 · en: Film
  // 'view.frame': '', // ko: 컷 · en: Frame
  // 'view.size': '', // ko: 크기 · en: Size
  // 'dr.title': '', // ko: 다크룸 · en: Darkroom
  // 'dr.film': '', // ko: 필름 · en: Film
  // 'dr.push': '', // ko: 증감현상 (대비·입자) · en: Push / pull (contrast & grain)
  // 'dr.push.hint': '', // ko: + 대비·입자↑ / − 부드럽게 · en: + contrast & grain / − softer
  // 'dr.stops': '', // ko: {v} 스톱 · en: {v} {n, plural, one {stop} other {stops}} [+ counts: n]
  // 'dr.normal': '', // ko: 노멀 · en: Normal
  // 'dr.redevelop': '', // ko: 다시 현상 · en: Re-develop
  // 'dr.expired': '', // ko: 오래된 필름 느낌 (만료) · en: Aged film look (expired)
  // 'dr.grain': '', // ko: 입자 · en: Grain
  // 'dr.halation': '', // ko: 빛 번짐 (할레이션) · en: Glow (halation)
  // 'dr.leak': '', // ko: 빛샘 · en: Light leak
  // 'dr.leak.reroll': '', // ko: 다른 빛샘 · en: Another leak
  // 'dr.flash': '', // ko: 플래시 룩 · en: Flash look
  // 'dr.date': '', // ko: 날짜 각인 · en: Date stamp
  // 'dr.border': '', // ko: 테두리 · en: Border
  // 'dr.border.none': '', // ko: 없음 · en: None
  // 'dr.border.film35': '', // ko: 35mm · en: 35mm
  // 'dr.border.instant': '', // ko: 인스턴트 · en: Instant
  // 'dr.border.print': '', // ko: 인화지 · en: Print
  // 'dr.border.slide': '', // ko: 슬라이드 · en: Slide
  // 'dr.border.gate': '', // ko: 시네 · en: Cine
  // 'dr.border.sprocket': '', // ko: 스프로킷 · en: Sprocket
  // 'dr.compare': '', // ko: 길게 눌러 원본 보기 · en: Hold to see the original
  // 'dr.reset': '', // ko: 초기화 · en: Reset
  // 'dr.saved': '', // ko: 다시 현상했어요 · en: Re-developed
  // 'dr.applyRoll': '', // ko: 롤 전체에 적용 · en: Apply to roll
  // 'dr.rotate': '', // ko: 회전 · en: Rotate
  // 'dr.ev': '', // ko: 노출 보정 · en: Exposure
  // 'dr.palette': '', // ko: 팔레트 · en: Palette
  // 'dr.camera': '', // ko: 카메라 · en: Camera
  // 'hint.ios': '', // ko: 홈 화면에 추가하면 사진이 더 안전하게 보관돼요 (공유 → 홈 화면에 추가) · en: Add Film Camela to your Home Screen to keep photos safe (Share → Add to Home Screen).
  // 'dr.applyRollDone': '', // ko: 롤 전체에 적용했어요 · en: Applied to the whole roll
  // 'dr.applyRollUndone': '', // ko: 롤 전체 적용을 되돌렸어요 · en: Roll settings restored
  // 'dr.discardConfirm': '', // ko: 변경 사항을 버릴까요? · en: Discard changes?
  // 'dr.discard': '', // ko: 버리기 · en: Discard
  // 'dr.saveNew': '', // ko: 새 사진으로 저장 · en: Save as new photo
  // 'dr.savedNew': '', // ko: 새 사진으로 저장했어요 ({n}번) · en: Saved as a new photo (#{n})
  // 'dr.tone': '', // ko: 디지털 룩 · en: Digital look
  // 'dr.look': '', // ko: 룩 · en: Look
  // 'dr.tone.none': '', // ko: 기본 · en: Default
  // 'dr.tone.cool': '', // ko: 쿨 · en: Cool
  // 'dr.tone.warm': '', // ko: 웜 · en: Warm
  // 'dr.tone.washed': '', // ko: 바랜 · en: Washed
  // 'dr.tone.night': '', // ko: 야간 · en: Night
  // 'view.noDate': '', // ko: 날짜 정보 없음 · en: No date info
  // 'roll.select': '', // ko: 선택 · en: Select
  // 'roll.selectHint': '', // ko: 사진을 눌러 선택하세요 · en: Tap photos to select them
  // 'roll.selectedN': '', // ko: {n}장 선택됨 · en: {n} selected
  // 'roll.shareN': '', // ko: 공유 {n}장 · en: Share {n}
  // 'roll.saveN': '', // ko: 저장 {n}장 · en: Save {n}
  // 'roll.selectPhoto': '', // ko: 사진 {n} 선택 · en: Select photo {n}
  // 'roll.ready': '', // ko: 사진 {n}장이 준비됐어요 · en: {n, plural, one {# photo} other {# photos}} ready
  // 'an.title': '', // ko: 아날로그 · en: Analog
  // 'an.subtitle': '', // ko: 실제 필름 카메라를 위한 도구 · en: Tools for your real film camera
  // 'an.meter': '', // ko: Sunny 16 노출 계산기 · en: Sunny 16 exposure calculator
  // 'an.iso': '', // ko: ISO · en: ISO
  // 'an.light': '', // ko: 빛 · en: Light
  // 'an.aperture': '', // ko: 조리개 · en: Aperture
  // 'an.shutter': '', // ko: 셔터 속도 · en: Shutter speed
  // 'an.comp': '', // ko: 노출 보정 · en: Compensation
  // 'an.tripod': '', // ko: 삼각대를 권장해요 · en: Use a tripod
  // 'an.outOfRange': '', // ko: 셔터 범위를 벗어났어요. 조리개나 ISO를 바꿔보세요. · en: Outside the shutter range. Try another aperture or ISO.
  // 'an.light.snow': '', // ko: 맑은 날 눈밭·해변 · en: Snow / sand, sunny
  // 'an.light.sunny': '', // ko: 맑음 (선명한 그림자) · en: Sunny (sharp shadows)
  // 'an.light.slightOvercast': '', // ko: 약간 흐림 · en: Slightly overcast
  // 'an.light.overcast': '', // ko: 흐림 · en: Overcast
  // 'an.light.heavyOvercast': '', // ko: 매우 흐림 · en: Heavy overcast
  // 'an.light.shade': '', // ko: 그늘 · en: Open shade
  // 'an.light.sunset': '', // ko: 일몰 직전 · en: Just before sunset
  // 'an.light.indoorBright': '', // ko: 밝은 실내 · en: Bright interior
  // 'an.light.indoor': '', // ko: 실내 · en: Interior
  // 'an.light.night': '', // ko: 밤거리 · en: Night street
  // 'an.log': '', // ko: 필름 촬영 노트 · en: Film shooting log
  // 'an.log.empty': '', // ko: 기록 중인 롤이 없어요. · en: No logged rolls yet.
  // 'an.log.new': '', // ko: 새 롤 기록 · en: Log a new roll
  // 'an.log.camera': '', // ko: 카메라 · en: Camera
  // 'an.log.film': '', // ko: 필름 · en: Film
  // 'an.log.exposures': '', // ko: 장수 · en: Exposures
  // 'an.log.note': '', // ko: 메모 · en: Note
  // 'an.log.addFrame': '', // ko: 컷 기록 · en: Log frame
  // 'an.log.lens': '', // ko: 렌즈 · en: Lens
  // 'an.log.export': '', // ko: CSV 내보내기 · en: Export CSV
  // 'an.log.deleteRoll': '', // ko: 기록 삭제 · en: Delete log
  // 'an.log.deleteConfirm': '', // ko: 이 롤 기록을 삭제할까요? · en: Delete this roll log?
  // 'an.log.useMeter': '', // ko: 계산기 값 사용 · en: Use calculator values
  // 'an.log.frames': '', // ko: {n}/{m}장 · en: {n}/{m} frames
  // 'an.log.location': '', // ko: 위치 함께 저장 · en: Save location
  // 'an.active': '', // ko: 지금 기록 중인 롤 · en: Roll in progress
  // 'an.active.go': '', // ko: 컷 기록하기 · en: Log a frame
  // 'an.log.repeat': '', // ko: 같은 설정으로 +1컷 · en: Same settings +1
  // 'an.log.otherSettings': '', // ko: 다른 설정 · en: New settings
  // 'an.log.frameN': '', // ko: {n}번 컷 기록 · en: Log frame {n}
  // 'an.log.editFrame': '', // ko: {n}번 컷 고치기 · en: Edit frame {n}
  // 'an.log.saveFrame': '', // ko: 이 컷 기록 · en: Log this frame
  // 'an.log.saveEdit': '', // ko: 고친 내용 저장 · en: Save changes
  // 'an.log.manual': '', // ko: 직접 입력 · en: Type it in
  // 'an.log.pickStops': '', // ko: 눈금에서 고르기 · en: Pick from the dial
  // 'an.log.logged': '', // ko: {n}번 컷을 기록했어요 · en: Frame {n} logged
  // 'an.log.deleted': '', // ko: {n}번 컷 기록을 지웠어요 · en: Frame {n} log deleted
  // 'an.log.undo': '', // ko: 되돌리기 · en: Undo
  // 'an.log.undoFailed': '', // ko: 그 사이 같은 번호가 기록돼서 되돌리지 못했어요 · en: Couldn't undo: that frame number is taken now
  // 'an.log.full': '', // ko: 이 롤의 컷을 모두 기록했어요 · en: Every frame on this roll is logged
  // 'an.log.firstHint': '', // ko: 한 컷 찍고 여기에 기록하세요. 나중에 줄을 누르면 고칠 수 있어요. · en: Shoot a frame, then log it here. Tap a row later to fix it.
  // 'set.title': '', // ko: 설정 · en: Settings
  // 'set.lang': '', // ko: 언어 · en: Language
  // 'set.lang.auto': '', // ko: 시스템 · en: System
  // 'set.sound': '', // ko: 셔터 소리 · en: Shutter sound
  // 'set.haptics': '', // ko: 진동 · en: Haptics
  // 'set.dateStamp': '', // ko: 사진에 날짜 넣기 · en: Add the date to photos
  // 'set.dateFormat': '', // ko: 날짜 형식 · en: Date format
  // 'set.grid': '', // ko: 격자 표시 · en: Show grid
  // 'set.mirror': '', // ko: 전면 카메라 좌우 반전 저장 · en: Mirror front camera photos
  // 'set.rollSize': '', // ko: 기본 롤 장수 · en: Default roll size
  // 'set.speed': '', // ko: 기본 현상 속도 · en: Default lab speed
  // 'set.speed.hint': '', // ko: 필름 롤을 현상소로 보낼 때 ‘기본’으로 표시돼요. 인스턴트·디카 사진은 현상소 없이 바로 앨범에 들어가요. · en: Marked as default when you send a film roll to the lab. Instant and digital cameras skip the lab: their photos go straight to the album.
  // 'set.storage': '', // ko: 저장 공간 · en: Storage
  // 'set.storage.used': '', // ko: {used} 사용 중 · en: {used} used
  // 'set.storage.persist': '', // ko: 사진 지워지지 않게 보호 · en: Keep photos from being cleared
  // 'set.storage.persistHint': '', // ko: 기기 저장 공간이 부족해져도 브라우저가 이 앱의 사진을 자동으로 지우지 않도록 요청해요. · en: Asks the browser not to clear this app’s photos automatically when the device runs low on space.
  // 'set.storage.persistAsk': '', // ko: 보호 켜기 · en: Turn on
  // 'set.storage.persisted': '', // ko: 보호됨 · en: Protected
  // 'set.storage.refusedShort': '', // ko: 허락 안 됨 · en: Not allowed
  // 'set.storage.refused': '', // ko: 이 브라우저가 보호를 허락하지 않았어요. 홈 화면에 추가하면 더 오래 보관돼요. 백업도 함께 해 두세요. · en: This browser declined. Adding Film Camela to your home screen keeps photos longer — and keep a backup too.
  // 'set.install': '', // ko: 홈 화면에 앱 설치 · en: Install app to home screen
  // 'set.privacy': '', // ko: 개인정보 처리방침 · en: Privacy policy
  // 'set.terms': '', // ko: 이용약관 · en: Terms of use
  // 'set.support': '', // ko: 고객지원 · 문의 · en: Support & contact
  // 'set.licenses': '', // ko: 오픈소스 라이선스 · en: Open-source licenses
  // 'set.backup': '', // ko: 백업 · en: Backup
  // 'set.backup.hint': '', // ko: 사진과 기록은 이 기기에만 저장돼요. 기기를 바꾸거나 브라우저 데이터가 지워지기 전에 백업 파일(.zip)로 보관해 두세요. · en: Photos and logs live only on this device. Save a backup file (.zip) before switching phones or clearing browser data.
  // 'set.backup.export': '', // ko: 백업 파일 저장 (.zip) · en: Save backup file (.zip)
  // 'set.backup.saveAgain': '', // ko: 한 번 더 저장 · en: Save another copy
  // 'set.backup.send': '', // ko: 카카오톡·드라이브로 보내기 · en: Send to KakaoTalk or Drive
  // 'set.backup.savedWeb': '', // ko: 다운로드 폴더에 저장했어요 · {name} · en: Saved to your Downloads folder · {name}
  // 'set.backup.savedShared': '', // ko: 공유 창에서 고른 곳(파일·드라이브 등)에 저장했어요 · {name} · en: Saved where you picked in the share sheet (Files, Drive…) · {name}
  // 'set.backup.restoreHint': '', // ko: 새 폰으로 옮기려면 이 파일을 카카오톡 ‘나와의 채팅’이나 드라이브로 보낸 뒤, 새 폰의 Film Camela 설정에서 ‘백업에서 복원’을 눌러 열어요. · en: To move to a new phone, send this file to yourself (KakaoTalk, Drive or email), then open it there with Restore from backup in Film Camela Settings.
  // 'set.credit': '', // ko: © 2026 아티움그룹 주식회사 (ATIUM GROUP Co., Ltd.) · en: © 2026 ATIUM GROUP Co., Ltd.
  // 'set.backup.import': '', // ko: 백업에서 복원 · en: Restore from backup
  // 'set.backup.working': '', // ko: 백업 중… {done}/{total} · en: Backing up… {done}/{total}
  // 'set.backup.restoring': '', // ko: 복원 중… · en: Restoring…
  // 'set.backup.done': '', // ko: 백업 준비 완료 · 롤 {rolls}개, 사진 {photos}장 · en: Backup ready · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}}
  // 'set.backup.save': '', // ko: 준비 완료 · 저장하기 · en: Ready · Save it
  // 'set.backup.saved': '', // ko: 백업 파일을 저장했어요 · en: Backup file saved
  // 'set.backup.saveFailed': '', // ko: 저장하지 못했어요. 다시 눌러 주세요 · en: Couldn't save it. Tap again
  // 'set.backup.tooLarge': '', // ko: 4GB가 넘어 파일 하나에 담을 수 없어요. 오래된 롤을 정리한 뒤 다시 시도해 주세요 · en: Over 4 GB, too large for one file. Clear out some old rolls and try again
  // 'set.backup.newer': '', // ko: 더 새로운 버전의 앱에서 만든 백업이에요. 앱을 업데이트해 주세요 · en: This backup is from a newer version of the app. Please update
  // 'set.backup.partial': '', // ko: 롤 {rolls}개까지 복원하고 멈췄어요. 저장 공간을 확보한 뒤 다시 복원하면 이어서 진행돼요 · en: Stopped after restoring {rolls, plural, one {# roll} other {# rolls}}. Free up storage and restore again to continue
  // 'set.backup.empty': '', // ko: 아직 백업할 사진이나 기록이 없어요 · en: Nothing to back up yet
  // 'set.backup.restored': '', // ko: 복원 완료 · 롤 {rolls}개, 사진 {photos}장 추가 · en: Restored · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}} added
  // 'set.backup.skipped': '', // ko: 이미 있는 항목 {n}개는 그대로 두었어요 · en: Skipped {n, plural, one {# item} other {# items}} you already have
  // 'set.backup.damaged': '', // ko: 손상된 항목 {n}개는 건너뛰었어요 · en: Skipped {n} damaged {n, plural, one {item} other {items}}
  // 'set.backup.invalid': '', // ko: Film Camela 백업 파일이 아니거나 손상된 파일이에요 · en: Not a Film Camela backup, or the file is damaged
  // 'set.backup.failed': '', // ko: 백업을 만들지 못했어요. 저장 공간을 확인해 주세요 · en: Couldn't create the backup. Check free storage
  // 'set.reset': '', // ko: 모든 데이터 삭제 · en: Delete all data
  // 'set.resetConfirm': '', // ko: 모든 롤, 사진, 기록, 설정이 삭제되고 되돌릴 수 없어요. 먼저 위의 ‘백업 파일 저장’으로 백업해 두세요. 그래도 삭제할까요? · en: All rolls, photos, logs and settings will be deleted, and this cannot be undone. Save a backup file first (above). Delete anyway?
  // 'set.version': '', // ko: 버전 · en: Version
  // 'set.replayOnb': '', // ko: 소개 다시 보기 · en: Replay intro
  // 'share.title': '', // ko: Film Camela로 찍은 필름 · en: Shot on Film Camela
  // 'err.storage': '', // ko: 저장 공간이 부족해요. 사진 몇 장을 지우고 다시 시도해 주세요. · en: Storage is full. Delete a few photos and try again.
  // 'common.notFound': '', // ko: 찾을 수 없어요. 삭제되었을 수 있어요. · en: Couldn't find this. It may have been deleted.
  // 'an.log.noLocation': '', // ko: 위치를 못 받아서 위치 없이 저장했어요 · en: No location fix, so it was saved without one
  // 'err.storagePermission': '', // ko: 저장 권한이 꺼져 있어요. 설정 > 앱 > Film Camela > 권한에서 저장공간을 허용해 주세요. · en: Storage permission is off. Allow it in Settings > Apps > Film Camela > Permissions.
  // 'err.noStorage': '', // ko: 이 브라우저 설정에서는 사진을 저장할 수 없어요. 사생활 보호(시크릿) 모드를 끄거나 사이트 데이터 저장을 허용해 주세요. · en: This browser won't let Film Camela save photos. Turn off private browsing or allow site data, then reopen the app.
  // 'err.import': '', // ko: 이 파일은 불러올 수 없어요. · en: This file could not be imported.
  // 'update.ready': '', // ko: 새 버전이 준비됐어요 · en: A new version is ready
  // 'update.reload': '', // ko: 새로고침 · en: Reload
  // 'offline.ready': '', // ko: 오프라인에서도 사용할 수 있어요 · en: Ready to work offline
  // 'a11y.cameraTitle': '', // ko: 카메라 · en: Camera
  // 'a11y.rollLoaded': '', // ko: {stock} · {n}장 넣었어요 · en: {stock} loaded · {n, plural, one {# shot} other {# shots}}
  // 'a11y.sentToLab': '', // ko: 현상소로 보냈어요 · {wait} 뒤 도착 · en: Sent to the lab · ready in {wait}
  // 'a11y.cameraKeys': '', // ko: ← → 키로 카메라를 고르고, Tab으로 고정 버튼으로 가요 · en: Use the arrow keys to choose a camera; Tab reaches its pin button
  // 'cam.timerSay': '', // ko: {n}초 뒤 촬영 · 셔터를 다시 누르면 취소 · en: Taking the photo in {n} seconds · press the shutter again to cancel
  // 'cam.timerCancelled': '', // ko: 타이머를 취소했어요 · en: Timer cancelled
  // 'cam.tapToCancel': '', // ko: 탭하면 취소 · en: Tap to cancel
  // 'cam.cancelTimer': '', // ko: 타이머 취소 · en: Cancel timer
  // 'cam.doubleHint': '', // ko: 두 번 눌러 한 장에 겹쳐요 · en: Two presses, one frame
  // 'cam.double2': '', // ko: 한 번 더 누르면 첫 장면 위에 겹쳐 찍혀요 · en: Press again to expose over the first shot
  // 'cam.pressBusy': '', // ko: 앞 사진을 저장하는 중이에요 · en: Still saving the previous shots
  // 'cam.pressFull': '', // ko: 남은 컷이 없어요 · en: No frames left
  // 'cam.startingQueued': '', // ko: 카메라가 준비되면 바로 찍어요 · en: Taking the photo as soon as the camera is ready
  // 'cam.switchConfirmFilm2': '', // ko: 카메라를 바꾸면 지금 롤은 현상소로 가요. 찍은 {shots}은 현상하고, 남은 {left}은 쓰지 않아요. · en: Switching sends this roll to the lab. The {shots} you took {n, plural, one {gets} other {get}} developed; the {left} left {m, plural, one {stays} other {stay}} unused. [+ counts: n, m]
  // 'cam.switchConfirmPack2': '', // ko: 카메라를 바꾸면 지금 팩을 꺼내요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching takes this pack out. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  // 'cam.switchConfirmCard2': '', // ko: 카메라를 바꾸면 지금 카드를 정리해요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching finishes this card. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  // 'common.undo': '', // ko: 되돌리기 · en: Undo
  // 'view.deleteUndoConfirm': '', // ko: 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: You can undo it for a few seconds afterwards.
  // 'view.deleted': '', // ko: 사진을 삭제했어요 · en: Photo deleted
  // 'view.restored': '', // ko: 사진을 되돌렸어요 · en: Photo restored
  // 'view.deleteTitle': '', // ko: 사진을 삭제할까요? · en: Delete this photo?
  // 'view.savedWeb': '', // ko: 다운로드 폴더에 저장했어요 · en: Saved to your Downloads folder
  // 'view.savedAndroid': '', // ko: 갤러리 › Film Camela 앨범에 저장했어요 · en: Saved to Gallery › Film Camela album
  // 'gal.deleteRollTitle': '', // ko: 이 롤을 삭제할까요? · en: Delete this roll?
  // 'gal.rollDeleted': '', // ko: 롤을 삭제했어요 · en: Roll deleted
  // 'gal.rollRestored': '', // ko: 롤을 되돌렸어요 · en: Roll restored
  // 'gal.rollRestoreBlocked': '', // ko: 카메라에 다른 롤이 들어 있어서 되돌릴 수 없어요 · en: Can't restore it: another roll is in the camera now
  // 'gal.framesHalf': '', // ko: {f}프레임 ({n}컷) · en: {f, plural, one {# frame} other {# frames}} ({n, plural, one {# shot} other {# shots}})
  // 'gal.help': '', // ko: 도움말 · en: Help
  // 'lab.rushTitle': '', // ko: 지금 바로 현상할까요? · en: Develop now?
  // 'view.pushNormal': '', // ko: 노멀 · en: Normal
  // 'view.expiredNone': '', // ko: 새 필름 · en: Fresh film
  // 'view.expiredYears': '', // ko: {n}년 지난 필름 · en: Expired {n, plural, one {# year} other {# years}}
  // 'dur.days': '', // ko: {n}일 · en: {n}d
  // 'dur.hours': '', // ko: {n}시간 · en: {n}h
  // 'dur.minutes': '', // ko: {n}분 · en: {n}m
  // 'dur.seconds': '', // ko: {n}초 · en: {n}s
  // 'dur.pair': '', // ko: {a} {b} · en: {a} {b}
  // 'wait.days': '', // ko: {n}일 · en: {n} d
  // 'wait.hours': '', // ko: {n}시간 · en: {n} h
  // 'wait.minutes': '', // ko: {n}분 · en: {n} min
};

export const cameraText: LocaleCameraText = {
  /** Camera body descriptions (expressive register, guide §1.1). */
  desc: {
    // pro35: '', // ko: 기본기 탄탄한 35mm SLR. 35mm 필름 전부, 3가지 비율, 줌, 노출 보정. · en: A dependable 35mm SLR. Every 35mm film, three formats, zoom and exposure dial.
    // snap27: '', // ko: 27장 일회용 카메라. 플래시는 매번 충전해야 하고, 렌즈는 살짝 뭉개져요. · en: A 27-shot disposable with a soft plastic lens. Charge the flash before each shot.
    // instasq: '', // ko: 10장 팩 정사각 인스턴트. 찍자마자 사진이 나와 서서히 떠올라요. · en: Square instant camera, 10-shot packs. Prints eject and slowly appear.
    // half72: '', // ko: 35mm 한 컷에 두 장씩 나란히 찍는 하프프레임. 한 롤에 72장. · en: Two shots per frame: 72 half-frames that pair up side by side.
    // zonelc: '', // ko: 터널 같은 비네팅과 진한 색. 거리 스냅용 컴팩트. · en: Tunnel vignetting and saturated color. A street-shooting compact.
    // toy120: '', // ko: 플라스틱 렌즈의 중판 토이 카메라. 흐린 가장자리, 짙은 비네팅, 잦은 빛샘. · en: Plastic-lens medium-format toy: soft edges, heavy vignette, frequent leaks.
    // quad4: '', // ko: 렌즈 4개가 0.2초 간격으로 연속 촬영. 한 장에 움직임 4컷. · en: Four lenses fire 0.2 s apart: four moments in one frame.
    // doublex: '', // ko: 같은 컷에 두 번 노출. 첫 장 위에 두 번째 장면을 겹쳐요. · en: Two exposures on one frame: layer a second scene over the first.
    // panox: '', // ko: 65:24 와이드 파노라마. 한 롤 21장. · en: Wide 65:24 panoramas. 21 frames per roll.
    // fish180: '', // ko: 180° 원형 어안. 동그란 세상. · en: A 180° circular fisheye. The world in a circle.
    // cine: '', // ko: 2.39:1 시네마스코프. 강한 빛에 푸른 수평 플레어. · en: 2.39:1 anamorphic scope with blue streak flares on bright lights.
    // ccd03: '', // ko: 2003년 감성 디카. 99장 메모리, 디지털 날짜, 바로 확인. · en: A 2003 digicam: 99-shot card, digital date imprint, instant review.
    // pixel: '', // ko: 128×112 포켓 픽셀 카메라. 4색 팔레트, 30장. · en: A 128×112 pocket pixel camera. Four-color palettes, 30 shots.
    // range: '', // ko: 조용한 레인지파인더. 선명한 렌즈, 브라이트 프레임, 흑백이 기본. · en: A quiet rangefinder: crisp lens, bright frame lines, black & white by default.
    // aqua27: '', // ko: 방수 하우징을 씌운 27장 일회용. 물빛 청록 톤, 뭉개진 렌즈, 플래시는 매번 충전해요. · en: A 27-shot disposable in a waterproof housing: blue-green cast, soft lens, charge the flash each shot.
    // instaw: '', // ko: 가로로 넓은 와이드 인스턴트. 10장 팩, 찍으면 사진이 나와 서서히 떠올라요. · en: Wide-format instant camera, 10-shot packs. Landscape prints eject and slowly appear.
    // twin66: '', // ko: 위에서 내려다보는 이안 리플렉스. 6×6 정사각 12장, 파인더 속 좌우가 뒤집혀 보여요. · en: A twin-lens reflex you look down into: 12 square 6×6 frames, mirror-reversed finder.
    // super8: '', // ko: 8mm 홈무비 카메라의 한 프레임. 둥근 게이트, 따뜻한 색, 굵은 입자. · en: One frame from an 8mm home movie: rounded gate, warm color, heavy grain.
    // slide35: '', // ko: 슬라이드 필름 전용 컴팩트. 쨍한 색을 하얀 마운트에 끼워 돌려줘요. · en: A compact for slide film: punchy color, returned in white slide mounts.
    // party: '', // ko: 큼직한 플래시가 기본으로 켜진 파티용 컴팩트. 강한 정면 플래시와 날짜 각인. · en: A party compact with a big flash that is always on: harsh direct flash and a date imprint.
    // kidcam: '', // ko: 0.3메가 어린이 디카. 640픽셀, 과한 채도, 디지털 날짜, 바로 확인. · en: A 0.3 MP kids' camera: 640 px, oversaturated, digital date, instant review.
    // sprocket: '', // ko: 퍼포레이션까지 찍히는 파노라마. 사진 위아래로 필름 구멍이 남아요. · en: A panorama that exposes over the sprocket holes, leaving film perforations in the frame.
  },
  /** Type word in the era line "1979 · SLR" (guide §3.3). The year and " · " are added by the app. */
  era: {
    SLR: 'Réflex',
    Disposable: 'Desechable',
    Instant: 'Instantánea',
    'Half-frame': 'Medio cuadro',
    Compact: 'Compacta',
    '120 toy': 'Juguete 120',
    '4-lens': '4 lentes',
    'Multi-ex': 'Multiexposición',
    Panoramic: 'Panorámica',
    Fisheye: 'Ojo de pez',
    Anamorphic: 'Anamórfica',
    Digicam: 'Digital',
    '2-bit': '2 bits',
    Rangefinder: 'Telemétrica',
    Waterproof: 'Acuática',
    Wide: 'Formato ancho',
    TLR: 'Réflex de doble lente',
    'Home movie': 'Cine casero',
    Slide: 'Diapositiva',
    'Big flash': 'Flash potente',
    'Kids digicam': 'Digital infantil',
    Sprocket: 'Perforaciones',
  },
};

/** Film stock / sensor descriptions (expressive register). Film names stay in Latin letters. */
export const stockText: LocaleStockText = {
  // sunny200: '', // ko: 햇살 가득한 따뜻한 노랑. 여행과 일상 스냅의 정석. · en: Warm, sunny yellows. The classic travel & everyday snapshot.
  // muse400: '', // ko: 부드러운 피부톤과 파스텔 하이라이트. 인물용. · en: Gentle skin tones and pastel highlights. Made for portraits.
  // mint400: '', // ko: 그늘에 살짝 도는 초록빛. 도시와 거리의 공기. · en: A hint of green in the shadows. City air in a frame.
  // snap800: '', // ko: 일회용 카메라 그대로. 플래시, 진한 비네팅, 우연한 빛샘. · en: Straight out of a disposable: flash, heavy vignette, happy-accident leaks.
  // mono400: '', // ko: 깊은 검정과 거친 입자의 흑백. 다큐멘터리 감성. · en: Deep blacks and gritty grain. Documentary black & white.
  // insta600: '', // ko: 바랜 듯한 색과 하얀 테두리의 즉석 사진. · en: Faded colors and a white frame. Instant photo charm.
  // neon800t: '', // ko: 텅스텐 시네마 필름. 네온 아래 붉은 할레이션. · en: Tungsten cinema film with red halation around neon lights.
  // velvet50: '', // ko: 쨍한 채도와 높은 대비의 슬라이드 필름. 풍경용. · en: Punchy saturation and contrast. A landscape slide film.
  // chrome100: '', // ko: 맑고 차가운 슬라이드 톤. 선명한 하늘. · en: Clean, cool slide tones and crisp skies.
  // silver100: '', // ko: 고운 입자와 넓은 계조의 흑백. · en: Fine-grained black & white with a long tonal range.
  // dream160: '', // ko: 낮은 대비, 공기처럼 가벼운 파스텔. · en: Low contrast, airy pastels.
  // expired98: '', // ko: 1998년에 만료된 필름. 마젠타 포그와 먼지, 예측 불가. · en: Expired in 1998. Magenta fog, dust and surprises.
  // xpro200: '', // ko: 슬라이드 필름을 네거티브(C-41)로 교차현상. 강한 대비, 연두빛 하이라이트, 청록 그림자. · en: Slide film cross-processed as negative: hard contrast, lime highlights, teal shadows.
  // instamini: '', // ko: 밝고 산뜻한 미니 인스턴트. 깨끗한 화이트와 살짝 차가운 톤. · en: Bright, crisp mini instant film with clean whites and a cool touch.
  // ccd: '', // ko: 2000년대 초 디카 CCD. 날아가는 하이라이트, 푸른 기, 보라색 번짐. · en: Early-2000s digicam CCD: clipped highlights, blue cast, purple fringing.
  // pixel: '', // ko: 128픽셀 2비트 센서. 4가지 색과 디더링. · en: A 128-pixel, 2-bit sensor. Four colors and dithering.
  // aqua400: '', // ko: 물속 일회용 필름. 붉은빛이 빠진 청록 톤과 뿌연 입자. · en: Underwater disposable film: reds wash out into a blue-green cast, soft grain.
  // instawide: '', // ko: 와이드 인스턴트 필름. 자연스러운 색, 살짝 따뜻한 하이라이트. · en: Wide instant film: natural color with gently warm highlights.
  // reel40: '', // ko: 홈무비 리버설 필름. 따뜻하고 진한 색, 굵은 입자, 먼지 낀 게이트. · en: Home-movie reversal film: warm, saturated color, big grain, a dusty gate.
  // toycmos: '', // ko: 0.3메가 장난감 센서. 사탕 같은 색, 날아간 하이라이트, 얼룩덜룩한 색 노이즈. · en: A 0.3 MP toy sensor: candy colors, blown highlights, blotchy color noise.
};
