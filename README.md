# NetWatch — Network Traffic Monitoring Platform

> A real-time network packet capture and analysis platform built as a semester project for the Computer Networks course at PUCIT. Inspired by Wireshark.

---
<img width="960" height="534" alt="image" src="https://github.com/user-attachments/assets/50f5a1a0-e55d-4870-af5c-69fe1a9ae273" />


## What is NetWatch?

NetWatch captures live network packets from your machine's network interface, processes them in real-time, and displays them in an organized web-based dashboard. You can filter packets, view statistics, save captures to CSV, and reload them later — similar to how Wireshark works.

---

## Features

- **Interface Selection** — Lists all available network interfaces on startup (like Wireshark)
- **Real-time Packet Capture** — Uses Scapy's `AsyncSniffer` to capture live IP packets
- **Live Table** — Packets appear in the table as they are captured (polling every 500ms)
- **Protocol Detection** — Identifies TCP, UDP, ICMP packets
- **Port → Service Mapping** — Maps port numbers to service names (e.g. port 443 → HTTPS)
- **Filters** — Filter by Protocol, Source IP, Destination IP, and Service
- **Statistics Panel** — Total packets, protocol breakdown, top source/destination IPs, average packet size
- **Save to CSV** — Export all captured packets to a `.csv` file
- **Open CSV** — Load a previously saved capture file back into the dashboard
- **Packet Inspector** — Click any row to see full details of that packet

---

## Tech Stack

| Part | Technology |
|------|-----------|
| Backend | Python, FastAPI, Uvicorn |
| Packet Capture | Scapy (AsyncSniffer) |
| Frontend | React, TypeScript, Vite |
| Styling | Inline CSS (dark/cyber theme) |
| Data Format | CSV (Python built-in `csv` module) |

---

## Project Structure

```
Network_Traffic_Monitoring_Platform/
│
├── backend/
│   ├── app/
│   │   ├── main.py        # All API routes (start, stop, stats, export, import)
│   │   ├── sniffer.py     # Scapy packet capture and interface discovery
│   │   └── store.py       # In-memory packet storage (two Python lists)
│   ├── run.py             # Entry point — starts Uvicorn on port 8000
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── App.tsx                          # Root component — switches between pages
        ├── index.css                        # Global dark theme styles
        └── component/
            ├── InterfaceSelector.tsx        # Startup interface selection page
            ├── Monitor.tsx                  # Main dashboard (table, stats, filters)
            └── PacketInspector.tsx          # Popup showing full packet details
```

---

## How It Works

```
Network Interface
      │
      ▼
Scapy AsyncSniffer (background thread)
      │  captures each IP packet
      ▼
on_packet() in sniffer.py
      │  extracts: src_ip, dst_ip, protocol, ports, size, service
      ▼
store.py  →  all_packets list + new_packets list
                              │
                              │  Frontend polls every 500ms
                              ▼
                    GET /api/packets/new
                              │
                              ▼
                    React state updates → table re-renders
```

No WebSockets needed. The frontend simply calls `/api/packets/new` every 500ms using `setInterval`. The backend returns packets added since the last call, then clears the `new_packets` list.

---

## Getting Started

### Requirements

- Python 3.10+
- Node.js 18+
- **Windows users: run backend as Administrator** (Scapy needs raw socket access)

---

### 1. Clone the Repository

```bash
git clone https://github.com/shahbaz957/Network_Traffic_Monitoring_Platform.git
cd Network_Traffic_Monitoring_Platform
```

### 2. Run the Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

Backend will start at `http://127.0.0.1:8000`

> **Windows:** Right-click your terminal and select **"Run as Administrator"** before running the backend. Scapy requires administrator privileges to capture raw packets.

### 3. Run the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will start at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interfaces` | List all network interfaces |
| POST | `/api/start` | Start packet capture on selected interface |
| POST | `/api/stop` | Stop packet capture |
| GET | `/api/packets/new` | Get new packets since last poll |
| GET | `/api/packets` | Get all captured packets |
| GET | `/api/stats` | Get statistics (protocol counts, top IPs, etc.) |
| POST | `/api/reset` | Clear all captured packets |
| GET | `/api/export` | Download all packets as CSV |
| POST | `/api/import` | Upload and load a CSV capture file |

---

## Packet Data Fields

Each captured packet contains:

| Field | Description |
|-------|-------------|
| `id` | Auto-incremented packet number |
| `time` | Capture time (HH:MM:SS) |
| `src_ip` | Source IP address |
| `dst_ip` | Destination IP address |
| `protocol` | TCP / UDP / ICMP / OTHER |
| `size` | Packet size in bytes |
| `src_port` | Source port number |
| `dst_port` | Destination port number |
| `service` | Service name from port (e.g. HTTP, DNS, SSH) |

---

## Author

**Mirza Shahbaz Ali Baig**  
Roll No: BCSF24M005  
BS Computer Science — PUCIT, University of the Punjab  
Semester Project — Computer Networks (4th Semester)
