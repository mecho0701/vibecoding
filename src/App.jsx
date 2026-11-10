import { useState } from 'react'
import './App.css'

function App() {
  const [numbers, setNumbers] = useState([])
  const [history, setHistory] = useState([])
  const [isAnimating, setIsAnimating] = useState(false)

  // 1~45 번호에 따른 공식 로또 공 색상 클래스
  const getBallColor = (num) => {
    if (num <= 10) return 'ball-yellow'
    if (num <= 20) return 'ball-blue'
    if (num <= 30) return 'ball-red'
    if (num <= 40) return 'ball-gray'
    return 'ball-green'
  }

  // 로또 번호 6개 생성 함수
  const generateNumbers = () => {
    setIsAnimating(true)
    const set = new Set()
    while (set.size < 6) {
      set.add(Math.floor(Math.random() * 45) + 1)
    }
    const newNumbers = Array.from(set).sort((a, b) => a - b)
    
    // 부드러운 애니메이션 효과를 위해 살짝 딜레이 후 반영
    setTimeout(() => {
      setNumbers(newNumbers)
      setIsAnimating(false)
      const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setHistory((prev) => [{ numbers: newNumbers, time: now }, ...prev.slice(0, 4)])
    }, 200)
  }

  // 기록 초기화
  const clearHistory = () => {
    setHistory([])
  }

  return (
    <div className="app-container">
      <div className="lotto-card">
        <header className="lotto-header">
          <span className="badge">React 19 + Vite</span>
          <h1>🍀 행운의 로또 번호 생성기</h1>
          <p className="subtitle">버튼을 클릭하면 1~45 중 6개의 행운 번호가 뽑힙니다!</p>
        </header>

        {/* 로또 공 표시 영역 */}
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
            disabled={isAnimating}
          >
            {isAnimating ? '추첨 중...' : '🎲 행운의 번호 뽑기'}
          </button>
        </div>

        {/* 최근 뽑은 번호 기록 (최대 5회) */}
        {history.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <h3>📜 최근 추첨 기록</h3>
              <button type="button" className="btn-clear" onClick={clearHistory}>기록 지우기</button>
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
