import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [numbers, setNumbers] = useState([])
  const [vipGames, setVipGames] = useState([])
  const [history, setHistory] = useState([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [aiFortune, setAiFortune] = useState(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)

  // 환경 변수 (.env)
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const checkoutUrl = import.meta.env.VITE_POLAR_CHECKOUT_URL || 'https://polar.sh'

  // 1. 결제 완료 감지 및 로컬 스토리지 프리미엄 상태 동기화
  useEffect(() => {
    const savedPremium = localStorage.getItem('isPremium') === 'true'
    if (savedPremium) {
      setIsPremium(true)
    }

    // URL 파라미터에서 결제 성공 여부 확인 (?payment=success)
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      setIsPremium(true)
      localStorage.setItem('isPremium', 'true')
      alert('🎉 결제가 성공적으로 완료되었습니다! VIP 프리미엄 기능이 잠금 해제되었습니다.')
      // 깔끔한 URL 정리를 위해 쿼리스트링 제거
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // 1~45 번호에 따른 공식 로또 공 색상
  const getBallColor = (num) => {
    if (num <= 10) return 'ball-yellow'
    if (num <= 20) return 'ball-blue'
    if (num <= 30) return 'ball-red'
    if (num <= 40) return 'ball-gray'
    return 'ball-green'
  }

  // 단일 게임 번호 6개 생성기
  const makeSingleGame = () => {
    const set = new Set()
    while (set.size < 6) {
      set.add(Math.floor(Math.random() * 45) + 1)
    }
    return Array.from(set).sort((a, b) => a - b)
  }

  // OpenAI API를 호출하여 AI 사주 및 행운의 한 마디 생성 (VIP 회원은 심층 분석)
  const fetchAiFortune = async (selectedNumbers) => {
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      setAiFortune({
        score: isPremium ? '99점 (극대길 👑)' : '92점 (대길)',
        reading: isPremium
          ? `[VIP 심층 사주] 번호 [${selectedNumbers.join(', ')}]는 45개 숫자 중 천을귀인(天乙貴人)의 기운이 깃든 황금 배합입니다. 특히 이번 주는 동북쪽 방향에서 귀인의 도움으로 뜻밖의 큰 재물이 유입될 절호의 찬스입니다!`
          : `뽑힌 번호 [${selectedNumbers.join(', ')}]는 오행 중 금(金)과 수(水)의 기운이 조화롭게 어우러져 뜻밖의 재물운이 샘솟는 형상입니다.`,
        advice: isPremium
          ? '오늘 오후 3시~7시 사이에 중요한 결정을 내리거나 기분 좋은 소액 투자를 실행하면 길합니다.'
          : '망설이던 결정을 오늘 내리면 긍정적인 반전이 찾아옵니다.',
        luckyItem: isPremium ? '골드/퍼플 계열 액세서리 & 1000원 신권 지폐 🧧' : '노란색 소품 또는 따뜻한 커피 ☕',
        isDemo: true,
      })
      return
    }

    setIsAiLoading(true)
    try {
      const systemPrompt = isPremium
        ? '당신은 상위 0.1% VIP 고객만을 전담하는 대한민국 최고의 AI 역술 및 복권 통계 명장입니다. 사용자가 뽑은 로또 번호들을 정밀 분석하여, 부자가 되는 심층 금전운 사주 풀이와 명쾌한 행동 지침을 JSON으로 작성하세요: {"score": "금전운 점수(예: 99점 극대길)", "reading": "심층 사주 풀이 3~4문장", "advice": "VIP 행동 수칙 1~2문장", "luckyItem": "행운의 비책 아이템 및 색상"}'
        : '당신은 유쾌한 AI 역술가입니다. 로또 번호 6개에 대한 긍정적인 금전운 사주를 JSON으로 작성하세요: {"score": "금전운 점수", "reading": "사주 풀이 2문장", "advice": "조언 1문장", "luckyItem": "행운의 아이템"}'

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `제가 뽑은 행운의 번호는 [${selectedNumbers.join(', ')}] 입니다. ${isPremium ? 'VIP 심층 금전운 사주와 부자되는 행동 지침을 알려주세요!' : '오늘의 금전운 사주를 알려주세요!'}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8,
        }),
      })

      if (!response.ok) throw new Error(`API 응답 오류: ${response.status}`)
      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)
      setAiFortune({ ...result, isDemo: false })
    } catch (err) {
      console.error('OpenAI 호출 에러:', err)
      setAiFortune({
        score: '90점 (길)',
        reading: `번호 [${selectedNumbers.join(', ')}]에 깃든 역동적인 에너지가 일상의 재물운을 크게 북돋아 줍니다.`,
        advice: '긍정적인 마음가짐으로 하루를 보내면 행운이 배가됩니다.',
        luckyItem: '기분 좋은 산책 🌿',
        isDemo: true,
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  // 번호 생성 핸들러 (일반 유저는 1게임, VIP 유저는 5게임 일괄 생성!)
  const generateNumbers = () => {
    setIsAnimating(true)
    setAiFortune(null)

    if (isPremium) {
      // VIP 모드: 5게임 황금 세트 생성
      const games = []
      for (let i = 0; i < 5; i++) {
        games.push(makeSingleGame())
      }
      setTimeout(() => {
        setVipGames(games)
        setNumbers(games[0])
        setIsAnimating(false)
        const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setHistory((prev) => [{ numbers: games[0], time: now, isVip: true }, ...prev.slice(0, 4)])
        fetchAiFortune(games[0])
      }, 200)
    } else {
      // 일반 모드: 1게임 생성
      const newNumbers = makeSingleGame()
      setTimeout(() => {
        setNumbers(newNumbers)
        setVipGames([])
        setIsAnimating(false)
        const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setHistory((prev) => [{ numbers: newNumbers, time: now, isVip: false }, ...prev.slice(0, 4)])
        fetchAiFortune(newNumbers)
      }, 200)
    }
  }

  // 결제 진행 핸들러 (Polar 또는 Stripe 체크아웃)
  const handleCheckout = () => {
    // 실제 Polar 링크가 있으면 외부 결제 페이지로 이동
    if (checkoutUrl && checkoutUrl.includes('polar')) {
      const returnUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}?payment=success`)
      // 체크아웃 페이지에 리다이렉트 쿼리 전달
      window.location.href = `${checkoutUrl}?success_url=${returnUrl}`
    } else {
      // 링크가 없을 때 테스트용 안내
      window.open(checkoutUrl, '_blank')
    }
  }

  // 테스트용 무료 즉시 VIP 승급/취소 토글
  const toggleDemoPremium = () => {
    const nextState = !isPremium
    setIsPremium(nextState)
    localStorage.setItem('isPremium', nextState ? 'true' : 'false')
    setShowPricingModal(false)
  }

  return (
    <div className={`app-container ${isPremium ? 'premium-theme' : ''}`}>
      <div className={`lotto-card ${isPremium ? 'vip-card' : ''}`}>
        
        {/* 상단 VIP 상태 바 & 업그레이드 버튼 */}
        <div className="top-membership-bar">
          {isPremium ? (
            <div className="vip-badge-container">
              <span className="vip-active-badge">👑 VIP 프리미엄 회원</span>
              <button type="button" className="btn-status-toggle" onClick={toggleDemoPremium} title="일반 모드로 전환">
                (일반모드로 전환)
              </button>
            </div>
          ) : (
            <button type="button" className="btn-upgrade-pill" onClick={() => setShowPricingModal(true)}>
              👑 VIP 프리미엄 5게임 & 심층 사주 해제하기 ➔
            </button>
          )}
        </div>

        <header className="lotto-header">
          <span className="badge">
            {isPremium ? '👑 VIP Unlimited Edition' : 'OpenAI GPT-4o-mini 연동'}
          </span>
          <h1>🍀 {isPremium ? 'VIP 황금 로또 & 심층 사주' : 'AI 로또 사주 & 행운 번호'}</h1>
          <p className="subtitle">
            {isPremium
              ? 'VIP 특권: 한 번에 5게임 황금 배합 + 1등 대박 심층 사주 분석'
              : '행운의 번호를 뽑고, 오늘의 AI 금전운 풀이를 확인해 보세요!'}
          </p>
        </header>

        {/* 로또 공 디스플레이 (일반 1게임 또는 VIP 5게임) */}
        <div className="balls-display">
          {isPremium && vipGames.length > 0 ? (
            <div className="vip-games-list">
              {vipGames.map((game, gIdx) => (
                <div key={gIdx} className="vip-game-row">
                  <span className="vip-row-label">{gIdx + 1}게임</span>
                  <div className="balls-wrapper">
                    {game.map((num, idx) => (
                      <div key={idx} className={`ball ${getBallColor(num)}`}>
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : numbers.length === 0 ? (
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
            className={`btn-draw ${isPremium ? 'btn-vip-draw' : ''}`}
            onClick={generateNumbers}
            disabled={isAnimating || isAiLoading}
          >
            {isAnimating
              ? '행운 추출 중...'
              : isAiLoading
              ? 'AI 사주 분석 중... ✨'
              : isPremium
              ? '👑 VIP 5게임 & 심층 사주 뽑기'
              : '🎲 행운의 번호 & AI 사주 뽑기'}
          </button>
        </div>

        {/* AI 사주 풀이 결과 카드 */}
        {isAiLoading && (
          <div className="ai-box loading">
            <div className="spinner"></div>
            <p>신통한 AI가 번호의 기운과 오늘의 금전운을 분석하고 있습니다...</p>
          </div>
        )}

        {aiFortune && !isAiLoading && (
          <div className={`ai-box result ${isPremium ? 'ai-vip-box' : ''}`}>
            <div className="ai-header">
              <span className="ai-title">{isPremium ? '👑 VIP 심층 금전운 사주' : '🔮 오늘의 AI 사주 풀이'}</span>
              <span className={`ai-score ${isPremium ? 'vip-score' : ''}`}>{aiFortune.score}</span>
            </div>
            <p className="ai-reading">{aiFortune.reading}</p>
            <div className="ai-details">
              <div className="ai-detail-item">
                <strong>💡 {isPremium ? '부자되는 특급 행동 지침:' : '행운의 한 마디:'}</strong> {aiFortune.advice}
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
              <button type="button" className="btn-clear" onClick={() => setHistory([])}>
                기록 지우기
              </button>
            </div>
            <ul className="history-list">
              {history.map((item, idx) => (
                <li key={idx} className="history-item">
                  <span className="history-time">
                    {item.time} {item.isVip && <span className="vip-mini-tag">VIP</span>}
                  </span>
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

      {/* 💳 글로벌 결제 (Polar / Stripe) 요금제 팝업 모달 */}
      {showPricingModal && (
        <div className="modal-overlay" onClick={() => setShowPricingModal(false)}>
          <div className="pricing-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="btn-modal-close" onClick={() => setShowPricingModal(false)}>
              ✕
            </button>
            <div className="pricing-badge">SPECIAL VIP PASS</div>
            <h2>👑 VIP 프리미엄 멤버십</h2>
            <p className="pricing-sub">조코딩 3주차 실습 글로벌 결제 연동 (Polar.sh / Stripe)</p>

            <div className="price-tag">
              <span className="currency">$</span>
              <span className="amount">4.99</span>
              <span className="period">/ 평생 소장</span>
            </div>

            <ul className="features-list">
              <li>✨ <strong>한 번에 5게임 황금 조합 일괄 추출</strong> (시간 절약)</li>
              <li>🔮 <strong>GPT-4o-mini 심층 대박 사주 분석</strong> (부자 행동 수칙 포함)</li>
              <li>🧧 <strong>1등 당첨 기운 황금 테마 UI 영구 잠금 해제</strong></li>
              <li>🚀 <strong>광고 없이 평생 무제한 이용</strong></li>
            </ul>

            <div className="checkout-action-group">
              <button type="button" className="btn-polar-checkout" onClick={handleCheckout}>
                💳 Polar 결제창 열기 ($4.99)
              </button>
              
              {/* 강의 실습 및 테스트용 원클릭 즉시 승급 버튼 */}
              <button type="button" className="btn-demo-unlock" onClick={toggleDemoPremium}>
                🧪 테스트 모드로 즉시 VIP 체험하기 (무료)
              </button>
            </div>

            <p className="checkout-note">
              * Polar.sh를 통한 안전한 카드 결제 지원 (결제 완료 시 자동 잠금 해제)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
