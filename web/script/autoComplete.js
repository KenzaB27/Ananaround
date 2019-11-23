async function autoCompleteData() {
    var url = "http://dbpedia.org/sparql";
    var query = `SELECT DISTINCT ?des ?countries ?ingredients WHERE{
{?des dbo:type dbr:Dessert}
UNION
{?des dc:type "Dessert"}
UNION
{?dessert dbo:country ?countries.
?dessert dbo:type dbr:Dessert.}
UNION
{?dessert dbo:ingredient ?ingredients.
{?dessert dbo:type dbr:Dessert}
UNION
{?dessert dc:type "Dessert"}}
}`;
    var queryUrl = url + "?query=" + encodeURIComponent(query) + "&format=json";

    var jsonResponse = await fetch(queryUrl).then(response => {return response.json()});

    var fullTab = [];

    elements = jsonResponse.results.bindings;
    if(Array.isArray(elements)) {
        elements.forEach(element => {
            if(element.des) {
                fullTab.push([element.des.value.substring(28), "dessert"]);
            } else if (element.countries) {
                fullTab.push([element.countries.value.substring(28), "country"]);
            } else if (element.ingredients) {
                fullTab.push([element.ingredients.value.substring(28), "ingredient"]);
            }
        });
    }
    sessionStorage.setItem("URIList",JSON.stringify(fullTab));

    var resultTab = [];
    fullTab.forEach(element => {
        resultTab.push(element[0].replace(/_/g," "));
    })

    return resultTab;
}
// Running autocomplete for the search bar
// Maybe non longer check for the page loading but for the check box
$(document).ready(function() {
    autoCompleteData().then(result => {
        $("#search-bar").autocomplete({
            source: result
        });
    })
});

// Loader 
$(window).on('load', function() {
    // PAGE IS FULLY LOADED  
    // FADE OUT YOUR OVERLAYING DIV
    // $("#overlay").fadeOut();
 });