import { Ingredient } from '../types';

export interface StoreCatalogItem {
  id: string;
  ingredientId: string;
  storeId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  ingredientName: string;
}

export interface StoreCatalog {
  storeId: string;
  storeName: string;
  offsetLat: number;
  offsetLng: number;
  items: StoreCatalogItem[];
}

export function generateSupermarketCatalog(ingredients: Ingredient[]): StoreCatalog[] {
  const stores = [
    {
      storeId: 'st-billa',
      storeName: 'Billa Supermarket',
      offsetLat: 0.0015,
      offsetLng: 0.0016,
      namePrefix: 'Billa ',
      priceMult: 1.05,
    },
    {
      storeId: 'st-albert',
      storeName: 'Albert Hypermarket',
      offsetLat: -0.0026,
      offsetLng: 0.0024,
      namePrefix: 'Albert ',
      priceMult: 1.0,
    },
    {
      storeId: 'st-lidl',
      storeName: 'Lidl Supermarket',
      offsetLat: 0.0051,
      offsetLng: -0.0041,
      namePrefix: 'Lidl ',
      priceMult: 0.92,
    },
  ];

  return stores.map((s) => {
    const items: StoreCatalogItem[] = ingredients.map((ing, idx) => {
      const lower = ing.name.toLowerCase();
      let basePrice = 39.90;
      let brandName = `${s.namePrefix}${ing.name}`;

      if (lower.includes('brambor')) {
        basePrice = 34.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Naše Bio Brambory 2kg' : s.storeId === 'st-albert' ? 'Albert Brambory prané 2kg' : 'Lidl Brambory žluté pozdní 2kg';
      } else if (lower.includes('klobás') || lower.includes('párek') || lower.includes('špekáč')) {
        basePrice = 54.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Vocílka Uzená klobása' : s.storeId === 'st-albert' ? 'Albert Řeznická klobása' : 'Pikok Klobása staropolská';
      } else if (lower.includes('houb')) {
        basePrice = 44.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Lesní houby sušené 50g' : s.storeId === 'st-albert' ? 'Albert Směs hub 50g' : 'Kania Sušené houby';
      } else if (lower.includes('hověz') || lower.includes('kližk') || lower.includes('maso')) {
        basePrice = 179.90;
        brandName = s.storeId === 'st-billa' ? `Billa Vocílka ${ing.name}` : s.storeId === 'st-albert' ? `Albert Čerstvé ${ing.name}` : `Řezníkova porce ${ing.name}`;
      } else if (lower.includes('kuřec') || lower.includes('řízek') || lower.includes('stehn')) {
        basePrice = 139.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Vocílka Kuřecí maso čerstvé' : s.storeId === 'st-albert' ? 'Albert Kuřecí prsní řízky' : 'Lidl Čerstvé kuřecí maso';
      } else if (lower.includes('zelenin') || lower.includes('mrkev') || lower.includes('celer')) {
        basePrice = 29.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Česká kořenová zelenina' : s.storeId === 'st-albert' ? 'Albert Zelenina polévková svazek' : 'Lidl Čerstvá zeleninová směs';
      } else if (lower.includes('česnek')) {
        basePrice = 27.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Česnek český 3ks' : s.storeId === 'st-albert' ? 'Český česnek paličák' : 'Lidl Česnek bílý síťka';
      } else if (lower.includes('majoránk') || lower.includes('kmín') || lower.includes('koření') || lower.includes('pepř') || lower.includes('bobkov')) {
        basePrice = 16.90;
        brandName = s.storeId === 'st-billa' ? `Kotányi ${ing.name}` : s.storeId === 'st-albert' ? `Avokádo ${ing.name}` : `Kania ${ing.name}`;
      } else if (lower.includes('máslo')) {
        basePrice = 54.90;
        brandName = s.storeId === 'st-billa' ? 'Madeta Jihočeské máslo 82%' : s.storeId === 'st-albert' ? 'Albert Máslo čerstvé 250g' : 'Pilos České máslo 82%';
      } else if (lower.includes('smetan')) {
        basePrice = 34.90;
        brandName = s.storeId === 'st-billa' ? 'Kunín Smetana ke šlehání 33%' : s.storeId === 'st-albert' ? 'Albert Smetana 33% 250ml' : 'Pilos Smetana 33% kelímek';
      } else if (lower.includes('cibule')) {
        basePrice = 21.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Cibule žlutá síť 1kg' : s.storeId === 'st-albert' ? 'Albert Cibule kuchyňská 1kg' : 'Lidl Cibule žlutá balená';
      } else if (lower.includes('mouk') || lower.includes('hladk')) {
        basePrice = 19.90;
        brandName = s.storeId === 'st-billa' ? 'Babiččina volba Hladká mouka 1kg' : s.storeId === 'st-albert' ? 'Albert Hladká mouka 1kg' : 'Castello Pšeničná mouka 1kg';
      } else if (lower.includes('vejce')) {
        basePrice = 49.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Vejce z podestýlky 10ks' : s.storeId === 'st-albert' ? 'Albert Česká vejce M 10ks' : 'Lidl Čerstvá vejce 10ks';
      } else if (lower.includes('kopr')) {
        basePrice = 24.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Bylinky Kopr svazek' : s.storeId === 'st-albert' ? 'Albert Čerstvý kopr' : 'Lidl Bylinky v květináči Kopr';
      } else if (lower.includes('tempeh') || lower.includes('tofu')) {
        basePrice = 42.90;
        brandName = s.storeId === 'st-billa' ? 'Sunfood Uzený tempeh BIO' : s.storeId === 'st-albert' ? 'Albert Nature Bio Uzené Tofu' : 'Vemondo Veganský tempeh';
      } else if (lower.includes('špek')) {
        basePrice = 45.90;
        brandName = s.storeId === 'st-billa' ? 'Billa Řeznický špek kostka' : s.storeId === 'st-albert' ? 'Albert Špek na vaření' : 'Pikok Uzený špek';
      } else {
        basePrice = 32.90 + (idx * 4.5);
      }

      const calculatedPrice = Math.round(basePrice * s.priceMult * 10) / 10;

      return {
        id: `p-${s.storeId}-${ing.id || idx}`,
        ingredientId: ing.id || `ing-${idx}`,
        storeId: s.storeId,
        name: brandName,
        price: calculatedPrice,
        quantity: ing.amount || 1,
        unit: ing.unit || 'ks',
        ingredientName: ing.name,
      };
    });

    return {
      storeId: s.storeId,
      storeName: s.storeName,
      offsetLat: s.offsetLat,
      offsetLng: s.offsetLng,
      items,
    };
  });
}
