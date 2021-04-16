async function acknowledgeNotification({parameters}) {
    if ('queryStrings' in parameters && 'validationToken' in parameters.queryStrings) {
        return new HttpResponse(
            200,
            [{ name: 'Content-Type', value: 'text/plain' }],
            decode(parameters.queryStrings.validationToken)
        );
    } else {
        return new HttpResponse(
            202,
            [{ name: 'Content-Type', value: 'text/plain' }],
            'Notification received');
    }
}

class HttpResponse {
    constructor(statusCode, headers, body) {
        this.statusCode = statusCode;
        this.headers = headers;
        this.body = body;
    }
}

function decode(result) {
    let decodedURI = decodeURI(result);
    return decodedURI.replaceAll('%3a', ':').replaceAll('+', ' ');
}