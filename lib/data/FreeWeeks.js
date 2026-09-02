import { FREE_WEEK_REASONS } from '../consts/OBJ_CONTS';

/**
 * Semanas gratis: registro de movimientos y desglose del saldo.
 *
 * `Customer.freeWeeks` es el saldo vigente y sigue siendo la fuente de verdad
 * para cobrar. `Customer.freeWeeksHistory` es un libro de movimientos que
 * explica ese saldo: por qué se otorgó cada semana y en qué renta se aplicó.
 *
 * El libro arrancó vacío, así que los saldos anteriores no tienen origen
 * registrado. `getFreeWeeksBreakdown` los reporta aparte en vez de inventarles
 * un motivo.
 */

const isGrant = (movement) => movement?.reason !== FREE_WEEK_REASONS.USO;

// Mongoose aplica el default del esquema al leer, pero un documento traído con
// .lean() o creado antes del campo puede no traerlo.
const historyOf = (customer) =>
  Array.isArray(customer?.freeWeeksHistory) ? customer.freeWeeksHistory : [];

/**
 * Otorga semanas gratis al cliente y deja registrado el motivo.
 * Mutar el documento es intencional: el llamador ya lo guarda dentro de su
 * propia transacción.
 */
export function grantFreeWeeks(
  customer,
  { reason, weeks = 1, date, rent = null, referral = null, createdBy = null }
) {
  if (!customer || weeks <= 0) return;
  if (!Array.isArray(customer.freeWeeksHistory)) {
    customer.freeWeeksHistory = [];
  }
  customer.freeWeeks = (customer.freeWeeks || 0) + weeks;
  customer.freeWeeksHistory.push({
    reason,
    weeks,
    date: date || new Date(),
    rent,
    referral,
    createdBy
  });
}

/**
 * Descuenta semanas gratis del cliente y registra en qué renta se aplicaron.
 */
export function consumeFreeWeeks(
  customer,
  { weeks, date, rent = null, createdBy = null }
) {
  if (!customer || !weeks || weeks <= 0) return;
  if (!Array.isArray(customer.freeWeeksHistory)) {
    customer.freeWeeksHistory = [];
  }
  customer.freeWeeks = (customer.freeWeeks || 0) - weeks;
  customer.freeWeeksHistory.push({
    reason: FREE_WEEK_REASONS.USO,
    weeks,
    date: date || new Date(),
    rent,
    referral: null,
    createdBy
  });
}

/**
 * Explica el saldo vigente de semanas gratis.
 *
 * Consume los usos registrados contra el saldo sin origen primero (es el más
 * antiguo por definición) y luego contra las semanas otorgadas en orden de
 * antigüedad, de modo que lo que queda es lo que el cliente todavía tiene.
 *
 * Devuelve `{ freeWeeks, sources, unregistered }`, donde `sources` son los
 * otorgamientos con semanas aún disponibles y `unregistered` las semanas
 * anteriores al libro de movimientos.
 */
export function getFreeWeeksBreakdown(customer) {
  const freeWeeks = customer?.freeWeeks || 0;
  const history = historyOf(customer);

  const grants = history
    .filter(isGrant)
    .map((m) => ({
      reason: m.reason,
      weeks: m.weeks,
      remaining: m.weeks,
      date: m.date,
      rent: m.rent || null,
      referral: m.referral || null
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const granted = grants.reduce((sum, g) => sum + g.weeks, 0);
  const used = history
    .filter((m) => !isGrant(m))
    .reduce((sum, m) => sum + m.weeks, 0);

  // Saldo que ya existía antes de registrar motivos: lo que el saldo actual no
  // alcanza a explicar con los movimientos conocidos.
  const legacyPool = Math.max(0, freeWeeks - granted + used);

  let pendingUses = used;
  const fromLegacy = Math.min(pendingUses, legacyPool);
  const unregistered = legacyPool - fromLegacy;
  pendingUses -= fromLegacy;

  for (const grant of grants) {
    if (pendingUses <= 0) break;
    const taken = Math.min(grant.remaining, pendingUses);
    grant.remaining -= taken;
    pendingUses -= taken;
  }

  return {
    freeWeeks,
    sources: grants.filter((g) => g.remaining > 0),
    unregistered
  };
}
