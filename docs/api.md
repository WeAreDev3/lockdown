# Password Manager REST API
Password Manager uses a RESTful API in obtaining resources for cross-platform ease of use.

**Note**: the server requires a 'Content-Type: application/json' header on each resource request.


## /signin

### POST
Authenticates user with given credentials.

#### Data sent:
`Content-Type: application/json`
```json
{
    "username": String,
    "passHash": String
}
```

- `username`: the user's username
- `passHash`: the user's password, hashed with BCrypt

#### Data received:
If successful, the server returns a 200 (OK) response with an empty body. If failed, the server returns a 401 (Unauthorized) response with an empty body.

## /signout

### POST
Removes authorization token from user's current session (i.e., signs them out).

#### Data received:
The server returns a 200 (OK) response with an empty body.

## /sites

### GET
Retrieves a list of all of the sites associated with the current user.

#### Data received:
`Content-Type: application/json`
```json
{
    "sites": [String]
}
```

- `sites`: an array containing a list of all of the domains, in string form, associated with that user

### POST
Adds a new site to the user's account.

#### Data sent:
`Content-Type: application/json`
```json
{
    "domain": String,
    "name": String,
    "username": String,
    "password": String
}
```

- `domain`: the url of the site to add
- `name`: the name of the site to add
- `username`: the username for the site
- `password`: the password for the site

## /sites/all

### GET
Returns all of the data associated with all of the user's sites.

## /sites/:domain

### GET
Returns all of the data associated with that site.

#### Data received:
`Content-Type: application/json`
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
`Content-Type: application/json`
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

