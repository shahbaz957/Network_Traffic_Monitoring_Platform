from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
from scapy.all import AsyncSniffer, IP, TCP, UDP, ICMP
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
sniffer_instance = None 
captured_packets = []

def packet_callback(pkt) :
    """This function runs every time a packet is caught"""
    if IP in pkt:
        # Determine Protocol
        proto = "OTHER"
        if TCP in pkt: proto = "TCP"
        elif UDP in pkt: proto = "UDP"
        elif ICMP in pkt: proto = "ICMP"
        
        # Determine Service (Simple Port Mapping)
        port = pkt.sport if TCP in pkt or UDP in pkt else None
        service = "Unknown"
        if port == 80: service = "HTTP"
        elif port == 443: service = "HTTPS"
        elif port == 53: service = "DNS"

        packet_info = {
            "time": time.strftime("%H:%M:%S"),
            "src": pkt[IP].src,
            "dst": pkt[IP].dst,
            "protocol": proto,
            "size": len(pkt),
            "service": service
        }
        captured_packets.append(packet_info)

## for each packet the above function will run 

@app.post('/api/start')
def start_monitoring() :
    global sniffer_instance
    if sniffer_instance is None and not sniffer_instance.running():
        sniffer_instance = AsyncSniffer(prc=packet_callback , store=False)
    # this store = False saves the memory otherwise it will store it in memory
        sniffer_instance.start()
    return {"message" : "Packet Sniffing stated ...."}

@app.post('/api/stop')
def stop_monitoring():
    global sniffer_instance
    if sniffer_instance and sniffer_instance.running():
        sniffer_instance.stop()
    return {"message" : "Packet Sniffing stopped ..."}

@app.post('/api/reset')
def reset():
    global captured_packets
    captured_packets.clear()
    return {"message" : "Data is reset"}

@app.get("/api/packets")
def get_packet():
    return captured_packets[-30:] # send the latest 30 packets from the captured ones 