import { Request, Response } from 'express'
import Communication from '../models/Communication'
import CommunicationEvent from '../models/CommunicationEvent'
import Campaign from '../models/Campaign'

const CAMPAIGN_COUNTER_MAP: Record<string, string> = {
  delivered: 'deliveredCount',
  failed: 'failedCount',
  opened: 'openedCount',
  read: 'readCount',
  clicked: 'clickedCount',
  converted: 'convertedCount'
}

export const processReceipt = async (req: Request, res: Response) => {
  try {
    const { communicationId, campaignId, eventType, timestamp } = req.body

    console.log(`[RECEIPT] Received: ${eventType} for comm ${communicationId}`)

    if (!communicationId || !campaignId || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: communicationId, campaignId, eventType'
      })
    }

    // 1. Create event record
    await CommunicationEvent.create({
      communicationId,
      campaignId,
      eventType,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata: {}
    })

    // 2. Update communication status
    await Communication.findByIdAndUpdate(communicationId, {
      status: eventType
    })

    // 3. Increment campaign counter
    const counterField = CAMPAIGN_COUNTER_MAP[eventType]
    if (counterField) {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { [counterField]: 1 }
      })
      console.log(`[RECEIPT] Incremented ${counterField} for campaign ${campaignId}`)
    }

    res.status(200).json({ success: true })

  } catch (err: any) {
    console.error('[RECEIPT ERROR]', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
