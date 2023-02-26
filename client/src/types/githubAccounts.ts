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
    language: string | null;
    visibility: string;
    default_branch: string;
};

export type ScanFile = {
    directory: string;
    name: string;
    size: string;
    parseable: string | null;
};

export type RepositoryScan = {
    id: string;
    timestamp: number;
    files: ScanFile[];
    user: string;
    repository: number;
    branch: string;
};
