from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    pass

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

@app.post()
