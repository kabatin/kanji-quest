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

## あそびの しくみ

| もの | 中身 |
|---|---|
| ホーム | 空にうかぶ しま(Three.js)。漢字を1字おぼえるたびに森が1段階 育つ。メニューは「あそぶ(ぼうけん・チャレンジ)」と「あつめる(ずかん・パーツ・きせかえ)」に分かれる |
| ぼうけん | 学年ごとに、5字で1ステージ・8ステージで1エリア。ステージごとに ボス がいる |
| ボス | えらぶ5問(つくり・ぜんぶの部位・なりたちの話・絵)+ 見本を見て書く5問 + 見本なしで書く5問。全部まちがえずに できて 100点になると たおせる。書き順のまちがいも まちがいに数える。ちょうせん は1日3回(れんしゅう は何回でも) |
| そつぎょうしけん | 学年の漢字を全部学び、ボスを全部たおすと ちょうせん できる。学年の漢字から 20問。1日2回 |
| すみまる | レベルで 8つの すがた に変わる(`src/lib/level.ts` の `MASCOT_FORMS`) |
| きせかえ | ぼうし・しまの かざり・そら・カード。コインで買い、高いものは必要なレベルもある(`src/lib/shop.ts`) |

経験値・コイン・ねだんは、6年生まで(1026字)続けたときの合計から決めています。考え方は
`src/lib/level.ts`、`src/lib/rewards.ts`、`src/lib/shop.ts` の先頭のコメントにあります。

ホームの 3D は `src/features/home/scene/` にあります。3D が使えない端末では、絵(SVG)の森が代わりに出ます。

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

- `COMPOUNDS` に書いた漢字は、学習の中に「くみあわせ」(固定の部位+4択)が入ります。
- くみあわせは「何画目がどの部位か」を KanjiVG の画番号で指定します。

### 成り立ちの物語

| ファイル | 中身 |
|---|---|
| `scripts/stories/*.json` | 漢字ごとの物語。`caption`(画面の文)、`speech`(音声の文)、`kind`(naritachi = 字源にもとづく / oboekata = 形からの覚え方)、`actors`(アニメーションに出る絵と動き)、`source`(参考にしたURL)、`note`(諸説などの補足) |
| `scripts/stories-markup/*.json` | 物語の文に `{漢字|よみ}` の印を付けたもの |

- 物語のアニメーションは、`actors` の絵を「その部位がある場所」に置き、`motion`(もたれる・落ちる・入る など)で動かしてから、筆画に変えます。
- `{漢字|よみ}` の印は「その漢字を覚えていれば漢字、まだなら読みを表示する」ためのものです。画面の文言でも同じ書き方が使えます(`src/components/KText.tsx`)。
- 物語がない・形が合わない字は、`NARRATION_OVERRIDES` か「AとBで、C」の自動文で代用し、生成時に一覧が出ます。
- 物語を直したら `build-data.mjs` を実行し、音声も作りなおします(`public/voice/explain-*.mp3` を消してから `npm run voice`)。

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
