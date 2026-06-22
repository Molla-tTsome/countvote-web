import { useEffect, useRef, type CSSProperties } from 'react'
import { CANDIDATES, type CandidateId, type CandidateResult, type ElectionSnapshot, type RevealStage } from '../types'

// 모든 길이 값은 SwiftUI 원본의 "px * s" (s = 화면높이/1080) 스케일을 그대로
// cqh(컨테이너 높이의 %) 단위로 환산한 것. 환산식: cqh = px / 1080 * 100
const cqh = (px: number) => `${(px / 1080) * 100}cqh`

// 원본은 가로 패딩을 W*0.02로 잡지만, 스테이지가 16:9로 고정돼 있어
// W = H * 16/9 이므로 2%(W) = 2 * 16/9 %(H) 로 cqh 환산 가능
const H_PAD = cqh(1080 * 0.02 * (16 / 9))

const NUMBER_WORD: Record<CandidateId, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
}

function winImage(id: CandidateId) {
  return `/images/win_${NUMBER_WORD[id]}.png`
}
function loseImage(id: CandidateId) {
  return `/images/lose_${NUMBER_WORD[id]}.png`
}
function candidateInfo(id: CandidateId) {
  return CANDIDATES.find((c) => c.id === id)!
}
function displayLabel(id: CandidateId) {
  const info = candidateInfo(id)
  return info.party === '무소속' ? info.name : info.party
}

const KEY_COLOR: Record<CandidateId, string> = {
  1: '#3f0062',
  2: '#a40202',
  3: '#69391f',
  4: '#e6a8a3',
  5: '#bbd0e6',
  6: '#014c2a',
}
const TEXT_COLOR: Record<CandidateId, string> = {
  1: KEY_COLOR[1],
  2: KEY_COLOR[2],
  3: KEY_COLOR[3],
  4: '#852621',
  5: '#1a407a',
  6: KEY_COLOR[6],
}

// 1위 카드 안에서 득표율/득표수 텍스트 중심 좌표 (1153x743 기준 박스에 대한 %)
const WIN_VOTE_BOX_PERCENT: Record<CandidateId, { x: number; y: number }> = {
  1: { x: (213 / 1153) * 100, y: (577 / 743) * 100 },
  2: { x: (220 / 1153) * 100, y: (573 / 743) * 100 },
  3: { x: (211 / 1153) * 100, y: (582 / 743) * 100 },
  4: { x: (224 / 1153) * 100, y: (578 / 743) * 100 },
  5: { x: (218 / 1153) * 100, y: (580 / 743) * 100 },
  6: { x: (230 / 1153) * 100, y: (600 / 743) * 100 },
}
// 1위 카드 안에서 당선/유력 배지 중심 좌표 (같은 기준 박스 %)
const WIN_BADGE_PERCENT: Record<CandidateId, { x: number; y: number }> = {
  1: { x: (113 / 1153) * 100, y: (277 / 743) * 100 },
  2: { x: (120 / 1153) * 100, y: (273 / 743) * 100 },
  3: { x: (101 / 1153) * 100, y: (282 / 743) * 100 },
  4: { x: (124 / 1153) * 100, y: (278 / 743) * 100 },
  5: { x: (118 / 1153) * 100, y: (280 / 743) * 100 },
  6: { x: (130 / 1153) * 100, y: (300 / 743) * 100 },
}

export default function ResultView({
  snapshot,
  revealStage,
}: {
  snapshot: ElectionSnapshot | null
  revealStage: RevealStage
}) {
  const drumRollRef = useRef<HTMLAudioElement>(null)
  const tadaRef = useRef<HTMLAudioElement>(null)
  const applauseRef = useRef<HTMLAudioElement>(null)
  const drumRollLoop = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (revealStage === 1) {
      const drumRoll = drumRollRef.current
      if (drumRoll) {
        drumRoll.currentTime = 1.0
        drumRoll.play().catch(() => {})
        drumRollLoop.current = setInterval(() => {
          if (!drumRoll.paused && drumRoll.currentTime >= 4.0) {
            drumRoll.currentTime = 1.0
          }
        }, 50)
      }
    } else if (revealStage === 4) {
      if (drumRollLoop.current) {
        clearInterval(drumRollLoop.current)
        drumRollLoop.current = null
      }
      drumRollRef.current?.pause()
    } else if (revealStage === 5) {
      if (tadaRef.current) {
        tadaRef.current.currentTime = 0
        tadaRef.current.play().catch(() => {})
      }
      if (applauseRef.current) {
        applauseRef.current.currentTime = 0
        applauseRef.current.play().catch(() => {})
      }
    }
  }, [revealStage])

  useEffect(
    () => () => {
      if (drumRollLoop.current) clearInterval(drumRollLoop.current)
    },
    [],
  )

  return (
    <div style={styles.stage}>
      <audio ref={drumRollRef} src="/audio/drum_roll.mp3" preload="auto" />
      <audio ref={tadaRef} src="/audio/tada.mp3" preload="auto" />
      <audio ref={applauseRef} src="/audio/applause.mp3" preload="auto" />
      <img src="/images/background_confetti.png" alt="" style={styles.background} />
      <div style={styles.frame}>
        <HeaderRow countRate={snapshot?.countRate} />
        {snapshot ? <Body snapshot={snapshot} revealStage={revealStage} /> : <IdleGif />}
      </div>
    </div>
  )
}

function HeaderRow({ countRate }: { countRate: number | undefined }) {
  return (
    <header style={styles.header}>
      <img src="/images/logo_live.png" alt="" style={styles.logo} />
      <div style={styles.headerCenter}>
        <img src="/images/title.png" alt="" style={styles.title} />
        <div style={{ ...styles.countBanner, opacity: countRate === undefined ? 0 : 1 }}>
          <span style={styles.countBannerLabel}>개표율 : </span>
          <span style={styles.countBannerValue}>{(countRate ?? 0).toFixed(1)}%</span>
        </div>
      </div>
      <img src="/images/logo_live.png" alt="" style={{ ...styles.logo, opacity: 0 }} />
    </header>
  )
}

function IdleGif() {
  return (
    <div style={styles.idleGifBox}>
      <img src="/images/progressAnimation.gif" alt="" style={styles.gif} />
    </div>
  )
}

function Body({ snapshot, revealStage }: { snapshot: ElectionSnapshot; revealStage: RevealStage }) {
  const sorted = [...snapshot.results].sort((a, b) => a.rank - b.rank)
  const first = sorted[0]
  const top2 = sorted.slice(1, 3) // 2위~3위 자리 (동점 시 원본과 동일하게 위치 기준)
  const bot3 = sorted.slice(3) // 4~6위 자리

  const rankCounts = new Map<number, number>()
  sorted.forEach((r) => rankCounts.set(r.rank, (rankCounts.get(r.rank) ?? 0) + 1))

  const showGif = revealStage < 1
  const show1 = revealStage >= 5
  const show456 = revealStage >= 2

  return (
    <div style={styles.body}>
      <div style={styles.contentRow}>
        {first && (
          <div style={{ ...styles.rank1Region, opacity: show1 ? 1 : 0 }}>
            <FirstSection result={first} />
          </div>
        )}

        <div style={styles.rightColumn}>
          <div style={styles.top23Row}>
            {top2.map((r, index) => (
              <LoseCard
                key={r.id}
                result={r}
                variant="top"
                useRankImage={(rankCounts.get(r.rank) ?? 0) === 1}
                opacity={index === 0 ? (revealStage >= 4 ? 1 : 0) : revealStage >= 3 ? 1 : 0}
              />
            ))}
          </div>
          <div style={{ ...styles.bot46Row, opacity: show456 ? 1 : 0 }}>
            {bot3.map((r) => (
              <LoseCard key={r.id} result={r} variant="bot" useRankImage={false} opacity={1} />
            ))}
          </div>
        </div>
      </div>

      {showGif && <img src="/images/progressAnimation.gif" alt="" style={styles.gifOverlay} />}
    </div>
  )
}

function FirstSection({ result }: { result: CandidateResult }) {
  const votePos = WIN_VOTE_BOX_PERCENT[result.id]
  const badgePos = WIN_BADGE_PERCENT[result.id]
  const showBadge = result.winStatus === 'leading' || result.winStatus === 'confirmed'

  return (
    <div style={styles.firstSectionBox}>
      <img src={winImage(result.id)} alt="" style={styles.firstSectionImage} />
      <div
        style={{
          ...styles.firstSectionText,
          left: `${votePos.x}%`,
          top: `${votePos.y}%`,
        }}
      >
        <span style={styles.firstSectionPercent}>{result.voteRate.toFixed(1)}%</span>
        <span style={styles.firstSectionVotes}>{result.votes.toLocaleString()}표</span>
      </div>
      {showBadge && (
        <img
          src={result.winStatus === 'leading' ? '/images/leading.png' : '/images/finalized.png'}
          alt=""
          style={{
            ...styles.winBadge,
            left: `${badgePos.x}%`,
            top: `${badgePos.y}%`,
          }}
        />
      )}
    </div>
  )
}

function LoseCard({
  result,
  variant,
  useRankImage,
  opacity,
}: {
  result: CandidateResult
  variant: 'top' | 'bot'
  useRankImage: boolean
  opacity: number
}) {
  const keyColor = KEY_COLOR[result.id]
  const textColor = TEXT_COLOR[result.id]
  const label = displayLabel(result.id)
  const isTop = variant === 'top'

  return (
    <div style={{ ...styles.loseCard, opacity, transition: 'opacity 0.8s ease-in' }}>
      <div style={{ ...styles.loseCardBg, background: keyColor }} />
      <img src={loseImage(result.id)} alt="" style={styles.loseCardImage} />

      <div style={styles.rankIndicator}>
        {isTop && useRankImage && result.rank === 2 ? (
          <img src="/images/rank_two.png" alt="" style={styles.rankImage} />
        ) : isTop && useRankImage && result.rank === 3 ? (
          <img src="/images/rank_three.png" alt="" style={styles.rankImage} />
        ) : (
          <span
            style={{
              ...styles.rankText,
              fontSize: isTop ? cqh(72) : cqh(43),
            }}
          >
            {result.rank}위
          </span>
        )}
      </div>

      <div style={styles.dataBox}>
        <div style={styles.dataBoxInner}>
          <div style={{ ...styles.dataLabel, fontSize: isTop ? cqh(40) : cqh(20), color: textColor }}>
            {result.id}. {label}
          </div>
          <div style={styles.dataRow}>
            <span style={{ ...styles.dataShare, fontSize: isTop ? cqh(52) : cqh(32), color: textColor }}>
              {result.voteRate.toFixed(1)}%
            </span>
            <span style={{ ...styles.dataVotes, fontSize: isTop ? cqh(25) : cqh(20) }}>
              {result.votes.toLocaleString()}표
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  stage: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#000',
    containerType: 'size',
  },
  background: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  frame: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  header: {
    height: '22cqh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: H_PAD,
    boxSizing: 'border-box',
  },
  logo: {
    height: cqh(90),
  },
  headerCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: cqh(10),
  },
  title: {
    height: cqh(130),
  },
  countBanner: {
    position: 'relative',
    width: cqh(530),
    height: cqh(92),
    borderRadius: cqh(12),
    border: `${cqh(5)} solid #ffd900`,
    background: '#0d0c6b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: cqh(8),
    boxSizing: 'border-box',
  },
  countBannerLabel: {
    fontSize: cqh(36),
    fontWeight: 700,
    lineHeight: 1,
    color: '#fff',
  },
  countBannerValue: {
    fontSize: cqh(60),
    fontWeight: 900,
    lineHeight: 1,
    color: '#ffe600',
  },
  idleGifBox: {
    height: cqh(743),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: {
    width: cqh(700),
    height: cqh(700),
  },
  body: {
    position: 'relative',
    height: cqh(743),
    paddingInline: H_PAD,
    boxSizing: 'border-box',
  },
  contentRow: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: cqh(12),
  },
  rank1Region: {
    width: cqh(1153),
    height: '100%',
    transition: 'opacity 0.8s ease-in',
    flexShrink: 0,
  },
  firstSectionBox: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  firstSectionImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  firstSectionText: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'baseline',
    gap: cqh(8),
    whiteSpace: 'nowrap',
  },
  firstSectionPercent: {
    fontSize: cqh(60),
    fontWeight: 900,
    lineHeight: 1,
    color: 'rgba(0,0,0,0.82)',
  },
  firstSectionVotes: {
    fontSize: cqh(30),
    fontWeight: 900,
    lineHeight: 1,
    color: 'rgba(0,0,0,0.69)',
  },
  winBadge: {
    position: 'absolute',
    height: cqh(150),
    transform: 'translate(-50%, -50%)',
  },
  rightColumn: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  top23Row: {
    height: cqh(500),
    display: 'flex',
  },
  bot46Row: {
    height: cqh(243),
    display: 'flex',
    transition: 'opacity 0.8s ease-in',
  },
  loseCard: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    height: '100%',
  },
  loseCardBg: {
    position: 'absolute',
    inset: `${cqh(6)} ${cqh(5)}`,
    borderRadius: cqh(20),
    opacity: 0.7,
  },
  loseCardImage: {
    position: 'relative',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  rankIndicator: {
    position: 'absolute',
    top: cqh(10),
    left: cqh(15),
    height: cqh(120),
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: cqh(10),
    paddingBottom: cqh(10),
  },
  rankImage: {
    height: cqh(120),
  },
  rankText: {
    display: 'inline-block',
    fontWeight: 900,
    lineHeight: 1,
    color: 'rgba(0,0,0,0.82)',
    textShadow: `0 0 ${cqh(3)} rgba(255,255,255,0.5)`,
  },
  dataBox: {
    position: 'absolute',
    left: cqh(10),
    bottom: cqh(12),
  },
  dataBoxInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: cqh(2),
    padding: `${cqh(8)} ${cqh(12)}`,
    background: 'rgba(255,255,255,0.6)',
    borderRadius: cqh(10),
  },
  dataLabel: {
    fontWeight: 900,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  dataRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: cqh(6),
  },
  dataShare: {
    fontWeight: 900,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  dataVotes: {
    fontWeight: 600,
    lineHeight: 1,
    color: 'rgba(0,0,0,0.7)',
    whiteSpace: 'nowrap',
  },
  gifOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: cqh(700),
    height: cqh(700),
  },
}
