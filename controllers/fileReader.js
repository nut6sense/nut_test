const fs = require('fs');
const path = require('path');

const fileReader = async function (req, res) {

    const folderMain = path.join(__dirname, '../public/wordFolderList');
    await deleteFolder(folderMain);

    const filePath = path.join(__dirname, '../public', 'wordList', '20k.txt');
    await readFile(filePath);

    const report = await getFolderSize(folderMain);
    let folderSizeList = [];
    report.filesList.forEach(file => {

        let index = folderSizeList.findIndex(x => x.folder === `${file.folder}`);
        if (index > -1) {
            folderSizeList[index].size = ((+folderSizeList[index].size) + (+`${file.size}`));
        } else {
            folderSizeList.push(file)
        }
    });

    // console.log(folderSizeList);

    res.render('pages/index', {
        page: 'File Reader',
        folderSizeList: folderSizeList,
    })

}

const readFile = async (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');
        const arrWords = [];

        lines.forEach(async line => {
            let textValue = (line) ? line.trim().toLowerCase() : '';
            let data = {
                level1: (Array.from(textValue)[0]) ? Array.from(textValue)[0] : '',
                level2: (Array.from(textValue)[1]) ? Array.from(textValue)[1] : '',
                text: textValue,
            }
            arrWords.push(data);

            const folderPath = path.join(__dirname, '../public/wordFolderList', data.level1 + ((data.level2) ? '/' + data.level2 : ''));
            await createFile(folderPath, data.text);
        });

        // console.log(arrWords);

    } catch (err) {
        console.error('Error reading file:', err);
    }
}

const createFolder = async (folderPath) => {
    if (fs.existsSync(folderPath)) {
        // console.log('Folder already exists:', folderPath);
    } else {
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            // console.log('Folders created successfully:', folderPath);
        } catch (err) {
            console.error('Error creating folders:', err);
        }
    }
};

const createFile = async (folderPath, wordText) => {

    await createFolder(folderPath);

    const filePath = path.join(folderPath, wordText + '.txt');

    let fileContent = '';
    for (let index = 0; index < 100; index++) {
        fileContent += ((index > 0) ? ' ' : '') + wordText;
    }

    try {
        fs.writeFileSync(filePath, fileContent);
        // console.log('File created and text inserted successfully:', filePath);
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

const deleteFolder = async (folderPath) => {
    try {
        fs.rmSync(folderPath, { recursive: true, force: true });
        // console.log('Folder deleted successfully:', folderPath);
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            // console.log('Folders created successfully:', folderPath);
        } catch (err) {
            console.error('Error creating folders:', err);
        }
    } catch (err) {
        console.error('Error deleting folder:', err);
    }
};

const getFolderSize = async (dirPath) => {
    let filesList = [];

    const calculateSize = (currentPath) => {
        const items = fs.readdirSync(currentPath);

        items.forEach(item => {
            const fullPath = path.join(currentPath, item);
            const stats = fs.lstatSync(fullPath);

            if (stats.isDirectory()) {
                calculateSize(fullPath);
            } else if (stats.isFile()) {
                filesList.push({ path: currentPath, size: stats.size, folder: Array.from(item)[0] });
            }
        });
    };

    calculateSize(dirPath);

    return {
        filesList
    };
};



module.exports = {
    fileReader
};