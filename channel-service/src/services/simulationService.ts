import axios from 'axios'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const chance = (percent: number) => Math.random() * 100 < percent

const CRM_URL = process.env.CRM_SERVICE_URL || 'http://localhost:5000'

async function sendCallback(
  communicationId: string,
  campaignId: string,
  eventType: string
) {
  try {
    await axios.post(`${CRM_URL}/api/receipts`, {
      communicationId,
      campaignId,
      eventType,
      timestamp: new Date().toISOString()
    })
    console.log(`[${new Date().toISOString()}] Callback sent: ${eventType} for comm ${communicationId}`)
  } catch (err: any) {
    console.error(`[CALLBACK ERROR] ${eventType} for ${communicationId}:`, err?.message || err)
  }
}

export async function simulateDelivery(
  communicationId: string,
  campaignId: string,
  recipient: { name: string; phone: string; email: string },
  channel: string,
  message: string
) {
  try {
    // Step 1: Always mark as sent immediately
    await delay(randomBetween(500, 1500))
    await sendCallback(communicationId, campaignId, 'sent')

    // Step 2: 90% delivered, 10% failed
    await delay(randomBetween(1000, 3000))
    const isDelivered = chance(90)

    if (!isDelivered) {
      await sendCallback(communicationId, campaignId, 'failed')
      console.log(`[SIM] Communication ${communicationId} failed delivery`)
      return
    }
    await sendCallback(communicationId, campaignId, 'delivered')

    // Step 3: 70% opened
    await delay(randomBetween(3000, 6000))
    if (!chance(70)) return
    await sendCallback(communicationId, campaignId, 'opened')

    // Step 4: 50% read
    await delay(randomBetween(2000, 4000))
    if (!chance(50)) return
    await sendCallback(communicationId, campaignId, 'read')

    // Step 5: 35% clicked
    await delay(randomBetween(3000, 5000))
    if (!chance(35)) return
    await sendCallback(communicationId, campaignId, 'clicked')

    // Step 6: 25% converted
    await delay(randomBetween(3000, 5000))
    if (!chance(25)) return
    await sendCallback(communicationId, campaignId, 'converted')

  } catch (err: any) {
    console.error(`[SIM FATAL] Simulation crashed for ${communicationId}:`, err?.message || err)
  }
}
