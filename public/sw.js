/*
 * 漢字クエストの サービスワーカー。電波がなくても あそべるようにする。
 * - アプリ本体(画面・絵・データ)は、入れたときに まとめて保存する
 * - 音声(約18MB)は、あとから少しずつ保存する(ページから 'cache-voice' を受けとったとき)
 * - 保存するファイルの一覧(precache.json)は、npm run build が作る
 */
const SHELL_PREFIX = 'kq-shell-'
const VOICE_PREFIX = 'kq-voice-'
const RUNTIME_CACHE = 'kq-runtime'
const LIST_URL = './precache.json'

async function loadList() {
  const response = await fetch(LIST_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error(`precache.json を読めません: ${response.status}`)
  return response.json()
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const list = await loadList()
      const cache = await caches.open(SHELL_PREFIX + list.version)
      await cache.addAll(list.shell)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const list = await loadList().catch(() => null)
      if (list) {
        // 前の版の保存を消す(音声は、音声の版が同じなら残す)
        const keep = new Set([SHELL_PREFIX + list.version, VOICE_PREFIX + list.voiceVersion, RUNTIME_CACHE])
        const names = await caches.keys()
        await Promise.all(names.filter((name) => name.startsWith('kq-') && !keep.has(name)).map((name) => caches.delete(name)))
      }
      await self.clients.claim()
    })(),
  )
})

async function cacheVoice() {
  const list = await loadList()
  const cache = await caches.open(VOICE_PREFIX + list.voiceVersion)
  for (const url of list.voice) {
    if (await cache.match(url, { ignoreVary: true })) continue
    try {
      await cache.add(url)
    } catch {
      // とちゅうで電波が切れたときは、次に開いたときに続きから保存する
      return
    }
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'cache-voice') event.waitUntil(cacheVoice())
})

/** 文字(Google Fonts)は べつの場所から読むので、一度読んだら保存しておく */
const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com'])

async function fromCacheOrNetwork(request) {
  // サーバーが Vary(Origin など)をつけて返すと、保存したものと合わなくなるので、Vary は見ない
  const cached = await caches.match(request, { ignoreSearch: !FONT_HOSTS.has(new URL(request.url).hostname), ignoreVary: true })
  if (cached) return cached
  const response = await fetch(request)
  // 文字のファイルは中身が見えない形(opaque)で返るので、それも保存する
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(RUNTIME_CACHE)
    await cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (FONT_HOSTS.has(url.hostname)) {
    event.respondWith(fromCacheOrNetwork(request))
    return
  }
  if (url.origin !== self.location.origin) return

  // 画面(index.html)は、つながるときは新しいものを、つながらないときは保存したものを使う
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(request, { ignoreSearch: true, ignoreVary: true })) ?? (await caches.match('./', { ignoreVary: true })) ?? Response.error()),
    )
    return
  }

  // ほかのファイルは、保存してあれば それを使う。なければ取りに行き、取れたら保存しておく
  event.respondWith(fromCacheOrNetwork(request))
})
