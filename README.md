# Budgelope - Personal Budget

## Project Overview

An API for creating and managing a personal budget, based on the Envelope Budgeting principles. Portfolio project from Codecademy's backend path. This is the backend, looking at incorperating the frontend soon.

## How to Begin

Clone the project in a working folder of your choosing. You'll need to run some terminal commands to get the application started. First, open the root project directory in your terminal. Run `npm install` to install the dependencies of this project. Once it has finished installing, you'll see `Server listening on port 3000` in the terminal. You can now open a browser and go to `localhost:3000`. This should print the message 'Hello World!' in the browser, with nothing else to confirm the server is running. All other commands are tested with Postman. If you would like, you can kill the process with the `Ctrl + C` command in the command line.

### API Routes

-   The routes live inside the **server** folder.
-   The 'database' exists in **public/db.js**. The beginning database will be seeded every time the server is restarted.
-   All tests can be made with Postman.

#### Routes

-   `/envelopes`
-  -   GET retrieves all budget envelopes in an array.
        -   Returns the array of all envelopes
        -   If empty, displays a message
    -   POST to create a new envelope and save it to the database.
        -   Returns the newly posted envelope on success
        -   Throws an error if the data is invalid
    -   POST `/:id` for specific envelope by ID, updating the whole envelope
        -   Returns the newly posted envelope on success
        -   Throws an error if the data is invalid
    -   GET `/:id` to get a single envelope by id.
        -   Returns the envelope by Id
        -   Returns a 400 with a message if invalid or 404 not found
    -   PUT `/:id` to withdraw from the single envelope
        -   Returns the envelope by id that the transaction was made from
        -   Returns a 400 with a message if invalid or 404 not found
    -   DELETE `/:id` to delete a single envelope by id.
        -   Returns a 204 with a message if successful
        -   Returns a 400 with a message if invalid or 404 not found
    -   `/:fromId/:toId`
        -   For this route, the request body should at least contain an 'amount' and its numerical value eg: `{ amount: 250 }`.
        -   POST to make a transfer between the source (fromId) envelope, to the destination (toId) envelope. The schema discussed below
            -   Returns a new object with the details of the transaction in the format of a new schema:
            {
                "withdrawal": {
                "id": 2,
                "title": "hobbies",
                "budget": 500
                },
                "transfer": {
                "id": 1,
                "title": "groceries",
                "budget": 1750
            }
            -   Returns a 400 with a message if invalid or 404 not found

For all PUT and POST routes, request bodies will ignore the `id` property to keep data integrity. All ID properties for the envelopes are auto-generated.
For the PUT request, the `title` will also be ignored, as the data is made on the `budget` property.

---

### Working with the 'Database'

The **public/db.js** file exports helper functions for working with the database arrays. The data is non-persistent and is generated at random upon server restart

`totalBudget`:

-   Total budget calculation of all the envelopes' budgets in the array

`hasAnyBudgets`:

-   A check function for verifying if the array is empty.

`getAllFromDatabase`:

-   Retrieve all data in the array.

`addToDatabase`:

-   Add a new envelope to the array database.
-   Takes an `instance` of the envelope as an argument, which will be the one added to the database

`removeFromDatabaseById`:

-   Remove an envelope from the database by id.
-   Takes a single `id` argument that removes an envelope by matching id
-   Returns `false` if the non-existent id is passed as the argument

`getEnvelopeById`:

-   Retrieve the envelope by Id
-   Takes a single `id` argument that gets an envelope by matching id
-   Returns `null` if a non-existent id is passed in as the argument

`withdrawFundsFromEnvelopeById`

-   Make a withdrawal from a specific envelope by matching id
-   Takes an `id` and `withdrawalAmount` as arguments
-   Returns `null` if no matching id is found and will throw an error if the withdrawal amount is insufficient

`editEnvelopeById`

-   Make a full edit of an envelope by id and update it in the array
-   Takes in an `id` and the `updatedEnvelope` instance as arguments, which are the details of the envelope to update.
-   Returns `null` if no matching id is found

NOTE: There may be some functions from the **public/db.js** file left out in this listing, as these are functions that are used internally, and by using them again elsewhere, you will be doubling up on the verification checks.

#### Schemas

-   Envelope:
    -   id: number
    -   title: string
    -   budget: number

### Custom Route

-   There is a custom `envelope` route to clean up some of the long route paths in `app.js`
