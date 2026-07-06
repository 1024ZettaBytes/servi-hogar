import { connectToDatabase, isConnected } from '../db';
import { FeatureFlag } from '../models/FeatureFlag';
import {
  FEATURE_FLAG_DEFINITIONS,
  isKnownFeatureFlag
} from '../consts/featureFlags';

/**
 * Returns all known feature flags (from the registry) merged with their stored
 * enabled state. Flags with no DB record yet are reported as disabled.
 */
export async function getFeatureFlagsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const stored = await FeatureFlag.find({}).lean();
  const storedByKey = stored.reduce((acc, flag) => {
    acc[flag.key] = flag;
    return acc;
  }, {});

  return FEATURE_FLAG_DEFINITIONS.map((definition) => ({
    key: definition.key,
    name: definition.name,
    description: definition.description,
    enabled: storedByKey[definition.key]?.enabled || false,
    updatedAt: storedByKey[definition.key]?.updatedAt || null
  }));
}

/**
 * Server-side check for whether a given feature flag is enabled.
 * Returns false for unknown keys or when no record exists.
 */
export async function isFeatureEnabled(key) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const flag = await FeatureFlag.findOne({ key }).lean();
  return flag?.enabled === true;
}

/**
 * Enable/disable a feature flag (upsert). Rejects unknown keys.
 */
export async function setFeatureFlagData({ key, enabled, lastUpdatedBy }) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  if (!isKnownFeatureFlag(key)) {
    const error = new Error('La configuración indicada no existe.');
    error.name = 'Internal';
    throw error;
  }

  const currentDate = new Date();
  const flag = await FeatureFlag.findOneAndUpdate(
    { key },
    {
      $set: { enabled: !!enabled, updatedAt: currentDate, lastUpdatedBy },
      $setOnInsert: { key, createdAt: currentDate }
    },
    { new: true, upsert: true }
  ).lean();

  return flag;
}
