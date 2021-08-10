import { useState, useEffect } from 'react'
import axios from 'axios'
import moment from 'moment'
import styles from './Banker.module.css'

const renderCampaigns = (campaignList = [], selectedCampaign = 'default', onChange = () => {}) => {
    return (
        <>
            <label>Campaign: </label>
            <select value={selectedCampaign} onChange={onChange}>
                <option value="default">------Select Campaign------</option>
                { campaignList.map(c => <option key={c} value={c}>{c}</option>) }
            </select>
        </>
    )
}

const renderPendingBids = (pendingBidsList) => {

    return (
    <table className={styles.bidsTable}>
        <thead>
            <tr>
                <th>Bid Id</th>
                <th>Bid Time</th>
                <th>Price</th>
            </tr>
        </thead>
        <tbody>
            { pendingBidsList.map(b => <tr key={ b.id }>
                <td>{ b.id }</td>
                <td>{ b.time }</td>
                <td>{ b.price }</td>
            </tr>) }
        </tbody>
    </table>
    )

}

const Banker = () => {
    const [campaings, setCampaigns] = useState([])
    const [selectedCampaign, setSelectedCampaign] = useState('default')
    const [bids, setBids] = useState([])
    const [oldestPendingBidTime, setOldestPendingBidTime] = useState(moment().unix())
    const [ bidsResults ] = useState({ wins: 0, loses: 0, errors: 0 })

    useEffect(() => {
        const loadCampaigns = async () => {
            const { data } = await axios.get('/api/campaigns')
            setCampaigns(data)
        }

        loadCampaigns()
    }, [])

    useEffect(() => {
        if (selectedCampaign === 'default') {
            setBids([])
            return
        }

        const interval = setInterval(async () => {
                const { data } = await axios.get('/api/bids', { params: { time: oldestPendingBidTime } })
                setBids(data)
                setOldestPendingBidTime(data.filter(b => b.status === 0)[0].time)
        }, 1000)

        return () => clearInterval(interval)
    }, [oldestPendingBidTime])

    const onCampaignChange = e => {
        setOldestPendingBidTime(moment().unix())
        setSelectedCampaign(e.target.value)
    }

    return (
        <>
            <div className={styles.row}>
                { renderCampaigns(campaings, selectedCampaign, onCampaignChange) }
            </div>
            <div className={styles.row}>
                { renderPendingBids(bids.filter(b => b.status === 0)) }
            </div>
        </>
    )
}

export default Banker