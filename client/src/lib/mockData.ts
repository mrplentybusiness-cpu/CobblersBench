import mensShoes from '@assets/stock_images/mens_leather_dress_s_dcd2b9b2.jpg';
import heelsRepair from '@assets/stock_images/womens_high_heel_sho_9d80112c.jpg';
import polishKit from '@assets/stock_images/shoe_polish_tin_and__e96c9342.jpg';
import leatherBelt from '@assets/stock_images/handmade_leather_bel_25d525ac.jpg';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'repair' | 'goods' | 'care';
}

export const products: Product[] = [
  {
    id: 1,
    name: "Full Sole & Heel Replacement",
    description: "Complete restoration of your shoe's foundation using premium leather or Vibram rubber soles.",
    price: 85.00,
    image: mensShoes,
    category: 'repair'
  },
  {
    id: 2,
    name: "Heel Tip Replacement",
    description: "Replace worn-out heel tips to restore balance and prevent clicking. Suitable for stilettos and boots.",
    price: 25.00,
    image: heelsRepair,
    category: 'repair'
  },
  {
    id: 3,
    name: "Premium Shoe Care Kit",
    description: "Includes our signature beeswax polish, horsehair brush, and application cloth.",
    price: 35.00,
    image: polishKit,
    category: 'care'
  },
  {
    id: 4,
    name: "Handcrafted Leather Belt",
    description: "Full-grain vegetable tanned leather belt, custom fitted to your size. Brass or nickel hardware.",
    price: 65.00,
    image: leatherBelt,
    category: 'goods'
  },
  {
    id: 5,
    name: "Deep Clean & Condition",
    description: "Professional cleaning to remove salt stains and deep conditioning to nourish dry leather.",
    price: 45.00,
    image: mensShoes, // Using mens shoes as placeholder for clean shoes
    category: 'care'
  },
  {
    id: 6,
    name: "Stitching Repair",
    description: "Mending loose seams and stitching on boots, bags, and shoes.",
    price: 30.00,
    image: leatherBelt, // Placeholder
    category: 'repair'
  }
];
