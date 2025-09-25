# 中高・計算問題 類題ジェネレーター

例題を入力して、類似問題を自動生成するWEBアプリケーションです。

## 機能

- **テキスト入力**: 数学問題をテキストで直接入力
- **画像入力**: 問題の画像をアップロードしてOCRで読み取り
- **例題解析**: 学年・単元・難易度を自動推定
- **類題生成**: 指定した難易度と問題数で類題を自動生成
- **PDF/Word出力**: 生成された問題をPDFまたはWord形式でダウンロード

## 技術スタック

### フロントエンド
- React
- Vite
- Tailwind CSS
- shadcn/ui

### バックエンド
- Flask
- OpenAI API (GPT-4.1-mini)
- ReportLab (PDF生成)
- python-docx (Word生成)

## セットアップ

### 必要な環境
- Python 3.11+
- Node.js 22+
- OpenAI API キー

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/AchieveOn/math-problem-generator-webapp.git
cd math-problem-generator-webapp
```

2. バックエンドのセットアップ
```bash
# 仮想環境を作成・アクティベート
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows

# 依存関係をインストール
pip install -r requirements.txt
```

3. 環境変数を設定
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

4. フロントエンドをビルド（既にビルド済みファイルが含まれています）
```bash
cd ../math-problem-frontend
pnpm install
pnpm run build
cp -r dist/* ../math-problem-generator/src/static/
```

### 実行

```bash
cd math-problem-generator
source venv/bin/activate
python src/main.py
```

ブラウザで `http://localhost:5000` にアクセスしてください。

## 使用方法

1. **例題入力**: テキストまたは画像で数学問題を入力
2. **解析**: 「例題を解析」ボタンで学年・単元を確認
3. **設定**: 難易度（L1-L5）と作問数を設定
4. **生成**: 「類題を生成」ボタンで類題を生成
5. **出力**: PDF/Wordボタンでファイルをダウンロード

## 要件定義

このアプリケーションは以下の要件に基づいて開発されています：

- 中高の数学計算問題の類題を自動生成
- 学習指導要領に準拠
- Safe-Value方式による三角関数の値制限
- 集合記号禁止、象限はアラビア数字表記
- 例題は解かずに解析のみ実行
- 入力データは保存せず、即時破棄

## ライセンス

MIT License

## 作成者

Manus AI Agent

