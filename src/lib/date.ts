// 한국 시간(KST, UTC+9, DST 없음) 기준 날짜 유틸. 서버/클라이언트 공용.
const KST_MS = 9 * 60 * 60 * 1000
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** ISO 시각 → 'YYYY-MM-DD' (KST) */
export function kstKey(iso: string | number | Date): string {
  return new Date(new Date(iso).getTime() + KST_MS).toISOString().slice(0, 10)
}

export function todayKey(): string {
  return kstKey(Date.now())
}

/** 'YYYY-MM-DD'(KST) 의 00:00 → ISO(UTC) */
export function dayStartISO(key: string): string {
  return new Date(`${key}T00:00:00+09:00`).toISOString()
}

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function weekday(key: string): string {
  return WEEKDAYS[new Date(`${key}T00:00:00Z`).getUTCDay()]
}

export function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return { y, m, d }
}

/** 'HH:mm' (KST) */
export function kstTime(iso: string): string {
  return new Date(new Date(iso).getTime() + KST_MS).toISOString().slice(11, 16)
}
