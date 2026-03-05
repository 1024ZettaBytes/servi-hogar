import { connectToDatabase, isConnected } from '../db';
import { TechnicianToolAssignment } from '../models/TechnicianToolAssignment';
import { Tool } from '../models/Tool';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { uploadFile, deleteFile } from '../cloud';
import { ToolResetLog } from '../models/ToolResetLog';

Tool.init();
TechnicianToolAssignment.init();
ToolResetLog.init();

/**
 * Get the current/latest tool assignment for a specific technician
 */
export async function getTechnicianToolAssignment(technicianId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const assignment = await TechnicianToolAssignment.findOne({
    technician: technicianId
  })
    .sort({ createdAt: -1 })
    .populate('tools.tool')
    .populate('technician', 'name id')
    .populate('assignedBy', 'name')
    .populate('auxVerifiedBy', 'name')
    .populate('replacedTechnician', 'name')
    .lean();
  return assignment;
}

/**
 * Get all tool assignments (for herramientas page)
 */
export async function getAllToolAssignments() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const tecRole = await Role.findOne({ id: 'TEC' });
  const technicians = await User.find({ role: tecRole._id, isActive: true })
    .select('_id name id startM endM toolsVerificationPending')
    .lean();

  const assignments = await TechnicianToolAssignment.find()
    .sort({ createdAt: -1 })
    .populate('tools.tool')
    .populate('technician', 'name id')
    .populate('assignedBy', 'name')
    .populate('auxVerifiedBy', 'name')
    .populate('replacedTechnician', 'name')
    .lean();

  // Group by technician, keep only the latest assignment per technician
  const latestByTech = new Map();
  for (const a of assignments) {
    const techId = a.technician?._id?.toString();
    if (techId && !latestByTech.has(techId)) {
      latestByTech.set(techId, a);
    }
  }

  return { technicians, assignments: Array.from(latestByTech.values()) };
}

/**
 * Get assignments pending AUX verification
 */
export async function getPendingAuxVerifications() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const assignments = await TechnicianToolAssignment.find({
    status: 'PENDING_AUX_VERIFICATION'
  })
    .populate('tools.tool')
    .populate('technician', 'name id')
    .populate('assignedBy', 'name')
    .populate('replacedTechnician', 'name')
    .lean();
  return assignments;
}

/**
 * Create a tool assignment when an admin creates a TEC that replaces another.
 * Auto-copies tools from replaced technician. Blocks all AUX users.
 */
export async function createReplacementToolAssignment({
  technicianId,
  replacedTechnicianId,
  assignedBy,
  session
}) {
  let error = new Error();
  error.name = 'Internal';

  // Get the replaced technician's latest assignment
  const replacedAssignment = await TechnicianToolAssignment.findOne({
    technician: replacedTechnicianId,
    status: 'CONFIRMED'
  }).sort({ createdAt: -1 });

  let toolsList;
  if (replacedAssignment && replacedAssignment.tools.length > 0) {
    // Copy tools from replaced technician
    toolsList = replacedAssignment.tools.map((t) => ({
      tool: t.tool,
      quantity: t.quantity
    }));
  } else {
    // If replaced technician had no confirmed tools, assign all default tools
    const allTools = await Tool.find({ isActive: true });
    if (allTools.length === 0) {
      error.message =
        'No hay herramientas registradas. Por favor registre herramientas primero.';
      throw error;
    }
    toolsList = allTools.map((t) => ({ tool: t._id, quantity: 1 }));
  }

  const newAssignment = new TechnicianToolAssignment({
    technician: technicianId,
    tools: toolsList,
    status: 'PENDING_AUX_VERIFICATION',
    assignedBy,
    assignedAt: new Date(),
    replacedTechnician: replacedTechnicianId
  });

  await newAssignment.save({ session });

  // Remove assignments from the replaced technician and delete their photos
  const oldAssignments = await TechnicianToolAssignment.find({
    technician: replacedTechnicianId
  });
  for (const old of oldAssignments) {
    if (old.photoUrl) {
      const oldFileName = old.photoUrl.split(`${process.env.CLOUD_BUCKET}/`)[1];
      if (oldFileName) {
        await deleteFile(oldFileName).catch((err) =>
          console.warn('Error deleting old replacement photo:', err)
        );
      }
    }
  }
  await TechnicianToolAssignment.deleteMany(
    { technician: replacedTechnicianId },
    { session }
  );

  // Set technician's toolsVerificationPending
  const technician = await User.findById(technicianId).session(session);
  technician.toolsVerificationPending = true;
  await technician.save({ session, new: false });

  return newAssignment;
}

/**
 * AUX assigns tools manually to a technician (from herramientas page).
 * Photo is required. Goes directly to PENDING_TECH_CONFIRMATION.
 */
export async function assignToolsToTechnician({
  technicianId,
  toolsList,
  auxUserId,
  files
}) {
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  let error = new Error();
  error.name = 'Internal';

  try {
    if (!technicianId || !toolsList || toolsList.length === 0) {
      error.message = 'Datos incompletos para la asignación.';
      throw error;
    }

    if (!files?.photo) {
      error.message = 'La foto de verificación es requerida.';
      throw error;
    }

    const technician = await User.findById(technicianId);
    if (!technician) {
      error.message = 'Técnico no encontrado.';
      throw error;
    }

    // Check for existing assignment and delete old photo
    const existingAssignment = await TechnicianToolAssignment.findOne({
      technician: technicianId
    }).sort({ createdAt: -1 });

    if (existingAssignment?.photoUrl) {
      const oldFileName = existingAssignment.photoUrl.split(`${process.env.CLOUD_BUCKET}/`)[1];
      if (oldFileName) {
        await deleteFile(oldFileName).catch((err) =>
          console.warn('Error deleting old photo:', err)
        );
      }
    }

    // Upload photo
    const photoFile = files.photo;
    const filePath = photoFile.filepath || photoFile.path;
    const fileName = `tool-assignments/${technicianId}_${Date.now()}.jpg`;
    const photoUrl = await uploadFile(filePath, fileName);

    await session.startTransaction();

    // Remove old assignments for this technician
    if (existingAssignment) {
      await TechnicianToolAssignment.deleteMany(
        { technician: technicianId },
        { session }
      );
    }

    const newAssignment = new TechnicianToolAssignment({
      technician: technicianId,
      tools: toolsList.map((t) => ({ tool: t.tool, quantity: t.quantity || 1 })),
      photoUrl,
      status: 'PENDING_TECH_CONFIRMATION',
      assignedBy: auxUserId,
      assignedAt: new Date(),
      auxVerifiedBy: auxUserId,
      auxVerifiedAt: new Date()
    });

    await newAssignment.save({ session });

    // Set technician's toolsVerificationPending
    technician.toolsVerificationPending = true;
    await technician.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return newAssignment;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    throw new Error(
      'Ocurrió un error al asignar las herramientas. Intente de nuevo.'
    );
  }
}

/**
 * AUX verifies a pending assignment with photo (for replacement flow).
 * Unblocks all AUX users.
 */
export async function auxVerifyToolAssignment({ assignmentId, auxUserId, files }) {
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  let error = new Error();
  error.name = 'Internal';

  try {
    if (!files?.photo) {
      error.message = 'La foto de verificación es requerida.';
      throw error;
    }

    const assignment = await TechnicianToolAssignment.findById(assignmentId);
    if (!assignment) {
      error.message = 'Asignación no encontrada.';
      throw error;
    }

    if (assignment.status !== 'PENDING_AUX_VERIFICATION') {
      error.message = 'Esta asignación ya fue verificada.';
      throw error;
    }

    // Upload photo
    const photoFile = files.photo;
    const filePath = photoFile.filepath || photoFile.path;
    const fileName = `tool-assignments/${assignment.technician}_${Date.now()}.jpg`;
    const photoUrl = await uploadFile(filePath, fileName);

    await session.startTransaction();

    assignment.photoUrl = photoUrl;
    assignment.status = 'PENDING_TECH_CONFIRMATION';
    assignment.auxVerifiedBy = auxUserId;
    assignment.auxVerifiedAt = new Date();
    assignment.updatedAt = new Date();
    await assignment.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return assignment;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    throw new Error(
      'Ocurrió un error al verificar la asignación. Intente de nuevo.'
    );
  }
}

/**
 * TEC confirms tool receipt.
 */
export async function techConfirmToolAssignment({ assignmentId, technicianId }) {
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  let error = new Error();
  error.name = 'Internal';

  try {
    const assignment = await TechnicianToolAssignment.findById(assignmentId);
    if (!assignment) {
      error.message = 'Asignación no encontrada.';
      throw error;
    }

    if (assignment.technician.toString() !== technicianId) {
      error.message = 'No tienes permiso para confirmar esta asignación.';
      throw error;
    }

    if (assignment.status !== 'PENDING_TECH_CONFIRMATION') {
      error.message = 'Esta asignación no está pendiente de confirmación.';
      throw error;
    }

    await session.startTransaction();

    assignment.status = 'CONFIRMED';
    assignment.techConfirmedAt = new Date();
    assignment.updatedAt = new Date();
    await assignment.save({ session, new: false });

    // Clear toolsVerificationPending on the technician
    const technician = await User.findById(technicianId);
    technician.toolsVerificationPending = false;
    await technician.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return assignment;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    throw new Error(
      'Ocurrió un error al confirmar las herramientas. Intente de nuevo.'
    );
  }
}

/**
 * Check if a technician has tools assigned (for login validation)
 */
export async function technicianHasTools(technicianId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const assignment = await TechnicianToolAssignment.findOne({
    technician: technicianId,
    status: { $in: ['PENDING_TECH_CONFIRMATION', 'CONFIRMED'] }
  });
  return !!assignment;
}

/**
 * Get the full tool status for a technician (used in _app.tsx check).
 * Returns:
 *  - { type: 'PENDING_TECH_CONFIRMATION', assignment } → TEC must confirm
 *  - { type: 'PENDING_AUX_VERIFICATION' } → waiting on AUX photo verification
 *  - { type: 'NO_TOOLS' } → no assignment exists at all
 *  - null → TEC has CONFIRMED tools, all good
 */
export async function getTechToolStatus(technicianId) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  // 1. Check for pending TEC confirmation
  const pendingConfirm = await TechnicianToolAssignment.findOne({
    technician: technicianId,
    status: 'PENDING_TECH_CONFIRMATION'
  })
    .populate('tools.tool')
    .populate('auxVerifiedBy', 'name')
    .lean();

  if (pendingConfirm) {
    return { type: 'PENDING_TECH_CONFIRMATION', assignment: pendingConfirm };
  }

  // 2. Check for pending AUX verification
  const pendingAux = await TechnicianToolAssignment.findOne({
    technician: technicianId,
    status: 'PENDING_AUX_VERIFICATION'
  }).lean();

  if (pendingAux) {
    return { type: 'PENDING_AUX_VERIFICATION' };
  }

  // 3. Check if has any confirmed assignment
  const confirmed = await TechnicianToolAssignment.findOne({
    technician: technicianId,
    status: 'CONFIRMED'
  }).lean();

  if (confirmed) {
    return null; // All good
  }

  // 4. No assignment at all
  return { type: 'NO_TOOLS' };
}

/**
 * Lightweight check for AUX users: returns list of technicians that need attention.
 * - Technicians with no tool assignment at all
 * - Technicians with PENDING_AUX_VERIFICATION assignment
 */
export async function getAuxPendingToolActions() {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const tecRole = await Role.findOne({ id: 'TEC' });
  if (!tecRole) return { pending: [] };

  const activeTechs = await User.find({ role: tecRole._id, isActive: true })
    .select('_id name id')
    .lean();

  if (activeTechs.length === 0) return { pending: [] };

  const pending = [];

  for (const tech of activeTechs) {
    // Check for pending AUX verification
    const pendingAux = await TechnicianToolAssignment.findOne({
      technician: tech._id,
      status: 'PENDING_AUX_VERIFICATION'
    }).lean();

    if (pendingAux) {
      pending.push({ techName: tech.name, type: 'PENDING_AUX_VERIFICATION' });
      continue;
    }

    // Check if has any assignment at all (any status)
    const anyAssignment = await TechnicianToolAssignment.findOne({
      technician: tech._id
    }).lean();

    if (!anyAssignment) {
      pending.push({ techName: tech.name, type: 'NO_TOOLS' });
    }
  }

  return { pending };
}

/**
 * Get the current period's reset date.
 * Reset months: January(0), May(4), September(8)
 * Returns the most recent reset date that is <= today.
 */
function getCurrentResetDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Reset months in order: 0(Jan), 4(May), 8(Sep)
  const resetMonths = [0, 4, 8];

  // Find the most recent reset month <= current month
  let resetMonth = resetMonths[0];
  let resetYear = year;
  for (const rm of resetMonths) {
    if (month >= rm) {
      resetMonth = rm;
      resetYear = year;
    }
  }
  // If current month is before January reset (shouldn't happen since Jan=0),
  // use previous year's September
  if (month < 0) {
    resetMonth = 8;
    resetYear = year - 1;
  }

  return new Date(resetYear, resetMonth, 1);
}

/**
 * Get the period key string for a given reset date, e.g. "2026-01"
 */
function getPeriodKey(resetDate) {
  const y = resetDate.getFullYear();
  const m = String(resetDate.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Check if a periodic reset is needed and execute it.
 * Called lazily from API endpoints.
 * Resets all CONFIRMED assignments to PENDING_AUX_VERIFICATION,
 * deletes their photos, and sets toolsVerificationPending on technicians.
 */
export async function checkAndRunPeriodicReset() {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const resetDate = getCurrentResetDate();
  const periodKey = getPeriodKey(resetDate);

  // Check if today is on or after the reset date
  const now = new Date();
  if (now < resetDate) return;

  // Atomically claim the reset — prevents race condition with concurrent requests
  const claimed = await ToolResetLog.findOneAndUpdate(
    { periodKey },
    { $setOnInsert: { resetDate, periodKey, assignmentsReset: 0, createdAt: new Date() } },
    { upsert: true, new: false }
  );
  // If claimed is not null, another request already created the log — skip
  if (claimed) return;

  // Perform the reset
  console.log(`[ToolReset] Running periodic reset for period ${periodKey}`);

  // Find all assignments that are not already pending AUX verification
  const assignmentsToReset = await TechnicianToolAssignment.find({
    status: { $ne: 'PENDING_AUX_VERIFICATION' }
  });

  // Delete photos from bucket (need new verification photos)
  for (const assignment of assignmentsToReset) {
    if (assignment.photoUrl) {
      const fileName = assignment.photoUrl.split(`${process.env.CLOUD_BUCKET}/`)[1];
      if (fileName) {
        await deleteFile(fileName).catch((err) => {
          // Ignore 404 — photo may have been deleted already
          if (err?.code !== 404) {
            console.warn('[ToolReset] Error deleting photo:', err.message || err);
          }
        });
      }
    }
    // Reset to pending AUX verification, keep tools list
    assignment.status = 'PENDING_AUX_VERIFICATION';
    assignment.photoUrl = undefined;
    assignment.auxVerifiedBy = undefined;
    assignment.auxVerifiedAt = undefined;
    assignment.techConfirmedAt = undefined;
    assignment.updatedAt = new Date();
    await assignment.save();
  }

  // Update the log with actual count
  await ToolResetLog.updateOne(
    { periodKey },
    { $set: { assignmentsReset: assignmentsToReset.length } }
  );

  console.log(
    `[ToolReset] Reset ${assignmentsToReset.length} assignments to PENDING_AUX_VERIFICATION for period ${periodKey}`
  );
}
