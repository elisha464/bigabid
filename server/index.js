const { promisify } = require('util')
const redis = require('redis')
const moment = require('moment')
const express = require('express')
const app = express()

const redisClient = redis.createClient()

redisClient.on('error', err => {
    console.error(err)
    process.exit(1)
})

const redisSscan = promisify(redisClient.sscan).bind(redisClient)
const redisZrange = promisify(redisClient.zrange).bind(redisClient)
const redisGet = promisify(redisClient.get).bind(redisClient)

app.get('/api/campaigns', async (req, res) => {
    let sscanResult = await redisSscan('LIST_OF_CAMPAIGNS', 0)
    const campaigns = sscanResult[1]
    while(sscanResult[0] !== '0') {
        sscanResult = await redisSscan('LIST_OF_CAMPAIGNS', sscanResult[0])
        campaigns.push(...sscanResult[1])
    }

    res.json(campaigns)
})

app.get('/api/bids', async (req, res) => {
    const result = []

    const time = parseInt(req.query.time) || '0'
    const bidsKeysAndScores = await redisZrange('LIST_OF_BIDS', time, '+inf', 'byscore', 'withscores')

    for (let i=0; i<bidsKeysAndScores.length; i+=2) {
        let currentBid = await redisGet(bidsKeysAndScores[i])
        currentBid = JSON.parse(currentBid)
        result.push({ ...currentBid, time: parseInt(bidsKeysAndScores[i+1]) })
    }

    res.json(result)
})

const port = parseInt(process.env.PORT) || 3007
const main = () => {
    app.listen(port, () => {
        console.log(`server is listening on port ${port}`)
    })
}

main()