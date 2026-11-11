# かんじ ずかん(試作)

漢字を「文字」ではなく「形と部位の組み合わせ」で覚えるための学習アプリの試作です。
小学1年(80字)と2年(160字)の240字を収録しています。
横向きタブレットを基準にしています。データは端末内(localStorage)にだけ保存します。

## 使い方

```
npm install
npm run dev        # 開発サーバー(このPCだけ)
npm run dev:lan    # 開発サーバー(同じWi-FiのiPadなどから開ける。ポート5190)
npm run test       # ユニット・コンポーネントテスト
npm run coverage   # カバレッジつき
npm run e2e        # Playwright(初回は npx playwright install chromium)
npm run build      # 本番ビルド(dist/)
```

## データの作り方

漢字・部位・説明・音声は、手で書いた一覧からスクリプトで作ります。`src/data/generated/` と
`src/data/narration.json`、`src/assets/kanjivg/strokes.json` は生成物なので、直接は編集しません。

| 手で書くもの | 中身 |
|---|---|
| `scripts/kanji-list.mjs` | 収録する漢字(学年別) |
| `scripts/kanji-source.mjs` | 漢字の読みと絵、くみあわせの分け方、部位の名前と絵、手書きの成り立ち説明 |

```
node scripts/fetch-kanjivg.mjs <フォルダ>   # KanjiVG の SVG を取得
node scripts/build-data.mjs <フォルダ>      # 漢字・部位・説明のデータを生成
npm run voice                               # 説明などの音声を生成(下記)
```

- `COMPOUNDS` に書いた漢字は「くみあわせ」(固定の部位+4択)、書いていない漢字は「なりたち」(絵→漢字)で学びます。
- くみあわせは「何画目がどの部位か」を KanjiVG の画番号で指定します。
- 成り立ちの説明は、`NARRATION_OVERRIDES` に書いた字はその文、ほかは「AとBで、C」の形で自動生成します。

## 音声

読み・お題・成り立ちの説明は、[AivisSpeech](https://aivis-project.com/) で事前に作った音声(`public/voice/*.mp3`)を再生します。
音声がないクリップは、ブラウザの読み上げ機能で代わりに読みます。

```
npm run voice                    # まだない音声だけ作る(AivisSpeech を起動しておく。ffmpeg が必要)
npm run voice -- --force         # 全部作りなおす
npm run voice -- <スタイルID>    # 声を変える
```

外部に公開する場合は、使った音声モデルの利用規約を確認してください。

## ライセンス

漢字の画データは [KanjiVG](https://kanjivg.tagaini.net)(© Ulrich Apel, CC BY-SA 3.0)を加工して使っています。
詳細は `src/assets/kanjivg/LICENSE.md` を見てください。
