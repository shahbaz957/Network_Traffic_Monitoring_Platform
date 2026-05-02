from fastapi import FastAPI ,UploadFile, File
from fastapi.responses import Response
import time 
import csv 
import io 

from fastapi.middleware.cors import CORSMiddleware
import app.sniffer as sniffer
import app.store as store
from pydantic import BaseModel
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

class StartPar(BaseModel):
    interface : str = None # default value of interface is None


def count_by_key(packets , key):
    result = {}
    for p in packets:
        val = p[key]
        ## for exp : protocol : TCP 
        result[val] = result.get(val , 0) + 1
    return result 


@app.get('/api/interfaces')
def get_interfaces() :
    return sniffer.get_interfaces()

@app.post('/api/start')
def start(body : StartPar):
    return {"message" : sniffer.start(body.interface)}

@app.post('/api/stop')
def stop():
    return {"message" : sniffer.stop()}


@app.post('api/reset')
def reset():
    store.reset
    return {"message" : "Cleared"}

@app.get('/api/status')
def status():
    return {
        "running" : sniffer.is_running(),
        "total_packets" : len(store.all_packets)
    }


@app.get('/api/packet/new')
def get_new_packet():
    ## Frontend will poll to this for every 500 ms and get the newly sniffed packets
    ## and after every get sniffed new packet list got refereshed 
    new = list(store.new_packets)
    # list keyword make a new copy of new packet list and store it in new variable if we dont do that then our new word then again will point to the same list
    store.new_packets.clear()
    return new

@app.get('/api/packet/all')
def get_all_packets(): 
    return store.all_packets


@app.get('/api/stats')
def get_stats():
    packets = store.all_packets
    total = len(packets)
    if total == 0 :
        return {
            "total" : total,
            "by_protocol" : {},
            "by_service" : {},
            "avg_size" : 0,
            "total_bytes" : 0
        }
    total_bytes = sum(p["size"] for p in packets)
    by_protocol = count_by_key(packets , "protocol")
    by_service = count_by_key(packets , "service")
    top_src     = count_by_key(packets, "src_ip")
    top_dst     = count_by_key(packets, "dst_ip")
    return {
        "total" : total,
        "by_protocol" : by_protocol,
        "by_service" : by_service,
        "avg_size":    round(total_bytes / total, 1),
        "total_bytes": total_bytes,
        "top_src":     sorted(top_src.items(), key=lambda x: -x[1])[:5],
        "top_dst":     sorted(top_dst.items(), key=lambda x: -x[1])[:5], 
        ## it will show the top five ips in the packets
    }

@app.get("/api/export")
def export_csv():
    fields = ["id", "time", "src_ip", "dst_ip", "protocol",
              "size", "src_port", "dst_port", "service"]
    
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(store.all_packets)
    filename = f"capture_{time.strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        out.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/import")
async def import_csv(file: UploadFile = File(...)):
    text = (await file.read()).decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    store.reset()  
    for row in reader:
        row["size"]     = int(row.get("size") or 0)
        row["src_port"] = int(row["src_port"]) if row.get("src_port", "").isdigit() else None
        row["dst_port"] = int(row["dst_port"]) if row.get("dst_port", "").isdigit() else None
        store.add(row)

    return {"message": f"Loaded {len(store.all_packets)} packets"}



    
