import { Ingredient } from '../types';

export interface CzechRecipePreset {
  name: string;
  nutrition: { calories: number; protein: number; fat: number; carbs: number };
  ingredients: Ingredient[];
  steps: Array<{ step_number: number; instruction: string }>;
}

export const CZECH_RECIPE_PRESETS: Record<string, CzechRecipePreset> = {
  bramboracka: {
    name: 'Bramboračka s uzeným masem a klobásou',
    nutrition: { calories: 520, protein: 22, fat: 18, carbs: 65 },
    ingredients: [
      { id: 'bram-1', name: 'Brambory konzumní pozdní', amount: 600, unit: 'g', category: 'Zelenina' },
      { id: 'bram-2', name: 'Uzená klobása nebo uzené maso', amount: 200, unit: 'g', category: 'Uzeniny' },
      { id: 'bram-3', name: 'Lesní houby sušené nebo čerstvé', amount: 100, unit: 'g', category: 'Houby' },
      { id: 'bram-4', name: 'Kořenová zelenina (mrkev, celer, petržel)', amount: 300, unit: 'g', category: 'Zelenina' },
      { id: 'bram-5', name: 'Česnek paličák český', amount: 4, unit: 'stroužky', category: 'Zelenina' },
      { id: 'bram-6', name: 'Majoránka drhnutá', amount: 1, unit: 'lžíce', category: 'Koření' },
      { id: 'bram-7', name: 'Čerstvé máslo 82%', amount: 40, unit: 'g', category: 'Tuky a oleje' },
      { id: 'bram-8', name: 'Hladká mouka pšeničná', amount: 30, unit: 'g', category: 'Základ' },
      { id: 'bram-9', name: 'Kmín drcený', amount: 1, unit: 'lžička', category: 'Koření' },
    ],
    steps: [
      { step_number: 1, instruction: 'Brambory a kořenovou zeleninu oloupejte a nakrájejte na rovnoměrné kostičky. Sušené houby zalijte v misce teplou vodou a nechte 15 minut nabobtnat.' },
      { step_number: 2, instruction: 'V hrnci rozehřejte máslo a opečte nakrájenou klobásu či uzené maso dozlatova. Poté přidejte kořenovou zeleninu a krátce orestujte.' },
      { step_number: 3, instruction: 'Zeleninový základ zasypte moukou a za stálého míchání připravte světlou jíšku. Postupně za stálého šlehání metličkou přilévejte 1,5 litru vlažné vody nebo vývaru.' },
      { step_number: 4, instruction: 'Přidejte nakrájené brambory, nabobtnané houby i s tekutinou, drcený kmín, sůl a pepř. Vařte na mírném ohni 15–20 minut, dokud brambory nezměknou.' },
      { step_number: 5, instruction: 'Těsně před koncem vaření do polévky prolisujte čerstvý česnek a v dlaních promněte sušenou majoránku. Nechte krátce přejít varem a podávejte.' },
    ],
  },
  gulas: {
    name: 'Tradiční poctivý hovězí guláš',
    nutrition: { calories: 650, protein: 45, fat: 35, carbs: 32 },
    ingredients: [
      { id: 'gul-1', name: 'Hovězí kližka na guláš', amount: 600, unit: 'g', category: 'Maso' },
      { id: 'gul-2', name: 'Cibule žlutá kuchyňská', amount: 500, unit: 'g', category: 'Zelenina' },
      { id: 'gul-3', name: 'Paprika sladká mletá maďarská', amount: 2, unit: 'lžíce', category: 'Koření' },
      { id: 'gul-4', name: 'Česnek český', amount: 4, unit: 'stroužky', category: 'Zelenina' },
      { id: 'gul-5', name: 'Vepřové sádlo škvařené', amount: 50, unit: 'g', category: 'Tuky a oleje' },
      { id: 'gul-6', name: 'Rajčatový protlak zahuštěný', amount: 2, unit: 'lžíce', category: 'Přílohy' },
      { id: 'gul-7', name: 'Majoránka drhnutá', amount: 1, unit: 'lžíce', category: 'Koření' },
      { id: 'gul-8', name: 'Kmín drcený', amount: 1, unit: 'lžička', category: 'Koření' },
    ],
    steps: [
      { step_number: 1, instruction: 'Cibuli nakrájejte nadrobno a hovězí maso na rovnoměrné kostky cca 3x3 cm.' },
      { step_number: 2, instruction: 'V hlubokém hrnci rozpalte sádlo a cibuli pomalu restujte za stálého míchání do sytě hnědé barvy.' },
      { step_number: 3, instruction: 'Přidejte hovězí maso a zprudka opečte ze všech stran. Vmíchejte protlak, mletou papriku a kmín, ihned promíchejte a podlijte horkým vývarem.' },
      { step_number: 4, instruction: 'Osolte, opepřete a duste pod pokličkou na mírném plameni 90–120 minut doměkka.' },
      { step_number: 5, instruction: 'Na závěr prolisujte česnek a dochuťte promnutou majoránkou. Podávejte s houskovým knedlíkem nebo čerstvým chlebem.' },
    ],
  },
  kulajda: {
    name: 'Jihočeská poctivá kulajda',
    nutrition: { calories: 490, protein: 18, fat: 24, carbs: 48 },
    ingredients: [
      { id: 'kul-1', name: 'Brambory varný typ B', amount: 500, unit: 'g', category: 'Zelenina' },
      { id: 'kul-2', name: 'Lesní houby čerstvé nebo sušené', amount: 150, unit: 'g', category: 'Houby' },
      { id: 'kul-3', name: 'Zakysaná smetana 16%', amount: 200, unit: 'g', category: 'Mléčné výrobky' },
      { id: 'kul-4', name: 'Čerstvý kopr svazek', amount: 1, unit: 'svazek', category: 'Bylinky' },
      { id: 'kul-5', name: 'Čerstvá vejce slepičí', amount: 4, unit: 'ks', category: 'Základ' },
      { id: 'kul-6', name: 'Máslo čerstvé 82%', amount: 35, unit: 'g', category: 'Tuky a oleje' },
      { id: 'kul-7', name: 'Hladká mouka', amount: 30, unit: 'g', category: 'Základ' },
      { id: 'kul-8', name: 'Kmín celý a bobkový list', amount: 1, unit: 'balení', category: 'Koření' },
    ],
    steps: [
      { step_number: 1, instruction: 'Brambory oloupejte a nakrájejte na kostičky, houby očistěte a nakrájejte na plátky.' },
      { step_number: 2, instruction: 'V hrnci uvařte brambory a houby s celým kmínem a bobkovým listem do poloměkka.' },
      { step_number: 3, instruction: 'Z másla a mouky připravte světlou jíšku, rozmíchejte ve vlažné vodě a zahustěte polévku.' },
      { step_number: 4, instruction: 'Vmíchejte zakysanou smetanu a nechte 5 minut jemně probublávat.' },
      { step_number: 5, instruction: 'Vypněte oheň, vmíchejte čerstvý kopr, dochuťte octem a solí a podávejte se ztraceným vejcem.' },
    ],
  },
  svickova: {
    name: 'Tradiční česká svíčková na smetaně',
    nutrition: { calories: 680, protein: 42, fat: 34, carbs: 48 },
    ingredients: [
      { id: 'sv-1', name: 'Hovězí maso zadní na pečení', amount: 600, unit: 'g', category: 'Maso' },
      { id: 'sv-2', name: 'Čerstvá kořenová zelenina (mrkev, celer, petržel)', amount: 500, unit: 'g', category: 'Zelenina' },
      { id: 'sv-3', name: 'Smetana ke šlehání 33%', amount: 250, unit: 'ml', category: 'Mléčné výrobky' },
      { id: 'sv-4', name: 'Špek na špikování', amount: 80, unit: 'g', category: 'Maso' },
      { id: 'sv-5', name: 'Cibule žlutá', amount: 2, unit: 'ks', category: 'Zelenina' },
      { id: 'sv-6', name: 'Čerstvé máslo 82%', amount: 50, unit: 'g', category: 'Tuky a oleje' },
      { id: 'sv-7', name: 'Divoké koření (bobkový list, nové koření, celý pepř)', amount: 1, unit: 'balení', category: 'Koření' },
      { id: 'sv-8', name: 'Plnotučná hořčice', amount: 2, unit: 'lžíce', category: 'Dochucovadla' },
      { id: 'sv-9', name: 'Citrón čerstvý', amount: 1, unit: 'ks', category: 'Ovoce' },
      { id: 'sv-10', name: 'Brusinkový kompot', amount: 100, unit: 'g', category: 'Ovoce' },
    ],
    steps: [
      { step_number: 1, instruction: 'Hovězí maso očistěte, prošpikujte na klínky nakrájeným špekem, osolte a opepřete.' },
      { step_number: 2, instruction: 'V hlubokém hrnci rozehřejte máslo s trochou oleje a maso ze všech stran zprudka zatáhněte. Poté jej vyjměte.' },
      { step_number: 3, instruction: 'Do výpeku přidejte nakrájenou kořenovou zeleninu a cibuli. Orestujte dozlatova až do světle hnědé barvy.' },
      { step_number: 4, instruction: 'Přidejte lžíci hořčice, divoké koření a podlijte trochou horké vody nebo vývaru.' },
      { step_number: 5, instruction: 'Vraťte maso zpět, přiklopte poklicí a duste v troubě předehřáté na 160 °C doměkka přibližně 2 hodiny.' },
      { step_number: 6, instruction: 'Měkké maso vyjměte, odstraňte celé koření, zeleninu rozmixujte dohladka a zjemněte smetanou ke šlehání.' },
      { step_number: 7, instruction: 'Dochuťte citronovou šťávou a cukrem. Podávejte s karlovarským knedlíkem a brusinkami.' },
    ],
  },
  svickova_tofu: {
    name: 'Nízkokalorická kořenová svíčková s tofu plátkem',
    nutrition: { calories: 380, protein: 34, fat: 14, carbs: 32 },
    ingredients: [
      { id: 'svt-1', name: 'Tofu bílé přírodní nebo uzené', amount: 350, unit: 'g', category: 'Rostlinné proteiny' },
      { id: 'svt-2', name: 'Čerstvá kořenová zelenina (mrkev, celer, petržel)', amount: 500, unit: 'g', category: 'Zelenina' },
      { id: 'svt-3', name: 'Ovesná nebo rostlinná smetana na vaření', amount: 250, unit: 'ml', category: 'Mléčné alternativy' },
      { id: 'svt-4', name: 'Cibule žlutá kuchyňská', amount: 2, unit: 'ks', category: 'Zelenina' },
      { id: 'svt-5', name: 'Divoké koření (bobkový list, nové koření, celý pepř)', amount: 1, unit: 'balení', category: 'Koření' },
      { id: 'svt-6', name: 'Plnotučná hořčice', amount: 2, unit: 'lžíce', category: 'Dochucovadla' },
      { id: 'svt-7', name: 'Citrón čerstvý', amount: 1, unit: 'ks', category: 'Ovoce' },
      { id: 'svt-8', name: 'Panenský řepkový olej', amount: 30, unit: 'ml', category: 'Tuky a oleje' },
      { id: 'svt-9', name: 'Brusinkový kompot', amount: 100, unit: 'g', category: 'Ovoce' },
    ],
    steps: [
      { step_number: 1, instruction: 'Kořenovou zeleninu a cibuli nakrájejte na rovnoměrné kostičky. Plátky tofu osušte a zlehka osolte.' },
      { step_number: 2, instruction: 'V hrnci na oleji opečte plátky tofu z obou stran dozlatova (cca 3 minuty z každé strany) a odložte na talíř.' },
      { step_number: 3, instruction: 'Do výpeku vsypte kořenovou zeleninu a cibuli. Za stálého míchání opékejte 10–12 minut do sytě zlatavé barvy.' },
      { step_number: 4, instruction: 'Přidejte hořčici, divoké koření a zalijte 400 ml vody nebo zeleninového vývaru. Duste pod pokličkou 15 minut.' },
      { step_number: 5, instruction: 'Vyjměte kuličky koření a bobkový list. Zeleninu rozmixujte ponorným mixérem do hladkého krému.' },
      { step_number: 6, instruction: 'Vlijte ovesnou smetanu, dochuťte citronovou šťávou a špetkou soli a krátce prohřejte.' },
      { step_number: 7, instruction: 'Podávejte s opečenými plátky tofu, lžičkou brusinek a lehkou přílohou.' },
    ],
  },
  smazeny_syr: {
    name: 'Smažený sýr s vařenými bramborami a tatarkou',
    nutrition: { calories: 820, protein: 42, fat: 48, carbs: 62 },
    ingredients: [
      { id: 'syr-1', name: 'Sýr Eidam 30% bloček', amount: 400, unit: 'g', category: 'Mléčné výrobky' },
      { id: 'syr-2', name: 'Brambory přílohové varný typ A', amount: 600, unit: 'g', category: 'Zelenina' },
      { id: 'syr-3', name: 'Strouhanka světlá', amount: 150, unit: 'g', category: 'Základ' },
      { id: 'syr-4', name: 'Hladká mouka pšeničná', amount: 80, unit: 'g', category: 'Základ' },
      { id: 'syr-5', name: 'Čerstvá vejce', amount: 2, unit: 'ks', category: 'Základ' },
      { id: 'syr-6', name: 'Tatarská omáčka Hellmanns', amount: 100, unit: 'g', category: 'Dochucovadla' },
      { id: 'syr-7', name: 'Řepkový olej na smažení', amount: 100, unit: 'ml', category: 'Tuky a oleje' },
    ],
    steps: [
      { step_number: 1, instruction: 'Eidam nakrájejte na plátky silné zhruba 1,5 cm. Brambory oloupejte a dejte vařit do osolené vody.' },
      { step_number: 2, instruction: 'Sýr obalte v trojobalu: mouka, rozšlehaná vejce a strouhanka, a ještě jednou vejce a strouhanka.' },
      { step_number: 3, instruction: 'V pánvi rozpalte olej a smažte zprudka dozlatova cca 1,5 minuty z každé strany.' },
      { step_number: 4, instruction: 'Podávejte s vařenými bramborami a tatarskou omáčkou.' },
    ],
  },
  kure_paprika: {
    name: 'Kuře na paprice se smetanou',
    nutrition: { calories: 580, protein: 38, fat: 36, carbs: 22 },
    ingredients: [
      { id: 'kp-1', name: 'Kuřecí stehenní nebo prsní řízky', amount: 600, unit: 'g', category: 'Maso' },
      { id: 'kp-2', name: 'Paprika sladká lahůdková mletá', amount: 2, unit: 'lžíce', category: 'Koření' },
      { id: 'kp-3', name: 'Smetana ke šlehání 33%', amount: 250, unit: 'ml', category: 'Mléčné výrobky' },
      { id: 'kp-4', name: 'Cibule žlutá', amount: 2, unit: 'ks', category: 'Zelenina' },
      { id: 'kp-5', name: 'Čerstvé máslo 82%', amount: 40, unit: 'g', category: 'Tuky a oleje' },
      { id: 'kp-6', name: 'Kuřecí vývar', amount: 500, unit: 'ml', category: 'Základ' },
    ],
    steps: [
      { step_number: 1, instruction: 'Kuřecí maso osolte a opepřete. Cibuli nakrájejte nadrobno.' },
      { step_number: 2, instruction: 'Na másle orestujte cibuli dosklovata, přidejte kuřecí maso a zprudka opečte.' },
      { step_number: 3, instruction: 'Zasypte mletou sladkou paprikou, rychle promíchejte a ihned podlijte horkým vývarem.' },
      { step_number: 4, instruction: 'Přiklopte a duste na mírném ohni 30–35 minut doměkka.' },
      { step_number: 5, instruction: 'Maso vyjměte, omáčku rozmixujte ponorným mixérem, vlijte smetanu a nechte provařit. Podávejte s těstovinami nebo knedlíkem.' },
    ],
  },
};

/**
 * Vyhledá odpovídající klientský preset podle názvu jídla nebo vyhledávacího dotazu.
 *
 * POŘADÍ VYHLEDÁVÁNÍ JE KRITICKÉ:
 * 1. Svíčková (tradiční vs tofu/vegan)
 * 2. Smažený sýr (musí být před bramboračkou, protože "smažený sýr s bramborami" obsahuje slovo "brambor")
 * 3. Kuře na paprice
 * 4. Bramboračka (nesmí matchnout smažený sýr)
 * 5. Guláš
 * 6. Kulajda
 */
export function findMatchingPreset(dishNameOrQuery: string): CzechRecipePreset | null {
  const lower = (dishNameOrQuery || '').toLowerCase();

  // 1. Svíčková na smetaně (tradiční, tofu, veganská, nízkokalorická)
  if (lower.includes('svíčk') || lower.includes('svick')) {
    // Pokud je to specialita z hlívy, hub, zvěřiny, krůty nebo kachny, nesmí vrátit hovězí preset!
    if (
      lower.includes('hlív') ||
      lower.includes('houb') ||
      lower.includes('jelen') ||
      lower.includes('zvěřin') ||
      lower.includes('krůt') ||
      lower.includes('kachn') ||
      lower.includes('losos')
    ) {
      return null;
    }

    if (
      lower.includes('tofu') ||
      lower.includes('vegan') ||
      lower.includes('rostlin') ||
      lower.includes('nízkokalor') ||
      lower.includes('nizkokalor') ||
      lower.includes('light') ||
      lower.includes('fit')
    ) {
      return CZECH_RECIPE_PRESETS.svickova_tofu;
    }
    return CZECH_RECIPE_PRESETS.svickova;
  }

  // 2. Smažený sýr / smažák (PŘED bramborami!)
  if (lower.includes('smaž') || lower.includes('eidam') || (lower.includes('sýr') && !lower.includes('polévka'))) {
    return CZECH_RECIPE_PRESETS.smazeny_syr;
  }

  // 3. Kuře na paprice (pouze pro kuřecí varianty)
  if ((lower.includes('kuře') || lower.includes('kure')) && lower.includes('papri') && !lower.includes('tofu') && !lower.includes('vegan')) {
    return CZECH_RECIPE_PRESETS.kure_paprika;
  }

  // 4. Bramboračka — pouze polévka, NIKOLI bramboráky, bramborový salát či pečené brambory!
  if (lower.includes('bramboračk') || lower.includes('bramborack') || lower.includes('bramborová polévka') || lower.includes('bramborova polevka')) {
    if (lower.includes('tofu') || lower.includes('vegan') || lower.includes('tempeh') || lower.includes('rostlin')) {
      return null; // Přenechat Gemini / API pro čistě veganské/tofu suroviny
    }
    return CZECH_RECIPE_PRESETS.bramboracka;
  }

  // 5. Guláš (pouze tradiční hovězí; speciality jako jelen, kanec, krůta, kuře či hlíva přenechat AI)
  if ((lower.includes('guláš') || lower.includes('gulas')) && !any_specialty(lower)) {
    return CZECH_RECIPE_PRESETS.gulas;
  }

  // 6. Jihočeská kulajda
  if (lower.includes('kulajd')) {
    return CZECH_RECIPE_PRESETS.kulajda;
  }

  return null;
}

function any_specialty(lower: string): boolean {
  return [
    'hlív', 'houb', 'jelen', 'zvěřin', 'zverin', 'kanč', 'srnč',
    'krůt', 'krut', 'kachn', 'losos', 'ryb', 'kuřec', 'kure', 'tofu', 'vegan'
  ].some(kw => lower.includes(kw));
}

