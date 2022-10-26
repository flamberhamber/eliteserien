export interface IParticipant {
    participant: { name: string; id: string }
    rank: number
    data: IData[]
  }
  
  export interface IData {
    code: string
    value: string
  }
  
  export interface IRow {
    id: string
    team: string
    rank: number
    played?: number
    wins?: number
    defeits?: number
    draws?: number
    goalsAgainst?: number
    goalsfor?: number
    points?: number
  }
  
  export interface ISeason {
    participants: { participant: { name: string } }[]
    startDate: string
    tournamentStage: { name: string }
  }
  
  export interface ISeasonRow {
    date: string
    opponent: string
    stage: string
  }