all_packets=[]
new_packets=[]
packet_id = 0 


def add (packet):
    global packet_id 
    packet_id += 1
    packet["id"] = packet_id 
    all_packets.append(packet)
    new_packets.append(packet)


def reset():
    global packet_id
    all_packets.clear()
    new_packets.clear()
    packet_id = 0 