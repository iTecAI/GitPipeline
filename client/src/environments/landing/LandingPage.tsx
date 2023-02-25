import {
    Button,
    Center,
    Divider,
    Paper,
    PasswordInput,
    Stack,
    TextInput,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import Logo from "../../assets/logo.svg";
import "./style.scss";
import {
    MdAlternateEmail,
    MdCheckCircle,
    MdLogin,
    MdPassword,
    MdPersonAdd,
} from "react-icons/md";
import { IoLogoGithub } from "react-icons/io";
import { useForm } from "@mantine/form";
import { validateEmail } from "../../utils/validators";
import { closeAllModals, openModal } from "@mantine/modals";
import { get, post } from "../../utils/api";
import { LoginResponse } from "../../types/user";
import { useLogin } from "../../utils/providers/LoginState";
import { showNotification } from "@mantine/notifications";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CreateAccountModal() {
    const { t } = useTranslation();
    const form = useForm({
        initialValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        validate: {
            email: (value) =>
                validateEmail(value)
                    ? null
                    : t("pages.login.create_account.email.error"),
            password: (value, values) =>
                value !== values.confirmPassword
                    ? t("pages.login.create_account.password.error")
                    : null,
            confirmPassword: (value, values) =>
                value !== values.password
                    ? t("pages.login.create_account.password.error")
                    : null,
        },
    });
    const [_, auth] = useLogin();

    return (
        <form
            className="create-account-form"
            onSubmit={form.onSubmit((value) => {
                post<LoginResponse>("/users/create", {
                    data: { email: value.email, password: value.password },
                    notify: true,
                }).then((result) => {
                    if (result.success) {
                        auth(result.data.session, result.data.user);
                        showNotification({
                            color: "teal",
                            icon: <MdCheckCircle />,
                            title: t("pages.login.create_account.success"),
                            message: t("generic.redirecting"),
                        });
                    }
                });
                closeAllModals();
            })}
        >
            <Stack spacing={8}>
                <TextInput
                    label={t("pages.login.create_account.email.label")}
                    icon={<MdAlternateEmail />}
                    placeholder={
                        t("pages.login.create_account.email.placeholder") ?? ""
                    }
                    withAsterisk
                    {...form.getInputProps("email")}
                />
                <PasswordInput
                    label={t("pages.login.create_account.password.label")}
                    icon={<MdPassword />}
                    withAsterisk
                    {...form.getInputProps("password")}
                />
                <PasswordInput
                    label={t(
                        "pages.login.create_account.password.confirmLabel"
                    )}
                    icon={<MdPassword />}
                    withAsterisk
                    {...form.getInputProps("confirmPassword")}
                />
                <Button type="submit">
                    {t("pages.login.create_account.submit")}
                </Button>
                <Divider
                    label={(t("generic.or") ?? "OR").toUpperCase()}
                    labelPosition="center"
                />
                <Button
                    color="dark"
                    leftIcon={<IoLogoGithub size={20} />}
                    onClick={() =>
                        get<string>("/gh/flow/1/login").then((result) => {
                            if (result.success) {
                                window.open(result.data, "_self");
                            }
                        })
                    }
                >
                    {t("pages.login.github_signin")}
                </Button>
            </Stack>
        </form>
    );
}

function LoginModal() {
    const { t } = useTranslation();
    const form = useForm({
        initialValues: {
            email: "",
            password: "",
        },
        validate: {
            email: (value) =>
                validateEmail(value)
                    ? null
                    : t("pages.login.login.email.error"),
        },
    });
    const [_, auth] = useLogin();

    return (
        <form
            className="login-form"
            onSubmit={form.onSubmit((value) => {
                post<LoginResponse>("/users/login", {
                    data: { email: value.email, password: value.password },
                    notify: true,
                }).then((result) => {
                    if (result.success) {
                        auth(result.data.session, result.data.user);
                        showNotification({
                            color: "teal",
                            icon: <MdCheckCircle />,
                            title: t("pages.login.login.success"),
                            message: t("generic.redirecting"),
                        });
                    }
                });
                closeAllModals();
            })}
        >
            <Stack spacing={8}>
                <TextInput
                    label={t("pages.login.login.email.label")}
                    icon={<MdAlternateEmail />}
                    placeholder={t("pages.login.login.email.placeholder") ?? ""}
                    withAsterisk
                    {...form.getInputProps("email")}
                />
                <PasswordInput
                    label={t("pages.login.login.password.label")}
                    icon={<MdPassword />}
                    withAsterisk
                    {...form.getInputProps("password")}
                />
                <Button type="submit">{t("pages.login.login.submit")}</Button>
                <Divider
                    label={(t("generic.or") ?? "OR").toUpperCase()}
                    labelPosition="center"
                />
                <Button
                    color="dark"
                    leftIcon={<IoLogoGithub size={20} />}
                    onClick={() =>
                        get<string>("/gh/flow/1/login").then((result) => {
                            if (result.success) {
                                window.open(result.data, "_self");
                            }
                        })
                    }
                >
                    {t("pages.login.github_signin")}
                </Button>
            </Stack>
        </form>
    );
}

export function LandingPage() {
    const { t } = useTranslation();
    const [login] = useLogin();
    const nav = useNavigate();

    useEffect(() => {
        if (login.loggedIn) {
            nav("/");
        }
    }, [login]);

    return (
        <Paper p="sm" shadow="sm" className="landing-main">
            <Center>
                <img
                    src={Logo}
                    className="logo"
                    alt={t("pages.login.logo_alt") ?? ""}
                />
            </Center>
            <Stack spacing={8} className="controls">
                <Button
                    variant="filled"
                    leftIcon={<MdLogin size={20} />}
                    onClick={() =>
                        openModal({
                            title: t("pages.login.login.button"),
                            children: <LoginModal />,
                        })
                    }
                >
                    {t("pages.login.login.button")}
                </Button>
                <Button
                    variant="light"
                    leftIcon={<MdPersonAdd size={20} />}
                    onClick={() =>
                        openModal({
                            title: t("pages.login.create_account.button"),
                            children: <CreateAccountModal />,
                        })
                    }
                >
                    {t("pages.login.create_account.button")}
                </Button>
            </Stack>
        </Paper>
    );
}
