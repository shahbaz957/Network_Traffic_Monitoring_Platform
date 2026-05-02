import { useEffect } from "react"

type Packet = {
  id:       number
  time:     string
  src_ip:   string
  dst_ip:   string
  src_port: number | null
  dst_port: number | null
  protocol: string
  service:  string
  size:     number
}

const PROTO_COLOR: Record<string, string> = {
  TCP:   "#3b82f6",
  UDP:   "#f59e0b",
  ICMP:  "#a855f7",
  OTHER: "#6b7280",
}

const SERVICE_COLOR: Record<string, string> = {
  HTTPS:  "#22c55e",
  HTTP:   "#3b82f6",
  DNS:    "#f59e0b",
  SSH:    "#a855f7",
  FTP:    "#ef4444",
  SMTP:   "#ec4899",
  SMB:    "#f97316",
}

interface Props {
  packet:  Packet | null
  onClose: () => void
}

export default function PacketInspector({ packet, onClose }: Props) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!packet) return null

  const protoColor   = PROTO_COLOR[packet.protocol]  ?? "#6b7280"
  const serviceColor = SERVICE_COLOR[packet.service] ?? "#4ade80"

  return (
    // Backdrop
    <div style={css.backdrop} onClick={onClose}>

      {/* Box — stop click propagating to backdrop */}
      <div style={css.box} onClick={e => e.stopPropagation()}>

        {/* Animated corner accents */}
        <div style={{ ...css.corner, top: -1,  left: -1,  borderTop:  "2px solid #22c55e", borderLeft:  "2px solid #22c55e" }} />
        <div style={{ ...css.corner, top: -1,  right: -1, borderTop:  "2px solid #22c55e", borderRight: "2px solid #22c55e" }} />
        <div style={{ ...css.corner, bottom: -1, left: -1,  borderBottom: "2px solid #22c55e", borderLeft:  "2px solid #22c55e" }} />
        <div style={{ ...css.corner, bottom: -1, right: -1, borderBottom: "2px solid #22c55e", borderRight: "2px solid #22c55e" }} />

        {/* Header */}
        <div style={css.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={css.headerIcon}>⬡</div>
            <div>
              <div style={css.headerTitle}>PACKET INSPECTOR</div>
              <div style={css.headerSub}>
                <span style={{ color: "#4b5563" }}>FRAME </span>
                <span style={{ color: "#22c55e" }}>#{String(packet.id).padStart(4, "0")}</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button style={css.closeBtn} onClick={onClose} title="Close (Esc)">
            <span style={{ fontSize: 14, lineHeight: 1 }}>✕</span>
          </button>
        </div>

        {/* Scan line divider */}
        <div style={css.scanLine} />

        {/* Content */}
        <div style={css.content}>

          {/* Protocol + Service badges row */}
          <div style={css.badgeRow}>
            <div style={{ ...css.protoBadge, borderColor: protoColor, color: protoColor, boxShadow: `0 0 8px ${protoColor}30` }}>
              <span style={{ fontSize: 9, letterSpacing: 2, opacity: 0.6 }}>PROTO</span>
              <span style={{ fontSize: 18, fontWeight: "bold", letterSpacing: 1 }}>{packet.protocol}</span>
            </div>
            <div style={{ ...css.protoBadge, borderColor: serviceColor, color: serviceColor, boxShadow: `0 0 8px ${serviceColor}30` }}>
              <span style={{ fontSize: 9, letterSpacing: 2, opacity: 0.6 }}>SERVICE</span>
              <span style={{ fontSize: 18, fontWeight: "bold", letterSpacing: 1 }}>{packet.service}</span>
            </div>
            <div style={{ ...css.protoBadge, borderColor: "#374151", color: "#9ca3af" }}>
              <span style={{ fontSize: 9, letterSpacing: 2, opacity: 0.6 }}>SIZE</span>
              <span style={{ fontSize: 18, fontWeight: "bold", letterSpacing: 1 }}>{packet.size}<span style={{ fontSize: 11, marginLeft: 3 }}>B</span></span>
            </div>
            <div style={{ ...css.protoBadge, borderColor: "#374151", color: "#6b7280" }}>
              <span style={{ fontSize: 9, letterSpacing: 2, opacity: 0.6 }}>TIME</span>
              <span style={{ fontSize: 14, fontWeight: "bold", letterSpacing: 1 }}>{packet.time}</span>
            </div>
          </div>

          {/* Network flow diagram */}
          <div style={css.flowSection}>
            <div style={css.flowLabel}>NETWORK FLOW</div>
            <div style={css.flowRow}>

              {/* Source */}
              <div style={css.flowEndpoint}>
                <div style={css.flowEndpointLabel}>SOURCE</div>
                <div style={{ ...css.flowIp, color: "#22c55e" }}>{packet.src_ip}</div>
                <div style={css.flowPort}>
                  PORT <span style={{ color: "#22c55e" }}>{packet.src_port ?? "—"}</span>
                </div>
              </div>

              {/* Arrow */}
              <div style={css.flowArrow}>
                <div style={{ ...css.flowArrowLine, background: protoColor }} />
                <div style={{ color: protoColor, fontSize: 11, letterSpacing: 1, margin: "4px 0" }}>
                  ──── {packet.protocol} ────▶
                </div>
                <div style={{ ...css.flowArrowLine, background: protoColor }} />
              </div>

              {/* Destination */}
              <div style={{ ...css.flowEndpoint, alignItems: "flex-end" }}>
                <div style={css.flowEndpointLabel}>DESTINATION</div>
                <div style={{ ...css.flowIp, color: "#60a5fa" }}>{packet.dst_ip}</div>
                <div style={css.flowPort}>
                  PORT <span style={{ color: "#60a5fa" }}>{packet.dst_port ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Raw fields table */}
          <div style={css.tableSection}>
            <div style={css.flowLabel}>RAW FIELDS</div>
            <div style={css.fieldGrid}>
              <Field label="FRAME ID"    value={`#${String(packet.id).padStart(4, "0")}`} />
              <Field label="TIMESTAMP"   value={packet.time} />
              <Field label="PROTOCOL"    value={packet.protocol}  color={protoColor} />
              <Field label="SERVICE"     value={packet.service}   color={serviceColor} />
              <Field label="SOURCE IP"   value={packet.src_ip}    color="#22c55e" />
              <Field label="SOURCE PORT" value={packet.src_port != null ? String(packet.src_port) : "N/A"} />
              <Field label="DST IP"      value={packet.dst_ip}    color="#60a5fa" />
              <Field label="DST PORT"    value={packet.dst_port  != null ? String(packet.dst_port)  : "N/A"} />
              <Field label="SIZE"        value={`${packet.size} bytes`} />
              <Field label="DIRECTION"   value={packet.src_port === 443 || packet.dst_port === 443 ? "ENCRYPTED" : "PLAIN"} color={packet.dst_port === 443 || packet.src_port === 443 ? "#22c55e" : "#f59e0b"} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={css.footer}>
          <span style={{ color: "#1f2937", fontSize: 10, letterSpacing: 2 }}>
            NETWATCH // PACKET ANALYSIS ENGINE v1.0
          </span>
          <span style={{ color: "#1f2937", fontSize: 10 }}>ESC TO CLOSE</span>
        </div>

      </div>
    </div>
  )
}

// Small reusable field row
function Field({ label, value, color = "#e2e8f0" }: { label: string; value: string; color?: string }) {
  return (
    <div style={css.fieldRow}>
      <span style={css.fieldLabel}>{label}</span>
      <span style={{ ...css.fieldValue, color }}>{value}</span>
    </div>
  )
}

const css: Record<string, React.CSSProperties> = {
  // Backdrop
  backdrop: {
    position:        "fixed",
    inset:           0,
    background:      "rgba(0,0,0,0.75)",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    zIndex:          1000,
    backdropFilter:  "blur(2px)",
  },

  // Main box
  box: {
    position:        "relative",
    width:           "min(640px, 95vw)",
    background:      "#020d05",
    border:          "1px solid rgba(34,197,94,0.25)",
    borderRadius:    2,
    fontFamily:      "'Courier New', monospace",
    color:           "#e2e8f0",
    boxShadow:       "0 0 60px rgba(34,197,94,0.08), 0 0 120px rgba(0,0,0,0.8)",
    backgroundImage: "linear-gradient(rgba(34,197,94,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.015) 1px,transparent 1px)",
    backgroundSize:  "20px 20px",
  },

  // Corner accent brackets
  corner: {
    position: "absolute",
    width:    12,
    height:   12,
  },

  // Header
  header: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    padding:        "14px 18px",
  },
  headerIcon: {
    fontSize:   22,
    color:      "#22c55e",
    lineHeight: 1,
  },
  headerTitle: {
    color:         "#22c55e",
    fontSize:      13,
    fontWeight:    "bold",
    letterSpacing: 3,
  },
  headerSub: {
    fontSize:      11,
    letterSpacing: 2,
    marginTop:     2,
  },
  closeBtn: {
    background:   "transparent",
    border:       "1px solid rgba(239,68,68,0.4)",
    color:        "#ef4444",
    width:        28,
    height:       28,
    borderRadius: 2,
    cursor:       "pointer",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    fontFamily:   "'Courier New', monospace",
    flexShrink:   0,
  },

  // Scan line
  scanLine: {
    height:     1,
    background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)",
    margin:     "0 18px",
  },

  // Content
  content: {
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  // Badge row
  badgeRow: {
    display:   "flex",
    gap:       10,
    flexWrap:  "wrap",
  },
  protoBadge: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    gap:           2,
    padding:       "10px 16px",
    border:        "1px solid",
    borderRadius:  2,
    minWidth:      80,
    background:    "rgba(0,0,0,0.4)",
  },

  // Flow section
  flowSection: {
    background:   "rgba(0,0,0,0.4)",
    border:       "1px solid rgba(34,197,94,0.08)",
    borderRadius: 2,
    padding:      "14px 16px",
  },
  flowLabel: {
    color:         "#22c55e",
    fontSize:      9,
    letterSpacing: 3,
    marginBottom:  12,
    borderBottom:  "1px solid rgba(34,197,94,0.08)",
    paddingBottom: 8,
  },
  flowRow: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            8,
  },
  flowEndpoint: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "flex-start",
    gap:           4,
    minWidth:      140,
  },
  flowEndpointLabel: {
    color:         "#374151",
    fontSize:      9,
    letterSpacing: 2,
  },
  flowIp: {
    fontSize:   15,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  flowPort: {
    color:         "#4b5563",
    fontSize:      11,
    letterSpacing: 1,
  },
  flowArrow: {
    flex:          1,
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    fontSize:      11,
    color:         "#374151",
    letterSpacing: 1,
  },
  flowArrowLine: {
    height:      1,
    width:       "100%",
    opacity:     0.2,
  },

  // Raw fields table
  tableSection: {
    background:   "rgba(0,0,0,0.4)",
    border:       "1px solid rgba(34,197,94,0.08)",
    borderRadius: 2,
    padding:      "14px 16px",
  },
  fieldGrid: {
    display:             "grid",
    gridTemplateColumns: "1fr 1fr",
    gap:                 "2px 16px",
  },
  fieldRow: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    padding:        "6px 0",
    borderBottom:   "1px solid rgba(255,255,255,0.03)",
  },
  fieldLabel: {
    color:         "#374151",
    fontSize:      10,
    letterSpacing: 1,
    flexShrink:    0,
  },
  fieldValue: {
    fontSize:   12,
    fontFamily: "monospace",
    textAlign:  "right",
  },

  // Footer
  footer: {
    display:        "flex",
    justifyContent: "space-between",
    padding:        "8px 18px",
    borderTop:      "1px solid rgba(34,197,94,0.06)",
  },
}