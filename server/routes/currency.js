import express from 'express';
import { query } from 'express-validator';
import {
  getExchangeRates,
  convertCurrency,
  SUPPORTED_CURRENCIES,
} from '../utils/currencyRates.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

// @route   GET /api/currency/rates
// @desc    Get latest exchange rates relative to a base currency
// @access  Public
router.get(
  '/rates',
  [
    query('base')
      .optional()
      .toUpperCase()
      .isIn(SUPPORTED_CURRENCIES)
      .withMessage(`Base currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const base = req.query.base || 'USD';
      const ratesData = await getExchangeRates(base);

      return res.status(200).json({
        success: true,
        ...ratesData,
        supportedCurrencies: SUPPORTED_CURRENCIES,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/currency/convert
// @desc    Convert an amount between two currencies
// @access  Public
router.get(
  '/convert',
  [
    query('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a non-negative number'),
    query('from')
      .notEmpty()
      .withMessage('From currency is required')
      .toUpperCase()
      .isIn(SUPPORTED_CURRENCIES)
      .withMessage(`From currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
    query('to')
      .notEmpty()
      .withMessage('To currency is required')
      .toUpperCase()
      .isIn(SUPPORTED_CURRENCIES)
      .withMessage(`To currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { amount, from, to } = req.query;
      const conversion = await convertCurrency(amount, from, to);

      return res.status(200).json({
        success: true,
        ...conversion,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
