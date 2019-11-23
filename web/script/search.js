async function searchAllUri(research) {

    var sparqlDessert =`SELECT DISTINCT ?response WHERE{
{?response dbo:type dbr:Dessert}
UNION
{?response dc:type "Dessert"}
}`;
    var sparqlCountry =`SELECT DISTINCT ?response WHERE {
?dessert dbo:country ?response.
{?dessert dbo:type dbr:Dessert}
UNION
{?dessert dc:type "Dessert"}
}`;

    var sparqlIngr = `SELECT DISTINCT ?response WHERE {
?dessert dbo:ingredient ?response.
{?dessert dbo:type dbr:Dessert}
UNION
{?dessert dc:type "Dessert"}
}`;
    
    
    var dessertResult = await requestSpotlight(sparqlDessert, research);
    var countryResult = await requestSpotlight(sparqlCountry, research);
    var ingredientResult = await requestSpotlight(sparqlIngr, research);

    var result = {};

    if(dessertResult.length != 0){
        result['dessert'] = dessertResult[0];
    }
    if(countryResult.length != 0){
        result['country'] = countryResult[0];
    }
    if(ingredientResult.length != 0){
        result['ingredient'] = ingredientResult[0];
    }
    
    return result;
}

async function requestSpotlight(sparqlFilter, research){
    var sparqlURI = encodeURI(sparqlFilter);
    var researchURI = encodeURI(research);
    var url = `http://api.dbpedia-spotlight.org/en/candidates?
&text=${researchURI}
&confidence=0
&support=0
&sparql=${sparqlURI}`;
    
    var myHeaders = new Headers();
    myHeaders.append('Accept','application/json');

    var myInit = { method: 'GET',
                headers: myHeaders,
                mode: 'cors',
                cache: 'default',
             };
    
    const jsonResponse = await fetch(url,myInit).then(response => {return response.json()});

    var list_uri = [];
    if ('surfaceForm' in jsonResponse.annotation){
        surfaceFormResponse = jsonResponse.annotation.surfaceForm
        if (!Array.isArray(surfaceFormResponse)){
            surfaceFormResponse = [surfaceFormResponse]
        }
        surfaceFormResponse.forEach(arrayElement => {
            resourceResponse = arrayElement.resource
            if(!Array.isArray(resourceResponse)){
                resourceResponse = [resourceResponse]
            }
            resourceResponse.forEach(resourceElement => {
                list_uri.push(resourceElement['@uri'])
            })
        })
    }
    return list_uri;
}