import { question, keyInSelect } from "readline-sync";
import { Client, QueryResult } from "pg";

//As your database is on your local machine, with default port,
//and default username and password,
//we only need to specify the (non-default) database name.

async function searchMovies() {
    const client = new Client({ database: 'omdb' });
    let loopControl = 0
    await client.connect();
    
    console.log("Welcome to search-movies-cli!");
    while (loopControl !== 3){
         const selectIndex = keyInSelect(["Search", "Favourites", "Quit"], 'Which action?');
         loopControl = selectIndex + 1
        switch(loopControl){

            case 1:
                const searchTerm = question('Search For What Movie? : ');
                const searchQuery = createSearchQuery(searchTerm)
                const searchRes = await client.query(searchQuery.queryText, searchQuery.queryValues);
                console.log(`Search Term: ${searchTerm}`)
                console.table(searchRes.rows);
                const titlesArray: string[] = createSearchTitlesArray(searchRes)
               const addFavouritesChoice: number = keyInSelect(titlesArray, `Add To Favourites? :  `)
               if (addFavouritesChoice > 0){
                    const maxId = await client.query(`SELECT MAX(id) FROM favourites` )
                    client.query(`INSERT INTO favourites (id, movie_id) VALUES ($1, $2)`, [maxId.rows[0].max + 1, searchRes.rows[addFavouritesChoice].id])
               }
               break;

            case 2:
                const favouritesTable = 'SELECT favourites.id, favourites.movie_id, name, EXTRACT(YEAR FROM date) AS "year" FROM favourites LEFT JOIN movies ON favourites.movie_id = movies.id ORDER BY id ASC'
                const favouritesRes = await client.query(favouritesTable);
                console.table(favouritesRes.rows)
                break;
        }
      }
    await client.end();
}


function createSearchQuery(searchTerm: string){
    const text = `
        SELECT id, name, EXTRACT(YEAR FROM date) AS "year", runtime, ROUND(budget/1000000,1) AS "budget(m)", runtime, ROUND(vote_average,2) AS "rating", votes_count 
        FROM movies 
        WHERE kind = 'movie' AND UPPER(name) LIKE $1
        ORDER BY date DESC 
        LIMIT 10`;
    const values = [`%${searchTerm.toUpperCase()}%`];
    return {
        queryText: text,
        queryValues: values
        }
}

function createSearchTitlesArray(queryResults: QueryResult<any>){
    const movieTitlesArray: string[] = []
    queryResults.rows.map((movie) => movieTitlesArray.push(movie.name))
    return movieTitlesArray
}

searchMovies()
