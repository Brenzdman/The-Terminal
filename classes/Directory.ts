import { getColor, getColorString } from "@/functions/color";
import { TextDisplay } from "./TextDisplay";
import { Directory_Manager } from "./DirectoryManager";

export class Directory {
  public name: string;
  public files: Dir_File[] = [];
  public directories: Directory[] = [];
  public directoryManager: Directory_Manager;
  public userMalleable: boolean = false;
  public path: string;

  constructor(dm: Directory_Manager, name: string, path: string) {
    this.name = name;
    this.path = path;
    this.directoryManager = dm;
  }

  public toString(): string {
    return `[${getColor("dir")}${this.name}]`;
  }

  // Lists all files and directories in the current directory
  public ls(): string[] {
    const sortedDirs = this.directories.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const sortedFiles = this.files.sort((a, b) => a.name.localeCompare(b.name));

    const dirStrings = sortedDirs.map((dir) => dir.toString());
    const fileStrings = sortedFiles.map((file) => file.toString());

    return [...dirStrings, ...fileStrings];
  }

  public addFile(file: Dir_File, userMalleable = false): void {
    this.files.push(file);
    file.userMalleable = userMalleable;
  }

  public addDirectory(
    name: string,
    userMalleable = false,
    textDisplay: TextDisplay | null = null
  ): Directory {
    name = name?.trim();
    if (!name) {
      textDisplay?.addLines(
        getColorString("Invalid directory name", getColor("error"))
      );
      return this;
    }

    const existingDir = this.directories.find((dir) => dir.name === name);
    if (existingDir) {
      textDisplay?.addLines(
        getColorString("Directory already exists", getColor("error"))
      );
      return existingDir;
    }

    let newFolder = new Directory(
      this.directoryManager,
      name,
      this.path + name + "/"
    );
    newFolder.userMalleable = userMalleable;
    this.directories.push(newFolder);
    this.directoryManager.addDirectoryToList(newFolder);

    textDisplay?.addLines("Directory created");
    return newFolder;
  }

  public removeDirectory(
    path: string,
    textDisplay: TextDisplay | null = null
  ): void {
    const dir = this.directoryManager.getDirectory(this, path);

    if (!dir) {
      textDisplay?.addLines(
        getColorString("Directory not found", getColor("error"))
      );
      return;
    }

    if (!dir.userMalleable) {
      textDisplay?.addLines(getColorString("ACCESS DENIED", getColor("error")));
      return;
    }

    this.directories.splice(this.directories.indexOf(dir), 1);
    this.directoryManager.removeDirectoryFromList(dir);
    textDisplay?.addLines("Directory removed");
    return;
  }

  public cd(path: string): Directory | undefined {
    if (!path || path == ".") {
      return this;
    }

    const dir = this.directoryManager.getDirectory(this, path);
    if (!dir) {
      return undefined;
    }

    console.log("Changing directory to " + dir.name);
    this.directoryManager.currentDirectory = dir;
    this.directoryManager.currentPath = dir.path;

    return dir;
  }

  public runFile(requestName: string, textDisplay: TextDisplay): void {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      if (file.type !== ".exe") {
        continue;
      }

      if (file.name + file.type !== requestName && file.name !== requestName) {
        continue;
      }

      if (file.onRun !== null) {
        textDisplay.addLines([`Running ${file.name}${file.type}...`]);
        file.onRun();
        return;
      }
    }
    textDisplay.addLines(getColorString("File not found", getColor("error")));
  }

  readFile(name: string, textDisplay: TextDisplay): boolean {
    let ran = false;
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      if (file.name + file.type !== name || file.type !== ".txt") {
        continue;
      }

      textDisplay.addLines([file.content]);
      ran = true;
    }
    return ran;
  }
}

export class Dir_File {
  public name: string;
  public content: string = "";
  public type: string = ".txt";
  public onRun: (() => void) | null = null;
  public userMalleable: boolean = false;

  constructor(name: string, type: string, onRun?: () => void) {
    this.name = name;
    this.type = type;
    this.onRun = onRun || null;
  }

  toString(): string {
    return `[${getColor(this.type)}${this.name}${this.type}]`;
  }
}
