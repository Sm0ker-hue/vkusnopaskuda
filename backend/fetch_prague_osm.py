import urllib.request
import urllib.parse
import json
import time
import sys
sys.stdout.reconfigure(encoding="utf-8")

t0 = time.time()
query = """
[out:json][timeout:15];
area["name"="Praha"]["admin_level"="8"]->.praha;
(
  node["shop"="supermarket"](area.praha);
  way["shop"="supermarket"](area.praha);
);
out center;
"""
url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query)
req = urllib.request.Request(url, headers={"User-Agent": "VkusnoPaskudaApp/1.0"})
try:
    with urllib.request.urlopen(req, timeout=18) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        elements = data.get("elements", [])
        print(f"Done in {time.time()-t0:.2f}s! Found in Prague: {len(elements)} supermarkets")
        with open("prague_supermarkets.json", "w", encoding="utf-8") as f:
            json.dump(elements, f, ensure_ascii=False)
except Exception as e:
    print("Error:", e)
