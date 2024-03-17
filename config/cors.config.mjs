const whiteLists = [
    "https://www.example1.com",
    "https://www.example2.com"
];

const corsOptions = {
    origin: function (origin, callBack) {
        if ( whiteLists.includes(origin) || !origin ) {
            callBack(null , true);
        } else {
            callBack(new Error("Not Allowed By CORS Policy"));
        }
    },
    optionsSuccessStatus: 200
}


export default corsOptions;