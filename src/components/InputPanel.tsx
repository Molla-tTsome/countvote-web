import type { CSSProperties } from 'react'
import { CANDIDATES, type CandidateId, type WinStatus } from '../types'
import type { ElectionStore } from '../useElectionStore'

const WIN_STATUS_LABEL: Record<WinStatus, string> = {
  confirmed: '당선확정',
  leading: '당선유력',
  none: '',
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function countRateColor(rate: number): string {
  if (rate >= 70) return '#d32f2f'
  if (rate >= 30) return '#e6841f'
  return '#222'
}

function statusColor(status: WinStatus): string {
  return status === 'confirmed' ? '#d32f2f' : '#e6841f'
}

export default function InputPanel({ store }: { store: ElectionStore }) {
  const {
    inputs,
    setTotalVotersText,
    setCandidateVotesText,
    setInvalidVotesText,
    liveTotalCounted,
    liveCountRate,
    liveResults,
    snapshot,
    reveal,
    reset,
  } = store

  return (
    <div style={styles.container}>
      {/* 개표 현황 헤더 */}
      <div style={styles.headerRow}>
        <div style={styles.headerField}>
          <span>총 유권자</span>
          <input
            style={styles.smallInput}
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={inputs.totalVotersText}
            onChange={(e) => setTotalVotersText(e.target.value)}
          />
          <span>명</span>
        </div>
        <div style={styles.spacer} />
        <span>총 개표: {liveTotalCounted.toLocaleString()}표</span>
        <span style={{ color: countRateColor(liveCountRate), fontWeight: 600 }}>
          개표율: {formatPercent(liveCountRate)}
        </span>
      </div>

      <hr style={styles.divider} />

      {/* 후보별 입력 테이블 */}
      <table style={styles.table}>
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '27%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '17%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={styles.th}>기호</th>
            <th style={styles.th}>당명</th>
            <th style={styles.th}>후보명</th>
            <th style={styles.th}>득표 수</th>
            <th style={styles.th}>순위</th>
            <th style={styles.th}>득표율</th>
            <th style={styles.th}>상태</th>
          </tr>
        </thead>
        <tbody>
          {CANDIDATES.map((c) => {
            const result = liveResults.find((r) => r.id === c.id)!
            return (
              <tr key={c.id}>
                <td style={styles.td}>{c.id}번</td>
                <td style={styles.td}>{c.party}</td>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>
                  <input
                    style={styles.smallInput}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={inputs.voteTextByCandidate[c.id]}
                    onChange={(e) => setCandidateVotesText(c.id as CandidateId, e.target.value)}
                  />
                </td>
                <td style={styles.td}>{result.rank}위</td>
                <td style={styles.td}>{formatPercent(result.voteRate)}</td>
                <td style={{ ...styles.td, color: statusColor(result.winStatus), fontWeight: 600, opacity: result.winStatus === 'none' ? 0 : 1 }}>
                  {WIN_STATUS_LABEL[result.winStatus]}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <hr style={styles.divider} />

      {/* 무효표 */}
      <div style={styles.invalidRow}>
        <span style={styles.invalidLabel}>무효표</span>
        <input
          style={styles.smallInput}
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={inputs.invalidVotesText}
          onChange={(e) => setInvalidVotesText(e.target.value)}
        />
      </div>

      <hr style={styles.divider} />

      {/* 결과 공개 / 초기화 */}
      <div style={styles.buttonRow}>
        <button style={styles.revealButton} onClick={reveal}>
          결과 공개
        </button>
        <button style={styles.resetButton} onClick={reset}>
          초기화
        </button>
        {snapshot && (
          <span style={styles.publishedAt}>
            마지막 공개:{' '}
            {new Date(snapshot.publishedAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
    width: '100%',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
  },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 24,
  },
  headerField: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  spacer: {
    flex: 1,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e0e0e0',
    margin: 0,
    width: '100%',
  },
  smallInput: {
    width: 80,
    fontSize: 15,
    padding: '5px 8px',
    borderRadius: 6,
    border: '1px solid #ccc',
    boxSizing: 'border-box',
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '4px 10px',
    fontWeight: 700,
    overflow: 'hidden',
  },
  td: {
    padding: '6px 10px',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  invalidRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  invalidLabel: {
    width: 60,
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  revealButton: {
    padding: '10px 20px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    background: '#aa3bff',
    color: '#fff',
    cursor: 'pointer',
  },
  resetButton: {
    padding: '10px 16px',
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #ccc',
    background: '#fff',
    cursor: 'pointer',
  },
  publishedAt: {
    fontSize: 13,
    color: '#888',
  },
}
