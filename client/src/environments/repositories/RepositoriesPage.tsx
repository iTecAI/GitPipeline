import {
    Box,
    Loader,
    Paper,
    Stack,
    TextInput,
    Pagination as UIPagination,
    Text,
    Group,
    Badge,
    useMantineTheme,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdRemoveRedEye, MdSearch, MdStar } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import { Pagination } from "../../types/generic";
import { GithubRepository } from "../../types/githubAccounts";
import "./style.scss";
import gh_colors from "../../resources/gh_colors.json";
import numeral from "numeral";
import {GoRepoForked} from "react-icons/go";

function RepositoryItem(props: GithubRepository) {
    const theme = useMantineTheme();
    return (
        <Paper className="repo-item" p="xs">
            <Stack spacing={4}>
                <Text className="repo-name" size="md">
                    {props.name}
                </Text>
                <Group spacing={4}>
                    <Badge
                        className="tag visibility"
                        color={
                            props.visibility === "public" ? "green" : "yellow"
                        }
                        size="sm"
                    >
                        {props.visibility}
                    </Badge>
                    {props.language && (
                        <Badge
                            className="tag language"
                            size="sm"
                            style={
                                gh_colors[
                                    props.language as keyof typeof gh_colors
                                ] &&
                                gh_colors[
                                    props.language as keyof typeof gh_colors
                                ].color
                                    ? {
                                          backgroundColor:
                                              gh_colors[
                                                  props.language as keyof typeof gh_colors
                                              ].color + "33",
                                          color: theme.fn.lighten(
                                              gh_colors[
                                                  props.language as keyof typeof gh_colors
                                              ].color as string,
                                              0.75
                                          ),
                                      }
                                    : undefined
                            }
                        >
                            {props.language}
                        </Badge>
                    )}
                </Group>
            </Stack>
            <Group spacing={8} className="stats">
                <Paper className="stars stat">
                    <MdStar />
                    <Text color="dimmed">
                        {numeral(props.stars).format("0a")}
                    </Text>
                </Paper>
                <Paper className="forks stat">
                    <GoRepoForked />
                    <Text color="dimmed">
                        {numeral(props.forks).format("0a")}
                    </Text>
                </Paper>
                <Paper className="watchers stat">
                    <MdRemoveRedEye />
                    <Text color="dimmed">
                        {numeral(props.watchers).format("0a")}
                    </Text>
                </Paper>
            </Group>
        </Paper>
    );
}

export function RepositoriesPage() {
    const { gh_account } = useParams() as { gh_account: string };
    const nav = useNavigate();
    const [repos, setRepos] = useState<GithubRepository[]>([]);
    const [page, setPage] = useState<number>(1);
    const [paginator, setPaginator] =
        useState<Pagination<GithubRepository> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const { t } = useTranslation();

    useMemo(
        () =>
            Pagination.paginate<GithubRepository>(
                `/gh/${gh_account}/repositories`
            ).then((value) => {
                setPaginator(value);
                setRepos(value.content);
                setPage(1);
            }),
        [gh_account]
    );

    useEffect(() => {
        if (!gh_account) {
            nav("/");
        }
    }, [gh_account]);

    return paginator ? (
        <Box className="repo-box">
            <Stack spacing={16}>
                <TextInput
                    label={t("pages.repos.search")}
                    placeholder={t("pages.repos.search_placeholder") ?? ""}
                    icon={<MdSearch />}
                />
                <Paper withBorder className="repo-list" p="sm">
                    {loading ? (
                        <Loader size="xl" className="repo-load" />
                    ) : (
                        <Stack spacing={4}>
                            {repos.map((v, i) => (
                                <RepositoryItem {...v} key={i} />
                            ))}
                        </Stack>
                    )}
                </Paper>
                <UIPagination
                    className="pagination"
                    total={paginator.pages}
                    page={page}
                    onChange={(newPage) => {
                        if (!paginator.isCached(newPage - 1)) {
                            setLoading(true);
                        } else {
                            setRepos(paginator.getCache(newPage - 1));
                        }
                        paginator.toPage(newPage - 1).then((result) => {
                            setLoading(false);
                            if (page - 1 === paginator.currentPage) {
                                setRepos(result);
                            }
                        });
                        setPage(newPage);
                    }}
                />
            </Stack>
        </Box>
    ) : (
        <Loader size="xl" className="repo-load" />
    );
}
