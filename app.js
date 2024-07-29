const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const fileReaderRoutes = require('./routes/fileReaderRoutes');

app.set('view engine', 'ejs');

app.use("/public", express.static(path.join(__dirname, 'public')));
app.use('/fileReader', fileReaderRoutes);

app.get('/', (req, res) => {
    res.render('pages/index');
});

app.listen(port, ( ) => {
    console.log(`App listening at port ${port}`)
})
