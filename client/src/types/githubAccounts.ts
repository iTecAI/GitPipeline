export type GithubAccount = {
    active: boolean;
    username: string;
    avatar: string;
};

export type GithubRepository = {
    id: number;
    name: string;
    url: string;
    forks: number;
    stars: number;
    watchers: number;
};
