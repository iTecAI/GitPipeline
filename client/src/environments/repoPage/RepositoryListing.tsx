import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import numeral from "numeral";
import { useEffect, useState } from "react";
import { IoLogoGithub, IoMdDocument } from "react-icons/io";
import { FaDocker } from "react-icons/fa";
import { MdFolder } from "react-icons/md";
import { RepositoryScan, ScanFile } from "../../types/githubAccounts";
import { ReactComponent as GitPipeline } from "../../assets/logo.svg";

function FileItem(props: ScanFile): JSX.Element {
    return (
        <Paper withBorder p="sm" className="file-item">
            <Group spacing={8}>
                <IoMdDocument />
                <Text className="file-name">{props.name}</Text>
                {props.parseable && (
                    <Badge
                        color="teal"
                        className="file-parse"
                        leftSection={
                            {
                                docker: <FaDocker />,
                                actions: <IoLogoGithub />,
                                pipeline: <GitPipeline />,
                            }[props.parseable] ?? undefined
                        }
                    >
                        {props.parseable}
                    </Badge>
                )}
            </Group>
            <Text className="file-size" color="dimmed">
                {numeral(props.size).format("0.0 b")}
            </Text>
        </Paper>
    );
}

function FolderItem(props: {
    path: string;
    setPath: (path: string) => void;
}): JSX.Element {
    return (
        <Paper
            withBorder
            p="sm"
            className="file-item folder"
            onClick={() => props.setPath(props.path)}
        >
            <Group spacing={8}>
                <MdFolder />
                <Text className="file-name">
                    {props.path.split("/").slice(-1)[0]}
                </Text>
            </Group>
        </Paper>
    );
}

export function RepositoryListing(props: RepositoryScan): JSX.Element {
    const [displaying, setDisplaying] = useState<string>(".");
    const [folders, setFolders] = useState<string[]>([]);
    const [files, setFiles] = useState<ScanFile[]>([]);
    useEffect(() => {
        const newFolders: string[] = [];
        const added: string[] = [];
        for (const f of props.files) {
            if (
                f.directory !== displaying &&
                f.directory.length > displaying.length &&
                f.directory.split(displaying + "/", 2).length > 1 &&
                !added.includes(
                    f.directory.split(displaying + "/", 2)[1].split("/")[0]
                )
            ) {
                newFolders.push(
                    f.directory.split(displaying + "/", 2)[1].split("/")[0]
                );
                added.push(
                    f.directory.split(displaying + "/", 2)[1].split("/")[0]
                );
            }
        }
        setFolders(newFolders);
        setFiles(props.files.filter((v) => v.directory === displaying));
    }, [displaying]);

    return (
        <Stack className="repo-listing" spacing={8}>
            {displaying !== "." && (
                <Paper
                    withBorder
                    p="sm"
                    className="file-item folder"
                    onClick={() =>
                        setDisplaying(
                            displaying.split("/").slice(0, -1).join("/")
                        )
                    }
                >
                    <Group spacing={8}>
                        <MdFolder />
                        <Text className="file-name">..</Text>
                    </Group>
                </Paper>
            )}
            {folders.map((v) => (
                <FolderItem path={v} setPath={(path) => setDisplaying(`${displaying}/${path}`)} key={v} />
            ))}
            {files.map((v) => (
                <FileItem {...v} key={v.name} />
            ))}
        </Stack>
    );
}
