const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
// const mysql2 = require('mysql2');
const mysql = require('mysql2/promise');
const PDFDocument = require('pdfkit');

// Create a connection to the database
const mysqlConnection = {
    host: 'localhost',
    user: 'root',
    password: 'isylzjko',
    database: 'dev_test',
    connectTimeout: 30000
};

const fileReader = async function (req, res) {

    const folderMain = path.join(__dirname, '../public/wordFolderList');
    await deleteFolder(folderMain);

    // const filePath = path.join(__dirname, '../public', 'wordList', '20.txt');
    const filePath = path.join(__dirname, '../public', 'wordList', '100.txt');
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

    await zipFolder(folderSizeList);

    let resultQuery = {
        query1: '',
        query2: '',
        query3: '',
        query4: '',
        result1: '',
        result2: '',
        result3: '',
        result4: '',
    }

    resultQuery.query1 = "SELECT COUNT(1) AS countCharLength FROM tbl_word WHERE CHAR_LENGTH(word) > 5;";
    resultQuery.result1 = await selectData(resultQuery.query1);

    resultQuery.query2 = " SELECT COUNT(1) AS countDuplicate ";
    resultQuery.query2 += " FROM ( ";
    resultQuery.query2 += " SELECT word, COUNT(1) ";
    resultQuery.query2 += " FROM tbl_word ";
    resultQuery.query2 += " JOIN ( ";
    resultQuery.query2 += "     SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5  ";
    resultQuery.query2 += "     UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 ";
    resultQuery.query2 += " ) numbers ON LENGTH(word) >= n ";
    resultQuery.query2 += " GROUP BY word, SUBSTRING(word, n, 1) ";
    resultQuery.query2 += " HAVING COUNT(*) >= 2 ";
    resultQuery.query2 += " ) t ";
    resultQuery.result2 = await selectData(resultQuery.query2);

    resultQuery.query3 = "SELECT COUNT(1) AS countMatchWord FROM tbl_word WHERE LEFT(word, 1) = RIGHT(word, 1);";
    resultQuery.result3 = await selectData(resultQuery.query3);


    resultQuery.query4 = "UPDATE tbl_word SET word = CONCAT(UPPER(LEFT(word, 1)), LOWER(SUBSTRING(word, 2))) WHERE id > 0;";
    resultQuery.result4 = await selectData(resultQuery.query4);

    await exportToPDF();

    res.render('pages/index', {
        page: 'File Reader',
        folderSizeList: folderSizeList,
        resultQuery: resultQuery,
    })

}

const readFile = async (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');
        const arrWords = [];

        await trancateTable();
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
            if (textValue) {
                let insertWordxx = await insertWord(textValue);
            }
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

const zipFolder = async (folderSizeList) => {
    try {
        for (const item of await folderSizeList) {
            const folderPath = path.join(__dirname, '../public/wordFolderList/', item.folder);
            const outputZipPath = path.join(__dirname, '../public/wordFolderListZip/', item.folder + '.zip');
            await zipFolderFunc(folderPath, outputZipPath, folderSizeList, item.folder);
        }
    } catch (err) {
        console.error('Error Zip folder:', err);
    }
};

async function zipFolderFunc(folderPath, outputZipPath, folderSizeList, folderName) {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            let index = folderSizeList.findIndex(x => x.folder === folderName);
            if (index > -1) {
                folderSizeList[index].sizeZip = `${archive.pointer()}`;
            }
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        // Append files from the specified folder, putting its contents at the root of the zip
        archive.directory(folderPath, false);

        // Finalize the archive
        archive.finalize();
    });
}

async function insertWord(word) {
    const connection = await mysql.createConnection(mysqlConnection);
    try {
        const [rows] = await connection.query('INSERT INTO tbl_word (word) VALUES (?)', [word]);
        // console.log('Query results:', rows);
        return rows;
    } catch (error) {
        console.error('Error executing query:', error);
    } finally {
        await connection.end();
    }

}

// async function insertWord(word) {
//     const connection = mysql2.createConnection(mysqlConnection);
//     connection.connect(error => {
//         // Check Error Connection
//         if (error) {
//             console.error('Error connecting to the database:', error.stack);
//             return;
//         }

//         const sql = 'INSERT INTO tbl_word (word) VALUES (?)';
//         connection.query(sql, [word], (error, results, fields) => {
//             if (error) {
//                 console.error('Error inserting data:', error.stack);
//                 return;
//             }

//             connection.end(err => {
//                 if (err) {
//                     console.error('Error closing the connection:', err.stack);
//                 } else {
//                     console.log('Connection closed.');
//                 }
//             });
//         });
//     });
// }

async function insertAllWord() {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');
        await trancateTable();
        lines.forEach(async line => {
            let textValue = (line) ? line.trim().toLowerCase() : '';
            if (textValue) {
                await insertWord(textValue);
            }
        });

    } catch (err) {
        console.error('Error insert Word:', err);
    }
}

async function trancateTable() {
    const connection = await mysql.createConnection(mysqlConnection);
    try {
        const [rows] = await connection.query('TRUNCATE tbl_word');
        return rows;
    } catch (error) {
        console.error('Error executing query:', error);
    } finally {
        await connection.end();
    }
}

async function selectData(sql) {

    const connection = await mysql.createConnection(mysqlConnection);

    try {
        const [rows] = await connection.query(sql);
        return rows;
    } catch (error) {
        console.error('Error executing query:', error);
    } finally {
        await connection.end();
    }
}

async function exportToPDF() {
    const connection = await mysql.createConnection(mysqlConnection);
    const [rows] = await connection.execute("SELECT word FROM tbl_word;");

    // สร้าง PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const pdfPath = path.join(__dirname, '../public/word20k.pdf');
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // เขียนข้อมูลลงใน PDF
    const lineHeight = 15;
    let yPosition = 50; // ตำแหน่งเริ่มต้นของการเขียนข้อมูล

    doc.fontSize(10);

    for (const row of rows) {
        const text = row.word || ''; // ดึงข้อมูลคำจากคอลัมน์
        doc.text(text, 50, yPosition);

        yPosition += lineHeight;

        // ตรวจสอบว่าตำแหน่ง y เกินขอบเขตของหน้า A4 หรือไม่
        if (yPosition > doc.page.height - 100) {
            doc.addPage(); // เพิ่มหน้าใหม่
            yPosition = 50; // รีเซ็ตตำแหน่ง y
        }
    }

    // ปิดไฟล์ PDF
    doc.end();

    writeStream.on('finish', () => {
        console.log('PDF created and saved as output.pdf');
    });

    // ปิดการเชื่อมต่อ
    await connection.end();
}

module.exports = {
    fileReader
    , zipFolder
    , insertAllWord
};