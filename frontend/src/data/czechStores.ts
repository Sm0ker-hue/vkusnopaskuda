export interface StoreBranchLocation {
  storeId: string;
  chainName: string;
  branchName: string;
  address: string;
  lat: number;
  lng: number;
  city: string;
  district?: string;
}

export const VERIFIED_CZECH_STORES: StoreBranchLocation[] = [
  // ===================== PLZEŇ =====================
  // LIDL
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Plzeň Plovární (Bory / Doudlevce)',
    address: 'Plovární 2987/1, 301 00 Plzeň',
    lat: 49.7344,
    lng: 13.3790,
    city: 'Plzeň',
    district: 'Bory',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Plzeň Folmavská (Borská pole)',
    address: 'Folmavská 3035/8, 301 00 Plzeň',
    lat: 49.7311,
    lng: 13.3505,
    city: 'Plzeň',
    district: 'Bory',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Plzeň Americká (Centrum / Nádraží)',
    address: 'Americká 2186/47, 301 00 Plzeň',
    lat: 49.7428,
    lng: 13.3768,
    city: 'Plzeň',
    district: 'Centrum',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Plzeň Vejprnická (Skvrňany)',
    address: 'Vejprnická 1157/32, 318 00 Plzeň',
    lat: 49.7442,
    lng: 13.3401,
    city: 'Plzeň',
    district: 'Skvrňany',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Plzeň Gerská (Košutka)',
    address: 'Gerská 2070/1, 323 00 Plzeň',
    lat: 49.7788,
    lng: 13.3688,
    city: 'Plzeň',
    district: 'Košutka',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Plzeň Plaská (Bolevec)',
    address: 'Plaská 1265/7, 323 00 Plzeň',
    lat: 49.7695,
    lng: 13.3852,
    city: 'Plzeň',
    district: 'Bolevec',
  },
  // ALBERT
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Plzeň Sukova (Area Bory)',
    address: 'Sukova 2895/23, 301 00 Plzeň',
    lat: 49.7225,
    lng: 13.3644,
    city: 'Plzeň',
    district: 'Bory',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Plzeň Radčická (Plzeň Plaza)',
    address: 'Radčická 2861/2, 301 00 Plzeň',
    lat: 49.7494,
    lng: 13.3688,
    city: 'Plzeň',
    district: 'Centrum',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Plzeň Koterovská (Slovany)',
    address: 'Koterovská 2390/47, 326 00 Plzeň',
    lat: 49.7393,
    lng: 13.3925,
    city: 'Plzeň',
    district: 'Slovany',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Plzeň Rokycanská (OC Rokycanská)',
    address: 'Rokycanská 2656/2, 301 00 Plzeň',
    lat: 49.7472,
    lng: 13.4005,
    city: 'Plzeň',
    district: 'Lobzy',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Plzeň Gerská (Košutka)',
    address: 'Gerská 2030/23, 323 00 Plzeň',
    lat: 49.7788,
    lng: 13.3688,
    city: 'Plzeň',
    district: 'Košutka',
  },
  // BILLA
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Plzeň Majerova (OC Luna Bory)',
    address: 'Majerova 2525/7, 301 00 Plzeň',
    lat: 49.7231,
    lng: 13.3727,
    city: 'Plzeň',
    district: 'Bory',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Plzeň Františkánská (Centrum)',
    address: 'Františkánská 356/1, 301 00 Plzeň',
    lat: 49.7450,
    lng: 13.3780,
    city: 'Plzeň',
    district: 'Centrum',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Plzeň Zahradní (Slovany)',
    address: 'Zahradní 2351/19, 304 97 Plzeň',
    lat: 49.7367,
    lng: 13.3871,
    city: 'Plzeň',
    district: 'Slovany',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Plzeň Těšínská (Doubravka)',
    address: 'Těšínská 1202/3, 312 00 Plzeň',
    lat: 49.7497,
    lng: 13.4042,
    city: 'Plzeň',
    district: 'Doubravka',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Plzeň Studentská (Košutka)',
    address: 'Studentská 55, 323 00 Plzeň',
    lat: 49.7750,
    lng: 13.3620,
    city: 'Plzeň',
    district: 'Košutka',
  },

  // ===================== PRAHA =====================
  // LIDL
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Praha Na Poříčí',
    address: 'Na Poříčí 1079/3a, 110 00 Nové Město, Praha 1',
    lat: 50.0898,
    lng: 14.4326,
    city: 'Praha',
    district: 'Praha 1',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Praha Seifertova (Žižkov)',
    address: 'Seifertova 525/24, 130 00 Praha 3',
    lat: 50.0847,
    lng: 14.4485,
    city: 'Praha',
    district: 'Praha 3',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Praha Nádražní (Anděl / Smíchov)',
    address: 'Nádražní 279/1, 150 00 Praha 5',
    lat: 50.0691,
    lng: 14.4048,
    city: 'Praha',
    district: 'Praha 5',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Praha Dělnická (Holešovice)',
    address: 'Dělnická 213/12, 170 00 Praha 7',
    lat: 50.1021,
    lng: 14.4497,
    city: 'Praha',
    district: 'Praha 7',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Praha Vršovická',
    address: 'Vršovická 1525/1a, 101 00 Praha 10',
    lat: 50.0673,
    lng: 14.4538,
    city: 'Praha',
    district: 'Praha 10',
  },
  // ALBERT
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Praha Palladium',
    address: 'Náměstí Republiky 1078/1, 110 00 Staré Město, Praha 1',
    lat: 50.0889,
    lng: 14.4297,
    city: 'Praha',
    district: 'Praha 1',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Praha Máj Národní',
    address: 'Národní 63/26, 110 00 Nové Město, Praha 1',
    lat: 50.0818,
    lng: 14.4187,
    city: 'Praha',
    district: 'Praha 1',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Praha OC Nový Smíchov',
    address: 'Radlická 3179/1b, 150 00 Praha 5',
    lat: 50.0718,
    lng: 14.4019,
    city: 'Praha',
    district: 'Praha 5',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Praha Arkalycká (Háje)',
    address: 'Arkalycká 757/6, 149 00 Praha 4',
    lat: 50.0315,
    lng: 14.5284,
    city: 'Praha',
    district: 'Praha 4',
  },
  // BILLA
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Vodičkova',
    address: 'Vodičkova 710/31, 110 00 Nové Město, Praha 1',
    lat: 50.0805,
    lng: 14.4239,
    city: 'Praha',
    district: 'Praha 1',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Hlavní nádraží',
    address: 'Wilsonova 300/8, 110 00 Praha 1',
    lat: 50.0832,
    lng: 14.4354,
    city: 'Praha',
    district: 'Praha 1',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Atrium Flora',
    address: 'Vinohradská 2828/151, 130 00 Praha 3',
    lat: 50.0775,
    lng: 14.4614,
    city: 'Praha',
    district: 'Praha 3',
  },
  // PRAHA 2 - VINOHRADY & KARLOVO NÁMĚSTÍ
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Šumavská (Vinohrady)',
    address: 'Šumavská 1052/24, 120 00 Praha 2',
    lat: 50.0762,
    lng: 14.4445,
    city: 'Praha',
    district: 'Praha 2',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Bělehradská (I.P. Pavlova)',
    address: 'Bělehradská 130/50, 120 00 Praha 2',
    lat: 50.0742,
    lng: 14.4312,
    city: 'Praha',
    district: 'Praha 2',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Supermarket',
    branchName: 'Albert Praha Karlovo náměstí',
    address: 'Karlovo náměstí 2097/15, 120 00 Praha 2',
    lat: 50.0754,
    lng: 14.4191,
    city: 'Praha',
    district: 'Praha 2',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Supermarket',
    branchName: 'Albert Praha Bělehradská (Vinohrady)',
    address: 'Bělehradská 2555/47, 120 00 Praha 2',
    lat: 50.0728,
    lng: 14.4338,
    city: 'Praha',
    district: 'Praha 2',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Praha Albertov',
    address: 'Na Slupi 2103/2b, 128 00 Praha 2',
    lat: 50.0685,
    lng: 14.4208,
    city: 'Praha',
    district: 'Praha 2',
  },
  // PRAHA 3 - ŽIŽKOV
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Táboritská (Žižkov)',
    address: 'Táboritská 1000/23, 130 00 Praha 3',
    lat: 50.0841,
    lng: 14.4532,
    city: 'Praha',
    district: 'Praha 3',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Supermarket',
    branchName: 'Albert Praha Hartigova (Žižkov)',
    address: 'Hartigova 1931/130, 130 00 Praha 3',
    lat: 50.0898,
    lng: 14.4715,
    city: 'Praha',
    district: 'Praha 3',
  },
  {
    storeId: 'st-penny',
    chainName: 'Penny Market',
    branchName: 'Penny Market Praha Hartigova',
    address: 'Hartigova 2452/125, 130 00 Praha 3',
    lat: 50.0895,
    lng: 14.4752,
    city: 'Praha',
    district: 'Praha 3',
  },
  // PRAHA 4 - NUSLE, PANKRÁC, BUDĚJOVICKÁ
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Praha Arkády Pankrác',
    address: 'Na Pankráci 86, 140 00 Praha 4',
    lat: 50.0505,
    lng: 14.4395,
    city: 'Praha',
    district: 'Praha 4',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Budějovická',
    address: 'Budějovická 778/3, 140 00 Praha 4',
    lat: 50.0448,
    lng: 14.4465,
    city: 'Praha',
    district: 'Praha 4',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Nuselská',
    address: 'Nuselská 498/60, 140 00 Praha 4',
    lat: 50.0605,
    lng: 14.4472,
    city: 'Praha',
    district: 'Praha 4',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Praha Pankrác (Na Strži)',
    address: 'Na Strži 1702/65, 140 00 Praha 4',
    lat: 50.0458,
    lng: 14.4372,
    city: 'Praha',
    district: 'Praha 4',
  },
  // PRAHA 5 - SMÍCHOV, ANDĚL
  {
    storeId: 'st-albert',
    chainName: 'Albert Supermarket',
    branchName: 'Albert Praha Zlatý Anděl',
    address: 'Nádražní 344/25, 150 00 Praha 5',
    lat: 50.0708,
    lng: 14.4042,
    city: 'Praha',
    district: 'Praha 5',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Radlická (Anděl)',
    address: 'Radlická 3179/1e, 150 00 Praha 5',
    lat: 50.0688,
    lng: 14.4035,
    city: 'Praha',
    district: 'Praha 5',
  },
  // PRAHA 6 - DEJVICE & BŘEVNOV
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Vítězné náměstí (Kulaťák)',
    address: 'Vítězné náměstí 576/1, 160 00 Praha 6',
    lat: 50.1005,
    lng: 14.3948,
    city: 'Praha',
    district: 'Praha 6',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Supermarket',
    branchName: 'Albert Praha Dejvická',
    address: 'Dejvická 188/6, 160 00 Praha 6',
    lat: 50.0988,
    lng: 14.3995,
    city: 'Praha',
    district: 'Praha 6',
  },
  {
    storeId: 'st-penny',
    chainName: 'Penny Market',
    branchName: 'Penny Market Praha Bělohorská',
    address: 'Bělohorská 1686/112, 169 00 Praha 6',
    lat: 50.0848,
    lng: 14.3685,
    city: 'Praha',
    district: 'Praha 6',
  },
  // PRAHA 7 - HOLEŠOVICE & LETNÁ
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Letenské náměstí',
    address: 'Letenské náměstí 749/6, 170 00 Praha 7',
    lat: 50.0995,
    lng: 14.4238,
    city: 'Praha',
    district: 'Praha 7',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Supermarket',
    branchName: 'Albert Praha Milady Horákové (Letná)',
    address: 'Milady Horákové 845/96, 170 00 Praha 7',
    lat: 50.0982,
    lng: 14.4215,
    city: 'Praha',
    district: 'Praha 7',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Tusarova (Holešovice)',
    address: 'Tusarova 1526/37, 170 00 Praha 7',
    lat: 50.1018,
    lng: 14.4482,
    city: 'Praha',
    district: 'Praha 7',
  },
  // PRAHA 8 - KARLÍN
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Křižíkova (Karlín)',
    address: 'Křižíkova 346/38, 186 00 Praha 8',
    lat: 50.0925,
    lng: 14.4512,
    city: 'Praha',
    district: 'Praha 8',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Supermarket',
    branchName: 'Albert Praha Sokolovská (Karlín)',
    address: 'Sokolovská 394/17, 186 00 Praha 8',
    lat: 50.0918,
    lng: 14.4403,
    city: 'Praha',
    district: 'Praha 8',
  },
  // PRAHA 10 - VRŠOVICE
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Praha Kubánské náměstí',
    address: 'Kubánské náměstí 1391/11, 100 00 Praha 10',
    lat: 50.0712,
    lng: 14.4785,
    city: 'Praha',
    district: 'Praha 10',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Supermarket',
    branchName: 'Albert Praha Vršovická',
    address: 'Vršovická 1429/68, 101 00 Praha 10',
    lat: 50.0673,
    lng: 14.4593,
    city: 'Praha',
    district: 'Praha 10',
  },

  // ===================== BRNO =====================
  // LIDL
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Brno Dornych',
    address: 'Dornych 429/42, 602 00 Brno-Trnitá',
    lat: 49.1868,
    lng: 16.6162,
    city: 'Brno',
    district: 'Trnitá',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Brno Vídeňská',
    address: 'Vídeňská 815/89a, 639 00 Brno-Štýřice',
    lat: 49.1764,
    lng: 16.5982,
    city: 'Brno',
    district: 'Štýřice',
  },
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Brno Purkyňova (Královo Pole)',
    address: 'Purkyňova 3050/99, 612 00 Brno-Královo Pole',
    lat: 49.2274,
    lng: 16.5824,
    city: 'Brno',
    district: 'Královo Pole',
  },
  // ALBERT
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Brno Moravské náměstí',
    address: 'Moravské náměstí 1007/14a, 602 00 Brno',
    lat: 49.1983,
    lng: 16.6080,
    city: 'Brno',
    district: 'Centrum',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Brno Galerie Vaňkovka',
    address: 'Ve Vaňkovce 462/1, 602 00 Brno',
    lat: 49.1873,
    lng: 16.6142,
    city: 'Brno',
    district: 'Centrum',
  },
  // BILLA
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Brno Nádražní',
    address: 'Nádražní 2a, 602 00 Brno-město',
    lat: 49.1912,
    lng: 16.6119,
    city: 'Brno',
    district: 'Centrum',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Brno Kounicova',
    address: 'Kounicova 688/26, 602 00 Brno',
    lat: 49.2045,
    lng: 16.6015,
    city: 'Brno',
    district: 'Veveří',
  },

  // ===================== OSTRAVA =====================
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Ostrava Českobratrská',
    address: 'Českobratrská 3321/46, 702 00 Moravská Ostrava',
    lat: 49.8385,
    lng: 18.2825,
    city: 'Ostrava',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Ostrava Forum Nová Karolina',
    address: 'Jantarová 3344/4, 702 00 Ostrava',
    lat: 49.8306,
    lng: 18.2858,
    city: 'Ostrava',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Ostrava Nádražní',
    address: 'Nádražní 1940/32, 702 00 Moravská Ostrava',
    lat: 49.8402,
    lng: 18.2831,
    city: 'Ostrava',
  },

  // ===================== LIBEREC =====================
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Liberec Dr. Milady Horákové',
    address: 'Dr. Milady Horákové 580/7, 460 07 Liberec',
    lat: 50.7602,
    lng: 15.0620,
    city: 'Liberec',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Liberec OC Nisa',
    address: 'Palachova 1404, 460 01 Liberec',
    lat: 50.7410,
    lng: 15.0489,
    city: 'Liberec',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Liberec OC Forum',
    address: 'Soukenné náměstí 669/2a, 460 01 Liberec',
    lat: 50.7671,
    lng: 15.0562,
    city: 'Liberec',
  },

  // ===================== OLOMOUC =====================
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Olomouc Velkomoravská',
    address: 'Velkomoravská 479/19, 779 00 Olomouc',
    lat: 49.5831,
    lng: 17.2625,
    city: 'Olomouc',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Olomouc OC Haná',
    address: 'Kafkova 1223/6, 779 00 Olomouc',
    lat: 49.5765,
    lng: 17.2212,
    city: 'Olomouc',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Olomouc Galerie Šantovka',
    address: 'Polská 1, 779 00 Olomouc',
    lat: 49.5888,
    lng: 17.2588,
    city: 'Olomouc',
  },

  // ===================== ČESKÉ BUDĚJOVICE =====================
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl České Budějovice Boženy Němcové',
    address: 'Boženy Němcové 1860, 370 01 České Budějovice',
    lat: 48.9620,
    lng: 14.4715,
    city: 'České Budějovice',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert České Budějovice Mercury',
    address: 'Nádražní 1759, 370 01 České Budějovice',
    lat: 48.9735,
    lng: 14.4862,
    city: 'České Budějovice',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa České Budějovice Lannova',
    address: 'Lannova tř. 208/23, 370 01 České Budějovice',
    lat: 48.9742,
    lng: 14.4815,
    city: 'České Budějovice',
  },

  // ===================== HRADEC KRÁLOVÉ =====================
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Hradec Králové Veverkova',
    address: 'Veverkova 1632, 500 02 Hradec Králové',
    lat: 50.2078,
    lng: 15.8085,
    city: 'Hradec Králové',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Hradec Králové Pilnáčkova',
    address: 'Pilnáčkova 436/11, 500 03 Hradec Králové',
    lat: 50.2215,
    lng: 15.8340,
    city: 'Hradec Králové',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Hradec Králové Atrium',
    address: 'Dukelská třída 1713/7, 500 02 Hradec Králové',
    lat: 50.2132,
    lng: 15.8152,
    city: 'Hradec Králové',
  },

  // ===================== PARDUBICE =====================
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Pardubice 17. listopadu',
    address: '17. listopadu 2753, 530 02 Pardubice',
    lat: 50.0315,
    lng: 15.7698,
    city: 'Pardubice',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Pardubice AFI',
    address: 'Masarykovo nám. 2799, 530 02 Pardubice',
    lat: 50.0355,
    lng: 15.7682,
    city: 'Pardubice',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Pardubice Grand',
    address: 'Náměstí Republiky 2686, 530 02 Pardubice',
    lat: 50.0372,
    lng: 15.7765,
    city: 'Pardubice',
  },

  // ===================== ÚSTÍ NAD LABEM =====================
  {
    storeId: 'st-lidl',
    chainName: 'Lidl Supermarket',
    branchName: 'Lidl Ústí nad Labem Žižkova',
    address: 'Žižkova 151, 400 01 Ústí nad Labem',
    lat: 50.6542,
    lng: 14.0210,
    city: 'Ústí nad Labem',
  },
  {
    storeId: 'st-albert',
    chainName: 'Albert Hypermarket',
    branchName: 'Albert Ústí nad Labem OC Forum',
    address: 'Bílinská 3490/6, 400 01 Ústí nad Labem',
    lat: 50.6588,
    lng: 14.0375,
    city: 'Ústí nad Labem',
  },
  {
    storeId: 'st-billa',
    chainName: 'Billa Supermarket',
    branchName: 'Billa Ústí nad Labem Mírové náměstí',
    address: 'Mírové náměstí 101/25, 400 01 Ústí nad Labem',
    lat: 50.6605,
    lng: 14.0402,
    city: 'Ústí nad Labem',
  },
  // KAUFLAND
  {
    storeId: 'st-kaufland',
    chainName: 'Kaufland Supermarket',
    branchName: 'Kaufland Praha Palmovka',
    address: 'Voctářova 2401/8, 180 00 Praha 8',
    lat: 50.1037,
    lng: 14.4735,
    city: 'Praha',
    district: 'Praha 8',
  },
  {
    storeId: 'st-kaufland',
    chainName: 'Kaufland Supermarket',
    branchName: 'Kaufland Praha Vypich',
    address: 'Bělohorská 242/262, 169 00 Praha 6',
    lat: 50.0825,
    lng: 14.3482,
    city: 'Praha',
    district: 'Praha 6',
  },
  {
    storeId: 'st-kaufland',
    chainName: 'Kaufland Supermarket',
    branchName: 'Kaufland Praha Michle',
    address: 'U Plynárny 1432/64, 140 00 Praha 4',
    lat: 50.0573,
    lng: 14.4608,
    city: 'Praha',
    district: 'Praha 4',
  },
  {
    storeId: 'st-kaufland',
    chainName: 'Kaufland Supermarket',
    branchName: 'Kaufland Brno Ponava',
    address: 'Sportovní 521/21, 602 00 Brno',
    lat: 49.2132,
    lng: 16.6084,
    city: 'Brno',
  },
  {
    storeId: 'st-kaufland',
    chainName: 'Kaufland Supermarket',
    branchName: 'Kaufland Plzeň Roudná',
    address: 'Lochotínská 1108/18, 301 00 Plzeň',
    lat: 49.7538,
    lng: 13.3779,
    city: 'Plzeň',
  },
  // TESCO
  {
    storeId: 'st-tesco',
    chainName: 'Tesco Supermarket',
    branchName: 'Tesco Praha Národní (Máj)',
    address: 'Národní 63/26, 110 00 Praha 1',
    lat: 50.0820,
    lng: 14.4187,
    city: 'Praha',
    district: 'Praha 1',
  },
  {
    storeId: 'st-tesco',
    chainName: 'Tesco Supermarket',
    branchName: 'Tesco Praha Nový Smíchov',
    address: 'Plzeňská 233/8, 150 00 Praha 5',
    lat: 50.0722,
    lng: 14.4037,
    city: 'Praha',
    district: 'Praha 5',
  },
  {
    storeId: 'st-tesco',
    chainName: 'Tesco Supermarket',
    branchName: 'Tesco Praha Eden Hypermarket',
    address: 'U Slavie 1527/3, 100 00 Praha 10',
    lat: 50.0682,
    lng: 14.4697,
    city: 'Praha',
    district: 'Praha 10',
  },
  {
    storeId: 'st-tesco',
    chainName: 'Tesco Supermarket',
    branchName: 'Tesco Brno Královo Pole',
    address: 'Cimburkova 593/4, 612 00 Brno',
    lat: 49.2311,
    lng: 16.6042,
    city: 'Brno',
  },
  {
    storeId: 'st-tesco',
    chainName: 'Tesco Supermarket',
    branchName: 'Tesco Plzeň Rokycanská',
    address: 'Rokycanská 1385/130, 312 00 Plzeň',
    lat: 49.7471,
    lng: 13.4192,
    city: 'Plzeň',
  },
  // PENNY MARKET
  {
    storeId: 'st-penny',
    chainName: 'Penny Market',
    branchName: 'Penny Market Praha Revoluční',
    address: 'Revoluční 724/7, 110 00 Praha 1',
    lat: 50.0901,
    lng: 14.4284,
    city: 'Praha',
    district: 'Praha 1',
  },
  {
    storeId: 'st-penny',
    chainName: 'Penny Market',
    branchName: 'Penny Market Praha Vršovická',
    address: 'Vršovická 1429/68, 101 00 Praha 10',
    lat: 50.0673,
    lng: 14.4593,
    city: 'Praha',
    district: 'Praha 10',
  },
  {
    storeId: 'st-penny',
    chainName: 'Penny Market',
    branchName: 'Penny Market Brno Líšeň',
    address: 'Jírova 2894/8, 628 00 Brno',
    lat: 49.2081,
    lng: 16.6853,
    city: 'Brno',
  },
  {
    storeId: 'st-penny',
    chainName: 'Penny Market',
    branchName: 'Penny Market Plzeň Slovany',
    address: 'Koterovská 2390/47, 326 00 Plzeň',
    lat: 49.7348,
    lng: 13.3985,
    city: 'Plzeň',
  },
  // GLOBUS
  {
    storeId: 'st-globus',
    chainName: 'Globus Hypermarket',
    branchName: 'Globus Praha Čakovice',
    address: 'Kostelecká 822/75, 196 00 Praha 9',
    lat: 50.1505,
    lng: 14.5098,
    city: 'Praha',
    district: 'Praha 9',
  },
  {
    storeId: 'st-globus',
    chainName: 'Globus Hypermarket',
    branchName: 'Globus Praha Zličín',
    address: 'Sárská 133/5, 155 21 Praha 5',
    lat: 50.0538,
    lng: 14.2882,
    city: 'Praha',
    district: 'Praha 5',
  },
  {
    storeId: 'st-globus',
    chainName: 'Globus Hypermarket',
    branchName: 'Globus Brno Ivanovice',
    address: 'Hradecká 408/40, 621 00 Brno',
    lat: 49.2625,
    lng: 16.5746,
    city: 'Brno',
  },
  {
    storeId: 'st-globus',
    chainName: 'Globus Hypermarket',
    branchName: 'Globus Plzeň Chotíkov',
    address: 'Chotíkov 385, 330 17 Chotíkov',
    lat: 49.7891,
    lng: 13.3274,
    city: 'Plzeň',
  },
];

function calcDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Finds the genuinely closest, real-world, verified branch for a given store chain.
 * Matches by GPS distance if coordinates are available, or by city/district text match.
 */
export function findNearestStoreBranch(
  storeId: string,
  userLat: number,
  userLng: number,
  cityName: string
): { address: string; lat: number; lng: number; branchName?: string } {
  const chainBranches = VERIFIED_CZECH_STORES.filter((b) => b.storeId === storeId);
  if (chainBranches.length === 0) {
    return {
      address: `Prodejna ${storeId.replace('st-', '').toUpperCase()}, ${cityName}`,
      lat: userLat,
      lng: userLng,
    };
  }

  const cleanCity = (cityName || '').toLowerCase();

  // If user has specific district in city name (e.g. "Plzeň, Bory" or "Praha 3")
  const districtMatch = chainBranches.find((b) => {
    const isSameCity = cleanCity.includes(b.city.toLowerCase());
    const isSameDistrict = b.district && cleanCity.includes(b.district.toLowerCase());
    return isSameCity && isSameDistrict;
  });

  if (districtMatch && (!userLat || userLat === 0)) {
    return {
      address: districtMatch.address,
      lat: districtMatch.lat,
      lng: districtMatch.lng,
      branchName: districtMatch.branchName,
    };
  }

  // Calculate Haversine distance to each branch in the chain
  if (userLat && userLng) {
    const scored = chainBranches.map((b) => ({
      branch: b,
      distMeters: calcDistanceMeters(userLat, userLng, b.lat, b.lng),
    }));

    scored.sort((a, b) => a.distMeters - b.distMeters);
    const closest = scored[0];

    // If within 35km of a verified branch, return that exact real branch
    if (closest && closest.distMeters <= 35000) {
      return {
        address: closest.branch.address,
        lat: closest.branch.lat,
        lng: closest.branch.lng,
        branchName: closest.branch.branchName,
      };
    }
  }

  // Fallback: match by city name
  const cityMatch = chainBranches.find((b) =>
    cleanCity.includes(b.city.toLowerCase())
  );
  if (cityMatch) {
    return {
      address: cityMatch.address,
      lat: cityMatch.lat,
      lng: cityMatch.lng,
      branchName: cityMatch.branchName,
    };
  }

  // Generic fallback if in a town without a predefined branch: DO NOT invent a fake street!
  const chainDisplayName =
    storeId === 'st-billa' ? 'Billa Supermarket' : storeId === 'st-albert' ? 'Albert Hypermarket' : 'Lidl Supermarket';
  const displayCity = cityName.split(',')[0].trim() || 'ČR';

  return {
    address: `${chainDisplayName}, ${displayCity}`,
    lat: userLat,
    lng: userLng,
    branchName: `${chainDisplayName}, ${displayCity}`,
  };
}
