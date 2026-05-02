import { useState, useEffect, useRef } from "react"
import PacketInspector from "./Packetinspector"

const API = "http://127.0.0.1:8000"

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

type LogEntry = {
  ts:   string
  type: "info" | "warn" | "error" | "success"
  msg:  string
}

const PROTO_COLOR: Record<string, string> = {
  TCP:   "#3b82f6",
  UDP:   "#f59e0b",
  ICMP:  "#a855f7",
  OTHER: "#6b7280",
}

export default function Monitor({ iface, onExit }: { iface: string; onExit: () => void }) {
  const [packets, setPackets]     = useState<Packet[]>([])
  const [stats, setStats]         = useState<any>(null)
  const [tab, setTab]             = useState<"packets" | "stats">("packets")
  const [running, setRunning]     = useState(true)
  const [statusMsg, setStatusMsg] = useState("")
  const [logs, setLogs]           = useState<LogEntry[]>([])
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null)

  // Filter state
  const [proto, setProto]     = useState("")
  const [srcIp, setSrcIp]     = useState("")
  const [dstIp, setDstIp]     = useState("")
  const [service, setService] = useState("")
  const [applied, setApplied] = useState({ proto: "", srcIp: "", dstIp: "", service: "" })

  const fileRef  = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const logRef   = useRef<HTMLDivElement>(null)

  function addLog(msg: string, type: LogEntry["type"] = "info") {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false })
    setLogs(prev => [...prev.slice(-199), { ts, type, msg }])
  }
  useEffect(() => {
    // Clear frontend state
    setPackets([])
    addLog(`New session started on: ${iface}`, "success")

    // Also clear backend store so it's fully fresh
    fetch(`${API}/api/reset`, { method: "POST" })
}, [iface]) 

  // ── Poll for new packets every 500ms ──
  useEffect(() => {
    addLog(`Capture started on interface: ${iface}`, "success")
    const t = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/api/packets/new`)
        const data: Packet[] = await res.json()
        if (data.length > 0) {
          setPackets(prev => [...prev, ...data])
        }
      } catch {
        addLog("Polling error — backend unreachable", "error")
      }
    }, 500)
    return () => clearInterval(t)
  }, [])

  // ── Auto-scroll table to bottom ──
  useEffect(() => {
    if (tableRef.current)
      tableRef.current.scrollTop = tableRef.current.scrollHeight
  }, [packets])

  // ── Auto-scroll log to bottom ──
  useEffect(() => {
    if (logRef.current)
      logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  // ── Poll stats every 3 seconds ──
  useEffect(() => {
    const load = () =>
      fetch(`${API}/api/stats`).then(r => r.json()).then(setStats)
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  function flash(msg: string) {
    setStatusMsg(msg)
    setTimeout(() => setStatusMsg(""), 3000)
  }

  async function handleStop() {
    await fetch(`${API}/api/stop`, { method: "POST" })
    setRunning(false)
    flash("Capture stopped")
    addLog("Capture stopped by user", "warn")
  }

  async function handleResume() {
    await fetch(`${API}/api/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interface: iface }),
    })
    setRunning(true)
    flash("Capture resumed")
    addLog(`Capture resumed on ${iface}`, "success")
  }

  async function handleReset() {
    if (!confirm("Clear all packets?")) return
    await fetch(`${API}/api/reset`, { method: "POST" })
    setPackets([])
    addLog("All packets cleared", "warn")
    flash("Cleared")
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    addLog(`Importing CSV: ${file.name}`, "info")
    const form = new FormData()
    form.append("file", file)
    const res  = await fetch(`${API}/api/import`, { method: "POST", body: form })
    const data = await res.json()
    const all  = await fetch(`${API}/api/packets`).then(r => r.json())
    setPackets(all)
    flash(data.message)
    addLog(data.message, "success")
    if (fileRef.current) fileRef.current.value = ""
  }

  const filtered = packets.filter(p => {
    if (applied.proto   && p.protocol !== applied.proto)                              return false
    if (applied.srcIp   && !p.src_ip.includes(applied.srcIp))                        return false
    if (applied.dstIp   && !p.dst_ip.includes(applied.dstIp))                        return false
    if (applied.service && p.service.toLowerCase() !== applied.service.toLowerCase()) return false
    return true
  })

  const logColor: Record<LogEntry["type"], string> = {
    info:    "#4ade80",
    warn:    "#f59e0b",
    error:   "#ef4444",
    success: "#22c55e",
  }

  return (
    <div style={css.root}>

      {/* ── Top bar ── */}
      <div style={css.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={css.logo}>
            <span style={{ color: "#22c55e" }}>NET</span>WATCH
          </span>
          <div style={css.ifaceBadge}>
            <span style={{ ...css.dot, background: running ? "#22c55e" : "#ef4444" }} />
            {iface}
          </div>
          {running && (
            <span style={{ color: "#22c55e", fontSize: 11, letterSpacing: 3, animation: "pulse 2s infinite" }}>
              ● LIVE
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {statusMsg && <span style={{ color: "#f59e0b", fontSize: 11 }}>{statusMsg}</span>}
          <span style={{ color: "#4ade80", fontSize: 12, fontFamily: "monospace" }}>
            {packets.length.toLocaleString()} packets captured
          </span>
          <button style={css.btnGhost} onClick={onExit}>← EXIT</button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={css.filterBar}>
        <span style={css.filterLabel}>FILTER</span>
        <div style={css.filterDivider} />

        <select style={css.select} value={proto} onChange={e => setProto(e.target.value)}>
          <option value="">All Protocols</option>
          <option>TCP</option>
          <option>UDP</option>
          <option>ICMP</option>
          <option>OTHER</option>
        </select>

        <input style={css.input} placeholder="Source IP"      value={srcIp}   onChange={e => setSrcIp(e.target.value)} />
        <input style={css.input} placeholder="Destination IP" value={dstIp}   onChange={e => setDstIp(e.target.value)} />
        <input style={css.input} placeholder="Service"        value={service} onChange={e => setService(e.target.value)} />

        <button style={css.btnGreen} onClick={() => setApplied({ proto, srcIp, dstIp, service })}>
          Apply
        </button>
        <button style={css.btnGhost} onClick={() => {
          setProto(""); setSrcIp(""); setDstIp(""); setService("")
          setApplied({ proto: "", srcIp: "", dstIp: "", service: "" })
          addLog("Filters cleared", "info")
        }}>
          Clear
        </button>

        {/* Tabs pushed right */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button
            style={{ ...css.tab, ...(tab === "packets" ? css.tabActive : {}) }}
            onClick={() => setTab("packets")}
          >
            PACKETS ({filtered.length.toLocaleString()})
          </button>
          <button
            style={{ ...css.tab, ...(tab === "stats" ? css.tabActive : {}) }}
            onClick={() => setTab("stats")}
          >
            STATISTICS
          </button>
        </div>
      </div>

      {/* ── Control bar ── */}
      <div style={css.controlBar}>
        {running
          ? <button style={{ ...css.ctrlBtn, color: "#ef4444", borderColor: "#ef4444" }} onClick={handleStop}>⏹ Stop</button>
          : <button style={{ ...css.ctrlBtn, color: "#22c55e", borderColor: "#22c55e" }} onClick={handleResume}>▶ Resume</button>
        }
        <button style={css.ctrlBtn} onClick={handleReset}>🗑 Clear</button>
        <button style={css.ctrlBtn} onClick={() => { window.open(`${API}/api/export`); addLog("CSV export started", "info") }}>
          ⬇ Save CSV
        </button>
        <button style={css.ctrlBtn} onClick={() => fileRef.current?.click()}>📂 Open CSV</button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
      </div>

      {/* ── Main content area ── */}
      <div style={css.mainArea}>

        {/* ── Packets Table ── */}
        {tab === "packets" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Table header */}
            <div style={css.tableHeader}>
              <div style={{ ...css.th, width: COL.id }}>No.</div>
              <div style={{ ...css.th, width: COL.time }}>Time</div>
              <div style={{ ...css.th, flex: 1 }}>Source IP</div>
              <div style={{ ...css.th, width: COL.port }}>Src Port</div>
              <div style={{ ...css.th, flex: 1 }}>Destination IP</div>
              <div style={{ ...css.th, width: COL.port }}>Dst Port</div>
              <div style={{ ...css.th, width: COL.proto }}>Protocol</div>
              <div style={{ ...css.th, width: COL.service }}>Service</div>
              <div style={{ ...css.th, width: COL.size }}>Length</div>
            </div>

            {/* Scrollable rows */}
            <div ref={tableRef} style={css.tableBody}>
              {filtered.length === 0 ? (
                <div style={css.emptyState}>
                  {running ? "Waiting for packets..." : "No packets match filter."}
                </div>
              ) : (
                filtered.map((p, i) => (
    <div
        key={p.id}
        style={{ ...css.tableRow, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)", cursor: "pointer" }}
        onClick={() => setSelectedPacket(p)}   // ← just sets the selected packet
    >
        <div style={{ ...css.td, width: COL.id,   color: "#4b5563" }}>{p.id}</div>
        <div style={{ ...css.td, width: COL.time, color: "#6b7280" }}>{p.time}</div>
        <div style={{ ...css.td, flex: 1,         color: "#22c55e" }}>{p.src_ip}</div>
        <div style={{ ...css.td, width: COL.port, color: "#4b5563" }}>{p.src_port ?? "—"}</div>
        <div style={{ ...css.td, flex: 1,         color: "#60a5fa" }}>{p.dst_ip}</div>
        <div style={{ ...css.td, width: COL.port, color: "#4b5563" }}>{p.dst_port ?? "—"}</div>
        <div style={{ ...css.td, width: COL.proto }}>
            <span style={{ color: PROTO_COLOR[p.protocol] ?? "#6b7280", fontWeight: "bold", fontSize: 11 }}>
                {p.protocol}
            </span>
        </div>
        <div style={{ ...css.td, width: COL.service }}>
            <span style={css.serviceBadge}>{p.service}</span>
        </div>
        <div style={{ ...css.td, width: COL.size, color: "#9ca3af" }}>{p.size} B</div>
    </div>
))
              )}
            </div>
          </div>
        )}

        {/* ── Stats Tab ── */}
        {tab === "stats" && <StatsPanel stats={stats} />}
      </div>

      {/* ── Log panel (Wireshark-style) ── */}
      <div style={css.logPanel}>
        <div style={css.logHeader}>
          <span style={{ color: "#22c55e", fontSize: 10, letterSpacing: 2 }}>CAPTURE LOG</span>
          <span style={{ color: "#374151", fontSize: 10 }}>{logs.length} entries</span>
        </div>
        <div ref={logRef} style={css.logBody}>
          {logs.length === 0 && (
            <span style={{ color: "#374151", fontSize: 11 }}>No log entries yet.</span>
          )}
          {logs.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline", lineHeight: 1.6 }}>
              <span style={{ color: "#374151", fontSize: 10, fontFamily: "monospace", flexShrink: 0 }}>{l.ts}</span>
              <span style={{ color: logColor[l.type], fontSize: 10, fontFamily: "monospace", flexShrink: 0, width: 7, textAlign: "center" }}>
                {l.type === "error" ? "✕" : l.type === "warn" ? "!" : l.type === "success" ? "✓" : "·"}
              </span>
              <span style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace" }}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
      <PacketInspector
        packet={selectedPacket}
        onClose={() => setSelectedPacket(null)}
      />

    </div>
  )
}

function StatsPanel({ stats }: { stats: any }) {
  if (!stats || stats.total === 0)
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 13, letterSpacing: 2 }}>
        NO DATA — CAPTURE SOME PACKETS FIRST
      </div>
    )

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Packets"   value={stats.total.toLocaleString()}                        color="#22c55e" />
        <StatCard label="Total Bytes"     value={`${(stats.total_bytes / 1024).toFixed(1)} KB`}       color="#3b82f6" />
        <StatCard label="Avg Packet Size" value={`${stats.avg_size} B`}                               color="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>

        {/* Protocol breakdown */}
        <div style={css.statBox}>
          <div style={css.statTitle}>Protocol Breakdown</div>
          {Object.entries(stats.by_protocol).map(([p, n]: [string, any]) => (
            <div key={p} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: PROTO_COLOR[p] ?? "#9ca3af", fontSize: 12, fontFamily: "monospace" }}>{p}</span>
                <span style={{ color: "#6b7280", fontSize: 11 }}>{n} ({Math.round(n / stats.total * 100)}%)</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", height: 3, borderRadius: 2 }}>
                <div style={{ background: PROTO_COLOR[p] ?? "#6b7280", width: `${n / stats.total * 100}%`, height: "100%", borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Top Source IPs */}
        <div style={css.statBox}>
          <div style={css.statTitle}>Top Source IPs</div>
          {stats.top_src.map(([ip, n]: [string, number]) => (
            <div key={ip} style={css.statRow}>
              <span style={{ color: "#22c55e", fontSize: 12, fontFamily: "monospace" }}>{ip}</span>
              <span style={{ color: "#4ade80", fontSize: 12 }}>{n}</span>
            </div>
          ))}
        </div>

        {/* Top Destination IPs */}
        <div style={css.statBox}>
          <div style={css.statTitle}>Top Destination IPs</div>
          {stats.top_dst.map(([ip, n]: [string, number]) => (
            <div key={ip} style={css.statRow}>
              <span style={{ color: "#60a5fa", fontSize: 12, fontFamily: "monospace" }}>{ip}</span>
              <span style={{ color: "#93c5fd", fontSize: 12 }}>{n}</span>
            </div>
          ))}
        </div>

        {/* Top Services */}
        <div style={css.statBox}>
          <div style={css.statTitle}>Top Services</div>
          {Object.entries(stats.by_service)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 5)
            .map(([s, n]: [string, any]) => (
              <div key={s} style={css.statRow}>
                <span style={{ color: "#f59e0b", fontSize: 12 }}>{s}</span>
                <span style={{ color: "#fbbf24", fontSize: 12 }}>{n}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: `1px solid ${color}25`, borderRadius: 3, padding: "14px 18px", background: "rgba(0,0,0,0.4)", borderLeft: `3px solid ${color}` }}>
      <div style={{ color, fontSize: 32, fontWeight: "bold", fontFamily: "monospace" }}>{value}</div>
      <div style={{ color: "#4b5563", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{label}</div>
    </div>
  )
}

const COL = {
  id:      "60px",
  time:    "90px",
  port:    "90px",
  proto:   "90px",
  service: "100px",
  size:    "80px",
}

const css: Record<string, React.CSSProperties> = {
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#020d05",
    color: "#e2e8f0",
    fontFamily: "'Courier New', monospace",
    overflow: "hidden",
    backgroundImage: "linear-gradient(rgba(34,197,94,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.02) 1px,transparent 1px)",
    backgroundSize: "30px 30px",
  },

  topBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 20px",
    borderBottom: "1px solid rgba(34,197,94,0.15)",
    background: "rgba(0,0,0,0.75)",
    flexShrink: 0,
  },
  logo:       { fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: -0.5 },
  ifaceBadge: { display: "flex", alignItems: "center", gap: 7, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", padding: "3px 12px", borderRadius: 2, fontSize: 12, color: "#4ade80" },
  dot:        { width: 7, height: 7, borderRadius: "50%", display: "inline-block", flexShrink: 0 },

  filterBar: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "7px 20px",
    borderBottom: "1px solid rgba(34,197,94,0.07)",
    background: "rgba(0,0,0,0.55)",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  filterLabel:  { color: "#22c55e", fontSize: 10, letterSpacing: 3, fontWeight: "bold" },
  filterDivider:{ width: 1, height: 16, background: "rgba(34,197,94,0.2)", margin: "0 4px" },
  select: {
    background: "rgba(0,0,0,0.6)", border: "1px solid rgba(34,197,94,0.2)",
    color: "#e2e8f0", padding: "4px 8px", fontSize: 12, borderRadius: 2,
    fontFamily: "'Courier New',monospace",
  },
  input: {
    background: "rgba(0,0,0,0.6)", border: "1px solid rgba(34,197,94,0.2)",
    color: "#e2e8f0", padding: "4px 10px", fontSize: 12, borderRadius: 2,
    fontFamily: "'Courier New',monospace", width: 140,
  },
  btnGreen: {
    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.45)",
    color: "#22c55e", padding: "4px 16px", fontSize: 11, borderRadius: 2,
    cursor: "pointer", fontFamily: "'Courier New',monospace", letterSpacing: 1,
  },
  btnGhost: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
    color: "#6b7280", padding: "4px 12px", fontSize: 11, borderRadius: 2,
    cursor: "pointer", fontFamily: "'Courier New',monospace",
  },

  // Control bar
  controlBar: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 20px",
    borderBottom: "1px solid rgba(34,197,94,0.05)",
    background: "rgba(0,0,0,0.4)",
    flexShrink: 0,
  },
  ctrlBtn: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
    color: "#d1d5db", padding: "5px 14px", fontSize: 11, borderRadius: 2,
    cursor: "pointer", fontFamily: "'Courier New',monospace",
  },

  // Tabs
  tab: {
    background: "transparent", border: "1px solid rgba(34,197,94,0.12)",
    color: "#4b5563", padding: "5px 18px", fontSize: 10, letterSpacing: 1,
    cursor: "pointer", fontFamily: "'Courier New',monospace", borderRadius: 2,
  },
  tabActive: {
    background: "rgba(34,197,94,0.08)",
    color: "#22c55e",
    borderColor: "rgba(34,197,94,0.5)",
  },

  // Main area
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },

  // Table
  tableHeader: {
    display: "flex", alignItems: "center",
    padding: "0 20px",
    background: "rgba(0,0,0,0.8)",
    borderBottom: "1px solid rgba(34,197,94,0.15)",
    flexShrink: 0,
    minWidth: 0,
  },
  th: {
    padding: "8px 10px",
    fontSize: 10,
    color: "#22c55e",
    letterSpacing: 1,
    fontWeight: "bold",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  tableBody: {
    flex: 1,
    overflowY: "auto",
    padding: "0 20px",
  },
  tableRow: {
    display: "flex", alignItems: "center",
    borderBottom: "1px solid rgba(34,197,94,0.03)",
    minWidth: 0,
  },
  td: {
    padding: "5px 10px",
    fontSize: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flexShrink: 0,
  },
  serviceBadge: {
    fontSize: 10,
    color: "#f59e0b",
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.2)",
    padding: "1px 6px",
    borderRadius: 2,
    letterSpacing: 0.5,
  },
  emptyState: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: 160, color: "#374151", fontSize: 13, letterSpacing: 3,
  },

  // Log panel
  logPanel: {
    flexShrink: 0,
    height: 130,
    borderTop: "1px solid rgba(34,197,94,0.15)",
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    flexDirection: "column",
  },
  logHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "5px 20px",
    borderBottom: "1px solid rgba(34,197,94,0.07)",
    flexShrink: 0,
  },
  logBody: {
    flex: 1,
    overflowY: "auto",
    padding: "6px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  // Stats
  statBox: {
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(34,197,94,0.08)",
    borderRadius: 3,
    padding: "14px 16px",
  },
  statTitle: {
    color: "#22c55e", fontSize: 15, letterSpacing: 2,
    fontWeight: "bold", marginBottom: 12,
    borderBottom: "1px solid rgba(34,197,94,0.1)", paddingBottom: 8,
  },
  statRow: {
    display: "flex", justifyContent: "space-between",
    padding: "5px 0",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
}