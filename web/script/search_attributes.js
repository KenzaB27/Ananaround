function searchAttributes(object, relation, callback){
    
    var url = "http://dbpedia.org/sparql";
    
    var query = [
    "SELECT ?res",
    "WHERE {",
       object + " " + relation + " ?res",
    "}"
    ].join(" ");

    var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=application/json";
    var response = [];
    
    $.ajax({
        url: queryUrl,
        success: callback
    });    
};

function searchDessert(attribute, relation, callback){
    
    var url = "http://dbpedia.org/sparql";
    
    var query = [
    "select distinct ?res where {",
        "?res " + relation + " " + attribute +".",
        "?res dbo:type dbr:Dessert.",

    "} "
    ].join(" ");

    var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=application/json";
    var response = [];
    
    $.ajax({
        url: queryUrl,
        success: callback
    });    
};

async function getJsonResponse(queryUrl){
    var myInit = {
        method: 'GET',
        mode: 'cors',
        cache: 'default',
    };
    return await fetch(queryUrl, myInit).then(response => { return response.json() });
}

function constructQueryUrl(query,uri){
    uri = '<' + uri + '>';
    query = query.split("%URI%").join(uri)
    var url = "http://dbpedia.org/sparql";
    var queryUrl = url + "?query=" + encodeURIComponent(query) + "&format=json";
    return queryUrl; 
}

async function getMinInfos (uri){
    
    var queryUrl = constructQueryUrl(queries['getMinInfos'],uri); 
    
    const jsonResponse = await getJsonResponse(queryUrl); 

    var minInfos={}; 
    var result = jsonResponse.results.bindings[0];
    if (result !== undefined && result !== null) {
        minInfos["name"] = result.label.value; 
        minInfos["imgURL"] = result.image.value; 
        minInfos["description"] = result.description.value;
        minInfos["uri"] = uri.substring(uri.lastIndexOf("/")+1);
    } else {
        minInfos = undefined;
    }
    return minInfos; 
}

async function getFullInfos(uri) {
    var queryUrl = constructQueryUrl(queries['getFullInfos'], uri);

    const jsonResponse = await getJsonResponse(queryUrl); 

    var fullInfos = {}; 
    var result = jsonResponse.results.bindings;
    console.log(result);
    if (result !== undefined && result !== null && result.length!==0 ) {
        
        fullInfos["name"] = result[0].label.value;
        fullInfos["imgURL"] = result[0].image.value;
        fullInfos["description"] = result[0].description.value;
        fullInfos['country'] = (result[0].country !== undefined) ? result[0].country.value:"Unknown country";
        var ingredientsURISet = new Set([])
        result.map(x => { ingredientsURISet.add(x.ingredients.value)})
        var promisesIngredients = Array.from(ingredientsURISet).map(x => {return getIngredientsDetails(x)})
        Promise.all(promisesIngredients).then(
            ingredientDetails => {
                fullInfos['ingredients'] = ingredientDetails.filter(x => x!=undefined);
                displayInfos(fullInfos)
            }) 
              
    } else {
        fullInfos = {
            name : "Unfound dessert",
            imgURL: "unknown.png", 
            description: "Sorry we couldn't find your dessert in DBPedia", 
            country: "Unknown Country", 
            ingredients: []
        };
        displayInfos(fullInfos) 
    }
    

}

async function getIngredientsDetails(uri){

    var queryUrl = constructQueryUrl(queries['getIngredientsDetails'],uri);
    
    const jsonResponse = await getJsonResponse(queryUrl); 

    var ingredientDetails = {};
    ingredientDetails['URI']= uri; 
    var result = jsonResponse.results.bindings[0];
    if (result !== undefined && result !== null) {
        ingredientDetails['name'] = result.ingredientName.value;
        ingredientDetails['imgURL'] = result.imgUrl.value;
        var description = result.description.value;
        ingredientDetails["description"] = description
    } else {
        ingredientDetails = undefined;
    }
    return ingredientDetails; 
}


async function getDessertFromCountry (uri){

    var queryUrl= constructQueryUrl(queries['getDessertFromCountry'],uri);

    const jsonResponse = await getJsonResponse(queryUrl);

    var dessertFromCountry = []; 
    var result = jsonResponse.results.bindings;
    if (result !== undefined && result !== null) {
        $(result).each(function (i) {
            dessertFromCountry.push(getMinInfos(result[i].desserts.value)); 
        });
    }
    else{
        dessertFromCountry = undefined ;
    }
    return Promise.all(dessertFromCountry); 
}

async function getDessertFromIngredient (uri){
    var queryUrl = constructQueryUrl(queries['getDessertFromIngredient'],uri);
    
    const jsonResponse = await getJsonResponse(queryUrl); 
    var dessertFromIngredient = [];
    var result = jsonResponse.results.bindings;
    if (result !== undefined && result !== null) {
        $(result).each(function (i) {
            dessertFromIngredient.push(getMinInfos(result[i].desserts.value));
        });
    }
    else {
        dessertFromIngredient = undefined;
    }
    return Promise.all(dessertFromIngredient);  
}

const queries = {
    getMinInfos: `select distinct ?label ?description ?image where {`
        +`%URI% rdfs:label ?label. `
        +`%URI% dbo:abstract ?description. `
        +`%URI% dbo:thumbnail ?image. `
        +`Filter (langMatches ( lang(?label) , "EN" ) && langMatches ( lang(?description) , "EN" ))}`,

    getFullInfos: `select distinct ?label ?description ?image ?ingredients ?country ?uriCountry  where { `
        +`%URI% rdfs:label ?label. `
        +`%URI% dbo:abstract ?description. `
        +`%URI% dbo:thumbnail ?image. `
        +`%URI% dbo:ingredient ?ingredients.`
        +`OPTIONAL { %URI% dbo:country ?uriCountry. ?uriCountry rdfs:label ?country. `+
                    `Filter (langMatches ( lang(?country) , "EN" ))}`
        +`Filter (langMatches ( lang(?label) , "EN" ) && langMatches ( lang(?description) , "EN" ) )} `,

    getIngredientsDetails: `select distinct ?description ?ingredientName ?imgUrl where { ` 
        +`%URI% dbo:abstract ?description. `
        +`%URI% dbo:thumbnail ?imgUrl. `
        +`%URI% rdfs:label ?ingredientName. `
        +`Filter (langMatches ( lang(?ingredientName) , "EN" ) && langMatches ( lang(?description) , "EN" ))}`, 

    getDessertFromCountry: `select distinct ?desserts where { `  
        +`?desserts dbo:type dbr:Dessert. `
        +`?desserts dbo:country %URI% .} `, 
    
    getDessertFromIngredient: `select distinct ?desserts where { ` 
        +`?desserts dbo:type dbr:Dessert. `
        +`?desserts dbo:ingredient %URI% .} `, 

}; 

     


