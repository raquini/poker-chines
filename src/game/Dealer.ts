import { Card, Player, Suit, Rank } from './types';
import { Deck } from './Deck';

export class Dealer {
  private deck: Deck;
  
  constructor() {
    this.deck = new Deck();
  }
  
  public dealToPlayers(playerCount: number): Player[] {
    if (playerCount < 2 || playerCount > 4) {
      throw new Error('Game supports 2-4 players only');
    }
    
    const cardsPerPlayer = 13;
    const players: Player[] = [];
    
    for (let i = 0; i < playerCount; i++) {
      const cards = this.deck.deal(cardsPerPlayer);
      players.push({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        cards: this.sortCards(cards),
        isStartingPlayer: false
      });
    }
    
    this.determineStartingPlayer(players);
    
    return players;
  }
  
  private sortCards(cards: Card[]): Card[] {
    return cards.sort((a, b) => {
      if (a.suit !== b.suit) {
        const suitOrder = [Suit.Diamonds, Suit.Clubs, Suit.Hearts, Suit.Spades];
        return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
      }
      return a.value - b.value;
    });
  }
  
  private determineStartingPlayer(players: Player[]): void {
    let startingPlayer: Player | null = null;
    let lowestCard: Card | null = null;
    
    // Check for 3 of Diamonds first
    for (const player of players) {
      const threeOfDiamonds = player.cards.find(
        card => card.suit === Suit.Diamonds && card.rank === Rank.Three
      );
      
      if (threeOfDiamonds) {
        player.isStartingPlayer = true;
        return;
      }
    }
    
    // If no 3 of Diamonds, find lowest card
    for (const player of players) {
      for (const card of player.cards) {
        if (!lowestCard || this.compareCards(card, lowestCard) < 0) {
          lowestCard = card;
          startingPlayer = player;
        }
      }
    }
    
    if (startingPlayer) {
      startingPlayer.isStartingPlayer = true;
    }
  }
  
  private compareCards(a: Card, b: Card): number {
    if (a.value !== b.value) {
      return a.value - b.value;
    }
    
    const suitOrder = [Suit.Diamonds, Suit.Clubs, Suit.Hearts, Suit.Spades];
    return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
  }
  
  public resetDeck(): void {
    this.deck.reset();
  }
}