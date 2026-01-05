class HTTPError extends Error {
    constructor(message, errorCode) {
        super(message);
        this.code = errorCode;
    }
}

export default HTTPError;
