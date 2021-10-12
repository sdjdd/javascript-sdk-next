import type { App, AuthOptions } from '../../core';
import { User } from '../../auth/dist';
import { getRankTypeByMemberType, leaderboardTypeToPlural } from './utils';

type ManageAuthOptions = Omit<AuthOptions, 'useMasterKey'>;
interface PageParams {
  limit?: number;
  skip?: number;
  count?: number;
}

interface CountParams {
  count: 1;
}

type CountedParams<T> = T | (T & CountParams);

type CountedResult<T, K> = T extends CountParams
  ? { count: number; results: K[] }
  : { results: K[] };

type UrlQuery = string | string[];

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
interface GetResultsProps {
  statisticName: string;
  type: LeaderboardType;
  maxResultsCount?: number;
  startPosition?: number;
  selectKeys?: UrlQuery;
  includeKeys?: UrlQuery;
  includeStatistics?: UrlQuery;
  version?: number;
  objectId?: string;
}
interface Rank extends Statistic {
  rank: number;
  statistics?: (Statistic & { rank: number })[];
}

export type UpdateLeaderBoardData =
  | Pick<LeaderboardInfo, 'versionChangeInterval' | 'updateStrategy'>
  | Pick<LeaderboardInfo, 'updateStrategy'>
  | Pick<LeaderboardInfo, 'versionChangeInterval'>;

interface GetArchivesProps extends PageParams {
  statisticName: string;
}

interface Statistic {
  statisticName: string;
  statisticValue: number;
}

type StatisticsParams =
  | { type: Exclude<LeaderboardType, 'entity'>; objectId: string }
  | { type: 'entity'; entityString: string };

interface StatisticResult extends Statistic {
  version: number;
}

const encodeUrlQuery = (query?: UrlQuery): string | undefined => {
  if (!query || typeof query === 'undefined') {
    return undefined;
  }
  if (typeof query === 'string') {
    return query;
  }
  if (Array.isArray(query)) {
    return query.length ? query.join(',') : undefined;
  }
  throw new Error('参数格式错误');
};

export class LeaderboardManager {
  constructor(protected readonly app: App) {}

  private manageRequest(...params: Parameters<App['request']>) {
    const [request, options] = params;
    return this.app.request(request, { ...options, useMasterKey: true });
  }

  private decode(data: any) {
    return this.app.database().decode(data);
  }

  private getLoginUser() {
    const user = User.getCurrent(this.app, true);
    if (!user) {
      throw new Error('Please log in.');
    }
    return user;
  }

  async createLeaderboard(props: CreateLeaderboardProps, options?: ManageAuthOptions) {
    const info = (await this.manageRequest(
      {
        method: 'POST',
        path: `/1.1/leaderboard/leaderboards`,
        body: props,
      },
      options
    )) as LeaderboardInfo;
    return new Leaderboard(this.app, this.decode(info));
  }

  async getLeaderboard(statisticName: string, options?: ManageAuthOptions) {
    const info = await this.getLeaderboardInfo(statisticName, options);
    return new Leaderboard(this.app, info);
  }

  async getLeaderboardInfo(
    statisticName: string,
    options?: ManageAuthOptions
  ): Promise<LeaderboardInfo> {
    return this.manageRequest(
      {
        method: 'GET',
        path: `/1.1/leaderboard/leaderboards/${statisticName}`,
      },
      options
    ).then((res) => this.decode(res));
  }

  async updateLeaderBoard<T extends string, K extends UpdateLeaderBoardData>(
    statisticName: T,
    properties: K,
    options?: ManageAuthOptions
  ): Promise<K & Pick<LeaderboardInfo, 'objectId' | 'updatedAt'>> {
    const result = await this.manageRequest(
      {
        method: 'PUT',
        path: `/1.1/leaderboard/leaderboards/${statisticName}`,
        body: properties,
      },
      options
    );
    return result;
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
    const { statisticName, ...rest } = props;
    return this.manageRequest(
      {
        method: 'GET',
        path: `/1.1/leaderboard/leaderboards/${statisticName}/archives`,
        query: rest,
      },
      options
    );
  }

  async deleteLeaderboard(statisticName: string, options?: ManageAuthOptions) {
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
    const { statisticName, type, objectId, selectKeys, includeKeys, includeStatistics, ...rest } =
      props;

    return this.app.request(
      {
        method: 'GET',
        path: `/1.1/leaderboard/leaderboards/${type}/${statisticName}/ranks${
          objectId ? `/${objectId}` : ''
        }`,
        query: {
          ...rest,
          selectKeys: encodeUrlQuery(selectKeys),
          includeKeys: encodeUrlQuery(includeKeys),
          includeStatistics: encodeUrlQuery(includeStatistics),
        },
      },
      options
    );
  }
  async getStatistics(
    props: { type: 'user'; objectId: string } & { statisticNames?: UrlQuery },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & UserResult)[] }>;
  async getStatistics(
    props: { type: 'object'; objectId: string } & { statisticNames?: UrlQuery },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & ObjectResult)[] }>;
  async getStatistics(
    props: { type: 'entity'; entityString: string } & { statisticNames?: UrlQuery },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & EntityResult)[] }>;
  async getStatistics(
    props: StatisticsParams & { statisticNames?: UrlQuery },
    options?: AuthOptions
  ) {
    const { type, statisticNames } = props;
    const name = type === 'entity' ? props.entityString : props.objectId;
    return this.app.request(
      {
        method: 'GET',
        path: `/1.1/leaderboard/${leaderboardTypeToPlural(type)}/${name}/statistics`,
        query: { statistics: encodeUrlQuery(statisticNames) },
      },
      options
    );
  }

  async getUserStatistics(statisticNames?: UrlQuery, options?: AuthOptions) {
    const user = this.getLoginUser();
    return this.getStatistics(
      { type: 'user', objectId: user.id, statisticNames },
      { ...options, sessionToken: user.sessionToken }
    );
  }

  async getMultipleStatistics(
    props: { statisticName: string; type: 'user'; target: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & UserResult)[] }>;
  async getMultipleStatistics(
    props: { statisticName: string; type: 'object'; target: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & ObjectResult)[] }>;
  async getMultipleStatistics(
    props: { statisticName: string; type: 'entity'; target: string[] },
    options?: AuthOptions
  ): Promise<{ results: (StatisticResult & EntityResult)[] }>;
  async getMultipleStatistics(
    props: { statisticName: string; type: LeaderboardType; target: string[] },
    options?: AuthOptions
  ) {
    const { statisticName, type, target } = props;
    return this.manageRequest(
      {
        method: 'POST',
        path: `/1.1/leaderboard/${leaderboardTypeToPlural(type)}/statistics/${statisticName}`,
        body: target,
      },
      options
    );
  }

  async deleteStatistics(
    props: StatisticsParams & { statisticNames: UrlQuery },
    options?: ManageAuthOptions
  ) {
    const { type, statisticNames } = props;
    const path = type === 'entity' ? props.entityString : props.objectId;
    return this.manageRequest(
      {
        method: 'DELETE',
        path: `/1.1/leaderboard/${leaderboardTypeToPlural(type)}/${path}/statistics`,
        query: { statistics: encodeUrlQuery(statisticNames) },
      },
      options
    );
  }

  async deleteUserStatistics(statisticNames: UrlQuery, option?: AuthOptions) {
    const user = this.getLoginUser();
    return this.app
      .request(
        {
          method: 'DELETE',
          path: `/1.1/leaderboard/users/self/statistics`,
          query: { statistics: encodeUrlQuery(statisticNames) },
        },
        { ...option, sessionToken: user.sessionToken }
      )
      .then((res) => res as { results: StatisticResult[] });
  }

  async updateStatistics(
    props: StatisticsParams & { statistics: Statistic[]; overwrite?: 1 },
    options?: ManageAuthOptions
  ): Promise<{ results: StatisticResult[] }> {
    const { type, statistics, overwrite } = props;
    const path = type === 'entity' ? props.entityString : props.objectId;
    return this.manageRequest(
      {
        method: 'POST',
        path: `/1.1/leaderboard/${leaderboardTypeToPlural(type)}/${path}/statistics`,
        body: statistics,
        query: { overwrite },
      },
      options
    );
  }

  async updateUserStatistics(
    statistics: Statistic[],
    option?: AuthOptions
  ): Promise<{ results: StatisticResult[] }> {
    const user = this.getLoginUser();
    return this.app.request(
      { method: 'POST', path: `/1.1/leaderboard/users/self/statistics`, body: statistics },
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
  nextResetAt?: Date;
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

  async getInfo(options?: ManageAuthOptions) {
    const info = await super.getLeaderboardInfo(this.statisticName, options);
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

  async update(updateLeaderBoardData: UpdateLeaderBoardData, options?: ManageAuthOptions) {
    const info = await super.updateLeaderBoard(this.statisticName, updateLeaderBoardData, options);
    this.setInfo(info);
    return this;
  }

  async getArchives(props: Omit<GetArchivesProps, 'statisticName'>, options?: ManageAuthOptions) {
    return super.getLeaderboardArchives({ ...props, statisticName: this.statisticName }, options);
  }

  async delete(options?: ManageAuthOptions) {
    return super.deleteLeaderboard(this.statisticName, options);
  }

  async getResults<T extends CountedParams<Omit<GetResultsProps, 'statisticName' | 'type'>>>(
    props?: T
  ) {
    if (!this.memberType) {
      await this.getInfo();
    }
    if (!this.memberType) {
      throw new Error(`${this.statisticName} 未定义 memberType`);
    }
    const type = getRankTypeByMemberType(this.memberType) as any;
    return super.getLeaderboardResults({ ...props, statisticName: this.statisticName, type });
  }
}
