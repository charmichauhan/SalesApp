class Service {
    constructor() {
        const headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        headers.append('X-Requested-With', 'XMLHttpRequest');
        this.headers = headers;
    }

    request(url, config = {}, data = {}) {
        const options = Object.assign({
            method: 'POST',
            credentials: 'include',
            headers: this.headers,
            mode: 'cors',
            body: JSON.stringify(data),
        }, config);
        return this.fetch(url, options);
    }

    fetch(url, options) {
        return fetch(url, options);
    }

    post(url, data) {
        const config = {
            method: 'POST',
        };
        return this.request(url, config, data);
    }

    get(url) {
        const config = {
            method: 'GET',
        }
        return this.request(url, config);
    }

    delete(url) {
        const config = {
            method: 'DELETE',
        }
        return this.request(url, config);
    }

    put(url, data) {
        const config = {
            method: 'PUT',
        };
        return this.request(url, config, data);
    }
}

export default Service;