import { RentStatus } from '../models/RentStatus';
import { MachineStatus } from '../models/MachineStatus';

/**
 * Caché en memoria para catálogos de estatus (rent_statuses, machine_statuses).
 * Son catálogos estáticos (sembrados), así que evitamos un round-trip a Mongo
 * en cada petición sólo para traducir `id` -> `_id`.
 * Devuelve documentos `lean` (objetos planos con `_id`, `id`, `description`...).
 * No usar estos objetos para `.save()`.
 */
const TTL_MS = 10 * 60 * 1000;
const caches = new Map();

async function loadCatalog(Model) {
  const key = Model.modelName;
  const cached = caches.get(key);
  if (cached && cached.expires > Date.now()) return cached.promise;
  const promise = Model.find({})
    .lean()
    .then((docs) => {
      const byId = new Map();
      docs.forEach((d) => byId.set(d.id, d));
      return byId;
    })
    .catch((err) => {
      caches.delete(key);
      throw err;
    });
  caches.set(key, { promise, expires: Date.now() + TTL_MS });
  return promise;
}

async function getOne(Model, id) {
  const byId = await loadCatalog(Model);
  if (byId.has(id)) return byId.get(id);
  // Fallback: si no existe en caché (p.ej. estatus recién creado), consulta directo.
  caches.delete(Model.modelName);
  return Model.findOne({ id }).lean();
}

async function getMany(Model, ids) {
  const byId = await loadCatalog(Model);
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    caches.delete(Model.modelName);
    return Model.find({ id: { $in: ids } }).lean();
  }
  return ids.map((id) => byId.get(id));
}

/** Estatus de renta por su `id` (p.ej. 'RENTADO'). */
export const getRentStatus = (id) => getOne(RentStatus, id);
/** Lista de estatus de renta para los `ids` dados. */
export const getRentStatuses = (ids) => getMany(RentStatus, ids);
/** Arreglo de ObjectIds de estatus de renta para los `ids` dados. */
export const getRentStatusIds = async (ids) =>
  (await getMany(RentStatus, ids)).map((s) => s._id);

/** Estatus de máquina por su `id` (p.ej. 'LISTO'). */
export const getMachineStatus = (id) => getOne(MachineStatus, id);
/** Lista de estatus de máquina para los `ids` dados. */
export const getMachineStatuses = (ids) => getMany(MachineStatus, ids);
/** Arreglo de ObjectIds de estatus de máquina para los `ids` dados. */
export const getMachineStatusIds = async (ids) =>
  (await getMany(MachineStatus, ids)).map((s) => s._id);
