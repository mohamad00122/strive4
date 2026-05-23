import { useAuth } from './AuthContext'

export function useUnits() {
  const { profile } = useAuth()
  const isKg = profile?.unit_preference === 'kg'

  const display = (lbs) => {
    if (!lbs && lbs !== 0) return '—'
    if (isKg) return `${(lbs * 0.453592).toFixed(1)} kg`
    return `${lbs} lbs`
  }

  const displayNum = (lbs) => {
    if (!lbs && lbs !== 0) return null
    if (isKg) return parseFloat((lbs * 0.453592).toFixed(1))
    return lbs
  }

  const label = isKg ? 'kg' : 'lbs'

  const toStorageLbs = (value) => {
    if (!value && value !== 0) return null
    if (isKg) return parseFloat((value / 0.453592).toFixed(1))
    return parseFloat(value)
  }

  return { display, displayNum, label, isKg, toStorageLbs }
}
