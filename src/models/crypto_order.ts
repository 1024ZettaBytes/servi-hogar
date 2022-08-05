export type CustomerLevel = 'nuevo' | 'regular' | 'permanente'| 'deudor'| 'conflictivo';

export interface CryptoOrder {
  id: string;
  status: CustomerLevel;
  orderDetails: string;
  orderDate: number;
  orderID: string;
  sourceName: string;
  sourceDesc: string;
  amountCrypto: number;
  amount: number;
  cryptoCurrency: string;
  currency: string;
}
