import os
import base64
import io
from flask import Blueprint, request, jsonify, send_file
from openai import OpenAI
from PIL import Image
import requests
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from docx import Document
from docx.shared import Inches

math_bp = Blueprint('math', __name__)

# OpenAI クライアントの初期化
client = OpenAI()

# プロンプトテンプレートを読み込み
def load_prompt_template():
    template_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'prompt_template.txt')
    with open(template_path, 'r', encoding='utf-8') as f:
        return f.read()

@math_bp.route('/analyze-problem', methods=['POST'])
def analyze_problem():
    """例題を解析して単元と学年を推定"""
    try:
        data = request.get_json()
        problem_text = data.get('problem_text', '')
        
        if not problem_text:
            return jsonify({'error': '問題文が入力されていません'}), 400
        
        # プロンプトテンプレートを読み込み
        try:
            prompt_template = load_prompt_template()
        except Exception as e:
            print(f"プロンプトテンプレート読み込みエラー: {e}")
            return jsonify({'error': 'プロンプトテンプレートの読み込みに失敗しました'}), 500
        
        # 例題解析用のプロンプト
        analysis_prompt = f"""
{prompt_template}

以下の例題を解析してください。解答は求めず、以下の情報のみを提供してください：

例題：
{problem_text}

出力形式：
学年: [中1/中2/中3/数I/数A/数II/数B/数III/数C]
単元: [具体的な単元名]
推定根拠: [簡潔な説明]
"""
        
        try:
            response = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "あなたは数学教育の専門家です。"},
                    {"role": "user", "content": analysis_prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            analysis_result = response.choices[0].message.content
            
            return jsonify({
                'success': True,
                'analysis': analysis_result,
                'original_problem': problem_text
            })
        except Exception as e:
            print(f"OpenAI API エラー: {e}")
            return jsonify({'error': f'AI解析中にエラーが発生しました: {str(e)}'}), 500
        
    except Exception as e:
        print(f"一般的なエラー: {e}")
        return jsonify({'error': f'解析中にエラーが発生しました: {str(e)}'}), 500

@math_bp.route('/generate-problems', methods=['POST'])
def generate_problems():
    """類題を生成"""
    try:
        data = request.get_json()
        original_problem = data.get('original_problem', '')
        difficulty = data.get('difficulty', 'L3')  # L1-L5
        count = data.get('count', 3)
        solution_method = data.get('solution_method', '')
        
        if not original_problem:
            return jsonify({'error': '元の問題が指定されていません'}), 400
        
        # プロンプトテンプレートを読み込み
        prompt_template = load_prompt_template()
        
        # 類題生成用のプロンプト
        generation_prompt = f"""
{prompt_template}

以下の例題を参考に、{count}問の類題を生成してください。

例題：
{original_problem}

設定：
- 難易度: {difficulty}
- 作問数: {count}問
"""
        
        if solution_method:
            generation_prompt += f"- 解法指定: {solution_method}\n"
        
        generation_prompt += """
各問題について、以下の形式で出力してください：

【問題1】
[問題文]

【解答1】
[解答]

【解説1】
[簡潔な解説]

（以下、問題数分繰り返し）
"""
        
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "あなたは数学問題作成の専門家です。"},
                {"role": "user", "content": generation_prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        generated_problems = response.choices[0].message.content
        
        return jsonify({
            'success': True,
            'problems': generated_problems,
            'settings': {
                'difficulty': difficulty,
                'count': count,
                'solution_method': solution_method
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'問題生成中にエラーが発生しました: {str(e)}'}), 500

@math_bp.route('/ocr-image', methods=['POST'])
def ocr_image():
    """画像からテキストを抽出（OCR）"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '画像ファイルが選択されていません'}), 400
        
        image_file = request.files['image']
        
        # 画像をbase64エンコード
        image_data = image_file.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # OpenAI Vision APIを使用してOCR
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "この画像に含まれる数学問題のテキストを正確に読み取って、テキスト形式で出力してください。数式は適切な記法で表現してください。"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )
        
        extracted_text = response.choices[0].message.content
        
        return jsonify({
            'success': True,
            'extracted_text': extracted_text
        })
        
    except Exception as e:
        return jsonify({'error': f'OCR処理中にエラーが発生しました: {str(e)}'}), 500

@math_bp.route('/export-pdf', methods=['POST'])
def export_pdf():
    """生成された問題をPDF形式でエクスポート"""
    try:
        data = request.get_json()
        problems_text = data.get('problems_text', '')
        
        if not problems_text:
            return jsonify({'error': '出力する問題がありません'}), 400
        
        # PDFファイルを作成
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # カスタムスタイルを作成
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
        )
        
        content_style = ParagraphStyle(
            'CustomContent',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
        )
        
        # コンテンツを構築
        story = []
        story.append(Paragraph("数学問題集", title_style))
        story.append(Spacer(1, 12))
        
        # 問題テキストを段落に分割
        lines = problems_text.split('\n')
        for line in lines:
            if line.strip():
                story.append(Paragraph(line, content_style))
            else:
                story.append(Spacer(1, 6))
        
        # PDFを構築
        doc.build(story)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='math_problems.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': f'PDF出力中にエラーが発生しました: {str(e)}'}), 500

@math_bp.route('/export-word', methods=['POST'])
def export_word():
    """生成された問題をWord形式でエクスポート"""
    try:
        data = request.get_json()
        problems_text = data.get('problems_text', '')
        
        if not problems_text:
            return jsonify({'error': '出力する問題がありません'}), 400
        
        # Wordドキュメントを作成
        doc = Document()
        
        # タイトルを追加
        title = doc.add_heading('数学問題集', 0)
        
        # 問題テキストを追加
        lines = problems_text.split('\n')
        for line in lines:
            if line.strip():
                if line.startswith('【問題'):
                    doc.add_heading(line, level=1)
                elif line.startswith('【解答') or line.startswith('【解説'):
                    doc.add_heading(line, level=2)
                else:
                    doc.add_paragraph(line)
            else:
                doc.add_paragraph('')
        
        # バッファに保存
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='math_problems.docx',
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
    except Exception as e:
        return jsonify({'error': f'Word出力中にエラーが発生しました: {str(e)}'}), 500

