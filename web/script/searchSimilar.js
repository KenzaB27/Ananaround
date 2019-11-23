const dessertsUCouldLoveSparql = `
SELECT ?R (COUNT(?S) as ?nbSubject) WHERE {
?dessert dct:subject ?S.
?R dbo:type dbr:Dessert;
dct:subject ?S.
FILTER(?dessert = <{{originalUri}}> && ?R != <{{originalUri}}>)
} 
GROUP BY(?R)
ORDER BY desc(?nbSubject)
LIMIT 3
`;

const dessertsWithSameCountrySparql = `
SELECT DISTINCT ?R ?C WHERE {
?dessert dbo:country ?C.
?R dbo:type dbr:Dessert;
dbo:country ?C.
FILTER(?dessert = <{{originalUri}}> && ?R != <{{originalUri}}>)
}
LIMIT 3
`;

const dessertsWithSameIngredientSparql = `
SELECT ?R (sample(?S) as ?sample) (count(?S) as ?C) WHERE {
?dessert dbo:ingredient ?S.
?R dbo:type dbr:Dessert;
dbo:ingredient ?S.
FILTER(?dessert = <{{originalUri}}> && ?R != <{{originalUri}}>)
} 
GROUP BY(?R)
ORDER BY desc(?C)
LIMIT 3
`;


async function searchSimilarDesserts(originalUri, displayFn){
    
    //fetch desserts with the same subjects and call the display method on them
    fetchDesserts(originalUri, dessertsUCouldLoveSparql)
        .then(response => response.json())
        .then(response =>Promise.all([
            Promise.all(response.results.bindings
                .map(result => result.R.value)
                .map(uri => getMinInfos(uri))),
            response.results.bindings.map(result=>result.nbSubject.value)
        ])).then(infos => {
            displayFn(infos[0],"dessert",infos[1])
        });
    
    //fetch desserts with the same ingredients and call the display method on them
    fetchDesserts(originalUri, dessertsWithSameIngredientSparql)
        .then(response => response.json())
        .then(response =>Promise.all([
            Promise.all(response.results.bindings
                .map(result => result.R.value)
                .map(uri => getMinInfos(uri))),
            [response.results.bindings.map(result=>result.C.value),
                response.results.bindings.map(result=>result.sample.value)]
            
        ])).then(infos => {
            displayFn(infos[0],"ingredient",infos[1])
        });

    //fetch desserts with the same country and call the display method on them
    fetchDesserts(originalUri,dessertsWithSameCountrySparql)
        .then(response => response.json())
        .then(response =>Promise.all([
            Promise.all(response.results.bindings
                .map(result => result.R.value)
                .map(uri => getMinInfos(uri))),
            response.results.bindings.map(result=>result.C.value)
        ])).then(infos => {
            displayFn(infos[0],"country",infos[1])
        });
}

async function fetchDesserts(originalUri, sparqlRequest){
    var url = "http://dbpedia.org/sparql";
    sparqlRequest = encodeURIComponent(sparqlRequest.replace(/{{originalUri}}/g,originalUri));
    var queryUrl = `${url}?query=${sparqlRequest}&format=application/json`;
    var myInit = { 
        method: 'GET',
        mode: 'cors',
        cache: 'default',
        };

    return fetch(queryUrl,myInit);
                 
}