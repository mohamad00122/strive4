import Badge from './Badge'

export function IntakeSheet({ intakeForm }) {
  if (!intakeForm) return <div style={{ color: 'var(--text3)', fontSize: 13, padding: 20, textAlign: 'center' }}>No intake form on file.</div>

  const f = intakeForm
  const yesNo = (v) => v === true ? <Badge variant="red">Yes</Badge> : v === false ? <Badge variant="green">No</Badge> : <Badge variant="gray">—</Badge>
  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{value}</span>
    </div>
  )

  const goalMap = { build_muscle: 'Build Muscle', lose_weight: 'Lose Weight', endurance: 'Endurance', general_fitness: 'General Fitness' }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>Profile</div>
        <Row label="Age" value={f.age || '—'} />
        <Row label="Weight" value={f.weight || '—'} />
        <Row label="Height" value={f.height || '—'} />
        <Row label="Fitness Goal" value={<Badge variant="amber">{goalMap[f.fitness_goal] || f.fitness_goal || '—'}</Badge>} />
        {f.goal_weight_lbs && <Row label="Goal Weight" value={`${f.goal_weight_lbs} lbs`} />}
      </div>
      <div className="section-title" style={{ marginBottom: 8 }}>PAR-Q Health Questions</div>
      <Row label="Heart condition" value={yesNo(f.heart_condition)} />
      <Row label="Chest pain (activity)" value={yesNo(f.chest_pain_activity)} />
      <Row label="Chest pain (rest)" value={yesNo(f.chest_pain_rest)} />
      <Row label="Dizziness / loss of balance" value={yesNo(f.dizziness)} />
      <Row label="Bone / joint problems" value={yesNo(f.bone_joint_problem)} />
      <Row label="Prescription medication" value={yesNo(f.prescription_medication)} />
      <Row label="Other reason" value={yesNo(f.other_reason)} />
      {f.other_reason_details && (
        <div style={{ marginTop: 8, padding: 10, background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
          {f.other_reason_details}
        </div>
      )}
    </div>
  )
}

export function DocumentsSheet({ documents = [] }) {
  if (!documents.length) return <div style={{ color: 'var(--text3)', fontSize: 13, padding: 20, textAlign: 'center' }}>No documents signed.</div>

  const typeLabel = { liability_waiver: 'Liability Waiver', training_contract: 'Training Contract' }

  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {typeLabel[doc.document_type] || doc.document_type}
            </div>
            <Badge variant="green">Signed</Badge>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          {doc.signed_as && (
            <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--amber)', marginTop: 6 }}>
              "{doc.signed_as}"
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
