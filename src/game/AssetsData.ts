export interface AssetItem {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  image: string;
}

export interface IslandItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  image: string;
  size: string; // e.g. "12 acres"
}

export const ISLAND_DATA: IslandItem[] = [
  { id: 'island-1', name: 'Coral Cay', subtitle: 'Tiny Caribbean islet', price: 500000, size: '2 acres', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=200&h=200&fit=crop' },
  { id: 'island-2', name: 'Palm Haven', subtitle: 'Tropical private island', price: 2000000, size: '8 acres', image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=200&h=200&fit=crop' },
  { id: 'island-3', name: 'Azure Isle', subtitle: 'Mediterranean paradise', price: 5000000, size: '15 acres', image: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=200&h=200&fit=crop' },
  { id: 'island-4', name: 'Sapphire Atoll', subtitle: 'South Pacific gem', price: 12000000, size: '30 acres', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=200&h=200&fit=crop' },
  { id: 'island-5', name: 'Emerald Key', subtitle: 'Bahamas luxury island', price: 25000000, size: '50 acres', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop' },
  { id: 'island-6', name: 'Royal Archipelago', subtitle: 'Private island chain', price: 75000000, size: '120 acres', image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=200&h=200&fit=crop' },
  { id: 'island-7', name: 'Sovereign Island', subtitle: 'Mega luxury estate', price: 200000000, size: '300 acres', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop' },
];

export const VEHICLE_DATA = {
  cars: [
    { id: 'car-1', name: 'Toyota Corolla', subtitle: 'Reliable daily driver', price: 25000, image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=200&h=200&fit=crop' },
    { id: 'car-2', name: 'BMW 3 Series', subtitle: 'Luxury sedan', price: 55000, image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=200&fit=crop' },
    { id: 'car-3', name: 'Mercedes-Benz S-Class', subtitle: 'Executive flagship', price: 120000, image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&h=200&fit=crop' },
    { id: 'car-4', name: 'Porsche 911', subtitle: 'Iconic sports car', price: 180000, image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=200&fit=crop' },
    { id: 'car-5', name: 'Ferrari F8 Tributo', subtitle: 'Italian supercar', price: 350000, image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=200&h=200&fit=crop' },
    { id: 'car-6', name: 'Lamborghini Huracán', subtitle: 'V10 beast', price: 400000, image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&h=200&fit=crop' },
    { id: 'car-7', name: 'Rolls-Royce Phantom', subtitle: 'Ultimate luxury', price: 600000, image: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=200&h=200&fit=crop' },
    { id: 'car-8', name: 'Bugatti Chiron', subtitle: 'Hypercar legend', price: 3000000, image: 'https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=200&h=200&fit=crop' },
  ] as AssetItem[],
  yachts: [
    { id: 'yacht-1', name: 'Beneteau Oceanis 30', subtitle: '30ft sailing yacht', price: 150000, image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=200&h=200&fit=crop' },
    { id: 'yacht-2', name: 'Princess V50', subtitle: '50ft motor yacht', price: 800000, image: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=200&h=200&fit=crop' },
    { id: 'yacht-3', name: 'Sunseeker 76', subtitle: '76ft luxury yacht', price: 3500000, image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=200&h=200&fit=crop' },
    { id: 'yacht-4', name: 'Azimut Grande 35M', subtitle: '115ft mega yacht', price: 12000000, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop' },
    { id: 'yacht-5', name: 'Benetti Superyacht', subtitle: '280ft superyacht', price: 100000000, image: 'https://images.unsplash.com/photo-1566847438217-76e82d383f84?w=200&h=200&fit=crop' },
  ] as AssetItem[],
  planes: [
    { id: 'plane-1', name: 'Cessna 172', subtitle: 'Single-engine prop', price: 400000, image: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=200&h=200&fit=crop' },
    { id: 'plane-2', name: 'Embraer Phenom 100', subtitle: 'Light jet', price: 5000000, image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=200&h=200&fit=crop' },
    { id: 'plane-3', name: 'Gulfstream G280', subtitle: 'Mid-size jet', price: 25000000, image: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=200&h=200&fit=crop' },
    { id: 'plane-4', name: 'Dassault Falcon 8X', subtitle: 'Ultra-long-range jet', price: 75000000, image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=200&h=200&fit=crop' },
    { id: 'plane-5', name: 'Boeing BBJ 787', subtitle: 'Private 787 Dreamliner', price: 350000000, image: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=200&h=200&fit=crop' },
  ] as AssetItem[],
};

export const COLLECTION_CATEGORIES = [
  {
    key: 'furniture',
    icon: '🪑',
    label: 'Furniture',
    items: [
      { id: 'furn-1', name: 'Eames Lounge Chair', subtitle: 'Herman Miller classic', price: 8000, image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200&h=200&fit=crop' },
      { id: 'furn-2', name: 'Noguchi Coffee Table', subtitle: 'Sculptural design', price: 5000, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop' },
      { id: 'furn-3', name: 'Knoll Barcelona Chair', subtitle: 'Mies van der Rohe', price: 7500, image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=200&h=200&fit=crop' },
      { id: 'furn-4', name: 'Cassina LC4 Chaise', subtitle: 'Le Corbusier', price: 12000, image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=200&h=200&fit=crop' },
      { id: 'furn-5', name: 'B&B Italia Sofa', subtitle: 'Italian luxury', price: 25000, image: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=200&h=200&fit=crop' },
      { id: 'furn-6', name: 'Steinway Grand Piano', subtitle: 'Concert grand', price: 180000, image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200&h=200&fit=crop' },
    ] as AssetItem[],
  },
  {
    key: 'paintings',
    icon: '🖼️',
    label: 'Paintings',
    items: [
      { id: 'paint-1', name: 'Contemporary Abstract', subtitle: 'Emerging artist', price: 15000, image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200&h=200&fit=crop' },
      { id: 'paint-2', name: 'Impressionist Landscape', subtitle: 'Oil on canvas', price: 50000, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&h=200&fit=crop' },
      { id: 'paint-3', name: 'Pop Art Print', subtitle: 'Limited edition', price: 80000, image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=200&h=200&fit=crop' },
      { id: 'paint-4', name: 'Renaissance Study', subtitle: 'Attributed master', price: 250000, image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=200&h=200&fit=crop' },
      { id: 'paint-5', name: 'Banksy Original', subtitle: 'Street art icon', price: 2000000, image: 'https://images.unsplash.com/photo-1551913902-c92207136625?w=200&h=200&fit=crop' },
      { id: 'paint-6', name: 'Basquiat Piece', subtitle: 'Neo-expressionism', price: 15000000, image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=200&h=200&fit=crop' },
    ] as AssetItem[],
  },
  {
    key: 'watches',
    icon: '⌚',
    label: 'Watches',
    items: [
      { id: 'watch-1', name: 'Omega Speedmaster', subtitle: 'Moonwatch', price: 7500, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&h=200&fit=crop' },
      { id: 'watch-2', name: 'Rolex Submariner', subtitle: 'Dive watch icon', price: 15000, image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=200&h=200&fit=crop' },
      { id: 'watch-3', name: 'Audemars Piguet Royal Oak', subtitle: 'Luxury sport', price: 45000, image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200&h=200&fit=crop' },
      { id: 'watch-4', name: 'Patek Philippe Nautilus', subtitle: 'Grail watch', price: 120000, image: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=200&h=200&fit=crop' },
      { id: 'watch-5', name: 'Richard Mille RM 011', subtitle: 'Billionaire\'s watch', price: 500000, image: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=200&h=200&fit=crop' },
    ] as AssetItem[],
  },
  {
    key: 'jewelry',
    icon: '💎',
    label: 'Jewelry',
    items: [
      { id: 'jewel-1', name: 'Gold Chain', subtitle: '18K Cuban link', price: 5000, image: 'https://images.unsplash.com/photo-1515562141589-67f0d952b2f3?w=200&h=200&fit=crop' },
      { id: 'jewel-2', name: 'Diamond Bracelet', subtitle: 'Tennis bracelet', price: 25000, image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=200&h=200&fit=crop' },
      { id: 'jewel-3', name: 'Emerald Ring', subtitle: 'Colombian emerald', price: 75000, image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop' },
      { id: 'jewel-4', name: 'Diamond Necklace', subtitle: 'Harry Winston', price: 250000, image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&h=200&fit=crop' },
      { id: 'jewel-5', name: 'Pink Diamond', subtitle: 'Extremely rare 5ct', price: 5000000, image: 'https://images.unsplash.com/photo-1586882829491-b81178aa622e?w=200&h=200&fit=crop' },
    ] as AssetItem[],
  },
];
