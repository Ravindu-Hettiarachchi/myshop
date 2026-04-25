/**
 * Sri Lanka Official Administrative Locations Dataset
 * Province → District → City (hierarchical)
 * Source: Sri Lanka Government Administrative Divisions
 */

export interface SriLankaCity {
  name: string;
  postalCode?: string;
}

export interface SriLankaDistrict {
  name: string;
  cities: SriLankaCity[];
}

export interface SriLankaProvince {
  name: string;
  districts: SriLankaDistrict[];
}

export const SRI_LANKA_LOCATIONS: SriLankaProvince[] = [
  {
    name: 'Western Province',
    districts: [
      {
        name: 'Colombo',
        cities: [
          { name: 'Colombo 01', postalCode: '00100' },
          { name: 'Colombo 02', postalCode: '00200' },
          { name: 'Colombo 03', postalCode: '00300' },
          { name: 'Colombo 04', postalCode: '00400' },
          { name: 'Colombo 05', postalCode: '00500' },
          { name: 'Colombo 06', postalCode: '00600' },
          { name: 'Colombo 07', postalCode: '00700' },
          { name: 'Colombo 08', postalCode: '00800' },
          { name: 'Colombo 09', postalCode: '00900' },
          { name: 'Colombo 10', postalCode: '01000' },
          { name: 'Dehiwala', postalCode: '10350' },
          { name: 'Mount Lavinia', postalCode: '10370' },
          { name: 'Moratuwa', postalCode: '10400' },
          { name: 'Ratmalana', postalCode: '10390' },
          { name: 'Athurugiriya', postalCode: '10150' },
          { name: 'Battaramulla', postalCode: '10120' },
          { name: 'Boralesgamuwa', postalCode: '10290' },
          { name: 'Kaduwela', postalCode: '10640' },
          { name: 'Kesbewa', postalCode: '10240' },
          { name: 'Kolonnawa', postalCode: '10600' },
          { name: 'Maharagama', postalCode: '10280' },
          { name: 'Sri Jayawardenepura Kotte', postalCode: '10100' },
          { name: 'Nugegoda', postalCode: '10250' },
          { name: 'Pannipitiya', postalCode: '10230' },
          { name: 'Padukka', postalCode: '10500' },
          { name: 'Piliyandala', postalCode: '10300' },
          { name: 'Homagama', postalCode: '10200' },
          { name: 'Avissawella', postalCode: '10700' },
          { name: 'Seethawaka', postalCode: '10750' },
        ],
      },
      {
        name: 'Gampaha',
        cities: [
          { name: 'Gampaha', postalCode: '11000' },
          { name: 'Negombo', postalCode: '11500' },
          { name: 'Wattala', postalCode: '11300' },
          { name: 'Ragama', postalCode: '11010' },
          { name: 'Ja-Ela', postalCode: '11350' },
          { name: 'Kandana', postalCode: '11320' },
          { name: 'Katunayake', postalCode: '11450' },
          { name: 'Minuwangoda', postalCode: '11550' },
          { name: 'Divulapitiya', postalCode: '11190' },
          { name: 'Mirigama', postalCode: '11200' },
          { name: 'Nittambuwa', postalCode: '11880' },
          { name: 'Veyangoda', postalCode: '11000' },
          { name: 'Kelaniya', postalCode: '11600' },
          { name: 'Peliyagoda', postalCode: '11900' },
          { name: 'Ekala', postalCode: '11370' },
          { name: 'Seeduwa', postalCode: '11410' },
          { name: 'Hendala', postalCode: '11380' },
          { name: 'Mahara', postalCode: '11170' },
          { name: 'Ganemulla', postalCode: '11020' },
          { name: 'Pugoda', postalCode: '11680' },
          { name: 'Dompe', postalCode: '11150' },
          { name: 'Kirindiwela', postalCode: '11650' },
        ],
      },
      {
        name: 'Kalutara',
        cities: [
          { name: 'Kalutara', postalCode: '12000' },
          { name: 'Panadura', postalCode: '12500' },
          { name: 'Horana', postalCode: '12400' },
          { name: 'Bandaragama', postalCode: '12530' },
          { name: 'Beruwala', postalCode: '12070' },
          { name: 'Aluthgama', postalCode: '12080' },
          { name: 'Bentota', postalCode: '80500' },
          { name: 'Matugama', postalCode: '12300' },
          { name: 'Ingiriya', postalCode: '12350' },
          { name: 'Agalawatta', postalCode: '12200' },
          { name: 'Wadduwa', postalCode: '12560' },
          { name: 'Payagala', postalCode: '12510' },
          { name: 'Dodangoda', postalCode: '12010' },
          { name: 'Walallawita', postalCode: '12460' },
        ],
      },
    ],
  },
  {
    name: 'Central Province',
    districts: [
      {
        name: 'Kandy',
        cities: [
          { name: 'Kandy', postalCode: '20000' },
          { name: 'Peradeniya', postalCode: '20400' },
          { name: 'Katugastota', postalCode: '20800' },
          { name: 'Gampola', postalCode: '20500' },
          { name: 'Nawalapitiya', postalCode: '20550' },
          { name: 'Teldeniya', postalCode: '20150' },
          { name: 'Kundasale', postalCode: '20170' },
          { name: 'Akurana', postalCode: '20850' },
          { name: 'Wattegama', postalCode: '20620' },
          { name: 'Hasalaka', postalCode: '20660' },
          { name: 'Gelioya', postalCode: '20180' },
          { name: 'Poojapitiya', postalCode: '20250' },
          { name: 'Pilimathalawa', postalCode: '20450' },
          { name: 'Theldeniya', postalCode: '20150' },
        ],
      },
      {
        name: 'Matale',
        cities: [
          { name: 'Matale', postalCode: '21000' },
          { name: 'Dambulla', postalCode: '21100' },
          { name: 'Sigiriya', postalCode: '21120' },
          { name: 'Galewela', postalCode: '21200' },
          { name: 'Rattota', postalCode: '21300' },
          { name: 'Ukuwela', postalCode: '21050' },
          { name: 'Yatawatta', postalCode: '21350' },
          { name: 'Naula', postalCode: '21310' },
          { name: 'Pallepola', postalCode: '21170' },
          { name: 'Palapathwela', postalCode: '21160' },
        ],
      },
      {
        name: 'Nuwara Eliya',
        cities: [
          { name: 'Nuwara Eliya', postalCode: '22200' },
          { name: 'Hatton', postalCode: '22500' },
          { name: 'Talawakele', postalCode: '22450' },
          { name: 'Kotagala', postalCode: '22460' },
          { name: 'Nawalapitiya', postalCode: '22550' },
          { name: 'Maskeliya', postalCode: '22350' },
          { name: 'Ginigathena', postalCode: '22300' },
          { name: 'Bogawantalawa', postalCode: '22310' },
          { name: 'Ragala', postalCode: '22280' },
          { name: 'Rikillagaskada', postalCode: '22260' },
        ],
      },
    ],
  },
  {
    name: 'Southern Province',
    districts: [
      {
        name: 'Galle',
        cities: [
          { name: 'Galle', postalCode: '80000' },
          { name: 'Hikkaduwa', postalCode: '80240' },
          { name: 'Ambalangoda', postalCode: '80300' },
          { name: 'Balapitiya', postalCode: '80550' },
          { name: 'Elpitiya', postalCode: '80400' },
          { name: 'Baddegama', postalCode: '80100' },
          { name: 'Karandeniya', postalCode: '80470' },
          { name: 'Wanduramba', postalCode: '80120' },
          { name: 'Neluwa', postalCode: '80170' },
          { name: 'Nagoda', postalCode: '80680' },
          { name: 'Akmeemana', postalCode: '80010' },
          { name: 'Imaduwa', postalCode: '80150' },
          { name: 'Habaraduwa', postalCode: '80520' },
        ],
      },
      {
        name: 'Matara',
        cities: [
          { name: 'Matara', postalCode: '81000' },
          { name: 'Weligama', postalCode: '81700' },
          { name: 'Mirissa', postalCode: '81740' },
          { name: 'Dickwella', postalCode: '81350' },
          { name: 'Devinuwara', postalCode: '81070' },
          { name: 'Hakmana', postalCode: '81250' },
          { name: 'Akuressa', postalCode: '81400' },
          { name: 'Deniyaya', postalCode: '81500' },
          { name: 'Kamburupitiya', postalCode: '81300' },
          { name: 'Pasgoda', postalCode: '81450' },
          { name: 'Malimbada', postalCode: '81520' },
          { name: 'Pitabeddara', postalCode: '81580' },
        ],
      },
      {
        name: 'Hambantota',
        cities: [
          { name: 'Hambantota', postalCode: '82000' },
          { name: 'Tangalle', postalCode: '82200' },
          { name: 'Tissamaharama', postalCode: '82500' },
          { name: 'Ambalantota', postalCode: '82100' },
          { name: 'Beliatta', postalCode: '82300' },
          { name: 'Weeraketiya', postalCode: '82350' },
          { name: 'Suriyawewa', postalCode: '82050' },
          { name: 'Walasmulla', postalCode: '82460' },
          { name: 'Kataragama', postalCode: '82600' },
          { name: 'Lunugamvehera', postalCode: '82550' },
        ],
      },
    ],
  },
  {
    name: 'Northern Province',
    districts: [
      {
        name: 'Jaffna',
        cities: [
          { name: 'Jaffna', postalCode: '40000' },
          { name: 'Nallur', postalCode: '40020' },
          { name: 'Chavakachcheri', postalCode: '40200' },
          { name: 'Point Pedro', postalCode: '40400' },
          { name: 'Kopay', postalCode: '40130' },
          { name: 'Valvettithurai', postalCode: '40550' },
          { name: 'Kayts', postalCode: '40700' },
          { name: 'Sandilipay', postalCode: '40150' },
        ],
      },
      {
        name: 'Kilinochchi',
        cities: [
          { name: 'Kilinochchi', postalCode: '44000' },
          { name: 'Karachchi', postalCode: '44100' },
          { name: 'Pallai', postalCode: '44200' },
          { name: 'Poonakary', postalCode: '44300' },
        ],
      },
      {
        name: 'Mannar',
        cities: [
          { name: 'Mannar', postalCode: '43000' },
          { name: 'Murunkan', postalCode: '43100' },
          { name: 'Nanattan', postalCode: '43200' },
          { name: 'Madhu', postalCode: '43300' },
        ],
      },
      {
        name: 'Vavuniya',
        cities: [
          { name: 'Vavuniya', postalCode: '43000' },
          { name: 'Nedunkerni', postalCode: '43050' },
          { name: 'Cheddikulam', postalCode: '43100' },
        ],
      },
      {
        name: 'Mullaitivu',
        cities: [
          { name: 'Mullaitivu', postalCode: '42000' },
          { name: 'Oddusuddan', postalCode: '42100' },
          { name: 'Puthukkudiyiruppu', postalCode: '42200' },
        ],
      },
    ],
  },
  {
    name: 'Eastern Province',
    districts: [
      {
        name: 'Trincomalee',
        cities: [
          { name: 'Trincomalee', postalCode: '31000' },
          { name: 'Kinniya', postalCode: '31050' },
          { name: 'Muttur', postalCode: '31100' },
          { name: 'Kantale', postalCode: '31200' },
          { name: 'Seruwila', postalCode: '31300' },
          { name: 'Nilaveli', postalCode: '31010' },
          { name: 'Uppuveli', postalCode: '31005' },
        ],
      },
      {
        name: 'Batticaloa',
        cities: [
          { name: 'Batticaloa', postalCode: '30000' },
          { name: 'Kattankudy', postalCode: '30060' },
          { name: 'Valaichchenai', postalCode: '30500' },
          { name: 'Eravur', postalCode: '30100' },
          { name: 'Chenkaladi', postalCode: '30250' },
          { name: 'Valaichenai', postalCode: '30500' },
        ],
      },
      {
        name: 'Ampara',
        cities: [
          { name: 'Ampara', postalCode: '32000' },
          { name: 'Kalmunai', postalCode: '32300' },
          { name: 'Sainthamaruthu', postalCode: '32340' },
          { name: 'Sammanthurai', postalCode: '32400' },
          { name: 'Akkaraipattu', postalCode: '32500' },
          { name: 'Pottuvil', postalCode: '32600' },
          { name: 'Uhana', postalCode: '32100' },
          { name: 'Maha Oya', postalCode: '32200' },
          { name: 'Padiyathalawa', postalCode: '32350' },
        ],
      },
    ],
  },
  {
    name: 'North Western Province',
    districts: [
      {
        name: 'Kurunegala',
        cities: [
          { name: 'Kurunegala', postalCode: '60000' },
          { name: 'Kuliyapitiya', postalCode: '60200' },
          { name: 'Mawathagama', postalCode: '60300' },
          { name: 'Nikaweratiya', postalCode: '60400' },
          { name: 'Pannala', postalCode: '60100' },
          { name: 'Wariyapola', postalCode: '60500' },
          { name: 'Polgahawela', postalCode: '60350' },
          { name: 'Narammala', postalCode: '60260' },
          { name: 'Bingiriya', postalCode: '60110' },
          { name: 'Alawwa', postalCode: '60800' },
          { name: 'Ibbagamuwa', postalCode: '60700' },
          { name: 'Giriulla', postalCode: '60140' },
          { name: 'Hettipola', postalCode: '60640' },
        ],
      },
      {
        name: 'Puttalam',
        cities: [
          { name: 'Puttalam', postalCode: '61300' },
          { name: 'Chilaw', postalCode: '61000' },
          { name: 'Wennappuwa', postalCode: '61070' },
          { name: 'Marawila', postalCode: '61100' },
          { name: 'Nattandiya', postalCode: '61140' },
          { name: 'Madampe', postalCode: '61200' },
          { name: 'Anamaduwa', postalCode: '61400' },
          { name: 'Mahawewa', postalCode: '61260' },
          { name: 'Dankotuwa', postalCode: '61080' },
          { name: 'Bangadeniya', postalCode: '61195' },
        ],
      },
    ],
  },
  {
    name: 'North Central Province',
    districts: [
      {
        name: 'Anuradhapura',
        cities: [
          { name: 'Anuradhapura', postalCode: '50000' },
          { name: 'Kekirawa', postalCode: '50200' },
          { name: 'Medawachchiya', postalCode: '50500' },
          { name: 'Eppawala', postalCode: '50270' },
          { name: 'Nochchiyagama', postalCode: '50550' },
          { name: 'Tambuttegama', postalCode: '50350' },
          { name: 'Galnewa', postalCode: '50150' },
          { name: 'Mihintale', postalCode: '50300' },
          { name: 'Thalawa', postalCode: '50050' },
          { name: 'Talawa', postalCode: '50050' },
          { name: 'Kebithigollewa', postalCode: '50520' },
          { name: 'Kahatagasdigiliya', postalCode: '50530' },
        ],
      },
      {
        name: 'Polonnaruwa',
        cities: [
          { name: 'Polonnaruwa', postalCode: '51000' },
          { name: 'Kaduruwela', postalCode: '51000' },
          { name: 'Hingurakgoda', postalCode: '51300' },
          { name: 'Medirigiriya', postalCode: '51500' },
          { name: 'Minneriya', postalCode: '51350' },
          { name: 'Manampitiya', postalCode: '51100' },
          { name: 'Dimbulagala', postalCode: '51400' },
        ],
      },
    ],
  },
  {
    name: 'Uva Province',
    districts: [
      {
        name: 'Badulla',
        cities: [
          { name: 'Badulla', postalCode: '90000' },
          { name: 'Bandarawela', postalCode: '90100' },
          { name: 'Haputale', postalCode: '90300' },
          { name: 'Welimada', postalCode: '90200' },
          { name: 'Mahiyangana', postalCode: '90600' },
          { name: 'Passara', postalCode: '90500' },
          { name: 'Hali-Ela', postalCode: '90060' },
          { name: 'Lunugala', postalCode: '90050' },
          { name: 'Diyathalawa', postalCode: '90135' },
          { name: 'Kandaketiya', postalCode: '90490' },
          { name: 'Soranathota', postalCode: '90350' },
        ],
      },
      {
        name: 'Moneragala',
        cities: [
          { name: 'Moneragala', postalCode: '91000' },
          { name: 'Wellawaya', postalCode: '91200' },
          { name: 'Bibile', postalCode: '91100' },
          { name: 'Buttala', postalCode: '91500' },
          { name: 'Siyambalanduwa', postalCode: '91300' },
          { name: 'Kataragama', postalCode: '82600' },
          { name: 'Medagama', postalCode: '91050' },
        ],
      },
    ],
  },
  {
    name: 'Sabaragamuwa Province',
    districts: [
      {
        name: 'Ratnapura',
        cities: [
          { name: 'Ratnapura', postalCode: '70000' },
          { name: 'Embilipitiya', postalCode: '70450' },
          { name: 'Pelmadulla', postalCode: '70100' },
          { name: 'Balangoda', postalCode: '70100' },
          { name: 'Kahawatta', postalCode: '70250' },
          { name: 'Nivitigala', postalCode: '70300' },
          { name: 'Eheliyagoda', postalCode: '70540' },
          { name: 'Kuruvita', postalCode: '70500' },
          { name: 'Kalawana', postalCode: '70200' },
          { name: 'Rakwana', postalCode: '70150' },
          { name: 'Godakawela', postalCode: '70350' },
        ],
      },
      {
        name: 'Kegalle',
        cities: [
          { name: 'Kegalle', postalCode: '71000' },
          { name: 'Mawanella', postalCode: '71200' },
          { name: 'Rambukkana', postalCode: '71100' },
          { name: 'Ruwanwella', postalCode: '71600' },
          { name: 'Galigamuwa', postalCode: '71700' },
          { name: 'Yatiyanthota', postalCode: '71500' },
          { name: 'Aranayaka', postalCode: '71260' },
          { name: 'Deraniyagala', postalCode: '71400' },
          { name: 'Warakapola', postalCode: '71240' },
          { name: 'Bulathkohupitiya', postalCode: '71800' },
        ],
      },
    ],
  },
];

// Helper utilities
export function getProvinceNames(): string[] {
  return SRI_LANKA_LOCATIONS.map(p => p.name);
}

export function getDistrictsForProvince(provinceName: string): string[] {
  const province = SRI_LANKA_LOCATIONS.find(p => p.name === provinceName);
  return province ? province.districts.map(d => d.name) : [];
}

export function getCitiesForDistrict(provinceName: string, districtName: string): SriLankaCity[] {
  const province = SRI_LANKA_LOCATIONS.find(p => p.name === provinceName);
  if (!province) return [];
  const district = province.districts.find(d => d.name === districtName);
  return district ? district.cities : [];
}

export function getPostalCodeForCity(provinceName: string, districtName: string, cityName: string): string | undefined {
  const cities = getCitiesForDistrict(provinceName, districtName);
  const city = cities.find(c => c.name === cityName);
  return city?.postalCode;
}

// ─── Geocode → Dataset fuzzy matcher ─────────────────────────────────────────

export interface GeoMatchResult {
  province: string;
  district: string;
  city: string;
  postalCode: string;
  /** true when one or more fields could not be matched */
  partial: boolean;
  unmatched: string[];
}

/**
 * matchLocationFromGeocode
 * Maps raw Nominatim address fields → internal SRI_LANKA_LOCATIONS dataset.
 * Strategy: exact match → case-insensitive contains fallback.
 *
 * @param apiState   e.g. "Western Province" or "North Western Province"
 * @param apiCounty  e.g. "Colombo District" or "Gampaha"
 * @param apiCity    e.g. "Dehiwala" or "Mount Lavinia"
 * @param apiPostal  raw postcode from API (may contain letters or be empty)
 */
export function matchLocationFromGeocode(
  apiState: string,
  apiCounty: string,
  apiCity: string,
  apiPostal: string,
): GeoMatchResult {
  // Strip common suffixes before comparing
  const norm = (s: string) =>
    s.toLowerCase()
      .replace(/\s+district$/i, '')
      .replace(/\s+province$/i, '')
      .trim();

  const unmatched: string[] = [];

  // ── Province ────────────────────────────────────────────────────────────────
  const normState = norm(apiState);
  let matchedProvince = SRI_LANKA_LOCATIONS.find(p => norm(p.name) === normState);
  if (!matchedProvince && normState) {
    matchedProvince = SRI_LANKA_LOCATIONS.find(
      p => norm(p.name).includes(normState) || normState.includes(norm(p.name))
    );
  }
  if (!matchedProvince && apiState) unmatched.push(`Province: "${apiState}"`);

  // ── District ─────────────────────────────────────────────────────────────
  const normCounty = norm(apiCounty);
  const districtPool = matchedProvince
    ? matchedProvince.districts
    : SRI_LANKA_LOCATIONS.flatMap(p => p.districts);

  let matchedDistrict = districtPool.find(d => norm(d.name) === normCounty);
  if (!matchedDistrict && normCounty) {
    matchedDistrict = districtPool.find(
      d => norm(d.name).includes(normCounty) || normCounty.includes(norm(d.name))
    );
  }
  // District found in a different province? Walk up to find its province.
  if (matchedDistrict && !matchedProvince) {
    matchedProvince = SRI_LANKA_LOCATIONS.find(p =>
      p.districts.some(d => d.name === matchedDistrict!.name)
    );
  }
  if (!matchedDistrict && apiCounty) unmatched.push(`District: "${apiCounty}"`);

  // ── City ─────────────────────────────────────────────────────────────────
  const normCity = norm(apiCity);
  const cityPool = matchedDistrict
    ? matchedDistrict.cities
    : matchedProvince
      ? matchedProvince.districts.flatMap(d => d.cities)
      : SRI_LANKA_LOCATIONS.flatMap(p => p.districts.flatMap(d => d.cities));

  let matchedCity = cityPool.find(c => norm(c.name) === normCity);
  if (!matchedCity && normCity) {
    matchedCity = cityPool.find(
      c => norm(c.name).includes(normCity) || normCity.includes(norm(c.name))
    );
  }
  if (!matchedCity && apiCity) unmatched.push(`City: "${apiCity}"`);

  // ── Postal code ───────────────────────────────────────────────────────────
  const cleaned = apiPostal.replace(/\D/g, '').slice(0, 5);
  const postalCode = /^\d{5}$/.test(cleaned)
    ? cleaned
    : (matchedCity?.postalCode ?? '');

  return {
    province:  matchedProvince?.name ?? '',
    district:  matchedDistrict?.name ?? '',
    city:      matchedCity?.name ?? '',
    postalCode,
    partial:   unmatched.length > 0,
    unmatched,
  };
}
