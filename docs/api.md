# Password Manager REST API
Password Manager uses a RESTful API in obtaining resources for cross-platform ease of use.

**Note**: the server requires a `Content-Type: application/json` header on each resource request.

## /users

## POST
Creates a new user.

#### Data sent:
```json
{
    "email": String,
    "username": String,
    "clientHash": String,
    "salt": String,
    "iter": Number,
    "keyLength": Number
}
```

- `email`: the user's email, for verification
- `username`: the user's username
- `clientHash`: the user's password hashed with client PBKDF2
- `salt`: the random salt used forclient hashing
- `iter`: the number of iterations used in client PBKDF2
- `keyLength`: the key length for client PBKDF2

#### Data received:
- If the user was successfully created: status 201 (Created)
- If there is a username conflict: `{ "message": "..." }` with status 409 (Conflict)
- If some data does not pass validation: `{ "message": "..." }` with status 400 (Bad Request)

## /signin

### POST
Authenticates user with given credentials.

#### Data sent:
```json
{
    "username": String,
    "clientHash": String
}
```

- `username`: the user's username
- `clientHash`: the user's password, hashed with client PBKDF2

#### Data received:
- If successful, the server returns a 200 (OK) response with an empty body.
- If failed, the server returns a 401 (Unauthorized) response with an empty body.

#### Data received:
The server returns a 200 (OK) response with an empty body.

## /sites

### GET
Retrieves a list of all of the sites associated with the current user.

#### Data received:
```json
{
    "sites": [ String ]
}
```

- `sites`: an array of all the domains the user has accounts to

### POST
Adds a new site to the user's account.

#### Data sent:
```json
{
    "domain": String,
    "name": String,
    "form": {
        "name": String,
        "data": [{
            "name": String,
            "value": String
        }]
    }
}
```

- `domain`: the url of the site to add
- `name`: the name of the site to add
- `username`: the username for the site
- `password`: the password for the site
- `form`: the form that the user submits
    + `name`: name attribute of the form
    + `data`: array of all the form data
        * `name`: the inputs name or id attribute
        * `value`: the inputs value
        * These will be where the username and password are stored

## /sites/all

### GET
Returns all of the data associated with all of the user's sites.

#### Data received:
```json
{
    "DOMAIN": [{
        "name": String,
        "username": String,
        "password": String
    }]
}
```

- An object with domains as keys
- `DOMAIN`: an array of account objects on the given domain

## /sites/:domain

### GET
Returns all of the data associated with that site.

#### Data received:
```json
{
    "name": String,
    "username": String,
    "password": String
}
```
- `name`: the name of the site
- `username`: the username for the site
- `password`: the password for the site


### PUT
Updates the site data with the given data.

#### Data sent:
```json
{
    "name": String,
    "username": String,
    "password": String
}
```

- `name`: the name of the site to add
- `username`: the username for the site
- `password`: the password for the site

### DELETE
Deletes all of the data associated with that site.

#### Data received:
If successful, the server returns a 204 (No Content) response with an empty body.
