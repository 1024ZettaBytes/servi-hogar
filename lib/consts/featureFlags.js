// Central registry of feature flags. To add a new flag, add an entry here with
// a unique key and the metadata shown in the Configuraciones admin page. The
// rest of the infrastructure (model, data layer, API, UI) is generic and needs
// no changes per flag.

export const FEATURE_FLAGS = {
  CASH_SETTLEMENT_BYPASS_WINDOW: 'cash_settlement_bypass_window'
};

export const FEATURE_FLAG_DEFINITIONS = [
  {
    key: FEATURE_FLAGS.CASH_SETTLEMENT_BYPASS_WINDOW,
    name: 'Liquidación de contado sin límite de días',
    description:
      'Permite liquidar una venta de contado respetando el precio original sin importar cuántos días hayan pasado desde la entrega. Al activarse, se omite la validación de 30 días.'
  }
];

export const isKnownFeatureFlag = (key) =>
  FEATURE_FLAG_DEFINITIONS.some((flag) => flag.key === key);
