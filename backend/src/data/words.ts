export const WORDS = [
  'apple', 'banana', 'cat', 'dog', 'house', 'tree', 'car', 'sun', 'moon', 'star',
  'book', 'computer', 'phone', 'pizza', 'hamburger', 'water', 'fire', 'earth', 'wind',
  'mountain', 'river', 'ocean', 'beach', 'sand', 'cloud', 'rain', 'snow', 'flower',
  'grass', 'leaf', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'chicken', 'duck',
  'lion', 'tiger', 'bear', 'elephant', 'monkey', 'snake', 'spider', 'bee', 'butterfly',
  'chair', 'table', 'bed', 'sofa', 'lamp', 'television', 'radio', 'clock', 'watch',
  'glasses', 'hat', 'shirt', 'pants', 'shoes', 'socks', 'coat', 'jacket', 'scarf',
  'gloves', 'umbrella', 'bag', 'backpack', 'wallet', 'purse', 'keys', 'door', 'window',
  'wall', 'floor', 'ceiling', 'roof', 'stairs', 'elevator', 'street', 'road', 'highway',
  'bridge', 'tunnel', 'park', 'garden', 'forest', 'jungle', 'desert', 'island', 'city',
  'town', 'village', 'country', 'world', 'planet', 'universe', 'galaxy', 'space',
  'rocket', 'spaceship', 'astronaut', 'alien', 'monster', 'ghost', 'vampire', 'zombie',
  'witch', 'wizard', 'magic', 'spell', 'potion', 'wand', 'broom', 'dragon', 'unicorn',
  'mermaid', 'fairy', 'goblin', 'troll', 'giant', 'dwarf', 'elf', 'knight', 'king',
  'queen', 'prince', 'princess', 'castle', 'palace', 'fortress', 'tower', 'dungeon'
];

export const getRandomWords = (count: number = 3): string[] => {
  const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
