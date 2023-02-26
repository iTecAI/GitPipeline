from .base import BaseORM
from pymongo.database import Database
from typing import TypedDict, Union
from github.Repository import Repository
import tempfile
import zipfile
import requests
import os
import time

class ScanFile(TypedDict):
    directory: str
    name: str
    size: int
    parseable: Union[str, None]

class Scan(BaseORM):
    TYPE = "scan"
    COLLECTION = "scans"

    def __init__(self, id: str, db: Database, timestamp: float, user: str, repository: int, branch: str, files: list[ScanFile] = [], **kwargs):
        super().__init__(id, db, **kwargs)
        self.files = files
        self.user = user
        self.repository = repository
        self.branch = branch
        self.timestamp = timestamp

    @staticmethod
    def check_parseable(parent: str, filename: str) -> Union[str, None]:
        if filename == "dockerfile" or filename.endswith(".dockerfile"):
            return "docker"
        if parent == "workflows" and (filename.endswith(".yaml") or filename.endswith(".yml")):
            return "actions"
        if parent == ".pipelines" and filename.endswith(".json"):
            return "pipelines"
        return None

    @classmethod
    def scan(cls, db: Database, username: str, repository: Repository, branch: str = "main") -> "Scan":
        try:
            archive_link = repository.get_archive_link("zipball", branch)
            r = requests.get(archive_link, stream=True)
            with tempfile.TemporaryFile("w+b") as temp:
                for chunk in r.iter_content(chunk_size=8192):
                    temp.write(chunk)
                
                with tempfile.TemporaryDirectory() as tempd:
                    zipfile.ZipFile(temp).extractall(path=tempd)
                    walk_result = list(os.walk(tempd))
                    root = walk_result.pop(0)[1][0]
                    files: list[ScanFile] = []
                    for result in walk_result:
                        head = "." + result[0].split(root)[1]
                        for f in result[2]:
                            size = os.stat(os.path.join(result[0], f)).st_size
                            files.append(ScanFile(directory=head, name=f, size=size, parseable=cls.check_parseable(os.path.split(head)[1].lower(), f.lower())))
            new_scan = Scan(cls.generate_uuid(), db, time.time(), username, repository.id, branch, files=files)
            new_scan.save()
            return new_scan
        
        except:
            raise RuntimeError
    
    def update(self):
        try:
            archive_link = self.repository.get_archive_link("zipball", self.branch)
            r = requests.get(archive_link, stream=True)
            with tempfile.TemporaryFile("w+b") as temp:
                for chunk in r.iter_content(chunk_size=8192):
                    temp.write(chunk)
                
                with tempfile.TemporaryDirectory() as tempd:
                    zipfile.ZipFile(temp).extractall(path=tempd)
                    walk_result = list(os.walk(tempd))
                    root = walk_result.pop(0)[1][0]
                    files: list[ScanFile] = []
                    for result in walk_result:
                        head = "." + result[0].split(root)[1]
                        for f in result[2]:
                            size = os.stat(os.path.join(result[0], f)).st_size
                            files.append(ScanFile(directory=head, name=f, size=size, parseable=self.check_parseable(os.path.split(head)[1].lower(), f.lower())))
            self.files = files
            self.save()
        
        except:
            raise RuntimeError

        

