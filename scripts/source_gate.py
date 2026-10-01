"""License Gate de la cola de fuentes. Deriva el resultado del gate y el estado de ingesta SOLO de data/license-registry.json (fuente unica de verdad); nada se escribe a mano.
Estados de ingesta: DISCOVERED -> LICENSE_REVIEW -> READY -> INGESTING -> ACTIVE (o BLOCKED).
  READY exige: licencia VERIFIED en el registro con uso comercial y derivados 'yes', y dataset concreto identificado. Los bloqueos tecnicos (token, scraping, etc.) no cambian el gate pero impiden empezar (canStart=false).
  INGESTING/ACTIVE exigen un gate READY, salvo las fuentes YA integradas que el registro marca used=true (se muestran como ACTIVE con su licencia tal cual, incluida PENDING)."""
STATUS_ORDER = ['DISCOVERED', 'LICENSE_REVIEW', 'READY', 'INGESTING', 'ACTIVE', 'BLOCKED']

def license_view(reg):
    return reg['status'] if reg else 'UNREVIEWED'

def gate(reg, seed):
    """-> (result, reasons). result: READY | NOT_READY | BLOCKED."""
    if seed.get('decisionBlock'): return 'BLOCKED', ['Decision documentada: ' + seed['decisionBlock']]
    if not reg: return 'NOT_READY', ['Licencia sin revisar: la fuente no esta en data/license-registry.json']
    st = reg['status']
    if st in ('RESTRICTED', 'BLOCKED'): return 'BLOCKED', ['Registro: %s (%s)' % (st, reg.get('licenseId'))]
    if st == 'PENDING': return 'NOT_READY', ['Registro: PENDING (licencia poco clara o no verificable)']
    why = []
    if reg.get('commercialUse') != 'yes': why.append('uso comercial %s' % reg.get('commercialUse'))
    if reg.get('derivatives') != 'yes': why.append('derivados %s' % reg.get('derivatives'))
    if why: return 'NOT_READY', ['VERIFIED pero con condiciones no inequivocas: ' + ', '.join(why)]
    return 'READY', ['Registro: VERIFIED, uso comercial y derivados permitidos']

def ingestion(gate_result, reg, seed):
    if gate_result == 'BLOCKED': return 'BLOCKED'
    if gate_result == 'READY': return 'READY' if seed.get('datasetIdentified') else 'DISCOVERED'
    return 'LICENSE_REVIEW' if reg else 'DISCOVERED'
