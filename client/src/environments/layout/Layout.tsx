import {
    AppShell,
    Avatar,
    Button,
    Header,
    Navbar,
    Title,
    Text,
    Stack,
    Paper,
    Box,
    Group,
    UnstyledButton,
    useMantineTheme,
    Loader,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoLogoGithub } from "react-icons/io";
import { MdLogout, MdStar } from "react-icons/md";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import Logo from "../../assets/logo512.png";
import { GithubAccount } from "../../types/githubAccounts";
import { del, get } from "../../utils/api";
import { useLogin } from "../../utils/providers/LoginState";
import "./layout.scss";

function GHAccountCard(props: {account: GithubAccount}): JSX.Element {
    const [repos, setRepos] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const nav = useNavigate();
    const {gh_account} = useParams();
    useEffect(() => {
        get<number>(`/gh/${props.account.username}/repositories/count`).then((result) => {
            if (result.success) {
                setRepos(result.data);
                setLoading(false);
            }
        });
    }, [props.account]);

    return (
        <Paper
            className={`github-account-card${
                props.account.active ? " active" : " inactive"
            }${gh_account === props.account.username ? " selected" : ""}`}
            shadow="xs"
            p="md"
            withBorder
            onClick={() => nav(`/repositories/${props.account.username}`)}
        >
            {loading ? <Loader className="img" /> : <Avatar src={props.account.avatar} className="img" radius="xl" />}
            <Text fz="lg" className="username">
                {props.account.username}
            </Text>
            <Text color="dimmed" size="xs" className="repos">
                {repos} Repositories
            </Text>
        </Paper>
    );
}

function UserBox() {
    const theme = useMantineTheme();
    const [login] = useLogin();

  return (
      <Box
          sx={{
              paddingTop: theme.spacing.sm,
              borderTop: `1px solid ${
                  theme.colorScheme === "dark"
                      ? theme.colors.dark[4]
                      : theme.colors.gray[2]
              }`,
          }}
          className="user-box"
      >
          <UnstyledButton
              sx={{
                  display: "block",
                  width: "100%",
                  padding: theme.spacing.xs,
                  borderRadius: theme.radius.sm,
                  color:
                      theme.colorScheme === "dark"
                          ? theme.colors.dark[0]
                          : theme.black,

                  "&:hover": {
                      backgroundColor:
                          theme.colorScheme === "dark"
                              ? theme.colors.dark[6]
                              : theme.colors.gray[0],
                  },
              }}
          >
              <Group>
                  {login.loggedIn && login.avatar ? (
                      <Avatar src={login.avatar} radius="xl" />
                  ) : (
                      <Avatar radius="xl" />
                  )}
                  <Avatar className="user-type" radius="xl" size="xs" variant="filled">
                      {login.loggedIn && login.type === "github" ? (
                          <IoLogoGithub size={18} />
                      ) : (
                          <MdStar size={18} />
                      )}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                      <Text size="sm" weight={500}>
                          {login.loggedIn ? login.username : "User"}
                      </Text>
                  </Box>
              </Group>
          </UnstyledButton>
      </Box>
  );
}


export function LayoutEnv() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const [login, auth] = useLogin();

    useEffect(() => {
        if (!login.loggedIn && !window.localStorage.getItem("token")) {
            nav("/login");
        }
    }, [login]);

    return (
        <AppShell
            padding={"md"}
            className="layout-shell"
            header={
                <Header height={48} p="xs" className="app-header">
                    <Avatar size="lg" src={Logo} className="logo" />
                    <Title order={3} className="app-name">
                        {t("app")}
                    </Title>
                    {login.loggedIn && (
                        <Button
                            variant="light"
                            leftIcon={<MdLogout />}
                            className="logout-btn"
                            onClick={() =>
                                del<null>("/users").then((result) => {
                                    if (result.success) {
                                        auth();
                                    }
                                })
                            }
                        >
                            {t("layout.logout")}
                        </Button>
                    )}
                </Header>
            }
            navbar={
                login.loggedIn ? (
                    <Navbar p="xs" className="sidenav">
                        <Navbar.Section className="gh-account-section">
                            <Stack spacing={8}>
                                {login.accounts.map((account) => (
                                    <GHAccountCard
                                        account={account}
                                        key={account.username}
                                    />
                                ))}
                            </Stack>
                        </Navbar.Section>
                        <Navbar.Section className="user-section">
                            <UserBox />
                        </Navbar.Section>
                    </Navbar>
                ) : undefined
            }
        >
            <Outlet />
        </AppShell>
    );
}
