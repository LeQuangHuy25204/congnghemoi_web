const express = require('express');
const ticketController = require('../controllers/ticketController');
const validateObjectId = require('../../shared/middlewares/validateObjectId');

const router = express.Router();

router.get('/', ticketController.listTickets);
router.get('/:ticketId', validateObjectId('ticketId'), ticketController.getTicket);
router.post('/', ticketController.createTicket);
router.put('/:ticketId/status', validateObjectId('ticketId'), ticketController.updateStatus);

module.exports = router;
