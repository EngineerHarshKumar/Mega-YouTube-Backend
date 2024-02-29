import multer from "multer";

const storage = multer.diskStorage({
    destination: function (request, file, callBack) {
        callBack(null, "./public/images");
    },

    filename: function (request, file, callBack) {
        callBack(
            null,
            `${Math.floor(Math.random() * 999999)}--${file.originalname}`,
        );
    },
});

const uploadMulter = multer({ storage });

export { uploadMulter };
