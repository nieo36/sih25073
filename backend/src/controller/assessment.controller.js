const { Assessment } = require('../model/assessment.model.js');
const { user: UserModel } = require('../model/user.model.js');

/**
 * Controller to handle single assessment synchronization from client
 */
async function syncAssessment(req, res) {
  try {
    const data = req.body;
    const userId = req.userInfo ? req.userInfo.id : undefined;

    const assessmentData = {
      ...data,
      userId: userId || data.userId,
      syncedAt: new Date(),
      clientTimestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
    };

    let doc;
    if (data.localId) {
      doc = await Assessment.findOneAndUpdate(
        { localId: data.localId },
        { $set: assessmentData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      doc = await Assessment.create(assessmentData);
    }

    return res.status(200).json({
      success: true,
      message: 'Assessment synced successfully',
      id: doc._id,
      remoteId: doc._id.toString(),
      localId: doc.localId,
    });
  } catch (err) {
    console.error('Error syncing assessment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync assessment',
      error: err.message,
    });
  }
}

/**
 * Controller to handle batch synchronization of multiple offline assessments
 */
async function batchSyncAssessments(req, res) {
  try {
    const { assessments } = req.body;
    if (!Array.isArray(assessments) || assessments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No assessments provided for batch sync',
      });
    }

    const userId = req.userInfo ? req.userInfo.id : undefined;
    const syncedIds = [];

    for (const item of assessments) {
      const assessmentData = {
        ...item,
        userId: userId || item.userId,
        syncedAt: new Date(),
        clientTimestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
      };

      if (item.localId) {
        await Assessment.findOneAndUpdate(
          { localId: item.localId },
          { $set: assessmentData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        syncedIds.push(item.localId);
      } else {
        const created = await Assessment.create(assessmentData);
        syncedIds.push(created._id.toString());
      }
    }

    return res.status(200).json({
      success: true,
      message: `Batch synced ${syncedIds.length} assessments`,
      syncedIds,
    });
  } catch (err) {
    console.error('Error batch syncing assessments:', err);
    return res.status(500).json({
      success: false,
      message: 'Batch sync failed',
      error: err.message,
    });
  }
}

/**
 * Get assessment history for the authenticated user
 */
async function getHistory(req, res) {
  try {
    const userId = req.userInfo ? req.userInfo.id : undefined;
    const query = userId ? { userId } : {};

    const assessments = await Assessment.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (err) {
    console.error('Error fetching assessment history:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment history',
      error: err.message,
    });
  }
}

/**
 * Get aggregated athlete stats, metrics, and progress trends
 */
async function getAthleteStats(req, res) {
  try {
    const userId = req.userInfo ? req.userInfo.id : undefined;
    const query = userId ? { userId } : {};

    const assessments = await Assessment.find(query)
      .sort({ createdAt: 1 })
      .lean();

    const count = assessments.length;
    if (count === 0) {
      return res.status(200).json({
        success: true,
        data: {
          overallScore: 0,
          completedCount: 0,
          totalValidReps: 0,
          eloRating: 0,
          tier: 'UNASSESSED',
          percentile: 0,
          metrics: {
            speed: 0,
            agility: 0,
            strength: 0,
            endurance: 0,
            power: 0,
            pushups: 0,
            squats: 0,
            curls: 0,
            formPrecision: 0,
            bilateralSymmetry: 0,
            mobilityRom: 0,
          },
          trend: [],
        },
      });
    }

    let avgScore = 0;
    let avgSymmetry = 0;
    let avgDepth = 0;
    let avgCadence = 0;
    let avgForm = 0;
    let totalValidReps = 0;
    let pushupReps = 0;
    let squatReps = 0;
    let curlReps = 0;

    const sumScore = assessments.reduce((acc, a) => acc + (a.totalScore || 0), 0);
    const sumSym = assessments.reduce((acc, a) => acc + (a.symmetryScore || 90), 0);
    const sumDepth = assessments.reduce((acc, a) => acc + (a.depthScore || 88), 0);
    const sumCadence = assessments.reduce((acc, a) => acc + (a.cadenceScore || 85), 0);
    const sumForm = assessments.reduce((acc, a) => acc + (a.formAccuracy || 90), 0);

    avgScore = Math.round(sumScore / count);
    avgSymmetry = Math.round(sumSym / count);
    avgDepth = Math.round(sumDepth / count);
    avgCadence = Math.round(sumCadence / count);
    avgForm = Number((sumForm / count).toFixed(1));

    assessments.forEach((a) => {
      const reps = a.validReps || a.repsCompleted || 0;
      totalValidReps += reps;
      if (a.exerciseType === 'pushup') pushupReps += reps;
      if (a.exerciseType === 'squat') squatReps += reps;
      if (a.exerciseType === 'curl') curlReps += reps;
    });

    const speed = Math.min(99, Math.round(avgCadence * 0.95 + 5));
    const agility = Math.min(99, Math.round(avgDepth * 0.94 + 6));
    const strength = Math.min(99, Math.round(avgScore * 0.92 + 8));
    const endurance = Math.min(99, Math.round(avgScore * 0.75 + Math.min(20, totalValidReps / 5)));
    const power = Math.min(99, Math.round(avgScore * 0.96 + 4));

    const eloRating = Math.round(1500 + avgScore * 4.2);
    let tier = 'PLATINUM';
    if (avgScore >= 94) tier = 'OLYMPIAN';
    else if (avgScore >= 90) tier = 'DIAMOND';
    else if (avgScore >= 82) tier = 'PLATINUM';
    else if (avgScore >= 74) tier = 'GOLD';
    else tier = 'SILVER';

    const percentile = Math.min(99.8, Number((72 + (avgScore - 60) * 0.68).toFixed(1)));

    // Generate progression trend from user's assessments if available
    const trend = assessments.map((a) => a.totalScore || 0);

    return res.status(200).json({
      success: true,
      data: {
        overallScore: avgScore,
        completedCount: count,
        totalValidReps,
        eloRating,
        tier,
        percentile,
        metrics: {
          speed,
          agility,
          strength,
          endurance,
          power,
          pushups: pushupReps,
          squats: squatReps,
          curls: curlReps,
          formPrecision: avgForm,
          bilateralSymmetry: avgSymmetry,
          mobilityRom: avgDepth,
        },
        trend,
      },
    });
  } catch (err) {
    console.error('Error fetching athlete stats:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate athlete stats',
      error: err.message,
    });
  }
}

module.exports = {
  syncAssessment,
  batchSyncAssessments,
  getHistory,
  getAthleteStats,
};
