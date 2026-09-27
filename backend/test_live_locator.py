import urllib.request
import urllib.parse
import json
import math
import sys
sys.stdout.reconfigure(encoding="utf-8")

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(max(0.0, min(1.0, a))))

CHAIN_PATTERNS = {
    "albert": "Albert",
    "billa": "Billa",
    "lidl": "Lidl",
    "kaufland": "Kaufland",
    "tesco": "Tesco",
    "penny": "Penny Market",
    "globus": "Globus",
}

def detect_chain_name(raw_name: str) -> str:
    if not raw_name:
        return ""
    lower = raw_name.lower()
    for key, val in CHAIN_PATTERNS.items():
        if key in lower:
            return val
    return ""

def get_live_nearby_stores(user_lat: float, user_lon: float, radius: int = 2500):
    query = f"""
    [out:json][timeout:5];
    (
      node["shop"="supermarket"](around:{radius},{user_lat},{user_lon});
      way["shop"="supermarket"](around:{radius},{user_lat},{user_lon});
    );
    out center 25;
    """
    url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"User-Agent": "VkusnoPaskudaApp/1.0"})
    found_by_chain = {}
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for el in data.get("elements", []):
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("brand") or tags.get("operator") or ""
                chain = detect_chain_name(name)
                if not chain:
                    continue
                clat = el.get("lat") or el.get("center", {}).get("lat")
                clon = el.get("lon") or el.get("center", {}).get("lon")
                if not clat or not clon:
                    continue
                dist_km = haversine(user_lat, user_lon, float(clat), float(clon))
                street = tags.get("addr:street", "")
                num = tags.get("addr:housenumber", "") or tags.get("addr:conscriptionnumber", "")
                city = tags.get("addr:city", "")
                addr = f"{street} {num}".strip()
                if city and addr:
                    full_addr = f"{addr}, {city}"
                else:
                    full_addr = addr or f"{chain}, {city or 'ČR'}"
                
                # Uložit nejbližší pobočku daného řetězce
                if chain not in found_by_chain or dist_km < found_by_chain[chain]["distance_km"]:
                    found_by_chain[chain] = {
                        "chain": chain,
                        "branch_name": f"{chain} {street}".strip(),
                        "address": full_addr,
                        "lat": float(clat),
                        "lon": float(clon),
                        "distance_km": dist_km,
                        "distance_m": int(round(dist_km * 1000)),
                    }
    except Exception as e:
        print("Overpass query error:", e)

    return sorted(found_by_chain.values(), key=lambda x: x["distance_m"])

# Test for Prague Vinohrady: 50.0755, 14.4378
print("TEST: Praha Vinohrady (50.0755, 14.4378):")
stores = get_live_nearby_stores(50.0755, 14.4378, 2000)
for s in stores:
    print(f"  • {s['chain']:12} | {s['address']:35} | {s['distance_m']} m")

# Test for Brno Centrum: 49.1951, 16.6068
print("\nTEST: Brno Centrum (49.1951, 16.6068):")
stores_brno = get_live_nearby_stores(49.1951, 16.6068, 2000)
for s in stores_brno:
    print(f"  • {s['chain']:12} | {s['address']:35} | {s['distance_m']} m")
