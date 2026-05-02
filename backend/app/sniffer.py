import time
from scapy.all import AsyncSniffer , IP , TCP , UDP , ICMP , conf 
import app.store as store


SERVICES = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
    53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
    443: "HTTPS", 445: "SMB",
}

sniffer = None # global instance to save the state of scapy packet capturing instance 
# to show the interfaces in the frontend this endpoint will provide the interfaces in the frontend 
for iface in conf.ifaces.values():
    print({
            "name" : iface.name,
            "mac" : iface.mac,
            "ip" : iface.ip
        })
def get_interfaces():
    result = []
    for iface in conf.ifaces.values():
        result.append({
            "name" : iface.name,
            "mac" : iface.mac,
            "ip" : iface.ip
        })

    return result 
    

def on_packet(pkt):
    proto = "OTHER"
    if TCP in pkt:   proto = "TCP"
    elif UDP in pkt: proto = "UDP"
    elif ICMP in pkt: proto = "ICMP"
 
    # Ports
    src_port = dst_port = None
    if TCP in pkt:
        src_port, dst_port = pkt[TCP].sport, pkt[TCP].dport
    elif UDP in pkt:
        src_port, dst_port = pkt[UDP].sport, pkt[UDP].dport
 
    service = SERVICES.get(dst_port) or SERVICES.get(src_port) or "Unknown"
    # above function map the services for the packets given 
 
    store.add({
        "time":     time.strftime("%H:%M:%S"),
        "src_ip":   pkt[IP].src,
        "dst_ip":   pkt[IP].dst,
        "protocol": proto,
        "size":     len(pkt),
        "src_port": src_port,
        "dst_port": dst_port,
        "service":  service,
    })

def start(interface=None):
    global sniffer
    if sniffer and sniffer.running:
        return "Already Running"
    kwargs = {"prn": on_packet, "store": False, "filter": "ip"}
    if interface:
        kwargs["iface"] = interface    # pass selected interface
    sniffer = AsyncSniffer(**kwargs)
    sniffer.start()                    # actually start it
    return "Started"

def stop():
    global sniffer 
    if sniffer and sniffer.running:
        sniffer.stop()
        return "Sniffing Stopped"
    return "Not running"

def is_running():
    return sniffer is not None and sniffer.running # return true when boht are treu