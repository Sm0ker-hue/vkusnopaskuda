import urllib.request
import urllib.parse
import json
import sys
sys.stdout.reconfigure(encoding="utf-8")

# Dotaz na Overpass pro Albert, Billa, Lidl, Kaufland, Tesco, Penny, Globus v Česku
query = """
[out:json][timeout:35];
area["ISO3166-1"="CZ"][admin_level=2]->.cz;
(
  node["shop"="supermarket"]["name"~"Albert|Billa|Lidl|Kaufland|Tesco|Penny|Globus",i](area.cz);
  way["shop"="supermarket"]["name"~"Albert|Billa|Lidl|Kaufland|Tesco|Penny|Globus",i](area.cz);
);
out center;
"""
url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query)
req = urllib.request.Request(url, headers={"User-Agent": "VkusnoPaskudaApp/1.0"})
try:
    print("Odesílám dotaz na Overpass pro celou ČR...")
    with urllib.request.urlopen(req, timeout=40) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        elements = data.get("elements", [])
        print(f"Úspěch! Celkem nalezeno {len(elements)} reálných poboček supermarketů v ČR.")
        
        # Uložíme do souboru czech_supermarkets_osm.json
        with open("czech_supermarkets_osm.json", "w", encoding="utf-8") as f:
            json.dump(elements, f, ensure_ascii=False)
        print("Uloženo do czech_supermarkets_osm.json")
except Exception as e:
    print("Chyba při dotazu na Overpass:", e)
