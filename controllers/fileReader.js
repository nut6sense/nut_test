const fs = require('fs');
const path = require('path');

const fileReader = async function (req, res) {
    
    const folderMain = path.join(__dirname, '../public/wordFolderList');
    await deleteFolder(folderMain);

    const filePath = path.join(__dirname, '../public', 'wordList', '20.txt');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

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


        console.log(arrWords);
    });


    res.render('pages/index', {
        page : 'File Reader'
    })

}

const createFolder = async (folderPath) => {
    if (fs.existsSync(folderPath)) {
        console.log('Folder already exists:', folderPath);
    } else {
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log('Folders created successfully:', folderPath);
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
        console.log('File created and text inserted successfully:', filePath);
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

const deleteFolder = async (folderPath) => {
    try {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log('Folder deleted successfully:', folderPath);
    } catch (err) {
        console.error('Error deleting folder:', err);
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log('Folders created successfully:', folderPath);
        } catch (err) {
            console.error('Error creating folders:', err);
        }
    }
};

module.exports = {
    fileReader
};