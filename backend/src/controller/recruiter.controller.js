const { user: UserModel } = require('../model/user.model.js');
const { Assessment } = require('../model/assessment.model.js');

function calculateAge(ageVal) {
  if (typeof ageVal === 'number') return ageVal;
  const parsed = parseInt(ageVal, 10);
  return isNaN(parsed) ? 19 : parsed;
}

function getTier(score) {
  if (score >= 94) return 'OLYMPIAN';
  if (score >= 90) return 'DIAMOND';
  if (score >= 82) return 'PLATINUM';
  if (score >= 74) return 'GOLD';
  return 'SILVER';
}

async function getCandidatesHandler(req, res) {
  try {
    const { sport, state, tier, minScore } = req.query;

    const users = await UserModel.find({
      role: { $in: ['user', 'athlete'] },
      $or: [
        { 'privacy.recruiterDiscoverability': { $ne: false } },
        { privacy: { $exists: false } },
      ],
    }).lean();

    const candidates = await Promise.all(
      users.map(async (u) => {
        const assessments = await Assessment.find({ userId: u._id }).lean();
        const hasAssessments = assessments.length > 0;

        let overallScore = 0;
        let avgSymmetry = 0;
        let avgDepth = 0;
        let avgCadence = 0;
        let verifiedReps = 0;

        if (hasAssessments) {
          const sumScore = assessments.reduce((acc, a) => acc + (a.totalScore || 0), 0);
          const sumSym = assessments.reduce((acc, a) => acc + (a.symmetryScore || 85), 0);
          const sumDepth = assessments.reduce((acc, a) => acc + (a.depthScore || 80), 0);
          const sumCadence = assessments.reduce((acc, a) => acc + (a.cadenceScore || 80), 0);
          const sumReps = assessments.reduce((acc, a) => acc + (a.validReps || a.repsCompleted || 0), 0);

          overallScore = Math.round(sumScore / assessments.length);
          avgSymmetry = Math.round(sumSym / assessments.length);
          avgDepth = Math.round(sumDepth / assessments.length);
          avgCadence = Math.round(sumCadence / assessments.length);
          verifiedReps = sumReps;
        }

        const age = calculateAge(u.profile?.age);
        const athleteSport = u.profile?.primarySport || 'Basketball';
        const athleteState = u.profile?.state || 'Delhi';
        const athleteDistrict = u.profile?.city || '';
        const athleteGender = u.profile?.gender || 'Male';

        const speed = hasAssessments ? Math.min(99, Math.round(avgCadence * 0.95 + 5)) : 0;
        const agility = hasAssessments ? Math.min(99, Math.round(avgDepth * 0.94 + 6)) : 0;
        const strength = hasAssessments ? Math.min(99, Math.round(overallScore * 0.92 + 8)) : 0;
        const athleteTier = hasAssessments ? getTier(overallScore) : 'UNASSESSED';

        const idSuffix = u._id.toString().replace(/\D/g, '').padEnd(4, '8').slice(-4);
        const passportId = `IND-2026-${idSuffix}`;

        // Accurate match rationale
        let matchScore = 0;
        let aiInsight = '';

        if (hasAssessments) {
          matchScore = Math.min(99, Math.max(50, Math.round(70 + (overallScore - 60) * 0.7)));
          aiInsight = `Athlete in ${athleteSport} from ${athleteState}. Demonstrates ${avgSymmetry}% bilateral symmetry and completed ${assessments.length} recorded assessments.`;
        } else {
          matchScore = 50;
          aiInsight = `New athlete profile registered in ${athleteSport}. Awaiting baseline calibration.`;
        }

        // Contact info privacy check: only allowed if recruiter discoverability is not false and athlete profile allows contact
        const contactAllowed = u.privacy?.recruiterDiscoverability !== false && u.privacy?.profileVisibility !== 'only_me';

        return {
          id: u._id.toString(),
          name: u.name || 'Athlete',
          age,
          gender: athleteGender,
          sport: athleteSport,
          state: athleteState,
          district: athleteDistrict,
          email: contactAllowed ? u.email : undefined,
          overallScore,
          speed,
          agility,
          strength,
          symmetry: avgSymmetry,
          tier: athleteTier,
          matchScore,
          aiInsight,
          photo: u.profile?.profilePhoto || u.profile?.avatar,
          shortlisted: false,
          contactAllowed,
          passportId,
          verifiedReps,
        };
      })
    );

    // Filter
    let result = candidates.filter((c) => {
      if (sport && sport !== 'All Sports' && c.sport !== sport) return false;
      if (state && state !== 'All States' && c.state !== state) return false;
      if (tier && tier !== 'ALL' && c.tier !== tier) return false;
      if (minScore && c.overallScore < Number(minScore)) return false;
      return true;
    });

    // Exact matches first (exact sport), closest matches second
    result.sort((a, b) => {
      if (sport && sport !== 'All Sports') {
        const aExact = a.sport.toLowerCase() === sport.toLowerCase() ? 1 : 0;
        const bExact = b.sport.toLowerCase() === sport.toLowerCase() ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
      }
      return b.overallScore - a.overallScore;
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (err) {
    console.error('Error in getCandidatesHandler:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter candidate pool',
      error: err.message,
    });
  }
}

module.exports = {
  getCandidatesHandler,
};
