# なりたちの場面の作り方

漢字1字ごとに、「絵が そのまま 字になる」アニメーション(場面)を1つ作ります。
見本は「休」: `src/features/story/scenes/k4f11.tsx`。まず これを さいごまで読んでください。

## 何のために作るか

読み書きが苦手でも、形を見て考えるのが得意な子が、**絵と物語から 漢字の形と意味を おぼえる** ためのものです。
子ども(小学1〜2年)が見て「あ、だから この形なんだ」と思えることが、いちばん大事です。

## いちばん大事な きまり(この順に 守る)

1. **現実のものとして 正しい形で描く。** 字の形に合わせるために、人や物を ゆがめない。
   - 人: うで は かた から出て、ひじ で まがる。くび は みじかく、どう の まんなか の上。あし は こし から。左右の うで・あし が ある。
   - 物・生きもの: 本来の つくり を守る(鳥の はね は せなか から、木の えだ は みき から、など)。
   - 形が おかしいと、子どもは そちらに気を取られて、字を おぼえられません。
2. **お話として わかる。** 何が・どうして・どうなったか が、文を読まなくても 絵の動きで 伝わる。
   - **主役を 1人(1ぴき)きめる。** 人・子ども・生きもの が出てくると、子どもは 目で追います(「雨」なら 暑くて ぐったりした カエル、「森」なら どんぐりを うめる りす)。
     物だけが 出て 動く場面(山が せりあがるだけ、雲が あつまるだけ)は、話に なりません。
   - **気持ちの 変化を 入れる。** こまっている → できごと → うれしい、のように。顔と しぐさ で見せる。
   - **できごと に わけ を つける。** 「木が ふえる」なら、どんぐりが おちて 芽が出るから。ひとりでに 起きたように 見せない。
   - なりたちの文が 人の話(おそわる・はたらく など)なら、その人たちを ちゃんと出す(先生と 子ども、など)。
3. **さいごに、絵が 字の形と重なる。** 重なるのは、自然な動きの けっか としての さいごの しゅんかん だけでよい
   (「休」では、人が 目をさまして のびを した しゅんかん に、うで が 1画目に重なる)。
4. **字が ただしく書ける。** さいごに `<Ink>` で、ぜんぶの画を 書き順どおりに書く。

1 と 3 が ぶつかったら、**1 を えらぶ**。字と ぴったり重ならなくても、だいたい同じ場所・同じ向き なら十分です。

## 場面の ながれ(だいたい この順)

| | 中身 | めやす |
|---|---|---|
| はじまり | 場所が できる(木が そだつ、山が せりあがる など)。いきなり 全部 出さない | 0〜1秒 |
| おはなし | 主役が 動いて、字の意味になる できごと が起きる。気持ち(つかれた・うれしい)も 顔や しぐさ で | 3〜5秒 |
| 字になる | 絵が 字の形に そろう → ほね が白く ひかる → 絵が うすくなり、画が 書き順どおりに書かれる | 2.5秒ほど |
| できあがり | 字が 部位の色に そまって、きらきら。絵は うしろに うっすら のこす | 1秒弱 |

- 長さは **6〜12秒**(見本は 9秒)。画が多い字は「字になる」を 少し長く。
- 小さな にぎやかし(鳥・雲・おちる葉・汗・「ふう」など)を 2〜3こ 入れると、絵が 生きます。入れすぎて 主役が うもれないように。
- 字の 画の線の すぐ よこに、にた向きの 線(山はだ の すじ など)を 描かない。字の 画が 何本か、わからなくなります。

## 作り方

場面は、**時間 t(秒)を わたすと、その しゅんかん の絵(SVG)を返す関数** です。同じ t なら いつも同じ絵になります。
`useState`・`useEffect`・タイマー・乱数(`Math.random`)・CSS アニメーション・`motion` は **使いません**。動きは ぜんぶ t から計算します。

```tsx
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'

const CHAR = '山'
const INK = 5.6   // 字になり はじめる
const DONE = 8.2  // できあがり
const DURATION = 9

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3 /* 画数 */)
  return (
    <>
      <Layer opacity={ink.picture}>{/* 絵 ぜんぶ。字になるとき、まとめて うすくなる */}</Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: '…', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '山 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
```

(`import` の `../` の数は、ファイルの場所で変わります。`scenes/` なら `../sceneKit`、`trials/<なまえ>/` なら `../../sceneKit`。)

### 座標

- 絵は 漢字と同じ **109 x 109** の わく に描く(左上が 0,0。右へ x、下へ y)。わく の外は 見えません。
- 画の線の場所は `node scripts/scene-info.mjs 山` で出ます(はじまり・おわり・通り道の点・線の式)。
- 地面は だいたい y = 96〜99。字の画の いちばん下より 少し下に。

### 道具(`sceneKit.ts`)

| | |
|---|---|
| `span(t, from, to, ease?)` | from〜to の間を どこまで進んだか(0〜1) |
| `mix(t, from, to, a, b, ease?)` | from〜to の間に a から b へ変わる値 |
| `during(t, from, to, fade?)` | from で あらわれ、to で きえる(0→1→0) |
| `wave(t, period, phase?)` | くり返す ゆれ(-1〜1)。息・風・はばたき に |
| `easeOut` `easeIn` `easeInOut` `backOut` | 動きの かんきゅう。`backOut` は ぽん と出る |
| `inkTiming(t, from, to, 画数)` | 「字になる」の きまった流れ。`picture`(絵の こさ)`progress`(書けた度合い)`tint`(色)`sparkle` |

### 部品(`sceneParts.tsx`)

| | |
|---|---|
| `<Layer x y rotate scale scaleX scaleY origin opacity>` | 絵の まとまり を うごかす。`origin` が 回転・拡大の じく(足もと・かた など) |
| `<Bone char n color width from? to?>` | 画の線を そのまま 絵の しん にする(木の みき・えだ・山の りょうせん など、**本来 その形のもの** に使う) |
| `<BoneGlow char opacity>` | 「ここが 字になるよ」の あいず。ほね を 白く ひからせる |
| `<Ink char progress tint>` | 字を 書き順どおりに書く。**かならず 入れる** |
| `<Sparkles cx cy progress>` | できあがりの きらきら |

`Bone` を 人の うで や あし に使うと、体が ゆがみます(見本も はじめ そうして、直しました)。
人は 下の **共通部品 `Person`** で描きます(自分で うで・あし を つないで描かない)。

## 共通部品(`sceneFigures/`)

人・あるき・はしり・すわり・背景(昼・夕方・夜・へや)・天気・水・火・地面・小さな 生きもの・気持ち の しるし・色 を、どの字でも 同じ 部品で描きます。
絵がら が そろい、体の まちがい を 部品の中で ふせげて、1字の コードも 半分ほどに なります。

```tsx
import { Backdrop, Bird, Chair, LOOKS, mixLimb, PALETTE, Person, personRig, posture, run, runDepth, Sweat, Tree, turnAround, walk, walkDepth } from '../sceneFigures'
// (trials/<なまえ>/ からは '../../sceneFigures')
```

見本 の 一覧(`node scripts/scene-sheet.mjs --variant parts --big 人 後 走 夜 顔 手`。ページ は `?scene=後&variant=parts` など):

| 字 | ファイル | 中身 |
|---|---|---|
| 人 | `trials/parts/k4eba.tsx` | 子ども・おとな の 3つの 向き、あるき、手を とどかせる、こしかける・おじぎ・ひざまずく、背景・生きもの・しるし |
| 後 | `trials/parts/k5f8c.tsx` | うしろすがた(かみがた 6つ・うで)、ふりむき(正面→横→うしろ)、おくへ あるく・てまえへ くる、体格 5つ |
| 走 | `trials/parts/k8d70.tsx` | はしる、いすに すわる(横・正面・うしろ)、足を のばす・正座・しゃがむ、物を もつ・はこぶ、ねころぶ |
| 夜 | `trials/parts/k591c.tsx` | 昼→夕方→夜、へや(昼・夜)、雨・雪・風・くもり、池・川・道・田畑・岩、かご・バケツ・はこ、たき火 |
| 顔 | `trials/parts/k9854.tsx` | 足した 顔 5つ(正面・横)、目線 の 上下、ぼうし 4つ と めがね(3つの 向き)、ランドセル・リュック(体格 4つ が ふりむく・あるく)、かみ の ゆれ、「?」 |
| 手 | `trials/parts/k624b.tsx` | 正面 で ひくい つくえ に ふで で 書く・手 を とる(広間・たたみ)、さし出す、道具(えんぴつ・ぼう)、てまえ・おく へ はしる と ゴール の テープ、海 と 砂はま・足あと・山 |

部品で 書きなおした 例: `scenes/k4f11.tsx`(休)・`scenes/k6751.tsx`(村)・`scenes/k5148.tsx`(先)・`scenes/k5b66.tsx`(学)。

### きまり(かならず 守る)

1. **人は かならず `<Person>` で描く。** 自分で あたま・どう・うで を 描かない。うしろすがた も `facing="back"` で描く。足りない ものは 場面で 描きたさず、部品に 足す(下の「部品が 足りないとき」)。
2. **あるく ときは かならず `walk()`(横)か `walkDepth()`(おく・てまえ)、はしる ときは `run()`(横)か `runDepth()`(おく・てまえ)を使う。** `Math.sin(t * …)` で 足を ふらない(足が すべり、うしろ あるき に なる)。
3. **向きを かえる ときは `turnAround()`。** `<Layer scaleX={-1}>` で 人を うらがえさない(てまえ と むこう の 手足 が 入れかわり、手の 位置の 計算も くるう)。
4. **1人の 人は、JSX の 1か所 だけで 描く。** 時間で 描く場所を かえると、とちゅうで 物の うしろへ すりぬけます。前後は「足もと の y」で きまる(`ByDepth`)。
5. 字の 画に 手を 重ねたい ときは、手先を 点で 指定する(`{ to: [x, y] }`)。うで の 長さ は かえない。とどかなければ、のばした うで が その むき を さします(「だいたい 同じ 場所・同じ 向き」で よい)。
6. **すわる・しゃがむ・ひざまずく は `posture(名前, 向き)`、いす は `<Chair>` に 人と 同じ props。** 角度を 自分で 合わせない(正面・うしろ では 関節の 角度 が 横むき と ちがう)。
7. 色は `PALETTE`・`CLOTHES`・`LOOKS` から えらぶ。夕方・夜 に かわる 色は `byTime`。新しい 色が いるときだけ、場面の 上で 定数に する。

### 人(`Person`)

```tsx
<Person
  x={40} y={96}                 // x = こし(体の まんなか)、y = 地面。いちばん下の 足が y に つく
  build="child" height={44}      // 体格(下の 表)。height は 立った ときの 背の高さ(省くと 体格ごとの 高さ)
  facing="right"                 // 'left' | 'right' | 'front' | 'back'(うしろすがた)
  look={LOOKS.girl}              // 見た目。{ ...LOOKS.boy, top: CLOTHES.red.top } で 色がえ
  face="smile"                   // 下の 表(うしろむき では 見えない)
  gaze={0.5} gazeY={1}           // 目線: gaze は 左右(-1 〜 1。正面 だけ)、gazeY は 上下(-1 = 上 〜 1 = 下。下 を 見ると まぶた が さがる)
  pose={{ rightArm: { to: [60, 50] }, leftArm: { swing: 40, bend: 30 }, torso: 10, head: -8 }}
  lean={0} lift={0}              // 体ぜんたい の かたむき(足もと が じく)・ジャンプ の 高さ
  held={<Basket x={…} y={…} />}  // 手に もつ 物(下の「物を もつ」)
  pack="randoseru"               // せおう かばん: 'randoseru' | 'rucksack'(色 を かえる なら { kind: 'rucksack', color: '#4f9be0' })
  tools={{ right: { kind: 'brush', tip: [x, y] } }}  // 手 に にぎる 道具(下の「道具」)
  hairSway={wave(t, 0.36) * 14}  // ポニーテール・ふたつむすび の ゆれ(度)。はしる・ふりむく ときに
/>
```

| build | 頭身 | 背(省いたとき) | だれ |
|---|---|---|---|
| `toddler` | 3 | 32 | 幼児(うで が みじかく、手は こし まで)。`LOOKS.baby` |
| `child` | 3.4 | 44 | 小学生(低学年) |
| `teen` | 3.85 | 51 | 高学年〜中学生。`LOOKS.student`・`LOOKS.studentGirl` |
| `adult` | 4.3 | 58 | おとな |
| `elder` | 4.3 | 54 | おとしより。横むき で せなか が まるい(上体が まえへ、顔は まえ)。`LOOKS.elder`・`LOOKS.grandma`(白い おだんご) |

かみがた(`look.hairStyle`)は `short` `bob` `ponytail` `pigtails` `bald` `bun`(おだんご)。どれも 横・正面・うしろ が そろっている。

顔(`face`。正面 と 横。うしろむき では 見えない):

| face | 顔 |
|---|---|
| `normal` `smile` `joy` | ふつう・にっこり・大よろこび(口 を あける) |
| `surprised` `sad` `closed` | びっくり・かなしい・目 を とじる(ねむる) |
| `worried` | こまった(まゆ が ハの字、口 は への字) |
| `angry` | おこった(まゆ が 内がわ で 下がる、いかり の しるし) |
| `cry` | なく(目 を ぎゅっと とじて なみだ、口 を あける) |
| `sleepy` | ねむい(まぶた が 半分、小さな あくび) |
| `strain` | ぐっと 力 を 入れる(目 は > <、歯 を くいしばる) |

ぼうし・めがね(`look` で えらぶ。横・正面・うしろ の 3つの 形 が ある。ぼうし は かみ の 上、めがね は 目 の まえ):
`{ ...LOOKS.boy, hat: 'cap' }`(野球ぼう)・`'school'`(黄色い 通学ぼう)・`'straw'`(むぎわら)・`'knit'`(ニット)、色 は `hatColor`。めがね は `glasses: true`。

- **ポーズ** は 手足 ごと(`leftArm` `rightArm` `leftLeg` `rightLeg`)に、どれか 1つ で 指定する:
  - 角度 `{ swing, bend }` … `swing` = つけね(かた・こし)が「ま下 から 何度」。横むき は + が まえ、正面・うしろむき は + が 外。`bend` = ひじ・ひざ の まがり。
  - 正面・うしろむき の まえうしろ `{ swing, bend, fore, foreBend }` … `fore` = つけね を まえ(+)・うしろ(-)へ、`foreBend` = ひじ は まえ、ひざ は うしろ へ まがる。まえうしろ に むいた ほね は 短く 見え、見る人に 近い ほど 画面の 下(少し 上から 見ている)。**横むき では fore は つかわれない**(まえうしろ は swing で 書く)。
  - 点 `{ to: [x, y] }` … 手先(足先)を 画面の その点へ。ひじ・ひざ の 場所は 部品が 計算する(正面・うしろむき では 左右 の 面 の 中 だけ で とどかせる)。
  - まえ の 点 `{ to: [x, y], depth }` … 正面・うしろむき で、手 を 体 の まえ へ のばす(つくえ で 書く・相手 の 手 を とる・物 を さし出す)。`depth` は 体 から まえ へ の きょり(画面の 単位。うしろ は マイナス)。手 は 画面 の (x, y) に のり、うで は まえ へ むいた ぶん 短く 見え、ひじ は 外・下 へ 出る。体 の まえ を よこぎって 反対 がわ へ も とどく。相手 の 手 に とどかせる ときは、相手 の `personRig(…).world.arms.right.end` と、相手 の 手 の おくゆき(`world.arms.right.depth * scale`)を わたす。
  - まぜる `mixLimb(a, b, k)` … a から b へ(k = 0〜1)。関節の 角度で まぜるので、うで は 弧を えがく。ポーズ ぜんたい なら `mixPose(a, b, k)`。
  - `torso`(上体の かたむき。横むき は + が おじぎ)、`head`(横むき は + が うつむく、- が 見上げる)。
  - 何も 書かない 手足 は、たらした うで・まっすぐ の 足。
- **左右 は 人の 体の 左右**(画面の 左右 では ない)。横むき で 見えている(てまえ の)がわ は:

  | facing | てまえ | むこう |
  |---|---|---|
  | `right` | 左の 手足 | 右の 手足 |
  | `left` | 右の 手足 | 左の 手足 |
  | `front` | 右手 は 画面の 左、左手 は 画面の 右 | |
  | `back` | 右手 は 画面の 右、左手 は 画面の 左 | |

  どちらの 手を 動かしても、描く じゅんばん は 部品が きめる:
  横むき は むこうの うで → むこうの 足 → てまえの 足 → どう → あたま → てまえの うで。
  正面・うしろむき は 足 → どう → あたま → うで で、まえうしろ の 角度 で 入れかわる:
  正面 で うしろへ ふった うで、**うしろむき で 体の まえ へ のばした うで(手が 体の 内がわ に 来た うで も)は どう の おく に かくれる**。
  うしろむき で「うしろで 手を くむ」ように 見せたい ときは、`fore` を マイナス に する(`{ swing: 14, bend: -70, fore: -25 }`)。すわって ひざ が 見る人の ほうへ 出た あし は どう の てまえ。
- 部品が 守ること: くび は みじかく どう の 上の まんなか、うで は かた から、ひじ は まえ に しか まがらない、ひざ は うしろ に しか まがらない、関節は うごく はんい の外へ まがらない。
- 手に 物を もたせる・顔の よこに しるし を出す: `personRig(同じ props)` で 関節の 画面の 場所が わかる。
  `const rig = personRig(props)` → `rig.world.arms.right.end`(右手)、`rig.world.head`(あたまの まんなか)、`rig.body.headR * rig.scale`(あたまの 半径)。
- ぼうし・はねた かみ など あたまに つける もの: `headwear={…}`(あたまの まんなか が 0,0、半径 1。横むき は 右むき の 形で描く)。ふつう の ぼうし・めがね は `look.hat`・`look.glasses` で よい。

### せおう かばん(`pack`)・道具(`tools`)

- `pack="randoseru"`(ランドセル)・`"rucksack"`(リュック)。大きさ は 体格 に 合い、体 と いっしょ に かたむき・ふりむき の ちぢみ が つく(`turnAround` の とちゅう でも ずれない)。
  前後 は 部品 が きめる: 横むき は せなか がわ(むこう の うで は かばん の おく、てまえ の うで は まえ、かたひも は かた を こえて むね の まえ へ)。
  正面 は かたひも だけ。うしろむき は せなか に かさなり、たらした うで は かばん の おく(かばん が うで の 内がわ に かかる)、見る人 の ほう へ 大きく ふった うで だけ かばん の まえ。
- `tools={{ right: { kind, tip } }}` … 手 に 細い 道具 を にぎる(`kind` は `'brush'` ふで・`'pencil'` えんぴつ・`'stick'` ぼう)。`tip` は 先 の 画面 の 点(おしり は 手 の うしろ に 出る)。
  `tip` の かわり に `angle`(画面 の 角度。0 = 右、90 = 下)と `length`。ふで の 毛 の 色 は `ink`。道具 は うで と いっしょ に 描かれ(うで が 体 の おく なら 道具 も かくれる)、こぶし の 中 を 通って おや指 で おさえる。
  書く ときは うで を `{ to: 先 の 少し 上, depth }` に、道具 の `tip` を 紙 の 上 の 点 に する(`trials/parts/k624b.tsx` の「かく」)。手 に もたない 道具 は `<Tool kind end tip width? ink? />`。
- **2人 と 物 を かさねる**: `held` には 人 も わたせる。先生 が 子ども の 手 を とる ときは、つくえ を 子ども の `held` に、子ども を 先生 の `held` に わたすと、先生 の 体 → 子ども の 体 → つくえ → 子ども の うで → 先生 の うで の じゅん に なる。

### かっこう(`posture`)・物を もつ(`holdPose`)・ねころぶ(`lieDown`)

```tsx
const kid = { x: 40, y: 96, facing: 'front', pose: posture('sitChair', 'front') } as const
<Chair {...kid} />                  // いす は 人と 同じ props で、体に 合わせて 置かれる
<Person {...kid} look={LOOKS.girl} />
<Chair {...kid} layer="front" />    // うしろむき の せもたれ(人の てまえ)。ほかの 向き では 何も 描かない
<Desk x={56} y={96} width={18} height={deskHeight('child')} top={3} />   // 正面・うしろ から 見る つくえ は top で 上の 面 を 見せる
```

- `posture(名前, 向き)`: `'stand'` `'sitChair'`(いす)`'sitFloor'`(地べた に 足を のばす)`'seiza'`(正座)`'kneel'`(ひざまずく)`'squat'`(しゃがむ)`'bow'`(おじぎ)`'banzai'` `'wave'`。
  うで だけ かえる なら `{ ...posture('squat', 'right'), rightArm: { to: [50, 90] } }`。すわる 高さ は 部品が 合わせる(いす の ざめん は `seatHeight(体格, 背)`、つくえ は `deskHeight(体格, 背)`)。
- `holdPose(置き場所, 'chest' | 'waist' | 'overhead' | 'offer', 物の はば)` → `{ at, pose }`。`'offer'` は 両手 を まえ へ のばして さし出す(正面・うしろむき は `depth` つき の うで)。物は `at` を まんなか に 描いて `held` に わたす:
  ```tsx
  const hold = holdPose(place, 'chest', 12)
  <Person {...place} pose={{ ...place.pose, ...hold.pose }} held={<Basket x={hold.at[0]} y={hold.at[1]} width={12} />} />
  ```
  `held` の 物は、横むき では てまえ の 手 と むこう の 手 の あいだ、正面 では どう と うで の あいだ、うしろむき では 体の むこう(見えない)に 描かれる。あるきながら もつ ときは `walk` の pose に かさねる(`{ ...w.pose, ...hold.pose }`、`armSwing` は 小さく)。
- `lieDown({ x, y, headTo })`: あおむけ に ねる(x は こし)。`<Person {...lieDown({ x: 50, y: 96, headTo: 'left' })} face="closed" />`。

### あるき(`walk`・`walkDepth`)・はしり(`run`)・ふりむき(`turnAround`)

```tsx
const w = walk(t, { from: -20, to: 40, start: 0.8, end: 2.6, build: 'child', height: 44 })
<Person {...w} y={96} face="sad" />                                  // 場所・向き・ポーズ が 入っている
<Person {...w} y={96} pose={{ ...w.pose, rightArm: { to: cup } }} /> // うで だけ かえる

const away = walkDepth(t, { from: [54, 106], to: [54, 86], start: 1, end: 3, height: 52, toHeight: 34 })
<Person {...away} />                                                 // おくへ(うしろすがた)。y・背の高さ も 入っている

const r = run(t, { from: 6, to: 100, start: 0.5, end: 2.8, height: 42 })
<Person {...r} y={96} face="joy" />                                  // はしる(lift で うく)

const come = runDepth(t, { from: [54, 74], to: [54, 102], start: 1, end: 2.4, height: 24, toHeight: 52 })
<Person {...come} face="strain" />                                   // てまえ へ はしってくる(正面)。y・背の高さ・lift も 入っている
```

- 「どこから どこへ 何秒で」だけ わたす。足あと を 先に きめるので、地面の 足は すべらず、うく 足は かならず 進む むき へ 出る。うで は 同じ がわ の 足と はんたい に ふる。
- `walk`: 1歩目 と さいごの 1歩 は 半歩(立った ところから あるきだし、足を そろえて 止まる)。歩幅 は `step`(省くと 背 × 0.3)。いそぐ なら `step: height * 0.42`、とぼとぼ なら `armSwing: 10`。
- `walkDepth`: 足もと の 点 `[x, y]` を わたす。y が 小さく なる(画面の 上へ)なら うしろすがた で おくへ、大きく なるなら 正面 で てまえへ。`toHeight` で とおく の 大きさ。**横に 大きく ずれる 道 には 使わない**(ななめ は `walk` と `turnAround` を つなぐ)。道は `<Path near={[x, y, はば]} far={[x, y, はば]} />` で おくへ ほそく。
- `run`: 横むき。はじめ は だんだん はやく、おわり は おそく なって 足を そろえて 止まる。2本とも うく しゅんかん が ある(`lift`)。歩幅 は `stride`(省くと 背 × 0.62)。
- `runDepth`: `run` の おくゆき 版(`walkDepth` と 同じ わたし方)。地面 の 足 は 足あと の 点 に とまり、とぶ しゅんかん は こし の 下 の 地面 から うく。正面 で まえ へ 出した ひざ は どう の てまえ、まえ へ ふった 手 は むね の まえ。**横に 大きく ずれる 道 には 使わない**。
- 足あと を のこす: `walkPrints(walk の plan)`・`runPrints(run の plan)` → `[{ x, at, side, facing }]`(くつ の まんなか の x と、足 が つく 時刻)。`<Footprint x={p.x} y={地面} facing={p.facing} grow={span(t, p.at, p.at + 0.25)} />` と おけば 絵 の 足 と かさなる。
- `start` より前 は `from` に、`end` より後 は `to` に 立っている。止まった あとの ポーズ は 場面で つづけて 書く。
- ふりむく: `<Person {...w} {...turnAround(t, 2.7, 'right', 'left')} … />`(0.3 秒で 体が 細くなって 入れかわる)。
  正面 から うしろ へ は、横を 通す: `turnAround(t, 2.7, 'front', 'back', 0.3, 'right')`(0.3 秒 ずつ、正面 → 右むき → うしろ)。

### 背景(昼・夕方・夜・くもり・へや)

| 部品 | |
|---|---|
| `<Backdrop t sun? clouds? tufts? ground? time? moon? moonPhase? overcast?>` | いつもの 背景 ひとそろい(お日さま・おか・雲・のはら・草)。`time` 0 = 昼(「休」と 同じ)、1 = 夕方、2 = 夜(とちゅう も よい: `time={mix(t, 2, 4, 0, 2)}` で だんだん くれる)。夕方 は `sun` を ひくく(`[90, 72]` など)おくと しずむ。夜 は 月(`moon`、`moonPhase="crescent"` で 三日月)と 星。`overcast={1}` で くもり(雨・雪 の 日) |
| `<Sky time>` `<Moon x y r? phase? show?>` `<Stars t show? at?>` | 空・月・星 を 1つずつ |
| `<Room floor? time? window? curtain?>` `<Window x y width height time? curtain?>` | へや(かべ・ゆか・はばき・まど)。`floor` は かべ と ゆか の さかい。夜 は かべ が あかり の 色、まど の 外 が 夜。Backdrop の かわりに いちばん 下 |
| `<Chair {...人と同じprops} layer?>` `<Desk x y width height top?>` `<Blackboard x y width height lines?>` | いす・つくえ・こくばん |
| `<LowTable x y width? height? top? paper?>` | ひくい つくえ(ざたく)。正座 の 人 の まえ。上 の 面 は `y - height - top` 〜 `y - height`、`paper` で 紙 を しく。正面 の 人 が 手 を のせる なら その 人 の `held` に |
| `<Hall x width top floor front roof?>` | まえ が あいた 広間(お寺・和室 の 教室): おく の かべ・なげし・たたみ・えん・はしら 2本・かわら の やね。`top` は のき、`floor` は かべ と たたみ の さかい、`front` は たたみ の てまえ |
| `<Tatami x y width depth cols?>` `<TiledRoof x y width height? color?>` `<Pillar x top bottom width?>` | たたみ・かわら の やね(x は まんなか、y は のき)・はしら を 1つずつ |
| `byTime(time, 昼, 夕方, 夜)` | 自分で 描く 物の 色を 時間で かえる |

夜の 場面で 人 は 昼の 色 の まま です(顔と 気持ち が 見える ように)。くらさ を 出す なら、人を 火 や まど の あかり の そば に おく。

### 天気・水・火・地面・もちもの

| 部品 | |
|---|---|
| `<Rain t amount? ground? top? left? right?>` `<Snowfall …>` | 雨(地面で はねる)・雪。`amount` 0〜1 で 量(0 で なし) |
| `<Wind t x y show? dir? reach?>` | 風の すじ(うず を まいて ながれる) |
| `<Pond t x y rx? ry? ripple? fill?>` `<River t y width? flow?>` | 池(`fill` で 水が たまる)・川(画面を よこぎる。`flow` で むき) |
| `<Seashore t horizon? shore? tide? sky? time?>` | 海 と 砂はま(Backdrop の かわり に いちばん 下)。`horizon` は 水平線、`shore` は なみうちぎわ。なみ が うちよせて ひく |
| `<Mountain shape={{ top, foot, half, straight?, ridge? }} rise? far? snow? lit? shade?>` `mountainPoint(shape, -1 \| 1, d)` | 山(日なた と ひかげ、`snow` の 高さ より 上 に 雪、`far` で とおく の 色、`rise` で せりあがる)。のはら・海 は 山 の あと に 描いて ふもと を かくす。山はだ の 点 は `mountainPoint` |
| `<Flame t x y size? glow?>` `<Campfire t x y size? lit?>` | ほのお(ろうそく・かまど)・たき火(`lit` で 火が つく) |
| `<Rock x y size? grow?>` `<Path near far bend?>` `<Field x y width? depth? kind? grow?>` | 岩・道(横 にも おく にも)・はたけ(`kind="crop"`)/田んぼ(`"paddy"`) |
| `<Basket x y width? items? handle?>` `<Bucket x y width? water?>` `<Crate x y width? tape?>` | かご・バケツ・はこ(x, y は まんなか。`holdPose` の `at` を そのまま わたせる) |
| `<Footprint x y size? facing? kind? grow?>` | 足あと(`kind` は `'shoe'` くつ・`'bare'` はだし。`facing` は つまさき の むき)。場所 は `walkPrints`・`runPrints` |
| `<GoalPole x base top grow?>` `<GoalTape a b pull? range? cut? show?>` | ゴール の ポール と テープ。`pull` は むね で おされた ずれ、`range` で 一部 だけ(人 の 前後 に 分けて 描く)、`cut`(0〜1)で きれて たれる |

### 木・家・生きもの・しるし

| 部品 | |
|---|---|
| `<Sun t x y r? from?>` `<Clouds t at={[[x, y, 大きさ]]} speed? color?>` `<Hills y? color?>` `<Meadow y? tufts? color?>` `<Tuft x y>` | 背景を 1つずつ 置く とき |
| `<Tree x y height grow? sway? fruit?>` | 葉の しげった 木(x, y は ねもと)。`grow` 0→1 で みき → えだ → しげみ の じゅんに そだつ |
| `<Canopy x y r grow? sway? fruit?>` | 葉の しげみ だけ。みき・えだ を `Bone` で 描く 字(木・休・森 など)に のせる |
| `<PineTree x y height grow? sway?>` | はりの 葉の 木 |
| `<House x y width? grow? wall? roof? light?>` | 三角 やね の 家(x は まんなか、y は 地面)。`light` で まど に あかり |
| `<Flower x y color? grow? sway?>` | 地面に さく 花 |
| `<ByDepth items={[{ key, z: 足もとの y, node }]}>` | 地面に 立つ もの を おく → てまえ の じゅんに 描く |
| `<Bird x y t? flying? facing? size?>` `<Butterfly x y t perched?>` | 小鳥・ちょうちょ(とぶ 道すじ は 場面で 計算) |
| `<Sweat t x y show dir?>` `<Sigh x y p show? dir?>` `<Hearts t x y show>` `<Notice x y r show dir?>` `<Dust x y p reach?>` | あせ・ためいき・ハート・「はっ」・つちけむり。`show` に `during(…)` を わたす |
| `<Question x y show t? size? color?>` | 「?」(どっち? だれ?)。あたま の ななめ上 に おく。`t` で ふわふわ |
| `PALETTE` `CLOTHES` `LOOKS` `shade(色, k)` `mixColor(a, b, k)` `byTime(…)` | 色。むこうがわ・かげ は `shade` |

### 786字を 作る ときの 注意

- **まず 共通部品 を さがす。** 人・すわり・はしり・おくへ あるく/はしる・へや・和室・夜・雨・川・海・山・火・かばん・ぼうし・道具 は ぜんぶ ある。見本 6まい(人・後・走・夜・顔・手)を 先に 見る。
- うしろすがた の 人が 物を もつ・ゆびさす と、うで が 体の おく に かくれる のは 正しい(せなか ごし には 見えない)。見せたい なら 横むき に する。
- 正面 の 人 が 書く・手 を とる・さし出す ときは、手 を `{ to, depth }` で まえ へ のばす(手 を かた の 下 に おいて ごまかさない)。
- 正面・うしろむき で ひざ を まげる(すわる・しゃがむ)のは `fore`・`foreBend`(= `posture`)。`swing`・`bend` で 横に まげると、がにまた に なる。
- 体格 は 話の 中の 年れい に 合わせる(兄弟・親子・先生 と 生徒 は 体格 で 見分ける。色だけ で 見分けない)。
- 動物(うさぎ・りす・犬・ねこ・牛・馬 など)・乗り物(車・電車・船)は まだ 部品が ない。2字 以上で 使うなら、場面で 描かず `sceneFigures/` に 足す。

### 部品が 足りないとき

- 場面に いる 1回きり の 物(どんぐり・たて札 など)は、今まで どおり 場面の 中で 描く(ふで・えんぴつ・ぼう は `tools`)。
- 人の かっこう や 見た目 で 足りない もの(新しい かみがた・服・持ちもの の 手の 形 など)は、**場面で 人を 描きなおさず**、`sceneFigures/` に 足して、テスト を 足す(`sceneFigures.test.tsx`・`sceneFigures.person.test.tsx`・`sceneFigures.motion.test.tsx`・`sceneFigures.scenery.test.tsx`・`sceneFigures.gear.test.tsx`・`sceneFigures.reach.test.tsx`・`sceneFigures.places.test.tsx`)。見本 ページ(`trials/parts/`)にも 足して、目で たしかめる。
- 2つ以上の 字で 同じ 物を 描きそうなら、`sceneFigures/` に 足す。

### 絵の かきかた

- 色は ベタぬり。線の わく は つけず、色の面で 形を作る(見本と同じ絵柄に そろえる)。かげ・ハイライト は 1だん だけ。
- かど は まるく。顔は 点の目・小さな口・ほっぺ。気持ちで 目と口を かえる。
- 文字は 使わない(「z」のような 擬音の1文字は よい)。絵文字・外の画像・フォント も 使わない。
- 色は `PALETTE`(`sceneFigures/palette.ts`)から えらぶ: はだ `#f8cfa6`、かみ `#5a3b2a`、木の はだ `#8c5b3c`、葉 `#55b86e` / `#3f9c59` / `#8bd69a`、草 `#c5e8a9`、空の太陽 `#ffd24a`、水 `#7cc4f2`。
- 共通部品に ない 物は、部品ごとに 小さな関数に分ける。数字には、何の場所か わかる名前か コメント を付ける。
- コメントは 日本語(ひらがな多め。まわりの ファイルと同じ調子)で、「なぜ そうしたか」を書く。
- ファイルの いちばん上に、**ほね(画と絵の対応)** と **ながれ** を コメントで書く(見本と同じ形)。

## たしかめ方(かならず 自分の目で見る)

```
node scripts/scene-info.mjs 山          # 材料(画の線・部位・なりたちの文)
node scripts/scene-check.mjs 山         # 型・書き方・コマ送りの一覧 を まとめて たしかめる
node scripts/scene-check.mjs --big 山   # コマを大きく(こまかい所を見る)
```

`scene-check` は、できた画像の場所を出します。**その画像を ひらいて、1コマずつ 見てください。** `×` が出たら、書いてある所を直します。
(コマ送りだけを 作りなおすなら `node scripts/scene-sheet.mjs 山`。ためしの場面は `--variant <なまえ>`。)

よくある `×`:

- `<circle> attribute r: A negative value` … 半径・はば が マイナスに なっている。`backOut` は とちゅうで 1 を こえ、`1 - backOut(...)` は マイナスに なる。`Math.max(0, …)` で止める。
- `さいごの しゅんかん に、字の画が …本 書けていない` … `<Ink>` の `progress` が 1 に なっていない。`inkTiming` の `to` を `duration` より前に。

見るところ:

- [ ] 人は `Person`、あるきは `walk`・`walkDepth`、はしりは `run`、ふりむきは `turnAround`、すわりは `posture` で描いているか(自分で 体や 足の ふり を 書いていないか)
- [ ] 人・物の形は 正しいか(うで・くび・あし の つきかた、左右、大きさの つりあい)
- [ ] 人が 物の まえ・うしろ を 通るとき、とちゅうで 前後が 入れかわって いないか
- [ ] 文を読まなくても、何の話か わかるか。主役が いて、気持ちが 変わっているか
- [ ] はじめの数コマで、いきなり 全部 出ていないか。動きの とちゅう のコマが 不自然でないか
- [ ] 「ほね が ひかる」コマで、白い線(字の形)が 絵と だいたい重なっているか
- [ ] さいごのコマで、字が ぜんぶ書けていて、絵が うしろに うっすら のこっているか
- [ ] 絵が わく から はみ出して 切れていないか。主役が 小さすぎないか

1回で うまくいくことは まず ありません。**見て → 直して → また見る を、少なくとも 3回** くり返してください。
「問題なし」と思っても、もう1回 `--big` で 見て、**人や 生きものの 体の つながり** と **動きの とちゅうの コマ** を うたがってください。
