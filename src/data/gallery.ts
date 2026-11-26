/**
 * Places shown in Synspective's public Data Gallery (https://www.synspective.com/gallery/),
 * indexed 26 Nov 2026. Title, date and imaging mode are as listed there.
 *
 * No imagery is stored in this project: `thumbnail` is the address of the preview image on
 * Synspective's own server, which the browser loads directly. The images are theirs.
 *
 * lat/lon are approximate positions of the named place, entered by hand. They are not the
 * exact centre of the image.
 */
export interface GalleryEntry {
  id: string
  title: string
  /** capture date, YYYY-MM-DD (UTC) */
  date: string | null
  mode: string | null
  lat: number
  lon: number
  /** preview image on Synspective's server */
  thumbnail: string
}

export const GALLERY: GalleryEntry[] = [
  {
    "id": "accra-ghana",
    "title": "Accra/Ghana",
    "date": "2025-02-27",
    "mode": "Sliding Spotlight 1",
    "lat": 5.56,
    "lon": -0.2,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Accra-ghana-SAR-SL-mode-2650px.jpg/500.jpg"
  },
  {
    "id": "amazon-region",
    "title": "Amazon Region/Brazil",
    "date": "2025-09-18",
    "mode": "Sliding Spotlight 1",
    "lat": -3.1,
    "lon": -60,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Amazon-Region-2650px.jpg/500.jpg"
  },
  {
    "id": "busan-south-korea",
    "title": "Busan/South Korea",
    "date": "2022-08-11",
    "mode": "Stripmap",
    "lat": 35.1,
    "lon": 129.04,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Busan_KV.jpg/500.jpg"
  },
  {
    "id": "cushing-usa",
    "title": "Cushing/Oklahoma/USA",
    "date": "2025-12-25",
    "mode": "Staring Spotlight 4",
    "lat": 35.98,
    "lon": -96.77,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Cushing-usa.png/500.png"
  },
  {
    "id": "denver-usa",
    "title": "Denver/USA",
    "date": "2026-01-30",
    "mode": "Sliding Spotlight 2",
    "lat": 39.74,
    "lon": -104.99,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/denver-2650px.jpg/500.jpg"
  },
  {
    "id": "east-japan-area",
    "title": "East Japan Area/Japan",
    "date": "2025-07-20",
    "mode": "Long Stripmap",
    "lat": 37.5,
    "lon": 140.5,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/LSM_EastJapan.jpg/500.jpg"
  },
  {
    "id": "el-dorado-international-airport-bogota-colombia",
    "title": "El Dorado International Airport, Bogota/Colombia",
    "date": "2025-09-20",
    "mode": "Sliding Spotlight 2",
    "lat": 4.7,
    "lon": -74.15,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/El-Dorado-airport-2650px.jpg/500.jpg"
  },
  {
    "id": "ferrari-world-united-arab-emirates",
    "title": "Ferrari World/United Arab Emirates",
    "date": "2025-10-04",
    "mode": "Staring Spotlight 4",
    "lat": 24.48,
    "lon": 54.61,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Ferrari-World-2650px.jpg/500.jpg"
  },
  {
    "id": "financial-district-new-york-city-usa",
    "title": "Financial District, New York City/USA",
    "date": "2025-07-12",
    "mode": "Staring Spotlight 4",
    "lat": 40.707,
    "lon": -74.011,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/NYC_2650px.jpg/500.jpg"
  },
  {
    "id": "hachiro-lagoon",
    "title": "Hachiro Lagoon/Japan",
    "date": "2022-12-12",
    "mode": "Stripmap",
    "lat": 40,
    "lon": 140,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/HachiroLagoon_2560_1440px.jpg/500.jpg"
  },
  {
    "id": "houston-usa",
    "title": "Houston Port/USA",
    "date": "2025-06-05",
    "mode": "Staring Spotlight 2",
    "lat": 29.73,
    "lon": -95.27,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Houston-texas-USA-2650px.jpg/500.jpg"
  },
  {
    "id": "karachi-pakistan",
    "title": "Karachi/Pakistan",
    "date": "2025-05-09",
    "mode": "Staring Spotlight 1",
    "lat": 24.86,
    "lon": 67.01,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/karachi-pakistan-2650px.jpg/500.jpg"
  },
  {
    "id": "la-rinconada-peru",
    "title": "La Rinconada/Peru",
    "date": "2026-06-18",
    "mode": "Spotlight Enhanced",
    "lat": -14.63,
    "lon": -69.45,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/La-Rinconada-2650px.jpg/500.jpg"
  },
  {
    "id": "lima-peru",
    "title": "Lima/Peru",
    "date": "2025-09-22",
    "mode": "Sliding Spotlight 1",
    "lat": -12.05,
    "lon": -77.04,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Lima-Peru-SL1-2650px.jpg/500.jpg"
  },
  {
    "id": "mount-lewotobi-laki-laki-indonesia",
    "title": "Mount Lewotobi Laki Laki/Indonesia",
    "date": "2024-11-15",
    "mode": "Staring Spotlight 1",
    "lat": -8.54,
    "lon": 122.78,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/mount_ewotobi_laki_laki.jpg/500.jpg"
  },
  {
    "id": "mozu-tombs",
    "title": "Mozu Tombs/Japan",
    "date": "2022-12-06",
    "mode": "Sliding Spotlight 1",
    "lat": 34.564,
    "lon": 135.487,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/MozuTombs_2560_1440px.jpg/500.jpg"
  },
  {
    "id": "mt-aso-japan",
    "title": "Mt. Aso/Japan",
    "date": "2026-06-15",
    "mode": "Sliding Spotlight 1",
    "lat": 32.88,
    "lon": 131.1,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Mt-Aso-2650px.jpg/500.jpg"
  },
  {
    "id": "mt-fuji-japan",
    "title": "Mt. Fuji/Japan",
    "date": "2025-07-21",
    "mode": "Staring Spotlight 3",
    "lat": 35.36,
    "lon": 138.73,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/mt-fuji-2650px.jpg/500.jpg"
  },
  {
    "id": "nairobi-kenya",
    "title": "Nairobi/Kenya",
    "date": "2025-02-22",
    "mode": "Stripmap",
    "lat": -1.29,
    "lon": 36.82,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Nairobi-Kenya-2650px.jpg/500.jpg"
  },
  {
    "id": "narita-airport-japan",
    "title": "Narita Airport/Japan",
    "date": "2026-03-29",
    "mode": "Spotlight Enhanced",
    "lat": 35.774,
    "lon": 140.386,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/narita-airport-2650px.jpg/500.jpg"
  },
  {
    "id": "narita-japan",
    "title": "Narita/Japan",
    "date": "2026-06-11",
    "mode": "Spotlight Enhanced",
    "lat": 35.78,
    "lon": 140.32,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Narita-2650px.jpg/500.jpg"
  },
  {
    "id": "norfolk-usa",
    "title": "Norfolk/USA",
    "date": "2026-01-22",
    "mode": "Sliding Spotlight 2",
    "lat": 36.95,
    "lon": -76.33,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Norfolk-2650px.jpg/500.jpg"
  },
  {
    "id": "offshore-wind-farm-denmark",
    "title": "Offshore Wind Farm/Denmark",
    "date": "2023-06-05",
    "mode": "Stripmap",
    "lat": 55.5,
    "lon": 7.9,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/offshore-wind-Denmark_KV.jpg/500.jpg"
  },
  {
    "id": "olympic-dam-australia",
    "title": "Olympic Dam/Australia",
    "date": "2022-08-29",
    "mode": "Stripmap",
    "lat": -30.44,
    "lon": 136.89,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/OlympicDam_KV.jpg/500.jpg"
  },
  {
    "id": "onagawa-japan",
    "title": "Onagawa/Japan",
    "date": "2023-03-16",
    "mode": "Stripmap",
    "lat": 38.45,
    "lon": 141.45,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Onagawa_KV.jpg/500.jpg"
  },
  {
    "id": "panama-canal-atlantic-side-panama",
    "title": "Panama Canal (Atlantic Side)/Panama",
    "date": "2025-07-20",
    "mode": "Sliding Spotlight 2",
    "lat": 9.3,
    "lon": -79.92,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/panama-canal-atlantic-2650px.jpg/500.jpg"
  },
  {
    "id": "panama-canal-pacific-side-panama",
    "title": "Panama Canal (Pacific Side)/Panama",
    "date": "2025-07-20",
    "mode": "Sliding Spotlight 2",
    "lat": 8.99,
    "lon": -79.59,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/panama-canal-pacific-2650px.jpg/500.jpg"
  },
  {
    "id": "port-of-santos-brazil",
    "title": "Port of Santos/Brazil",
    "date": "2025-08-08",
    "mode": "Sliding Spotlight 2",
    "lat": -23.96,
    "lon": -46.31,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Port-of-Santos-2650px.jpg/500.jpg"
  },
  {
    "id": "port-of-singapore-singapore",
    "title": "Port of Singapore/Singapore",
    "date": "2022-07-29",
    "mode": "Stripmap",
    "lat": 1.27,
    "lon": 103.8,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/port-of-singapore_KV.jpg/500.jpg"
  },
  {
    "id": "putrajaya-malaysia",
    "title": "Putrajaya/Malaysia",
    "date": "2022-08-29",
    "mode": "Sliding Spotlight 1",
    "lat": 2.93,
    "lon": 101.69,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Putrajaya_KV.jpg/500.jpg"
  },
  {
    "id": "rio-de-janeiro-brazil",
    "title": "Rio de Janeiro/Brazil",
    "date": "2025-09-24",
    "mode": "Sliding Spotlight 2",
    "lat": -22.91,
    "lon": -43.2,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Rio-de-Janeiro-2650px.jpg/500.jpg"
  },
  {
    "id": "sakurajima-japan",
    "title": "Sakurajima/Japan",
    "date": "2023-01-29",
    "mode": "Stripmap",
    "lat": 31.59,
    "lon": 130.66,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Sakurajima_KV.jpg/500.jpg"
  },
  {
    "id": "san-ysidro-border-crossing-us-mexico",
    "title": "San Ysidro Border Crossing/US-Mexico",
    "date": "2025-03-25",
    "mode": "Staring Spotlight 2",
    "lat": 32.543,
    "lon": -117.03,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/US-border.jpg/500.jpg"
  },
  {
    "id": "sao-paulo-guarulhos-international-airport-brazil",
    "title": "São Paulo/Guarulhos International Airport/Brazil",
    "date": "2025-08-09",
    "mode": "Sliding Spotlight 2",
    "lat": -23.43,
    "lon": -46.47,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/sao-paolo-airport-2650px.jpg/500.jpg"
  },
  {
    "id": "sevastopol",
    "title": "Sevastopol / Ukraine",
    "date": "2022-09-21",
    "mode": "Sliding Spotlight 1",
    "lat": 44.61,
    "lon": 33.52,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Sevastopol.jpg/500.jpg"
  },
  {
    "id": "soma-city-japan",
    "title": "Soma City/Japan",
    "date": "2024-06-23",
    "mode": "Stripmap",
    "lat": 37.8,
    "lon": 140.92,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/fukushima-coastline_KV.jpg/500.jpg"
  },
  {
    "id": "super-pit-australia",
    "title": "Super Pit/Australia",
    "date": "2025-04-26",
    "mode": "Sliding Spotlight 1",
    "lat": -30.78,
    "lon": 121.5,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Super-pit.jpg/500.jpg"
  },
  {
    "id": "susono-japan",
    "title": "Susono/Japan",
    "date": "2026-03-02",
    "mode": "Sliding Spotlight 2",
    "lat": 35.17,
    "lon": 138.91,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Susono-City-2650px.jpg/500.jpg"
  },
  {
    "id": "tashkent",
    "title": "Tashkent/Uzbekistan",
    "date": "2022-08-15",
    "mode": "Sliding Spotlight 1",
    "lat": 41.3,
    "lon": 69.24,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Tashkent_2560_1440px.jpg/500.jpg"
  },
  {
    "id": "the-line-saudi-arabia",
    "title": "The Line/Saudi Arabia",
    "date": "2025-12-18",
    "mode": "Sliding Spotlight 2",
    "lat": 28.1,
    "lon": 35.2,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/The-Line-Neom.jpg/500.jpg"
  },
  {
    "id": "ukrainka-air-base-russia",
    "title": "Ukrainka Air Base/Russia",
    "date": "2024-10-07",
    "mode": "Staring Spotlight 1",
    "lat": 51.17,
    "lon": 128.45,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/ukrainka_KV.jpg/500.jpg"
  },
  {
    "id": "venice-and-its-lagoon",
    "title": "Venice and its Lagoon/Italy",
    "date": "2022-12-12",
    "mode": "Stripmap",
    "lat": 45.44,
    "lon": 12.33,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/Venice.jpg/500.jpg"
  },
  {
    "id": "west-angelas-mine-australia",
    "title": "West Angelas Mine/Australia",
    "date": "2026-05-27",
    "mode": "Spotlight Enhanced",
    "lat": -23.17,
    "lon": 118.77,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/West-Angelas-Mine-2650px.jpg/500.jpg"
  },
  {
    "id": "yopal-colombia",
    "title": "Yopal/Colombia",
    "date": "2022-08-12",
    "mode": "Stripmap",
    "lat": 5.34,
    "lon": -72.4,
    "thumbnail": "https://www.synspective.com/files_thumbnail/co/gallery/yopal_KV.jpg/500.jpg"
  }
]
