import { useEffect, useState } from "react";
import axios from "axios";

const minimalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

  body { background: #030a0f; font-family: 'Rajdhani', sans-serif; }

  .cyber-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,255,140,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,140,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }
  .cyber-bg::after {
    content: '';
    position: fixed;
    top: -20%; left: -10%;
    width: 60%; height: 60%;
    background: radial-gradient(ellipse, rgba(0,200,100,0.06) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.7); }
  }
  .animate-pulse-dot { animation: pulse-dot 1.2s ease-in-out infinite; }

  @keyframes row-in {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .animate-row-in { animation: row-in 0.3s ease forwards; }

  @keyframes scan {
    0%   { top: 0;    opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  .animate-scan { animation: scan 2.5s linear infinite; }

  .font-mono-cyber { font-family: 'Share Tech Mono', monospace; }
  .font-rajdhani   { font-family: 'Rajdhani', sans-serif; }
`;

function App() {
  const [packets, setPackets] = useState([]);
  const [isStart, setIsStart] = useState<boolean>(false);

  useEffect(() => {
    let timer : number;
    if (isStart) {
      timer = setInterval(async () => {
        try {
          const res = await axios.get("http://127.0.0.1:8000/api/packets");
          setPackets(res.data);
        } catch (error) {
          console.log("error", error);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStart]);

  const handleStart = () => {
    axios.post("http://127.0.0.1:8000/api/start");
    setIsStart(true);
  };

  const handleStop = () => {
    axios.post("http://127.0.0.1:8000/api/stop");
    setIsStart(false);
  };

  const handleReset = () => {
    axios.post("http://127.0.0.1:8000/api/reset");
    setPackets([]);
  };

  return (
    <>
      <style>{minimalStyles}</style>

      {/* Root */}
      <div className="cyber-bg min-h-screen bg-[#030a0f] text-[#c8f5e0] font-rajdhani px-10 py-8 overflow-hidden">

        {/* Content */}
        <div className="relative z-10 max-w-[1400px] mx-auto">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-9">
            <div className="flex flex-col gap-1">
              <span className="font-mono-cyber text-[11px] tracking-[4px] text-[#00ff8c] uppercase opacity-70">
                // network analysis tool
              </span>
              <h1 className="font-rajdhani text-[32px] font-bold tracking-[2px] text-[#e0fff2] uppercase leading-none">
                Packet <span className="text-[#00ff8c]">Sniffer</span>
              </h1>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2.5 px-[18px] py-2 border border-[rgba(0,255,140,0.2)] rounded bg-[rgba(0,255,140,0.04)] font-mono-cyber text-xs tracking-[2px] text-[#00ff8c] uppercase">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isStart
                    ? "bg-[#00ff8c] shadow-[0_0_6px_#00ff8c] animate-pulse-dot"
                    : "bg-[#ff4d6d] shadow-[0_0_6px_#ff4d6d]"
                }`}
              />
              {isStart ? "Capturing" : "Idle"}
            </div>
          </div>

          {/* ── Controls bar ── */}
          <div className="flex items-center gap-3 mb-7 px-6 py-5 bg-[rgba(0,255,140,0.03)] border border-[rgba(0,255,140,0.1)] rounded-lg">

            {/* Start */}
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-2.5 rounded font-rajdhani font-bold text-sm tracking-[2px] uppercase cursor-pointer transition-all duration-200 active:scale-95
                bg-gradient-to-br from-[#00c97a] to-[#00ff8c] text-[#030a0f] shadow-[0_0_18px_rgba(0,255,140,0.3)]
                hover:shadow-[0_0_28px_rgba(0,255,140,0.5)]"
            >
              <span className="text-base leading-none">▶</span> Start
            </button>

            {/* Stop */}
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-6 py-2.5 rounded font-rajdhani font-bold text-sm tracking-[2px] uppercase cursor-pointer transition-all duration-200 active:scale-95
                bg-gradient-to-br from-[#c0002a] to-[#ff4d6d] text-white shadow-[0_0_18px_rgba(255,77,109,0.2)]
                hover:shadow-[0_0_28px_rgba(255,77,109,0.4)]"
            >
              <span className="text-base leading-none">■</span> Stop
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-2.5 rounded font-rajdhani font-bold text-sm tracking-[2px] uppercase cursor-pointer transition-all duration-200 active:scale-95
                bg-[rgba(0,255,140,0.06)] text-[#00ff8c] border border-[rgba(0,255,140,0.3)]
                hover:bg-[rgba(0,255,140,0.12)] hover:border-[rgba(0,255,140,0.6)]"
            >
              ↺ Reset
            </button>

            {/* Stats chips */}
            <div className="flex gap-4 ml-auto">
              <div className="flex flex-col items-center px-5 py-1.5 border border-[rgba(0,255,140,0.1)] rounded bg-black/30">
                <span className="font-mono-cyber text-xl text-[#00ff8c] leading-none">{packets.length}</span>
                <span className="text-[10px] tracking-[2px] uppercase text-[rgba(200,245,224,0.4)] mt-0.5">Packets</span>
              </div>
              <div className="flex flex-col items-center px-5 py-1.5 border border-[rgba(0,255,140,0.1)] rounded bg-black/30">
                <span className="font-mono-cyber text-xl text-[#00ff8c] leading-none">
                  {packets.filter((p: any) => p.protocol === "TCP").length}
                </span>
                <span className="text-[10px] tracking-[2px] uppercase text-[rgba(200,245,224,0.4)] mt-0.5">TCP</span>
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="relative border border-[rgba(0,255,140,0.12)] rounded-lg overflow-hidden bg-black/40 shadow-[0_0_60px_rgba(0,255,140,0.04)]">

            {/* Scan line */}
            {isStart && (
              <div className="animate-scan absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,255,140,0.6)] to-transparent pointer-events-none" />
            )}

            <table className="w-full border-collapse text-sm">
              <thead className="bg-[rgba(0,255,140,0.07)] border-b border-[rgba(0,255,140,0.2)]">
                <tr>
                  {["Time", "Source", "Destination", "Protocol", "Service"].map((h) => (
                    <th
                      key={h}
                      className="p-[14px_18px] font-mono-cyber text-[11px] tracking-[3px] uppercase text-[#00ff8c] font-normal text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packets.length > 0 ? (
                  packets.map((pkt: any, idx: number) => (
                    <tr
                      key={idx}
                      className="animate-row-in border-b border-[rgba(0,255,140,0.05)] last:border-0 transition-colors duration-150 hover:bg-[rgba(0,255,140,0.05)]"
                    >
                      <td className="p-[12px_18px] font-mono-cyber text-xs text-[rgba(200,245,224,0.5)]">
                        {pkt.time}
                      </td>
                      <td className="p-[12px_18px] font-mono-cyber text-[13px] text-[#5bc8ff]">
                        {pkt.src}
                      </td>
                      <td className="p-[12px_18px] font-mono-cyber text-[13px] text-[#c084fc]">
                        {pkt.dst}
                      </td>
                      <td className="p-[12px_18px]">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded font-mono-cyber text-[11px] tracking-wide font-semibold ${
                            pkt.protocol === "TCP"
                              ? "bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border border-[rgba(59,130,246,0.3)]"
                              : "bg-[rgba(251,146,60,0.15)] text-[#fb923c] border border-[rgba(251,146,60,0.3)]"
                          }`}
                        >
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="p-[12px_18px] font-mono-cyber text-xs text-[rgba(200,245,224,0.65)]">
                        {pkt.service}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-20 gap-4 text-[rgba(200,245,224,0.2)]">
                        <span className="text-5xl opacity-40">◈</span>
                        <span className="font-mono-cyber text-[13px] tracking-[3px] uppercase">
                          {isStart ? "Waiting for packets..." : "Press start to capture"}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </>
  );
}

export default App;