import { useState, useEffect } from "react"

const API = "http://127.0.0.1:8000"

export default function InterfaceSelector({ onStart }) {
  const [interfaces, setInterfaces] = useState([])
  const [selected, setSelected]     = useState("")
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState("")

  useEffect(() => {
    fetch(`${API}/api/interfaces`)
      .then(r => r.json())
      .then(data => {
        setInterfaces(data)
        if (data.length > 0) setSelected(data[0].name)
        setLoading(false)
      })
      .catch(() => {
        setError("Cannot connect to backend. Run the server as Administrator.")
        setLoading(false)
      })
  }, [])

  async function handleStart() {
    const res  = await fetch(`${API}/api/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interface: selected }),
    })
    const data = await res.json()
    console.log(data.message)
    onStart(selected)
  }

  return (
    <div style={css.page}>
      <div style={css.box}>

        {/* Title */}
        <h1 style={css.title}><span style={{ color: "#22c55e" }}>NET</span>WATCH</h1>
        <p style={css.sub}>Network Traffic Monitoring Platform</p>
        <hr style={css.hr} />

        {/* Terminal prompt */}
        <p style={css.cmd}>
          <span style={{ color: "#22c55e" }}>root@netwatch:~# </span>
          scapy.get_interfaces()
        </p>

        {loading && <p style={{ color: "#4ade80" }}>Scanning interfaces...</p>}
        {error   && <p style={{ color: "#ef4444" }}>{error}</p>}

        {/* Interface list — like Wireshark */}
        {!loading && !error && (
          <>
            <p style={{ color: "#6b7280", fontSize: 12, margin: "8px 0" }}>
              {interfaces.length} interfaces found. Click to select:
            </p>

            <div style={css.ifaceList}>
              {interfaces.map(iface => (
                <div
                  key={iface.name}
                  style={{ ...css.ifaceRow, ...(selected === iface.name ? css.ifaceSelected : {}) }}
                  onClick={() => setSelected(iface.name)}
                >
                  {/* Mini sparkline (decorative, like Wireshark) */}
                  <svg width="50" height="24" style={{ flexShrink: 0 }}>
                    <polyline
                      points="0,12 8,6 16,15 24,8 32,14 40,5 50,12"
                      fill="none"
                      stroke={selected === iface.name ? "#22c55e" : "#374151"}
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Names */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#f0fdf4", fontSize: 13 }}>
                      {iface.friendly_name || iface.name}
                    </div>
                    <div style={{ color: "#4b5563", fontSize: 11 }}>{iface.name}</div>
                  </div>

                  {/* IP */}
                  <div style={{ color: "#22c55e", fontSize: 12, fontFamily: "monospace" }}>
                    {iface.ip}
                  </div>
                </div>
              ))}
            </div>

            <button
              style={css.btn}
              onClick={handleStart}
              disabled={!selected}
            >
              ▶ START CAPTURE on {interfaces.find(i => i.name === selected)?.friendly_name || selected}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const css = {
  page: {
    minHeight: "100vh",
    background: "#020d05",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Courier New', monospace",
    backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)",
    backgroundSize: "30px 30px",
  },
  box: {
    width: "min(640px, 95vw)",
    background: "rgba(0,0,0,0.85)",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 4,
    padding: "32px 28px",
    boxShadow: "0 0 40px rgba(34,197,94,0.08)",
  },
  title: {
    margin: 0,
    fontSize: 52,
    color: "#fff",
    fontWeight: 900,
    letterSpacing: -1,
  },
  sub: {
    color: "#4ade80",
    fontSize: 12,
    letterSpacing: 2,
    margin: "6px 0 0",
  },
  hr: {
    border: "none",
    borderTop: "1px solid rgba(34,197,94,0.2)",
    margin: "18px 0",
  },
  cmd: {
    color: "#86efac",
    fontSize: 13,
    margin: "0 0 12px",
  },
  ifaceList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    maxHeight: 320,
    overflowY: "auto" as const,
    marginBottom: 16,
  },
  ifaceRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    border: "1px solid rgba(34,197,94,0.12)",
    borderRadius: 2,
    cursor: "pointer",
    background: "rgba(0,0,0,0.4)",
  },
  ifaceSelected: {
    borderColor: "#22c55e",
    background: "rgba(34,197,94,0.08)",
  },
  btn: {
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "1px solid #22c55e",
    color: "#22c55e",
    fontSize: 13,
    fontFamily: "'Courier New', monospace",
    letterSpacing: 2,
    cursor: "pointer",
    borderRadius: 2,
  },
}