import { useState } from "react"
import InterfaceSelector from "./components/InterFaceSelector"
import Monitor from "./components/Monitor"

export default function App() {
  const [page, setPage]   = useState("select")   // "select" or "monitor"
  const [iface, setIface] = useState("")

  if (page === "monitor") {
    return (
      <Monitor
        iface={iface}
        onExit={async () => {
          await fetch("http://127.0.0.1:8000/api/stop", { method: "POST" })
          setPage("select")
        }}
      />
    )
  }

  return (
    <InterfaceSelector
      onStart={(selectedIface) => {
        setIface(selectedIface)
        setPage("monitor")
      }}
    />
  )
}