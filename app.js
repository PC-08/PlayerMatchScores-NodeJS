const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// 1

app.get('/players/', async (request, response) => {
  const getPlayerListQuery = `
   SELECT 
   *
   FROM
   player_details
   ORDER BY
   player_id
   `

  const playersArray = await db.all(getPlayerListQuery)
  response.send(
    playersArray.map(each => ({
      playerId: each.player_id,
      playerName: each.player_name,
    })),
  )
})

// 2

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params

  const getPlayerQuery = `
   SELECT 
   *
   FROM
   player_details
   WHERE 
   player_id = ${playerId};
   `

  const playerObj = await db.get(getPlayerQuery)
  response.send({
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  })
})

// 3

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params

  const playerNameObj = request.body

  const {playerName} = playerNameObj

  const updatePlayerQuery = `
   UPDATE
   player_details
   SET 
   player_name = '${playerName}'
   WHERE 
   player_id = ${playerId};
   `

  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// 4

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params

  const getMatchQuery = `
   SELECT 
   *
   FROM
   match_details
   WHERE 
   match_id = ${matchId};
   `

  const matchObj = await db.get(getMatchQuery)
  response.send({
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  })
})

// 5

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params

  const getPlayermatchListQuery = `
  SELECt 
  match_id,
   match,
   year FROM 
   match_details NATURAL JOIN player_match_score

  WHERE 
  player_id = ${playerId};
    
  `
  const matchesArray = await db.all(getPlayermatchListQuery)

  response.send(
    matchesArray.map(each => {
      return {
        matchId: each.match_id,
        match: each.match,
        year: each.year,
      }
    }),
  )
})

// 6

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params

  const getMatchPlayerListQuery = `
  SELECT 
  player_id,
  player_name 
  FROM 
   player_details NATURAL JOIN player_match_score
  WHERE
   match_id = ${matchId};  `

  const playerArray = await db.all(getMatchPlayerListQuery)
  response.send(
    playerArray.map(each => ({
      playerId: each.player_id,
      playerName: each.player_name,
    })),
  )
})

// 7

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params

  const getstatofplayerQuery = `
  SELECT
  player_details.player_id,
  player_details.player_name,
  SUM(score),
  SUM(fours),
  SUM(sixes)
  FROM 
   player_details 
   INNER JOIN
   player_match_score 
   ON 
   player_details.player_id = player_match_score.player_id

  WHERE 
  player_match_score.player_id = ${playerId}

  `
  const playerstatObj = await db.get(getstatofplayerQuery)

  response.send({
    playerId: playerstatObj.player_id,
    playerName: playerstatObj.player_name,
    totalScore: playerstatObj['SUM(score)'],
    totalFours: playerstatObj['SUM(fours)'],
    totalSixes: playerstatObj['SUM(sixes)'],
  })
})

module.exports = app
