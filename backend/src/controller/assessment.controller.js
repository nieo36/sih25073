const { Assessment } = require('../model/assessment.model.js');

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

module.exports = {
  syncAssessment,
  batchSyncAssessments,
  getHistory,
};
