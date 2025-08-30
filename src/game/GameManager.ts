import { GameState, Player } from './types';
import { Dealer } from './Dealer';

export class GameManager {
  private dealer: Dealer;
  private gameState: GameState;
  
  constructor() {
    this.dealer = new Dealer();
    this.gameState = {
      players: [],
      deck: [],
      currentPlayerIndex: 0,
      gameStarted: false
    };
  }
  
  public startNewGame(playerCount: number): GameState {
    if (this.gameState.gameStarted) {
      throw new Error('Game already in progress');
    }
    
    const players = this.dealer.dealToPlayers(playerCount);
    const startingPlayerIndex = players.findIndex(p => p.isStartingPlayer);
    
    this.gameState = {
      players,
      deck: [],
      currentPlayerIndex: startingPlayerIndex >= 0 ? startingPlayerIndex : 0,
      gameStarted: true
    };
    
    return this.getGameState();
  }
  
  public getGameState(): GameState {
    return JSON.parse(JSON.stringify(this.gameState));
  }
  
  public getCurrentPlayer(): Player | null {
    if (!this.gameState.gameStarted || this.gameState.players.length === 0) {
      return null;
    }
    return this.gameState.players[this.gameState.currentPlayerIndex];
  }
  
  public nextTurn(): void {
    if (!this.gameState.gameStarted) {
      throw new Error('Game not started');
    }
    
    this.gameState.currentPlayerIndex = 
      (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;
  }
  
  public resetGame(): void {
    this.dealer.resetDeck();
    this.gameState = {
      players: [],
      deck: [],
      currentPlayerIndex: 0,
      gameStarted: false
    };
  }
  
  public getPlayerById(playerId: string): Player | undefined {
    return this.gameState.players.find(p => p.id === playerId);
  }
  
  public getStartingPlayer(): Player | null {
    return this.gameState.players.find(p => p.isStartingPlayer) || null;
  }
}