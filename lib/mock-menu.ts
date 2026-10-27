export type MenuOptionGroup = {
  id: string;
  label: string;
  required: boolean;
  options: string[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  optionGroups?: MenuOptionGroup[];
};

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "coffee", label: "Coffee" },
  { id: "non-coffee", label: "Non-Coffee" },
  { id: "food", label: "Food" },
  { id: "snacks", label: "Snacks" },
];

const LEVELS: { id: string; label: string; required: true; options: string[] } = {
  id: "sugar",
  label: "Sugar Level",
  required: true,
  options: ["0%", "25%", "50%", "75%", "100%"],
};

const ICE_LEVELS: MenuOptionGroup = {
  id: "ice",
  label: "Ice Level",
  required: true,
  options: ["Normal", "Less", "No Ice"],
};

export const MOCK_MENU: MenuItem[] = [
  {
    id: "m1",
    name: "Signature Latte",
    description: "Espresso, susu segar, with house blend beans",
    price: 24000,
    category: "coffee",
    imageUrl:
      "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400&h=400&fit=crop",
    optionGroups: [LEVELS, ICE_LEVELS],
  },
  {
    id: "m2",
    name: "Butter Coffee",
    description: "Black coffee with smooth butter infusion",
    price: 26000,
    category: "coffee",
    imageUrl:
      "https://images.unsplash.com/photo-1514432324607-a7d6733d4b23?w=400&h=400&fit=crop",
    optionGroups: [LEVELS, ICE_LEVELS],
  },
  {
    id: "m3",
    name: "Matcha Latte",
    description: "Ceremonial grade matcha dan susu segar",
    price: 28000,
    category: "non-coffee",
    imageUrl:
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop",
    optionGroups: [LEVELS, ICE_LEVELS],
  },
  {
    id: "m4",
    name: "Lychee Sparkling",
    description: "Lychee, sparkling water daun mint",
    price: 22000,
    category: "non-coffee",
    imageUrl:
      "https://images.unsplash.com/photo-1556679343-c7336da3cd1a?w=400&h=400&fit=crop",
    optionGroups: [{ ...LEVELS, id: "sugar" }, { ...ICE_LEVELS, id: "ice" }],
  },
  {
    id: "m5",
    name: "Truffle Carbonara",
    description: "Spaghetti creamy black truffle & beef bacon",
    price: 48000,
    category: "food",
    imageUrl:
      "https://images.unsplash.com/photo-1588012875779-b32dee7d3cd8?w=400&h=400&fit=crop",
  },
  {
    id: "m6",
    name: "Chicken Katsu Sando",
    description: "Roti susu, chicken katsu, tonkatsu sauce",
    price: 42000,
    category: "food",
    imageUrl:
      "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop",
  },
  {
    id: "m7",
    name: "Cassava Chips",
    description: "Keripik singkong gurih dengan saus petir",
    price: 18000,
    category: "snacks",
    imageUrl:
      "https://images.unsplash.com/photo-1621447504864-d2677dcbfe81?w=400&h=400&fit=crop",
  },
  {
    id: "m8",
    name: "Butter Croissant",
    description: "Croissant lapis butter, panggang saat dipesan",
    price: 16000,
    category: "snacks",
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop",
  },
];
