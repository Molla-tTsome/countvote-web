// 후보 기호 (1~6번, 고정)
export type CandidateId = 1 | 2 | 3 | 4 | 5 | 6

export interface CandidateInfo {
  id: CandidateId
  party: string
  name: string
}

// 후보 고정 데이터 (기호 순)
export const CANDIDATES: CandidateInfo[] = [
  { id: 1, party: '포도당', name: '웰치스(포도)+데미소다(청포도)' },
  { id: 2, party: '제로없당', name: '펩시콜라+칠성사이다' },
  { id: 3, party: '초코당', name: '초코에몽+제티' },
  { id: 4, party: '무소속', name: '이프로(2%)' },
  { id: 5, party: '무소속', name: '암바사' },
  { id: 6, party: '무소속', name: '솔의 눈' },
]

// 입력 패널에서 받는 원본 입력값 (입력 칸의 텍스트 그대로 보관, 빈 문자열 = 미입력)
export interface ElectionInputs {
  totalVotersText: string
  voteTextByCandidate: Record<CandidateId, string>
  invalidVotesText: string
}

// 당선 상태
export type WinStatus = 'confirmed' | 'leading' | 'none'

// 후보별 계산 결과
export interface CandidateResult {
  id: CandidateId
  votes: number
  voteRate: number // 득표율 (%), 총 개표 수 기준
  rank: number // 순위 (동점이면 같은 순위)
  winStatus: WinStatus
}

// "결과 공개" 시점에 저장되는 스냅샷
export interface ElectionSnapshot {
  inputs: ElectionInputs
  totalCounted: number // 총 개표 수
  countRate: number // 개표율 (%)
  results: CandidateResult[] // 기호 순
  publishedAt: number // 공개를 누른 시각 (Date.now())
}

// 결과 공개 순차 시퀀스 단계
export type RevealStage = 0 | 1 | 2 | 3 | 4 | 5
