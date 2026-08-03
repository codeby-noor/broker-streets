export const states = [
  { label: 'Gujarat', value: 'gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Gandhinagar', 'Mehsana', 'Morbi', 'Nadiad', 'Bharuch', 'Navsari', 'Valsad', 'Porbandar', 'Palanpur', 'Godhra', 'Botad', 'Amreli'] },
  { label: 'Maharashtra', value: 'maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'] }
];

export const propertyTypes = ['Apartment', 'Villa', 'Plot', 'Farm House', 'Commercial', 'Office'];
export const amenities = ['Lift', 'Parking', 'Garden', 'Security', 'Pet Friendly'];

const propertyImages = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85'
];

export const sampleProperties = Array.from({ length: 24 }, (_, index) => {
  const location = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'][index % 4];
  const type = ['Apartment', 'Villa', 'Plot', 'Farm House', 'Commercial', 'Office'][index % 6];
  const bedrooms = 2 + (index % 3);
  const bathrooms = 1 + (index % 2);
  const price = `₹${45 + index * 5} Lakh`;
  const address = `${['Prahlad Nagar', 'Vesu', 'Alkapuri', 'Kalawad Road'][index % 4]}, ${location}`;
  const status = ['Available', 'Pending', 'Sold'][index % 3];
  const image = propertyImages[index % propertyImages.length];

  return {
    id: `prop-${index + 1}`,
    title: `${['Light-filled', 'Garden-facing', 'Quiet corner', 'Architect-designed'][index % 4]} ${['Apartment', 'House', 'Villa', 'Office'][index % 4]}`,
    price,
    location,
    city: location,
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
    mapUrl: `https://www.google.com/maps?q=${encodeURIComponent(`${address}, ${location}`)}&output=embed`,
    status,
  };
});

export const popularCities = [
  { name: 'Ahmedabad', count: '428 homes', image: propertyImages[0] },
  { name: 'Surat', count: '312 homes', image: propertyImages[1] },
  { name: 'Vadodara', count: '186 homes', image: propertyImages[2] },
  { name: 'Rajkot', count: '124 homes', image: propertyImages[3] },
  { name: 'Gandhinagar', count: '96 homes', image: propertyImages[0] },
  { name: 'Navsari', count: '74 homes', image: propertyImages[1] }
];
