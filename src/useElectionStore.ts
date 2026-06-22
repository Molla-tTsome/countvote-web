import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CANDIDATES,
  type CandidateId,
  type CandidateResult,
  type ElectionInputs,
  type ElectionSnapshot,
  type RevealStage,
  type WinStatus,
} from './types'

const EMPTY_VOTE_TEXT: Record<CandidateId, string> = { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' }

// stage별 지연 시간(ms). 각 값은 "이전 단계로부터" 경과 시간 (스펙 표 기준)
const REVEAL_DELAYS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 2500,
  2: 1000,
  3: 2500,
  4: 2500,
  5: 2500,
}

// 빈 문자열이거나 숫자로 해석할 수 없으면 0으로 취급 (입력칸의 placeholder "0"과 동일한 의미)
function parseIntOrZero(text: string): number {
  const n = Number(text)
  return text.trim() !== '' && Number.isFinite(n) ? n : 0
}

export function calculateResults(inputs: ElectionInputs): {
  totalCounted: number
  countRate: number
  results: CandidateResult[]
} {
  const totalVoters = parseIntOrZero(inputs.totalVotersText)
  const votesById = (id: CandidateId) => parseIntOrZero(inputs.voteTextByCandidate[id])
  const invalidVotes = parseIntOrZero(inputs.invalidVotesText)

  const totalCounted = CANDIDATES.reduce((sum, c) => sum + votesById(c.id), 0) + invalidVotes
  const countRate = totalVoters > 0 ? (totalCounted / totalVoters) * 100 : 0

  const ordered = [...CANDIDATES].sort((a, b) => votesById(b.id) - votesById(a.id))

  const ranked: { id: CandidateId; votes: number; voteRate: number; rank: number }[] = []
  ordered.forEach((c, index) => {
    const votes = votesById(c.id)
    const voteRate = totalCounted > 0 ? (votes / totalCounted) * 100 : 0
    const rank = index > 0 && votes === ranked[index - 1].votes ? ranked[index - 1].rank : index + 1
    ranked.push({ id: c.id, votes, voteRate, rank })
  })

  const remainingUncounted = totalVoters - totalCounted
  const rank1 = ranked.filter((r) => r.rank === 1)
  const rank2 = ranked.filter((r) => r.rank === 2)

  const winStatusById = new Map<CandidateId, WinStatus>(CANDIDATES.map((c) => [c.id, 'none']))

  // 순위 1위가 단독일 때만 당선 상태를 판정한다 (공동 1위는 항상 '없음')
  if (rank1.length === 1) {
    const winner = rank1[0]
    const second = rank2[0]
    const secondVotes = second?.votes ?? 0
    const secondVoteRate = second?.voteRate ?? 0

    const isConfirmed = countRate >= 90 && winner.votes - secondVotes > remainingUncounted
    const isLeading =
      countRate >= 50 && winner.voteRate >= 35 && winner.voteRate - secondVoteRate >= 15

    if (isConfirmed) winStatusById.set(winner.id, 'confirmed')
    else if (isLeading) winStatusById.set(winner.id, 'leading')
  }

  const results: CandidateResult[] = CANDIDATES.map((c) => {
    const r = ranked.find((x) => x.id === c.id)!
    return {
      id: c.id,
      votes: r.votes,
      voteRate: r.voteRate,
      rank: r.rank,
      winStatus: winStatusById.get(c.id) ?? 'none',
    }
  })

  return { totalCounted, countRate, results }
}

export interface ElectionStore {
  inputs: ElectionInputs
  setTotalVotersText: (value: string) => void
  setCandidateVotesText: (id: CandidateId, value: string) => void
  setInvalidVotesText: (value: string) => void
  liveTotalCounted: number
  liveCountRate: number
  liveResults: CandidateResult[]
  snapshot: ElectionSnapshot | null
  revealStage: RevealStage
  reveal: () => void
  reset: () => void
}

export function useElectionStore(): ElectionStore {
  const [inputs, setInputs] = useState<ElectionInputs>({
    totalVotersText: '',
    voteTextByCandidate: { ...EMPTY_VOTE_TEXT },
    invalidVotesText: '',
  })
  const [snapshot, setSnapshot] = useState<ElectionSnapshot | null>(null)
  const [revealStage, setRevealStage] = useState<RevealStage>(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const setTotalVotersText = useCallback((value: string) => {
    setInputs((prev) => ({ ...prev, totalVotersText: value }))
  }, [])

  const setCandidateVotesText = useCallback((id: CandidateId, value: string) => {
    setInputs((prev) => ({
      ...prev,
      voteTextByCandidate: { ...prev.voteTextByCandidate, [id]: value },
    }))
  }, [])

  const setInvalidVotesText = useCallback((value: string) => {
    setInputs((prev) => ({ ...prev, invalidVotesText: value }))
  }, [])

  const live = useMemo(() => calculateResults(inputs), [inputs])

  const reveal = useCallback(() => {
    clearTimers()
    const computed = calculateResults(inputs)
    setSnapshot({ inputs, ...computed, publishedAt: Date.now() })
    setRevealStage(0)

    let elapsed = 0
    ;([1, 2, 3, 4, 5] as const).forEach((stage) => {
      elapsed += REVEAL_DELAYS[stage]
      const timer = setTimeout(() => setRevealStage(stage), elapsed)
      timers.current.push(timer)
    })
  }, [inputs, clearTimers])

  const reset = useCallback(() => {
    clearTimers()
    setSnapshot(null)
    setRevealStage(0)
    setInputs({
      totalVotersText: '',
      voteTextByCandidate: { ...EMPTY_VOTE_TEXT },
      invalidVotesText: '',
    })
  }, [clearTimers])

  return {
    inputs,
    setTotalVotersText,
    setCandidateVotesText,
    setInvalidVotesText,
    liveTotalCounted: live.totalCounted,
    liveCountRate: live.countRate,
    liveResults: live.results,
    snapshot,
    revealStage,
    reveal,
    reset,
  }
}
