export interface Game {
  id: string;
  filename: string;
  title: string;
  url: string;
  imageUrl?: string;
  size?: number;
  updatedAt?: number;
  content?: string;
}

export const DEFAULT_GAMES: Game[] = [
  {
    id: 'retrobowl.html',
    filename: 'retrobowl.html',
    title: 'Retro Bowl',
    url: './games/retrobowl.html',
    imageUrl: 'https://res.cloudinary.com/oeweu9pq/image/upload/v1792544577/images_rmjw0a.jpg',
    size: 3073,
    updatedAt: 1793012264130,
  },
  {
    id: 'GTA3.html',
    filename: 'GTA3.html',
    title: 'GTA III',
    url: './games/GTA3.html',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80',
    size: 5464,
    updatedAt: 1793012264128,
  },
];

