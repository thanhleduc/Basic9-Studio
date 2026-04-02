/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Wand2, 
  Image as ImageIcon, 
  History, 
  CreditCard, 
  LayoutDashboard, 
  Sparkles, 
  Download, 
  SlidersHorizontal, 
  User, 
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
// Note: process.env.GEMINI_API_KEY is injected by the platform
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const plans = [
  {
    name: "Lite",
    price: "無料",
    desc: "まず試したい方向け",
    credits: "月50回",
    featured: false,
    features: ["基本プリセット", "履歴保存", "標準処理速度"],
  },
  {
    name: "Pro",
    price: "¥5,000/月",
    desc: "設計事務所・不動産会社向け",
    credits: "月150回",
    featured: true,
    features: ["全プリセット", "Before / After比較", "優先処理"],
  },
  {
    name: "Studio",
    price: "¥10,000/月",
    desc: "チーム利用向け",
    credits: "月200回",
    featured: false,
    features: ["チーム管理", "高度なプリセット", "最優先処理"],
  },
];

const presets = [
  "写真のようにリアルにする",
  "日本らしい街並み・外構に調整する",
  "カメラ構図を維持したまま自然に補正する",
  "建物・素材感を保ったまま高級感を上げる",
  "外観パースをより売れる印象にする",
  "内観を明るく魅力的に見せる",
  "人物を追加して生活感を出す",
  "植栽や外構を魅力的に整える",
  "AIによる外観提案を行う",
  "AIによるランドスケープ提案を行う",
];

const styles = [
  "ナチュラル",
  "高級感",
  "和モダン",
  "シンプルモダン",
  "都市型",
  "リゾート",
  "ファミリー向け",
  "商業施設向け",
];

const sampleHistory = [
  { id: 1, title: "外観パース / リアリティ補正", time: "2026-04-02 09:10", status: "完了" },
  { id: 2, title: "内観 / 夕景アレンジ", time: "2026-04-01 19:42", status: "完了" },
  { id: 3, title: "ランドスケープ提案", time: "2026-03-31 14:05", status: "完了" },
];

function SectionTitle({ icon: Icon, title, sub }: { icon: any, title: string, sub?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-2xl bg-black text-white p-2.5 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h2>
        {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string, value: string, sub?: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [selectedStyle, setSelectedStyle] = useState(styles[0]);
  const [instructions, setInstructions] = useState("カメラは変えずに、建物と素材感を保ったまま全体をより自然で高級感のある印象にしてください。背景は日本の住宅地らしい雰囲気に整えてください。");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usagePercent = useMemo(() => Math.round((32 / 150) * 100), []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setGeneratedImageUrl(null);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      setError("画像をアップロードしてください。");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const base64Data = await fileToBase64(uploadedFile);
      
      const prompt = `
        建築パースの補正・生成リクエストです。
        用途プリセット: ${selectedPreset}
        スタイル: ${selectedStyle}
        追加指示: ${instructions}
        
        この指示に基づき、アップロードされた建築画像をプロフェッショナルな品質で補正または生成してください。
        日本の建築基準や美意識に沿った、清潔感と高級感のある仕上がりを期待します。
      `;

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: uploadedFile.type,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let foundImage = false;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setGeneratedImageUrl(imageUrl);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("AIからの画像生成に失敗しました。別の指示を試してください。");
      }

    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "生成中にエラーが発生しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `basic9studio-ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm text-zinc-500">Basic9studio</div>
                <div className="font-semibold tracking-tight">建築AIビジュアルアプリ</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <button className="rounded-2xl px-4 py-2 text-zinc-600 hover:bg-zinc-100">料金プラン</button>
              <button className="rounded-2xl px-4 py-2 text-zinc-600 hover:bg-zinc-100">履歴</button>
              <button className="rounded-2xl bg-black px-4 py-2 text-white shadow-sm">無料で試す</button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 rounded-[2rem] bg-white p-7 shadow-sm border border-zinc-200"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
              <Sparkles className="h-3.5 w-3.5" />
              日本市場向け建築AIワークフロー
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              建築CGとAIで、提案をもっと早く、
              <br className="hidden sm:block" />
              もっと魅力的に。
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-600 leading-7">
              Basic9studioが最適化した建築向けプロンプトを裏側で活用し、画像アップロードと簡単な選択だけで、
              プロ品質の建築ビジュアル提案を行えるシンプルなWebアプリです。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-black px-5 py-3 text-white shadow-sm hover:opacity-90 transition-opacity">無料で試す</button>
              <button className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-zinc-700 hover:bg-zinc-50 transition-colors">料金プランを見る</button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-zinc-50 p-4 border border-zinc-100">
                <div className="text-sm text-zinc-500">対象ユーザー</div>
                <div className="mt-2 font-medium">設計事務所・不動産・工務店</div>
              </div>
              <div className="rounded-3xl bg-zinc-50 p-4 border border-zinc-100">
                <div className="text-sm text-zinc-500">主な価値</div>
                <div className="mt-2 font-medium">早い提案・高品質・簡単操作</div>
              </div>
              <div className="rounded-3xl bg-zinc-50 p-4 border border-zinc-100">
                <div className="text-sm text-zinc-500">強み</div>
                <div className="mt-2 font-medium">Basic9studio最適化プリセット</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-4 space-y-4"
          >
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={LayoutDashboard} title="ダッシュボード" sub="現在の契約状況と利用状況" />
              <div className="grid gap-3">
                <StatCard label="現在のプラン" value="Pro" sub="月額サブスクリプション" />
                <StatCard label="今月の利用回数" value="32 / 150" sub="残り118回利用可能" />
                <div className="rounded-3xl border border-zinc-200 p-5">
                  <div className="flex items-center justify-between text-sm text-zinc-600">
                    <span>利用状況</span>
                    <span>{usagePercent}%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercent}%` }}
                      className="h-full rounded-full bg-black" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={History} title="最近の生成履歴" sub="直近の処理結果" />
              <div className="space-y-3">
                {sampleHistory.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm group-hover:text-black">{item.title}</div>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{item.time}</div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="lg:col-span-7 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <SectionTitle icon={Upload} title="画像生成 / 画像補正" sub="画像をアップロードして用途を選ぶだけ" />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-[1.5rem] border-2 border-dashed p-8 text-center transition-all cursor-pointer ${previewUrl ? 'border-zinc-200 bg-white' : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'}`}
            >
              {previewUrl ? (
                <div className="relative group">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="mx-auto max-h-64 rounded-xl shadow-md object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <p className="text-white text-sm font-medium">画像を変更する</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <ImageIcon className="h-6 w-6 text-zinc-700" />
                  </div>
                  <div className="mt-4 text-base font-medium">画像をアップロード</div>
                  <p className="mt-2 text-sm text-zinc-500">ドラッグ＆ドロップ、またはクリックしてファイルを選択</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">用途プリセット</label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 transition-all"
                >
                  {presets.map((preset) => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">スタイル</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`rounded-full px-4 py-2 text-sm transition-all ${selectedStyle === style ? "bg-black text-white shadow-md" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">追加指示</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 transition-all resize-none"
                  placeholder="カメラは変えずに、外構だけ自然に整えてください"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !uploadedFile}
                  className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-white shadow-sm transition-all ${isGenerating || !uploadedFile ? 'bg-zinc-400 cursor-not-allowed' : 'bg-black hover:opacity-90 active:scale-95'}`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      AIで生成する
                    </>
                  )}
                </button>
                <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-zinc-700 hover:bg-zinc-50 transition-colors">
                  <SlidersHorizontal className="h-4 w-4" />
                  詳細設定
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="lg:col-span-5 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm flex flex-col"
          >
            <SectionTitle icon={Sparkles} title="生成結果" sub="Before / After比較とダウンロード" />

            <div className="grid grid-cols-2 gap-3 flex-grow">
              <div className="flex flex-col">
                <div className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Before</div>
                <div className="flex-grow aspect-[4/3] rounded-[1.5rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Before" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-zinc-400 text-xs">元画像なし</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">After</div>
                <div className="flex-grow aspect-[4/3] rounded-[1.5rem] bg-zinc-900 text-white border border-zinc-800 flex items-center justify-center overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3 p-4 text-center"
                      >
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                        <p className="text-xs text-zinc-400">AIが画像を生成中です...<br/>(約10〜20秒かかります)</p>
                      </motion.div>
                    ) : generatedImageUrl ? (
                      <motion.img 
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={generatedImageUrl} 
                        alt="Generated" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-zinc-500 text-center p-4"
                      >
                        生成後にここへ表示されます
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-zinc-50 p-4 text-sm text-zinc-600 border border-zinc-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-400">プリセット</span>
                <span className="font-medium text-zinc-900">{selectedPreset}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">スタイル</span>
                <span className="font-medium text-zinc-900">{selectedStyle}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button 
                disabled={!generatedImageUrl}
                className={`w-full rounded-2xl px-4 py-3 text-white shadow-sm transition-all ${!generatedImageUrl ? 'bg-zinc-400 cursor-not-allowed' : 'bg-black hover:opacity-90'}`}
              >
                Before / After を比較する
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleDownload}
                  disabled={!generatedImageUrl}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 transition-all ${!generatedImageUrl ? 'border-zinc-100 text-zinc-300 cursor-not-allowed' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'}`}
                >
                  <Download className="h-4 w-4" />
                  ダウンロード
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={!generatedImageUrl || isGenerating}
                  className={`rounded-2xl border px-4 py-3 transition-all ${!generatedImageUrl || isGenerating ? 'border-zinc-100 text-zinc-300 cursor-not-allowed' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'}`}
                >
                  再生成する
                </button>
              </div>
              <button 
                disabled={!generatedImageUrl}
                className={`w-full rounded-2xl border px-4 py-3 transition-all ${!generatedImageUrl ? 'border-zinc-100 text-zinc-300 cursor-not-allowed' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'}`}
              >
                軽微修正を依頼する
              </button>
            </div>
          </motion.div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="lg:col-span-4 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <SectionTitle icon={User} title="ログイン / 会員登録" sub="シンプルで分かりやすい認証UI" />
            <div className="space-y-4">
              <div className="space-y-3">
                <input className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-300 outline-none transition-all" placeholder="メールアドレス" />
                <input className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-300 outline-none transition-all" placeholder="パスワード" type="password" />
              </div>
              <button className="w-full rounded-2xl bg-black px-4 py-3 text-white shadow-sm hover:opacity-90 transition-opacity">ログイン</button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400">または</span></div>
              </div>
              <button className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Googleでログイン
              </button>
              <div className="text-center text-sm text-zinc-500 hover:text-zinc-800 cursor-pointer transition-colors">新規登録 / パスワードを忘れた場合</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <SectionTitle icon={CreditCard} title="料金プラン" sub="月額サブスクリプションモデル" />
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-[1.75rem] border p-5 flex flex-col transition-all hover:scale-[1.02] ${plan.featured ? "border-black bg-black text-white shadow-lg" : "border-zinc-200 bg-white text-zinc-900"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">{plan.name}</div>
                    {plan.featured && <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">おすすめ</span>}
                  </div>
                  <div className="mt-3 text-2xl font-bold">{plan.price}</div>
                  <div className={`mt-1 text-sm ${plan.featured ? "text-white/70" : "text-zinc-500"}`}>{plan.desc}</div>
                  <div className={`mt-4 rounded-2xl p-3 text-sm font-medium ${plan.featured ? "bg-white/10" : "bg-zinc-50"}`}>{plan.credits}</div>
                  <ul className="mt-4 space-y-2 text-sm flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${plan.featured ? 'text-white' : 'text-zinc-400'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`mt-6 w-full rounded-2xl px-4 py-3 font-medium transition-all active:scale-95 ${plan.featured ? "bg-white text-black hover:bg-zinc-100" : "bg-black text-white hover:opacity-90"}`}>
                    このプランを選択
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="mt-12 border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold tracking-tight">Basic9studio AI</span>
            </div>
            <div className="flex gap-8 text-sm text-zinc-500">
              <a href="#" className="hover:text-black transition-colors">利用規約</a>
              <a href="#" className="hover:text-black transition-colors">プライバシーポリシー</a>
              <a href="#" className="hover:text-black transition-colors">特定商取引法に基づく表記</a>
              <a href="#" className="hover:text-black transition-colors">お問い合わせ</a>
            </div>
            <div className="text-sm text-zinc-400">
              © 2026 Basic9studio. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
