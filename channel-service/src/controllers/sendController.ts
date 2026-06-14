import { Request, Response } from 'express'
import { simulateDelivery } from '../services/simulationService'

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { campaignId, communicationId, recipient, channel, message } = req.body

    if (!campaignId || !communicationId || !recipient || !channel || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: campaignId, communicationId, recipient, channel, message'
      })
    }

    // Respond immediately — do NOT await the simulation
    res.status(200).json({ success: true, message: 'Queued for delivery' })

    // Fire simulation asynchronously AFTER response is sent
    setImmediate(() => {
      simulateDelivery(communicationId, campaignId, recipient, channel, message)
        .catch(err => console.error('[SEND CONTROLLER] Unhandled simulation error:', err))
    })

  } catch (err: any) {
    console.error('[SEND CONTROLLER ERROR]', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
