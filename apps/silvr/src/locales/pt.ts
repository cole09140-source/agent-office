/**
 * Film Camela — Brazilian Portuguese (pt-BR). Lazy-loaded when this language is chosen or detected.
 *
 * TRANSLATOR CONTRACT — read docs/10_LOCALIZATION_GUIDE.md first (§2.7 for this language, §3 names,
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
 *    Categories one / many / other. "one" covers 0 AND 1 in CLDR; "many" is for millions.
 *     '{n, plural, =0 {Nenhuma foto} one {# foto} other {# fotos}}'
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
  'app.tagline': 'A câmera de filme que guarda cada original', // ko: 원본이 그대로 남는 필름 카메라 · en: The film camera that keeps every original
  'tab.camera': 'Câmera', // from guide §8.3 · en: Camera
  'tab.models': 'Modelos',
  'models.sub': '{n} câmeras · toque em uma para fotografar com ela',
  'models.inUse': 'Em uso',
  'tab.lab': 'Revelação', // from guide §8.3 · en: Lab
  'tab.gallery': 'Álbum', // from guide §8.3 · en: Album
  'tab.analog': 'Analógico', // from guide §8.3 · en: Analog
  'tab.settings': 'Meu espaço',
  'common.cancel': 'Cancelar', // ko: 취소 · en: Cancel
  'common.close': 'Fechar', // ko: 닫기 · en: Close
  'common.save': 'Salvar', // ko: 저장 · en: Save
  'common.delete': 'Apagar', // ko: 삭제 · en: Delete
  'common.done': 'OK', // ko: 완료 · en: Done
  'common.retry': 'Tentar de novo', // ko: 다시 시도 · en: Retry
  'common.back': 'Voltar', // ko: 뒤로 · en: Back
  'common.next': 'Continuar', // ko: 다음 · en: Next
  'common.start': 'Começar', // ko: 시작하기 · en: Get started
  'common.on': 'Ativado', // ko: 켜짐 · en: On
  'common.off': 'Desativado', // ko: 꺼짐 · en: Off
  'common.pro': 'PRO', // ko: PRO · en: PRO
  'common.loading': 'Carregando…', // ko: 불러오는 중… · en: Loading…
  'common.error': 'Algo deu errado. Tente de novo.', // ko: 잠시 문제가 생겼어요. 다시 시도해 주세요. · en: Something went wrong. Please try again.
  'toast.close': 'Fechar aviso', // ko: 알림 닫기 · en: Dismiss
  'lab.developedMany': '{n, plural, one {# filme revelado} other {# filmes revelados}}', // ko: 롤 {n}개 현상이 끝났어요 · en: {n} rolls developed
  'cam.loadCard': 'Colocar cartão', // ko: 메모리 카드 넣기 · en: Insert card
  'cam.loadPack': 'Colocar cartucho', // ko: 필름 팩 넣기 · en: Load film pack
  'cam.useCamera': 'Usar esta câmera', // ko: 이 카메라로 찍기 · en: Use this camera
  'cam.allCameras': 'Ver todas', // ko: 모두 보기 · en: All cameras
  'cam.allCamerasTitle': 'Todas as câmeras', // ko: 카메라 모두 보기 · en: All cameras
  'cam.group.film': 'Câmeras de filme', // ko: 필름 카메라 · en: Film cameras
  'cam.group.instant': 'Câmeras instantâneas', // ko: 즉석 카메라 · en: Instant cameras
  'cam.group.digital': 'Digital', // ko: 디지털 · en: Digital
  'cam.group.toy': 'Brinquedo e especiais', // ko: 토이·특수 카메라 · en: Toy & special
  'cam.group.phone': 'Câmeras de celular', // ko: 휴대폰 카메라 · en: Phone cameras
  'a11y.stockKeys': 'Use as setas para ver os filmes e Enter para escolher', // ko: ← → 키로 필름을 살펴보고 Enter로 골라요 · en: Arrow keys browse films; Enter selects
  'gal.importHint': 'Suas fotos são reveladas com este filme. Você pode trocá-lo no quarto escuro quando quiser.', // ko: 고른 필름으로 현상해요. 다크룸에서 언제든 바꿀 수 있어요. · en: Your photos develop with this film. You can change it in the darkroom any time.
  'onb.restore': 'Veio de outro celular? Restaurar backup', // ko: 이전 폰에서 옮겨 오셨나요? 백업 불러오기 · en: Coming from another phone? Restore a backup
  'onb.1.title': 'Como no analógico, uma foto por vez', // ko: 필름처럼, 한 장씩 · en: Shoot like film
  'onb.1.body': 'Escolha uma câmera e fotografe na hora. Cada foto vai para o álbum assim que você clica.',
  'onb.2.title': 'Deslize para trocar de câmera',
  'onb.2.body': 'Arraste a fileira de câmeras abaixo do visor. Fotografe com a que parar no meio: cada uma vê o mundo com as próprias cores.',
  'onb.3.title': 'Revele de novo no quarto escuro', // ko: 다크룸에서 언제든 다시 현상 · en: Re-develop in the darkroom
  'onb.3.body': 'Seu original fica sempre guardado. Troque filme, brilho, envelhecimento e halo quantas vezes quiser.', // ko: 찍은 원본은 언제나 그대로 남아요. 필름, 밝기, 오래된 필름 느낌, 빛 번짐까지 몇 번이고 다시 골라 보세요. · en: Your original is always kept. Try another film, brightness, aged-film look, or glow, as often as you like.
  'onb.privacy': '{n, plural, one {# foto grátis por dia} other {# fotos grátis por dia}}. Sem cadastro. Todas as fotos ficam só neste dispositivo.',
  'cam.loadFilm': 'Colocar filme', // ko: 필름 넣기 · en: Load film
  'cam.chooseFilm': 'Escolha o filme', // ko: 필름을 고르세요 · en: Choose your film
  'cam.exposures': '{n, plural, one {# pose} other {# poses}}', // ko: {n}장 · en: {n} exp
  'cam.load': 'Colocar este filme', // ko: 이 필름 넣기 · en: Load this film
  'cam.left': '{n, plural, =0 {Restam 0} one {Resta #} other {Restam #}}', // ko: {n}장 남음 · en: {n} left
  'cam.rewind': 'Mandar revelar', // ko: 현상소로 보내기 · en: Send to lab
  'cam.rollFull': 'Filme terminado', // ko: 롤을 끝까지 다 찍었어요 · en: Roll finished
  'cam.sendToLab': 'Mandar revelar', // ko: 현상소로 보내기 · en: Send to lab
  'cam.flash': 'Flash', // ko: 플래시 · en: Flash
  'cam.timer': 'Timer', // ko: 타이머 · en: Timer
  'cam.grid': 'Grade', // ko: 격자 · en: Grid
  'cam.date': 'Data', // ko: 날짜 · en: Date
  'cam.flip': 'Alternar câmera', // ko: 카메라 전환 · en: Switch camera
  'cam.zoom': 'Zoom', // ko: 줌 · en: Zoom
  'cam.aspect': 'Formato', // ko: 비율 · en: Format
  'cam.shutter': 'Tirar foto', // ko: 촬영 · en: Take photo
  'cam.noCamera.title': 'Câmera indisponível', // ko: 카메라를 사용할 수 없어요 · en: Camera unavailable
  'cam.noCamera.body': 'Permita o acesso à câmera nos ajustes do navegador ou do dispositivo. Enquanto isso, você pode importar fotos e revelá-las.', // ko: 브라우저나 기기 설정에서 카메라 권한을 허용해 주세요. 그동안 기기에 있는 사진을 불러와 현상할 수도 있어요. · en: Allow camera access in your browser or device settings. In the meantime, you can import photos and develop them.
  'cam.noCamera.import': 'Importar fotos',
  'cam.starting': 'Iniciando a câmera…', // ko: 카메라 준비 중… · en: Starting camera…
  'cam.saved': 'Pose {n}', // ko: {n}번째 컷 · en: Frame {n}
  'cam.rewindConfirm': 'Você tirou {shots}. Mandar revelar este filme? {m, plural, one {A foto restante fica em branco.} other {As {left} restantes ficam em branco.}}', // ko: {shots} 찍었어요. 남은 {left}은 비워 둔 채 현상소로 보낼까요? · en: You’ve taken {shots}. Send this roll to the lab? The remaining {left} will stay blank. [+ counts: n, m]
  'cam.emptyRewind': 'Nenhuma foto ainda. Se você tirar o filme agora, ele será descartado.', // ko: 아직 찍은 사진이 없어요. 지금 필름을 빼면 이 롤은 사라져요. · en: No shots yet. If you unload now, this roll is discarded.
  'cam.unload': 'Tirar o filme', // ko: 필름 빼기 · en: Unload film
  'cam.rollSize': 'Poses por filme', // ko: 롤 장수 · en: Roll size
  'cam.rollInfo': 'informações do filme', // ko: 롤 정보 · en: roll info
  'cam.sec': '{n}s', // ko: {n}초 · en: {n}s
  'cam.err.insecure': 'A câmera só funciona em conexão segura (HTTPS). Abra o endereço https.', // ko: 카메라는 보안 연결(HTTPS)에서만 쓸 수 있어요. https 주소로 열어 주세요. · en: The camera only works over a secure (HTTPS) connection. Open the https address.
  'cam.err.unsupported': 'Este navegador não é compatível com a câmera. Use a versão mais recente do Safari ou do Chrome.', // ko: 이 브라우저는 카메라를 지원하지 않아요. 최신 Safari나 Chrome에서 열어 주세요. · en: This browser doesn't support the camera. Try the latest Safari or Chrome.
  'cam.err.busy': 'Outro app está usando a câmera. Feche-o e tente de novo. Enquanto isso, você pode importar fotos e revelá-las.', // ko: 다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해 주세요. 그동안 기기의 사진을 불러와 현상할 수 있어요. · en: Another app is using the camera. Close it and try again. In the meantime, you can import photos and develop them.
  'cam.err.notfound': 'Nenhuma câmera foi encontrada neste dispositivo. Em vez disso, você pode importar fotos e revelá-las.', // ko: 이 기기에서 카메라를 찾지 못했어요. 대신 기기의 사진을 불러와 현상할 수 있어요. · en: No camera was found on this device. You can import photos and develop them instead.
  'cam.quadProgress': 'Lente {n}/4', // ko: 렌즈 {n}/4 · en: Lens {n}/4
  'common.skip': 'Pular', // ko: 건너뛰기 · en: Skip
  'view.savedToast': 'Imagem salva', // ko: 이미지를 저장했어요 · en: Image saved
  'view.prev': 'Foto anterior', // ko: 이전 사진 · en: Previous photo
  'view.next': 'Próxima foto', // ko: 다음 사진 · en: Next photo
  'view.photoN': 'Foto {n}', // ko: {n}번째 사진 · en: Photo {n}
  'dr.applyRollConfirm': 'Aplicar estes ajustes a todas as fotos do filme?', // ko: 이 설정을 롤의 모든 사진에 적용할까요? · en: Apply these settings to every photo in the roll?
  'dr.original': 'Original', // ko: 원본 · en: Original
  'dr.showOriginal': 'Ver original', // ko: 원본 보기 · en: Show original
  'dr.years': '{n, plural, one {# ano} other {# anos}}', // ko: {n}년 · en: {n, plural, one {# year} other {# years}}
  'an.log.deleteFrame': 'Apagar registro da pose {n}', // ko: {n}번 컷 기록 삭제 · en: Delete frame {n} log
  'lab.rushFor': 'Revelar agora · {stock}', // ko: 지금 바로 현상 · {stock} · en: Develop now · {stock}
  'speed.default': 'padrão', // ko: 기본 · en: default
  'palette.moss': 'Musgo', // ko: 이끼 · en: Moss
  'palette.mono': 'P&B', // ko: 흑백 · en: Mono
  'palette.sepia': 'Sépia', // ko: 세피아 · en: Sepia
  'palette.ice': 'Gelo', // ko: 얼음 · en: Ice
  'palette.berry': 'Amora', // ko: 베리 · en: Berry
  'cam.chooseCamera': 'Escolha a câmera', // ko: 카메라를 고르세요 · en: Choose your camera
  'cam.film': 'Filme', // ko: 필름 · en: Film
  'cam.fixedFilm': 'Filme exclusivo', // ko: 전용 필름 · en: Built-in film
  'cam.pin': 'Fixar {name}', // ko: {name} 고정 · en: Pin {name}
  'cam.pinHint': 'Fixar no início', // ko: 맨 앞에 고정 · en: Pin to the front
  'cam.pinned': 'Fixada', // ko: 고정됨 · en: Pinned
  'cam.pinnedSay': '{name} fixada no início', // ko: {name} 고정했어요 · 맨 앞에 보여요 · en: {name} pinned to the front
  'cam.unpinnedSay': '{name} desafixada', // ko: {name} 고정을 풀었어요 · en: {name} unpinned
  'cam.pinnedToast': '{name} fixada · agora aparece primeiro', // ko: {name} 고정 · 맨 앞으로 옮겼어요 · en: {name} pinned · moved to the front
  'cam.pinShow': 'Ver', // ko: 보기 · en: Show
  'cam.otherWindow': 'Foto já tirada em outra janela', // ko: 다른 창에서 이미 찍었어요 · en: Already taken in another window
  'cam.pressesDropped': '{n, plural, one {# toque cancelado} other {# toques cancelados}}', // ko: {n}번 누른 건 취소됐어요 · en: {n, plural, one {# press was} other {# presses were}} cancelled
  'cam.quickStart': 'Início rápido', // ko: 빠른 시작 · en: Quick start
  'cam.quick.film': 'Câmera de filme', // ko: 일반 필름 · en: Film camera
  'cam.quick.instant': 'Foto instantânea', // ko: 즉석 사진 · en: Instant photo
  'cam.quick.disposable': 'Descartável', // ko: 일회용 · en: Disposable
  'cam.pack': '{n, plural, one {Cartucho de # foto} other {Cartucho de # fotos}}', // ko: {n}장 팩 · en: {n}-shot pack
  'cam.card': '{n, plural, one {Cartão de # foto} other {Cartão de # fotos}}', // ko: {n}장 메모리 · en: {n}-shot card
  'cam.halves': '{n, plural, one {# meio quadro} other {# meios quadros}}', // ko: 하프 {n}장 · en: {n} half-frames
  'cam.flashCharge': 'Toque para carregar o flash', // ko: 탭해서 플래시 충전 · en: Tap to charge the flash
  'cam.flashCharging': 'Carregando…', // ko: 충전 중… · en: Charging…
  'cam.flashReady': 'Flash pronto', // ko: 플래시 준비됨 · en: Flash ready
  'cam.ev': 'Exposição', // ko: 노출 · en: Exposure
  'cam.palette': 'Paleta', // ko: 팔레트 · en: Palette
  'cam.halfNext': 'A próxima foto vai na metade direita', // ko: 다음 장은 오른쪽 칸에 찍혀요 · en: Next shot fills the right half
  'cam.double1': 'Primeira exposição feita · agora encontre a segunda cena', // ko: 첫 번째 노출 완료 · 겹쳐 담을 장면을 찾아보세요 · en: First exposure done · now find the second scene
  'cam.quadHint': 'Um disparo, quatro lentes em sequência', // ko: 한 번 누르면 렌즈 4개가 차례로 찍어요 · en: One press, four lenses in sequence
  'cam.inCamera': 'Em uso',
  'cam.lastShot': 'Última foto', // ko: 마지막 사진 · en: Last shot
  'cam.packDone': 'Cartucho terminado. Suas fotos estão esperando no álbum.', // ko: 팩을 다 썼어요. 사진은 앨범에서 기다리고 있어요. · en: Pack finished. Your photos are waiting in the album.
  'cam.nShots': '{n, plural, =0 {#\u00a0fotos} one {#\u00a0foto} other {#\u00a0fotos}}', // ko: {n}장 · en: {n, plural, one {# shot} other {# shots}}
  'cam.nHalves': '{n, plural, =0 {# fotos} one {# foto} other {# fotos}} ({f, plural, =0 {# quadros} one {# quadro} other {# quadros}})', // ko: {n}컷({f}프레임) · en: {n, plural, one {# half} other {# halves}} ({f, plural, one {# frame} other {# frames}})
  'cam.nHalfShots': '{n, plural, =0 {# fotos} one {# foto} other {# fotos}}', // ko: {n}컷 · en: {n, plural, one {# half} other {# halves}}
  'cam.develop': 'Mandar revelar', // ko: 현상소로 · en: Send to lab
  'cam.finishPack': 'Tirar o cartucho', // ko: 팩 꺼내기 · en: Finish pack
  'cam.finishCard': 'Finalizar cartão', // ko: 카드 정리 · en: Finish card
  'cam.rewindSub': 'O filme é rebobinado e vai para a revelação. Quando ficar pronto, as fotos aparecem no álbum.', // ko: 필름을 감아 현상소로 보내요. 현상이 끝나면 앨범에서 볼 수 있어요. · en: The roll goes to the lab. Once developed, the photos appear in your album.
  'cam.finishSubViewable': 'Suas fotos já estão no álbum. Finalize para colocar outro.', // ko: 사진은 이미 앨범에 있어요. 정리하면 새로 넣을 수 있어요. · en: Your photos are already in the album. Finish to start a fresh one.
  'cam.finishPackConfirm': 'Você tirou {shots}. Tirar o cartucho? {m, plural, one {A foto restante fica sem uso.} other {As {left} restantes ficam sem uso.}}', // ko: {shots} 찍었어요. 팩에 남은 {left}은 쓰지 않고 꺼낼까요? · en: {shots} taken. Finish the pack? The remaining {left} will go unused. [+ counts: n, m]
  'cam.finishCardConfirm': 'Você tirou {shots}. Finalizar o cartão? {m, plural, one {A foto restante fica em branco.} other {As {left} restantes ficam em branco.}} Suas fotos continuam no álbum.', // ko: {shots} 찍었어요. 카드에 남은 {left}은 비워 두고 정리할까요? 사진은 앨범에 그대로 있어요. · en: {shots} taken. Finish the card? The remaining {left} will stay blank; your photos stay in the album. [+ counts: n, m]
  'cam.switchBody': 'Trocar de câmera', // ko: 다른 카메라로 바꾸기 · en: Switch camera body
  'cam.switchSub': 'Este filme vai primeiro para a revelação. Depois, é só escolher outra câmera.', // ko: 지금 롤을 먼저 현상소로 보낸 뒤 새 카메라를 골라요. · en: This roll goes to the lab first, then you pick a new camera.
  'cam.switchSubViewable': 'Suas fotos ficam no álbum. Depois, é só escolher outra câmera.', // ko: 지금 사진은 앨범에 두고 새 카메라를 골라요. · en: Your photos stay in the album, then you pick a new camera.
  'cam.switchSubEmpty': 'Nenhuma foto ainda, então dá para trocar agora mesmo.', // ko: 아직 찍은 사진이 없어서 바로 바꿀 수 있어요. · en: Nothing shot yet, so you can switch right away.
  'cam.switchConfirm': 'Para trocar de câmera, este filme ({shots}) vai primeiro para a revelação. Todas as fotos serão reveladas.', // ko: 카메라를 바꾸려면 지금 롤({shots})을 먼저 현상소로 보내야 해요. 남은 칸은 비워 둔 채 현상해요. · en: To switch cameras, this roll ({shots}) goes to the lab first. Unused frames stay blank. [+ counts: n]
  'cam.switchConfirmPack': 'Para trocar de câmera, este cartucho ({shots}) é retirado primeiro. Suas fotos continuam no álbum.', // ko: 카메라를 바꾸려면 지금 팩({shots})을 먼저 꺼내요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this pack ({shots}) comes out first. Your photos stay in the album. [+ counts: n]
  'cam.switchConfirmCard': 'Para trocar de câmera, este cartão ({shots}) é finalizado primeiro. Suas fotos continuam no álbum.', // ko: 카메라를 바꾸려면 지금 카드({shots})를 먼저 정리해요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this card ({shots}) is finished first. Your photos stay in the album. [+ counts: n]
  'cam.switchOkFilm': 'Revelar e trocar', // ko: 현상소로 보내고 바꾸기 · en: Send to lab & switch
  'cam.switchOkDone': 'Finalizar e trocar', // ko: 정리하고 바꾸기 · en: Finish & switch
  'cam.switchedLab': 'Filme enviado para revelação. Agora escolha a próxima câmera.', // ko: 롤을 현상소에 보냈어요. 이제 새 카메라를 골라 보세요. · en: Roll sent to the lab. Pick your next camera.
  'cam.switchedAlbum': 'Suas fotos estão no álbum. Agora escolha a próxima câmera.', // ko: 사진을 앨범에 넣었어요. 이제 새 카메라를 골라 보세요. · en: Photos are in your album. Pick your next camera.
  'cam.more': 'Mais', // ko: 더보기 · en: More
  'cam.flashOnSay': 'Flash ativado', // ko: 플래시 켬 · en: Flash on
  'cam.flashOffSay': 'Flash desativado', // ko: 플래시 끔 · en: Flash off
  'cam.flashOnScreen': 'Flash ativado · na câmera frontal, a tela acende no lugar dele', // ko: 플래시 켬 · 전면 카메라는 화면이 하얗게 빛나요 · en: Flash on · the front camera lights up the screen instead
  'cam.flipToFront': 'Mudar para a câmera frontal', // ko: 전면 카메라로 전환 · en: Flip to front camera
  'cam.flipToBack': 'Mudar para a câmera traseira', // ko: 후면 카메라로 전환 · en: Flip to back camera
  'gal.emptyHintCamera': 'Há {shots} esperando na câmera. {n, plural, one {Mande revelar e ela aparece aqui quando ficar pronta.} other {Mande revelar e elas aparecem aqui quando ficarem prontas.}}', // ko: 카메라 안에 사진 {shots}이 기다리고 있어요. 현상소로 보내면 현상을 마친 뒤 여기에 나타나요. · en: You have {shots} in the camera. Send them to the lab and they show up here once developed. [+ counts: n]
  'gal.developNow': 'Mandar revelar', // ko: 현상소로 보내기 · en: Send to lab
  'gal.inCameraBanner': '{shots} na câmera · Mandar revelar', // ko: 카메라 안 {shots} · 현상소로 보내기 · en: {shots} in the camera · Send to lab [+ counts: n]
  'lab.emptyCamera': 'Há {shots} na câmera. Mande revelar o filme e acompanhe a revelação aqui.', // ko: 카메라 안에 사진 {shots}이 있어요. 현상소로 보내면 여기서 현상이 시작돼요. · en: You have {shots} in the camera. Send the roll to the lab and it develops here. [+ counts: n]
  'speed.title': 'Quando quer receber as fotos?', // ko: 언제 받아볼까요? · en: When do you want your prints?
  'speed.instant': 'Na hora', // ko: 즉시 · en: Instant
  'speed.why': 'Esquecer o filme e reencontrar as fotos: essa é a graça. Para ver agora, escolha “Na hora”.', // ko: 잊을 즈음 도착하는 설렘, 그게 필름의 재미예요. 바로 보려면 ‘즉시’. · en: Forget the roll, then find it again. That’s film. Instant shows them now.
  'speed.at.now': 'No álbum agora mesmo', // ko: 지금 바로 앨범에 도착 · en: In your album right away
  'speed.at.today': 'Chega hoje às {time}', // ko: 오늘 {time} 도착 · en: Arrives today at {time}
  'speed.at.tomorrow': 'Chega amanhã às {time}', // ko: 내일 {time} 도착 · en: Arrives tomorrow at {time}
  'speed.at.date': 'Chega em {date}', // ko: {date} 도착 · en: Arrives {date}
  'speed.instant.d': 'Veja sem esperar', // ko: 기다림 없이, 지금 바로 · en: No waiting. See them now
  'speed.1h': '1 hora', // ko: 1시간 · en: 1 hour
  'speed.1h.d': 'O tempo de um cafezinho', // ko: 커피 한 잔의 기다림 · en: Time for a coffee
  'speed.morning': 'Às 9h', // ko: 아침 9시 · en: Next 9 AM
  'speed.morning.d': 'Prontas quando você acordar', // ko: 자고 일어나면 와 있어요 · en: Wake up to your photos
  'speed.3d': '3 dias', // ko: 3일 · en: 3 days
  'speed.3d.d': 'Sem pressa, como antigamente', // ko: 진짜 필름처럼, 느긋하게 · en: Slow, like real film
  'lab.title': 'Laboratório', // ko: 현상소 · en: Film Lab
  'lab.empty': 'Tudo calmo no laboratório por enquanto.', // ko: 지금은 현상소가 조용해요. · en: The lab is quiet right now.
  'lab.emptyHint': 'Os filmes que você mandar revelar esperam aqui.', // ko: 현상소로 보낸 롤은 여기서 기다려요. · en: Rolls you send to the lab wait here.
  'lab.emptyWhat': 'Os filmes que você manda revelar descansam aqui até ficarem prontos.', // ko: 현상소로 보낸 롤이 현상될 때까지 머무는 곳이에요. · en: Rolls you send to the lab rest here while they develop.
  'lab.emptyHow': 'Eles chegam no horário que você escolher. Com “Na hora”, vão direto para o álbum.', // ko: 고른 시간에 맞춰 도착해요. ‘즉시’라면 바로 앨범으로. · en: They arrive on the schedule you choose. Instant skips the wait.
  'lab.intro': 'Depois de revelados, os filmes vão para o álbum.', // ko: 현상을 마친 롤은 앨범으로 옮겨져요. · en: Developed rolls move to your album.
  'lab.introRush': 'Não dá para esperar? Toque em “Revelar agora”.', // ko: 기다리기 어렵다면 ‘지금 바로 현상’을 눌러 보세요. · en: Can’t wait? Tap Develop now.
  'lab.readyIn': 'Pronto em {t}', // ko: {t} 남음 · en: Ready in {t}
  'lab.ready': 'Revelado', // ko: 현상 완료 · en: Developed
  'lab.rush': 'Revelar agora', // ko: 지금 바로 현상 · en: Develop now
  'lab.rushConfirm': 'Pule a espera e veja as fotos no álbum agora mesmo.', // ko: 기다림을 건너뛰고 바로 앨범에서 볼 수 있어요. · en: Skip the wait and see the photos in the album right away.
  'lab.developedToast': 'Seu filme {stock} foi revelado', // ko: {stock} 롤 현상이 끝났어요 · en: Your {stock} roll is developed
  'lab.open': 'Ver fotos', // ko: 사진 보기 · en: View photos
  'gal.title': 'Álbum', // ko: 앨범 · en: Album
  'gal.empty': 'Nenhuma foto ainda.',
  'gal.emptyHint': 'Tire uma na câmera e ela aparece aqui na hora.',
  'gal.folders': 'Pastas',
  'gal.allPhotos': 'Todas as fotos',
  'gal.groups': 'Sessões',
  'gal.shoot': 'Tirar uma foto',
  'gal.emptyHintLab': '{n, plural, one {# filme está sendo revelado.} other {# filmes estão sendo revelados.}}', // ko: 현상소에서 {n}롤이 현상 중이에요. · en: {n, plural, one {# roll is} other {# rolls are}} developing in the lab.
  'gal.openLab': 'Ver laboratório', // ko: 현상소 보기 · en: Open the lab
  'gal.import': 'Importar fotos', // ko: 사진 불러오기 · en: Import photos
  'gal.restore': 'Restaurar backup', // ko: 이전 폰 백업 불러오기 · en: Restore a backup
  'gal.importing': 'Importando… {n}/{total}',
  'gal.imported': 'Importadas', // ko: 불러온 사진 · en: Imported
  'gal.new': 'NOVO', // ko: 새 롤 · en: NEW
  'gal.frames': '{n, plural, =0 {#\u00a0fotos} one {#\u00a0foto} other {#\u00a0fotos}}', // ko: {n}장 · en: {n, plural, one {# frame} other {# frames}}
  'gal.contact': 'Folha de contato', // ko: 밀착 인화 · en: Contact sheet
  'gal.deleteRoll': 'Apagar filme', // ko: 롤 삭제 · en: Delete roll
  'gal.deleteRollConfirm': '{n, plural, one {A foto deste filme será apagada.} other {Todas as # fotos deste filme serão apagadas.}} Você pode desfazer por alguns segundos.', // ko: 이 롤의 사진 {n}장이 모두 삭제돼요. 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: All {n, plural, one {# photo} other {# photos}} in this roll will be deleted. You can undo it for a few seconds afterwards.
  'gal.developing': 'Revelando', // ko: 현상 중 · en: Developing
  'view.share': 'Compartilhar', // ko: 공유 · en: Share
  'view.saveImage': 'Salvar', // ko: 저장 · en: Save
  'view.darkroom': 'Quarto escuro', // ko: 다크룸 · en: Darkroom
  'view.info': 'Informações', // ko: 정보 · en: Info
  'view.deleteConfirm': 'Apagar esta foto? O original também será apagado.', // ko: 이 사진을 삭제할까요? 원본도 함께 삭제돼요. · en: Delete this photo? The original is deleted too.
  'view.developing': 'Revelando…', // ko: 현상 중… · en: Developing…
  'view.taken': 'Tirada em', // ko: 촬영 · en: Taken
  'view.film': 'Filme', // ko: 필름 · en: Film
  'view.frame': 'Pose', // ko: 컷 · en: Frame
  'view.size': 'Tamanho', // ko: 크기 · en: Size
  'dr.title': 'Quarto escuro', // ko: 다크룸 · en: Darkroom
  'dr.film': 'Filme', // ko: 필름 · en: Film
  'dr.push': 'Puxar / segurar', // ko: 증감현상 (대비·입자) · en: Push / pull (contrast & grain)
  'dr.push.hint': '+ contraste e granulação / − mais suave', // ko: + 대비·입자↑ / − 부드럽게 · en: + contrast & grain / − softer
  'dr.stops': '{v} {n, plural, one {ponto} other {pontos}}', // ko: {v} 스톱 · en: {v} {n, plural, one {stop} other {stops}} [+ counts: n]
  'dr.normal': 'Normal', // ko: 노멀 · en: Normal
  'dr.redevelop': 'Revelar de novo', // ko: 다시 현상 · en: Re-develop
  'dr.expired': 'Filme antigo (vencido)', // ko: 오래된 필름 느낌 (만료) · en: Aged film look (expired)
  'dr.grain': 'Granulação', // ko: 입자 · en: Grain
  'dr.halation': 'Halo (halação)', // ko: 빛 번짐 (할레이션) · en: Glow (halation)
  'dr.leak': 'Vazamento de luz', // ko: 빛샘 · en: Light leak
  'dr.leak.reroll': 'Outro vazamento', // ko: 다른 빛샘 · en: Another leak
  'dr.flash': 'Efeito flash', // ko: 플래시 룩 · en: Flash look
  'dr.date': 'Data impressa', // ko: 날짜 각인 · en: Date stamp
  'dr.border': 'Borda', // ko: 테두리 · en: Border
  'dr.border.none': 'Nenhuma', // ko: 없음 · en: None
  'dr.border.film35': '35mm', // ko: 35mm · en: 35mm
  'dr.border.instant': 'Instantânea', // ko: 인스턴트 · en: Instant
  'dr.border.print': 'Cópia', // ko: 인화지 · en: Print
  'dr.border.slide': 'Slide', // ko: 슬라이드 · en: Slide
  'dr.border.gate': 'Cinema', // ko: 시네 · en: Cine
  'dr.border.sprocket': 'Perfurada', // ko: 스프로킷 · en: Sprocket
  'dr.compare': 'Toque e segure para ver o original', // ko: 길게 눌러 원본 보기 · en: Hold to see the original
  'dr.reset': 'Redefinir', // ko: 초기화 · en: Reset
  'dr.saved': 'Foto revelada de novo', // ko: 다시 현상했어요 · en: Re-developed
  'dr.applyRoll': 'Aplicar ao filme todo', // ko: 롤 전체에 적용 · en: Apply to roll
  'dr.rotate': 'Girar', // ko: 회전 · en: Rotate
  'dr.ev': 'Exposição', // ko: 노출 보정 · en: Exposure
  'dr.palette': 'Paleta', // ko: 팔레트 · en: Palette
  'dr.camera': 'Câmera', // ko: 카메라 · en: Camera
  'hint.ios': 'Adicione o Film Camela à Tela de Início para guardar suas fotos com mais segurança (“Compartilhar” → “Adicionar à Tela de Início”).', // ko: 홈 화면에 추가하면 사진을 더 안전하게 지킬 수 있어요. (공유 → 홈 화면에 추가) · en: Add Film Camela to your Home Screen to keep photos safe (Share → Add to Home Screen).
  'dr.applyRollDone': 'Aplicado ao filme todo', // ko: 롤 전체에 적용했어요 · en: Applied to the whole roll
  'dr.applyRollUndone': 'Ajustes do filme restaurados', // ko: 롤 전체 적용을 되돌렸어요 · en: Roll settings restored
  'dr.discardConfirm': 'Descartar as alterações?', // ko: 변경 사항을 버릴까요? · en: Discard changes?
  'dr.discard': 'Descartar', // ko: 버리기 · en: Discard
  'dr.saveNew': 'Salvar cópia', // ko: 새 사진으로 저장 · en: Save as new photo
  'dr.savedNew': 'Salva como nova foto (nº {n})', // ko: 새 사진으로 저장했어요 ({n}번) · en: Saved as a new photo (#{n})
  'dr.tone': 'Visual digital', // ko: 디지털 룩 · en: Digital look
  'dr.look': 'Visual', // ko: 룩 · en: Look
  'dr.tone.none': 'Padrão', // ko: 기본 · en: Default
  'dr.tone.cool': 'Frio', // ko: 쿨 · en: Cool
  'dr.tone.warm': 'Quente', // ko: 웜 · en: Warm
  'dr.tone.washed': 'Desbotado', // ko: 바랜 · en: Washed
  'dr.tone.night': 'Noite', // ko: 야간 · en: Night
  'view.noDate': 'Sem data', // ko: 날짜 정보 없음 · en: No date info
  'roll.select': 'Selecionar', // ko: 선택 · en: Select
  'roll.selectHint': 'Toque nas fotos para selecionar', // ko: 사진을 눌러 선택하세요 · en: Tap photos to select them
  'roll.selectedN': '{n, plural, =0 {Nenhuma selecionada} one {# selecionada} other {# selecionadas}}', // ko: {n}장 선택됨 · en: {n} selected
  'roll.shareN': 'Compartilhar {n}', // ko: 공유 {n}장 · en: Share {n}
  'roll.saveN': 'Salvar {n}', // ko: 저장 {n}장 · en: Save {n}
  'roll.selectPhoto': 'Selecionar foto {n}', // ko: 사진 {n} 선택 · en: Select photo {n}
  'roll.ready': '{n, plural, one {# foto pronta} other {# fotos prontas}}', // ko: 사진 {n}장이 준비됐어요 · en: {n, plural, one {# photo} other {# photos}} ready
  'an.title': 'Analógico', // ko: 아날로그 · en: Analog
  'an.subtitle': 'Ferramentas para sua câmera analógica de verdade', // ko: 실제 필름 카메라를 위한 도구 · en: Tools for your real film camera
  'an.meter': 'Calculadora de exposição Sunny 16', // ko: Sunny 16 노출 계산기 · en: Sunny 16 exposure calculator
  'an.iso': 'ISO', // ko: ISO · en: ISO
  'an.light': 'Luz', // ko: 빛 · en: Light
  'an.aperture': 'Abertura', // ko: 조리개 · en: Aperture
  'an.shutter': 'Velocidade do obturador', // ko: 셔터 속도 · en: Shutter speed
  'an.comp': 'Compensação', // ko: 노출 보정 · en: Compensation
  'an.tripod': 'Use um tripé', // ko: 삼각대를 권장해요 · en: Use a tripod
  'an.outOfRange': 'Fora da faixa do obturador. Tente outra abertura ou ISO.', // ko: 셔터 범위를 벗어났어요. 조리개나 ISO를 바꿔보세요. · en: Outside the shutter range. Try another aperture or ISO.
  'an.light.snow': 'Neve ou areia, com sol', // ko: 맑은 날 눈밭·해변 · en: Snow / sand, sunny
  'an.light.sunny': 'Sol (sombras nítidas)', // ko: 맑음 (선명한 그림자) · en: Sunny (sharp shadows)
  'an.light.slightOvercast': 'Pouco nublado', // ko: 약간 흐림 · en: Slightly overcast
  'an.light.overcast': 'Nublado', // ko: 흐림 · en: Overcast
  'an.light.heavyOvercast': 'Muito nublado', // ko: 매우 흐림 · en: Heavy overcast
  'an.light.shade': 'Sombra aberta', // ko: 그늘 · en: Open shade
  'an.light.sunset': 'Pouco antes do pôr do sol', // ko: 일몰 직전 · en: Just before sunset
  'an.light.indoorBright': 'Ambiente interno claro', // ko: 밝은 실내 · en: Bright interior
  'an.light.indoor': 'Ambiente interno', // ko: 실내 · en: Interior
  'an.light.night': 'Rua à noite', // ko: 밤거리 · en: Night street
  'an.log': 'Caderno de fotos', // ko: 필름 촬영 노트 · en: Film shooting log
  'an.log.empty': 'Nenhum filme registrado ainda.', // ko: 아직 기록 중인 롤이 없어요. · en: No logged rolls yet.
  'an.log.new': 'Registrar novo filme', // ko: 새 롤 기록 · en: Log a new roll
  'an.log.camera': 'Câmera', // ko: 카메라 · en: Camera
  'an.log.film': 'Filme', // ko: 필름 · en: Film
  'an.log.exposures': 'Poses', // ko: 장수 · en: Exposures
  'an.log.note': 'Anotação', // ko: 메모 · en: Note
  'an.log.addFrame': 'Registrar pose', // ko: 컷 기록 · en: Log frame
  'an.log.lens': 'Lente', // ko: 렌즈 · en: Lens
  'an.log.export': 'Exportar CSV', // ko: CSV 내보내기 · en: Export CSV
  'an.log.deleteRoll': 'Apagar registro', // ko: 기록 삭제 · en: Delete log
  'an.log.deleteConfirm': 'Apagar o registro deste filme?', // ko: 이 롤 기록을 삭제할까요? · en: Delete this roll log?
  'an.log.useMeter': 'Usar valores da calculadora', // ko: 계산기 값 사용 · en: Use calculator values
  'an.log.frames': '{n}/{m}\u00a0poses', // ko: {n}/{m}장 · en: {n}/{m} frames
  'an.log.location': 'Salvar localização', // ko: 위치 함께 저장 · en: Save location
  'an.active': 'Filme em andamento', // ko: 지금 기록 중인 롤 · en: Roll in progress
  'an.active.go': 'Registrar uma pose', // ko: 컷 기록하기 · en: Log a frame
  'an.log.repeat': 'Mesmos ajustes +1', // ko: 같은 설정으로 +1컷 · en: Same settings +1
  'an.log.otherSettings': 'Novos ajustes', // ko: 다른 설정 · en: New settings
  'an.log.frameN': 'Registrar pose {n}', // ko: {n}번 컷 기록 · en: Log frame {n}
  'an.log.editFrame': 'Editar pose {n}', // ko: {n}번 컷 고치기 · en: Edit frame {n}
  'an.log.saveFrame': 'Registrar esta pose', // ko: 이 컷 기록 · en: Log this frame
  'an.log.saveEdit': 'Salvar alterações', // ko: 고친 내용 저장 · en: Save changes
  'an.log.manual': 'Digitar', // ko: 직접 입력 · en: Type it in
  'an.log.pickStops': 'Escolher na escala', // ko: 눈금에서 고르기 · en: Pick from the dial
  'an.log.logged': 'Pose {n} registrada', // ko: {n}번 컷을 기록했어요 · en: Frame {n} logged
  'an.log.deleted': 'Registro da pose {n} apagado', // ko: {n}번 컷 기록을 지웠어요 · en: Frame {n} log deleted
  'an.log.undo': 'Desfazer', // ko: 되돌리기 · en: Undo
  'an.log.undoFailed': 'Não foi possível desfazer: esse número de pose já está em uso', // ko: 그 사이 같은 번호가 기록돼서 되돌리지 못했어요 · en: Couldn't undo: that frame number is taken now
  'an.log.full': 'Todas as poses deste filme foram registradas', // ko: 이 롤의 컷을 모두 기록했어요 · en: Every frame on this roll is logged
  'an.log.firstHint': 'Registre aqui cada pose enquanto fotografa. Toque numa linha para editar quando quiser.', // ko: 한 컷 찍을 때마다 여기에 남겨 두세요. 줄을 누르면 언제든 고칠 수 있어요. · en: Log each frame here as you shoot. Tap a row any time to edit it.
  'set.title': 'Ajustes', // ko: 설정 · en: Settings
  'set.shooting': 'Captura',
  'set.shooting.sum': 'Som · Vibração · Grade',
  'set.about': 'Sobre',
  'set.lang': 'Idioma', // ko: 언어 · en: Language
  'set.lang.auto': 'Sistema', // ko: 시스템 · en: System
  'set.sound': 'Som do obturador', // ko: 셔터 소리 · en: Shutter sound
  'set.haptics': 'Vibração', // ko: 진동 · en: Haptics
  'set.dateStamp': 'Adicionar data às fotos', // ko: 사진에 날짜 넣기 · en: Add the date to photos
  'set.dateFormat': 'Formato da data', // ko: 날짜 형식 · en: Date format
  'set.grid': 'Mostrar grade', // ko: 격자 표시 · en: Show grid
  'set.mirror': 'Espelhar fotos da câmera frontal', // ko: 전면 카메라 좌우 반전 저장 · en: Mirror front camera photos
  'set.rollSize': 'Poses por filme (padrão)', // ko: 기본 롤 장수 · en: Default roll size
  'set.speed': 'Tempo de revelação padrão', // ko: 기본 현상 속도 · en: Default lab speed
  'set.speed.hint': 'Aparece como “padrão” quando você manda um filme revelar. Câmeras instantâneas e digitais pulam a revelação: as fotos vão direto para o álbum.', // ko: 필름 롤을 현상소로 보낼 때 ‘기본’으로 표시돼요. 인스턴트·디카 사진은 현상소 없이 바로 앨범에 들어가요. · en: Marked as default when you send a film roll to the lab. Instant and digital cameras skip the lab: their photos go straight to the album.
  'set.storage': 'Armazenamento', // ko: 저장 공간 · en: Storage
  'set.storage.used': '{used} em uso', // ko: {used} 사용 중 · en: {used} used
  'set.storage.persist': 'Impedir que as fotos sejam apagadas', // ko: 사진 지워지지 않게 보호 · en: Keep photos from being cleared
  'set.storage.persistHint': 'Pede ao navegador que não apague as fotos deste app automaticamente quando faltar espaço no dispositivo.', // ko: 기기 저장 공간이 부족해져도 브라우저가 이 앱의 사진을 자동으로 지우지 않도록 요청해요. · en: Asks the browser not to clear this app’s photos automatically when the device runs low on space.
  'set.storage.persistAsk': 'Ativar', // ko: 보호 켜기 · en: Turn on
  'set.storage.persisted': 'Protegidas', // ko: 보호됨 · en: Protected
  'set.storage.refusedShort': 'Recusado', // ko: 허락 안 됨 · en: Not allowed
  'set.storage.refused': 'Este navegador recusou. Adicionar o Film Camela à Tela de Início mantém as fotos por mais tempo. Faça um backup também.', // ko: 이 브라우저가 보호를 허락하지 않았어요. 홈 화면에 추가하면 더 오래 보관돼요. 백업도 함께 해 두세요. · en: This browser declined. Adding Film Camela to your Home Screen keeps photos longer. Keep a backup too.
  'set.install': 'Instalar na Tela de Início', // ko: 홈 화면에 앱 설치 · en: Install app to home screen
  'set.privacy': 'Política de privacidade', // ko: 개인정보 처리방침 · en: Privacy policy
  'set.terms': 'Termos de uso', // ko: 이용약관 · en: Terms of use
  'set.support': 'Suporte e contato', // ko: 고객지원 · 문의 · en: Support & contact
  'set.licenses': 'Licenças de código aberto', // ko: 오픈소스 라이선스 · en: Open-source licenses
  'set.backup': 'Backup', // ko: 백업 · en: Backup
  'set.backup.hint': 'Suas fotos e anotações ficam só neste dispositivo. Antes de trocar de celular ou limpar os dados do navegador, salve um arquivo de backup (.zip) em um lugar seguro.', // ko: 사진과 기록은 이 기기에만 머물러요. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일(.zip)로 챙겨 두세요. · en: Your photos and logs live only on this device. Before you switch phones or clear browser data, save a backup file (.zip) somewhere safe.
  'set.backup.export': 'Salvar backup (.zip)', // ko: 백업 파일 저장 (.zip) · en: Save backup file (.zip)
  'set.backup.saveAgain': 'Salvar outra cópia', // ko: 한 번 더 저장 · en: Save another copy
  'set.backup.send': 'Enviar por mensagem ou e-mail', // ko: 카카오톡·드라이브로 보내기 · en: Send to KakaoTalk or Drive
  'set.backup.savedWeb': 'Salvo na pasta Downloads · {name}', // ko: 다운로드 폴더에 저장했어요 · {name} · en: Saved to your Downloads folder · {name}
  'set.backup.savedShared': 'Salvo onde você escolheu (Arquivos, Drive…) · {name}', // ko: 공유 창에서 고른 곳(파일·드라이브 등)에 저장했어요 · {name} · en: Saved where you picked in the share sheet (Files, Drive…) · {name}
  'set.backup.restoreHint': 'Para passar para um celular novo, envie este arquivo para você mesmo (por mensagem, e-mail ou nuvem) e abra no celular novo em Ajustes do Film Camela › “Restaurar backup”.', // ko: 새 폰으로 옮기려면 이 파일을 카카오톡 ‘나와의 채팅’이나 드라이브로 보낸 뒤, 새 폰의 Film Camela 설정에서 ‘백업에서 복원’을 눌러 열어요. · en: To move to a new phone, send this file to yourself (KakaoTalk, Drive or email), then open it there with Restore from backup in Film Camela Settings.
  'set.credit': '© 2026 ATIUM GROUP Co., Ltd.', // ko: © 2026 아티움그룹 주식회사 (ATIUM GROUP Co., Ltd.) · en: © 2026 ATIUM GROUP Co., Ltd.
  'set.backup.import': 'Restaurar backup', // ko: 백업에서 복원 · en: Restore from backup
  'set.backup.working': 'Fazendo backup… {done}/{total}', // ko: 백업 중… {done}/{total} · en: Backing up… {done}/{total}
  'set.backup.restoring': 'Restaurando…', // ko: 복원 중… · en: Restoring…
  'set.backup.done': 'Backup pronto · {rolls, plural, =0 {# filmes} one {# filme} other {# filmes}}, {photos, plural, =0 {# fotos} one {# foto} other {# fotos}}', // ko: 백업 준비 완료 · 롤 {rolls}개, 사진 {photos}장 · en: Backup ready · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}}
  'set.backup.save': 'Pronto · Salvar', // ko: 준비 완료 · 저장하기 · en: Ready · Save it
  'set.backup.saved': 'Backup salvo', // ko: 백업 파일을 저장했어요 · en: Backup file saved
  'set.backup.saveFailed': 'Não foi possível salvar. Toque de novo', // ko: 저장하지 못했어요. 다시 눌러 주세요 · en: Couldn't save it. Tap again
  'set.backup.tooLarge': 'Passa de 4 GB, grande demais para um só arquivo. Apague alguns filmes antigos e tente de novo', // ko: 4GB가 넘어 파일 하나에 담을 수 없어요. 오래된 롤을 정리한 뒤 다시 시도해 주세요 · en: Over 4 GB, too large for one file. Clear out some old rolls and try again
  'set.backup.newer': 'Este backup é de uma versão mais nova do app. Atualize o app', // ko: 더 새로운 버전의 앱에서 만든 백업이에요. 앱을 업데이트해 주세요 · en: This backup is from a newer version of the app. Please update
  'set.backup.partial': 'A restauração parou depois de {rolls, plural, =0 {# filmes} one {# filme} other {# filmes}}. Libere espaço e restaure de novo para continuar', // ko: 롤 {rolls}개까지 복원하고 멈췄어요. 저장 공간을 확보한 뒤 다시 복원하면 이어서 진행돼요 · en: Stopped after restoring {rolls, plural, one {# roll} other {# rolls}}. Free up storage and restore again to continue
  'set.backup.empty': 'Ainda não há fotos nem registros para o backup', // ko: 아직 백업할 사진이나 기록이 없어요 · en: Nothing to back up yet
  'set.backup.restored': 'Restaurado · {rolls, plural, =0 {# filmes} one {# filme} other {# filmes}} e {photos, plural, =0 {# fotos} one {# foto} other {# fotos}} adicionados', // ko: 복원 완료 · 롤 {rolls}개, 사진 {photos}장 추가 · en: Restored · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}} added
  'set.backup.skipped': '{n, plural, one {# item que você já tinha foi mantido} other {# itens que você já tinha foram mantidos}}', // ko: 이미 있는 항목 {n}개는 그대로 두었어요 · en: Skipped {n, plural, one {# item} other {# items}} you already have
  'set.backup.damaged': '{n, plural, one {# item danificado foi ignorado} other {# itens danificados foram ignorados}}', // ko: 손상된 항목 {n}개는 건너뛰었어요 · en: Skipped {n} damaged {n, plural, one {item} other {items}}
  'set.backup.invalid': 'Não é um backup do Film Camela, ou o arquivo está danificado', // ko: Film Camela 백업 파일이 아니거나 손상된 파일이에요 · en: Not a Film Camela backup, or the file is damaged
  'set.backup.failed': 'Não foi possível criar o backup. Verifique o espaço livre', // ko: 백업을 만들지 못했어요. 저장 공간을 확인해 주세요 · en: Couldn't create the backup. Check free storage
  'set.reset': 'Apagar todos os dados', // ko: 모든 데이터 삭제 · en: Delete all data
  'set.resetConfirm': 'Todos os filmes, fotos, anotações e ajustes serão apagados, e isso não pode ser desfeito. Antes, faça um backup com “Salvar backup (.zip)”, acima. Apagar mesmo assim?', // ko: 모든 롤, 사진, 기록, 설정이 삭제되고 되돌릴 수 없어요. 먼저 위의 ‘백업 파일 저장’으로 백업해 두세요. 그래도 삭제할까요? · en: All rolls, photos, logs and settings will be deleted, and this cannot be undone. Save a backup file first (above). Delete anyway?
  'set.version': 'Versão', // ko: 버전 · en: Version
  'set.replayOnb': 'Ver a introdução de novo', // ko: 소개 다시 보기 · en: Replay intro
  'share.title': 'Fotografado com Film Camela', // ko: Film Camela로 촬영 · en: Shot on Film Camela
  'err.storage': 'O armazenamento está cheio. Apague algumas fotos e tente de novo.', // ko: 저장 공간이 부족해요. 사진 몇 장을 지우고 다시 시도해 주세요. · en: Storage is full. Delete a few photos and try again.
  'common.notFound': 'Não foi possível encontrar. Talvez tenha sido apagado.', // ko: 찾을 수 없어요. 삭제되었을 수 있어요. · en: Couldn't find this. It may have been deleted.
  'an.log.noLocation': 'Não foi possível obter sua localização, então foi salvo sem ela', // ko: 위치를 확인하지 못해 위치 없이 저장했어요 · en: Couldn’t get your location, so it was saved without one
  'err.storagePermission': 'A permissão de armazenamento está desativada. Permita em Configurações > Apps > Film Camela > Permissões.', // ko: 저장 권한이 꺼져 있어요. 설정 > 앱 > Film Camela > 권한에서 저장공간을 허용해 주세요. · en: Storage permission is off. Allow it in Settings > Apps > Film Camela > Permissions.
  'err.noStorage': 'Este navegador não permite que o Film Camela salve fotos. Desative a navegação privada ou permita dados de sites e abra o app de novo.', // ko: 이 브라우저 설정에서는 사진을 저장할 수 없어요. 사생활 보호(시크릿) 모드를 끄거나 사이트 데이터 저장을 허용해 주세요. · en: This browser won't let Film Camela save photos. Turn off private browsing or allow site data, then reopen the app.
  'err.import': 'Não foi possível importar este arquivo.', // ko: 이 파일은 불러올 수 없어요. · en: This file could not be imported.
  'update.ready': 'Uma nova versão está pronta', // ko: 새 버전이 준비됐어요 · en: A new version is ready
  'update.reload': 'Recarregar', // ko: 새로고침 · en: Reload
  'offline.ready': 'Pronto para funcionar offline', // ko: 오프라인에서도 사용할 수 있어요 · en: Ready to work offline
  'a11y.cameraTitle': 'Câmera', // ko: 카메라 · en: Camera
  'a11y.rollLoaded': 'Filme {stock} colocado · {n, plural, one {# pose} other {# poses}}', // ko: {stock} · {n}장 넣었어요 · en: {stock} loaded · {n, plural, one {# shot} other {# shots}}
  'a11y.sentToLab': 'Enviado para revelação · pronto em {wait}', // ko: 현상소로 보냈어요 · {wait} 뒤 도착 · en: Sent to the lab · ready in {wait}
  'a11y.cameraKeys': 'Use as setas para trocar de câmera',
  'cam.timerSay': '{n, plural, one {Foto em # segundo} other {Foto em # segundos}} · toque no obturador de novo para cancelar', // ko: {n}초 뒤 촬영 · 셔터를 다시 누르면 취소 · en: Taking the photo in {n} seconds · press the shutter again to cancel
  'cam.timerCancelled': 'Timer cancelado', // ko: 타이머를 취소했어요 · en: Timer cancelled
  'cam.tapToCancel': 'Toque para cancelar', // ko: 탭하면 취소 · en: Tap to cancel
  'cam.cancelTimer': 'Cancelar timer', // ko: 타이머 취소 · en: Cancel timer
  'cam.doubleHint': 'Dois disparos, uma pose', // ko: 두 번 눌러 한 장에 겹쳐요 · en: Two presses, one frame
  'cam.double2': 'Toque de novo para expor sobre a primeira foto', // ko: 한 번 더 누르면 첫 장면 위에 겹쳐 찍혀요 · en: Press again to expose over the first shot
  'cam.pressBusy': 'Ainda salvando as fotos anteriores', // ko: 앞 사진을 저장하는 중이에요 · en: Still saving the previous shots
  'cam.pressFull': 'Não restam poses', // ko: 남은 컷이 없어요 · en: No frames left
  'cam.startingQueued': 'A foto será tirada assim que a câmera estiver pronta', // ko: 카메라가 준비되면 바로 찍어요 · en: Taking the photo as soon as the camera is ready
  'cam.switchConfirmFilm2': 'Ao trocar de câmera, este filme vai para a revelação. {n, plural, one {A foto tirada será revelada} other {As {shots} tiradas serão reveladas}}; {m, plural, one {a foto restante fica sem uso} other {as {left} restantes ficam sem uso}}.', // ko: 카메라를 바꾸면 지금 롤은 현상소로 가요. 찍은 {shots}은 현상하고, 남은 {left}은 쓰지 않아요. · en: Switching sends this roll to the lab. The {shots} you took {n, plural, one {gets} other {get}} developed; the {left} left {m, plural, one {stays} other {stay}} unused. [+ counts: n, m]
  'cam.switchConfirmPack2': 'Ao trocar de câmera, este cartucho é retirado. {n, plural, one {A foto tirada vai} other {As {shots} tiradas vão}} para o álbum; {m, plural, one {a foto restante fica sem uso} other {as {left} restantes ficam sem uso}}.', // ko: 카메라를 바꾸면 지금 팩을 꺼내요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching takes this pack out. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'cam.switchConfirmCard2': 'Ao trocar de câmera, este cartão é finalizado. {n, plural, one {A foto tirada vai} other {As {shots} tiradas vão}} para o álbum; {m, plural, one {a foto restante fica sem uso} other {as {left} restantes ficam sem uso}}.', // ko: 카메라를 바꾸면 지금 카드를 정리해요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching finishes this card. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'common.undo': 'Desfazer', // ko: 되돌리기 · en: Undo
  'view.deleteUndoConfirm': 'Você pode desfazer por alguns segundos.', // ko: 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: You can undo it for a few seconds afterwards.
  'view.deleted': 'Foto apagada', // ko: 사진을 삭제했어요 · en: Photo deleted
  'view.restored': 'Foto restaurada', // ko: 사진을 되돌렸어요 · en: Photo restored
  'view.deleteTitle': 'Apagar esta foto?', // ko: 사진을 삭제할까요? · en: Delete this photo?
  'view.savedWeb': 'Salva na pasta Downloads', // ko: 다운로드 폴더에 저장했어요 · en: Saved to your Downloads folder
  'view.savedAndroid': 'Salva em Galeria › álbum Film Camela', // ko: 갤러리 › Film Camela 앨범에 저장했어요 · en: Saved to Gallery › Film Camela album
  'gal.deleteRollTitle': 'Apagar este filme?', // ko: 이 롤을 삭제할까요? · en: Delete this roll?
  'gal.rollDeleted': 'Filme apagado', // ko: 롤을 삭제했어요 · en: Roll deleted
  'gal.rollRestored': 'Filme restaurado', // ko: 롤을 되돌렸어요 · en: Roll restored
  'gal.rollRestoreBlocked': 'Não é possível restaurar: há outro filme na câmera agora', // ko: 카메라에 다른 롤이 들어 있어서 되돌릴 수 없어요 · en: Can't restore it: another roll is in the camera now
  'gal.framesHalf': '{f, plural, =0 {# quadros} one {# quadro} other {# quadros}} ({n, plural, =0 {# fotos} one {# foto} other {# fotos}})', // ko: {f}프레임 ({n}컷) · en: {f, plural, one {# frame} other {# frames}} ({n, plural, one {# shot} other {# shots}})
  'gal.help': 'Ajuda', // ko: 도움말 · en: Help
  'lab.rushTitle': 'Revelar agora?', // ko: 지금 바로 현상할까요? · en: Develop now?
  'view.pushNormal': 'Normal', // ko: 노멀 · en: Normal
  'view.expiredNone': 'Filme novo', // ko: 새 필름 · en: Fresh film
  'view.expiredYears': '{n, plural, one {Vencido há # ano} other {Vencido há # anos}}', // ko: {n}년 지난 필름 · en: Expired {n, plural, one {# year} other {# years}}
  'dur.days': '{n}d', // ko: {n}일 · en: {n}d
  'dur.hours': '{n}h', // ko: {n}시간 · en: {n}h
  'dur.minutes': '{n}min', // ko: {n}분 · en: {n}m
  'dur.seconds': '{n}s', // ko: {n}초 · en: {n}s
  'dur.pair': '{a} {b}', // ko: {a} {b} · en: {a} {b}
  'wait.days': '{n, plural, one {# dia} other {# dias}}', // ko: {n}일 · en: {n} d
  'wait.hours': '{n, plural, one {# hora} other {# horas}}', // ko: {n}시간 · en: {n} h
  'wait.minutes': '{n, plural, one {# minuto} other {# minutos}}', // ko: {n}분 · en: {n} min

  // MY tab (shots, rewarded ads, Pro) and the paywall sheet. {n} = a count; {left} = how many are left;
  // {time} = local clock time; {date} = a date; {store} = "Google Play" / "App Store" (never translated).
  'quota.empty': 'Você usou as 10 fotos grátis de hoje · ganhe mais em Meu espaço ou assine o Pro',
  'my.free': 'Grátis hoje',
  'my.free.say': '{left, plural, =0 {Restam 0 de {n} fotos grátis hoje} one {Resta # de {n} fotos grátis hoje} other {Restam # de {n} fotos grátis hoje}}',
  'my.unlimited': 'Ilimitado',
  'my.earned.label': 'Fotos extras',
  'my.earned.note': 'Ficam até você usar.',
  'my.resets': '{n, plural, one {# foto grátis de novo às {time}} other {# fotos grátis de novo às {time}}}',
  'my.ad.watch': '{n, plural, one {Ver um anúncio · +# foto} other {Ver um anúncio · +# fotos}}',
  'my.ad.left': '{left, plural, =0 {Restam 0 de {n} anúncios hoje} one {Resta # de {n} anúncios hoje} other {Restam # de {n} anúncios hoje}}',
  'my.ad.loading': 'Carregando o anúncio…',
  'my.ad.none': 'Você já viu todos os anúncios de hoje. Tem mais amanhã.',
  'my.ad.offline': 'Conecte-se à internet para ver um anúncio.',
  'my.ad.blocked': 'Não há anúncios disponíveis agora.',
  'my.ad.pro': 'Com o Pro, fotografe à vontade. Sem anúncios.',
  'my.ad.rewarded': '{n, plural, one {+# foto adicionada. Continue fotografando.} other {+# fotos adicionadas. Continue fotografando.}}',
  'my.ad.dismissed': '{n, plural, one {Assista até o fim para ganhar # foto.} other {Assista até o fim para ganhar # fotos.}}',
  'my.ad.failed': 'O anúncio não carregou. Tente de novo daqui a pouco.',
  'my.pro.lead': 'Fotos ilimitadas. Sem anúncios.',
  'my.plans': 'Planos Pro',
  'my.plan.week': '1 semana',
  'my.plan.3month': '3 meses',
  'my.plan.lifetime': 'Vitalício',
  'my.plan.week.d': 'Renovação automática semanal',
  'my.plan.3month.d': 'Renovação automática a cada 3 meses',
  'my.plan.lifetime.d': 'Pague uma vez, use para sempre',
  'my.plan.best': 'Mais vantajoso',
  'my.buy': 'Obter o Pro',
  'my.restore': 'Restaurar compras',
  'my.redeem': 'Resgatar um código',
  'my.redeemHint': 'Digite seu código e resgate no Google Play. O Pro é ativado quando você voltar ao app.',
  'my.redeemCode': 'Código',
  'my.redeemGo': 'Resgatar no Google Play',
  'my.manage': 'Gerenciar assinatura',
  'my.pro.on': 'Você tem o Pro',
  'my.pro.lifetimeOn': 'Vitalício · fotos ilimitadas, sem anúncios',
  'my.pro.subOn': 'Assinatura ativa · fotos ilimitadas, sem anúncios',
  'my.pro.renews': 'Renova em {date}',
  'my.pro.pending': 'Aguardando o pagamento. O Pro é liberado assim que for aprovado.',
  'my.pro.noStore': 'Não foi possível conectar à loja agora. Tente de novo daqui a pouco.',
  'my.pro.legal': 'As assinaturas são renovadas automaticamente pelo mesmo período, a menos que sejam canceladas pelo menos 24 horas antes do fim do período atual, e são cobradas na sua conta ({store}). Cancele quando quiser nas configurações de assinatura da loja ({store}). O plano vitalício é um pagamento único.',
  'my.buy.done': 'O Pro está ativo. Fotografe à vontade.',
  'my.buy.failed': 'A compra não foi concluída. Tente de novo.',
  'my.restore.done': 'Pro restaurado.',
  'my.restore.none': 'Não há compras para restaurar nesta conta.',
  'my.restore.failed': 'Não foi possível restaurar. Tente de novo daqui a pouco.',
  'my.app.title': 'Mais fotos no app',
  'my.app.body': '{n, plural, one {No app, um anúncio curto dá # foto a mais, ou assine o Pro e fotografe sem limite.} other {No app, um anúncio curto dá # fotos a mais, ou assine o Pro e fotografe sem limite.}}',
  'my.app.play': 'Baixar no Google Play',
  'my.adPrivacy': 'Privacidade dos anúncios',
  'shots.left': '{n, plural, =0 {Sem fotos hoje} one {Resta # foto} other {Restam # fotos}}',
  'shots.leftSay': '{n, plural, =0 {Não restam fotos hoje} one {Resta # foto hoje} other {Restam # fotos hoje}}',
  'pw.title': '{n, plural, one {Você usou a foto grátis de hoje} other {Você usou as # fotos grátis de hoje}}',
  'pw.lead': 'Se a luz ainda está boa, fotografe mais um pouco.',
  'pw.pro': 'Fotos ilimitadas com o Pro',
  'pw.later': 'Volto amanhã',
};

export const cameraText: LocaleCameraText = {
  /** Camera body descriptions (expressive register, guide §1.1). */
  desc: {
    pro35: 'Uma reflex 35mm confiável. Todos os filmes 35mm, três formatos, zoom e compensação de exposição.', // ko: 믿음직한 35mm SLR. 모든 35mm 필름과 3가지 비율, 줌, 노출 보정까지. · en: A dependable 35mm SLR. Every 35mm film, three formats, zoom, and an exposure dial.
    snap27: 'Uma descartável de 27 poses. Lente de plástico suave e um flash que você carrega antes de cada foto.', // ko: 27장짜리 일회용 카메라. 살짝 뭉개지는 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable. A soft plastic lens and a flash you charge before every shot.
    instasq: 'Uma instantânea quadrada, com cartuchos de 10 fotos. Cada foto sai na hora e ganha vida aos poucos.', // ko: 정사각 인스턴트, 10장 팩. 찍자마자 사진이 나오고, 천천히 상이 떠올라요. · en: A square instant camera with 10-shot packs. Each print slides out and slowly comes to life.
    half72: 'Duas fotos lado a lado em cada pose. São 72 meios quadros: o dobro de momentos.', // ko: 35mm 한 컷에 두 장을 나란히 담는 하프프레임. 한 롤에 72장, 두 배의 순간. · en: Two shots side by side in every frame. 72 half-frames, twice the moments.
    zonelc: 'Vinheta de túnel e cores saturadas. Uma compacta para andar sem rumo pelas ruas.', // ko: 터널 같은 비네팅과 진한 색. 골목을 걷는 날을 위한 컴팩트. · en: Tunnel vignetting and saturated color. A compact made for wandering the streets.
    toy120: 'Uma câmera de brinquedo de médio formato, com lente de plástico. Bordas suaves, vinheta forte e vazamentos de luz frequentes.', // ko: 플라스틱 렌즈의 중판 토이 카메라. 흐릿한 가장자리, 짙은 비네팅, 자주 스미는 빛샘. · en: A plastic-lens medium-format toy. Soft edges, deep vignetting, and frequent light leaks.
    quad4: 'Quatro lentes disparam com 0,2 s de intervalo. Quatro instantes de movimento numa só foto.', // ko: 렌즈 4개가 0.2초 간격으로 차례차례. 한 장에 담기는 네 번의 움직임. · en: Four lenses fire 0.2 s apart. Four moments of motion in one frame.
    doublex: 'Duas exposições, uma só pose. Uma segunda cena pousa sobre a primeira.', // ko: 한 컷에 두 번의 노출. 첫 장면 위로 두 번째 장면이 포개져요. · en: Two exposures, one frame. A second scene settles over the first.
    panox: 'Panorâmicas amplas em 65:24. São 21 poses por filme.', // ko: 65:24의 넓은 파노라마. 시야 가득, 한 롤에 21장. · en: Sweeping 65:24 panoramas. 21 frames per roll.
    fish180: 'Olho de peixe circular de 180°. O mundo inteiro num círculo.', // ko: 180° 원형 어안. 세상을 동그랗게 담아요. · en: A 180° circular fisheye. The whole world in a circle.
    cine: 'Tela larga anamórfica 2.39:1. Rastros azuis de flare cruzando as luzes fortes.', // ko: 2.39:1 시네마스코프. 밝은 빛을 가로지르는 푸른 플레어. · en: 2.39:1 anamorphic widescreen. Blue streaks of flare across bright lights.
    ccd03: 'Uma digital saída direto de 2003. Cartão de 99 fotos, data digital impressa e visualização na hora.', // ko: 2003년 그 시절의 디카. 99장 메모리, 디지털 날짜, 찍고 바로 확인. · en: A digicam straight from 2003. 99-shot card, digital date imprint, instant review.
    pixel: 'Uma câmera de bolso de pixels, 128×112. São 30 fotos em paletas de quatro cores.', // ko: 128×112 픽셀의 포켓 카메라. 4색 팔레트에 담는 30장. · en: A 128×112 pocket pixel camera. 30 shots in four-color palettes.
    range: 'Uma telemétrica silenciosa. Lente nítida, linhas de enquadramento luminosas e preto e branco por padrão.', // ko: 조용한 레인지파인더. 선명한 렌즈, 밝은 프레임 라인, 기본은 흑백. · en: A quiet rangefinder. Crisp lens, bright frame lines, black and white by default.
    aqua27: 'Uma descartável de 27 poses numa caixa à prova d’água. Tons verde-azulados de água, lente suave e um flash que você carrega a cada foto.', // ko: 방수 하우징을 입은 27장 일회용. 물빛 청록 톤, 부드러운 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable in a waterproof housing. Blue-green water tones, a soft lens, a flash you charge every shot.
    instaw: 'Uma instantânea de formato largo, com cartuchos de 10 fotos. As fotos saem na horizontal e ganham vida aos poucos.', // ko: 가로로 넓은 와이드 인스턴트, 10장 팩. 넓게 나온 사진에 천천히 상이 떠올라요. · en: A wide-format instant camera with 10-shot packs. Landscape prints slide out and slowly come to life.
    twin66: 'Uma reflex de duas lentes, para fotografar olhando o visor de cima. São 12 poses quadradas 6×6, com a imagem espelhada.', // ko: 고개 숙여 내려다보는 이안 리플렉스. 6×6 정사각 12장, 파인더 속 세상은 좌우가 뒤바뀌어요. · en: A twin-lens reflex you look down into. 12 square 6×6 frames through a mirror-reversed finder.
    super8: 'Um quadro tirado de um filme caseiro em 8mm. Janela arredondada, cor quente e granulação forte.', // ko: 8mm 홈무비에서 꺼낸 한 프레임. 둥근 게이트, 따뜻한 색, 굵은 입자. · en: A single frame from an 8mm home movie. Rounded gate, warm color, heavy grain.
    slide35: 'Uma compacta feita para filme slide. Cores vibrantes, devolvidas em molduras brancas de slide.', // ko: 슬라이드 필름 전용 컴팩트. 쨍한 색을 하얀 마운트에 담아 돌려줘요. · en: A compact made for slide film. Vivid color, returned in white slide mounts.
    party: 'Uma compacta de festa com um flash grande ligado por padrão. Luz direta e forte, e data impressa.', // ko: 큼직한 플래시가 기본으로 켜지는 파티용 컴팩트. 정면으로 터지는 강한 플래시와 날짜 각인. · en: A party compact whose big flash is on by default. Hard, direct flash and a date imprint.
    kidcam: 'Uma câmera infantil de 0,3 MP. 640 px, cores no máximo, data digital e visualização na hora.', // ko: 0.3메가 어린이 디카. 640픽셀, 넘치는 채도, 디지털 날짜, 찍고 바로 확인. · en: A 0.3 MP kids’ camera. 640 px, colors turned all the way up, digital date, instant review.
    sprocket: 'Uma panorâmica que avança sobre as perfurações, e os furos do filme emolduram cada foto.', // ko: 필름 구멍까지 담기는 파노라마. 사진 위아래로 퍼포레이션이 그대로 남아요. · en: A panorama that runs right over the sprocket holes, so the perforations frame every shot.
    floppy98: 'Uma digital de 1998 que grava em disquete. 20 fotos de 640 px por disco, cores frias e borradas.', // ko: 플로피 디스크에 저장하는 1998년 디카. 디스크 한 장에 640픽셀 사진 20장, 차갑고 뭉개진 색. · en: A 1998 digicam that saves to a floppy disk. 20 shots of 640 px per disk, cool smeared color.
    slim06: 'Uma ultrafina de 7 MP para o bolso. Cores vivas, flash ligado por padrão e data digital.', // ko: 주머니에 쏙 들어가는 700만 화소 초슬림 디카. 쨍한 색, 기본으로 켜지는 플래시, 디지털 날짜. · en: A 7 MP ultra-slim for your pocket. Punchy color, flash on by default, digital date.
    bridge09: 'Uma superzoom de 20×. Traz para perto o que está longe, em 4:3, 3:2 ou 1:1.', // ko: 20배 줌의 하이줌 디카. 먼 곳도 당겨 찍고, 4:3·3:2·1:1 세 가지 비율로. · en: A 20× superzoom. Pull in what’s far away, in 4:3, 3:2 or 1:1.
    zoom90: 'Uma compacta com zoom dos anos 90. Zoom de 2×, avanço motorizado e data em laranja.', // ko: 90년대 자동 줌 카메라. 2배 줌, 모터 감기, 주황색 날짜 각인. · en: A 90s auto zoom compact. 2× zoom, motor wind, orange date imprint.
    mf645: 'Médio formato 6×4,5. 15 fotos por rolo, lente muito nítida e ampla gama tonal.', // ko: 6×4.5 중형 필름. 롤 하나에 15장, 아주 선명한 렌즈와 넓은 계조. · en: 6×4.5 medium format. 15 frames a roll, a very sharp lens and a long tonal range.
    pinhole: 'Uma caixa de madeira com um furo de alfinete no lugar da lente. Tudo suave, com cantos fundos e escuros.', // ko: 렌즈 대신 바늘구멍 하나로 찍는 나무 상자. 전체가 부드럽고 가장자리는 깊게 어두워요. · en: A wooden box with a pinhole instead of a lens. Soft all over, with deep, dark corners.
    flip03: 'A câmera de 0,3 MP do Motorola RAZR V3 de 2004. 640 px, cores desbotadas e detalhes borrados.', // ko: 2004년 모토로라 RAZR V3의 30만 화소 카메라. 640픽셀, 바랜 색, 뭉개진 디테일. · en: The 0.3 MP camera of the 2004 Motorola RAZR V3. 640 px, faded color, smeared detail.
    touch07: 'A câmera de 2 MP do primeiro iPhone (2007). Foco fixo, tons quentes e céus estourados.', // ko: 2007년 첫 아이폰의 200만 화소 카메라. 고정 초점, 따뜻한 톤, 하얗게 날아간 하늘. · en: The 2 MP camera of the first iPhone (2007). Fixed focus, warm tones, blown-out skies.
    curve07: 'A câmera de 2 MP do BlackBerry Curve de 2007. Balanço de branco frio, nitidez exagerada e ruído granulado.', // ko: 2007년 블랙베리 커브의 200만 화소 카메라. 차가운 화이트밸런스, 강한 샤픈, 자글자글한 노이즈. · en: The 2 MP camera of the 2007 BlackBerry Curve. Cool white balance, heavy sharpening, gritty noise.
    filter10: 'O iPhone 4 e os filtros dos apps de foto de 2010. Fotos quadradas, pretos lavados, realces amarelos e borda branca.', // ko: 2010년 아이폰 4와 사진 앱 필터 감성. 정사각 사진, 들뜬 검정, 노란 하이라이트, 하얀 테두리. · en: The iPhone 4 and the 2010 photo-app filters. Square shots, lifted blacks, yellow highlights, a white border.
  },
  /** Type word in the era line "1979 · SLR" (guide §3.3). The year and " · " are added by the app. */
  era: {
    SLR: 'Reflex',
    Disposable: 'Descartável',
    Instant: 'Instantânea',
    'Half-frame': 'Meio quadro',
    Compact: 'Compacta',
    '120 toy': 'Brinquedo 120',
    '4-lens': '4 lentes',
    'Multi-ex': 'Múltipla exposição',
    Panoramic: 'Panorâmica',
    Fisheye: 'Olho de peixe',
    Anamorphic: 'Anamórfica',
    Digicam: 'Digital',
    '2-bit': '2 bits',
    Rangefinder: 'Telemétrica',
    Waterproof: 'À prova d’água',
    Wide: 'Formato largo',
    TLR: 'Reflex de duas lentes',
    'Home movie': 'Filme caseiro',
    Slide: 'Slide',
    'Big flash': 'Flash potente',
    'Kids digicam': 'Digital infantil',
    Sprocket: 'Perfurações',
    'Floppy digicam': 'Digital de disquete',
    'Ultra-slim': 'Ultrafina',
    Superzoom: 'Superzoom',
    'Zoom compact': 'Compacta com zoom',
    'Medium format': 'Médio formato',
    Pinhole: 'Pinhole',
    'Flip phone': 'Celular flip',
    Smartphone: 'Smartphone',
    'Filter app': 'App de filtros',
    'QWERTY phone': 'Celular QWERTY',
  },
};

/** Film stock / sensor descriptions (expressive register). Film names stay in Latin letters. */
export const stockText: LocaleStockText = {
  sunny200: 'Amarelos quentes, cheios de sol. O filme clássico para viagens e para o dia a dia.', // ko: 햇살을 머금은 따뜻한 노랑. 여행과 일상 스냅의 정석. · en: Warm yellows full of sunshine. The classic film for travel and everyday snapshots.
  muse400: 'Tons de pele suaves e altas luzes pastel. Feito para retratos.', // ko: 부드러운 피부톤, 파스텔빛 하이라이트. 사람을 담기 좋은 인물용 필름. · en: Gentle skin tones and pastel highlights. Made for portraits.
  mint400: 'Um toque de verde nas sombras. O ar da cidade numa foto.', // ko: 그늘에 살짝 도는 초록빛. 도시와 거리의 공기. · en: A hint of green in the shadows. City air in a frame.
  snap800: 'Direto de uma descartável. Flash, vinheta forte e vazamentos de luz por feliz acaso.', // ko: 일회용 카메라, 그때 그 느낌. 플래시, 진한 비네팅, 우연이 만든 빛샘. · en: Straight out of a disposable. Flash, deep vignetting, and leaks by happy accident.
  mono400: 'Pretos profundos e granulação marcante. Um preto e branco sem rodeios.', // ko: 깊은 검정과 거친 입자의 흑백. 있는 그대로를 담는 다큐멘터리의 결. · en: Deep blacks and gritty grain. Black and white that tells it straight.
  insta600: 'Cores suavemente desbotadas numa moldura branca. O calor de uma foto instantânea.', // ko: 살짝 바랜 색과 하얀 테두리. 손에 쥐는 즉석 사진의 온기. · en: Softly faded color in a white frame. The warmth of an instant print.
  neon800t: 'Filme de cinema para luz de tungstênio. Um halo vermelho se abre em volta das luzes de neon.', // ko: 텅스텐 시네마 필름. 네온 불빛 둘레로 번지는 붉은 할레이션. · en: Tungsten cinema film. Red halation blooms around neon lights.
  velvet50: 'Saturação rica e contraste marcante. Um filme slide para paisagens.', // ko: 쨍한 채도와 높은 대비의 슬라이드 필름. 풍경을 위한 필름. · en: Rich saturation and bold contrast. A slide film for landscapes.
  chrome100: 'Tons de slide limpos e frios. Céus límpidos como vidro.', // ko: 맑고 차가운 슬라이드 톤. 투명하게 갠 하늘. · en: Clean, cool slide tones. Skies as clear as glass.
  silver100: 'Granulação fina e ampla gama tonal. Um preto e branco de nuances suaves e delicadas.', // ko: 고운 입자와 넓은 계조. 빛의 결이 섬세한 흑백. · en: Fine grain and a long tonal range. Black and white in quiet, subtle shades.
  dream160: 'Baixo contraste e tons pastel, leves como o ar.', // ko: 낮은 대비, 공기처럼 가벼운 파스텔. · en: Low contrast and pastels as light as air.
  expired98: 'Vencido em 1998. Véu magenta, poeira e uma surpresa em cada pose.', // ko: 1998년에 만료된 필름. 마젠타 포그와 먼지, 결과는 현상해 봐야 알아요. · en: Expired in 1998. Magenta fog, dust, and a surprise in every frame.
  xpro200: 'Filme slide em processo cruzado como negativo (C-41). Contraste duro, altas luzes verde-limão e sombras azul-petróleo.', // ko: 슬라이드 필름을 네거티브(C-41)로 교차현상. 강한 대비, 연둣빛 하이라이트, 청록빛 그림자. · en: Slide film cross-processed as negative (C-41). Hard contrast, lime highlights, teal shadows.
  instamini: 'Filme instantâneo mini, claro e vivo, com brancos limpos e um toque frio.', // ko: 밝고 산뜻한 미니 인스턴트. 깨끗한 화이트와 살짝 차가운 톤. · en: Bright, crisp mini instant film with clean whites and a cool touch.
  ccd: 'O CCD de uma digital do começo dos anos 2000. Altas luzes estouradas, tom azulado e franjas roxas.', // ko: 2000년대 초 디카의 CCD. 날아가는 하이라이트, 푸르스름한 톤, 보랏빛 번짐. · en: The CCD of an early-2000s digicam. Clipped highlights, a blue cast, purple fringing.
  pixel: 'Sensor de 128 pixels e 2 bits. Quatro cores e pontilhado.', // ko: 128픽셀 2비트 센서. 단 4가지 색과 디더링. · en: A 128-pixel, 2-bit sensor. Just four colors and dithering.
  aqua400: 'Filme descartável subaquático. Os vermelhos se apagam numa névoa verde-azulada, com granulação suave.', // ko: 물속 일회용 필름. 붉은빛이 바래 사라진 청록 톤, 뿌연 입자. · en: Underwater disposable film. Reds fade into a blue-green haze, with soft grain.
  instawide: 'Filme instantâneo largo. Cores naturais e altas luzes levemente quentes.', // ko: 와이드 인스턴트 필름. 자연스러운 색에 살짝 따뜻한 하이라이트. · en: Wide instant film. Natural color with gently warm highlights.
  reel40: 'Filme reversível de cinema caseiro. Cores quentes e saturadas, granulação grossa e janela empoeirada.', // ko: 홈무비 리버설 필름. 따뜻하고 진한 색, 굵은 입자, 먼지 앉은 게이트. · en: Home-movie reversal film. Warm, saturated color, big grain, and a dusty gate.
  toycmos: 'Sensor de brinquedo de 0,3 MP. Cores de bala, altas luzes estouradas e ruído de cor manchado.', // ko: 0.3메가 장난감 센서. 사탕 같은 색, 날아간 하이라이트, 얼룩덜룩한 색 노이즈. · en: A 0.3 MP toy sensor: candy colors, blown highlights, blotchy color noise.
  vga98: 'Sensor de uma digital de disquete do fim dos anos 90. Pouca latitude, tom frio e JPEG borrado.', // ko: 90년대 말 플로피 디카의 센서. 좁은 계조, 차가운 톤, 뭉개진 JPEG. · en: A late-90s floppy-disk sensor. Short tonal range, a cool cast, soft JPEG blur.
  ccd7: 'CCD de 7 MP de meados dos anos 2000. Cores vivas, pele quente, nitidez exagerada e altas luzes que estouram fácil.', // ko: 2000년대 중반 700만 화소 CCD. 쨍한 색, 따뜻한 피부, 과한 샤프닝, 확 날아가는 하이라이트. · en: A mid-2000s 7 MP CCD. Punchy color, warm skin, crunchy sharpening, hard-clipped highlights.
  vgaphone: 'Sensor dos primeiros celulares com câmera. Cores lavadas, tom verde-amarelado e sombras com ruído.', // ko: 초기 폰카 센서. 바랜 색, 누르스름한 초록빛, 자글자글한 그림자. · en: An early camera-phone sensor. Washed out, a green-yellow cast, noisy shadows.
  phone2mp: 'Sensor dos primeiros smartphones. Balanço de branco quente, céus estourados e detalhes suaves.', // ko: 1세대 스마트폰 센서. 따뜻한 화이트밸런스, 날아간 하늘, 부드러운 디테일. · en: A first-generation smartphone sensor. Warm white balance, blown skies, soft detail.
  bbcurve: 'Sensor de um celular com teclado QWERTY. Tons azulados, bordas com nitidez exagerada e ruído grosso nas sombras.', // ko: 쿼티폰 센서. 푸르스름한 톤, 과한 샤픈, 거친 그림자 노이즈. · en: A QWERTY-phone sensor. Bluish tones, over-sharpened edges, coarse shadow noise.
  app10: 'Filtro de app de fotos do início dos anos 2010. Pretos foscos, altas luzes amarelas e vinheta forte.', // ko: 2010년대 초 사진 앱 필터. 들뜬 검정, 노란 하이라이트, 진한 비네팅. · en: An early-2010s photo-app filter. Matte blacks, yellow highlights, a heavy vignette.
};
