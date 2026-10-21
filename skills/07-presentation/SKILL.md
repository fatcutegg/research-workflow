---
name: 07-presentation
description: 発表資料を作成する。power-pptx で pptx を生成し、テンプレート管理とバッチ単位の討論を行う。
mode: collaborative
language: ja
license: MIT
metadata:
  version: "v0.0.1"
---

# 発表資料作成

## 実行環境

- **共通設定**: 00-orchestrator（共通実行環境・資源制約・subagent 委託プロトコル）を参照すること
- **conda env**: `research-{プロジェクトディレクトリ名}` を使用する
- **Python 依存**: `research/requirements.txt` で管理（`power-pptx` を含める）
- **生成ツール**: `power-pptx`（第一候補）／標準ライブラリのみでの OOXML 直接生成（フォールバック）

## 目的

定例組会の進捗発表（progress）、30 分の長時間組会（progress-long）、学会発表（final）のスライドを作成します。内容は討論で確定し、`power-pptx` で pptx を生成します。

## トリガー

- 「発表資料を作って」
- 「スライドを生成して」
- 「組会用の進捗をまとめて」
- 「学会発表の準備をしたい」
- 「30 分の組会資料を作って」（progress-long）
- 「とりあえず草稿を出して」（express）

## モード

| mode | 用途 | 枚数 | 言語 |
|:----|:-----|:----:|:----:|
| progress | 定例組会進捗発表（10 分程度） | 5-10枚 | 日本語 |
| **progress-long** | **30 分の長時間組会** | **15-25枚** | 日本語 |
| final | 学会発表・最終発表 | 15-30枚 | 日本語／英語 |
| **express** | **その場で草稿を出す（討論前）** | **1-数枚〜全体骨子** | 日本語 |

- **progress-long** は「30 分」を想定する。話す内容が progress の 2〜3 倍になるため、**手法・結果・失敗した試行・付録**を分けて構成する
- **express** は討論前に草稿を出すためのモード。**生成物は最終版ではなく、草稿とみなす**（HARD-GATE の例外）

## 生成ツール

### 第一候補: power-pptx

`python-pptx` 系 API を持つ活発な fork。表・画像・日本語フォントを扱え、**space-aware authoring**（要素の実寸を考慮してテキストが枠からはみ出しにくく配置する支援）を備える。

```bash
# インストール（conda env 内）
pip install power-pptx

# 導入確認（必須）
python -c "import power_pptx; print(power_pptx.__version__)"
```

**import 名は `power_pptx` であり、`pptx` ではない**（`pptx` は本家 python-pptx）。

```python
from power_pptx import Presentation
from power_pptx.util import Inches, Pt, Emu
from power_pptx.dml.color import RGBColor

prs = Presentation()
prs.slide_width = Inches(13.333)          # 16:9（12192000 EMU）
prs.slide_height = Inches(7.5)            # 6858000 EMU

slide = prs.slides.add_slide(prs.slide_layouts[5])   # タイトルのみのレイアウト
slide.shapes.title.left, slide.shapes.title.top = Inches(0.62), Inches(0.30)
slide.shapes.title.text = "IMU と足圧センサによる歩行区間の推定"

# 本文
box = slide.shapes.add_textbox(Inches(0.62), Inches(1.30), Inches(12.09), Inches(4.60))
tf = box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
run = p.add_run()
run.text = "前回からの差分：被験者 30 名に拡張し、f1 が 0.81 → 0.87"
run.font.size = Pt(20)
run.font.name = "ヒラギノ角ゴシック"          # <a:latin>。Windows は "游ゴシック"（Yu Gothic）
run.font.color.rgb = RGBColor(0x1F, 0x2A, 0x37)

# 日本語は <a:ea>（East Asian）にも同じ書体を入れないと、環境により別書体へ落ちる
from power_pptx.oxml.ns import qn

rPr = run.font._element.get_or_add_rPr()
for tag in ("a:ea", "a:cs"):
    el = rPr.find(qn(tag))
    if el is None:
        el = rPr.makeelement(qn(tag), {})
        rPr.append(el)
    el.set("typeface", "ヒラギノ角ゴシック")

out = "research/presentations/progress-2026-10-20-weekly-v1.pptx"   # 既存なら v2 にする
prs.save(out)
```

**表**（列幅は必ず明示する。既定列幅は内容と無関係に等分される）:

```python
shape = slide.shapes.add_table(
    rows=6, cols=4,
    left=Inches(0.62), top=Inches(1.5),
    width=Inches(12.09), height=Inches(3.20),
)
table = shape.table
table.columns[0].width = Inches(2.60)     # 列幅は 1 列ずつ指定する
table.columns[1].width = Inches(3.16)
cell = table.cell(0, 0)
cell.text = "被験者"
cell.text_frame.paragraphs[0].runs[0].font.size = Pt(16)
```

**図**:

```python
# アスペクト比を保つため width / height の片方だけ指定する
slide.shapes.add_picture("research/figures/FG-01-accuracy.png",
                         Inches(0.62), Inches(1.50), width=Inches(6.00))
```

蓄積する版番号（後述の「版管理」）は保存前に確認する。**既存ファイルがあれば v2, v3 と増やす。**

### 代替ツールの評価（2026-10 調査・実機検証済）

| ツール | 判定 | 根拠 |
|:------|:----:|:-----|
| **`power-pptx`** | **推奨** | python-pptx 1.0.2 と互換・活発・`space-aware authoring`・日本語／表／図を実機検証済（v2.14.0・MIT・Python ≥3.9） |
| `python-pptx2` | 代替可 | 別 fork（系列違い）。API 互換 |
| `python-pptx`（本家） | 非推奨 | 2024-08 以降メンテナンスが停滞 |
| **Pandoc → pptx** | **非推奨** | **数式のバグが複数オープン**: タイトル／表内の数式が認識されない（#9465）、**数式があると本文が消える**（#11483・2026-02 オープン）、ノート内の数式で壊れる（#6301）。数式を使う資料では実害が大きい |
| Touying + `typ2pptx` | 条件付き | 編集可能な pptx が出る。ただし作者自身が「vibe coding project」で変換エラーが多いと明記 |
| `touying-exporter` | 非推奨 | **PPTX の中身が PNG 画像**（編集不可） |
| Marp / reveal.js / Slidev | 条件付き | HTML/PDF は良好だが **pptx は画像化**される |
| ~~Anthropic PPTX skill~~ | **廃止** | 現存せず、内容も現行ツールに追随していない。**参照・指定してはならない** |

要件との突合（抜粋）:

| 要件 | power-pptx | Pandoc | Touying |
|:-----|:----------:|:------:|:-------:|
| 本物の .pptx（編集可） | ✓ | ✓ | ✓（`typ2pptx` のみ） |
| ローカル完結 | ✓ | ✓ | ✓ |
| 日本語フォント | ✓（検証済） | △ | ✓ |
| 数式（ネイティブ） | △（OMML の直接操作が必要） | ✗（バグ） | ✓（Typst） |
| 表・列幅指定 | ✓ | ✗（列幅指定不可） | ✓ |
| エージェント親和性 | ✓（Python API） | ✓（CLI） | △（Typst 記法） |

### フォールバック: 標準ライブラリのみで OOXML を直接生成

`power-pptx` を導入できない環境（オフライン・pip 制限・社内レジストリ不可）では、**標準ライブラリ（`zipfile` + 手書き XML）で OOXML を直接書く**。外部依存がゼロになり、生成スクリプトがそのまま再現手段になる。

最低限必要なパッケージ構成:

```
[Content_Types].xml
_rels/.rels
ppt/presentation.xml  + ppt/_rels/presentation.xml.rels
ppt/slideMasters/slideMaster1.xml  + rels
ppt/slideLayouts/slideLayout1.xml  + rels
ppt/theme/theme1.xml
ppt/slides/slide{N}.xml  + ppt/slides/_rels/slide{N}.xml.rels
ppt/media/*（画像を貼る場合）
```

実装上の注意:

- **EMU 基準**: 1 inch = 914400 EMU。16:9 は 13.3333 × 7.5 in = 12192000 × 6858000 EMU
- **日本語**: `<a:latin typeface="..."/>` と `<a:ea typeface="ヒラギノ角ゴシック W3"/>` の**両方**を書く（`ea` が日本語に効く）
- **zip**: `zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED)`。`[Content_Types].xml` を最初のエントリにする
- **表**: `a:tbl` を手書きする。列幅は `a:gridCol/@w` で明示
- **画像**: `ppt/media/` に置き、`slide{N}.xml.rels` から `../media/...` で参照
- **検証**: 生成後に XML parse・rels の解決・枚数を自己検証する（後述の Post-Inspect と同じ項目）

参照実装（読むだけ。変更しない）: Motion-Analysis リポジトリの `research/presentations/build_weekly_draft_2026-10-20.py`。単一ファイル・16:9・日本語・表・図プレースホルダ・生成後の自己検証まで含む完全な例。

**フォールバックを選んだ場合は、その旨をユーザーに宣言する**（黙って切り替えない）。

## デフォルトテーマ（テンプレート未選択時）

テンプレートを使わない場合（選択肢 C）でも、毎回 1 から決めずに以下を既定とする。

| 項目 | 既定値 |
|:-----|:-------|
| アスペクト比 | **16:9**（13.333 × 7.5 in / 12192000 × 6858000 EMU） |
| フォント | macOS: **ヒラギノ角ゴシック**（W3 本文・W6 見出し）／Windows: **游ゴシック**（Yu Gothic）／Linux: Noto Sans JP |
| タイトル | **32pt**・1 行 30 字以内 |
| 本文 | **18〜20pt**（最小 16pt。これ未満は読み手が読めない） |
| 出典・注記 | 9〜10pt・グレー `#6B7280` |
| アクセント色 | **1 色のみ**（例 `#0B5F8A`）。本文 `#1F2A37` |
| 余白 | 左右 0.62 in・上 0.30 in。本文の下端は 6.42 in、フッターは 6.55 in |
| 表紙 | タイトル・氏名・所属・日付 |
| 全スライド | フッターに**出典**（FG / TB / LN 番号、または URL） |

既定テーマを使った場合は「デフォルトテーマで生成しました」と宣言する。

## テンプレート管理

スライド生成時にテンプレートの有無を確認します。

```
あなた：「発表資料を作って」

agent: 「テンプレートを使用しますか？
   A: 既存のテンプレートを使う
   B: 新しいテンプレートを作る
   C: テンプレートなし（デフォルトテーマで生成）」

  A の場合:
    「research/presentations/templates/ にあるテンプレートを確認します」

  B の場合:
    「新しいテンプレートの構成を決めましょう（フォント・色・余白・フッター）」

  C の場合:
    「デフォルトテーマ（16:9・ヒラギノ／游ゴシック・タイトル 32pt・本文 18-20pt）で生成します」
```

テンプレートは `research/presentations/templates/` に保存します。

## 標準構成（例）

### progress mode（5-10 枚）

```
1. タイトル（研究タイトル・氏名・日付）
2. 研究背景と目的
3. 前回までの進捗（前回資料からの差分）
4. 今回の実験（手法）
5. 実験結果（図・表）
6. 考察
7. 今後の予定
```

### progress-long mode（15-25 枚・30 分）

```
1. タイトル
2. 背景と目的
3. 前回の到達点（前回資料との差分）
4-6. 今回の手法（概要 → 詳細 → 実装）
7-12. 結果（主結果 → 比較 → 失敗した試行）
13-15. 考察（解釈・限界・代替説明）
16-18. 予備実験・試行錯誤の記録
19-21. 今後の予定（直近 / 中期）
22-23. 付録（用語・追加図表）
```

30 分は「1 枚 1〜2 分」で消費する。**本文の情報量を増やすのではなく、枚数を増やす**（1 枚に詰め込むと読めなくなる）。

### final mode（15-30 枚）

```
1. タイトル
2. 背景と目的
3. 関連研究
4. 提案手法
5. 実験設定
6. 実験結果
7. 考察
8. まとめと今後の課題
```

### express mode（1-数枚〜全体骨子）

討論の前に「叩き台」を出すモード。タイトル＋主要な図表＋論点だけでよい。**草稿であり最終版ではない。**

## 版管理（上書き禁止）

**生成した pptx は毎回保存し、既存ファイルを上書きしない。** 同じ日に微修正する場合も版を増やす。

### 命名規則

```
{mode}-{date}-{desc}-v{n}.pptx          ← 例: progress-2026-10-20-weekly-v1.pptx, -v2.pptx
{mode}-{date}-{desc}-draft{n}.pptx      ← express の草稿（承認後に v1 以降の正式版を作る）
{mode}-{date}-{desc}-{HHMM}.pptx        ← タイムスタンプ方式でも可
build_{mode}_{date}_{desc}_v{n}.py      ← 生成スクリプトも版ごとに残す
```

### 規則

| # | 規則 |
|:-:|:-----|
| 1 | **出力先が既存か確認してから保存する**（`path.exists()` / `ls`）。存在すれば `n` を +1 する |
| 2 | **既存ファイルを上書きしない**（`prs.save(existing_path)` を書かない。`--force` 的な再生成もしない） |
| 3 | **生成スクリプトも版ごとに残す**（`build_..._v1.py`, `build_..._v2.py`）。どのスクリプトがどの版を生んだか追跡できるようにする |
| 4 | **どの版が最新かを明示する** — `research/presentations/README.md`（版台帳）または `research/manifest.md` に「最新版 = v3」と記録する |
| 5 | **指摘と対応版の対応表を残す** — 「指摘: 12 枚目がはみ出す → 対応: v3」のように書く |
| 6 | **訂正は新しい版で行う** — 過去版を削除・改名しない（比較と監査のため） |

### なぜ上書き禁止か

上書きすると、**確認前の版・ユーザーの指摘を反映した版の履歴が失われ、「どの版をレビューしたか」を追跡できなくなる**。実際に、検証で 12 枚のテキスト溢れを直す際に同一ファイルを何度も上書きしたため、ユーザーが見た版を特定できなくなった。版を増やせば、この事故は起きない。

**Express の草稿と正式版も別ファイルにする**（`-draft1` → 承認 → `-v1`）。草稿を正式版へ「昇格」させる改名はしない。

## 討論フェーズ

### Step 1: モードと構成の確認

```
agent: 「今回は progress mode（7 枚）で進めます。
   標準構成で良いですか？
   A: 標準構成
   B: カスタマイズ（追加・削除・順序変更）
   C: express（先に草稿を見てから決める）」
```

### Step 2: 討論は 3〜5 枚を 1 バッチ

**1 枚ずつ討論しない。** 24 枚を逐頁討論すると往復が現実的でないため、**3〜5 枚をまとめて提示し、まとめて承認を取る**。

```
agent: 「3〜5 枚目（背景・前回の到達点・今回の手法）をまとめて確認します。

   3 枚目: 背景 — センサ 2 系統の同期ずれが F1 を 0.08 下げる（FG-02）
   4 枚目: 前回の到達点 — 被験者 10 名・F1 0.81（前回 v2 の 7 枚目）
   5 枚目: 今回の手法 — 同期補正を追加（図は 6 枚目に回す）

   この 3 枚で進めますか？
   A: OK
   B: 修正（枚数を指定して指示）
   C: 1 枚ずつ見たい（その場合だけ逐頁に切り替える）」

あなた：「4 枚目は前回の数値を表にしてください」

agent: 「承知しました。4 枚目を表に差し替えます。他の 2 枚はこのまま進めます。」
```

Direction Check:

- 各スライドの情報量は適切か（1 枚に詰め込みすぎていないか）
- 図は適切に配置されているか（図のパスは実在するか）
- 強調すべき結果は明確か
- progress / progress-long の場合、**前回からの差分**が伝わるか
- 出典（FG / TB / LN 番号）が付いているか

### Step 3: 生成

内容が確定したら pptx を生成する（1 バッチ確定ごとに版を保存してよい。上書きはしない）。

```
生成パス: research/presentations/{mode}-{date}-{desc}-v{n}.pptx
```

## Pre-Inspect（実行前検証）

- **モード**（progress / progress-long / final / express）と枚数レンジは明確か
- **express 以外**で、討論（バッチ承認）が完了しているか
- 各スライドの内容は確定しているか
- 参照する FG / TB / LN は**実在するか**（パスを `ls` で確認したか）
- テンプレートが選択されているか（未選択ならデフォルトテーマを適用すると宣言したか）
- **ツール検査**: `python -c "import power_pptx; print(power_pptx.__version__)"` が通るか
  - 失敗 → **フォールバック（標準ライブラリ OOXML）に切り替える**か、`pip install power-pptx` を試すかをユーザーに確認する
- **フォント検査**: 使用フォントが実際に存在するか（`python -c "from PIL import ImageFont; ImageFont.truetype(FONT_PATH, 32)"` が通るか）
- **出力パスの版番号**: 保存先が既存でないか（`ls research/presentations/{mode}-{date}-{desc}-v*.pptx`）
- PS counter の現在値を確認する（`state.yaml`）

## Post-Inspect（実行後検証）

生成した pptx を**実測**して検証する。目視だけに頼らない。

### ① 豆腐（missing glyph）

指定フォントに無い文字は `.notdef`（豆腐）で描画される。PIL で `.notdef` と描画結果を比較して検出する。

```python
from PIL import ImageFont

def tofu_chars(text, font_path, size):
    font = ImageFont.truetype(font_path, size)
    notdef = font.getmask("\uFFFF").tobytes()      # 未定義コードポイント = .notdef
    return [c for c in text if not c.isspace() and font.getmask(c).tobytes() == notdef]
```

`font.getmask()` はラスタライズ結果を返すので、`.notdef` と同じビットマップになる文字（= フォントに無い文字）を列挙できる。1 文字でも出たら**フォントを変えるか、その文字を差し替える**。

### ② はみ出し（溢れ）

**実グリフ幅で折り返し行数を推定し、枠の高さと比較する。** 文字数 × 平均幅の概算では精度が足りない（全角・半角・英字で大きく変わる）。

```python
from PIL import ImageFont

def wrapped_lines(text, font, max_width_px):
    lines, cur = 1, ""
    for ch in text:
        if ch == "\n":
            lines, cur = lines + 1, ""
            continue
        if font.getlength(cur + ch) > max_width_px:
            lines, cur = lines + 1, ch          # 禁則処理は簡易（必要なら語単位に変える）
        else:
            cur += ch
    return lines

def overflows(text, font_path, pt, box_w_in, box_h_in, dpi=96):
    px_per_pt = dpi / 72
    font = ImageFont.truetype(font_path, int(pt * px_per_pt))
    need_h_px = wrapped_lines(text, font, box_w_in * dpi) * pt * 1.2 * px_per_pt  # 行送り 1.2
    return need_h_px > box_h_in * dpi, need_h_px
```

- 判定は**スライド内の全テキスト枠・表セル**で行う
- 溢れたら **フォントサイズを下げる / 文言を削る / 枠を広げる / スライドを分割する**。枠からはみ出したまま完了報告しない（実例: 24 枚中 12 枚がはみ出した）
- `space-aware authoring` は溢れを**抑える**支援であり、**保証ではない**。実測チェックを省略しない

### ③ ブロックの重なり

タイトル・本文・図・表・フッターの矩形が交差していないか（許容 0.05 in 未満）。矩形は EMU から算出するか、生成スクリプト側で配置座標を記録して判定する。

### ④ タイトルと出典の有無

- **全スライドにタイトルがあるか**（空文字は不可）
- **本文系のスライドに出典があるか**（FG / TB / LN 番号、または URL）。出典なしの数値・図は載せない

### ⑤ スライド枚数

モードの範囲内か（progress 5-10 / progress-long 15-25 / final 15-30 / express は指定どおり）。`presentation.xml` の `p:sldIdLst` か `ppt/slides/slide*.xml` の実数で数える。

### ⑥ zip パッケージの整合

```python
import zipfile
import xml.etree.ElementTree as ET

def check_package(path):
    problems = []
    with zipfile.ZipFile(path) as z:
        names = set(z.namelist())
        if "[Content_Types].xml" not in names:
            problems.append("[Content_Types].xml が無い")
        for name in names:
            if name.endswith((".xml", ".rels")):
                try:
                    ET.fromstring(z.read(name))          # XML parse
                except ET.ParseError as e:
                    problems.append(f"parse 失敗: {name}: {e}")
        for name in names:
            if not name.endswith(".rels"):
                continue
            base = name.replace("_rels/", "").replace(".rels", "")
            root = ET.fromstring(z.read(name))
            for rel in root:
                if rel.get("TargetMode") == "External":
                    continue
                target = rel.get("Target")
                resolved = (base.rsplit("/", 1)[0] + "/" + target).replace("/./", "/")
                parts = []
                for part in resolved.split("/"):
                    if part == "..":
                        parts.pop()
                    elif part not in ("", "."):
                        parts.append(part)
                if "/".join(parts) not in names:
                    problems.append(f"rels の参照先が無い: {name} -> {target}")
    return problems
```

### ⑦ 上書きしていないこと

- **出力が既存ファイルを上書きしていないか**（新しいパス `-v{n}` であること）を確認する
- 直前の版と mtime が同じファイルが無いか（同一ファイルを書き直していないか）を `ls -lT` で確認する
- 版台帳（`research/presentations/README.md` または `manifest.md`）に最新版を追記したか

### その他

- 図は適切に埋め込まれているか（`ppt/media/` に実体があり、参照が切れていないか）
- あなたが内容を確認したか
- 生成ファイルは `research/presentations/` に保存されたか
- PS counter の整合: **PS は「資料」単位で発行する**（版は同一 PS の v1, v2 …）。`resource_counters.PS` は発行済み最大番号なので、**版が増えても PS は増えない**。pptx の実ファイル数と PS counter が一致しないのは正常であり、不整合とみなさない
- 不整合があれば実ファイル（版台帳）を優先して修正する

## 出力先

```
research/presentations/
├── templates/                                  ← テンプレート（再利用可能）
│   ├── progress-template.pptx
│   └── final-template.pptx
├── README.md                                   ← 版台帳（最新版・指摘対応表）
├── progress-2026-10-20-weekly-v1.pptx          ← 生成物（版ごとに残す）
├── progress-2026-10-20-weekly-v2.pptx
├── build_progress_2026-10-20_weekly_v1.py      ← どの版を生んだスクリプトか分かる名前
└── build_progress_2026-10-20_weekly_v2.py
```

反映先:

```
research/state.yaml   ← PS counter 更新（資料単位・版では増やさない）
research/presentations/README.md   ← 版台帳の更新（最新版の明示）
```

## 次のステップ

発表後、Review に戻るか、研究サイクルを継続する。

## HARD-GATE

- 各スライドの内容確認なしに pptx を生成してはならない
  - **例外: express モード**。討論前の生成を許可するが、**草稿は最終版とみなさない**。出力名に `-draft` を付け、承認後に正式な版（v1 以降）を作る
- テンプレートが未選択の状態で生成を開始してはならない（テンプレートなしの場合は**デフォルトテーマを適用することを宣言**する）
- 参照する図のパスが存在するか確認せずに埋め込んではならない
- 生成後、あなたの確認なしに最終版とみなしてはならない
- progress / progress-long / final / express を混同してはならない
- **既存の pptx を上書きしてはならない**（必ず版番号を増やす。生成スクリプトも版ごとに残す）
- **Post-Inspect の 6 項目（豆腐・はみ出し・重なり・タイトル／出典・枚数・zip 整合）と上書き確認（⑦）を省略して完了報告してはならない**
- `python -c "import power_pptx"` が通らない場合に、**フォールバックへ切り替えたことを宣言せず**生成してはならない
- 1 枚ずつ討論しない（3〜5 枚を 1 バッチ。ユーザーが逐頁を希望した場合のみ切り替える）
