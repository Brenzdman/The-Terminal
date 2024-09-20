const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const shortcut = require("windows-shortcuts");
const archiver = require("archiver");

// Get the directory of the script
const scriptDir = __dirname;

// Define paths relative to the script directory
const outputDir = path.join(scriptDir, "dist", "TheTerminal-win32-x64");
const targetDir = path.join(scriptDir, "The_Terminal");
const targetSubDir = path.join(targetDir, "app");
const exePath = path.join(targetSubDir, "TheTerminal.exe");
const shortcutPath = path.join(targetDir, "The_Terminal.lnk");
const zipPath = path.join(scriptDir, "The_Terminal.zip");

function deleteFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolder(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

// Function to zip the folder
function zipFolder(source, out) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", (err) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
}

// Packages app
exec(
  "electron-packager . TheTerminal --platform=win32 --arch=x64 --icon=favicon.ico --out=dist --overwrite",
  { cwd: scriptDir }, // Set the working directory to the script directory
  (err, stdout, stderr) => {
    if (err) {
      console.error(`Error packaging app: ${stderr}`);
      return;
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }
    if (!fs.existsSync(targetSubDir)) {
      fs.mkdirSync(targetSubDir);
    }

    // Moves packaged files to the target subdirectory
    fs.readdirSync(outputDir).forEach((file) => {
      fs.renameSync(path.join(outputDir, file), path.join(targetSubDir, file));
    });

    // Creates a shortcut to the .exe file for ease of access
    shortcut.create(
      shortcutPath,
      {
        target: exePath,
        workingDir: targetSubDir,
        runStyle: 1,
        icon: path.join(scriptDir, "favicon.ico"),
      },
      (err) => {
        if (err) {
          console.error(`Error creating shortcut: ${err}`);
        } else {
          console.log("Packaging complete.");
          // Remove extra folder
          deleteFolder(path.join(scriptDir, "dist"));

          // Zip the folder
          zipFolder(targetDir, zipPath)
            .then(() => {
              console.log("Folder zipped successfully.");
            })
            .catch((err) => {
              console.error(`Error zipping folder: ${err}`);
            });
        }
      }
    );
  }
);
