export const getCardColor = (suit) => {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
};

export const getCardSymbol = (suit) => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
};

export const getCardDisplay = (card) => {
  if (!card) return null;
  return {
    value: card.value,
    symbol: getCardSymbol(card.suit),
    color: getCardColor(card.suit),
    suit: card.suit
  };
};