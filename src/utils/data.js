import gujaratVillageData from '../data/gujarat-villages.json';

export const gujaratStateOptions = [{ label: 'Gujarat', value: 'Gujarat' }];

const normalizeLocationData = (data) => {
  const normalized = {};

  Object.entries(data || {}).forEach(([district, talukas]) => {
    const cleanDistrict = district.trim();
    if (!normalized[cleanDistrict]) {
      normalized[cleanDistrict] = {};
    }

    Object.entries(talukas || {}).forEach(([taluka, villages]) => {
      const cleanTaluka = taluka.trim();
      const normalizedVillages = [...new Set((villages || []).map((v) => (v ? String(v).trim() : '')).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

      if (!normalized[cleanDistrict][cleanTaluka]) {
        normalized[cleanDistrict][cleanTaluka] = normalizedVillages;
      } else {
        normalized[cleanDistrict][cleanTaluka] = [...new Set([...normalized[cleanDistrict][cleanTaluka], ...normalizedVillages])]
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      }
    });
  });

  return normalized;
};

const gujaratLocationData = normalizeLocationData(gujaratVillageData.Gujarat || gujaratVillageData);
export const gujaratDistricts = Object.keys(gujaratLocationData);
export const gujaratSubDistricts = Object.fromEntries(
  Object.entries(gujaratLocationData).map(([district, talukas]) => [district, Object.keys(talukas)]),
);
export const gujaratVillages = Object.fromEntries(
  Object.entries(gujaratLocationData).map(([district, talukas]) => [
    district,
    Object.fromEntries(
      Object.entries(talukas).map(([taluka, villages]) => [taluka, villages]),
    ),
  ]),
);
export const gujaratLocationIndex = gujaratLocationData;

export const states = [
  {
    label: 'Gujarat',
    value: 'gujarat',
  },
];

export const propertyTypes = ['Agricultural Land', 'Non-Agricultural Land'];
export const amenities = ['Road access', 'Water source', 'Electricity nearby', 'Clear title', 'Fencing'];

const propertyImages = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85'
];

const legacySampleProperties = Array.from({ length: 24 }, (_, index) => {
  const district = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'][index % 4];
  const subDistrict = ['Ahmedabad City', 'Adajan', 'Waghodia', 'Rajkot'][index % 4];
  const type = ['Apartment', 'Villa', 'Plot', 'Farm House', 'Commercial', 'Office'][index % 6];
  const bedrooms = 2 + (index % 3);
  const bathrooms = 1 + (index % 2);
  const price = `₹${45 + index * 5} Lakh`;
  const address = `${['Prahlad Nagar', 'Vesu', 'Alkapuri', 'Kalawad Road'][index % 4]}, ${district}`;
  const status = ['Available', 'Pending', 'Sold'][index % 3];
  const image = propertyImages[index % propertyImages.length];

  return {
    id: `prop-${index + 1}`,
    title: `${['Light-filled', 'Garden-facing', 'Quiet corner', 'Architect-designed'][index % 4]} ${['Apartment', 'House', 'Villa', 'Office'][index % 4]}`,
    price,
    location: district,
    city: district,
    district,
    subDistrict,
    type,
    bedrooms,
    bathrooms,
    area: `${850 + index * 20} sqft`,
    owner: `Owner ${index + 1}`,
    verified: index % 2 === 0,
    image,
    gallery: [image, propertyImages[(index + 1) % propertyImages.length], propertyImages[(index + 2) % propertyImages.length]],
    tags: index % 3 === 0 ? ['New listing', 'Parking'] : ['Verified', 'Ready to move'],
    address,
    furnished: index % 3 !== 0,
    parking: index % 4 !== 1,
    readyToMove: index % 5 !== 0,
    description: 'A well-planned property with bright rooms, practical finishes, and a location that keeps everyday essentials close.',
    amenities: ['Lift', 'Parking', 'Security'].slice(0, 2 + (index % 2)),
    facing: ['East', 'North', 'West', 'South'][index % 4],
    sellerName: `Agent ${index + 1}`,
    sellerPhone: `+91 98765 43${100 + index}`,
    sellerEmail: `agent${index + 1}@brokerstreets.in`,
    mapUrl: `https://www.google.com/maps?q=${encodeURIComponent(`${address}, ${district}`)}&output=embed`,
    status,
  };
});

const landImages = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1488542612085-1342d9baf66e?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1497864149931-5d6a77a8f7b8?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1445019980597-5f76dbe8cb11?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1460537480680-508c53563a10?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85',
];
const landListingSeed = [
  ['Mango Farm', 'Navsari', 'Gandevi', 'Agricultural Land', 12500000, '4 Acres', 'Gandevi', 'Gandevi'],
  ['Sugarcane Farm', 'Navsari', 'Chikhli', 'Agricultural Land', 8800000, '3 Acres', 'Chikhli', 'Chikhli'],
  ['Banana Farm', 'Navsari', 'Bilimora', 'Agricultural Land', 9600000, '2.7 Acres', 'Gandevi', 'Bilimora'],
  ['Cotton Farm', 'Navsari', 'Amalsad', 'Agricultural Land', 7200000, '2 Acres', 'Gandevi', 'Amalsad'],
  ['Agricultural Plot', 'Navsari', 'Jalalpore', 'Agricultural Land', 4800000, '1.2 Acres', 'Jalalpore', 'Jalalpore'],
  ['Residential NA Plot', 'Surat', 'Vesu', 'Non-Agricultural Land', 11000000, '540 sq yd', 'Palsana', 'Vesu'],
  ['Commercial NA Plot', 'Surat', 'Adajan', 'Non-Agricultural Land', 14500000, '410 sq yd', 'Choryasi', 'Adajan'],
  ['Industrial NA Plot', 'Surat', 'Piplod', 'Non-Agricultural Land', 18000000, '1 Acre', 'Choryasi', 'Piplod'],
  ['Investment NA Plot', 'Surat', 'Pal', 'Non-Agricultural Land', 8400000, '360 sq yd', 'Choryasi', 'Pal'],
];
export const sampleProperties = landListingSeed.map(([title, city, location, propertyType, price, landArea, taluka, village], index) => {
  const image = landImages[index % landImages.length];
  const address = `${location}, ${city}, Gujarat`;
  const sellerType = index % 3 === 0 ? 'owner' : index % 3 === 1 ? 'agent' : undefined;
  return { id: `land-${index + 1}`, sellerType, title, city, location, district: city, subDistrict: taluka || location, taluka: taluka || location, village: village || location, type: propertyType, propertyType, price, priceAmount: price, area: landArea, landArea, googleMaps: `https://www.google.com/maps?q=${encodeURIComponent(address)}`, mapUrl: `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`, description: `${title} with clear access, local connectivity, and verified land details.`, images: [image, landImages[(index + 1) % landImages.length], landImages[(index + 2) % landImages.length]], gallery: [image, landImages[(index + 1) % landImages.length], landImages[(index + 2) % landImages.length]], image, pdf: '#', documentUrl: '#', seller: { name: `Broker Streets Partner ${index + 1}`, phone: `+91 98765 43${100 + index}`, type: sellerType, sellerType }, sellerName: `Broker Streets Partner ${index + 1}`, sellerPhone: `+91 98765 43${100 + index}`, uploadedDate: '2026-08-04', amenities, owner: `Broker Streets Partner ${index + 1}`, verified: true, status: 'Available', address, tags: ['Verified land'] };
});

export const popularCities = [
  { name: 'Ahmedabad', count: '428 homes', image: propertyImages[0] },
  { name: 'Surat', count: '312 homes', image: propertyImages[1] },
  { name: 'Vadodara', count: '186 homes', image: propertyImages[2] },
  { name: 'Rajkot', count: '124 homes', image: propertyImages[3] },
  { name: 'Gandhinagar', count: '96 homes', image: propertyImages[0] },
  { name: 'Navsari', count: '74 homes', image: propertyImages[1] }
];
