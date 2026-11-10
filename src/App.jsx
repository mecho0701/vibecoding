import { useState } from 'react'
import './App.css'

function App() {
  const [numbers, setNumbers] = useState([])
  const [history, setHistory] = useState([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [aiFortune, setAiFortune] = useState(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  // .env 파일에 저장된 OpenAI API 키 가져오기
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  // 1~45 번호에 따른 공식 로또 공 색상
  const getBallColor = (num) => {
    if (num <= 10) return 'ball-yellow'
    if (num <= 20) return 'ball-blue'
    if (num <= 30) return 'ball-red'
    if (num <= 40) return 'ball-gray'
    return 'ball-green'
  }

  // OpenAI API를 호출하여 AI 사주 및 행운의 한 마디 생성
  const fetchAiFortune = async (selectedNumbers) => {
    // API 키가 없거나 템플릿 기본값일 경우 시뮬레이션 모드 안내
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      setAiFortune({
        score: '96점 (대길)',
        reading: `뽑힌 번호 [${selectedNumbers.join(', ')}]는 오행 중 금(金)과 수(水)의 기운이 조화롭게 어우러져 뜻밖의 재물운이 샘솟는 형상입니다. 작은 기대가 큰 기쁨으로 이어질 기운입니다!`,
        advice: '망설이던 결정을 오늘 내리면 긍정적인 반전이 찾아옵니다.',
        luckyItem: '노란색 소품 또는 따뜻한 커피 ☕',
        isDemo: true,
      })
      return
    }

    setIsAiLoading(true)
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                '당신은 유쾌하고 영험한 AI 사주 및 복권 운세 전문가입니다. 사용자가 뽑은 로또 번호 6개를 보고 재미있고 긍정적인 오늘의 금전운 사주 풀이와 행운의 한 마디를 지어주세요. 반드시 다음 JSON 형식으로만 답변하세요: {"score": "금전운 점수 및 운세(예: 95점 (대길))", "reading": "사주 및 기운 풀이 2~3문장", "advice": "오늘의 실천 팁 1문장", "luckyItem": "행운의 아이템/색상"}',
            },
            {
              role: 'user',
              content: `제가 뽑은 행운의 번호는 [${selectedNumbers.join(', ')}] 입니다. 오늘 저의 금전운 사주와 행운의 한 마디를 알려주세요!`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8,
        }),
      })

      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)
      setAiFortune({ ...result, isDemo: false })
    } catch (err) {
      console.error('OpenAI 호출 에러:', err)
      setAiFortune({
        score: '88점 (길)',
        reading: `번호 [${selectedNumbers.join(', ')}]에 깃든 역동적인 에너지가 일상의 활력을 북돋아 줍니다.`,
        advice: '긍정적인 마음가짐으로 하루를 보내면 행운이 찾아옵니다.',
        luckyItem: '기분 좋은 산책 🌿',
        isDemo: true,
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  // 로또 번호 생성 핸들러
  const generateNumbers = () => {
    setIsAnimating(true)
    setAiFortune(null)

    const set = new Set()
    while (set.size < 6) {
      set.add(Math.floor(Math.random() * 45) + 1)
    }
    const newNumbers = Array.from(set).sort((a, b) => a - b)

    setTimeout(() => {
      setNumbers(newNumbers)
      setIsAnimating(false)
      const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setHistory((prev) => [{ numbers: newNumbers, time: now }, ...prev.slice(0, 4)])

      // AI 사주 풀이 요청
      fetchAiFortune(newNumbers)
    }, 200)
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <div className="app-container">
      <div className="lotto-card">
        <header className="lotto-header">
          <span className="badge">OpenAI GPT-4o-mini 연동</span>
          <h1>🍀 AI 로또 사주 & 행운 번호</h1>
          <p className="subtitle">행운의 번호를 뽑고, 오늘의 AI 금전운 풀이를 확인해 보세요!</p>
        </header>

        {/* 로또 공 디스플레이 */}
        <div className="balls-display">
          {numbers.length === 0 ? (
            <div className="placeholder-balls">
              {[1, 2, 3, 4, 5, 6].map((_, idx) => (
                <div key={idx} className="ball placeholder">?</div>
              ))}
            </div>
          ) : (
            <div className={`balls-wrapper ${isAnimating ? 'animating' : ''}`}>
              {numbers.map((num, idx) => (
                <div
                  key={idx}
                  className={`ball ${getBallColor(num)}`}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  {num}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 번호 뽑기 버튼 */}
        <div className="action-area">
          <button
            type="button"
            className="btn-draw"
            onClick={generateNumbers}
            disabled={isAnimating || isAiLoading}
          >
            {isAnimating ? '추첨 중...' : isAiLoading ? 'AI 사주 분석 중... ✨' : '🎲 행운의 번호 & AI 사주 뽑기'}
          </button>
        </div>

        {/* AI 사주 풀이 및 행운의 한 마디 결과 카드 */}
        {isAiLoading && (
          <div className="ai-box loading">
            <div className="spinner"></div>
            <p>신통한 AI가 번호의 기운과 오늘의 금전운을 분석하고 있습니다...</p>
          </div>
        )}

        {aiFortune && !isAiLoading && (
          <div className="ai-box result">
            <div className="ai-header">
              <span className="ai-title">🔮 오늘의 AI 사주 풀이</span>
              <span className="ai-score">{aiFortune.score}</span>
            </div>
            <p className="ai-reading">{aiFortune.reading}</p>
            <div className="ai-details">
              <div className="ai-detail-item">
                <strong>💡 행운의 한 마디:</strong> {aiFortune.advice}
              </div>
              <div className="ai-detail-item">
                <strong>🍀 행운의 아이템:</strong> {aiFortune.luckyItem}
              </div>
            </div>
            {aiFortune.isDemo && (
              <div className="env-tip">
                ℹ️ <code>.env</code> 파일에 OpenAI API 키를 입력하시면 실시간 GPT 생성 사주가 적용됩니다.
              </div>
            )}
          </div>
        )}

        {/* 최근 추첨 기록 */}
        {history.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <h3>📜 최근 추첨 기록</h3>
              <button type="button" className="btn-clear" onClick={clearHistory}>
                기록 지우기
              </button>
            </div>
            <ul className="history-list">
              {history.map((item, idx) => (
                <li key={idx} className="history-item">
                  <span className="history-time">{item.time}</span>
                  <div className="history-balls">
                    {item.numbers.map((n, i) => (
                      <span key={i} className={`mini-ball ${getBallColor(n)}`}>
                        {n}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
