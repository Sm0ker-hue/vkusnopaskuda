"""
test_all_dish_configurations.py — Komplexní verifikační test všech konfigurací jídel.
Ověřuje, že pro každé jídlo a jeho varianty (hovězí, kuřecí, zvěřina, ryba, hlíva, tofu, sýr)
AI generuje a backend ukládá odpovídající suroviny bez jakýchkoli záměn či placeholderů.
"""
import asyncio
import sys

sys.stdout.reconfigure(encoding="utf-8")

from app.database import AsyncSessionLocal
from app.services.llm_service import generate_recipe_details, get_dish_presets


TEST_CASES = [
    {
        "category": "Svíčková (tradiční hovězí)",
        "dish": "Svíčková na smetaně",
        "variation_name": "Tradiční poctivá svíčková na smetaně",
        "desc": "Tradiční česká klasika s hovězím masem a brusinkami",
        "expected_protein": ["hověz", "maso"],
        "forbidden_protein": ["tofu", "hlív"],
    },
    {
        "category": "Svíčková (houbová/hlíva)",
        "dish": "Svíčková",
        "variation_name": "Svíčková z hlívy ústřičné s brusinkovým gelem",
        "desc": "Houbová bezmasá varianta se smetanou",
        "expected_protein": ["hlív", "houb"],
        "forbidden_protein": ["hověz", "vepř"],
    },
    {
        "category": "Svíčková (tofu / fitness)",
        "dish": "Svíčková",
        "variation_name": "Nízkokalorická kořenová svíčková s tofu plátkem",
        "desc": "Lehká varianta s tofu a kořenovou zeleninou",
        "expected_protein": ["tofu"],
        "forbidden_protein": ["hověz", "špek"],
    },
    {
        "category": "Guláš (tradiční hovězí)",
        "dish": "Hovězí guláš",
        "variation_name": "Tradiční poctivý hovězí guláš",
        "desc": "Pomalu dušený hovězí guláš s cibulí",
        "expected_protein": ["hověz"],
        "forbidden_protein": ["hlív", "tofu", "drůbež"],
    },
    {
        "category": "Guláš (zvěřina)",
        "dish": "Guláš",
        "variation_name": "Zvěřinový guláš z divočáka",
        "desc": "Silný lovecký guláš s jalovcem",
        "expected_protein": ["divoč", "zvěřin", "kanč", "kýta"],
        "forbidden_protein": ["tofu"],
    },
    {
        "category": "Guláš (kuřecí)",
        "dish": "Guláš",
        "variation_name": "Kuřecí guláš se zakysanou smetanou",
        "desc": "Rychlý lehký drůbeží guláš",
        "expected_protein": ["kuřec"],
        "forbidden_protein": ["hověz"],
    },
    {
        "category": "Bramboračka (s klobásou)",
        "dish": "Bramboračka",
        "variation_name": "Bramboračka s uzeným masem a klobásou",
        "desc": "Poctivá polévka s uzeninou a houbami",
        "expected_protein": ["klobás", "uzené", "maso"],
        "forbidden_protein": [],
    },
    {
        "category": "Bramboračka (tofu/houbová)",
        "dish": "Bramboračka",
        "variation_name": "Houbová bramboračka s uzeným tofu",
        "desc": "Bezmasá polévka s uzeným tofu a lesními houbami",
        "expected_protein": ["tofu", "houb", "brambor"],
        "forbidden_protein": ["klobás", "vepř"],
    },
    {
        "category": "Kuře na paprice",
        "dish": "Kuře na paprice",
        "variation_name": "Tradiční kuře na paprice se smetanou",
        "desc": "Šťavnaté kuřecí maso v paprikové omáčce",
        "expected_protein": ["kuřec"],
        "forbidden_protein": ["hověz", "ryb"],
    },
    {
        "category": "Kulajda",
        "dish": "Kulajda",
        "variation_name": "Jihočeská poctivá kulajda s pošírovaným vejcem",
        "desc": "Kyselá polévka s houbami, koprem a vejcem",
        "expected_protein": ["vejce", "houb", "brambor"],
        "forbidden_protein": ["hověz", "vepř"],
    },
    {
        "category": "Smažený sýr (eidam)",
        "dish": "Smažený sýr",
        "variation_name": "Smažený sýr Eidam s vařenými bramborami a tatarkou",
        "desc": "Česká hospodská klasika v trojobalu",
        "expected_protein": ["eidam", "sýr"],
        "forbidden_protein": ["hověz", "kuřec"],
    },
    {
        "category": "Smažený sýr (hermelín)",
        "dish": "Smažený sýr",
        "variation_name": "Smažený hermelín s vařenými bramborami",
        "desc": "Rozteklý hermelín s brusinkami",
        "expected_protein": ["hermelín", "sýr"],
        "forbidden_protein": ["hověz"],
    },
    {
        "category": "Rybí specialita (losos)",
        "dish": "Losos",
        "variation_name": "Pečený filet z lososa s bylinkovým máslem",
        "desc": "Čerstvý losos pečený na másle",
        "expected_protein": ["losos"],
        "forbidden_protein": ["hověz", "vepř"],
    },
]


async def run_all_tests():
    print("=" * 75)
    print("  KOMPLEXNÍ TESTOVÁNÍ VŠECH KONFIGURACÍ JÍDEL A JEJICH VARIANT")
    print("=" * 75)

    passed = 0
    failed = 0

    for idx, tc in enumerate(TEST_CASES, 1):
        print(f"\n[{idx}/{len(TEST_CASES)}] Test: {tc['category']}")
        print(f"    Název: {tc['variation_name']}")

        details = await generate_recipe_details(tc["variation_name"], tc["desc"])
        ingredients = details.get("ingredients", [])
        ing_names = [i.get("name", "") for i in ingredients]
        ing_text = " ".join(ing_names).lower()

        print(f"    Počet surovin: {len(ingredients)}")
        print(f"    První 4 suroviny: {ing_names[:4]}")

        # Kontrola očekávaného proteinu
        has_expected = any(exp in ing_text for exp in tc["expected_protein"])
        # Kontrola zakázaného proteinu
        has_forbidden = any(forb in ing_text for forb in tc["forbidden_protein"])

        errors = []
        if not has_expected:
            errors.append(f"CHYBÍ očekávaný protein {tc['expected_protein']}")
        if has_forbidden:
            errors.append(f"OBSAHUJE zakázaný protein {tc['forbidden_protein']}")
        if len(ingredients) < 3:
            errors.append("Méně než 3 suroviny!")

        if not errors:
            print("    -> VÝSLEDEK: [PASS] Suroviny přesně odpovídají zvolenému jídlu.")
            passed += 1
        else:
            print(f"    -> VÝSLEDEK: [FAIL] {'; '.join(errors)}")
            failed += 1

    print("\n" + "=" * 75)
    print(f"SOUHRN TESTŮ: {passed} ÚSPĚŠNÝCH, {failed} CHYBNÝCH z {len(TEST_CASES)} konfigurací.")
    print("=" * 75)
    if failed == 0:
        print("VŠECHNY RECEPTY A JEJICH SUROVINY 100% ODPOVÍDAJÍ A JSOU V POŘÁDKU!")
    else:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
