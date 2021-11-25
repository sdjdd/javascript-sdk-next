import type { App, AuthOptions } from '../../core';
import { getRankTypeByMemberType, leaderboardTypeToPlural } from './utils';

type ManageAuthOptions = Omit<AuthOptions, 'useMasterKey'>;
interface PageParams {
  limit?: number;
  skip?: number;
}

interface CountParams {
  count: 1;
}

type CountedParams<T> = T & Partial<CountParams>;

type CountedResult<T, K> = T extends CountParams
  ? { count: number; results: K[] }
  : { results: K[] };

export type LeaderboardOrder = 'descending' | 'ascending';
export type UpdateStrategy = 'better' | 'last' | 'sum';
export type VersionChangeInterval = 'day' | 'week' | 'month' | 'never';
export type MemberType = '_Entity' | '_User' | string;
export type Order = 'ascending' | 'descending';
export type LeaderboardType = 'user' | 'object' | 'entity';
export type LeaderboardTypePlural = 'users' | 'objects' | 'entities';

export interface LeaderboardInfo {
  objectId: string;
  statisticName: string;
  memberType: MemberType;
  versionChangeInterval: VersionChangeInterval;
  order: Order;
  updateStrategy: UpdateStrategy;
  version: number;
  createdAt: string;
  updatedAt: string;
  expiredAt: Date;
  activatedAt: Date;
}

interface UserResult {
  user: Record<string, any>;
}
interface ObjectResult {
  object: Record<string, any>;
}

interface EntityResult {
  entity: string;
}
interface Archive {
  objectId: string;
  statisticName: string;
  version: number;
  status: 'scheduled' | 'inProgress' | 'failed' | 'completed';
  url: string;
  file_key: string;
  activatedAt: Date;
  deactivatedAt: Date;
  createdAt: string;
  updatedAt: string;
}

interface CreateLeaderboardProps {
  statisticName: string;
  memberType: MemberType;
  order?: LeaderboardOrder;
  updateStrategy?: UpdateStrategy;
  versionChangeInterval?: VersionChangeInterval;
}
interface GetResultsProps extends PageParams {
  statisticName: string;
  type: LeaderboardType;
  selectKeys?: string[];
  includeKeys?: string[];
  includeStatistics?: string[];
  version?: number;
  around?: string;
}
interface Rank extends Statistic {
  rank: number;
  statistics?: (Statistic & { rank: number })[];
}

type UpdateLeaderBoardProps =
  | Pick<LeaderboardInfo, 'updateStrategy'>
  | Pick<LeaderboardInfo, 'versionChangeInterval'>
  | Pick<LeaderboardInfo, 'updateStrategy' | 'versionChangeInterval'>;

interface GetArchivesProps extends PageParams {
  statisticName: string;
}

interface Statistic {
  statisticName: string;
  statisticValue: number;
}

type Statistics = Record<string, number>;
type UserType = { type: 'user'; objectId: string };
type ObjectType = { type: 'object'; objectId: string };
type entityType = { type: 'entity'; entity: string };
type StatisticsParams = UserType | ObjectType | entityType;

interface StatisticResult extends Statistic {
  version: number;
}

export class LeaderboardManager {
  constructor(protected readonly app: App) {}

  private manageRequest(...params: Parameters<App['request']>) {
    const [request, options] = params;
    return this.app.request(request, { ...options, useMasterKey: true });
  }

  private decode(data: any) {
    return this.app.database().decode(data);
  }

  private async getCurrentUser() {
    const app: any = this.app;
    if (typeof app.auth !== 'function') {
      throw new Error('Auth module is required');
    }
    const auth = app.auth();
    const user = await auth.getCurrentUserAsync();
    if (!user) {
      throw new Error('Please log in.');
    }
    return user;
  }

  async createLeaderboard(props: CreateLeaderboardProps, options?: ManageAuthOptions) {
    const info = await this.manageRequest(
      {
        method: 'POST',
        path: `/1.1/leaderboard/leaderboards`,
        body: props,
      },
      options
    );
    return new Leaderboard(this.app, this.decode(info));
  }

  async getLeaderboard(statisticName: string, options?: ManageAuthOptions) {
    const info = await this.getLeaderboardAttributes(statisticName, options);
    return new Leaderboard(this.app, info);
  }

  async getLeaderboardAttributes(
    statisticName: string,
    options?: ManageAuthOptions
  ): Promise<LeaderboardInfo> {
    return this.manageRequest(
      {
        method: 'GET',
        path: `/1.1/leaderboard/leaderboards/${statisticName}`,
      },
      options
    ).then((res) => {
      return this.decode(res);
    });
  }

  async updateLeaderBoard(
    statisticName: string,
    data: UpdateLeaderBoardProps,
    options?: ManageAuthOptions
  ) {
    return this.manageRequest(
      {
        method: 'PUT',
        path: `/1.1/leaderboard/leaderboards/${statisticName}`,
        body: data,
      },
      options
    );
  }

  async resetLeaderboard(statisticName: string, options?: ManageAuthOptions) {
    return this.manageRequest(
      {
        method: 'PUT',
        path: `/1.1/leaderboard/leaderboards/${statisticName}/incrementVersion`,
      },
      options
    );
  }

  async getLeaderboardArchives<T extends CountedParams<GetArchivesProps>>(
    props: T,
    options?: ManageAuthOptions
  ): Promise<CountedResult<T, Archive>> {
    const { statisticName, count, skip, limit } = props;
    return this.manageRequest(
      {
        method: 'GET',
        path: `/1.1/leaderboard/leaderboards/${statisticName}/archives`,
        query: { count, skip, limit },
      },
      options
    ).then((res) => {
      res.results = res.results.map((item) => this.decode(item));
      return res;
    });
  }

  async destroyLeaderboard(statisticName: string, options?: ManageAuthOptions) {
    return this.manageRequest(
      {
        method: 'DELETE',
        path: `/1.1/leaderboard/leaderboards/${statisticName}`,
      },
      options
    );
  }

  async getLeaderboardResults<T extends CountedParams<GetResultsProps & { type: 'user' }>>(
    props: T,
    options?: AuthOptions
  ): Promise<CountedResult<T, Rank & UserResult>>;
  async getLeaderboardResults<T extends CountedParams<GetResultsProps & { type: 'object' }>>(
    props: T,
    options?: AuthOptions
  ): Promise<CountedResult<T, Rank & ObjectResult>>;
  async getLeaderboardResults<T extends CountedParams<GetResultsProps & { type: 'entity' }>>(
    props: T,
    options?: AuthOptions
  ): Promise<CountedResult<T, Rank & EntityResult>>;
  async getLeaderboardResults<T extends CountedParams<GetResultsProps>>(
    props: T,
    options?: AuthOptions
  ) {
    const {
      statisticName,
      type,
      around,
      selectKeys,
      includeKeys,
      includeStatistics,
      skip: startPosition,
      limit: maxResultsCount,
      version,
      count,
    } = props;

    return this.app.request(
      {
        method: 'GET',
        path: `/1.1/leaderboard/leaderboards/${type}/${statisticName}/ranks${
          around ? `/${around}` : ''
        }`,
        query: {
          count,
          version,
          startPosition,
          maxResultsCount,
          selectKeys: selectKeys && selectKeys.join(','),
          includeKeys: includeKeys && includeKeys.join(','),
          includeStatistics: includeStatistics && includeStatistics.join(','),
        },
      },
      options
    );
  }
  async getStatistics(
    props: UserType & { statisticNames?: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & UserResult)[] }>;
  async getStatistics(
    props: ObjectType & { statisticNames?: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & ObjectResult)[] }>;
  async getStatistics(
    props: entityType & { statisticNames?: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & EntityResult)[] }>;
  async getStatistics(
    props: StatisticsParams & { statisticNames?: string[] },
    options?: AuthOptions
  ) {
    const { type, statisticNames } = props;
    const name = type === 'entity' ? props.entity : props.objectId;
    return this.app.request(
      {
        method: 'GET',
        path: `/1.1/leaderboard/${leaderboardTypeToPlural(type)}/${name}/statistics`,
        query: { statistics: statisticNames && statisticNames.join(',') },
      },
      options
    );
  }

  async getStatisticsByMembers(
    props: { statisticName: string; type: 'user'; members: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & UserResult)[] }>;
  async getStatisticsByMembers(
    props: { statisticName: string; type: 'object'; members: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & ObjectResult)[] }>;
  async getStatisticsByMembers(
    props: { statisticName: string; type: 'entity'; members: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & EntityResult)[] }>;
  async getStatisticsByMembers(
    props: { statisticName: string; type: LeaderboardType; members: string[] },
    options?: AuthOptions
  ): Promise<{ results: StatisticResult[] }> {
    const { statisticName, type, members } = props;
    if (!members || !members.length) {
      throw new Error('Miss members');
    }
    return this.manageRequest(
      {
        method: 'POST',
        path: `/1.1/leaderboard/${leaderboardTypeToPlural(type)}/statistics/${statisticName}`,
        body: members,
      },
      options
    );
  }

  async deleteStatistics(
    props: StatisticsParams & { statisticNames: string[] },
    options?: ManageAuthOptions
  ) {
    const { type, statisticNames } = props;
    const path = type === 'entity' ? props.entity : props.objectId;
    return this.manageRequest(
      {
        method: 'DELETE',
        path: `/1.1/leaderboard/${leaderboardTypeToPlural(type)}/${path}/statistics`,
        query: { statistics: statisticNames && statisticNames.join(',') },
      },
      options
    );
  }

  async updateStatistics(
    props: StatisticsParams & { statistics: Statistics; overwrite?: 1 },
    options?: ManageAuthOptions
  ): Promise<{ results: StatisticResult[] }> {
    const { type, statistics, overwrite } = props;
    const path = type === 'entity' ? props.entity : props.objectId;
    const body: Statistic[] = Object.entries(statistics).map(([statisticName, statisticValue]) => ({
      statisticName,
      statisticValue,
    }));

    return this.manageRequest(
      {
        method: 'POST',
        path: `/1.1/leaderboard/${leaderboardTypeToPlural(type)}/${path}/statistics`,
        body,
        query: { overwrite },
      },
      options
    );
  }

  async getCurrentUserStatistics(statisticNames?: string[], options?: AuthOptions) {
    const user = await this.getCurrentUser();
    return this.getStatistics(
      { type: 'user', objectId: user.id, statisticNames },
      { ...options, sessionToken: user.sessionToken }
    );
  }

  async deleteCurrentUserStatistics(statisticNames: string[], option?: AuthOptions) {
    const user = await this.getCurrentUser();
    return this.app
      .request(
        {
          method: 'DELETE',
          path: `/1.1/leaderboard/users/self/statistics`,
          query: { statistics: statisticNames.join(',') },
        },
        { ...option, sessionToken: user.sessionToken }
      )
      .then((res) => res as { results: StatisticResult[] });
  }

  async updateCurrentUserStatistics(
    statistics: Statistics,
    option?: AuthOptions
  ): Promise<{ results: StatisticResult[] }> {
    const user = await this.getCurrentUser();
    const body: Statistic[] = Object.entries(statistics).map(([statisticName, statisticValue]) => ({
      statisticName,
      statisticValue,
    }));
    return this.app.request(
      { method: 'POST', path: `/1.1/leaderboard/users/self/statistics`, body },
      { ...option, sessionToken: user.sessionToken }
    );
  }
}

export class Leaderboard extends LeaderboardManager implements Partial<LeaderboardInfo> {
  statisticName: string;
  objectId?: string;
  order?: LeaderboardOrder;
  updateStrategy?: UpdateStrategy;
  versionChangeInterval?: VersionChangeInterval;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  expiredAt?: Date;
  activatedAt?: Date;
  memberType?: MemberType;

  constructor(app: App, info?: Partial<LeaderboardInfo> & Pick<LeaderboardInfo, 'statisticName'>) {
    super(app);
    if (!info?.statisticName) {
      throw new Error('statisticName is required');
    }
    info && this.setInfo(info);
  }

  private setInfo(info: Partial<LeaderboardInfo>) {
    Object.entries(info).forEach(([key, value]) => {
      this[key] = value;
    });
  }

  async getAttributes(options?: ManageAuthOptions) {
    const info = await super.getLeaderboardAttributes(this.statisticName, options);
    this.setInfo(info);
    return info;
  }

  async create(props: Omit<CreateLeaderboardProps, 'statisticName'>, options?: ManageAuthOptions) {
    return super.createLeaderboard({ ...props, statisticName: this.statisticName }, options);
  }

  async reset(options?: ManageAuthOptions) {
    await super.resetLeaderboard(this.statisticName, options);
    return this;
  }

  async update(updateLeaderBoardData: UpdateLeaderBoardProps, options?: ManageAuthOptions) {
    const info = await super.updateLeaderBoard(this.statisticName, updateLeaderBoardData, options);
    this.setInfo(info);
    return this;
  }

  async getArchives<T extends CountedParams<Omit<GetArchivesProps, 'statisticName'>>>(
    props: T = {} as T,
    options?: ManageAuthOptions
  ) {
    return super.getLeaderboardArchives({ ...props, statisticName: this.statisticName }, options);
  }

  async destroy(options?: ManageAuthOptions) {
    return super.destroyLeaderboard(this.statisticName, options);
  }

  async getResults<T extends CountedParams<Omit<GetResultsProps, 'statisticName' | 'type'>>>(
    props: T = {} as T,
    options?: AuthOptions
  ) {
    if (!this.memberType) {
      await this.getAttributes();
    }
    if (!this.memberType) {
      throw new Error(`${this.statisticName} 未定义 memberType`);
    }
    const type = getRankTypeByMemberType(this.memberType) as any;
    return super.getLeaderboardResults(
      { ...props, statisticName: this.statisticName, type },
      options
    );
  }
}
