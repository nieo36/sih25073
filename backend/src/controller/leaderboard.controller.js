const { user: UserModel } = require('../model/user.model.js');
const { Assessment } = require('../model/assessment.model.js');

function calculateAge(ageVal) {
  if (typeof ageVal === 'number') return ageVal;
  const parsed = parseInt(ageVal, 10);
  return isNaN(parsed) ? 19 : parsed;
}

function getAgeGroup(age) {
  if (age < 14) return 'U-14';
  if (age < 17) return 'U-17';
  if (age < 20) return 'U-20';
  if (age < 23) return 'U-23';
  return 'Open';
}

function getTier(score) {
  if (score >= 94) return 'OLYMPIAN';
  if (score >= 90) return 'DIAMOND';
  if (score >= 82) return 'PLATINUM';
  if (score >= 74) return 'GOLD';
  return 'SILVER';
}

async function getLeaderboardHandler(req, res) {
  try {
    const {
      sport,
      state,
      gender,
      ageGroup,
      metric = 'overallScore',
      search,
      sortBy = 'score',
      limit = 50,
      page = 1,
    } = req.query;

    const users = await UserModel.find({
      role: { $in: ['user', 'athlete'] },
    }).lean();

    // Map each user to a LeaderboardAthlete with assessment data
    const athletesWithScores = await Promise.all(
      users.map(async (u) => {
        const assessments = await Assessment.find({ userId: u._id }).lean();
        const hasAssessments = assessments.length > 0;

        let overallScore = 80;
        let avgSymmetry = 92;
        let avgDepth = 88;
        let avgCadence = 86;
        let validReps = 0;
        let pushupReps = 0;
        let squatReps = 0;

        if (hasAssessments) {
          const sumScore = assessments.reduce((acc, a) => acc + (a.totalScore || 0), 0);
          const sumSym = assessments.reduce((acc, a) => acc + (a.symmetryScore || 90), 0);
          const sumDepth = assessments.reduce((acc, a) => acc + (a.depthScore || 88), 0);
          const sumCadence = assessments.reduce((acc, a) => acc + (a.cadenceScore || 85), 0);

          overallScore = Math.round(sumScore / assessments.length);
          avgSymmetry = Math.round(sumSym / assessments.length);
          avgDepth = Math.round(sumDepth / assessments.length);
          avgCadence = Math.round(sumCadence / assessments.length);

          assessments.forEach((a) => {
            const reps = a.validReps || a.repsCompleted || 0;
            validReps += reps;
            if (a.exerciseType === 'pushup') pushupReps += reps;
            if (a.exerciseType === 'squat') squatReps += reps;
          });
        }

        const age = calculateAge(u.profile?.age);
        const athleteAgeGroup = getAgeGroup(age);
        const athleteSport = u.profile?.primarySport || 'Athletics';
        const athleteState = u.profile?.state || 'Delhi';
        const athleteDistrict = u.profile?.city || 'Central Delhi';
        const athleteGender = u.profile?.gender || 'Male';

        const speed = Math.min(99, Math.round(avgCadence * 0.95 + 5));
        const strength = Math.min(99, Math.round(overallScore * 0.92 + 8));
        const agility = Math.min(99, Math.round(avgDepth * 0.94 + 6));
        const endurance = Math.min(99, Math.round(overallScore * 0.75 + 18));
        const power = Math.min(99, Math.round(overallScore * 0.96 + 4));
        const sprint = Math.min(99, Math.round(avgCadence * 0.96 + 4));

        const tier = getTier(overallScore);
        const verificationStatus = u.isEmailVerified ? 'VERIFIED' : 'PENDING';
        const percentile = Math.min(99.9, Number((70 + (overallScore - 60) * 0.74).toFixed(1)));

        return {
          athleteId: u._id.toString(),
          name: u.name || 'Athlete',
          age,
          gender: athleteGender,
          state: athleteState,
          district: athleteDistrict,
          sport: athleteSport,
          overallScore,
          validReps: validReps || 36,
          tier,
          verificationStatus,
          percentile,
          rankChange: 0,
          ageGroup: athleteAgeGroup,
          avatar: u.profile?.profilePhoto || u.profile?.avatar,
          metrics: {
            speed,
            strength,
            agility,
            endurance,
            power,
            pushups: pushupReps || 36,
            squats: squatReps || 42,
            sprint,
          },
        };
      })
    );

    // Apply Filters
    let filtered = athletesWithScores.filter((a) => {
      if (search) {
        const q = search.toLowerCase().trim();
        const match =
          a.name.toLowerCase().includes(q) ||
          a.state.toLowerCase().includes(q) ||
          a.district.toLowerCase().includes(q) ||
          a.sport.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (state && state !== 'All States' && a.state !== state) return false;
      if (sport && sport !== 'All Sports' && a.sport !== sport) return false;
      if (ageGroup && ageGroup !== 'All' && a.ageGroup !== ageGroup) return false;
      if (gender && gender !== 'All' && a.gender !== gender) return false;
      return true;
    });

    // Apply Sorting
    filtered.sort((a, b) => {
      if (metric && metric !== 'overallScore') {
        const valA = a.metrics[metric] || 0;
        const valB = b.metrics[metric] || 0;
        return valB - valA;
      }
      return b.overallScore - a.overallScore;
    });

    // Assign Ranks
    const rankedAthletes = filtered.map((a, idx) => ({
      ...a,
      rank: idx + 1,
    }));

    return res.status(200).json({
      success: true,
      count: rankedAthletes.length,
      data: rankedAthletes.slice(0, Number(limit) || 50),
    });
  } catch (err) {
    console.error('Error in getLeaderboardHandler:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard data',
      error: err.message,
    });
  }
}

async function getMyPositionHandler(req, res) {
  try {
    const userId = req.userInfo ? req.userInfo.id : undefined;
    const allUsers = await UserModel.find({ role: { $in: ['user', 'athlete'] } }).lean();

    let myAthlete = null;
    const scoredUsers = await Promise.all(
      allUsers.map(async (u) => {
        const assessments = await Assessment.find({ userId: u._id }).lean();
        const sumScore = assessments.reduce((acc, a) => acc + (a.totalScore || 0), 0);
        const score = assessments.length > 0 ? Math.round(sumScore / assessments.length) : 80;
        const obj = {
          id: u._id.toString(),
          score,
          state: u.profile?.state || 'Delhi',
          sport: u.profile?.primarySport || 'Athletics',
          age: calculateAge(u.profile?.age),
        };
        if (userId && u._id.toString() === userId.toString()) {
          myAthlete = obj;
        }
        return obj;
      })
    );

    scoredUsers.sort((a, b) => b.score - a.score);

    const totalAthletes = scoredUsers.length || 1;
    const myIndex = scoredUsers.findIndex((u) => u.id === (userId?.toString() || ''));
    const nationalRank = myIndex !== -1 ? myIndex + 1 : 1;

    const myState = myAthlete?.state || 'Delhi';
    const stateAthletes = scoredUsers.filter((u) => u.state === myState);
    const stateRank = Math.max(1, stateAthletes.findIndex((u) => u.id === (userId?.toString() || '')) + 1);

    const mySport = myAthlete?.sport || 'Athletics';
    const sportAthletes = scoredUsers.filter((u) => u.sport === mySport);
    const sportRank = Math.max(1, sportAthletes.findIndex((u) => u.id === (userId?.toString() || '')) + 1);

    const percentile = Number((((totalAthletes - nationalRank + 1) / totalAthletes) * 100).toFixed(1));

    return res.status(200).json({
      success: true,
      data: {
        nationalRank,
        stateRank,
        sportRank,
        ageGroupRank: Math.max(1, Math.round(nationalRank * 0.3)),
        percentile: percentile || 95.5,
        totalAthletes,
      },
    });
  } catch (err) {
    console.error('Error in getMyPositionHandler:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate rank position',
      error: err.message,
    });
  }
}

module.exports = {
  getLeaderboardHandler,
  getMyPositionHandler,
};
