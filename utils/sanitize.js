
const sanitize = (obj = {}) => {
    const clean = {};

    for (const key in obj) {
        let value = obj[key];

        if (key.startsWith("$")) {
            throw new Error("Invalid key detected");
        }

        if (typeof value === "object" && value !== null) {
            if (Object.keys(value).some(k => k.startsWith("$"))) {
                throw new Error("Invalid nested key detected");
            }
        }

        if (typeof value === "string") {
            value = value.trim();
        }
        clean[key] = value;
    }

    return clean;
}
module.exports = sanitize



