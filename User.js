exports.User = class {
    constructor (username) {
        this.username = username;
    }

    comparePassword (candidate, callback) {
        callback(candidate === this.username);
    }

    toJSON () {
        return JSON.stringify({ username: this.username });
    }
}

