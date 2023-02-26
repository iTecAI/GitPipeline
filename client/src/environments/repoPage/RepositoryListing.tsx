import { Group, Paper, Stack, Text } from "@mantine/core";
import numeral from "numeral";
import { useEffect, useState } from "react";
import { IoMdDocument } from "react-icons/io";
import { MdFolder } from "react-icons/md";
import { RepositoryScan, ScanFile } from "../../types/githubAccounts";

function FileItem(props: ScanFile): JSX.Element {
    return (
        <Paper withBorder p="sm" className="file-item">
            <Group spacing={8}>
                <IoMdDocument />
                <Text className="file-name">{props.name}</Text>
            </Group>
            <Text className="file-size" color="dimmed">{numeral(props.size).format("0.0 b")}</Text>
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
        for (const f of props.files.filter(
            (v) => v.directory.split("/").slice(0, -1).join("/") === displaying
        )) {
            if (!newFolders.includes(f.directory)) {
                newFolders.push(f.directory);
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
                <FolderItem path={v} setPath={setDisplaying} key={v} />
            ))}
            {files.map((v) => (
                <FileItem {...v} key={v.name} />
            ))}
        </Stack>
    );
}
