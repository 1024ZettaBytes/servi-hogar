import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { connectToDatabase } from '../../../lib/db';
import { Payment } from '../../../lib/models/Payment';
import { SalePayment } from '../../../lib/models/SalePayment';
import { setDateToEnd, setDateToInitial } from '../../../lib/client/utils';

async function getDailyTotalAPI(req, res, userId, userRole) {
  try {
    await connectToDatabase();
    
    // Get start and end of current day
    const startOfDay = setDateToInitial(new Date());
    
    const endOfDay = setDateToEnd(new Date());
    
    // Build query - if user is AUX, filter by user; if ADMIN, get all
    const rentPaymentQuery = {
      date: { $gte: startOfDay, $lte: endOfDay }
    };
    if (userRole === 'AUX') {
      rentPaymentQuery.lastUpdatedBy = userId;
    }
    
    const salePaymentQuery = {
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };
    if (userRole === 'AUX') {
      salePaymentQuery.createdBy = userId;
    }
    
    // Get rent payments (Payment model)
    const rentPayments = await Payment.find(rentPaymentQuery).select('amount lateFee').lean();
    
    // Get sale payments (SalePayment model)
    const salePayments = await SalePayment.find(salePaymentQuery).select('amount').lean();
    
    // Calculate totals
    const rentPaymentsTotal = rentPayments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);
    
    const salePaymentsTotal = salePayments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);
    
    const total = rentPaymentsTotal + salePaymentsTotal;
    
    res.status(200).json({
      rentPayments: {
        count: rentPayments.length,
        total: rentPaymentsTotal
      },
      salePayments: {
        count: salePayments.length,
        total: salePaymentsTotal
      },
      total
    });
  } catch (e) {
    console.error('Error fetching daily total:', e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al obtener el total diario. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  const userId = await getUserId(req);
  
  if (validRole && req.method === 'GET') {
    await getDailyTotalAPI(req, res, userId, validRole);
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
