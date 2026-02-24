import { getUserId, validateUserPermissions, SUPER_USERS } from '../../auth/authUtils';
import { connectToDatabase } from '../../../../lib/db';
import { RentPickup } from '../../../../lib/models/RentPickup';
import { UserUnlock } from '../../../../lib/models/UserUnlock';
import { User } from '../../../../lib/models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ errorMsg: 'Method not allowed' });
  }

  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (!validRole) return;

  try {
    const userId = await getUserId(req);
    await connectToDatabase();
    
    // Check if the current user is a super user. They are never blocked by this rule
    const currentUser = await User.findById(userId);
    if (currentUser && SUPER_USERS.includes(currentUser.id)) {
      return res.status(200).json({ blocked: false });
    }

    // Check if there are any investigations older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find the oldest overdue investigation
    const overdueInvestigation = await RentPickup.findOne({
      isUnderInvestigation: true,
      updatedAt: { $lt: twentyFourHoursAgo }
    }).sort({ updatedAt: 1 }).lean();

    if (!overdueInvestigation) {
      return res.status(200).json({ blocked: false });
    }

    // There is at least one overdue investigation.
    // Check if the current admin was unlocked AFTER this investigation became overdue
    // i.e. unlockedAt > (overdueInvestigation.updatedAt + 24h)
    const overdueTime = new Date(new Date(overdueInvestigation.updatedAt).getTime() + 24 * 60 * 60 * 1000);
    
    const recentUnlock = await UserUnlock.findOne({
      user: userId,
      unlockedAt: { $gt: overdueTime }
    }).lean();

    if (recentUnlock) {
      // User was unlocked after the oldest investigation became overdue.
      // We shouldn't block them again for the SAME investigation.
      return res.status(200).json({ blocked: false });
    }

    // User should be blocked. Let's update their user record.
    if (currentUser && !currentUser.isBlocked) {
      currentUser.isBlocked = true;
      await currentUser.save();
      return res.status(200).json({ blocked: true, newlyBlocked: true });
    }

    return res.status(200).json({ blocked: currentUser?.isBlocked || false, newlyBlocked: false });
  } catch (error) {
    console.error('Error checking overdue investigations:', error);
    res.status(500).json({ errorMsg: 'Error al verificar investigaciones' });
  }
}
