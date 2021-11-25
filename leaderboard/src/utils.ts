import { MemberType, LeaderboardType, LeaderboardTypePlural } from './index';

const memberTypeToRankType: { [key: MemberType]: LeaderboardType } = {
  _Entity: 'entity',
  _User: 'user',
};

export const getRankTypeByMemberType = (key: MemberType): LeaderboardType => {
  return memberTypeToRankType[key] || 'object';
};

export const leaderboardTypeToPlural = (key: LeaderboardType): LeaderboardTypePlural => {
  switch (key) {
    case 'user':
      return 'users';
    case 'object':
      return 'objects';
    case 'entity':
      return 'entities';
  }
};
