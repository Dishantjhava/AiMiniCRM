import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Communication from '../models/Communication'
import CommunicationEvent from '../models/CommunicationEvent'
import Campaign from '../models/Campaign'

const CAMPAIGN_COUNTER_MAP: Record<string, string> = {
  sent: 'sentCount',
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
        message: 'Missing required fields'
      })
    }

    // Validate ObjectIds before querying - this prevents 500 crashes
    const isValidCommId = mongoose.Types.ObjectId.isValid(communicationId)
    const isValidCampId = mongoose.Types.ObjectId.isValid(campaignId)

    // Always create event record if IDs are valid
    if (isValidCommId && isValidCampId) {
      await CommunicationEvent.create({
        communicationId: new mongoose.Types.ObjectId(communicationId),
        campaignId: new mongoose.Types.ObjectId(campaignId),
        eventType,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        metadata: {}
      })

      // Update communication status
      await Communication.findByIdAndUpdate(
        communicationId,
        { status: eventType },
        { new: true }
      )

      // Increment campaign counter
      const counterField = CAMPAIGN_COUNTER_MAP[eventType]
      if (counterField) {
        await Campaign.findByIdAndUpdate(
          campaignId,
          { $inc: { [counterField]: 1 } }
        )
        console.log(`[RECEIPT] Incremented ${counterField} for campaign ${campaignId}`)
      }
    } else {
      console.log(`[RECEIPT] Invalid ObjectId - commId: ${communicationId}, campId: ${campaignId}`)
    }

    // Always return success so channel service doesn't retry
    res.status(200).json({ success: true })

  } catch (err: any) {
    console.error('[RECEIPT ERROR]', err?.message || err)
    // Return 200 anyway so channel service stops retrying
    res.status(200).json({ success: true, warning: err?.message })
  }
}
