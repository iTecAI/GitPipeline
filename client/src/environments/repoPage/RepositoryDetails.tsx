import {
    Badge,
    Box,
    Button,
    Divider,
    Group,
    Loader,
    Select,
    Stack,
    Title,
    useMantineTheme,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GithubRepository, RepositoryScan } from "../../types/githubAccounts";
import { get, post } from "../../utils/api";
import gh_colors from "../../resources/gh_colors.json";
import "./style.scss";
import { MdDocumentScanner, MdRemoveRedEye, MdStar } from "react-icons/md";
import numeral from "numeral";
import { GoRepoForked } from "react-icons/go";
import { IoMdGitBranch } from "react-icons/io";
import { useTranslation } from "react-i18next";

export function RepositoryDetailsPage() {
    const { gh_account, repository } = useParams() as {
        gh_account: string;
        repository: string;
    };
    const theme = useMantineTheme();

    const [repo, setRepo] = useState<GithubRepository | null>(null);
    const [branches, setBranches] = useState<string[]>([]);
    const [branch, setBranch] = useState<string | null>(null);
    const [scan, setScan] = useState<RepositoryScan | null>(null);

    const { t } = useTranslation();

    useEffect(() => {
        get<GithubRepository>(
            `/gh/${gh_account}/repositories/${repository}`
        ).then((value) => {
            if (value.success) {
                setRepo(value.data);
            }
        });
    }, [gh_account, repository]);

    useEffect(() => {
        if (repo) {
            get<string[]>(
                `/gh/${gh_account}/repositories/${repository}/branches/`
            ).then((value) => {
                if (value.success) {
                    setBranches(value.data);
                    setBranch(repo.default_branch);
                }
            });
        }
    }, [repo]);

    useEffect(() => {
        get<RepositoryScan | false>(
            `/gh/${gh_account}/repositories/${repository}/scan`,
            { query: { branch } }
        ).then((result) => {
            if (result.success) {
                setScan(result.data || null);
            }
        });
    }, [repo, branch]);

    return repo ? (
        <Box className="repo-area">
            <Stack spacing={8}>
                <Stack spacing={8}>
                    <Group spacing={16}>
                        <Title order={2} className="repo-name">
                            {repo.name}
                        </Title>
                        <Select
                            size="xs"
                            icon={
                                branch ? (
                                    <IoMdGitBranch />
                                ) : (
                                    <Loader size="xs" />
                                )
                            }
                            value={branch}
                            onChange={setBranch}
                            data={branches.map((v) => {
                                return { value: v, label: v };
                            })}
                        />
                        <Button
                            disabled={!branch}
                            leftIcon={<MdDocumentScanner />}
                            size="xs"
                            color="green"
                            variant="outline"
                            onClick={() =>
                                post<RepositoryScan>(
                                    `/gh/${gh_account}/repositories/${repository}/scan`,
                                    { query: { branch } }
                                ).then((result) => {
                                    if (result.success) {
                                        setScan(result.data);
                                    }
                                })
                            }
                        >
                            {t("pages.repo_details.scan_button")}
                        </Button>
                    </Group>
                    <Group spacing={8}>
                        <Badge
                            className="tag visibility"
                            color={
                                repo.visibility === "public"
                                    ? "green"
                                    : "yellow"
                            }
                        >
                            {repo.visibility}
                        </Badge>
                        {repo.language && (
                            <Badge
                                className="tag language"
                                style={
                                    gh_colors[
                                        repo.language as keyof typeof gh_colors
                                    ] &&
                                    gh_colors[
                                        repo.language as keyof typeof gh_colors
                                    ].color
                                        ? {
                                              backgroundColor:
                                                  gh_colors[
                                                      repo.language as keyof typeof gh_colors
                                                  ].color + "33",
                                              color: theme.fn.lighten(
                                                  gh_colors[
                                                      repo.language as keyof typeof gh_colors
                                                  ].color as string,
                                                  0.75
                                              ),
                                          }
                                        : undefined
                                }
                            >
                                {repo.language}
                            </Badge>
                        )}
                        <Badge
                            leftSection={<MdStar size={14} />}
                            className="tag stars"
                        >
                            {numeral(repo.stars).format("0a")}
                        </Badge>
                        <Badge
                            leftSection={<GoRepoForked size={14} />}
                            className="tag forks"
                        >
                            {numeral(repo.forks).format("0a")}
                        </Badge>
                        <Badge
                            leftSection={<MdRemoveRedEye size={14} />}
                            className="tag watchers"
                        >
                            {numeral(repo.watchers).format("0a")}
                        </Badge>
                        <Badge
                            leftSection={<MdDocumentScanner size={14} />}
                            className="tag scanned"
                            color={scan ? "green" : "red"}
                        >
                            <>
                                {t("pages.repo_details.scanned")} :{" "}
                                {scan
                                    ? new Date(scan.timestamp * 1000)
                                          .toDateString()
                                    : t("generic.never")}
                            </>
                        </Badge>
                    </Group>
                </Stack>
                <Divider />
            </Stack>
        </Box>
    ) : (
        <Loader size="xl" className="repo-load" />
    );
}
