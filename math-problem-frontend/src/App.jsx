import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { FileText, Download, Upload, Calculator } from 'lucide-react'
import MathText from '@/components/MathText.jsx'
import './App.css'

function App() {
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [difficulty, setDifficulty] = useState('Level 3 (応用)')
  const [problemCount, setProblemCount] = useState(3)
  const [solutionHint, setSolutionHint] = useState('')
  const [generatedProblems, setGeneratedProblems] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const API_BASE_URL = '/api'

  const handleAnalyze = async () => {
    if (!textInput.trim()) {
      alert('例題を入力してください')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem_text: textInput }),
      })

      if (!response.ok) {
        throw new Error('解析に失敗しました')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '解析結果を取得できませんでした')
      }
      const normalizedAnalysis = {
        ...(result.analysis || {}),
        original_problem: result.analysis?.original_problem || result.original_problem || textInput.trim(),
        raw_response: result.raw_response,
      }
      setAnalysisResult(normalizedAnalysis)
    } catch (error) {
      console.error('Error:', error)
      alert('解析中にエラーが発生しました: ' + error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    if (!analysisResult) {
      alert('まず例題を解析してください')
      return
    }

    setIsGenerating(true)
    try {
      const originalProblem = analysisResult?.problem_text || analysisResult?.original_problem || textInput.trim()
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis: analysisResult,
          original_problem: originalProblem,
          difficulty,
          count: Number(problemCount) || 1,
          solution_hint: solutionHint,
          analysis_summary: analysisResult?.summary || '',
        }),
      })

      if (!response.ok) {
        throw new Error('類題生成に失敗しました')
      }

      const result = await response.json()
      setGeneratedProblems(result)
    } catch (error) {
      console.error('Error:', error)
      alert('類題生成中にエラーが発生しました: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!generatedProblems) return

    try {
      const response = await fetch(`${API_BASE_URL}/download/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problems: generatedProblems?.problems ?? [],
          problems_text: generatedProblems?.problems_text ?? '',
          metadata: generatedProblems?.metadata ?? {},
        }),
      })

      if (!response.ok) {
        throw new Error('PDF生成に失敗しました')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'math_problems.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error:', error)
      alert('PDF生成中にエラーが発生しました: ' + error.message)
    }
  }

  const handleDownloadWord = async () => {
    if (!generatedProblems) return

    try {
      const response = await fetch(`${API_BASE_URL}/download/word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problems: generatedProblems?.problems ?? [],
          problems_text: generatedProblems?.problems_text ?? '',
          metadata: generatedProblems?.metadata ?? {},
        }),
      })

      if (!response.ok) {
        throw new Error('Word生成に失敗しました')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'math_problems.docx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error:', error)
      alert('Word生成中にエラーが発生しました: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            中高・計算問題 類題ジェネレーター
          </h1>
          <p className="text-gray-600">
            例題を入力して、類似問題を自動生成します
          </p>
        </div>

        <div className="space-y-6">
          {/* 例題入力セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                例題入力
              </CardTitle>
              <CardDescription>
                テキストまたは画像で例題を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">テキスト入力</TabsTrigger>
                  <TabsTrigger value="image">画像入力</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="problem-text">例題</Label>
                    <Textarea
                      id="problem-text"
                      placeholder="二次方程式　x^2+x+1=0　を解け"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="image" className="space-y-4">
                  <div>
                    <Label htmlFor="problem-image">画像ファイル</Label>
                    <Input
                      id="problem-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!textInput.trim() && !imageFile)}
                className="w-full mt-4"
              >
                {isAnalyzing ? '解析中...' : '例題を解析'}
              </Button>
            </CardContent>
          </Card>

          {/* 解析結果表示 */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>解析結果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>学年</Label>
                    <p className="font-medium">{analysisResult.grade || '不明'}</p>
                  </div>
                  <div>
                    <Label>単元</Label>
                    <p className="font-medium">{analysisResult.unit || '不明'}</p>
                  </div>
                  <div>
                    <Label>難易度</Label>
                    <p className="font-medium">{analysisResult.difficulty || '不明'}</p>
                  </div>
                </div>
                {analysisResult.summary && (
                  <div className="mt-4 space-y-2">
                    <Label>解析メモ</Label>
                    <MathText className="text-sm text-gray-700">
                      {analysisResult.summary}
                    </MathText>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 生成設定セクション */}
          <Card>
            <CardHeader>
              <CardTitle>生成設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">難易度</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Level 1 (基礎)">Level 1 (基礎)</SelectItem>
                      <SelectItem value="Level 2 (標準)">Level 2 (標準)</SelectItem>
                      <SelectItem value="Level 3 (応用)">Level 3 (応用)</SelectItem>
                      <SelectItem value="Level 4 (発展)">Level 4 (発展)</SelectItem>
                      <SelectItem value="Level 5 (最難関)">Level 5 (最難関)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="count">作問数</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="10"
                    value={problemCount}
                    onChange={(e) => setProblemCount(parseInt(e.target.value) || 3)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="solution-hint">解法指定（任意）</Label>
                <Input
                  id="solution-hint"
                  placeholder="例: 平方完成で"
                  value={solutionHint}
                  onChange={(e) => setSolutionHint(e.target.value)}
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !analysisResult}
                className="w-full"
              >
                {isGenerating ? '生成中...' : '類題を生成'}
              </Button>
            </CardContent>
          </Card>

          {/* 生成結果とダウンロード */}
          {generatedProblems && (
            <Card>
              <CardHeader>
                <CardTitle>生成された類題</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>学年</Label>
                    <p className="font-medium">{generatedProblems?.metadata?.grade || analysisResult?.grade || '不明'}</p>
                  </div>
                  <div>
                    <Label>単元</Label>
                    <p className="font-medium">{generatedProblems?.metadata?.unit || analysisResult?.unit || '不明'}</p>
                  </div>
                  <div>
                    <Label>生成難易度</Label>
                    <p className="font-medium">{generatedProblems?.metadata?.difficulty || difficulty}</p>
                  </div>
                </div>
                {generatedProblems?.metadata?.notes && (
                  <MathText className="text-sm text-gray-600">
                    {generatedProblems.metadata.notes}
                  </MathText>
                )}
                <div className="space-y-6">
                  {Array.isArray(generatedProblems?.problems) && generatedProblems.problems.length > 0 ? (
                    generatedProblems.problems.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p className="font-semibold">問題{idx + 1}{item.title ? `：${item.title}` : ''}</p>
                        {item.problem && (
                          <MathText className="text-sm text-gray-800">{item.problem}</MathText>
                        )}
                        {item.answer && (
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-gray-700">解答</p>
                            <MathText className="text-sm text-gray-800">{item.answer}</MathText>
                          </div>
                        )}
                        {item.explanation && (
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-gray-700">解説</p>
                            <MathText className="text-sm text-gray-800">{item.explanation}</MathText>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{generatedProblems?.problems_text || '出力がありません'}</pre>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadPDF} className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={handleDownloadWord} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Word
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

