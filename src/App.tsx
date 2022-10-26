import { createUseStyles } from 'react-jss'
import clsx from 'clsx'

import { AgGridReact } from 'ag-grid-react'

import 'ag-grid-community/styles/ag-grid.css' // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css' // Optional theme CSS
import { useState } from 'react'
import { IData, IParticipant, IRow, ISeason, ISeasonRow } from './interfaces'

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  season: {
    display: 'flex',
    flexDirection: 'column',
    width: 600,
    height: 400,
  },
})

export const App = () => {
  const classes = useStyles()

  const [activeTeam, setActiveTeam] = useState<string | undefined>(undefined)

  const [rowData, setRowData] = useState<IRow[]>([])

  const [seasonRowData, setSeasonRowData] = useState<ISeasonRow[]>([])

  const columnDefs = [
    { field: 'team' },
    { field: 'rank' },
    { field: 'played', headerName: '#Matches' },
    { field: 'wins', headerName: 'Won' },
    { field: 'defeits', headerName: 'Lost' },
    { field: 'draws', headerName: 'Drawn' },
    { field: 'goalsfor', headerName: 'Scored' },
    { field: 'goalsagainst', headerName: 'Conceded' },
    { field: 'points' },
  ]

  const seasonColumnDefs = [{ field: 'date' }, { field: 'opponent' }, { field: 'stage' }]

  const columnsToInclude = ['defeits', 'draws', 'goalsagainst', 'goalsfor', 'points', 'wins', 'played']

  const queryFetch = (inputQuery: string, variables?: any) => {
    return fetch('https://resultatservice-api.stage-sumo.tv2.no/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: inputQuery,
        variables: variables,
      }),
    }).then((res) => res.json())
  }

  if (!rowData.length) {
    queryFetch(
      `
      query table($tournamentStageId: ID!) {
        tournamentStage(id: $tournamentStageId) {
          name
          standings(type: LEAGUE_TABLE) {
            participants {
              participant {
                name
                id
              }
              rank
              data {
                code
                value
              }
            }
          }
        }
      }
      `,
      { tournamentStageId: '4e50ba57-d5fe-4370-b2f8-e357ebeb4c83' }
    ).then((data) => {
      const newRows: IRow[] = []
      data.data.tournamentStage.standings[0].participants.map((participant: IParticipant) => {
        const newParticipant = {
          id: participant.participant.id,
          team: participant.participant.name,
          rank: participant.rank,
          played: undefined,
          wins: undefined,
          defeits: undefined,
          draws: undefined,
          goalsagainst: undefined,
          goalsfor: undefined,
          points: undefined,
        }

        participant.data.map((dataItem: IData) => {
          if (columnsToInclude.includes(dataItem.code)) {
            Object.assign(newParticipant, { [dataItem.code]: Number(dataItem.value) })
          }
        })
        newRows.push(newParticipant)
      })

      setRowData(newRows)
    })
  }

  const fetchRowData = (participantId?: string) => {
    if (!participantId) {
      return
    }

    const currentYear = new Date().getFullYear()

    const fromDate = new Date(currentYear, 0, 1)

    const toDate = new Date(currentYear, 11, 31)

    queryFetch(
      `query teamMatches($participantId: ID!, $fromDate: LocalDate!, $toDate: LocalDate!) {
        eventsByParticipantAndDateRange(participantId: $participantId, fromDate: $fromDate, toDate: $toDate) {
          startDate
          tournamentStage {
            name
          }
          participants {
            participant {
              name
            }
          }
        }
      }`,
      {
        participantId: participantId,
        fromDate: fromDate.toISOString().split('T')[0],
        toDate: toDate.toISOString().split('T')[0],
      }
    ).then((data) => {
      const newSeasonRows: ISeasonRow[] = []
      data.data.eventsByParticipantAndDateRange.map((row: ISeason) => {
        const newSeasonRow = {
          opponent:
            row.participants[0].participant.name === activeTeam
              ? row.participants[1].participant.name
              : row.participants[0].participant.name,
          date: row.startDate,
          stage: row.tournamentStage.name,
        }
        newSeasonRows.push(newSeasonRow)
      })
      setSeasonRowData(newSeasonRows)
    })
  }

  return (
    <div className={clsx('ag-theme-alpine-dark', classes.container)}>
      <h1>Eliteserien</h1>
      <div style={{ height: 500, width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true, sortable: true, flex: 1 }}
          onRowClicked={(event) => {
            fetchRowData(event.data?.id)
            setActiveTeam(event.data?.team)
          }}
        />
      </div>

      <div className={classes.season}>
        <h1 style={{ textAlign: 'center' }}>
          {activeTeam ? activeTeam + ' 2022 Season' : 'Select a team to view matches this season'}
        </h1>

        <AgGridReact
          rowData={seasonRowData}
          columnDefs={seasonColumnDefs}
          defaultColDef={{ sortable: true, flex: 1 }}
        />
      </div>
    </div>
  )
}
