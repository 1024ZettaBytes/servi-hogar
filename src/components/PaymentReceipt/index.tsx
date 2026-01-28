import React, { useRef } from 'react';
import styles from './PaymentReceipt.module.css';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import {
  Dialog,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Box,
  Button
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { useReactToPrint } from 'react-to-print';
import { formatReceiptNumber } from 'lib/client/utils';

// Receipt object based on Receipt model
interface Receipt {
  receiptNumber: number;
  customerName: string;
  customerPhone: string;
  date: Date;
  rentEndDate?: Date;
  reason: 'RENT' | 'SALE' | 'CREDIT' | 'EXT_REPAIR' | 'DEBT';
  hasLateFee: boolean;
  lateFeeDays?: number;
  lateFeeAmount: number;
  description: string;
  amount: number;
  total: number;
  method: 'TRANSFER' | 'DEP' | 'CASH';
  observations?: string;
}

interface PaymentReceiptProps {
  receipt: Receipt | null;
  open: boolean;
  onClose: () => void;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  receipt,
  open,
  onClose
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });
  
  const handleDownload = () => {
    if (receiptRef.current) {
      import('html2canvas').then((html2canvas) => {
        html2canvas.default(receiptRef.current).then((canvas) => {
          const link = document.createElement('a');
          link.download = `recibo-${receipt?.receiptNumber || 'pago'}.png`;
          link.href = canvas.toDataURL();
          link.click();
        });
      });
    }
  };
  
  if (!receipt) return null;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
  };
  
  const formatTime = (date: Date) => {
    return format(new Date(date), 'hh:mm:ss a.', { locale: es });
  };
  
  // Map reason to display flags
  const isRent = receipt.reason === 'RENT';
  const isSale = receipt.reason === 'SALE';
  const isCreditPayment = receipt.reason === 'CREDIT';
  const isRecharge = receipt.hasLateFee;
  const isExtRepair = receipt.reason === 'EXT_REPAIR';
  const isDebt = receipt.reason === 'DEBT';
  
  // Build period items
  let generalDescription = "";
  if(isRent) {
    generalDescription = "Del: " + formatDate(receipt.rentEndDate);
  }
  if(isExtRepair) {
    generalDescription = "Reparación lavadora";
  }
  if(isDebt) {
    generalDescription = "Pago de deuda";
  }
  if(isSale) {
    generalDescription = receipt.description;
  }
  const periodItems = [
    {
      description: generalDescription,
      amount: receipt.amount
    },
    ...(receipt.hasLateFee ? [{
      description: 'Recargos (' + (receipt.lateFeeDays || 0) + ' día(s))',
      amount: receipt.lateFeeAmount
    }] : [])
  ];
  
  // Map method
  const method = receipt.method === 'TRANSFER' ? 'TRANSFER' :
                 receipt.method === 'DEP' ? 'DEPOSIT' : 'CASH';

  return (
    <Dialog 
      open={open} 
      fullWidth={true} 
      maxWidth={'md'}
      onClose={onClose}
      scroll="paper"
    >
      <Card>
        <CardHeader title="Pago registrado exitosamente" />
        <Divider />
        <CardContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          <Box ref={receiptRef}>
            <div className={styles.receipt}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <img 
            src="/static/images/servi_hogar.png" 
            alt="Servi Hogar" 
            className={styles.logo}
          />
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerLine}>
            <span className={styles.label}>Folio:</span> {formatReceiptNumber(receipt.receiptNumber)}
          </div>
          <div className={styles.headerLine}>
            <span className={styles.label}>Fecha:</span> {formatDate(receipt.date)}
          </div>
          <div className={styles.headerLine}>
            <span className={styles.label}>Hora:</span> {formatTime(receipt.date)}
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className={styles.title}>RECIBO DE PAGO</h1>

      {/* Client Info Summary */}
      <div className={styles.clientSummary}>
        <div className={styles.summaryLeft}>
          <div className={styles.summaryLine}>
            <span className={styles.label}>Folio:</span> {receipt.receiptNumber}
          </div>
          <div className={styles.summaryLine}>
            <span className={styles.label}>Nombre del cliente:</span> {receipt.customerName}
          </div>
          <div className={styles.summaryLine}>
            <span className={styles.label}>Teléfono:</span> {receipt.customerPhone}
          </div>
        </div>
        <div className={styles.summaryRight}>
          <div className={styles.summaryLine}>
            <span className={styles.label}>Fecha:</span> {formatDate(receipt.date)}
          </div>
          <div className={styles.summaryLine}>
            <span className={styles.label}>Hora:</span> {formatTime(receipt.date)}
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>DATOS DEL CLIENTE</div>
        <div className={styles.sectionContent}>
          <div className={styles.dataLine}>
            <span className={styles.label}>Nombre del cliente:</span> {receipt.customerName}
          </div>
          <div className={styles.dataLine}>
            <span className={styles.label}>Teléfono:</span> {receipt.customerPhone}
          </div>
        </div>
      </div>

      {/* Payment Concept */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>CONCEPTO DEL PAGO</div>
        <div className={styles.sectionContent}>
          <div className={styles.checkboxGrid}>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={isRent} readOnly />
              <span>Renta de lavadora</span>
            </label>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={isSale} readOnly />
              <span>Venta de lavadora</span>
            </label>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={isCreditPayment} readOnly />
              <span>Abono de crédito</span>
            </label>
            {isExtRepair && (
              <label className={styles.checkbox}>
                <input type="checkbox" checked={true} readOnly />
                <span>Reparación externa</span>
              </label>
            )}
            {isDebt && (
              <label className={styles.checkbox}>
                <input type="checkbox" checked={true} readOnly />
                <span>Pago de deuda</span>
              </label>
            )}
            {!isExtRepair && (
              <label className={styles.checkbox}>
                <input type="checkbox" checked={isRecharge} readOnly />
                <span>Recargos</span>
              </label>
            )}
          </div>
          {receipt.description && (
            <div className={styles.description}>
              <span className={styles.label}>Descripción:</span> {receipt.description}
            </div>
          )}
        </div>
      </div>

      {/* Period and Payment Method */}
      <div className={styles.twoColumns}>
        {/* Period Paid */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>PERIODO PAGADO</div>
          <div className={styles.sectionContent}>
            {periodItems.map((item, index) => (
              <div key={index} className={styles.periodLine}>
                <span>{item.description}</span>
                <span className={styles.amount}>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className={styles.totalLine}>
              <span className={styles.totalLabel}>TOTAL PAGADO</span>
              <span className={styles.totalAmount}>{formatCurrency(receipt.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>FORMA DE PAGO</div>
          <div className={styles.sectionContent}>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={method === 'CASH'} readOnly />
              <span>Efectivo</span>
            </label>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={method === 'TRANSFER'} readOnly />
              <span>Transferencia</span>
            </label>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={method === 'DEPOSIT'} readOnly />
              <span>Depósito</span>
            </label>
          </div>
        </div>
      </div>

      {/* Observations */}
      {receipt.observations && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>OBSERVACIONES</div>
          <div className={styles.sectionContent}>
            <p className={styles.observations}>{receipt.observations}</p>
          </div>
        </div>
      )}

      {/* Confirmation */}
      <div className={styles.confirmation}>
        <label className={styles.checkbox}>
          <input type="checkbox" checked readOnly />
          <span className={styles.confirmationText}>CONFIRMACIÓN</span>
        </label>
        <p className={styles.confirmationMessage}>
          Con este recibo se confirma que el cliente ha realizado el pago
          correspondiente al periodo indicado y cantidades descritas.
        </p>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerLogo}>
          <img 
            src="/static/images/servi_hogar.png" 
            alt="Servi Hogar" 
            className={styles.footerLogoImage}
          />
          <div className={styles.footerPhone}>
            <strong>SERVI HOGAR</strong><br />
            687 191 40 85
          </div>
        </div>
        <div className={styles.footerContact}>
          <strong>QUEJAS, SUGERENCIAS Y PREMIOS:</strong><br />
          687 191 40 85
        </div>
      </div>
    </div>
          </Box>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              size="large"
              variant="outlined"
              onClick={onClose}
            >
              Cerrar
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                size="large"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Descargar
              </Button>
              <Button
                size="large"
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
              >
                Imprimir
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
};

export default PaymentReceipt;
