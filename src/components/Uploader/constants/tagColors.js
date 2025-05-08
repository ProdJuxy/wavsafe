// components/Uploader/constants/tagColors.js

export const tagColors = {
  aggressive: '#8B0000',
  menacing: '#1C1C1C',
  gritty: '#3A3A3A',
  melancholic: '#4A5E6D',
  triumphant: '#FFD700',
  sinister: '#5B0060',
  hypnotic: '#6F00FF',
  anxious: '#AFFF33',
  rebellious: '#CC5500',
  cold: '#B0E0E6',
  vengeful: '#A30000',
  paranoid: '#2F4F4F',
  determined: '#4682B4',
  isolated: '#D3D3D3',
  chaotic: '#FF073A',
  epic: '#800080',
  evil: '#0B0B0B',
  demonic: '#660000',
  alien: '#00FFF7',
  possessed: '#2B0033',

  nostalgic: '#A67B5B', hopeful: '#A8E6CF', 
  


  ominous: '#C70039', eerie: '#900C3F', creepy: '#581845',
  spooky: '#FFC300', haunting: '#DAF7A6', unsettling: '#FF5733', 
  mysterious: '#900C3F', foreboding: '#581845', chilling: '#FFC300', suspenseful: '#C70039', thrilling: '#900C3F',


  murder: '#D50000', gloomy: '#626567', glitchy: '#2ECC71',
  dark: '#8e44ad', sad: '#3498db', happy: '#f1c40f', chill: '#1abc9c', energetic: '#e67e22',
  relaxed: '#2ecc71', Default: '#555'
   
};
  
  export const getTagColor = (tag) => {
    const normalizedTag = tag.trim().toLowerCase();
    return tagColors[normalizedTag] || tagColors.Default;
  };
  
  export const adjustBrightness = (hex, percent) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));
    return `rgb(${r}, ${g}, ${b})`;
  };
  