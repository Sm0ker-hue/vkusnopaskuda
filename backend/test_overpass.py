import urllib.request
import urllib.parse
import json
import sys
sys.stdout.reconfigure(encoding="utf-8")

lat, lon = 50.0878, 14.4205 # Staré Město, Praha
query = f"""
[out:json][timeout:5];
(
  node["shop"="supermarket"](around:1500,{lat},{lon});
  way["shop"="supermarket"](around:1500,{lat},{lon});
);
out center 15;
"""
url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query)
req = urllib.request.Request(url, headers={"User-Agent": "VkusnoPaskudaApp/1.0"})
try:
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        elements = data.get("elements", [])
        print("Elements found within 1500m:", len(elements))
        for el in elements[:10]:
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("brand") or tags.get("operator")
            brand = tags.get("brand") or name
            street = tags.get("addr:street", "")
            num = tags.get("addr:housenumber", "")
            addr = f"{street} {num}".strip() or tags.get("addr:place", "")
            clat = el.get("lat") or el.get("center", {}).get("lat")
            clon = el.get("lon") or el.get("center", {}).get("lon")
            print(f"  - {name} | {addr} | lat:{clat}, lon:{clon}")
except Exception as e:
    print("Error:", e)
