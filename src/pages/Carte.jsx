import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Zap, RefreshCw, Map as MapIcon, List } from 'lucide-react'
import { useQuartiers } from '../hooks/useQuartiers'
import QuartierCard from '../components/QuartierCard'
import { formatRelative } from '../utils/statut'

const FILTRES = [
  { key: 'tous',      label: 'Tous'    },
  { key: 'coupure',   label: 'Coupé'   },
  { key: 'retabli',   label: 'Revenu'  },
  { key: 'incertain', label: 'Inconnu' },
]

const STATUS_STYLE = {
  coupure:  { fillColor: '#DC2626', color: '#991B1B', label: 'Coupé'   },
  retabli:  { fillColor: '#16A34A', color: '#166534', label: 'Revenu'  },
  incertain:{ fillColor: '#D97706', color: '#B45309', label: 'Inconnu' },
}

export default function Carte() {
  const { quartiers, loading, error, lastUpdate, refresh } = useQuartiers()
  const [vue, setVue]             = useState('carte')
  const [filtre, setFiltre]       = useState('tous')
  const [recherche, setRecherche] = useState('')
  const [headerH, setHeaderH]     = useState(160)
  const headerRef                 = useRef(null)

  useLayoutEffect(() => {
    if (headerRef.current) setHeaderH(headerRef.current.offsetHeight)
  }, [vue])

  const filtered = quartiers
    .filter(q => filtre === 'tous' || q.statut === filtre)
    .filter(q => q.nom.toLowerCase().includes(recherche.toLowerCase()))

  const filteredSorted = filtered.slice().sort((a, b) => {
    const order = { coupure: 0, incertain: 1, retabli: 2 }
    return (order[a.statut] ?? 3) - (order[b.statut] ?? 3)
  })

  const nbCoupures = quartiers.filter(q => q.statut === 'coupure').length

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header ─────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="sticky top-0 z-40"
        style={{ background: 'var(--bg-topbar)', borderBottom: '1px solid var(--border)', paddingTop: 'calc(var(--safe-top) + 12px)' }}
      >
        {/* Titre + badge + refresh */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Voltis
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Ouagadougou · SONABEL
            </p>
          </div>
          <div className="flex items-center gap-2">
            {nbCoupures > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full"
                style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-bd)' }}>
                <Zap size={12} strokeWidth={2.5} />
                {nbCoupures} secteur{nbCoupures > 1 ? 's' : ''} coupé{nbCoupures > 1 ? 's' : ''}
              </span>
            )}
            <button onClick={refresh}
              className="flex items-center justify-center rounded-[10px]"
              style={{ width: '44px', height: '44px', background: 'var(--bg-surface2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <RefreshCw size={16} strokeWidth={2} style={{ animation: loading ? 'spin-slow 0.8s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Toggle Carte / Liste */}
        <div className="px-4 pb-3">
          <div className="flex rounded-[10px] p-[3px]"
            style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)' }}>
            {[
              { key: 'carte', Icon: MapIcon, label: 'Carte' },
              { key: 'liste', Icon: List,    label: 'Liste' },
            ].map(({ key, Icon, label }) => (
              <button key={key} onClick={() => setVue(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-sm font-semibold transition-all"
                style={{
                  background: vue === key ? 'var(--bg-topbar)' : 'transparent',
                  color:      vue === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow:  vue === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                }}>
                <Icon size={14} strokeWidth={2} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Recherche + filtres (liste seulement) */}
        {vue === 'liste' && (
          <>
            <div className="relative px-4 pb-3">
              <Search size={14} strokeWidth={2}
                className="absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Chercher un quartier…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                className="w-full rounded-[10px] pl-9 pr-3 py-2.5 outline-none"
                style={{ fontSize: '16px', background: 'var(--bg-surface2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-3 px-4" style={{ scrollbarWidth: 'none' }}>
              {FILTRES.map(f => (
                <button key={f.key} onClick={() => setFiltre(f.key)}
                  className="shrink-0 text-sm font-semibold px-4 rounded-[10px] transition-all"
                  style={{
                    height: '44px',
                    background: filtre === f.key ? 'var(--text-primary)' : 'var(--bg-surface)',
                    color:      filtre === f.key ? 'var(--bg-main)'      : 'var(--text-secondary)',
                    border:     `1px solid ${filtre === f.key ? 'transparent' : 'var(--border)'}`,
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      {/* ── Vue Carte ──────────────────────────────────── */}
      {vue === 'carte' && (
        <div style={{
          position:   'fixed',
          top:        `${headerH}px`,
          bottom:     'calc(64px + env(safe-area-inset-bottom))',
          left:       0,
          right:      0,
          zIndex:     10,
          overflow:   'hidden',
        }}>
          <MapView quartiers={filtered} />

          {/* Légende */}
          <div style={{
            position: 'absolute', bottom: '16px', left: '12px', zIndex: 1000,
            background: 'var(--bg-topbar)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '10px 14px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            {Object.entries(STATUS_STYLE).map(([key, s]) => (
              <div key={key} className="flex items-center gap-2 py-0.5">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.fillColor, flexShrink: 0 }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vue Liste ──────────────────────────────────── */}
      {vue === 'liste' && (
        <div className="flex-1 px-4 py-3 space-y-2">
          {error && (
            <div className="rounded-[10px] p-4 text-sm text-center"
              style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-bd)' }}>
              {error}
            </div>
          )}
          {loading && !quartiers.length && Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="skeleton rounded-[12px]" style={{ height: '68px', opacity: Math.max(1 - i * 0.07, 0.2) }} />
          ))}
          {!loading && filtered.length === 0 && quartiers.length > 0 && (
            <div className="rounded-[12px] p-8 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Aucun résultat</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Essayez un autre filtre ou terme de recherche.</p>
            </div>
          )}
          {filteredSorted.map(q => <QuartierCard key={q.id} quartier={q} />)}
          {lastUpdate && (
            <div className="flex items-center justify-center gap-1.5 py-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Actualisé {formatRelative(lastUpdate.toISOString())} · auto 30s
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Composant carte Leaflet ───────────────────────── */
function MapView({ quartiers }) {
  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef     = useRef([])
  const navigate       = useNavigate()

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(mod => {
      const L = mod.default
      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center:             [12.3647, -1.5348],
        zoom:               13,
        zoomControl:        false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom:      19,
        subdomains:   'abcd',
        detectRetina: true,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.attribution({ prefix: '© OpenStreetMap · © CARTO' }).addTo(map)

      mapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!quartiers.length) return

    Promise.all([import('leaflet'), import('d3-delaunay')]).then(([leafletMod, d3Mod]) => {
      const L          = leafletMod.default
      const { Delaunay } = d3Mod
      const map        = mapInstanceRef.current
      if (!map) return

      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      // Boîte englobante serrée autour d'Ouagadougou [minLon, minLat, maxLon, maxLat]
      const EXTENT = [-1.68, 12.25, -1.39, 12.50]

      const points   = quartiers.map(q => [q.longitude, q.latitude])
      const delaunay = Delaunay.from(points)
      const voronoi  = delaunay.voronoi(EXTENT)

      quartiers.forEach((q, i) => {
        const cell = voronoi.cellPolygon(i)
        if (!cell) return

        const s         = STATUS_STYLE[q.statut] ?? STATUS_STYLE.incertain
        const isCoupure = q.statut === 'coupure'

        // d3 retourne [lon, lat] → Leaflet attend [lat, lon]
        const latlngs = cell.map(([lon, lat]) => [lat, lon])

        const poly = L.polygon(latlngs, {
          fillColor:    s.fillColor,
          color:        '#ffffff',
          weight:       1.5,
          opacity:      0.85,
          fillOpacity:  isCoupure ? 0.55 : 0.28,
          smoothFactor: 1,
        })

        poly.bindTooltip(
          `<div style="font-family:-apple-system,sans-serif;padding:2px 0">
             <strong style="font-size:13px">${q.nom}</strong>
             <br/><span style="color:#6B7280;font-size:11px">Secteur ${q.secteur}</span>
             <br/><span style="color:${s.fillColor};font-size:12px;font-weight:700">${s.label}</span>
           </div>`,
          { sticky: true }
        )

        poly.on('click',     () => navigate(`/quartier/${q.id}`))
        poly.on('mouseover', () => poly.setStyle({ fillOpacity: isCoupure ? 0.72 : 0.50 }))
        poly.on('mouseout',  () => poly.setStyle({ fillOpacity: isCoupure ? 0.55 : 0.28 }))
        poly.addTo(map)
        markersRef.current.push(poly)

        // Label centré sur la zone
        const cx = cell.reduce((acc, [x]) => acc + x, 0) / cell.length
        const cy = cell.reduce((acc, [, y]) => acc + y, 0) / cell.length

        const label = L.marker([cy, cx], {
          icon: L.divIcon({
            className: '',
            html: `<div style="
              font-family:-apple-system,sans-serif;
              font-size:9px;
              font-weight:800;
              color:#111827;
              white-space:nowrap;
              text-shadow:0 0 4px #fff,0 0 4px #fff,0 0 4px #fff;
              pointer-events:none;
              text-align:center;
            ">${q.nom}</div>`,
            iconSize:   [80, 14],
            iconAnchor: [40, 7],
          }),
          interactive: false,
          zIndexOffset: 100,
        })
        label.addTo(map)
        markersRef.current.push(label)
      })
    })
  }, [quartiers, navigate])

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
}
