import express from 'express'
import authAdmin from '../middlewares/authAdmin.js'
import authUser from '../middlewares/authUser.js'
import {
  createWorkshop,
  deleteWorkshop,
  getAllWorkshopRegistrations,
  getMyWorkshopRegistrations,
  getPublicWorkshops,
  getPublicWorkshopById,
  getWorkshopById,
  getWorkshops,
  publishWorkshop,
  registerForWorkshop,
  getWorkshopPaymentConfig,
  createWorkshopPaymentIntent,
  updateRegistrationDecision,
  updateWorkshop,
} from '../controllers/workshopController.js'

const router = express.Router()

router.get('/public', getPublicWorkshops)
router.get('/public/:id', getPublicWorkshopById)
router.get('/registrations/me', authUser, getMyWorkshopRegistrations)
router.get('/registrations', authAdmin, getAllWorkshopRegistrations)
router.patch('/registrations/:registrationId/decision', authAdmin, updateRegistrationDecision)
router.get('/', authAdmin, getWorkshops)
router.get('/payment/config', getWorkshopPaymentConfig)
router.get('/:id', authAdmin, getWorkshopById)
router.post('/:id/payment-intent', createWorkshopPaymentIntent)
router.post('/:id/register', registerForWorkshop)
router.post('/', authAdmin, createWorkshop)
router.patch('/:id', authAdmin, updateWorkshop)
router.patch('/:id/publish', authAdmin, publishWorkshop)
router.delete('/:id', authAdmin, deleteWorkshop)

export default router
