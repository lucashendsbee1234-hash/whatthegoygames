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

/**
 * ============================================================================
 * 🎮 HOW TO ADD A NEW GAME DIRECTLY INTO THE CODE FILES
 * ============================================================================
 *
 * 1. Put your HTML game file into the `public/games/` folder
 *    (for example: `public/games/slope.html` or `public/games/cookieclicker.html`)
 *
 * 2. Add an entry to the `DEFAULT_GAMES` array below:
 *    {
 *      id: 'slope.html',
 *      filename: 'slope.html',
 *      title: 'Slope',
 *      url: './games/slope.html',
 *      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
 *    },
 *
 * 3. Commit and push your changes to GitHub!
 *    The game will immediately be playable across your main domain,
 *    all subdomains, mobile devices, and anywhere on the web.
 * ============================================================================
 */

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
