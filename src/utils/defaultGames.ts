export interface Game {
  id: string;
  filename: string;
  title: string;
  url: string;
  imageUrl?: string;
  size?: number;
  updatedAt?: number;
}

export const DEFAULT_GAMES: Game[] = [
  {
    id: 'retrobowl.html',
    filename: 'retrobowl.html',
    title: 'Retro Bowl',
    url: '/games/retrobowl.html',
    imageUrl: 'https://res.cloudinary.com/oeweu9pq/image/upload/v1792544577/images_rmjw0a.jpg',
    size: 3073,
    updatedAt: Date.now(),
  },
  {
    id: 'GTA3.html',
    filename: 'GTA3.html',
    title: 'GTA III',
    url: '/games/GTA3.html',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80',
    size: 5464,
    updatedAt: Date.now() - 1000,
  },
  {
    id: 'slope.html',
    filename: 'slope.html',
    title: 'Slope 3D',
    url: '/games/slope.html',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
    size: 94,
    updatedAt: Date.now() - 2000,
  },
  {
    id: '2048.html',
    filename: '2048.html',
    title: '2048',
    url: '/games/2048.html',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
    size: 2395,
    updatedAt: Date.now() - 3000,
  },
  {
    id: 'flappy_bird.html',
    filename: 'flappy_bird.html',
    title: 'Flappy Bird',
    url: '/games/flappy_bird.html',
    imageUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=500&q=80',
    size: 1974,
    updatedAt: Date.now() - 4000,
  },
];
