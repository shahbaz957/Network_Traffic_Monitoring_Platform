from fastapi import FastAPI
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


    
